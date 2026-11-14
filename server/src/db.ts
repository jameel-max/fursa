import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { AsyncLocalStorage } from 'node:async_hooks';
import { config } from './config';

const require = createRequire(import.meta.url);
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const usePostgres = Boolean(config.databaseUrl);

// ---------------------------------------------------------------------------
// SQLite backend (development / fallback)
// ---------------------------------------------------------------------------
let sqliteDb: any = null;
let sqliteLoaded = false;

function getSqlite() {
  if (!sqliteLoaded) {
    const { DatabaseSync } = require('node:sqlite') as any;
    const dir = path.dirname(config.databasePath);
    if (dir) fs.mkdirSync(dir, { recursive: true });
    sqliteDb = new DatabaseSync(config.databasePath);
    sqliteDb.exec('PRAGMA foreign_keys = ON');
    sqliteDb.exec('PRAGMA journal_mode = WAL');
    sqliteDb.exec('PRAGMA busy_timeout = 5000');
    sqliteLoaded = true;
  }
  return sqliteDb;
}

// ---------------------------------------------------------------------------
// Postgres backend (Neon / Render)
// ---------------------------------------------------------------------------
let pgPool: any = null;
const txStore = new AsyncLocalStorage<any>();

function getPool() {
  if (!pgPool) {
    const { Pool } = require('pg') as any;
    let connectionString = config.databaseUrl;
    try {
      const url = new URL(connectionString);
      url.searchParams.delete('channel_binding');
      connectionString = url.toString();
    } catch {
      // keep original string
    }
    pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pgPool;
}

/** Convert `?` placeholders to `$1..$n`, skipping single-quoted literals. */
function toPgPlaceholders(sql: string): string {
  let out = '';
  let index = 0;
  let paramIndex = 0;
  let inString = false;
  while (index < sql.length) {
    const ch = sql[index];
    if (inString) {
      out += ch;
      if (ch === "'") {
        if (sql[index + 1] === "'") {
          out += sql[index + 1];
          index += 2;
          continue;
        }
        inString = false;
      }
      index += 1;
      continue;
    }
    if (ch === "'") {
      inString = true;
      out += ch;
      index += 1;
      continue;
    }
    if (ch === '?') {
      paramIndex += 1;
      out += `$${paramIndex}`;
      index += 1;
      continue;
    }
    out += ch;
    index += 1;
  }
  return out;
}

function sanitizeParams(params: unknown[]): unknown[] {
  return params.map((param) => (param === undefined ? null : param));
}

async function pgQuery<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = txStore.getStore() ?? getPool();
  const result = await client.query(toPgPlaceholders(sql), sanitizeParams(params));
  return result.rows as T[];
}

async function pgExecute(sql: string, params: unknown[] = []): Promise<{ rows: any[]; rowCount: number }> {
  const client = txStore.getStore() ?? getPool();
  let text = toPgPlaceholders(sql);
  const isInsert = /^\s*insert\b/i.test(text) && !/\breturning\b/i.test(text);
  if (isInsert) {
    text = text.replace(/;?\s*$/, '') + ' RETURNING id';
  }
  const result = await client.query(text, sanitizeParams(params));
  return { rows: result.rows ?? [], rowCount: result.rowCount ?? 0 };
}

// ---------------------------------------------------------------------------
// Public API — async for both backends
// ---------------------------------------------------------------------------

export type QueryResult = { changes: number; lastInsertRowid: number };

export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (usePostgres) return pgQuery<T>(sql, params);
  const db = getSqlite();
  const stmt = db.prepare(sql);
  return stmt.all(...(params as any[])) as T[];
}

export async function queryOne<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export async function execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
  if (usePostgres) {
    const result = await pgExecute(sql, params);
    return {
      changes: result.rowCount,
      lastInsertRowid: Number(result.rows?.[0]?.id ?? 0),
    };
  }
  const db = getSqlite();
  const stmt = db.prepare(sql);
  const info = stmt.run(...(params as any[]));
  return { changes: Number(info.changes), lastInsertRowid: Number(info.lastInsertRowid) };
}

export async function insertAndGetId(sql: string, params: unknown[] = []): Promise<number> {
  const result = await execute(sql, params);
  return result.lastInsertRowid;
}

export async function execSql(sql: string): Promise<void> {
  if (usePostgres) {
    const client = txStore.getStore() ?? getPool();
    await client.query(sql);
    return;
  }
  const db = getSqlite();
  db.exec(sql);
}

export async function withTransaction<T>(fn: () => T | Promise<T>): Promise<T> {
  if (usePostgres) {
    const client = await getPool().connect();
    try {
      return await txStore.run(client, async () => {
        await client.query('BEGIN');
        try {
          const result = await fn();
          await client.query('COMMIT');
          return result;
        } catch (error) {
          try {
            await client.query('ROLLBACK');
          } catch {
            // ignore rollback errors
          }
          throw error;
        }
      });
    } finally {
      client.release();
    }
  }
  const db = getSqlite();
  db.exec('BEGIN');
  try {
    const result = await fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore
    }
    throw error;
  }
}

export function loadSchemaSql(): string {
  const fileName = usePostgres ? 'schema.pg.sql' : 'schema.sql';
  const candidates = [`server/src/${fileName}`, path.join(moduleDir, fileName)];
  for (const candidate of candidates) {
    const p = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  throw new Error('SCHEMA_NOT_FOUND');
}

export function getDb() {
  return {
    prepare: (sql: string) => ({
      run: (...params: unknown[]) => execute(sql, params),
      all: (...params: unknown[]) => query(sql, params),
      get: (...params: unknown[]) => queryOne(sql, params),
    }),
    exec: (sql: string) => execSql(sql),
  };
}

export function closeDb(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null as any;
    sqliteLoaded = false;
  }
}

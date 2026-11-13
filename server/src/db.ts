import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { config } from './config';

const require = createRequire(import.meta.url);
const moduleDir = path.dirname(fileURLToPath(import.meta.url));

// SQLite-only (Neon DATABASE_URL ignored for data storage; config still accepts it)
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

export type QueryResult = { changes: number; lastInsertRowid: number | bigint };

export function query<T = any>(sql: string, params: unknown[] = []): T[] {
  const db = getSqlite();
  const stmt = db.prepare(sql);
  return stmt.all(...(params as any[])) as T[];
}

export function queryOne<T = any>(sql: string, params: unknown[] = []): T | undefined {
  const rows = query<T>(sql, params);
  return rows[0];
}

export function execute(sql: string, params: unknown[] = []): QueryResult {
  const db = getSqlite();
  const stmt = db.prepare(sql);
  const info = stmt.run(...(params as any[]));
  return { changes: Number(info.changes), lastInsertRowid: Number(info.lastInsertRowid) };
}

export function insertAndGetId(sql: string, params: unknown[] = []): number {
  const db = getSqlite();
  const stmt = db.prepare(sql);
  const info = stmt.run(...(params as any[]));
  return Number(info.lastInsertRowid);
}

export function execSql(sql: string): void {
  const db = getSqlite();
  db.exec(sql);
}

export function withTransaction<T>(fn: () => T): T {
  const db = getSqlite();
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* ignore */ }
    throw error;
  }
}

export function loadSchemaSql(): string {
  const candidates = ['server/src/schema.sql', path.join(moduleDir, 'schema.sql')];
  for (const candidate of candidates) {
    const p = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  throw new Error('SCHEMA_NOT_FOUND');
}

export function getDb(): any {
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
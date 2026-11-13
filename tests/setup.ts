import fs from 'node:fs';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.resolve(process.cwd(), 'data', 'test.db');
process.env.SEED_DEMO = 'true';
process.env.JWT_SECRET = 'test-secret-change-me';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CLIENT_URL = 'http://localhost:5173';

export async function resetDatabase() {
  const { closeDb } = await import('../server/src/db.js');
  closeDb();
  const dbPath = process.env.DATABASE_PATH as string;
  for (const suffix of ['', '-wal', '-shm']) {
    const file = dbPath + suffix;
    try {
      fs.rmSync(file, { force: true });
    } catch {
      // ignore
    }
  }
  const { seed } = await import('../server/src/seed.js');
  await seed();
}
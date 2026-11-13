import { config } from './config';
import { getDb } from './db';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app';
import { seed } from './seed';

export async function main() {
  getDb();

  const uploadsDir = path.resolve(process.cwd(), config.uploadDir);

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await seed();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`[server] FURSA API listening on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error('[startup] failed to start', error);
  process.exit(1);
});

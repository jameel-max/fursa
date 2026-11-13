import { config } from './config';
import { getDb, loadSchemaSql } from './db';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createApp } from './app';
import { seed } from './seed';

export async function main() {
  getDb();

  const clientDist = path.resolve(process.cwd(), 'client/dist');
  const uploadsDir = path.resolve(process.cwd(), config.uploadDir);

  if (!fs.existsSync(clientDist)) {
    console.warn('[startup] client/dist not found. Run "npm run build:client" for production static serving.');
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  seed();

  const app = createApp();

  app.use('/api/uploads', (req, res) => {
    const file = path.join(config.uploadDir, req.path);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return res.sendFile(file);
    }
    return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File not found' } });
  });

  app.use(express.static(clientDist));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  app.listen(config.port, () => {
    console.log(`[server] FURSA API listening on port ${config.port}`);
  });
}

main().catch((error) => {
  console.error('[startup] failed to start', error);
  process.exit(1);
});

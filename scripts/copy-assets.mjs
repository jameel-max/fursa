import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve(process.cwd(), 'server/src/schema.sql');
const targetDir = path.resolve(process.cwd(), 'server/dist');
const target = path.join(targetDir, 'schema.sql');

if (!fs.existsSync(source)) {
  console.error('[copy-assets] server/src/schema.sql not found');
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log('[copy-assets] schema.sql copied to server/dist');

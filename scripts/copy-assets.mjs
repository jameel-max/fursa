import fs from 'node:fs';
import path from 'node:path';

const targetDir = path.resolve(process.cwd(), 'server/dist');
fs.mkdirSync(targetDir, { recursive: true });

for (const file of ['schema.sql', 'schema.pg.sql']) {
  const source = path.resolve(process.cwd(), 'server/src', file);
  if (!fs.existsSync(source)) {
    console.error(`[copy-assets] server/src/${file} not found`);
    process.exit(1);
  }
  fs.copyFileSync(source, path.join(targetDir, file));
  console.log(`[copy-assets] ${file} copied to server/dist`);
}

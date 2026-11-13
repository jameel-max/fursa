const fs = require('fs');
const c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');
const lines = c.split(/\r?\n/);
lines.forEach((l, i) => {
  if (l.includes('category:')) {
    console.log(i + 1, l.trim());
  }
});
const fs=require('fs');
const c=fs.readFileSync('server/src/seed.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(lines[110]); console.log(lines[111]); console.log(lines[112]); console.log(lines[113]);
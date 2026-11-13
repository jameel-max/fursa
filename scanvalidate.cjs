const fs=require('fs');
const c=fs.readFileSync('server/src/lib/validate.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(lines[3]);
const fs=require('fs');
const c=fs.readFileSync('server/src/lib/auth.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(26,JSON.stringify(lines[25]));
const fs=require('fs');
const c=fs.readFileSync('server/src/lib/auth.ts','utf8');
const lines=c.split(/\r?\n/);
[1,15,21,26,34,54,67,74].forEach(n=>console.log(n, lines[n-1]));
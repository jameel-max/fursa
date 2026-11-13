const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.controller.ts','utf8');
const lines=c.split(/\r?\n/);
[20,25,45,48,68,71,73].forEach(n=>console.log(n,lines[n-1]));
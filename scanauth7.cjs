const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.service.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(lines[105]); console.log(lines[106]);
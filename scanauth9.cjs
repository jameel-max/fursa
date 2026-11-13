const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.service.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(31,lines[30]); console.log(51,lines[50]);
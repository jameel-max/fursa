const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.controller.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=12;i<28;i++) console.log(i+1,lines[i]);
const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.controller.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=60;i<78;i++) console.log(i+1,lines[i]);
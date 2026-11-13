const fs=require('fs');
const c=fs.readFileSync('server/src/seed.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=7;i<13;i++) console.log(i+1,lines[i]);
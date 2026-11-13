const fs=require('fs');
const c=fs.readFileSync('server/src/index.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=0;i<12;i++) console.log(i+1,lines[i]);
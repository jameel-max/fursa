const fs=require('fs');
const c=fs.readFileSync('server/src/demo-seed.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=195;i<220;i++) console.log(i+1, lines[i]);
const fs=require('fs');
const c=fs.readFileSync('server/src/app.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=18;i<26;i++) console.log(i+1, lines[i]);
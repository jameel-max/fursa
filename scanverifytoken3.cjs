const fs=require('fs');
const c=fs.readFileSync('server/src/lib/auth.ts','utf8');
const lines=c.split(/\r?\n/);
for(let i=25;i<33;i++) console.log(i+1,JSON.stringify(lines[i]));
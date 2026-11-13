const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.service.ts','utf8');
const lines=c.split(/\r?\n/);
lines.forEach((l,i)=>{ if(/^(export\s+)?(async\s+)?function\s+\w+/.test(l.trim())) console.log(i+1,l.trim()); });
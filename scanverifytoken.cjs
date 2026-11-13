const fs=require('fs');
const c=fs.readFileSync('server/src/lib/auth.ts','utf8');
const lines=c.split(/\r?\n/);
lines.forEach((l,i)=>{ if(/verifyToken/.test(l)) console.log(i+1,JSON.stringify(l)); });
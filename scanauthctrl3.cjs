const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.controller.ts','utf8');
const lines=c.split(/\r?\n/);
lines.forEach((l,i)=>{ if(/verifyToken|import/.test(l)) console.log(i+1,l.trim()); });
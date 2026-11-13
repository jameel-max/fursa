const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.service.ts','utf8');
const lines=c.split(/\r?\n/);
lines.forEach((l,i)=>{ if(/function\s+register/.test(l)) console.log(i+1,JSON.stringify(l)); });
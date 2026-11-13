const fs=require('fs');
const c=fs.readFileSync('server/src/modules/listings/listings.schemas.ts','utf8');
const lines=c.split(/\r?\n/);
lines.forEach((l,i)=>{ if(/async/.test(l)) console.log(i+1,l.trim()); });
const fs=require('fs');
const c=fs.readFileSync('server/src/demo-seed.ts','utf8');
const m=c.match(/export (async )?function seedDemoData/);
console.log(m?m[0]:'not found');
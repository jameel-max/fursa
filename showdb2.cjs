const fs=require('fs');
const c=fs.readFileSync('server/src/db.ts','utf8');
console.log(c.slice(1200,2600));
const fs=require('fs');
const c=fs.readFileSync('server/src/lib/password.ts','utf8');
console.log(c);
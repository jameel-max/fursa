const fs=require('fs');
const c=fs.readFileSync('server/src/app.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(JSON.stringify(lines[21]));
console.log('length', lines[21].length);
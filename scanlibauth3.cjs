const fs=require('fs');
const c=fs.readFileSync('server/src/lib/auth.ts','utf8');
const lines=c.split(/\r?\n/);
console.log(72,JSON.stringify(lines[71])); console.log(73,JSON.stringify(lines[72])); console.log(74,JSON.stringify(lines[73]));
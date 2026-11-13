const fs = require('fs');
let c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');
c = c.replace(/await /g, '');
c = c.replace(/async function /g, 'function ');
fs.writeFileSync('server/src/demo-seed.ts', c);
console.log('done');
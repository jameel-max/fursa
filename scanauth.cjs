const fs=require('fs');
const c=fs.readFileSync('server/src/modules/auth/auth.service.ts','utf8');
const lines=c.split(/\r?\n/);
[50,54,63,67,73,75,84,88,92,100,103,107,109,136,166,174,219,231,235].forEach(n=>console.log(n, lines[n-1]));
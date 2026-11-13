const fs=require('fs');
const c=fs.readFileSync('server/src/lib/asyncHandler.ts','utf8');
console.log(c);
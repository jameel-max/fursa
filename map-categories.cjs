const fs = require('fs');
let c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');
const lines = c.split(/\r?\n/);

// The categories that need mapping (from the actual Arabic in the file):
// Line 98: 'المنتجات الزراعية أخرى' -> map to 'الخضروات'
// Line 140: 'خدمات النقل' -> map to 'الخضروات'  
// Line 182: 'العنب' -> map to 'فواكه'

// Replace 'المنتجات الزراعية أخرى' with 'الخضروات'
c = c.replace(/category: 'المنتجات الزراعية أخرى'/g, "category: 'الخضروات'");
console.log('Replaced المنتجات الزراعية أخرى -> الخضروات');

// Replace 'خدمات النقل' with 'الخضروات'
c = c.replace(/category: 'خدمات النقل'/g, "category: 'الخضروات'");
console.log('Replaced خدمات النقل -> الخضروات');

// Replace 'العنب' with 'فواكه'
c = c.replace(/category: 'العنب'/g, "category: 'فواكه'");
console.log('Replaced عنب -> فواكه');

fs.writeFileSync('server/src/demo-seed.ts', c);
console.log('Done mapping categories');
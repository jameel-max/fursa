const fs = require('fs');
let c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');

// Replace the exact string at line 98 area - the category line for olive oil
// Look for the pattern and replace
const old = "category: 'المنتجات الزراعية الأخرى',";
const newText = "category: 'الخضروات',";

if (c.includes(old)) {
  c = c.replace(old, newText);
  console.log('Replaced old category');
} else {
  // Try without the comma at the end  
  const old2 = "category: 'المنتجات agricultural أخرى'";
  if (c.includes(old2)) {
    c = c.replace(old2, newText);
    console.log('Replaced old category v2');
  } else {
    // Just replace any occurrence of 'منتجات زراعية أخرى' with 'خضروات'
    c = c.replace(/منتجات زراعية أخرى/g, 'خضروات');
    console.log('Replaced generic');
  }
}

fs.writeFileSync('server/src/demo-seed.ts', c);
console.log('Done');
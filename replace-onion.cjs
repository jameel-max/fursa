const fs = require('fs');
let c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');
// Replace the onion reference in the Arabic message
c = c.replace(/شفت Offer البصل红/.source, 'شفت عرض الخضروات'); // this won't work

// Let's just do simple string replacement
const old = "شفت Offer البصل الأحمر. هل الكمية متوفرة للشهر القادم؟";
const newText = "شفت Offer الخضروات. هل الكمية متوفرة للشهر القادم؟";

// Actually let's just replace the specific line
const lines = c.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('البصل الأحمر') && lines[i].includes('الشهر القادم')) {
    lines[i] = lines[i].replace('البصل الأحمر', 'الخضروات');
    console.log('Replaced line', i+1);
  }
}
fs.writeFileSync('server/src/demo-seed.ts', lines.join('\n'));
console.log('Done');
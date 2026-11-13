const fs = require('fs');
let content = fs.readFileSync('server/src/demo-seed.ts', 'utf8');

// Find and replace the Arabic text containing "البصل" in the message
// The line is: 'مرحباً أحمد، شفت Offer البصل الأحمر. هل الكمية متوفرة للشهر القادم؟',
const oldText = "شفت Offer البصل الأحمر. هل الكمية متوفرة للشهر القادم؟";
const newText = "شفت Offer الخضروات. هل الكمية متوفرة للشهر القادم؟";

if (content.includes(oldText)) {
  content = content.replace(oldText, newText);
  console.log('Replaced onion reference');
} else {
  console.log('Old text not found, trying alternative...');
  // Try without "Offer"
  const oldText2 = "شفت البصل الأحمر";
  const newText2 = "شفت الخضروات";
  if (content.includes(oldText2)) {
    content = content.replace(oldText2, newText2);
    console.log('Replaced with alt version');
  } else {
    console.log('Neither version found');
  }
}

fs.writeFileSync('server/src/demo-seed.ts', content);
console.log('Done');
const fs = require('fs');
let c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');
const lines = c.split(/\r?\n/);

// We need to map these categories to the 6 required ones
// Current mappings from check-cat.js output:
// Line 84: 'الخضروات' - already good
// Line 98: 'المنتجات الزراعية الأخرى' - needs mapping
// Line 112: 'الخضروات' - already good  
// Line 126: 'الخضروات' - already good
// Line 140: 'خدمات النقل' - needs mapping
// Line 154: 'الحمضيات' - already good
// Line 168: 'الفواكه' - already good
// Line 182: 'العنب' - needs mapping

// Let's map line by line using string replacement on the content
// The lines with category that need mapping:

// Line 98 area - 'المنتجات agricoles الأخرى' 
// Let's find and replace the specific category strings in the listing objects

// First, let's replace 'المنتجات الزراعية أخرى' with 'الخضروات' (or another of the 6)
c = c.replace(/"المنتجات الزراعية الأخرى"/g, '"الخضروات"');

// Now replace 'Services transportation' - line 140
// The Arabic text is 'خدمات النقل'
c = c.replace(/"Services النقل"/g, '"الخضروات"'); // This won't work with Arabic

// Let's do it properly - find the Arabic text
// Looking at the output, line 140 has 'خدمات النقل'
const arabicText = 'خدمات النقل';
const replacement = 'الخضروات';

// Find and replace the Arabic category in the content
// The pattern will be: category: 'خدمات النقل',
const regex = /category: 'Services النقل'/g;
// Actually the Arabic is already in the file, let me just replace the specific line

// Let's just replace using the known line context
// The line is: title: 'مطلوب 5 طن خضروات من إربد إلى العقبة',
// Actually no, line 138-140 is:
//     description: 'نحتاج شاحنة مبردة لنقل 5 طن خضروات من إربد إلى العقبة، التحميل صباحاً والتسليم في نفس اليوم.',
//     category: 'خدمات النقل',

// Let me just do a simple replacement of the category value
// I'll search for the exact string and replace
const exactOld = "category: 'خدمات النقل',";
const exactNew = "category: 'الخضروات',";

if (c.includes(exactOld)) {
  c = c.replace(exactOld, exactNew);
  console.log('ReplacedServices النقل with الخضروات');
} else {
  // Try without the comma
  const exactOld2 = "category: 'خدمات النقل'";
  if (c.includes(exactOld2)) {
    c = c.replace(exactOld2, exactNew);
    console.log('ReplacedServices النقل (no comma)');
  }
}

// Now replace 'العنب' (grape) - line 182
// The category 'عنب' should map to one of the 6. Grapes could be under 'فواكه' (fruits)
const exactOld3 = "category: 'العنب',";
const exactNew3 = "category: 'الفواكه',";

if (c.includes(exactOld3)) {
  c = c.replace(exactOld3, exactNew3);
  console.log('Replaced عنب with فواكه');
} else {
  const exactOld4 = "category: 'العنب'";
  if (c.includes(exactOld4)) {
    c = c.replace(exactOld4, exactNew3);
    console.log('Replaced عنب (no comma) with فواكه');
  }
}

fs.writeFileSync('server/src/demo-seed.ts', c);
console.log('Done mapping categories');
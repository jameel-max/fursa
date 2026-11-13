// Simple check without ES module issues
const fs = require('fs');

// Read seed.ts and extract categorySeeds
const seed = fs.readFileSync('server/src/seed.ts', 'utf8');
const match = seed.match(/const categorySeeds = \[([\s\S]*?)\];/);
if (match) {
  console.log('Current categorySeeds from seed.ts:');
  // Parse the array items
  const items = match[1].split(',').map(s => s.replace(/^['"]|['"]$/g, '').trim());
  console.log(items);
}

// Read demo-seed and extract unique categories from DEMO_LISTINGS
const demo = fs.readFileSync('server/src/demo-seed.ts', 'utf8');
const catRegex = /category: '([^']+)'/g;
const catSet = new Set();
let m;
while ((m = catRegex.exec(demo)) !== null) {
  catSet.add(m[1]);
}
console.log('\nUnique categories in DEMO_LISTINGS:');
console.log([...catSet]);
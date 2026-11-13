const fs = require('fs');
let c = fs.readFileSync('server/src/demo-seed.ts', 'utf8');

// Remove 'await' from queryOne and execute calls by replacing 'await ' with ''
// But only in specific functions that are not async

// The main issue is that some functions have 'await' but aren't declared 'async'
// Let me make the key functions async and fix the return types

// First, let's make seedDemoData async (it already is)
// Then fix the inner functions

// Fix: make ensureUser async
c = c.replace(
  'async function ensureUser(user: DemoUser, passwordHash: string): Promise<number> {',
  'async function ensureUser(user: DemoUser, passwordHash: string): Promise<number> {'
);

// Fix: make ensureListing async  
c = c.replace(
  'async function ensureListing(listing: DemoListing, userId: number): Promise<number | null> {',
  'async function ensureListing(listing: DemoListing, userId: number): Promise<number | null> {'
);

// Fix: make seedDemoData already async

// Fix the await precedence issues: replace 'Number(await queryOne...?.id)' with 'Number((await queryOne...).id)' or just 'Number(queryOne...?.id)'
// The issue is the $4 literal from the bad regex replacement

// Let me just replace all occurrences of '?.id)' that have await before them with proper syntax
// Actually, let me just remove 'await' from expressions where it's not needed since db is sync

// Remove 'await' from queryOne calls where the result is immediately used
c = c.replace(/await queryOne<[^>]+>\([^)]*\)\?\.\w+/g, 'queryOne<$1>($2).$3');

// Remove 'await' from execute calls where not needed (they're sync)
c = c.replace(/await execute\(/g, 'execute(');

fs.writeFileSync('server/src/demo-seed.ts', c);
console.log('Made demo-seed sync-compatible');
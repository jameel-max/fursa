const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const f of walk('server/src')) {
  let c = fs.readFileSync(f,'utf8');
  // Fix await precedence for optional chaining: await queryOne<...>(...)?.prop -> (await queryOne<...>(...))?.prop
  c = c.replace(/await\s+(queryOne|query)\s*<([^>]+)>\(([^)]*)\)\?\.(\w+)/g, '(await $1<$2>($3))?.${4}');
  // Also await queryOne(...)?.prop (no generic)
  c = c.replace(/await\s+(queryOne|query)\s*\(([^)]*)\)\?\.(\w+)/g, '(await $1($2))?.${3}');
  fs.writeFileSync(f, c);
}
console.log('done');
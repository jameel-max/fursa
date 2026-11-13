const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const file of walk('server/src')) {
  let c = fs.readFileSync(file,'utf8');
  // Add async to function declarations that are not already async
  c = c.replace(/(^|[\s;{])function\s+(\w+)/g, (m, pre, name) => `${pre}async function ${name}`);
  c = c.replace(/export\s+function\s+(\w+)/g, 'export async function $1');
  // Also method-like? not needed.
  fs.writeFileSync(file, c);
}
console.log('done');
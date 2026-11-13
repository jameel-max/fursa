const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const file of walk('server/src')) {
  let c = fs.readFileSync(file,'utf8');
  c = c.replace(/\basync\s+function\b/g, 'function');
  c = c.replace(/export\s+async\s+function\b/g, 'export function');
  // async arrow in withTransaction already reverted
  fs.writeFileSync(file, c);
}
console.log('done');
const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const file of walk('server/src')) {
  let c = fs.readFileSync(file,'utf8');
  // await generic query/queryOne if not already awaited
  c = c.replace(/(?<!await\s)\b(query|queryOne)\s*</g, 'await $1<');
  fs.writeFileSync(file, c);
}
console.log('done');
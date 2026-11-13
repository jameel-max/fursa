const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const file of walk('server/src')) {
  let c = fs.readFileSync(file,'utf8');
  c = c.replace(/await\s+(query|queryOne|execute|insertAndGetId|execSql|withTransaction)\s*</g, '$1<');
  c = c.replace(/await\s+(query|queryOne|execute|insertAndGetId|execSql|withTransaction)\s*\(/g, '$1(');
  c = c.replace(/withTransaction\(\s*async\s*\(\s*\)\s*=>/g, 'withTransaction(() =>');
  fs.writeFileSync(file, c);
}
console.log('done');
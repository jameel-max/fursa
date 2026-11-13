const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const f of walk('server/src')) {
  let c = fs.readFileSync(f,'utf8');
  c = c.replace(/:\s*Promise<([^>]+)>/g, ': $1');
  fs.writeFileSync(f, c);
}
console.log('done');
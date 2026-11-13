const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}
for (const f of walk('server/src')) {
  let c = fs.readFileSync(f,'utf8');
  // wrap return type of async functions in Promise<...>
  c = c.replace(/(export\s+)?async\s+function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([A-Za-z0-9_<>,\s\[\]|]+?)\s*\{/g,
    (m, exp, name, params, ret) => {
      if (ret.startsWith('Promise<')) return m;
      return `${exp||''}async function ${name}(${params}): Promise<${ret.trim()}> {`;
    });
  fs.writeFileSync(f, c);
}
console.log('done');
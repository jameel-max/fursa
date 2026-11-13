const fs=require('fs');
function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=d+'/'+f;const s=fs.statSync(p);if(s.isDirectory())r=r.concat(walk(p));else if(f.endsWith('.ts'))r.push(p);}return r;}

for (const file of walk('server/src')) {
  let c = fs.readFileSync(file,'utf8');

  // withTransaction callbacks -> async
  c = c.replace(/withTransaction\(\s*\(\s*\)\s*=>/g, 'withTransaction(async () =>');

  // await query/queryOne/execute/insertAndGetId/execSql when not already awaited
  c = c.replace(/(?<!await\s)(?<!return\s)\b(query|queryOne|execute|insertAndGetId|execSql)\s*\(/g, 'await $1(');

  // db.prepare('...').run(...) -> await execute('...', [...])
  c = c.replace(/(\w+)\.prepare\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\s*\)\.run\(([\s\S]*?)\);/g,
    (m, _obj, sql, params) => `await execute(${sql}, [${params.trim()}]);`);

  // .all(
  c = c.replace(/(\w+)\.prepare\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\s*\)\.all\(([\s\S]*?)\);/g,
    (m, _obj, sql, params) => `await query(${sql}, [${params.trim()}]);`);

  // .get(
  c = c.replace(/(\w+)\.prepare\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\s*\)\.get\(([\s\S]*?)\);/g,
    (m, _obj, sql, params) => `await queryOne(${sql}, [${params.trim()}]);`);

  fs.writeFileSync(file, c);
}
console.log('done');
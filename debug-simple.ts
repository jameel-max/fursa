import { query } from './server/src/db.js';
console.log('running select 1');
const r = query('SELECT 1 AS x');
console.log('result', r);
console.log('done');
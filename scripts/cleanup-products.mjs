import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const u = new URL(url);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: u.username,
  password: u.password,
  database: u.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

const [result] = await conn.execute(
  'DELETE FROM dy_products WHERE tenantId = 90004 AND id IN (1,2,3,4,5,6,7,30018)'
);

console.log(`✅ 刪除完成，影響筆數：${result.affectedRows}`);

await conn.end();

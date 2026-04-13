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

console.log('\n=== 1. SELECT * FROM dy_inventory WHERE tenantId=90004 ===');
try {
  const [rows] = await conn.execute(
    'SELECT * FROM dy_inventory WHERE tenantId = 90004'
  );
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

console.log('\n=== 2. SELECT id, productName FROM dy_products WHERE tenantId=90004 ===');
try {
  const [rows] = await conn.execute(
    'SELECT id, productName FROM dy_products WHERE tenantId = 90004 ORDER BY id'
  );
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

await conn.end();

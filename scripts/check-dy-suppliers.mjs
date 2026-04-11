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

console.log('\n=== SHOW COLUMNS FROM dy_suppliers ===');
try {
  const [rows] = await conn.execute('SHOW COLUMNS FROM dy_suppliers');
  console.table(rows);
} catch (e) {
  console.error('Error:', e.message);
}

await conn.end();

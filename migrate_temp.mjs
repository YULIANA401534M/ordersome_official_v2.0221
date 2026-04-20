import mysql from 'mysql2/promise';
const dbUrl = (process.env.DATABASE_URL || '').replace(/\?.*$/, '').replace(/^mysql:\/\//, '');
const url = new URL('http://' + dbUrl);
const pool = await mysql.createPool({
  host: url.hostname, port: Number(url.port)||4000,
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''), ssl: { rejectUnauthorized: true },
});
const [rows] = await pool.execute("SHOW COLUMNS FROM os_procurement_orders");
console.log(rows.map(r => r.Field).join(', '));
await pool.end();

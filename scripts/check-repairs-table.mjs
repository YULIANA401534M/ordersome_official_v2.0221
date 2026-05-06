import 'dotenv/config';
import { createPool } from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
const pool = createPool({
  host: url.hostname, port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: true },
  supportBigNumbers: true, bigNumberStrings: false,
});

const [tables] = await pool.execute("SHOW TABLES LIKE 'equipment_repairs'");
const exists = tables.length > 0;
console.log('TABLE EXISTS:', exists ? '是' : '否，table 不存在！');

if (exists) {
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM equipment_repairs');
  console.log('資料筆數:', rows[0].cnt);
  const [cols] = await pool.execute('DESCRIBE equipment_repairs');
  console.log('欄位:', cols.map(c => c.Field).join(', '));
}

await pool.end();

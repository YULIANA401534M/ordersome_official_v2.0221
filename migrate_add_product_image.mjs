import mysql from 'mysql2/promise';
const dbUrl = (process.env.DATABASE_URL || '').replace(/\?.*$/, '').replace(/^mysql:\/\//, '');
const url = new URL('http://' + dbUrl);
const pool = await mysql.createPool({
  host: url.hostname, port: Number(url.port)||4000,
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''), ssl: { rejectUnauthorized: true },
});

// 確認 dy_products 現有欄位
const [cols] = await pool.execute("SHOW COLUMNS FROM dy_products");
const fieldNames = cols.map(r => r.Field);
console.log('現有欄位:', fieldNames.join(', '));

if (!fieldNames.includes('imageUrl')) {
  await pool.execute("ALTER TABLE dy_products ADD COLUMN imageUrl VARCHAR(500) NULL AFTER defaultPrice");
  console.log('✅ 已新增 imageUrl 欄位');
} else {
  console.log('ℹ️  imageUrl 欄位已存在，跳過');
}

await pool.end();

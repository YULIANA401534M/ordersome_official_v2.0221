import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: url.port, user: url.username,
  password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

const columns = [
  ["shippingMethod", "ENUM('home_delivery','cvs_fami','cvs_unimart','cvs_hilife') DEFAULT 'home_delivery'"],
  ["cvsStoreId", "VARCHAR(20)"],
  ["cvsStoreName", "VARCHAR(100)"],
  ["cvsStoreAddress", "VARCHAR(200)"],
  ["logisticsId", "VARCHAR(50)"],
  ["logisticsStatus", "VARCHAR(50)"],
  ["logisticsStatusMsg", "VARCHAR(200)"],
];

for (const [name, type] of columns) {
  const [existing] = await conn.execute(
    `SHOW COLUMNS FROM orders WHERE Field = '${name}'`
  );
  if ((existing).length === 0) {
    await conn.execute(`ALTER TABLE orders ADD COLUMN ${name} ${type}`);
    console.log(`✅ 新增欄位: ${name}`);
  } else {
    console.log(`⏭️ 已存在: ${name}`);
  }
}
console.log('完成');
await conn.end();

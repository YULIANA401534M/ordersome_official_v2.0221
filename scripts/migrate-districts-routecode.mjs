import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: url.port, user: url.username,
  password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

const [existing] = await conn.execute(
  `SHOW COLUMNS FROM dy_districts WHERE Field = 'routeCode'`
);
if ((existing).length === 0) {
  await conn.execute(`ALTER TABLE dy_districts ADD COLUMN routeCode VARCHAR(20) DEFAULT NULL COMMENT '路線代號'`);
  console.log('✅ 新增欄位: dy_districts.routeCode');
} else {
  console.log('⏭️ 已存在: dy_districts.routeCode');
}
console.log('完成');
await conn.end();

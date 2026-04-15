import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: url.port, user: url.username,
  password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

const TENANT_ID = 90004;
const hash = await bcrypt.hash('test1234', 10);

// 找第一個 dy_customers 記錄
const [customers] = await conn.execute(
  'SELECT id, name FROM dy_customers WHERE tenantId=? LIMIT 1',
  [TENANT_ID]
);
const cust = customers[0];
if (!cust) {
  // 沒有客戶，先建一個
  await conn.execute(
    `INSERT INTO dy_customers (tenantId, name, phone, address, settlementCycle, status, loginEmail, passwordHash, isPortalActive, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,NOW())`,
    [TENANT_ID, '測試餐廳', '0912345678', '台中市西屯區測試路1號', 'monthly', 'active', 'test@dayone.com', hash, 1]
  );
  console.log('✅ 建立測試客戶: 測試餐廳 / test@dayone.com / test1234');
} else {
  // 更新現有客戶的 portal 資訊
  await conn.execute(
    `UPDATE dy_customers SET loginEmail='test@dayone.com', passwordHash=?, isPortalActive=1 WHERE id=?`,
    [hash, cust.id]
  );
  console.log(`✅ 更新客戶 ${cust.name} 的 Portal 帳號: test@dayone.com / test1234`);
}
await conn.end();

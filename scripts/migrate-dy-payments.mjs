/**
 * Migration: 建立 dy_payments 應收帳款收款記錄表
 * 執行方式：node scripts/migrate-dy-payments.mjs
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ 找不到 DATABASE_URL 環境變數");
  process.exit(1);
}

const u = new URL(url);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: u.username,
  password: u.password,
  database: u.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("✅ 連線成功，開始 migration...\n");

// 確認 dy_payments 是否已存在
const [tables] = await conn.execute(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'dy_payments'",
  [u.pathname.slice(1)]
);

if (tables.length > 0) {
  console.log("⏭  dy_payments 表已存在，跳過建立");
} else {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      customerId INT NOT NULL,
      orderId INT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paymentMethod ENUM('cash','transfer','offset') DEFAULT 'cash',
      note TEXT NULL,
      collectedBy VARCHAR(50) NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ dy_payments 表建立成功");
}

// 確認欄位
const [cols] = await conn.execute("SHOW COLUMNS FROM dy_payments");
const colNames = cols.map((c) => c.Field);
console.log("dy_payments 欄位:", colNames.join(", "));

await conn.end();
console.log("\n🎉 Migration 完成！");

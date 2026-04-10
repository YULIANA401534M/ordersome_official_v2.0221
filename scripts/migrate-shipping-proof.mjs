/**
 * 一次性 migration：替 orders 表新增 shippingProofUrl 欄位
 * 執行：node scripts/migrate-shipping-proof.mjs
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

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
  database: u.pathname.slice(1).split("?")[0],
  ssl: { rejectUnauthorized: false },
});

console.log("✅ 連線成功，開始 migration...\n");

const [cols] = await conn.execute("SHOW COLUMNS FROM orders");
const existingCols = cols.map((c) => c.Field);
console.log("目前 orders 欄位:", existingCols.join(", "));

if (!existingCols.includes("shippingProofUrl")) {
  await conn.execute("ALTER TABLE orders ADD COLUMN shippingProofUrl TEXT NULL");
  console.log("✅ shippingProofUrl 欄位新增成功");
} else {
  console.log("⏭  shippingProofUrl 已存在，跳過");
}

await conn.end();
console.log("\n🎉 Migration 完成！");

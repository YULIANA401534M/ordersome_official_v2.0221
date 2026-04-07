/**
 * 調查腳本：印出 dy_customer_prices 欄位結構
 * 只讀不寫，不修改任何資料
 * 執行方式：node scripts/migrate-liff-check.mjs
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

console.log("✅ 連線成功\n");

const [cols] = await conn.execute("SHOW COLUMNS FROM dy_customer_prices");
console.log("=== dy_customer_prices 欄位結構 ===");
for (const col of cols) {
  console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(20)} Null:${col.Null} Key:${col.Key} Default:${col.Default ?? "NULL"}`);
}

await conn.end();
console.log("\n✅ 查詢完成，未修改任何資料。");

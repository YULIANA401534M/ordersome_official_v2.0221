/**
 * 一次性 migration：替 posts 表新增 scheduledAt 和 category 欄位
 * 在 Railway shell 執行：node scripts/migrate-posts-columns.mjs
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

// 查看現有欄位
const [cols] = await conn.execute("SHOW COLUMNS FROM posts");
const existingCols = cols.map((c) => c.Field);
console.log("目前 posts 欄位:", existingCols.join(", "));

// 新增 scheduledAt
if (!existingCols.includes("scheduledAt")) {
  await conn.execute("ALTER TABLE posts ADD COLUMN scheduledAt timestamp NULL");
  console.log("✅ scheduledAt 欄位新增成功");
} else {
  console.log("⏭  scheduledAt 已存在，跳過");
}

// 新增 category
if (!existingCols.includes("category")) {
  await conn.execute("ALTER TABLE posts ADD COLUMN category varchar(50) NULL");
  console.log("✅ category 欄位新增成功");
} else {
  console.log("⏭  category 已存在，跳過");
}

await conn.end();
console.log("\n🎉 Migration 完成！文章應該已恢復正常。");

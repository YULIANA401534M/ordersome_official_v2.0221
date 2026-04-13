/**
 * seed-tenant-modules.mjs
 * 補齊 tenantId=2（大永蛋品）的 tenant_modules 記錄
 * 執行方式：node scripts/seed-tenant-modules.mjs
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL 環境變數未設定");
  process.exit(1);
}

const REQUIRED_MODULES_TENANT_2 = [
  "delivery",
  "crm_customers",
  "inventory",
  "purchasing",
  "accounting",
];

async function main() {
  const url = new URL(DATABASE_URL.replace(/^mysql:\/\//, "http://"));
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port) || 4000,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
  });

  console.log("=== 查詢 tenant_modules ===");
  const [allRows] = await conn.execute("SELECT * FROM tenant_modules ORDER BY tenantId, moduleKey");
  console.log("現有記錄：", allRows);

  console.log("\n=== 補齊 tenantId=2 的必要模組 ===");
  for (const moduleKey of REQUIRED_MODULES_TENANT_2) {
    const [existing] = await conn.execute(
      "SELECT id FROM tenant_modules WHERE tenantId=? AND moduleKey=?",
      [2, moduleKey]
    );
    if (existing.length === 0) {
      await conn.execute(
        `INSERT INTO tenant_modules (tenantId, moduleKey, isEnabled, createdAt, updatedAt)
         VALUES (?, ?, true, NOW(), NOW())`,
        [2, moduleKey]
      );
      console.log(`  ✅ 新增 tenantId=2, moduleKey=${moduleKey}`);
    } else {
      console.log(`  ⏭️  已存在 tenantId=2, moduleKey=${moduleKey}`);
    }
  }

  console.log("\n=== 補齊後的 tenant_modules ===");
  const [finalRows] = await conn.execute("SELECT * FROM tenant_modules ORDER BY tenantId, moduleKey");
  console.table(finalRows);

  await conn.end();
  console.log("\n完成！");
}

main().catch((err) => {
  console.error("執行失敗：", err);
  process.exit(1);
});

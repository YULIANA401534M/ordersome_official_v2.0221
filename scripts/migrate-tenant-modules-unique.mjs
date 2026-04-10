/**
 * migrate-tenant-modules-unique.mjs
 *
 * 修復 tenant_modules 表：
 * 1. 清除因 ON DUPLICATE KEY 失效而產生的重複 rows，保留最新
 * 2. 新增 UNIQUE KEY (tenantId, moduleKey)
 *
 * 執行方式：node scripts/migrate-tenant-modules-unique.mjs
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL 未設定");
  process.exit(1);
}

// 解析 DATABASE_URL
const parsed = new URL(url);
const conn = await createConnection({
  host: parsed.hostname,
  port: Number(parsed.port) || 4000,
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.replace("/", ""),
  ssl: { rejectUnauthorized: false },
});

console.log("✅ 連線成功");

// 1. 顯示目前重複的狀況
const [dupes] = await conn.execute(`
  SELECT tenantId, moduleKey, COUNT(*) as cnt
  FROM tenant_modules
  GROUP BY tenantId, moduleKey
  HAVING cnt > 1
`);
if (dupes.length > 0) {
  console.log("⚠️  發現重複 rows：", dupes);
} else {
  console.log("✅ 無重複 rows");
}

// 2. 刪除重複，保留每組最新的 id
await conn.execute(`
  DELETE t1 FROM tenant_modules t1
  INNER JOIN tenant_modules t2
  WHERE t1.tenantId = t2.tenantId
    AND t1.moduleKey = t2.moduleKey
    AND t1.id < t2.id
`);
console.log("✅ 重複 rows 清除完成");

// 3. 確認 unique key 是否已存在
const [indexes] = await conn.execute(`
  SHOW INDEX FROM tenant_modules WHERE Key_name = 'tenant_module_unique'
`);

if (indexes.length > 0) {
  console.log("✅ UNIQUE KEY 已存在，跳過");
} else {
  await conn.execute(`
    ALTER TABLE tenant_modules
    ADD CONSTRAINT tenant_module_unique UNIQUE (tenantId, moduleKey)
  `);
  console.log("✅ UNIQUE KEY (tenantId, moduleKey) 新增成功");
}

await conn.end();
console.log("🎉 Migration 完成！");

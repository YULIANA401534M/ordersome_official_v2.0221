/**
 * 新增來點什麼 ERP 模組定義，並為 tenantId=1 預設開啟
 * 執行方式：node scripts/seed-os-erp-modules.mjs
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

const NEW_MODULES = [
  { moduleKey: 'daily_report_os', label: '門市日報',     category: 'store_ops', sortOrder: 51 },
  { moduleKey: 'purchasing_os',   label: '叫貨管理',     category: 'store_ops', sortOrder: 52 },
  { moduleKey: 'rebate_os',       label: '退佣帳款',     category: 'store_ops', sortOrder: 53 },
  { moduleKey: 'products_os',     label: '品項成本管理', category: 'store_ops', sortOrder: 54 },
];

// 1. 插入 module_definitions
console.log("=== 新增 module_definitions ===");
for (const m of NEW_MODULES) {
  const [r] = await conn.execute(
    `INSERT INTO module_definitions (moduleKey, label, category, sortOrder)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE label=VALUES(label), category=VALUES(category), sortOrder=VALUES(sortOrder)`,
    [m.moduleKey, m.label, m.category, m.sortOrder]
  );
  console.log(`  ${r.affectedRows > 0 ? '✅' : '⏭ '} ${m.moduleKey} (${m.label})`);
}

// 2. 插入 tenant_modules（tenantId=1，預設開啟）
console.log("\n=== 為 tenantId=1 開啟模組 ===");
for (const m of NEW_MODULES) {
  const [r] = await conn.execute(
    `INSERT INTO tenant_modules (tenantId, moduleKey, isEnabled, createdAt, updatedAt)
     VALUES (1, ?, true, NOW(), NOW())
     ON DUPLICATE KEY UPDATE isEnabled=true, updatedAt=NOW()`,
    [m.moduleKey]
  );
  console.log(`  ${r.affectedRows > 0 ? '✅' : '⏭ '} tenantId=1, ${m.moduleKey}`);
}

// 3. 驗證
console.log("\n=== 驗證結果 ===");
const [rows] = await conn.execute(
  `SELECT md.moduleKey, md.label, md.category, md.sortOrder, tm.isEnabled
   FROM module_definitions md
   LEFT JOIN tenant_modules tm ON tm.moduleKey = md.moduleKey AND tm.tenantId = 1
   WHERE md.moduleKey IN ('daily_report_os','purchasing_os','rebate_os','products_os')`
);
console.table(rows);

await conn.end();
console.log("\n🎉 完成！");

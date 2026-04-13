/**
 * Migration：建立 module_definitions 表並插入 15 筆系統模組定義
 * 執行方式：node scripts/migrate-module-definitions.mjs
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

// 1. 建立 module_definitions 表（若已存在則跳過）
const [tables] = await conn.execute(
  `SELECT TABLE_NAME FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'module_definitions'`
);

if (tables.length > 0) {
  console.log("⏭  module_definitions 表已存在，跳過建表");
} else {
  await conn.execute(`
    CREATE TABLE \`module_definitions\` (
      \`moduleKey\`   varchar(64)  NOT NULL,
      \`label\`       varchar(128) NOT NULL,
      \`category\`    varchar(64)  NOT NULL,
      \`description\` varchar(255),
      \`sortOrder\`   int          NOT NULL DEFAULT 0,
      \`createdAt\`   timestamp    NOT NULL DEFAULT (now()),
      CONSTRAINT \`module_definitions_moduleKey\` PRIMARY KEY(\`moduleKey\`)
    )
  `);
  console.log("✅ module_definitions 表建立成功");
}

// 2. 插入模組定義（INSERT IGNORE 避免重複）
const modules = [
  // 來點什麼專屬（store_ops）
  ['sop',              'SOP 知識庫', 'store_ops', 10],
  ['equipment_repair', '設備報修',   'store_ops', 20],
  ['checklist',        '每日檢查表', 'store_ops', 30],
  ['scheduling',       '排班系統',   'store_ops', 40],
  ['daily_report',     '門市日報',   'store_ops', 50],
  // 通用 ERP（erp）
  ['inventory',        '庫存管理',   'erp', 10],
  ['purchasing',       '進貨管理',   'erp', 20],
  ['delivery',         '配送管理',   'erp', 30],
  ['crm_customers',    '客戶管理',   'erp', 40],
  ['accounting',       '帳務管理',   'erp', 50],
  // 大永專屬（dayone）
  ['erp_dashboard',    'ERP 總覽',   'dayone', 10],
  ['driver_mgmt',      '司機管理',   'dayone', 20],
  ['products',         '品項管理',   'dayone', 30],
  ['districts',        '行政區管理', 'dayone', 40],
  ['liff_orders',      'LIFF 訂單',  'dayone', 50],
];

let inserted = 0;
let skipped = 0;
for (const [moduleKey, label, category, sortOrder] of modules) {
  const [result] = await conn.execute(
    `INSERT IGNORE INTO module_definitions (moduleKey, label, category, sortOrder) VALUES (?, ?, ?, ?)`,
    [moduleKey, label, category, sortOrder]
  );
  if (result.affectedRows > 0) {
    console.log(`  ✅ 插入: ${moduleKey} (${label})`);
    inserted++;
  } else {
    console.log(`  ⏭  已存在: ${moduleKey}`);
    skipped++;
  }
}

// 3. 驗證結果
const [rows] = await conn.execute(`SELECT COUNT(*) AS cnt FROM module_definitions`);
const total = rows[0].cnt;

console.log(`\n📊 結果：新增 ${inserted} 筆，跳過 ${skipped} 筆，目前共 ${total} 筆`);

await conn.end();
console.log("🎉 Migration 完成！");

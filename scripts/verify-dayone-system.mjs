import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: url.port, user: url.username,
  password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

const TENANT_ID = 90004;
const checks = [];

async function check(name, query, validator) {
  try {
    const [rows] = await conn.execute(query);
    const result = validator(rows);
    checks.push({ name, status: result ? '✅' : '❌', detail: result || 'FAIL' });
  } catch (e) {
    checks.push({ name, status: '❌', detail: e.message });
  }
}

// 1. 基礎資料
await check('dy_customers 有資料',
  `SELECT COUNT(*) as cnt FROM dy_customers WHERE tenantId=${TENANT_ID}`,
  r => r[0].cnt > 0 && `${r[0].cnt} 筆`);

await check('dy_products 有資料',
  `SELECT COUNT(*) as cnt FROM dy_products WHERE tenantId=${TENANT_ID}`,
  r => r[0].cnt > 0 && `${r[0].cnt} 筆`);

await check('dy_suppliers 有資料',
  `SELECT COUNT(*) as cnt FROM dy_suppliers WHERE tenantId=${TENANT_ID}`,
  r => r[0].cnt >= 17 && `${r[0].cnt} 筆`);

await check('dy_drivers 有資料',
  `SELECT COUNT(*) as cnt FROM dy_drivers WHERE tenantId=${TENANT_ID}`,
  r => r[0].cnt > 0 && `${r[0].cnt} 筆`);

await check('dy_inventory 有資料',
  `SELECT COUNT(*) as cnt FROM dy_inventory WHERE tenantId=${TENANT_ID}`,
  r => r[0].cnt > 0 && `${r[0].cnt} 筆`);

await check('dy_districts 有資料',
  `SELECT COUNT(*) as cnt FROM dy_districts WHERE tenantId=${TENANT_ID}`,
  r => r[0].cnt > 0 && `${r[0].cnt} 筆`);

// 2. Phase 2 新表
await check('dy_dispatch_orders 表存在',
  `SELECT COUNT(*) as cnt FROM dy_dispatch_orders WHERE 1=1`,
  r => `表存在，${r[0].cnt} 筆`);

await check('dy_purchase_receipts 表存在',
  `SELECT COUNT(*) as cnt FROM dy_purchase_receipts WHERE 1=1`,
  r => `表存在，${r[0].cnt} 筆`);

await check('dy_ar_records 表存在',
  `SELECT COUNT(*) as cnt FROM dy_ar_records WHERE 1=1`,
  r => `表存在，${r[0].cnt} 筆`);

await check('dy_ap_records 表存在',
  `SELECT COUNT(*) as cnt FROM dy_ap_records WHERE 1=1`,
  r => `表存在，${r[0].cnt} 筆`);

await check('order_audit_logs 表存在',
  `SELECT COUNT(*) as cnt FROM order_audit_logs WHERE 1=1`,
  r => `表存在，${r[0].cnt} 筆`);

// 3. 用戶帳號
await check('大永 manager 帳號存在',
  `SELECT email, role FROM users WHERE tenantId=${TENANT_ID} AND role='manager'`,
  r => r.length > 0 && r.map(u => u.email).join(', '));

await check('司機帳號存在',
  `SELECT email, role FROM users WHERE tenantId=${TENANT_ID} AND role='driver'`,
  r => r.length > 0 ? r.map(u => u.email).join(', ') : '無司機帳號（需建立）');

// 4. Portal
await check('Portal 客戶有 loginEmail',
  `SELECT name, loginEmail, isPortalActive FROM dy_customers WHERE tenantId=${TENANT_ID} AND loginEmail IS NOT NULL`,
  r => r.length > 0 ? r.map(c => `${c.name}(${c.loginEmail})`).join(', ') : '無 Portal 帳號');

// 5. 模組開關
await check('tenant_modules 已設定',
  `SELECT tm.moduleKey, tm.isEnabled FROM tenant_modules tm WHERE tm.tenantId=${TENANT_ID}`,
  r => {
    const enabled = r.filter(m => m.isEnabled).map(m => m.moduleKey);
    return `已開啟: ${enabled.length > 0 ? enabled.join(', ') : '（全關）'}，共 ${r.length} 筆`;
  });

// 6. users role enum 包含 driver
await check('users role enum 包含 driver',
  `SHOW COLUMNS FROM users LIKE 'role'`,
  r => {
    const type = r[0]?.Type || '';
    return type.includes('driver') && type;
  });

console.log('\n=== 大永蛋品系統驗證報告 ===\n');
for (const c of checks) {
  console.log(`${c.status} ${c.name}: ${c.detail}`);
}
const failCount = checks.filter(c => c.status === '❌').length;
console.log(`\n總計: ${checks.length} 項, 通過 ${checks.length - failCount}, 失敗 ${failCount}`);
if (failCount > 0) console.log('\n⚠️ 有失敗項目需要處理');
else console.log('\n🎉 所有驗證項目通過！');

await conn.end();

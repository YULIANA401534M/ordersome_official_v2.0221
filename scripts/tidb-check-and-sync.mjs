import mysql from 'mysql2/promise';

const TIDB_URL = 'mysql://2PEiAB7nB6htiep.root:Y9QkbXSPa0Zgulq0@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/ordersome?ssl={"rejectUnauthorized":true}';

const conn = await mysql.createConnection(TIDB_URL);
console.log('✓ 連線 TiDB Cloud 成功');

// 查詢現有 dy_ 表
const [tables] = await conn.execute(
  `SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'ordersome' AND table_name LIKE 'dy_%'
   ORDER BY table_name`
);

console.log('\n=== 現有 dy_ 資料表 ===');
const existingTables = tables.map(t => t.table_name);
for (const t of existingTables) {
  console.log(`  ✓ ${t}`);
}

// 也查詢 tenant_modules
const [tmCheck] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM information_schema.tables 
   WHERE table_schema = 'ordersome' AND table_name = 'tenant_modules'`
);
if (tmCheck[0].cnt > 0) {
  console.log('  ✓ tenant_modules');
  existingTables.push('tenant_modules');
}

// 預期應有的表
const expected = [
  'dy_districts', 'dy_products', 'dy_customers', 'dy_customer_prices',
  'dy_drivers', 'dy_orders', 'dy_order_items', 'dy_inventory',
  'dy_stock_movements', 'dy_suppliers', 'dy_purchase_orders',
  'dy_purchase_order_items', 'dy_work_logs', 'dy_delivery_signatures',
  'tenant_modules'
];

const missing = expected.filter(t => !existingTables.includes(t));
console.log('\n=== 缺漏的資料表 ===');
if (missing.length === 0) {
  console.log('  （無缺漏）');
} else {
  for (const t of missing) {
    console.log(`  ✗ ${t}`);
  }
}

// 查詢 dy_orders 欄位確認 driverNote / cashCollected
if (existingTables.includes('dy_orders')) {
  const [cols] = await conn.execute(`SHOW COLUMNS FROM dy_orders`);
  const colNames = cols.map(c => c.Field);
  console.log('\n=== dy_orders 欄位檢查 ===');
  console.log(`  driverNote:    ${colNames.includes('driverNote') ? '✓ 存在' : '✗ 缺漏'}`);
  console.log(`  cashCollected: ${colNames.includes('cashCollected') ? '✓ 存在' : '✗ 缺漏'}`);
}

await conn.end();
console.log('\n✓ 檢查完成');

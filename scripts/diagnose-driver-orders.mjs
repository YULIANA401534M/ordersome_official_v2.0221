import mysql from 'mysql2/promise';
import { mysqlConfigFromDatabaseUrl } from './_tidb-url.mjs';

const conn = await mysql.createConnection(mysqlConfigFromDatabaseUrl());

console.log('\n=== 1. 最近10筆 dy_orders（確認 deliveryDate / driverId）===');
try {
  const [rows] = await conn.execute(
    `SELECT id, orderNo, driverId, deliveryDate, status, createdAt
     FROM dy_orders WHERE tenantId = 90004
     ORDER BY id DESC LIMIT 10`
  );
  console.table(rows);
} catch (e) { console.error('Error:', e.message); }

console.log('\n=== 2. dy_drivers 所有司機（確認 id / userId / name）===');
try {
  const [rows] = await conn.execute(
    `SELECT d.id as driverId, d.name, d.userId, d.status, u.name as userName, u.email
     FROM dy_drivers d
     JOIN users u ON u.id = d.userId
     WHERE d.tenantId = 90004`
  );
  console.table(rows);
} catch (e) { console.error('Error:', e.message); }

console.log('\n=== 3. dy_purchase_receipts status ENUM 現況 ===');
try {
  const [rows] = await conn.execute(
    `SHOW COLUMNS FROM dy_purchase_receipts WHERE Field = 'status'`
  );
  console.table(rows);
} catch (e) { console.error('Error:', e.message); }

console.log('\n=== 4. 今日派車單 + 派車品項 ===');
try {
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  console.log('今日日期（台灣）:', today);
  const [rows] = await conn.execute(
    `SELECT do2.id, do2.driverId, do2.dispatchDate, do2.status, do2.routeCode,
            COUNT(di.id) as itemCount
     FROM dy_dispatch_orders do2
     LEFT JOIN dy_dispatch_items di ON di.dispatchOrderId = do2.id
     WHERE do2.tenantId = 90004
     GROUP BY do2.id
     ORDER BY do2.id DESC LIMIT 10`
  );
  console.table(rows);
} catch (e) { console.error('Error:', e.message); }

console.log('\n=== 5. 派車品項裡的訂單 deliveryDate ===');
try {
  const [rows] = await conn.execute(
    `SELECT di.dispatchOrderId, o.id as orderId, o.driverId, o.deliveryDate, o.status
     FROM dy_dispatch_items di
     JOIN dy_orders o ON o.id = di.orderId
     WHERE di.tenantId = 90004
     ORDER BY di.dispatchOrderId DESC LIMIT 20`
  );
  console.table(rows);
} catch (e) { console.error('Error:', e.message); }

await conn.end();
console.log('\n完成。');

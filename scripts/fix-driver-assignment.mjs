import mysql from 'mysql2/promise';
import { mysqlConfigFromDatabaseUrl } from './_tidb-url.mjs';

const conn = await mysql.createConnection(mysqlConfigFromDatabaseUrl());

// 派車單 240002 屬於 driverId=90002（不是真實司機，可能是舊測試資料）
// 司機B的 driverId = 150001
// 我們把 dispatch 240002 + 關聯訂單 390005 全部改成司機B

console.log('=== 修改前確認 ===');
const [before] = await conn.execute(
  `SELECT id, driverId, status FROM dy_dispatch_orders WHERE id = 240002`
);
console.table(before);

const [orderBefore] = await conn.execute(
  `SELECT id, driverId, deliveryDate, status FROM dy_orders WHERE id = 390005`
);
console.table(orderBefore);

console.log('\n更新派車單 240002 → driverId = 150001（司機B）...');
await conn.execute(
  `UPDATE dy_dispatch_orders SET driverId = 150001 WHERE id = 240002 AND tenantId = 90004`
);

console.log('更新訂單 390005 → driverId = 150001（司機B）...');
await conn.execute(
  `UPDATE dy_orders SET driverId = 150001 WHERE id = 390005 AND tenantId = 90004`
);

console.log('\n=== 修改後確認 ===');
const [after] = await conn.execute(
  `SELECT id, driverId, status FROM dy_dispatch_orders WHERE id = 240002`
);
console.table(after);

const [orderAfter] = await conn.execute(
  `SELECT id, driverId, deliveryDate, status FROM dy_orders WHERE id = 390005`
);
console.table(orderAfter);

await conn.end();
console.log('\n完成。司機B（driverId=150001）現在可以在 APP 看到訂單。');

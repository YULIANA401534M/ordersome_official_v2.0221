import 'dotenv/config';
import { createPool } from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
const pool = createPool({
  host: url.hostname, port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: true },
  supportBigNumbers: true, bigNumberStrings: false,
});

const date = '2026-04-30';
const driverIds = [120001, 150001];

for (const driverId of driverIds) {
  console.log(`\n=== 司機 driverId=${driverId} ===`);

  // 1. 找派車單
  const [dispatchRows] = await pool.execute(
    `SELECT id, status, dispatchDate,
            DATE(CONVERT_TZ(dispatchDate,'+00:00','+08:00')) as dispatchDateTW
     FROM dy_dispatch_orders
     WHERE tenantId=90004 AND driverId=?
       AND DATE(CONVERT_TZ(dispatchDate,'+00:00','+08:00')) = ?
       AND status IN ('draft','printed','in_progress','pending_handover')`,
    [driverId, date]
  );
  console.log('符合的派車單:', dispatchRows.length, dispatchRows);

  // 2. 模擬完整查詢
  const [rows] = await pool.execute(
    `SELECT o.id, o.orderNo, o.status, o.deliveryDate,
            di.stopSequence, di.dispatchOrderId
     FROM dy_orders o
     JOIN dy_customers c ON o.customerId = c.id
     LEFT JOIN dy_dispatch_items di
       ON di.orderId = o.id AND di.tenantId = o.tenantId
       AND di.dispatchOrderId = (
         SELECT ddo2.id FROM dy_dispatch_orders ddo2
         WHERE ddo2.tenantId = o.tenantId AND ddo2.driverId = ?
           AND DATE(CONVERT_TZ(ddo2.dispatchDate,'+00:00','+08:00')) = ?
           AND ddo2.status IN ('draft','printed','in_progress','pending_handover')
         ORDER BY ddo2.id DESC LIMIT 1
       )
     WHERE o.tenantId = 90004 AND o.driverId = ?
       AND DATE(CONVERT_TZ(o.deliveryDate,'+00:00','+08:00')) = ?
       AND o.status NOT IN ('cancelled','delivered')
     ORDER BY COALESCE(di.stopSequence, 9999) ASC, o.id ASC`,
    [driverId, date, driverId, date]
  );
  console.log('getMyTodayOrders 結果:', rows.length, rows);
}

await pool.end();

import mysql from "mysql2/promise";
import "dotenv/config";

const TENANT_ID = 90004;
const TARGET_DATE = "2026-04-29";

const raw = process.env.DATABASE_URL;
if (!raw) { console.error("No DATABASE_URL"); process.exit(1); }
const url = new URL(raw.replace(/^mysql:\/\//, "http://"));
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: true },
});

// 查司機B所有派車單（含已完成）
console.log("=== 司機B 所有派車單（含已完成）===");
const [dispatches] = await conn.execute(
  `SELECT id, driverId, dispatchDate, routeCode, status, createdAt
   FROM dy_dispatch_orders
   WHERE tenantId=? AND dispatchDate=? AND driverId=150001
   ORDER BY id`,
  [TENANT_ID, TARGET_DATE]
);
console.table(dispatches);

// 查司機B所有派車單的站點
console.log("\n=== 司機B 所有站點（含所有派車單）===");
const [items] = await conn.execute(
  `SELECT di.id, di.dispatchOrderId, ddo.status AS dispatchStatus,
          di.orderId, di.stopSequence, c.name AS customerName,
          o.status AS orderStatus, o.totalAmount
   FROM dy_dispatch_items di
   JOIN dy_dispatch_orders ddo ON ddo.id = di.dispatchOrderId
   LEFT JOIN dy_orders o ON o.id = di.orderId
   LEFT JOIN dy_customers c ON c.id = di.customerId
   WHERE ddo.tenantId=? AND ddo.dispatchDate=? AND ddo.driverId=150001
   ORDER BY ddo.id, di.stopSequence`,
  [TENANT_ID, TARGET_DATE]
);
console.table(items);

// 查寧TEST這個客戶的訂單
console.log("\n=== 寧TEST 客戶今日所有訂單 ===");
const [ningOrders] = await conn.execute(
  `SELECT o.id, o.orderNo, o.status, o.totalAmount, o.deliveryDate,
          o.driverId, c.name AS customerName
   FROM dy_orders o
   JOIN dy_customers c ON c.id = o.customerId
   WHERE o.tenantId=? AND c.name LIKE '%TEST%'
     AND DATE(CONVERT_TZ(o.deliveryDate,'+00:00','+08:00'))=?
   ORDER BY o.id`,
  [TENANT_ID, TARGET_DATE]
);
console.table(ningOrders);

await conn.end();

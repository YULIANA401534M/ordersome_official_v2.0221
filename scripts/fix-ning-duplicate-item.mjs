import mysql from "mysql2/promise";
import "dotenv/config";

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

// 刪除 270004（北屯派車單）裡重複的寧TEST站點（orderId=390005）
// 這筆訂單已在 240002（已完成）裡完成，不應再出現在新派車單
console.log("刪除重複站點 dispatch_item id=270009（派車單270004 / 寧TEST / orderId=390005）...");
const [result] = await conn.execute(
  `DELETE FROM dy_dispatch_items WHERE id=270009 AND dispatchOrderId=270004 AND orderId=390005`
);
console.log(`已刪除 ${result.affectedRows} 筆`);

// 確認 270004 剩餘站點
const [remaining] = await conn.execute(
  `SELECT di.id, di.stopSequence, c.name AS customerName, o.status AS orderStatus
   FROM dy_dispatch_items di
   LEFT JOIN dy_orders o ON o.id = di.orderId
   LEFT JOIN dy_customers c ON c.id = di.customerId
   WHERE di.dispatchOrderId=270004
   ORDER BY di.stopSequence`
);
console.log("\n270004（北屯）剩餘站點：");
console.table(remaining);

await conn.end();

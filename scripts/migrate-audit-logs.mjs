import "dotenv/config";
import mysql from "mysql2/promise";

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("建立 order_audit_logs 表...");
await conn.execute(`
  CREATE TABLE IF NOT EXISTS order_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    fromValue VARCHAR(100),
    toValue VARCHAR(100),
    performedBy INT NOT NULL,
    performedByName VARCHAR(100),
    note TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_orderId (orderId)
  )
`);
console.log("完成！");

await conn.end();

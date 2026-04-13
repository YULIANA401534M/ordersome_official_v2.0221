import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

const hash = await bcrypt.hash('Aa123456', 10);

await conn.execute(
  `INSERT INTO users (tenantId, openId, email, passwordHash, role, name, loginMethod, createdAt) VALUES (90004, 'dayone-manager', 'DAYONEVIP', ?, 'manager', '大永管理員', 'password', NOW())`,
  [hash]
);

console.log('大永 manager 帳號建立完成');
await conn.end();

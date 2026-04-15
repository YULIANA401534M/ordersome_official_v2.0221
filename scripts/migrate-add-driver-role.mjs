import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: url.port, user: url.username,
  password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});
await conn.execute(`ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','manager','franchisee','staff','customer','driver') NOT NULL DEFAULT 'customer'`);
console.log('✅ driver role added to users table');
await conn.end();

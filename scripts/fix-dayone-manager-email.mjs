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

await conn.execute(
  `UPDATE users SET email = 'dayonevip@dayone.com' WHERE email = 'DAYONEVIP' AND tenantId = 90004`
);

console.log('Email 已更新為 dayonevip@dayone.com');
await conn.end();

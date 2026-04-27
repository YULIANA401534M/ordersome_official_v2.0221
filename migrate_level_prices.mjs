import mysql from 'mysql2/promise';

const dbUrl = (process.env.DATABASE_URL || '').replace(/\?.*$/, '').replace(/^mysql:\/\//, '');
const url = new URL('http://' + dbUrl);
const pool = await mysql.createPool({
  host: url.hostname, port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''), ssl: { rejectUnauthorized: true },
});

const [tables] = await pool.execute("SHOW TABLES LIKE 'dy_level_prices'");
if (tables.length === 0) {
  await pool.execute(`
    CREATE TABLE dy_level_prices (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      tenantId      INT NOT NULL,
      level         ENUM('retail','store','supplier') NOT NULL,
      productId     INT NOT NULL,
      price         DECIMAL(10,2) NOT NULL,
      effectiveDate DATE NOT NULL,
      createdAt     DATETIME DEFAULT NOW(),
      updatedAt     DATETIME DEFAULT NOW() ON UPDATE NOW(),
      UNIQUE KEY uq_level_price (tenantId, level, productId)
    )
  `);
  console.log('✅ dy_level_prices 建立完成');
} else {
  console.log('ℹ️  dy_level_prices 已存在，跳過');
}

await pool.end();

import { createConnection } from 'mysql2/promise';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error('DATABASE_URL not set');

const url = new URL(rawUrl);
const conn = await createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(30),
      contact VARCHAR(50),
      paymentType VARCHAR(20) NOT NULL DEFAULT '現付',
      rebateRate DECIMAL(5,2) NOT NULL DEFAULT 0,
      rebateCondition INT NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      note TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ os_suppliers 建立完成');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      supplierId INT,
      category VARCHAR(50) NOT NULL DEFAULT '',
      name VARCHAR(100) NOT NULL,
      unit VARCHAR(20) NOT NULL DEFAULT '',
      unitSize DECIMAL(10,2) NOT NULL DEFAULT 1,
      unitCost DECIMAL(10,4) NOT NULL DEFAULT 0,
      batchPrice DECIMAL(10,4) NOT NULL DEFAULT 0,
      batchSize DECIMAL(10,2) NOT NULL DEFAULT 1,
      lastUpdated DATE,
      updatedBy VARCHAR(50),
      note TEXT,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ os_products 建立完成');

  const [tables] = await conn.execute("SHOW TABLES LIKE 'os_%'");
  console.log('目前 os_ 相關表：', tables.map(r => Object.values(r)[0]));
} finally {
  await conn.end();
}

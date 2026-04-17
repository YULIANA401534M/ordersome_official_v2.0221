import { createConnection } from 'mysql2/promise';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error('DATABASE_URL not set');

// TiDB requires manual URL parsing + SSL
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
    CREATE TABLE IF NOT EXISTS os_daily_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL DEFAULT 1,
      reportDate DATE NOT NULL,
      storeName VARCHAR(50) NOT NULL,
      totalSales INT NOT NULL DEFAULT 0,
      instoreSales INT NOT NULL DEFAULT 0,
      uberSales INT NOT NULL DEFAULT 0,
      pandaSales INT NOT NULL DEFAULT 0,
      guestCount INT NOT NULL DEFAULT 0,
      guestInstore INT NOT NULL DEFAULT 0,
      guestUber INT NOT NULL DEFAULT 0,
      guestPanda INT NOT NULL DEFAULT 0,
      avgPriceInstore INT NOT NULL DEFAULT 0,
      avgPriceUber INT NOT NULL DEFAULT 0,
      avgPricePanda INT NOT NULL DEFAULT 0,
      phoneOrderCount INT NOT NULL DEFAULT 0,
      phoneOrderAmount INT NOT NULL DEFAULT 0,
      deliveryOrderCount INT NOT NULL DEFAULT 0,
      deliveryOrderAmount INT NOT NULL DEFAULT 0,
      voidCount INT NOT NULL DEFAULT 0,
      voidAmount INT NOT NULL DEFAULT 0,
      staffCount VARCHAR(20),
      laborHours DECIMAL(4,1) DEFAULT 0,
      productivity INT NOT NULL DEFAULT 0,
      reviewGood INT NOT NULL DEFAULT 0,
      reviewBad INT NOT NULL DEFAULT 0,
      rawText TEXT,
      syncedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_store_date (reportDate, storeName)
    )
  `);
  console.log('✅ os_daily_reports 建立完成');

  const [tables] = await conn.execute("SHOW TABLES LIKE 'os_%'");
  console.log('目前 os_ 相關表：', tables.map(r => Object.values(r)[0]));
} finally {
  await conn.end();
}

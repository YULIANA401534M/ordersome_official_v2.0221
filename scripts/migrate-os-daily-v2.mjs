import { createConnection } from 'mysql2/promise';

const conn = await createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  // 台灣假日曆表
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_tw_holidays (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      isHoliday TINYINT(1) NOT NULL DEFAULT 0,
      description VARCHAR(100),
      year INT NOT NULL,
      INDEX idx_date (date),
      INDEX idx_year (year)
    )
  `);
  console.log('os_tw_holidays 建立完成');

  // 每日報表（重建，欄位更完整）
  // 如果舊表存在先備份
  const [tables] = await conn.execute("SHOW TABLES LIKE 'os_daily_reports'");
  if (tables.length > 0) {
    await conn.execute("RENAME TABLE os_daily_reports TO os_daily_reports_backup_v1");
    console.log('舊表已備份為 os_daily_reports_backup_v1');
  }

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_daily_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL DEFAULT 1,
      reportDate DATE NOT NULL,
      storeName VARCHAR(50) NOT NULL,
      isHoliday TINYINT(1) NOT NULL DEFAULT 0,

      -- 營業額
      instoreSales INT NOT NULL DEFAULT 0,
      uberSales INT NOT NULL DEFAULT 0,
      pandaSales INT NOT NULL DEFAULT 0,
      totalSales INT AS (instoreSales + uberSales + pandaSales) STORED,

      -- 來客數
      guestInstore INT NOT NULL DEFAULT 0,
      guestUber INT NOT NULL DEFAULT 0,
      guestPanda INT NOT NULL DEFAULT 0,
      guestTotal INT AS (guestInstore + guestUber + guestPanda) STORED,

      -- 客單價（自動算，儲存以利查詢）
      avgPriceInstore INT AS (IF(guestInstore > 0, ROUND(instoreSales / guestInstore), 0)) STORED,
      avgPriceUber INT AS (IF(guestUber > 0, ROUND(uberSales / guestUber), 0)) STORED,
      avgPricePanda INT AS (IF(guestPanda > 0, ROUND(pandaSales / guestPanda), 0)) STORED,

      -- 電話/外送
      phoneOrderCount INT NOT NULL DEFAULT 0,
      phoneOrderAmount INT NOT NULL DEFAULT 0,
      deliveryOrderCount INT NOT NULL DEFAULT 0,
      deliveryOrderAmount INT NOT NULL DEFAULT 0,

      -- 作廢
      voidCount INT NOT NULL DEFAULT 0,
      voidAmount INT NOT NULL DEFAULT 0,

      -- 現金卷/集點卡
      cashVoucherCount INT NOT NULL DEFAULT 0,
      loyaltyCardCount INT NOT NULL DEFAULT 0,

      -- 人員與產能
      staffFull INT NOT NULL DEFAULT 0,
      staffPart INT NOT NULL DEFAULT 0,
      laborHours DECIMAL(4,1) NOT NULL DEFAULT 0,
      productivity INT AS (IF(laborHours > 0, ROUND(totalSales / laborHours), 0)) STORED,

      -- 當日成本（自購）
      dailyCost INT NOT NULL DEFAULT 0,

      -- Google 評論
      reviewGood INT NOT NULL DEFAULT 0,
      reviewBad INT NOT NULL DEFAULT 0,

      -- 備註
      note TEXT,

      -- 提交資訊
      submittedBy VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uniq_store_date (tenantId, storeName, reportDate),
      INDEX idx_date (reportDate),
      INDEX idx_store (storeName)
    )
  `);
  console.log('os_daily_reports 建立完成');

  // 月報補充表（每月一次手填）
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_monthly_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL DEFAULT 1,
      storeName VARCHAR(50) NOT NULL,
      year INT NOT NULL,
      month INT NOT NULL,

      -- 固定費用
      electricityFee INT NOT NULL DEFAULT 0,
      waterFee INT NOT NULL DEFAULT 0,
      rentFee INT NOT NULL DEFAULT 0,
      miscFee INT NOT NULL DEFAULT 0,

      -- 人事
      staffSalaryCost INT NOT NULL DEFAULT 0,

      -- 月報文字欄位
      performanceReview TEXT,
      competitorInfo TEXT,
      monthlyPlan TEXT,
      staffChanges TEXT,
      otherNotes TEXT,

      -- 目標
      targetSales INT NOT NULL DEFAULT 0,
      targetGuest INT NOT NULL DEFAULT 0,
      targetProductivity INT NOT NULL DEFAULT 0,

      submittedBy VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uniq_store_month (tenantId, storeName, year, month)
    )
  `);
  console.log('os_monthly_reports 建立完成');

  // 確認現有 os_daily% 和 os_holiday% 表
  const [dailyTables] = await conn.execute("SHOW TABLES LIKE 'os_daily%'");
  const [holidayTables] = await conn.execute("SHOW TABLES LIKE 'os_holiday%'");
  console.log('os_daily% 表:', dailyTables.map(r => Object.values(r)[0]));
  console.log('os_holiday% 表:', holidayTables.map(r => Object.values(r)[0]));

  console.log('\n所有表建立完成');
} finally {
  await conn.end();
}

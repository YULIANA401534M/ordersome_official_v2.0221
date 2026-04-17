import { createConnection } from 'mysql2/promise';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error('DATABASE_URL not set');

const url = new URL(rawUrl.replace(/^mysql:\/\//, 'http://'));
const conn = await createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

try {
  // 退佣記錄表
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_rebate_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL DEFAULT 1,
      supplierName VARCHAR(100) NOT NULL,
      supplierId INT,
      rebateType ENUM('percentage','fixed','offset') NOT NULL,
      rebateRate DECIMAL(8,4) DEFAULT 0,
      periodYear INT NOT NULL,
      periodMonth INT NOT NULL,
      totalPurchaseAmount DECIMAL(12,2) DEFAULT 0,
      rebateAmount DECIMAL(12,2) DEFAULT 0,
      status ENUM('calculated','confirmed','received','offset') DEFAULT 'calculated',
      receivedDate DATE,
      bankTxNote VARCHAR(200),
      note TEXT,
      calculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      confirmedBy VARCHAR(100),
      INDEX idx_period (periodYear, periodMonth),
      INDEX idx_supplier (supplierName),
      UNIQUE KEY uniq_supplier_period (supplierId, periodYear, periodMonth)
    )
  `);
  console.log('✅ os_rebate_records 建立完成');

  // 應付帳款表（廠商月結）
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_payables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL DEFAULT 1,
      supplierName VARCHAR(100) NOT NULL,
      supplierId INT,
      periodYear INT NOT NULL,
      periodMonth INT NOT NULL,
      totalAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
      rebateOffset DECIMAL(12,2) DEFAULT 0,
      netPayable DECIMAL(12,2) DEFAULT 0,
      status ENUM('pending','partial','paid','cancelled') DEFAULT 'pending',
      dueDate DATE,
      paidDate DATE,
      paidAmount DECIMAL(12,2) DEFAULT 0,
      bankTxNote VARCHAR(200),
      note TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_supplier_period (supplierId, periodYear, periodMonth),
      INDEX idx_status (status),
      INDEX idx_due (dueDate)
    )
  `);
  console.log('✅ os_payables 建立完成');

  // 確認 os_suppliers 是否有 rebateType 欄位，沒有就加
  const [cols] = await conn.execute('SHOW COLUMNS FROM os_suppliers');
  const existingCols = cols.map((c) => c.Field);
  console.log('os_suppliers 現有欄位:', existingCols.join(', '));

  if (!existingCols.includes('rebateType')) {
    await conn.execute(`ALTER TABLE os_suppliers ADD COLUMN rebateType ENUM('percentage','fixed','offset') NOT NULL DEFAULT 'percentage' AFTER rebateRate`);
    console.log('✅ os_suppliers.rebateType 欄位新增完成');
  } else {
    console.log('⏭  os_suppliers.rebateType 已存在，跳過');
  }

  console.log('\n🎉 退佣與應付帳款表建立完成');
} finally {
  await conn.end();
}

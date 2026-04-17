import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
const conn = await createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

try {
  // 叫貨主表（每一張採購單）
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_procurement_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL DEFAULT 1,
      orderNo VARCHAR(50) NOT NULL UNIQUE,
      orderDate DATE NOT NULL,
      status ENUM('pending','sent','confirmed','received','cancelled') DEFAULT 'pending',
      totalAmount DECIMAL(10,2) DEFAULT 0,
      sourceType ENUM('manual','damai_import') DEFAULT 'manual',
      rawEmailData JSON,
      note TEXT,
      createdBy VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_date (orderDate),
      INDEX idx_status (status)
    )
  `);
  console.log('✓ os_procurement_orders 建立完成');

  // 叫貨明細（每一筆品項）
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_procurement_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      procurementOrderId INT NOT NULL,
      supplierId INT,
      supplierName VARCHAR(100) NOT NULL,
      storeName VARCHAR(50) NOT NULL,
      productName VARCHAR(200) NOT NULL,
      unit VARCHAR(20),
      quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
      unitPrice DECIMAL(10,4) DEFAULT 0,
      amount DECIMAL(10,2) DEFAULT 0,
      temperature ENUM('常溫','冷藏','冷凍') DEFAULT '常溫',
      lineSent TINYINT(1) DEFAULT 0,
      lineSentAt TIMESTAMP NULL,
      INDEX idx_order (procurementOrderId),
      INDEX idx_supplier (supplierName),
      INDEX idx_store (storeName)
    )
  `);
  console.log('✓ os_procurement_items 建立完成');

  // 廠商 LINE 帳號（推播用）
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS os_supplier_line (
      id INT AUTO_INCREMENT PRIMARY KEY,
      supplierName VARCHAR(100) NOT NULL UNIQUE,
      lineGroupId VARCHAR(100) COMMENT 'LINE 群組 ID，用於推播',
      lineUserId VARCHAR(100) COMMENT 'LINE 個人 ID，備用',
      isActive TINYINT(1) DEFAULT 1,
      note TEXT
    )
  `);
  console.log('✓ os_supplier_line 建立完成');

  // 預設廠商 LINE 對應
  const suppliers = ['廣弘','凱田','韓濟','伯享','長春騰','甘先生','聯華','椪椪','裕展','美食家','米谷','鼎冠'];
  for (const name of suppliers) {
    await conn.execute(`
      INSERT IGNORE INTO os_supplier_line (supplierName, isActive)
      VALUES (?, 1)
    `, [name]);
  }
  console.log(`✓ os_supplier_line 預設廠商 ${suppliers.length} 筆寫入完成`);

  console.log('\n採購相關表建立完成');
} finally {
  await conn.end();
}

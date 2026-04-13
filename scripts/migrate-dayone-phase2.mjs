/**
 * Migration: DayOne Phase 2 — 帳務、派車、空箱、進貨單系統
 * 執行方式：node scripts/migrate-dayone-phase2.mjs
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ 找不到 DATABASE_URL 環境變數");
  process.exit(1);
}

const u = new URL(url);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port) || 4000,
  user: u.username,
  password: u.password,
  database: u.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("✅ 連線成功，開始 Phase 2 migration...\n");

// ─────────────────────────────────────────────
// 【A】dy_customers 補欄位
// ─────────────────────────────────────────────
console.log("【A】檢查 dy_customers 欄位...");
try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM dy_customers");
  const existing = cols.map((c) => c.Field);
  console.log("  現有欄位:", existing.join(", "));

  const toAdd = [
    { name: "lineUserId",       def: "VARCHAR(128)" },
    { name: "loginEmail",       def: "VARCHAR(320)" },
    { name: "passwordHash",     def: "VARCHAR(255)" },
    { name: "customerLevel",    def: "ENUM('supplier','store','retail') NOT NULL DEFAULT 'store'" },
    { name: "settlementCycle",  def: "ENUM('per_delivery','weekly','monthly') NOT NULL DEFAULT 'monthly'" },
    { name: "overdueDays",      def: "INT NOT NULL DEFAULT 5" },
    { name: "isPortalActive",   def: "BOOLEAN NOT NULL DEFAULT TRUE" },
    { name: "portalNote",       def: "TEXT" },
  ];

  for (const col of toAdd) {
    if (existing.includes(col.name)) {
      console.log(`  ⏭  ${col.name} 已存在，跳過`);
    } else {
      await conn.execute(`ALTER TABLE dy_customers ADD COLUMN ${col.name} ${col.def}`);
      console.log(`  ✅ 新增 dy_customers.${col.name}`);
    }
  }
} catch (err) {
  console.error("  ❌ dy_customers 欄位處理失敗:", err.message);
}

// ─────────────────────────────────────────────
// 【B】users 補欄位
// ─────────────────────────────────────────────
console.log("\n【B】檢查 users 欄位...");
try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM users");
  const existing = cols.map((c) => c.Field);
  console.log("  現有欄位:", existing.join(", "));

  if (existing.includes("dyCustomerId")) {
    console.log("  ⏭  dyCustomerId 已存在，跳過");
  } else {
    await conn.execute(`ALTER TABLE users ADD COLUMN dyCustomerId INT`);
    console.log("  ✅ 新增 users.dyCustomerId");
  }
} catch (err) {
  console.error("  ❌ users 欄位處理失敗:", err.message);
}

// ─────────────────────────────────────────────
// 【C】建立新資料表
// ─────────────────────────────────────────────
console.log("\n【C】建立新資料表...");

// dy_ar_records
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_ar_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      orderId INT NOT NULL,
      customerId INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
      paymentMethod ENUM('cash','transfer') DEFAULT NULL,
      status ENUM('unpaid','partial','paid','overdue') NOT NULL DEFAULT 'unpaid',
      dueDate DATE,
      paidAt TIMESTAMP NULL,
      adminNote TEXT,
      customerNote TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_ar_records");
} catch (err) {
  console.error("  ❌ dy_ar_records:", err.message);
}

// dy_ap_records
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_ap_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      supplierId INT NOT NULL,
      purchaseReceiptId INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
      paymentMethod ENUM('cash','transfer') DEFAULT NULL,
      status ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
      dueDate DATE,
      paidAt TIMESTAMP NULL,
      adminNote TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_ap_records");
} catch (err) {
  console.error("  ❌ dy_ap_records:", err.message);
}

// dy_driver_cash_reports
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_driver_cash_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      driverId INT NOT NULL,
      reportDate DATE NOT NULL,
      expectedAmount DECIMAL(10,2) NOT NULL,
      actualAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
      diff DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('normal','anomaly','resolved') NOT NULL DEFAULT 'normal',
      driverNote TEXT,
      adminNote TEXT,
      resolvedAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_driver_cash_reports");
} catch (err) {
  console.error("  ❌ dy_driver_cash_reports:", err.message);
}

// dy_purchase_receipts
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_purchase_receipts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      supplierId INT NOT NULL,
      driverId INT NOT NULL,
      receiptDate DATETIME NOT NULL,
      licensePlate VARCHAR(20),
      batchNo VARCHAR(50),
      items JSON NOT NULL COMMENT '[{productId,name,qty,unitPrice}]',
      totalQty INT NOT NULL DEFAULT 0,
      totalAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
      anomalyNote TEXT,
      supplierSignatureUrl TEXT,
      signedAt TIMESTAMP NULL,
      status ENUM('pending','signed','anomaly') NOT NULL DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_purchase_receipts");
} catch (err) {
  console.error("  ❌ dy_purchase_receipts:", err.message);
}

// dy_dispatch_orders
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_dispatch_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      dispatchDate DATE NOT NULL,
      driverId INT NOT NULL,
      routeCode VARCHAR(10) NOT NULL,
      status ENUM('draft','printed','in_progress','completed') NOT NULL DEFAULT 'draft',
      extraBoxes INT NOT NULL DEFAULT 20,
      generatedAt TIMESTAMP NULL,
      printedAt TIMESTAMP NULL,
      completedAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_dispatch_orders");
} catch (err) {
  console.error("  ❌ dy_dispatch_orders:", err.message);
}

// dy_dispatch_items
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_dispatch_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dispatchOrderId INT NOT NULL,
      tenantId INT NOT NULL,
      orderId INT NULL,
      customerId INT NOT NULL,
      stopSequence INT NOT NULL,
      estimatedArrival VARCHAR(10),
      prevBoxes INT NOT NULL DEFAULT 0,
      deliverBoxes INT NOT NULL DEFAULT 0,
      returnBoxes INT NOT NULL DEFAULT 0,
      remainBoxes INT NOT NULL DEFAULT 0,
      paymentStatus ENUM('paid','unpaid','monthly','weekly') NOT NULL DEFAULT 'unpaid',
      cashCollected DECIMAL(10,2) NOT NULL DEFAULT 0,
      driverNote TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_dispatch_items");
} catch (err) {
  console.error("  ❌ dy_dispatch_items:", err.message);
}

// dy_box_ledger
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_box_ledger (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      customerId INT NOT NULL UNIQUE,
      currentBalance INT NOT NULL DEFAULT 0,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_box_ledger");
} catch (err) {
  console.error("  ❌ dy_box_ledger:", err.message);
}

// dy_box_transactions
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_box_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      customerId INT NOT NULL,
      dispatchItemId INT NULL,
      type ENUM('delivery','return','adjust') NOT NULL,
      quantity INT NOT NULL,
      balanceBefore INT NOT NULL,
      balanceAfter INT NOT NULL,
      note TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_box_transactions");
} catch (err) {
  console.error("  ❌ dy_box_transactions:", err.message);
}

// dy_supplier_prices
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_supplier_prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      supplierId INT NOT NULL,
      productId INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      effectiveDate DATE NOT NULL,
      note TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_supplier_prices");
} catch (err) {
  console.error("  ❌ dy_supplier_prices:", err.message);
}

// dy_customer_price_history
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_customer_price_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      customerId INT NOT NULL,
      productId INT NOT NULL,
      oldPrice DECIMAL(10,2),
      newPrice DECIMAL(10,2) NOT NULL,
      changedBy INT,
      note TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✅ dy_customer_price_history");
} catch (err) {
  console.error("  ❌ dy_customer_price_history:", err.message);
}

// ─────────────────────────────────────────────
// 確認結果
// ─────────────────────────────────────────────
console.log("\n【確認】SHOW TABLES LIKE 'dy_%':");
try {
  const [tables] = await conn.execute("SHOW TABLES LIKE 'dy_%'");
  tables.forEach((t) => {
    const name = Object.values(t)[0];
    console.log("  ", name);
  });
} catch (err) {
  console.error("  ❌ SHOW TABLES 失敗:", err.message);
}

await conn.end();
console.log("\n🎉 Phase 2 Migration 完成！");

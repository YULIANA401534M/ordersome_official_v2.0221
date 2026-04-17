-- ================================================================
-- 0026: 排班管理 + 配送管理 — 版本記錄（表已用 node script 建立於 TiDB）
-- ================================================================

-- 員工班別範本
CREATE TABLE IF NOT EXISTS os_schedule_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  storeId INT NOT NULL,
  employeeName VARCHAR(50) NOT NULL,
  scheduleType ENUM('early','late','mobile') NOT NULL DEFAULT 'early',
  defaultStartTime VARCHAR(10),
  defaultEndTime VARCHAR(10),
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 每日班表
CREATE TABLE IF NOT EXISTS os_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  storeId INT NOT NULL,
  employeeName VARCHAR(50) NOT NULL,
  scheduleDate DATE NOT NULL,
  status ENUM('work','rest','designated','personal_leave','public_leave','absent','overtime') NOT NULL DEFAULT 'work',
  startTime VARCHAR(10),
  endTime VARCHAR(10),
  supportStoreId INT COMMENT '支援門市',
  note VARCHAR(200),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_schedule (tenantId, storeId, employeeName, scheduleDate)
);

-- 派車單主表
CREATE TABLE IF NOT EXISTS os_delivery_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  deliveryNo VARCHAR(30) NOT NULL UNIQUE COMMENT 'DO-YYYYMMDD-001',
  storeId INT NOT NULL COMMENT '收貨門市 FK → stores.id',
  storeName VARCHAR(100),
  deliveryDate DATE NOT NULL,
  status ENUM('pending','picking','dispatched','delivered','signed') NOT NULL DEFAULT 'pending',
  totalAmount DECIMAL(10,2) DEFAULT 0,
  driverName VARCHAR(50),
  note TEXT,
  createdBy VARCHAR(50),
  signedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 派車單品項明細
CREATE TABLE IF NOT EXISTS os_delivery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deliveryOrderId INT NOT NULL COMMENT 'FK → os_delivery_orders.id',
  productName VARCHAR(100) NOT NULL,
  unit VARCHAR(20) DEFAULT '箱',
  quantity INT NOT NULL DEFAULT 0,
  unitPrice DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  note VARCHAR(200),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

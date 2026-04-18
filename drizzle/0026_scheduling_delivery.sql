-- ================================================================
-- 0026: 排班管理 + 配送管理資料表
-- 注意：這四張表已於 2026-04-18 用 node script 直接建立於 TiDB
-- 此檔案為版本記錄用，不需重複執行
-- ================================================================

CREATE TABLE IF NOT EXISTS os_schedule_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  storeId INT NOT NULL COMMENT '主門市，機動人員填宇聯總部 storeId=401534',
  userId INT NULL COMMENT '未來員工建帳號後補連動',
  employeeName VARCHAR(50) NOT NULL,
  scheduleType ENUM('early','late','mobile') NOT NULL DEFAULT 'early',
  defaultStartTime VARCHAR(10) NULL,
  defaultEndTime VARCHAR(10) NULL,
  fixedRestDays JSON NULL COMMENT '[0,6] 表示週日週六固定休',
  note VARCHAR(200) NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_store_employee (tenantId, storeId, employeeName)
);

CREATE TABLE IF NOT EXISTS os_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  storeId INT NOT NULL,
  userId INT NULL,
  employeeName VARCHAR(50) NOT NULL,
  scheduleDate DATE NOT NULL,
  status ENUM('work','rest','designated','personal_leave',
    'public_leave','absent','overtime') NOT NULL DEFAULT 'work',
  startTime VARCHAR(10) NULL,
  endTime VARCHAR(10) NULL,
  actualHours DECIMAL(4,1) NULL,
  supportStoreId INT NULL COMMENT '機動人員當天實際支援的門市',
  note VARCHAR(200) NULL,
  createdBy VARCHAR(50) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employee_date (tenantId, storeId, employeeName, scheduleDate)
);

CREATE TABLE IF NOT EXISTS os_delivery_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  deliveryNo VARCHAR(30) NOT NULL UNIQUE,
  procurementOrderId INT NULL,
  deliveryDate DATE NOT NULL,
  driverName VARCHAR(50) NULL,
  fromLocation VARCHAR(100) NOT NULL DEFAULT '宇聯倉庫',
  toStoreId INT NOT NULL,
  toStoreName VARCHAR(50) NOT NULL,
  status ENUM('pending','picking','dispatched','delivered','signed') NOT NULL DEFAULT 'pending',
  totalAmount DECIMAL(10,2) NULL,
  note TEXT NULL,
  signedAt TIMESTAMP NULL,
  signedBy VARCHAR(50) NULL,
  createdBy VARCHAR(50) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS os_delivery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deliveryOrderId INT NOT NULL,
  productId INT NULL,
  productName VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NULL,
  batchPrice DECIMAL(10,4) NULL,
  note VARCHAR(100) NULL,
  sortOrder INT DEFAULT 0
);

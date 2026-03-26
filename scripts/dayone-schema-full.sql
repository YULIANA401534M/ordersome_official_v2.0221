-- ============================================================
-- 大永蛋品 ERP 完整 DDL（CREATE TABLE IF NOT EXISTS）
-- 適用資料庫：TiDB Cloud / MySQL 8.0+
-- 執行方式：在 TiDB Cloud Console 或 Railway MySQL client 執行
-- 所有表使用 IF NOT EXISTS，安全可重複執行
-- ============================================================

-- 1. 地區管理
CREATE TABLE IF NOT EXISTS dy_districts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tenantId    INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  deliveryDays VARCHAR(20) DEFAULT NULL COMMENT '送貨日，例如 1,3,5 代表週一三五',
  sortOrder   INT DEFAULT 0,
  createdAt   DATETIME NOT NULL DEFAULT NOW(),
  updatedAt   DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 品項管理
CREATE TABLE IF NOT EXISTS dy_products (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tenantId     INT NOT NULL,
  code         VARCHAR(50) NOT NULL,
  name         VARCHAR(200) NOT NULL,
  unit         VARCHAR(20) DEFAULT '個',
  defaultPrice DECIMAL(10,2) DEFAULT 0.00,
  isActive     TINYINT(1) DEFAULT 1,
  createdAt    DATETIME NOT NULL DEFAULT NOW(),
  updatedAt    DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_tenant_code (tenantId, code),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 客戶管理
CREATE TABLE IF NOT EXISTS dy_customers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tenantId         INT NOT NULL,
  name             VARCHAR(200) NOT NULL,
  phone            VARCHAR(30) DEFAULT NULL,
  address          VARCHAR(500) DEFAULT NULL,
  districtId       INT DEFAULT NULL,
  paymentType      ENUM('cash','monthly','credit') DEFAULT 'cash',
  creditLimit      DECIMAL(10,2) DEFAULT 0.00,
  outstandingAmount DECIMAL(10,2) DEFAULT 0.00,
  status           ENUM('active','inactive') DEFAULT 'active',
  createdAt        DATETIME NOT NULL DEFAULT NOW(),
  updatedAt        DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_tenant (tenantId),
  INDEX idx_district (districtId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 客戶特殊定價
CREATE TABLE IF NOT EXISTS dy_customer_prices (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tenantId      INT NOT NULL,
  customerId    INT NOT NULL,
  productId     INT NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  effectiveDate DATE DEFAULT NULL,
  createdAt     DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_customer_product (customerId, productId),
  INDEX idx_tenant (tenantId),
  INDEX idx_customer (customerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 司機管理
CREATE TABLE IF NOT EXISTS dy_drivers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tenantId    INT NOT NULL,
  userId      INT DEFAULT NULL COMMENT '關聯 users.id，允許 NULL（尚未綁定帳號）',
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(30) DEFAULT NULL,
  lineId      VARCHAR(100) DEFAULT NULL,
  districtIds VARCHAR(500) DEFAULT NULL COMMENT 'JSON 陣列，例如 [1,2,3]',
  vehicleNo   VARCHAR(30) DEFAULT NULL,
  status      ENUM('active','inactive') DEFAULT 'active',
  createdAt   DATETIME NOT NULL DEFAULT NOW(),
  updatedAt   DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_tenant (tenantId),
  INDEX idx_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 訂單主表
CREATE TABLE IF NOT EXISTS dy_orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tenantId      INT NOT NULL,
  orderNo       VARCHAR(50) NOT NULL,
  customerId    INT NOT NULL,
  driverId      INT DEFAULT NULL,
  deliveryDate  DATE NOT NULL,
  districtId    INT DEFAULT NULL,
  status        ENUM('pending','in_transit','delivered','cancelled') DEFAULT 'pending',
  totalAmount   DECIMAL(10,2) DEFAULT 0.00,
  paidAmount    DECIMAL(10,2) DEFAULT 0.00,
  cashCollected DECIMAL(10,2) DEFAULT 0.00 COMMENT '司機實收現金',
  paymentStatus ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
  prevBoxes     INT DEFAULT 0 COMMENT '上次留箱數',
  inBoxes       INT DEFAULT 0 COMMENT '本次送入箱數',
  returnBoxes   INT DEFAULT 0 COMMENT '本次回收箱數',
  remainBoxes   INT DEFAULT 0 COMMENT '目前留箱數',
  signatureUrl  VARCHAR(1000) DEFAULT NULL,
  photoUrl      VARCHAR(1000) DEFAULT NULL,
  driverNote    TEXT DEFAULT NULL COMMENT '司機備註',
  note          TEXT DEFAULT NULL,
  createdAt     DATETIME NOT NULL DEFAULT NOW(),
  updatedAt     DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_tenant_orderno (tenantId, orderNo),
  INDEX idx_tenant (tenantId),
  INDEX idx_customer (customerId),
  INDEX idx_driver (driverId),
  INDEX idx_delivery_date (deliveryDate),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 訂單明細
CREATE TABLE IF NOT EXISTS dy_order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  tenantId   INT NOT NULL,
  orderId    INT NOT NULL,
  productId  INT NOT NULL,
  qty        DECIMAL(10,2) NOT NULL DEFAULT 0,
  unitPrice  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  returnQty  DECIMAL(10,2) DEFAULT 0 COMMENT '退貨數量',
  INDEX idx_order (orderId),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 庫存管理
CREATE TABLE IF NOT EXISTS dy_inventory (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tenantId    INT NOT NULL,
  productId   INT NOT NULL,
  currentQty  DECIMAL(10,2) DEFAULT 0,
  safetyQty   DECIMAL(10,2) DEFAULT 0 COMMENT '安全庫存量',
  unit        VARCHAR(20) DEFAULT '個',
  updatedAt   DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_tenant_product (tenantId, productId),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. 庫存異動紀錄
CREATE TABLE IF NOT EXISTS dy_stock_movements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  tenantId   INT NOT NULL,
  type       ENUM('in','out','adjust','return') NOT NULL,
  productId  INT NOT NULL,
  qty        DECIMAL(10,2) NOT NULL,
  batchNo    VARCHAR(100) DEFAULT NULL,
  refId      INT DEFAULT NULL COMMENT '關聯單據 ID',
  refType    VARCHAR(50) DEFAULT NULL COMMENT '關聯單據類型，如 purchase_order',
  operatorId INT DEFAULT NULL COMMENT '操作人 users.id',
  note       TEXT DEFAULT NULL,
  createdAt  DATETIME NOT NULL DEFAULT NOW(),
  INDEX idx_tenant (tenantId),
  INDEX idx_product (productId),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. 供應商管理
CREATE TABLE IF NOT EXISTS dy_suppliers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tenantId    INT NOT NULL,
  name        VARCHAR(200) NOT NULL,
  contact     VARCHAR(100) DEFAULT NULL,
  phone       VARCHAR(30) DEFAULT NULL,
  address     VARCHAR(500) DEFAULT NULL,
  bankAccount VARCHAR(200) DEFAULT NULL,
  status      ENUM('active','inactive') DEFAULT 'active',
  createdAt   DATETIME NOT NULL DEFAULT NOW(),
  updatedAt   DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. 進貨單主表
CREATE TABLE IF NOT EXISTS dy_purchase_orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tenantId     INT NOT NULL,
  supplierId   INT NOT NULL,
  deliveryDate DATE DEFAULT NULL,
  status       ENUM('draft','ordered','received','cancelled') DEFAULT 'draft',
  totalAmount  DECIMAL(10,2) DEFAULT 0.00,
  note         TEXT DEFAULT NULL,
  receivedBy   INT DEFAULT NULL COMMENT '驗收人 users.id',
  createdAt    DATETIME NOT NULL DEFAULT NOW(),
  updatedAt    DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_tenant (tenantId),
  INDEX idx_supplier (supplierId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. 進貨單明細
CREATE TABLE IF NOT EXISTS dy_purchase_order_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tenantId        INT NOT NULL,
  purchaseOrderId INT NOT NULL,
  productId       INT NOT NULL,
  expectedQty     DECIMAL(10,2) DEFAULT 0,
  actualQty       DECIMAL(10,2) DEFAULT 0,
  unitPrice       DECIMAL(10,2) DEFAULT 0.00,
  INDEX idx_purchase_order (purchaseOrderId),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. 司機工作日誌
CREATE TABLE IF NOT EXISTS dy_work_logs (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tenantId       INT NOT NULL,
  driverId       INT NOT NULL,
  workDate       DATE NOT NULL,
  startTime      VARCHAR(10) DEFAULT NULL COMMENT '格式 HH:MM',
  endTime        VARCHAR(10) DEFAULT NULL COMMENT '格式 HH:MM',
  totalOrders    INT DEFAULT 0,
  totalCollected DECIMAL(10,2) DEFAULT 0.00,
  note           TEXT DEFAULT NULL,
  createdAt      DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_driver_date (driverId, workDate),
  INDEX idx_tenant (tenantId),
  INDEX idx_driver (driverId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. 司機簽收記錄
CREATE TABLE IF NOT EXISTS dy_delivery_signatures (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tenantId     INT NOT NULL,
  orderId      INT NOT NULL,
  driverId     INT NOT NULL,
  signatureUrl VARCHAR(1000) NOT NULL,
  signedAt     DATETIME NOT NULL DEFAULT NOW(),
  INDEX idx_order (orderId),
  INDEX idx_driver (driverId),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 補充欄位（ALTER TABLE IF NOT EXISTS 欄位，避免重複執行報錯）
-- 若 dy_orders 已存在但缺少 driverNote / cashCollected 欄位
-- ============================================================
ALTER TABLE dy_orders
  ADD COLUMN IF NOT EXISTS driverNote    TEXT DEFAULT NULL COMMENT '司機備註',
  ADD COLUMN IF NOT EXISTS cashCollected DECIMAL(10,2) DEFAULT 0.00 COMMENT '司機實收現金';

-- ============================================================
-- tenant_modules 表（模組開關，若尚未建立）
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_modules (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  tenantId  INT NOT NULL,
  moduleKey VARCHAR(100) NOT NULL,
  isEnabled TINYINT(1) DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT NOW(),
  updatedAt DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_tenant_module (tenantId, moduleKey),
  INDEX idx_tenant (tenantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 預設模組開關（大永蛋品 tenantId=1，依實際 tenantId 調整）
-- ============================================================
INSERT INTO tenant_modules (tenantId, moduleKey, isEnabled) VALUES
  (1, 'crm_customers', 1),
  (1, 'delivery',      1),
  (1, 'inventory',     1),
  (1, 'purchase',      1),
  (1, 'reports',       1)
ON DUPLICATE KEY UPDATE isEnabled=VALUES(isEnabled), updatedAt=NOW();

-- ============================================================
-- 完成
-- ============================================================
SELECT 'dayone-schema-full.sql executed successfully' AS status;

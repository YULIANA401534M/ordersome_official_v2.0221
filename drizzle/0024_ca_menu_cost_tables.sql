-- ================================================================
-- 0024: CA 表單數位化 — 菜單品項成本（第二層）+ OEM 品項（第三層）
-- ================================================================

-- 第二層：菜單品項主表
CREATE TABLE IF NOT EXISTS os_menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  category VARCHAR(50) NOT NULL COMMENT '分頁名稱，如：來點什麼、來點蛋餅、韓式飯捲',
  name VARCHAR(100) NOT NULL COMMENT '品項名稱，如：闆闆秘製薯餅大廈',
  mainIngredient VARCHAR(100) COMMENT '主食描述，如：黃金薯餅(3個)',
  servingType ENUM('both','dine_in_only','takeout_only') NOT NULL DEFAULT 'both',
  basePrice DECIMAL(10,2) COMMENT '原始售價',
  currentPrice DECIMAL(10,2) COMMENT '最新售價',
  platformPrice DECIMAL(10,2) COMMENT '平台售價',
  note TEXT,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updatedBy VARCHAR(50)
);

-- 第二層：菜單品項食材明細（連結原物料）
CREATE TABLE IF NOT EXISTS os_menu_item_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menuItemId INT NOT NULL COMMENT 'FK → os_menu_items.id',
  productId INT COMMENT 'FK → os_products.id，NULL 表示手動輸入',
  ingredientName VARCHAR(100) NOT NULL COMMENT '食材名稱（冗餘儲存，防止原物料改名影響歷史）',
  quantity DECIMAL(10,4) NOT NULL COMMENT '用量',
  unit VARCHAR(20) COMMENT '用量單位（克/片/顆/張...）',
  costOverride DECIMAL(10,4) COMMENT '手動覆寫成本（NULL = 從 os_products 自動帶入）',
  ingredientType ENUM('ingredient','packaging') NOT NULL DEFAULT 'ingredient' COMMENT '食材 or 包材',
  note VARCHAR(100),
  sortOrder INT DEFAULT 0
);

-- 第三層：OEM 品項
CREATE TABLE IF NOT EXISTS os_oem_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  name VARCHAR(100) NOT NULL COMMENT '如：辣炒豬/公斤、珊瑚醬/公斤',
  unit VARCHAR(20) NOT NULL DEFAULT '公斤',
  processingFee DECIMAL(10,4) DEFAULT 0 COMMENT '代工費/單位',
  packagingCost DECIMAL(10,4) DEFAULT 0 COMMENT '紙箱等包材費',
  batchPrice DECIMAL(10,4) COMMENT '批價',
  note TEXT,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updatedBy VARCHAR(50)
);

-- 第三層：OEM 品項原料明細
CREATE TABLE IF NOT EXISTS os_oem_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  oemProductId INT NOT NULL COMMENT 'FK → os_oem_products.id',
  productId INT COMMENT 'FK → os_products.id，NULL 表示手動輸入',
  ingredientName VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  unit VARCHAR(20),
  costOverride DECIMAL(10,4) COMMENT 'NULL = 從 os_products 自動帶入',
  sortOrder INT DEFAULT 0
);

-- 成本修改歷史紀錄（原物料 + 菜單品項 + OEM 都用這張表）
CREATE TABLE IF NOT EXISTS os_cost_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tableTarget ENUM('os_products','os_menu_items','os_oem_products') NOT NULL,
  recordId INT NOT NULL,
  fieldName VARCHAR(50) NOT NULL,
  oldValue VARCHAR(200),
  newValue VARCHAR(200),
  changedBy VARCHAR(50) NOT NULL,
  changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

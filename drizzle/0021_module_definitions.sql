-- 建立 module_definitions 表
CREATE TABLE `module_definitions` (
  `moduleKey`   varchar(64)  NOT NULL,
  `label`       varchar(128) NOT NULL,
  `category`    varchar(64)  NOT NULL,
  `description` varchar(255),
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `createdAt`   timestamp    NOT NULL DEFAULT (now()),
  CONSTRAINT `module_definitions_moduleKey` PRIMARY KEY(`moduleKey`)
);

-- 插入所有系統模組定義
INSERT INTO module_definitions (moduleKey, label, category, sortOrder) VALUES
  -- 來點什麼專屬（store_ops）
  ('sop',              'SOP 知識庫', 'store_ops', 10),
  ('equipment_repair', '設備報修',   'store_ops', 20),
  ('checklist',        '每日檢查表', 'store_ops', 30),
  ('scheduling',       '排班系統',   'store_ops', 40),
  ('daily_report',     '門市日報',   'store_ops', 50),
  -- 通用 ERP（erp）
  ('inventory',        '庫存管理',   'erp', 10),
  ('purchasing',       '進貨管理',   'erp', 20),
  ('delivery',         '配送管理',   'erp', 30),
  ('crm_customers',    '客戶管理',   'erp', 40),
  ('accounting',       '帳務管理',   'erp', 50),
  -- 大永專屬（dayone）
  ('erp_dashboard',    'ERP 總覽',   'dayone', 10),
  ('driver_mgmt',      '司機管理',   'dayone', 20),
  ('products',         '品項管理',   'dayone', 30),
  ('districts',        '行政區管理', 'dayone', 40),
  ('liff_orders',      'LIFF 訂單',  'dayone', 50);

-- 新增來點什麼 ERP 模組定義
INSERT INTO module_definitions (moduleKey, label, category, sortOrder) VALUES
  ('daily_report_os', '門市日報',     'store_ops', 51),
  ('purchasing_os',   '叫貨管理',     'store_ops', 52),
  ('rebate_os',       '退佣帳款',     'store_ops', 53),
  ('products_os',     '品項成本管理', 'store_ops', 54)
ON DUPLICATE KEY UPDATE label=VALUES(label), category=VALUES(category), sortOrder=VALUES(sortOrder);

-- 為 tenantId=1（來點什麼）開啟以上模組
INSERT INTO tenant_modules (tenantId, moduleKey, isEnabled, createdAt, updatedAt) VALUES
  (1, 'daily_report_os', true, NOW(), NOW()),
  (1, 'purchasing_os',   true, NOW(), NOW()),
  (1, 'rebate_os',       true, NOW(), NOW()),
  (1, 'products_os',     true, NOW(), NOW())
ON DUPLICATE KEY UPDATE isEnabled=true, updatedAt=NOW();

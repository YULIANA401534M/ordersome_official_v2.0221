-- ================================================================
-- 0023: Role & Permission Expansion
-- 新增 store_manager role、franchisee_feature_flags 表、users 欄位擴充
-- ================================================================

-- 1. users.role ENUM 新增 store_manager
--    現有 ENUM：super_admin, manager, franchisee, staff, customer, driver
ALTER TABLE users MODIFY COLUMN role
  ENUM('super_admin','manager','franchisee','staff','store_manager','customer','driver','portal_customer')
  NOT NULL DEFAULT 'customer';

-- 2. users 表新增欄位
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_procurement_access TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;

-- 3. 加盟主功能開關表
CREATE TABLE IF NOT EXISTS franchisee_feature_flags (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  tenant_id     INT NOT NULL DEFAULT 1,
  feature_key   VARCHAR(64) NOT NULL,
  is_enabled    TINYINT(1) NOT NULL DEFAULT 0,
  updated_by    INT NULL,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_feature (user_id, feature_key)
);

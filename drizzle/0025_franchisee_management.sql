-- ================================================================
-- 0025: 加盟主管理 — 合約記錄 + 帳款往來
-- ================================================================

-- 合約記錄
CREATE TABLE IF NOT EXISTS os_franchisee_contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  userId INT NOT NULL COMMENT 'FK → users.id',
  contractType VARCHAR(50) NOT NULL DEFAULT '加盟合約' COMMENT '合約類型',
  fileUrl TEXT NOT NULL COMMENT 'R2 公開 URL',
  fileName VARCHAR(200) NOT NULL COMMENT '原始檔名',
  signedAt DATE COMMENT '簽約日期',
  expiresAt DATE COMMENT '到期日',
  note TEXT,
  uploadedBy VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 帳款往來
CREATE TABLE IF NOT EXISTS os_franchisee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT NOT NULL DEFAULT 1,
  userId INT NOT NULL COMMENT 'FK → users.id',
  paymentDate DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  direction ENUM('receivable','paid') NOT NULL DEFAULT 'receivable' COMMENT '應收/已付',
  category VARCHAR(50) NOT NULL DEFAULT '週結帳款' COMMENT '帳款類別',
  note TEXT,
  createdBy VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

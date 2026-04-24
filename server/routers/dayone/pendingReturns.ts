export async function ensureDyPendingReturnsTable(client: any) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS dy_pending_returns (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      dispatchOrderId BIGINT NOT NULL,
      productId BIGINT NOT NULL,
      qty DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      source VARCHAR(64) NULL,
      note TEXT NULL,
      reportedBy INT NULL,
      reportedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      receivedBy INT NULL,
      receivedAt DATETIME NULL,
      receiveNote TEXT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_dy_pending_returns_tenant_status (tenantId, status, reportedAt),
      KEY idx_dy_pending_returns_dispatch_product (dispatchOrderId, productId),
      KEY idx_dy_pending_returns_product (productId)
    )
  `);

  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS source VARCHAR(64) NULL AFTER status`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS note TEXT NULL AFTER source`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS reportedBy INT NULL AFTER note`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS reportedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER reportedBy`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS receivedBy INT NULL AFTER reportedAt`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS receivedAt DATETIME NULL AFTER receivedBy`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS receiveNote TEXT NULL AFTER receivedAt`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER receiveNote`
  );
  await client.execute(
    `ALTER TABLE dy_pending_returns ADD COLUMN IF NOT EXISTS updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt`
  );
}

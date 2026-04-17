import { createConnection } from 'mysql2/promise';

const conn = await createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS dy_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenantId INT NOT NULL,
      \`key\` VARCHAR(100) NOT NULL,
      value TEXT NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_tenant_key (tenantId, \`key\`)
    )
  `);
  console.log('dy_settings 建立完成');

  // 插入預設值
  await conn.execute(`
    INSERT IGNORE INTO dy_settings (tenantId, \`key\`, value) VALUES
    (90004, 'overdue_push_enabled', 'true'),
    (90004, 'overdue_push_hour', '9')
  `);
  console.log('預設設定已寫入');
} finally {
  await conn.end();
}

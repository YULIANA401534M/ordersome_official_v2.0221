import { createConnection } from 'mysql2/promise';

const conn = await createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM dy_customers LIKE 'resetToken'");
  if (cols.length === 0) {
    await conn.execute(`
      ALTER TABLE dy_customers
      ADD COLUMN resetToken VARCHAR(128) NULL DEFAULT NULL,
      ADD COLUMN resetTokenExpiry DATETIME NULL DEFAULT NULL
    `);
    console.log('欄位新增完成');
  } else {
    console.log('欄位已存在，略過');
  }
} finally {
  await conn.end();
}

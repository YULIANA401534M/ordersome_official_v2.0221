import { createConnection } from 'mysql2/promise';

const conn = await createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM dy_customers LIKE 'lineUserId'");
  if (cols.length === 0) {
    await conn.execute("ALTER TABLE dy_customers ADD COLUMN lineUserId VARCHAR(50) NULL DEFAULT NULL");
    console.log('lineUserId 欄位新增成功');
  } else {
    console.log('lineUserId 欄位已存在，略過');
  }
} finally {
  await conn.end();
}

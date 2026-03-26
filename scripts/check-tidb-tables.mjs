import mysql from 'mysql2/promise';

// 從 Railway 環境取得 TiDB Cloud 連線字串
// 格式: mysql://user:pass@host:port/dbname?ssl={"rejectUnauthorized":true}
const TIDB_URL = process.env.TIDB_DATABASE_URL || process.env.DATABASE_URL;

if (!TIDB_URL) {
  console.error('❌ 請設定 TIDB_DATABASE_URL 環境變數');
  process.exit(1);
}

const conn = await mysql.createConnection(TIDB_URL);

console.log('✓ 連線成功');

// 查詢現有 dy_ 表
const [tables] = await conn.execute(
  `SELECT table_name, table_rows 
   FROM information_schema.tables 
   WHERE table_schema = DATABASE() AND table_name LIKE 'dy_%'
   ORDER BY table_name`
);

console.log('\n=== TiDB Cloud 現有 dy_ 資料表 ===');
for (const t of tables) {
  console.log(`  ${t.table_name} (rows: ${t.table_rows})`);
}

await conn.end();

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname, port: url.port, user: url.username,
  password: decodeURIComponent(url.password), database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

const TENANT_ID = 90004;
const suppliers = [
  '林木森', '張新發', '鴻達', '昭興', '益元', '茂榮',
  '麗花', '德哥', '清波', '泈村', '高和', '祥俊',
  '福永', '春龍', '福成', '朝良', '大永台中倉'
];

for (const name of suppliers) {
  const [existing] = await conn.execute(
    'SELECT id FROM dy_suppliers WHERE tenantId=? AND name=?',
    [TENANT_ID, name]
  );
  if (existing.length === 0) {
    await conn.execute(
      `INSERT INTO dy_suppliers (tenantId, name, contact, phone, address, bankAccount, status, createdAt)
       VALUES (?,?,'','','','','active',NOW())`,
      [TENANT_ID, name]
    );
    console.log(`✅ 新增供應商: ${name}`);
  } else {
    console.log(`⏭️ 已存在: ${name}`);
  }
}
console.log('完成');
await conn.end();

import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }

const conn = await mysql.createConnection(url);

console.log('\n=== tenant_modules WHERE tenantId = 1 ===');
try {
  const [rows] = await conn.execute(
    "SELECT tenantId, moduleKey, isEnabled FROM tenant_modules WHERE tenantId = 1 ORDER BY moduleKey"
  );
  console.table(rows);
  if (rows.length === 0) console.log('(no rows found)');
} catch (e) {
  console.error('Error:', e.message);
}

await conn.end();

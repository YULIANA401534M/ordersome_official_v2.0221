import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Parse DATABASE_URL
const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error('DATABASE_URL not set');

const url = new URL(rawUrl.replace(/^mysql:\/\//, 'http://'));
const pool = createPool({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, '').split('?')[0],
  ssl: { rejectUnauthorized: true },
  multipleStatements: true,
});

const migrations = [
  '0022_os_erp_modules.sql',
  '0023_role_and_permission_expansion.sql',
  '0024_ca_menu_cost_tables.sql',
  '0025_franchisee_management.sql',
];

for (const file of migrations) {
  const filePath = join(projectRoot, 'drizzle', file);
  const sql = readFileSync(filePath, 'utf-8');
  console.log(`\n========== 執行 ${file} ==========`);
  try {
    const conn = await pool.getConnection();
    // 拆成單一 statements 逐條執行（TiDB 不支援 multipleStatements）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    conn.release();
    console.log(`✅ ${file} 執行成功`);
  } catch (err) {
    console.error(`❌ ${file} 執行失敗：`, err.message);
    console.error('停止執行，請確認錯誤後再重試。');
    process.exit(1);
  }
}

await pool.end();
console.log('\n🎉 全部 migration 執行完成');

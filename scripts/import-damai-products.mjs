import mysql from 'mysql2/promise';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) { console.error('No DATABASE_URL'); process.exit(1); }

// mysql2 v3.15 不接受 URL ?ssl=true，需拆解後手動傳 ssl 物件
const cleanUrl = rawUrl.replace(/[?&]ssl=true/, '');
const parsed = new URL(cleanUrl);
const conn = await mysql.createConnection({
  host: parsed.hostname,
  port: Number(parsed.port) || 4000,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

const wb = XLSX.read(readFileSync('./scripts/大麥商品資料匯出.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

const dataRows = rows.slice(1).filter(r => r[1]);

let upserted = 0, skipped = 0;

for (const r of dataRows) {
  const sysNo = r[0];
  const name = String(r[1] || '').trim();
  const unit = String(r[3] || '').trim();
  const category1 = String(r[5] || '').trim();
  const packCost = parseFloat(r[8]) || 0;
  const batchPrice = parseFloat(r[9]) || 0;
  const temperature = String(r[13] || '常溫').trim();
  const supplier = String(r[21] || '').trim();

  if (!name || !supplier) { skipped++; continue; }

  const [existing] = await conn.execute(
    `SELECT id, aliases FROM os_products
     WHERE tenantId=1 AND supplierName=? AND (name=? OR JSON_CONTAINS(aliases, JSON_QUOTE(?)))
     LIMIT 1`,
    [supplier, name, name]
  );

  if (existing.length > 0) {
    const rec = existing[0];
    let aliases = [];
    try { aliases = JSON.parse(rec.aliases || '[]'); } catch(e) {}
    if (!aliases.includes(rec.name)) aliases.push(rec.name);

    await conn.execute(
      `UPDATE os_products SET
        name=?, packCost=?, batchPrice=?, category1=?, category2=?,
        aliases=?, updatedAt=NOW()
       WHERE id=?`,
      [name, packCost, batchPrice, category1, temperature,
       JSON.stringify(aliases), rec.id]
    );
  } else {
    await conn.execute(
      `INSERT INTO os_products
       (tenantId, supplierName, name, unit, category1, category2, packCost, batchPrice,
        aliases, isActive, createdAt, updatedAt)
       VALUES (1,?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
      [supplier, name, unit, category1, temperature, packCost, batchPrice,
       JSON.stringify([])]
    );
  }
  upserted++;
}

console.log(`完成：更新/新增 ${upserted} 筆，略過 ${skipped} 筆`);

const [count] = await conn.execute(
  'SELECT COUNT(*) as cnt FROM os_products WHERE tenantId=1'
);
console.log(`os_products 現在共 ${count[0].cnt} 筆`);
await conn.end();

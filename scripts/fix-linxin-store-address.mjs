import mysql from "mysql2/promise";
import { mysqlConfigFromDatabaseUrl, redactedConnectionLabel } from "./_tidb-url.mjs";

const CORRECT_NAME_KEYWORD = "南屯林新";
const CORRECT_ADDRESS = "台中市南屯區惠中路三段54號";
const OLD_ADDRESS_KEYWORD = "大墩十一";
const apply = process.argv.includes("--apply");

const config = mysqlConfigFromDatabaseUrl();
console.log(`[linxin-address] connecting ${redactedConnectionLabel(config)}`);

const conn = await mysql.createConnection(config);
const [rows] = await conn.execute(
  `SELECT id, tenantId, name, address, latitude, longitude, isActive
   FROM stores
   WHERE name LIKE ? OR address LIKE ?
   ORDER BY tenantId, sortOrder, id`,
  [`%${CORRECT_NAME_KEYWORD}%`, `%${OLD_ADDRESS_KEYWORD}%`],
);

if (!rows.length) {
  console.log("[linxin-address] no matching store rows found. Nothing changed.");
  await conn.end();
  process.exit(0);
}

console.table(rows.map((row) => ({
  id: row.id,
  tenantId: row.tenantId,
  name: row.name,
  address: row.address,
  isActive: row.isActive,
})));

if (!apply) {
  console.log(`[linxin-address] dry run only. Re-run with --apply to update address to ${CORRECT_ADDRESS}`);
  await conn.end();
  process.exit(0);
}

const [result] = await conn.execute(
  `UPDATE stores
   SET address = ?, updatedAt = NOW()
   WHERE name LIKE ? OR address LIKE ?`,
  [CORRECT_ADDRESS, `%${CORRECT_NAME_KEYWORD}%`, `%${OLD_ADDRESS_KEYWORD}%`],
);

console.log(`[linxin-address] updated ${(result).affectedRows ?? 0} row(s).`);
await conn.end();

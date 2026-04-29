import mysql from "mysql2/promise";
import "dotenv/config";

const TENANT_ID = 90004;
const TARGET_DATE = "2026-04-29";

const raw = process.env.DATABASE_URL;
if (!raw) { console.error("No DATABASE_URL"); process.exit(1); }

const url = new URL(raw.replace(/^mysql:\/\//, "http://"));
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: true },
});

console.log(`\n=== 清除 ${TARGET_DATE} 重複草稿派車單 ===\n`);

// Step 1: 查看現況
const [allDrafts] = await conn.execute(
  `SELECT id, driverId, routeCode, status, createdAt,
          (SELECT COUNT(*) FROM dy_dispatch_items WHERE dispatchOrderId = ddo.id) AS itemCount
   FROM dy_dispatch_orders ddo
   WHERE tenantId=? AND dispatchDate=? AND status='draft'
   ORDER BY driverId, id ASC`,
  [TENANT_ID, TARGET_DATE]
);
console.log("現有草稿派車單：");
console.table(allDrafts);

// Step 2: 每個 driverId 只留最早建立的那張（id 最小），其餘刪除
const driverIds = [...new Set(allDrafts.map(r => r.driverId))];

for (const driverId of driverIds) {
  const driverDrafts = allDrafts.filter(r => r.driverId === driverId).sort((a, b) => a.id - b.id);
  if (driverDrafts.length <= 1) {
    console.log(`司機 ${driverId}：只有一張草稿，不需處理`);
    continue;
  }

  const primaryId = driverDrafts[0].id;
  const duplicateIds = driverDrafts.slice(1).map(r => r.id);
  console.log(`\n司機 ${driverId}：主單 id=${primaryId}，要清除的重複單 ids=${duplicateIds.join(",")}`);

  // Step 3: 找出重複站點（同一個 orderId 在主單裡已存在）
  for (const dupId of duplicateIds) {
    // 找出這張重複單裡、在主單中已有相同 orderId 的 items
    const [dupItems] = await conn.execute(
      `SELECT di.id, di.orderId FROM dy_dispatch_items di
       WHERE di.dispatchOrderId=?
         AND di.orderId IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM dy_dispatch_items di2
           WHERE di2.dispatchOrderId=? AND di2.orderId = di.orderId
         )`,
      [dupId, primaryId]
    );
    if (dupItems.length > 0) {
      console.log(`  重複單 ${dupId} 裡有 ${dupItems.length} 個重複站點，直接刪除`);
      const itemIds = dupItems.map(r => r.id);
      await conn.execute(
        `DELETE FROM dy_dispatch_items WHERE id IN (${itemIds.map(() => "?").join(",")})`,
        itemIds
      );
    }

    // 把剩下不重複的 items 移到主單（stopSequence 接續）
    const [maxSeqRows] = await conn.execute(
      `SELECT COALESCE(MAX(stopSequence), 0) AS maxSeq FROM dy_dispatch_items WHERE dispatchOrderId=?`,
      [primaryId]
    );
    let nextSeq = Number(maxSeqRows[0].maxSeq) + 1;

    const [remainItems] = await conn.execute(
      `SELECT id FROM dy_dispatch_items WHERE dispatchOrderId=?`,
      [dupId]
    );
    for (const item of remainItems) {
      await conn.execute(
        `UPDATE dy_dispatch_items SET dispatchOrderId=?, stopSequence=? WHERE id=?`,
        [primaryId, nextSeq++, item.id]
      );
    }
    console.log(`  剩餘 ${remainItems.length} 個站點已移到主單 ${primaryId}`);

    // 刪除空的重複派車單
    await conn.execute(
      `DELETE FROM dy_dispatch_orders WHERE id=? AND tenantId=? AND status='draft'`,
      [dupId, TENANT_ID]
    );
    console.log(`  重複派車單 ${dupId} 已刪除`);
  }
}

// Step 4: 確認結果
console.log("\n=== 清除後結果 ===");
const [afterDrafts] = await conn.execute(
  `SELECT id, driverId, routeCode, status,
          (SELECT COUNT(*) FROM dy_dispatch_items WHERE dispatchOrderId = ddo.id) AS itemCount
   FROM dy_dispatch_orders ddo
   WHERE tenantId=? AND dispatchDate=? AND status='draft'
   ORDER BY driverId, id ASC`,
  [TENANT_ID, TARGET_DATE]
);
console.table(afterDrafts);

// Step 5: 確認訂單數量 vs 派車站點數量
const [orderCount] = await conn.execute(
  `SELECT COUNT(*) AS cnt FROM dy_orders
   WHERE tenantId=? AND DATE(CONVERT_TZ(deliveryDate,'+00:00','+08:00'))=?
     AND status IN ('pending','assigned')`,
  [TENANT_ID, TARGET_DATE]
);
console.log(`\n今日有效訂單數：${orderCount[0].cnt}`);

const [itemCount] = await conn.execute(
  `SELECT COUNT(*) AS cnt FROM dy_dispatch_items di
   JOIN dy_dispatch_orders ddo ON ddo.id = di.dispatchOrderId
   WHERE ddo.tenantId=? AND ddo.dispatchDate=? AND ddo.status='draft'`,
  [TENANT_ID, TARGET_DATE]
);
console.log(`清除後派車站點數：${itemCount[0].cnt}`);

await conn.end();
console.log("\n完成。");

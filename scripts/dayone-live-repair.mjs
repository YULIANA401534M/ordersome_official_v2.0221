import mysql from "mysql2/promise";
import { ensureDyPendingReturnsTable } from "../server/routers/dayone/pendingReturns.ts";

const TENANT_ID = 90004;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function connectionConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, "http://"));
    return {
      host: url.hostname,
      port: Number(url.port) || 4000,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: true },
    };
  }

  return {
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 4000),
    user: requireEnv("DB_USERNAME"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_DATABASE"),
    ssl: { rejectUnauthorized: true },
  };
}

async function fetchRows(client, sql, params = []) {
  const [rows] = await client.execute(sql, params);
  return rows;
}

async function main() {
  const client = await mysql.createConnection(connectionConfig());
  const result = {
    ensuredPendingReturnsTable: false,
    apBackfills: [],
    arRemovals: [],
    dispatchRepairs: [],
  };

  await ensureDyPendingReturnsTable(client);
  result.ensuredPendingReturnsTable = true;

  const signedReceiptsMissingAp = await fetchRows(
    client,
    `SELECT pr.id, pr.supplierId, pr.totalAmount, pr.receiptDate
       FROM dy_purchase_receipts pr
       LEFT JOIN dy_ap_records ap
         ON ap.tenantId = pr.tenantId
        AND ap.purchaseReceiptId = pr.id
      WHERE pr.tenantId = ?
        AND pr.status IN ('signed', 'warehoused')
        AND ap.id IS NULL
      ORDER BY pr.id`,
    [TENANT_ID]
  );

  for (const receipt of signedReceiptsMissingAp) {
    const [insertResult] = await client.execute(
      `INSERT INTO dy_ap_records
       (tenantId, supplierId, purchaseReceiptId, amount, paidAmount, status, dueDate, createdAt, updatedAt)
       VALUES (?,?,?,?,0,'unpaid', DATE_ADD(DATE(?), INTERVAL 30 DAY), NOW(), NOW())`,
      [TENANT_ID, receipt.supplierId, receipt.id, receipt.totalAmount, receipt.receiptDate]
    );
    result.apBackfills.push({
      purchaseReceiptId: Number(receipt.id),
      apRecordId: Number(insertResult.insertId),
      amount: Number(receipt.totalAmount ?? 0),
    });
  }

  const arOnUndeliveredOrders = await fetchRows(
    client,
    `SELECT ar.id, ar.orderId, o.status AS orderStatus, ar.status AS arStatus, ar.amount, ar.paidAmount
       FROM dy_ar_records ar
       JOIN dy_orders o
         ON o.tenantId = ar.tenantId
        AND o.id = ar.orderId
      WHERE ar.tenantId = ?
        AND o.status <> 'delivered'
      ORDER BY ar.id`,
    [TENANT_ID]
  );

  for (const row of arOnUndeliveredOrders) {
    await client.execute(`DELETE FROM dy_ar_records WHERE id=? AND tenantId=?`, [row.id, TENANT_ID]);
    result.arRemovals.push({
      arRecordId: Number(row.id),
      orderId: Number(row.orderId),
      orderStatus: row.orderStatus,
      arStatus: row.arStatus,
    });
  }

  const dispatchesMissingStockOut = await fetchRows(
    client,
    `SELECT ddo.id, ddo.dispatchDate, ddo.status
       FROM dy_dispatch_orders ddo
      WHERE ddo.tenantId = ?
        AND ddo.status IN ('printed', 'in_progress', 'completed')
        AND NOT EXISTS (
          SELECT 1
            FROM dy_stock_movements sm
           WHERE sm.tenantId = ddo.tenantId
             AND sm.refType = 'dispatch_print'
             AND sm.refId = ddo.id
        )
      ORDER BY ddo.id`,
    [TENANT_ID]
  );

  for (const dispatch of dispatchesMissingStockOut) {
    await client.beginTransaction();
    try {
      const items = await fetchRows(
        client,
        `SELECT di.orderId, oi.productId, oi.qty
           FROM dy_dispatch_items di
           JOIN dy_order_items oi ON oi.orderId = di.orderId
          WHERE di.dispatchOrderId = ?
            AND di.tenantId = ?
            AND di.orderId IS NOT NULL`,
        [dispatch.id, TENANT_ID]
      );

      for (const item of items) {
        await client.execute(
          `UPDATE dy_inventory
              SET currentQty = currentQty - ?, updatedAt = NOW()
            WHERE tenantId = ? AND productId = ?`,
          [item.qty, TENANT_ID, item.productId]
        );
        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, note, createdAt)
           VALUES (?,?,'out',?,?,'dispatch_print',?,NOW())`,
          [
            TENANT_ID,
            item.productId,
            item.qty,
            dispatch.id,
            `Dispatch print backfill for order ${item.orderId}`,
          ]
        );
      }

      await client.execute(
        `UPDATE dy_orders o
         JOIN dy_dispatch_items di ON di.orderId = o.id
         SET o.status = CASE WHEN o.status IN ('pending', 'assigned') THEN 'picked' ELSE o.status END,
             o.updatedAt = NOW()
         WHERE di.dispatchOrderId = ?
           AND o.tenantId = ?`,
        [dispatch.id, TENANT_ID]
      );

      await client.commit();
      result.dispatchRepairs.push({
        dispatchOrderId: Number(dispatch.id),
        repairedOrderItemCount: items.length,
      });
    } catch (error) {
      await client.rollback();
      throw error;
    }
  }

  console.log(JSON.stringify(result, null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});

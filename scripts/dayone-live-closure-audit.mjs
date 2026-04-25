import mysql from "mysql2/promise";

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

async function fetchOne(client, sql, params = []) {
  const rows = await fetchRows(client, sql, params);
  return rows[0] ?? null;
}

async function main() {
  const client = await mysql.createConnection(connectionConfig());

  const pendingReturnsExists = await fetchOne(
    client,
    `SELECT COUNT(*) AS count
       FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = 'dy_pending_returns'`
  );

  const summary = {
    connection: await fetchOne(
      client,
      "SELECT DATABASE() AS db, CURRENT_USER() AS currentUser, VERSION() AS version"
    ),
    tenant: await fetchOne(
      client,
      "SELECT id, name, slug, plan, isActive FROM tenants WHERE id = ? LIMIT 1",
      [TENANT_ID]
    ),
    purchaseReceiptStatus: await fetchRows(
      client,
      `SELECT status, COUNT(*) AS count
         FROM dy_purchase_receipts
        WHERE tenantId = ?
        GROUP BY status
        ORDER BY status`,
      [TENANT_ID]
    ),
    dispatchStatus: await fetchRows(
      client,
      `SELECT status, COUNT(*) AS count
         FROM dy_dispatch_orders
        WHERE tenantId = ?
        GROUP BY status
        ORDER BY status`,
      [TENANT_ID]
    ),
    orderStatus: await fetchRows(
      client,
      `SELECT status, paymentStatus, COUNT(*) AS count
         FROM dy_orders
        WHERE tenantId = ?
        GROUP BY status, paymentStatus
        ORDER BY status, paymentStatus`,
      [TENANT_ID]
    ),
    closureChecks: {
      signedReceiptsMissingAp: await fetchRows(
        client,
        `SELECT pr.id, pr.receiptDate, pr.totalAmount, pr.supplierId
           FROM dy_purchase_receipts pr
           LEFT JOIN dy_ap_records ap
             ON ap.tenantId = pr.tenantId
            AND ap.purchaseReceiptId = pr.id
          WHERE pr.tenantId = ?
            AND pr.status IN ('signed', 'warehoused')
            AND ap.id IS NULL
          ORDER BY pr.id`,
        [TENANT_ID]
      ),
      warehousedReceiptsMissingInventoryMovement: await fetchRows(
        client,
        `SELECT pr.id, pr.receiptDate, pr.totalQty, pr.totalAmount
           FROM dy_purchase_receipts pr
          WHERE pr.tenantId = ?
            AND pr.status = 'warehoused'
            AND NOT EXISTS (
              SELECT 1
                FROM dy_stock_movements sm
               WHERE sm.tenantId = pr.tenantId
                 AND sm.refType = 'purchase_receipt_warehouse'
                 AND sm.refId = pr.id
            )
          ORDER BY pr.id`,
        [TENANT_ID]
      ),
      deliveredOrdersMissingAr: await fetchRows(
        client,
        `SELECT o.id, o.orderNo, o.deliveryDate, o.totalAmount, o.paidAmount
           FROM dy_orders o
           LEFT JOIN dy_ar_records ar
             ON ar.tenantId = o.tenantId
            AND ar.orderId = o.id
          WHERE o.tenantId = ?
            AND o.status = 'delivered'
            AND ar.id IS NULL
          ORDER BY o.id`,
        [TENANT_ID]
      ),
      deliveredOrderArMismatch: await fetchRows(
        client,
        `SELECT o.id, o.orderNo, o.totalAmount, o.paidAmount,
                ar.amount AS arAmount, ar.paidAmount AS arPaidAmount, ar.status AS arStatus
           FROM dy_orders o
           JOIN dy_ar_records ar
             ON ar.tenantId = o.tenantId
            AND ar.orderId = o.id
          WHERE o.tenantId = ?
            AND o.status = 'delivered'
            AND (
              ROUND(COALESCE(o.totalAmount, 0), 2) <> ROUND(COALESCE(ar.amount, 0), 2)
              OR ROUND(COALESCE(o.paidAmount, 0), 2) <> ROUND(COALESCE(ar.paidAmount, 0), 2)
            )
          ORDER BY o.id`,
        [TENANT_ID]
      ),
      printedDispatchMissingStockOut: await fetchRows(
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
      ),
      completedDispatchMissingCashReport: await fetchRows(
        client,
        `SELECT ddo.id, ddo.dispatchDate, ddo.driverId
           FROM dy_dispatch_orders ddo
           LEFT JOIN dy_driver_cash_reports dcr
             ON dcr.tenantId = ddo.tenantId
            AND dcr.driverId = ddo.driverId
            AND dcr.reportDate = ddo.dispatchDate
          WHERE ddo.tenantId = ?
            AND ddo.status = 'completed'
            AND dcr.id IS NULL
          ORDER BY ddo.id`,
        [TENANT_ID]
      ),
      arRecordsOnUndeliveredOrders: await fetchRows(
        client,
        `SELECT o.id, o.orderNo, o.status, o.paymentStatus,
                ar.id AS arId, ar.amount AS arAmount, ar.paidAmount AS arPaidAmount, ar.status AS arStatus
           FROM dy_orders o
           JOIN dy_ar_records ar
             ON ar.tenantId = o.tenantId
            AND ar.orderId = o.id
          WHERE o.tenantId = ?
            AND o.status <> 'delivered'
          ORDER BY o.id`,
        [TENANT_ID]
      ),
      pendingReturnsTableExists: Number(pendingReturnsExists.count) > 0,
      pendingReturnsSummary: Number(pendingReturnsExists.count) > 0
        ? await fetchRows(
            client,
            `SELECT status, COUNT(*) AS count
               FROM dy_pending_returns
              WHERE tenantId = ?
              GROUP BY status
              ORDER BY status`,
            [TENANT_ID]
          )
        : [],
    },
  };

  console.log(JSON.stringify(summary, null, 2));
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

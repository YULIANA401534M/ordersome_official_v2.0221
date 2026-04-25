import mysql from "mysql2/promise";
import { ensureDyPendingReturnsTable } from "../server/routers/dayone/pendingReturns.ts";

const TENANT_ID = 90004;
const mode = process.argv.includes("--write-rollback") ? "write-rollback" : "readonly";
const shouldEnsurePendingReturns = process.argv.includes("--ensure-pending-returns");

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

async function queryOne(client, sql, params = []) {
  const [rows] = await client.execute(sql, params);
  return rows[0] ?? null;
}

async function main() {
  const client = await mysql.createConnection(connectionConfig());

  if (shouldEnsurePendingReturns) {
    await ensureDyPendingReturnsTable(client);
  }

  const meta = await queryOne(
    client,
    "SELECT DATABASE() AS db, CURRENT_USER() AS currentUser, USER() AS loginUser, VERSION() AS version"
  );

  const [tenantRows] = await client.execute(
    "SELECT id, name, slug, plan, isActive FROM tenants WHERE id = ? LIMIT 1",
    [TENANT_ID]
  );

  const [dyTables] = await client.execute(
    `SELECT table_name AS tableName, table_rows AS approxRows
       FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name LIKE 'dy\\_%'
      ORDER BY table_name`
  );

  const coreTables = [
    "dy_products",
    "dy_inventory",
    "dy_stock_movements",
    "dy_purchase_receipts",
    "dy_ap_records",
    "dy_orders",
    "dy_order_items",
    "dy_dispatch_orders",
    "dy_dispatch_items",
    "dy_pending_returns",
    "dy_ar_records",
    "dy_driver_cash_reports",
    "dy_customers",
    "dy_drivers",
  ];

  const tableCounts = [];
  for (const tableName of coreTables) {
    const exists = dyTables.some((table) => table.tableName === tableName);
    if (!exists) {
      tableCounts.push({ tableName, exists: false, count: null });
      continue;
    }
    const count = await queryOne(client, `SELECT COUNT(*) AS count FROM ${tableName} WHERE tenantId = ?`, [
      TENANT_ID,
    ]);
    tableCounts.push({ tableName, exists: true, count: Number(count.count) });
  }

  const safeWriteCandidates = [
    "dy_pending_returns",
    "dy_stock_movements",
    "dy_ap_records",
    "dy_ar_records",
    "dy_driver_cash_reports",
  ].filter((tableName) => tableCounts.find((row) => row.tableName === tableName)?.exists);

  const result = {
    connection: {
      db: meta.db,
      currentUser: meta.currentUser,
      loginUser: meta.loginUser,
      version: meta.version,
    },
    tenant: tenantRows[0] ?? null,
    dyTableCount: dyTables.length,
    tableCounts,
    safeWriteCandidates,
    writeRollback: null,
  };

  if (mode === "write-rollback") {
    if (!dyTables.some((table) => table.tableName === "dy_pending_returns")) {
      throw new Error("dy_pending_returns table does not exist. Re-run with --ensure-pending-returns first.");
    }

    const product = await queryOne(
      client,
      "SELECT id, name FROM dy_products WHERE tenantId = ? ORDER BY id LIMIT 1",
      [TENANT_ID]
    );

    if (!product) {
      result.writeRollback = {
        ok: false,
        reason: "No dy_products row exists for tenant 90004, so rollback insert was skipped.",
      };
    } else {
      await client.beginTransaction();
      try {
        const [insertResult] = await client.execute(
          `INSERT INTO dy_pending_returns
             (tenantId, dispatchOrderId, productId, qty, status, source, note, reportedAt, createdAt, updatedAt)
           VALUES (?, 0, ?, 0.01, 'pending', 'codex_live_verify', 'rollback-only write connectivity test', NOW(), NOW(), NOW())`,
          [TENANT_ID, product.id]
        );
        await client.rollback();

        const persisted = await queryOne(
          client,
          "SELECT COUNT(*) AS count FROM dy_pending_returns WHERE id = ? AND tenantId = ?",
          [insertResult.insertId, TENANT_ID]
        ).catch(() => ({ count: "unknown" }));

        result.writeRollback = {
          ok: true,
          insertedIdRolledBack: Number(insertResult.insertId),
          productUsed: product,
          persistedAfterRollback: Number(persisted.count),
        };
      } catch (error) {
        await client.rollback();
        throw error;
      }
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

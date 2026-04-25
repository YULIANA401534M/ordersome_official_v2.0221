import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const TENANT_ID = 90004;
const MANAGER_EMAIL = "codex-manager@dayone.local";
const DRIVER_EMAIL = "codex-driver@dayone.local";
const MANAGER_PASSWORD = "CodexMgr!2026";
const DRIVER_PASSWORD = "CodexDrv!2026";

function connectionConfig() {
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

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = await mysql.createConnection(connectionConfig());

  async function upsertUser({ email, name, role, password, phone }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const [rows] = await client.execute(
      `SELECT id FROM users WHERE tenantId=? AND email=? LIMIT 1`,
      [TENANT_ID, email]
    );
    const existing = rows[0];
    if (existing) {
      await client.execute(
        `UPDATE users
            SET openId=?, name=?, phone=?, role=?, passwordHash=?, loginMethod='password',
                status='active', updatedAt=NOW(), lastSignedIn=NOW()
          WHERE id=? AND tenantId=?`,
        [email, name, phone ?? null, role, passwordHash, existing.id, TENANT_ID]
      );
      return Number(existing.id);
    }

    const [result] = await client.execute(
      `INSERT INTO users
       (tenantId, openId, name, email, phone, role, passwordHash, loginMethod, status, createdAt, updatedAt, lastSignedIn)
       VALUES (?,?,?,?,?,?,?,'password','active',NOW(),NOW(),NOW())`,
      [TENANT_ID, email, name, email, phone ?? null, role, passwordHash]
    );
    return Number(result.insertId);
  }

  const managerUserId = await upsertUser({
    email: MANAGER_EMAIL,
    name: "Codex 測試管理員",
    role: "manager",
    password: MANAGER_PASSWORD,
    phone: "0911222333",
  });

  const driverUserId = await upsertUser({
    email: DRIVER_EMAIL,
    name: "Codex 測試司機",
    role: "driver",
    password: DRIVER_PASSWORD,
    phone: "0911444555",
  });

  const [driverRows] = await client.execute(
    `SELECT id FROM dy_drivers WHERE tenantId=? AND userId=? LIMIT 1`,
    [TENANT_ID, driverUserId]
  );

  let driverId;
  if (driverRows[0]) {
    driverId = Number(driverRows[0].id);
    await client.execute(
      `UPDATE dy_drivers
          SET name=?, phone=?, vehicleNo=?, status='active', updatedAt=NOW()
        WHERE id=? AND tenantId=?`,
      ["Codex 測試司機", "0911444555", "COD-2601", driverId, TENANT_ID]
    );
  } else {
    const [driverInsert] = await client.execute(
      `INSERT INTO dy_drivers
       (tenantId, userId, name, phone, lineId, vehicleNo, status, createdAt, updatedAt)
       VALUES (?,?,?,?,?,?,'active',NOW(),NOW())`,
      [TENANT_ID, driverUserId, "Codex 測試司機", "0911444555", null, "COD-2601"]
    );
    driverId = Number(driverInsert.insertId);
  }

  console.log(
    JSON.stringify(
      {
        manager: { email: MANAGER_EMAIL, password: MANAGER_PASSWORD, userId: managerUserId },
        driver: { email: DRIVER_EMAIL, password: DRIVER_PASSWORD, userId: driverUserId, driverId },
      },
      null,
      2
    )
  );

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

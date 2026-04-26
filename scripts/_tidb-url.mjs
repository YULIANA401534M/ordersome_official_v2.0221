import "dotenv/config";

export function mysqlConfigFromDatabaseUrl() {
  const raw = process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL or TIDB_DATABASE_URL is required");
  }

  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port || 4000),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };
}

export function redactedConnectionLabel(config) {
  const userPrefix = String(config.user || "").split(".")[0] || "unknown";
  return `${userPrefix}@${config.host}:${config.port}/${config.database}`;
}

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  "server/_core/trpc.ts",
  "server/routers.ts",
  "server/routers",
  "client/src/App.tsx",
  "client/src/components/AdminDashboardLayout.tsx",
  "client/src/pages/dashboard",
  "shared/access-control.ts",
];

function walk(entry) {
  const full = path.join(root, entry);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((dirent) => {
    const child = path.join(entry, dirent.name);
    if (dirent.isDirectory()) return walk(child);
    if (!/\.(ts|tsx)$/.test(dirent.name)) return [];
    return [path.join(root, child)];
  });
}

const files = targets.flatMap(walk);
const procedurePatterns = [
  "publicProcedure",
  "protectedProcedure",
  "tenantProcedure",
  "adminProcedure",
  "superAdminProcedure",
  "franchiseeOrAdminProcedure",
  "driverProcedure",
  "dyAdminProcedure",
  "portalProcedure",
];

const rolePatterns = [
  "super_admin",
  "manager",
  "franchisee",
  "staff",
  "store_manager",
  "driver",
  "portal_customer",
];

const summary = {
  filesScanned: files.length,
  procedures: Object.fromEntries(procedurePatterns.map((key) => [key, 0])),
  roles: Object.fromEntries(rolePatterns.map((key) => [key, 0])),
  tenantLiterals: {},
  localMiddlewareDefinitions: [],
  hardCodedPermissionChecks: [],
};

for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  for (const key of procedurePatterns) {
    summary.procedures[key] += (text.match(new RegExp(`\\b${key}\\b`, "g")) || []).length;
  }
  for (const key of rolePatterns) {
    summary.roles[key] += (text.match(new RegExp(key, "g")) || []).length;
  }
  for (const match of text.matchAll(/tenantId\s*(?:===|!==|=|:)\s*(\d+)/g)) {
    const tenantId = match[1];
    summary.tenantLiterals[tenantId] = (summary.tenantLiterals[tenantId] || 0) + 1;
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/(const|function)\s+\w*Procedure\b/.test(line) || /protectedProcedure\.use/.test(line)) {
      summary.localMiddlewareDefinitions.push({ file: rel, line: index + 1, text: line.trim() });
    }
    if (/hasPermission\(|permissions|has_procurement_access|moduleKey/.test(line)) {
      summary.hardCodedPermissionChecks.push({ file: rel, line: index + 1, text: line.trim() });
    }
  });
}

console.log(JSON.stringify(summary, null, 2));

import { z } from "zod";
import { router, adminProcedure, superAdminProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";



export const dyModulesRouter = router({
  // Get modules for a tenant
  list: adminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM tenant_modules WHERE tenantId = ? ORDER BY moduleKey`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  // Toggle module on/off (super_admin only)
  toggle: superAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      moduleKey: z.string(),
      isEnabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `INSERT INTO tenant_modules (tenantId, moduleKey, isEnabled, createdAt, updatedAt)
         VALUES (?,?,?,NOW(),NOW())
         ON DUPLICATE KEY UPDATE isEnabled=?, updatedAt=NOW()`,
        [input.tenantId, input.moduleKey, input.isEnabled, input.isEnabled]
      );
      return { success: true };
    }),

  // Check if a specific module is enabled
  isEnabled: adminProcedure
    .input(z.object({ tenantId: z.number(), moduleKey: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return false;
      const [rowData] = await (db as any).$client.execute(
        `SELECT isEnabled FROM tenant_modules WHERE tenantId=? AND moduleKey=?`,
        [input.tenantId, input.moduleKey]
      ) as any;
      const row = (rowData as any[])[0];
      return row?.isEnabled === 1 || row?.isEnabled === true;
    }),

  // Super admin: list all tenants with their modules (JOIN module_definitions for label/category)
  allTenantModules: superAdminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT t.id, t.name, t.slug, t.plan, t.isActive,
                tm.moduleKey,
                COALESCE(md.label, tm.moduleKey)   AS label,
                COALESCE(md.category, 'other')     AS category,
                COALESCE(md.sortOrder, 0)          AS sortOrder,
                tm.isEnabled
         FROM tenants t
         JOIN tenant_modules tm ON tm.tenantId = t.id
         LEFT JOIN module_definitions md ON md.moduleKey = tm.moduleKey
         ORDER BY t.id, md.category, md.sortOrder`
      );
      return rows as any[];
    }),

  // 取得所有模組定義（super_admin 用）
  allDefinitions: superAdminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM module_definitions ORDER BY category, sortOrder`
      );
      return rows as { moduleKey: string; label: string; category: string; description: string | null; sortOrder: number }[];
    }),

  // 取得特定租戶已開通模組（含定義資訊）
  listWithDefinitions: adminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT md.moduleKey, md.label, md.category, md.sortOrder,
                COALESCE(tm.isEnabled, 0) AS isEnabled
         FROM module_definitions md
         LEFT JOIN tenant_modules tm
           ON tm.moduleKey = md.moduleKey AND tm.tenantId = ?
         ORDER BY md.category, md.sortOrder`,
        [input.tenantId]
      );
      return rows as { moduleKey: string; label: string; category: string; sortOrder: number; isEnabled: boolean }[];
    }),
});

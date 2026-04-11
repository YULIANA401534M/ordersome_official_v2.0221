import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";

const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要超級管理員權限' });
  }
  return next({ ctx });
});

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

export const dyModulesRouter = router({
  // Get modules for a tenant
  list: dyAdminProcedure
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
  isEnabled: dyAdminProcedure
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
                md.moduleKey, md.label, md.category, md.sortOrder,
                COALESCE(tm.isEnabled, 0) AS isEnabled
         FROM tenants t
         CROSS JOIN module_definitions md
         LEFT JOIN tenant_modules tm
           ON tm.tenantId = t.id AND tm.moduleKey = md.moduleKey
         ORDER BY t.id, md.category, md.sortOrder`
      );
      if ((rows as any[]).length > 0) {
        console.log('[allTenantModules] first row keys:', Object.keys((rows as any[])[0]));
        console.log('[allTenantModules] first row:', (rows as any[])[0]);
      }
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
  listWithDefinitions: dyAdminProcedure
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

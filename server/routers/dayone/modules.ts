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
      const [[row]] = await (db as any).$client.execute(
        `SELECT isEnabled FROM tenant_modules WHERE tenantId=? AND moduleKey=?`,
        [input.tenantId, input.moduleKey]
      ) as any;
      return row?.isEnabled === 1 || row?.isEnabled === true;
    }),

  // Super admin: list all tenants with their modules
  allTenantModules: superAdminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT t.id, t.name, t.slug, t.plan, t.isActive,
                tm.moduleKey, tm.isEnabled
         FROM tenants t
         LEFT JOIN tenant_modules tm ON t.id = tm.tenantId
         ORDER BY t.id, tm.moduleKey`
      );
      return rows as any[];
    }),
});

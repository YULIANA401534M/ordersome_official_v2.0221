import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { tenantModules } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

export const dyProductsRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM dy_products WHERE tenantId = ? ORDER BY code`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  upsert: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      code: z.string().max(50),
      name: z.string().max(100),
      unit: z.string().max(20),
      defaultPrice: z.number().positive(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_products SET code=?, name=?, unit=?, defaultPrice=?, isActive=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
          [input.code, input.name, input.unit, input.defaultPrice, input.isActive, input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [res] = await client.execute(
          `INSERT INTO dy_products (tenantId, code, name, unit, defaultPrice, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?,NOW(),NOW())`,
          [input.tenantId, input.code, input.name, input.unit, input.defaultPrice, input.isActive]
        );
        return { id: (res as any).insertId };
      }
    }),

  delete: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `DELETE FROM dy_products WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),
});

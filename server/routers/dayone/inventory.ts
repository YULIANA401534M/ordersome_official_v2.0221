import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

export const dyInventoryRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT i.*, p.name as productName, p.code FROM dy_inventory i
         JOIN dy_products p ON i.productId = p.id
         WHERE i.tenantId = ? ORDER BY p.code`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  adjust: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      productId: z.number(),
      type: z.enum(['in', 'out', 'return', 'adjust']),
      qty: z.number(),
      batchNo: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      // Upsert inventory
      await client.execute(
        `INSERT INTO dy_inventory (tenantId, productId, currentQty, safetyQty, unit, updatedAt)
         SELECT ?, ?, 0, 0, p.unit, NOW() FROM dy_products p WHERE p.id=? AND p.tenantId=?
         ON DUPLICATE KEY UPDATE currentQty = currentQty + ?, updatedAt=NOW()`,
        [input.tenantId, input.productId, input.productId, input.tenantId,
         input.type === 'out' ? -Math.abs(input.qty) : Math.abs(input.qty)]
      );
      // Log movement
      await client.execute(
        `INSERT INTO dy_stock_movements (tenantId, type, productId, qty, batchNo, operatorId, note, createdAt)
         VALUES (?,?,?,?,?,?,?,NOW())`,
        [input.tenantId, input.type, input.productId, input.qty, input.batchNo ?? null, ctx.user.id, input.note ?? null]
      );
      return { success: true };
    }),

  movements: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), productId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      let sql = `SELECT m.*, p.name as productName, p.code FROM dy_stock_movements m
                 JOIN dy_products p ON m.productId = p.id
                 WHERE m.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.productId) { sql += ' AND m.productId = ?'; params.push(input.productId); }
      sql += ' ORDER BY m.createdAt DESC LIMIT ?';
      params.push(input.limit);
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),
});

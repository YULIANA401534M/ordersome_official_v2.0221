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

export const dySuppliersRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM dy_suppliers WHERE tenantId = ? ORDER BY name`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  upsert: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      name: z.string().max(100),
      contact: z.string().max(100).optional(),
      phone: z.string().max(20).optional(),
      address: z.string().optional(),
      bankAccount: z.string().max(50).optional(),
      status: z.enum(['active', 'inactive']).default('active'),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_suppliers SET name=?, contact=?, phone=?, address=?, bankAccount=?, status=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
          [input.name, input.contact ?? null, input.phone ?? null, input.address ?? null, input.bankAccount ?? null, input.status, input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [res] = await client.execute(
          `INSERT INTO dy_suppliers (tenantId, name, contact, phone, address, bankAccount, status, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,NOW(),NOW())`,
          [input.tenantId, input.name, input.contact ?? null, input.phone ?? null, input.address ?? null, input.bankAccount ?? null, input.status]
        );
        return { id: (res as any).insertId };
      }
    }),

  toggleStatus: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number(), status: z.enum(['active', 'inactive']) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `UPDATE dy_suppliers SET status=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.status, input.id, input.tenantId]
      );
      return { success: true };
    }),

  delete: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `DELETE FROM dy_suppliers WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),
});

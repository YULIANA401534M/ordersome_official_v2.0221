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

export const dyDriversRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM dy_drivers WHERE tenantId = ? ORDER BY name`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  upsert: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      name: z.string().max(100),
      phone: z.string().max(20).optional(),
      lineId: z.string().max(128).optional(),
      districtIds: z.array(z.number()).optional(),
      vehicleNo: z.string().max(20).optional(),
      status: z.enum(['active', 'inactive']).default('active'),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      const districtIdsJson = input.districtIds ? JSON.stringify(input.districtIds) : null;
      if (input.id) {
        await client.execute(
          `UPDATE dy_drivers SET name=?, phone=?, lineId=?, districtIds=?, vehicleNo=?, status=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
          [input.name, input.phone ?? null, input.lineId ?? null, districtIdsJson, input.vehicleNo ?? null, input.status, input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [res] = await client.execute(
          `INSERT INTO dy_drivers (tenantId, name, phone, lineId, districtIds, vehicleNo, status, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,NOW(),NOW())`,
          [input.tenantId, input.name, input.phone ?? null, input.lineId ?? null, districtIdsJson, input.vehicleNo ?? null, input.status]
        );
        return { id: (res as any).insertId };
      }
    }),

  // Driver self-access: get own orders for the day
  myOrders: protectedProcedure
    .input(z.object({ tenantId: z.number(), deliveryDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      // Find driver by userId
      const [[driver]] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE tenantId=? AND userId=? AND status='active'`,
        [input.tenantId, ctx.user.id]
      ) as any;
      if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到司機資料' });
      const [rows] = await (db as any).$client.execute(
        `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         WHERE o.tenantId=? AND o.driverId=? AND o.deliveryDate=?
         ORDER BY o.id`,
        [input.tenantId, driver.id, input.deliveryDate]
      );
      return rows as any[];
    }),
});

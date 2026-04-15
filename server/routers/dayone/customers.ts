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

export const dyCustomersRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT c.*, d.name as districtName 
         FROM dy_customers c 
         LEFT JOIN dy_districts d ON c.districtId = d.id 
         WHERE c.tenantId = ? ORDER BY c.name`,
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
      address: z.string().optional(),
      districtId: z.number().optional(),
      paymentType: z.enum(['monthly', 'weekly', 'cash']).default('monthly'),
      creditLimit: z.number().default(0),
      status: z.enum(['active', 'suspended']).default('active'),
      customerLevel: z.string().optional(),
      settlementCycle: z.string().optional(),
      overdueDays: z.number().optional(),
      loginEmail: z.string().optional(),
      isPortalActive: z.boolean().optional(),
      portalNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_customers SET name=?, phone=?, address=?, districtId=?, paymentType=?, creditLimit=?, status=?,
           customerLevel=?, settlementCycle=?, overdueDays=?, loginEmail=?, isPortalActive=?, portalNote=?, updatedAt=NOW()
           WHERE id=? AND tenantId=?`,
          [input.name, input.phone ?? null, input.address ?? null, input.districtId ?? null, input.paymentType,
           input.creditLimit, input.status,
           input.customerLevel ?? 'retail', input.settlementCycle ?? 'monthly', input.overdueDays ?? 30,
           input.loginEmail ?? null, input.isPortalActive ? 1 : 0, input.portalNote ?? null,
           input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [result] = await client.execute(
          `INSERT INTO dy_customers (tenantId, name, phone, address, districtId, paymentType, creditLimit, outstandingAmount, status,
           customerLevel, settlementCycle, overdueDays, loginEmail, isPortalActive, portalNote, createdAt, updatedAt)
           VALUES (?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,NOW(),NOW())`,
          [input.tenantId, input.name, input.phone ?? null, input.address ?? null, input.districtId ?? null,
           input.paymentType, input.creditLimit, input.status,
           input.customerLevel ?? 'retail', input.settlementCycle ?? 'monthly', input.overdueDays ?? 30,
           input.loginEmail ?? null, input.isPortalActive ? 1 : 0, input.portalNote ?? null]
        );
        return { id: (result as any).insertId };
      }
    }),

  delete: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      // 檢查該客戶是否有關聯訂單
      const [orderRows] = await client.execute(
        `SELECT COUNT(*) as cnt FROM dy_orders WHERE customerId=? AND tenantId=?`,
        [input.id, input.tenantId]
      ) as any;
      const orderCount = Number((orderRows as any[])[0]?.cnt ?? 0);
      if (orderCount > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `此客戶有 ${orderCount} 筆訂單，無法刪除` });
      }
      await client.execute(
        `DELETE FROM dy_customers WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),

  getCustomerPrices: dyAdminProcedure
    .input(z.object({ customerId: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT cp.*, p.name as productName, p.code, p.unit 
         FROM dy_customer_prices cp 
         JOIN dy_products p ON cp.productId = p.id 
         WHERE cp.customerId = ? AND cp.tenantId = ? 
         ORDER BY p.code`,
        [input.customerId, input.tenantId]
      );
      return rows as any[];
    }),

  setCustomerPrice: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      productId: z.number(),
      price: z.number().positive(),
      effectiveDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [result] = await (db as any).$client.execute(
        `INSERT INTO dy_customer_prices (tenantId, customerId, productId, price, effectiveDate, createdAt) VALUES (?,?,?,?,?,NOW())`,
        [input.tenantId, input.customerId, input.productId, input.price, input.effectiveDate]
      );
      return { id: (result as any).insertId };
    }),
});

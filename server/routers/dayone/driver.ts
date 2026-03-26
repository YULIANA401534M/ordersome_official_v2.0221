import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { storagePut } from "../../storage";

// All procedures require driver or admin role
const driverProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowed = ['driver', 'manager', 'super_admin'];
  if (!allowed.includes(ctx.user.role ?? '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要司機權限' });
  }
  return next({ ctx });
});

export const dyDriverRouter = router({
  // 1. Get today's orders for the logged-in driver
  getMyTodayOrders: driverProcedure
    .input(z.object({
      tenantId: z.number(),
      deliveryDate: z.string().optional(), // YYYY-MM-DD, defaults to today
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const date = input.deliveryDate ?? new Date().toISOString().slice(0, 10);
      // Find driver record linked to this user
      const [_r_driver] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [ctx.user.id, input.tenantId]
      ) as any;
      if (!driver) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到司機資料，請聯絡管理員' });
      const [rows] = await (db as any).$client.execute(
        `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone,
                dist.name as districtName
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         LEFT JOIN dy_districts dist ON o.districtId = dist.id
         WHERE o.tenantId = ? AND o.driverId = ? AND o.deliveryDate = ?
         ORDER BY o.id ASC`,
        [input.tenantId, driver.id, date]
      );
      return rows as any[];
    }),

  // 2. Update order status (driver updates: picked → delivering → delivered)
  updateOrderStatus: driverProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      status: z.enum(['picked', 'delivering', 'delivered', 'returned']),
      driverNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      // Verify this order belongs to the driver
      const [_r_driver] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [ctx.user.id, input.tenantId]
      ) as any;
      if (!driver) throw new TRPCError({ code: 'FORBIDDEN', message: '找不到司機資料' });
      await (db as any).$client.execute(
        `UPDATE dy_orders SET status=?, driverNote=COALESCE(?, driverNote), updatedAt=NOW()
         WHERE id=? AND tenantId=? AND driverId=?`,
        [input.status, input.driverNote ?? null, input.id, input.tenantId, driver.id]
      );
      return { success: true };
    }),

  // 3. Record cash payment collected by driver
  recordCashPayment: driverProcedure
    .input(z.object({
      orderId: z.number(),
      tenantId: z.number(),
      cashCollected: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [_r_driver] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [ctx.user.id, input.tenantId]
      ) as any;
      if (!driver) throw new TRPCError({ code: 'FORBIDDEN', message: '找不到司機資料' });
      await (db as any).$client.execute(
        `UPDATE dy_orders
         SET cashCollected=?, paidAmount=?, paymentStatus=IF(?>=totalAmount,'paid','partial'), updatedAt=NOW()
         WHERE id=? AND tenantId=? AND driverId=?`,
        [input.cashCollected, input.cashCollected, input.cashCollected, input.orderId, input.tenantId, driver.id]
      );
      return { success: true };
    }),

  // 4. Submit work log at end of day
  submitWorkLog: driverProcedure
    .input(z.object({
      tenantId: z.number(),
      workDate: z.string(), // YYYY-MM-DD
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [_r_driver] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [ctx.user.id, input.tenantId]
      ) as any;
      if (!driver) throw new TRPCError({ code: 'FORBIDDEN', message: '找不到司機資料' });
      // Calculate totals for the day
      const [_r_summary] = await (db as any).$client.execute(
        `SELECT COUNT(*) as totalOrders, COALESCE(SUM(cashCollected),0) as totalCollected
         FROM dy_orders WHERE tenantId=? AND driverId=? AND deliveryDate=? AND status='delivered'`,
        [input.tenantId, driver.id, input.workDate]
      ) as any;
      // Upsert work log
      await (db as any).$client.execute(
        `INSERT INTO dy_work_logs (tenantId, driverId, workDate, startTime, endTime, totalOrders, totalCollected, note, createdAt)
         VALUES (?,?,?,?,?,?,?,?,NOW())
         ON DUPLICATE KEY UPDATE startTime=VALUES(startTime), endTime=VALUES(endTime),
         totalOrders=VALUES(totalOrders), totalCollected=VALUES(totalCollected), note=VALUES(note)`,
        [input.tenantId, driver.id, input.workDate, input.startTime ?? null, input.endTime ?? null,
         summary?.totalOrders ?? 0, summary?.totalCollected ?? 0, input.note ?? null]
      );
      return { success: true, totalOrders: summary?.totalOrders ?? 0, totalCollected: summary?.totalCollected ?? 0 };
    }),

  // 5. Upload signature image and attach to order
  uploadSignature: driverProcedure
    .input(z.object({
      orderId: z.number(),
      tenantId: z.number(),
      imageBase64: z.string(), // base64 data URL
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [_r_driver] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [ctx.user.id, input.tenantId]
      ) as any;
      if (!driver) throw new TRPCError({ code: 'FORBIDDEN', message: '找不到司機資料' });
      // Convert base64 to buffer
      const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileKey = `signatures/${input.tenantId}/${input.orderId}-${Date.now()}.png`;
      const { url } = await storagePut(fileKey, buffer, 'image/png');
      // Save signature URL to order and delivery_signatures table
      await (db as any).$client.execute(
        `UPDATE dy_orders SET signatureUrl=?, updatedAt=NOW() WHERE id=? AND tenantId=? AND driverId=?`,
        [url, input.orderId, input.tenantId, driver.id]
      );
      await (db as any).$client.execute(
        `INSERT INTO dy_delivery_signatures (tenantId, orderId, driverId, signatureUrl, signedAt)
         VALUES (?,?,?,?,NOW())`,
        [input.tenantId, input.orderId, driver.id, url]
      );
      return { success: true, signatureUrl: url };
    }),

  // Get my work log for a specific date
  getMyWorkLog: driverProcedure
    .input(z.object({
      tenantId: z.number(),
      workDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [_r_driver] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
        [ctx.user.id, input.tenantId]
      ) as any;
      if (!driver) return null;
      const [_r_log] = await (db as any).$client.execute(
        `SELECT * FROM dy_work_logs WHERE driverId=? AND workDate=? AND tenantId=? LIMIT 1`,
        [driver.id, input.workDate, input.tenantId]
      ) as any;
      return log ?? null;
    }),
});

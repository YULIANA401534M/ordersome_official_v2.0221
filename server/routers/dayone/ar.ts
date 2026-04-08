import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";

const TENANT_ID = 90004;

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const dyArRouter = router({
  // 1. 所有客戶應收帳款摘要
  getARSummary: dyAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "DB unavailable",
      });

    const [rows] = await (db as any).$client.execute(
      `SELECT
         c.id AS customerId,
         c.name AS customerName,
         c.phone,
         c.address,
         c.paymentType,
         c.creditLimit,
         c.outstandingAmount,
         COUNT(DISTINCT o.id) AS totalOrders,
         COALESCE(SUM(o.totalAmount), 0) AS totalAmount,
         COALESCE(SUM(o.paidAmount), 0) AS totalPaid,
         COALESCE(SUM(o.totalAmount) - SUM(o.paidAmount), 0) AS outstanding,
         SUM(
           CASE
             WHEN o.paymentStatus IN ('unpaid','partial')
               AND c.paymentType = 'weekly'
               AND o.deliveryDate < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             THEN 1
             WHEN o.paymentStatus IN ('unpaid','partial')
               AND c.paymentType = 'monthly'
               AND o.deliveryDate < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             THEN 1
             ELSE 0
           END
         ) AS overdueOrders,
         MAX(o.deliveryDate) AS lastOrderDate
       FROM dy_customers c
       LEFT JOIN dy_orders o ON o.customerId = c.id AND o.tenantId = ?
       WHERE c.tenantId = ?
         AND c.status = 'active'
       GROUP BY c.id, c.name, c.phone, c.address, c.paymentType, c.creditLimit, c.outstandingAmount
       ORDER BY outstanding DESC, c.name`,
      [TENANT_ID, TENANT_ID]
    );

    return rows as any[];
  }),

  // 2. 單一客戶所有訂單
  getCustomerOrders: dyAdminProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const [rows] = await (db as any).$client.execute(
        `SELECT
           id, orderNo, deliveryDate, totalAmount, paidAmount,
           paymentStatus, status, note, createdAt
         FROM dy_orders
         WHERE customerId = ? AND tenantId = ?
         ORDER BY deliveryDate DESC, id DESC`,
        [input.customerId, TENANT_ID]
      );

      return rows as any[];
    }),

  // 3. 記錄收款
  recordPayment: dyAdminProcedure
    .input(
      z.object({
        customerId: z.number(),
        orderId: z.number().optional(),
        amount: z.number().positive({ message: "金額必須大於 0" }),
        paymentMethod: z.enum(["cash", "transfer", "offset"]).default("cash"),
        note: z.string().optional(),
        collectedBy: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const client = (db as any).$client;
      const collectedBy = input.collectedBy ?? ctx.user.name ?? null;

      // 寫入 dy_payments
      const [payResult] = await client.execute(
        `INSERT INTO dy_payments (tenantId, customerId, orderId, amount, paymentMethod, note, collectedBy, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          TENANT_ID,
          input.customerId,
          input.orderId ?? null,
          input.amount,
          input.paymentMethod,
          input.note ?? null,
          collectedBy,
        ]
      );

      // 若有指定訂單，更新 paidAmount 與 paymentStatus
      if (input.orderId) {
        // 取得目前訂單資料
        const [orderRows] = await client.execute(
          `SELECT id, totalAmount, paidAmount FROM dy_orders WHERE id = ? AND tenantId = ?`,
          [input.orderId, TENANT_ID]
        );
        const order = (orderRows as any[])[0];
        if (order) {
          const newPaid =
            parseFloat(order.paidAmount) + parseFloat(String(input.amount));
          const total = parseFloat(order.totalAmount);
          let paymentStatus = "unpaid";
          if (newPaid >= total) {
            paymentStatus = "paid";
          } else if (newPaid > 0) {
            paymentStatus = "partial";
          }
          await client.execute(
            `UPDATE dy_orders SET paidAmount = ?, paymentStatus = ?, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
            [newPaid, paymentStatus, input.orderId, TENANT_ID]
          );
        }
      }

      // 重新計算 outstandingAmount（所有 unpaid+partial 訂單的未付金額加總）
      const [sumRows] = await client.execute(
        `SELECT COALESCE(SUM(totalAmount - paidAmount), 0) AS outstanding
         FROM dy_orders
         WHERE customerId = ? AND tenantId = ? AND paymentStatus IN ('unpaid', 'partial')`,
        [input.customerId, TENANT_ID]
      );
      const newOutstanding = parseFloat((sumRows as any[])[0]?.outstanding ?? 0);
      await client.execute(
        `UPDATE dy_customers SET outstandingAmount = ?, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [newOutstanding, input.customerId, TENANT_ID]
      );

      return { id: (payResult as any).insertId, success: true };
    }),

  // 4. 客戶收款歷史
  getPaymentHistory: dyAdminProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const [rows] = await (db as any).$client.execute(
        `SELECT p.*, o.orderNo
         FROM dy_payments p
         LEFT JOIN dy_orders o ON p.orderId = o.id
         WHERE p.customerId = ? AND p.tenantId = ?
         ORDER BY p.createdAt DESC`,
        [input.customerId, TENANT_ID]
      );

      return rows as any[];
    }),
});

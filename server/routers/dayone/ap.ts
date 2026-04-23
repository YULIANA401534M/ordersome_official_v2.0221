import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "沒有權限查看大永應付帳款" });
  }
  return next({ ctx });
});

export const dyApRouter = router({
  listPayables: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        status: z.string().optional(),
        supplierId: z.number().optional(),
        page: z.number().default(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }

      const offset = (input.page - 1) * 20;
      let sql = `SELECT ap.*, s.name AS supplierName
                 FROM dy_ap_records ap
                 JOIN dy_suppliers s ON ap.supplierId = s.id
                 WHERE ap.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (input.status) {
        sql += " AND ap.status = ?";
        params.push(input.status);
      }
      if (input.supplierId) {
        sql += " AND ap.supplierId = ?";
        params.push(input.supplierId);
      }
      sql += ` ORDER BY ap.dueDate ASC LIMIT 20 OFFSET ${offset}`;

      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  summary: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        supplierId: z.number().optional(),
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }

      const client = (db as any).$client;
      const baseDateExpr = "COALESCE(DATE(pr.receiptDate), DATE(ap.createdAt))";
      let where = "WHERE ap.tenantId = ?";
      const params: any[] = [input.tenantId];

      if (input.supplierId) {
        where += " AND ap.supplierId = ?";
        params.push(input.supplierId);
      }
      if (input.month) {
        where += ` AND DATE_FORMAT(${baseDateExpr}, '%Y-%m') = ?`;
        params.push(input.month);
      }

      const [overviewRows] = await client.execute(
        `SELECT
           COUNT(ap.id) AS payableCount,
           COUNT(DISTINCT ap.supplierId) AS supplierCount,
           COALESCE(SUM(ap.amount), 0) AS totalAmount,
           COALESCE(SUM(ap.paidAmount), 0) AS paidAmount,
           COALESCE(SUM(CASE WHEN ap.amount - ap.paidAmount > 0 THEN ap.amount - ap.paidAmount ELSE 0 END), 0) AS unpaidAmount,
           COALESCE(SUM(CASE WHEN ap.status = 'paid' THEN 1 ELSE 0 END), 0) AS paidCount,
           COALESCE(SUM(CASE WHEN ap.status <> 'paid' THEN 1 ELSE 0 END), 0) AS openCount,
           COALESCE(SUM(CASE WHEN ap.status <> 'paid' AND ap.dueDate < CURDATE() THEN 1 ELSE 0 END), 0) AS overdueCount
         FROM dy_ap_records ap
         LEFT JOIN dy_purchase_receipts pr ON ap.purchaseReceiptId = pr.id
         ${where}`,
        params
      );

      const [supplierRows] = await client.execute(
        `SELECT
           ap.supplierId,
           s.name AS supplierName,
           COUNT(ap.id) AS payableCount,
           COUNT(DISTINCT ap.purchaseReceiptId) AS receiptCount,
           COALESCE(SUM(ap.amount), 0) AS totalAmount,
           COALESCE(SUM(ap.paidAmount), 0) AS paidAmount,
           COALESCE(SUM(CASE WHEN ap.amount - ap.paidAmount > 0 THEN ap.amount - ap.paidAmount ELSE 0 END), 0) AS unpaidAmount,
           COALESCE(SUM(CASE WHEN ap.status <> 'paid' AND ap.dueDate < CURDATE() THEN 1 ELSE 0 END), 0) AS overdueCount,
           MIN(${baseDateExpr}) AS firstReceiptDate,
           MAX(${baseDateExpr}) AS lastReceiptDate,
           MAX(ap.dueDate) AS latestDueDate
         FROM dy_ap_records ap
         JOIN dy_suppliers s ON ap.supplierId = s.id
         LEFT JOIN dy_purchase_receipts pr ON ap.purchaseReceiptId = pr.id
         ${where}
         GROUP BY ap.supplierId, s.name
         ORDER BY unpaidAmount DESC, lastReceiptDate DESC`,
        params
      );

      return {
        month: input.month ?? null,
        overview: (overviewRows as any[])[0] ?? {
          payableCount: 0,
          supplierCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          paidCount: 0,
          openCount: 0,
          overdueCount: 0,
        },
        suppliers: supplierRows as any[],
      };
    }),

  markPaid: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        paymentMethod: z.enum(["cash", "transfer"]),
        paidAmount: z.number().positive(),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }
      const client = (db as any).$client;

      const [rows] = await client.execute(`SELECT amount FROM dy_ap_records WHERE id=? AND tenantId=?`, [
        input.id,
        input.tenantId,
      ]);
      const record = (rows as any[])[0];
      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newStatus = input.paidAmount >= parseFloat(record.amount) ? "paid" : "partial";

      await client.execute(
        `UPDATE dy_ap_records
         SET paidAmount=?, paymentMethod=?, paidAt=NOW(), status=?, adminNote=?, updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [
          input.paidAmount,
          input.paymentMethod,
          newStatus,
          input.adminNote ?? null,
          input.id,
          input.tenantId,
        ]
      );
      return { success: true, status: newStatus };
    }),

  supplierPriceList: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        supplierId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }

      const [rows] = await (db as any).$client.execute(
        `SELECT sp.*, p.name AS productName
         FROM dy_supplier_prices sp
         JOIN dy_products p ON sp.productId = p.id
         WHERE sp.tenantId = ? AND sp.supplierId = ?
         ORDER BY sp.effectiveDate DESC`,
        [input.tenantId, input.supplierId]
      );
      return rows as any[];
    }),

  upsertSupplierPrice: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        supplierId: z.number(),
        productId: z.number(),
        price: z.number().positive(),
        effectiveDate: z.string(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }

      const [result] = await (db as any).$client.execute(
        `INSERT INTO dy_supplier_prices
         (tenantId, supplierId, productId, price, effectiveDate, note, createdAt)
         VALUES (?,?,?,?,?,?,NOW())`,
        [
          input.tenantId,
          input.supplierId,
          input.productId,
          input.price,
          input.effectiveDate,
          input.note ?? null,
        ]
      );
      return { id: (result as any).insertId, success: true };
    }),
});

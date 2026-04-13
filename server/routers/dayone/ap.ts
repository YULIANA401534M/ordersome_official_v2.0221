import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const dyApRouter = router({
  // 1. 應付帳款列表
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
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const offset = (input.page - 1) * 20;
      let sql = `SELECT ap.*, s.name AS supplierName
                 FROM dy_ap_records ap
                 JOIN dy_suppliers s ON ap.supplierId = s.id
                 WHERE ap.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (input.status) { sql += " AND ap.status = ?"; params.push(input.status); }
      if (input.supplierId) { sql += " AND ap.supplierId = ?"; params.push(input.supplierId); }
      sql += ` ORDER BY ap.dueDate ASC LIMIT 20 OFFSET ${offset}`;

      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 2. 標記付款
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
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [rows] = await client.execute(
        `SELECT amount FROM dy_ap_records WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const record = (rows as any[])[0];
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      const newStatus =
        input.paidAmount >= parseFloat(record.amount) ? "paid" : "partial";

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

  // 3. 供應商報價列表
  supplierPriceList: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        supplierId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

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

  // 4. 新增/更新供應商報價
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
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

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

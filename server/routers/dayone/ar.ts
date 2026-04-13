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

export const dyArRouter = router({
  // 1. 應收帳款列表（含自動標記逾期）
  listReceivables: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        status: z.string().optional(),
        customerId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 自動將逾期未付標記為 overdue
      await client.execute(
        `UPDATE dy_ar_records SET status='overdue', updatedAt=NOW()
         WHERE tenantId=? AND status='unpaid' AND dueDate < NOW()`,
        [input.tenantId]
      );

      const offset = (input.page - 1) * 20;
      let sql = `SELECT ar.*, c.name AS customerName
                 FROM dy_ar_records ar
                 JOIN dy_customers c ON ar.customerId = c.id
                 WHERE ar.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (input.status) { sql += " AND ar.status = ?"; params.push(input.status); }
      if (input.customerId) { sql += " AND ar.customerId = ?"; params.push(input.customerId); }
      if (input.startDate) { sql += " AND ar.dueDate >= ?"; params.push(input.startDate); }
      if (input.endDate) { sql += " AND ar.dueDate <= ?"; params.push(input.endDate); }
      sql += ` ORDER BY ar.dueDate ASC LIMIT 20 OFFSET ${offset}`;

      const [rows] = await client.execute(sql, params);
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
        `SELECT amount FROM dy_ar_records WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const record = (rows as any[])[0];
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      const newStatus =
        input.paidAmount >= parseFloat(record.amount) ? "paid" : "partial";

      await client.execute(
        `UPDATE dy_ar_records
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

  // 3. 新增管理員備註
  addAdminNote: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        adminNote: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        `UPDATE dy_ar_records SET adminNote=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.adminNote, input.id, input.tenantId]
      );
      return { success: true };
    }),

  // 4. 司機現金繳款報告列表
  listDriverCashReports: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        reportDate: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      let sql = `SELECT dcr.*, d.name AS driverName
                 FROM dy_driver_cash_reports dcr
                 JOIN dy_drivers d ON dcr.driverId = d.id
                 WHERE dcr.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (input.reportDate) { sql += " AND dcr.reportDate = ?"; params.push(input.reportDate); }
      if (input.status) { sql += " AND dcr.status = ?"; params.push(input.status); }
      sql += " ORDER BY dcr.reportDate DESC LIMIT 50";

      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 5. 建立司機現金繳款報告
  createDriverCashReport: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        driverId: z.number(),
        reportDate: z.string(),
        actualAmount: z.number(),
        driverNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 計算該日司機應收總額（派車項目的 cashCollected 總和）
      const [sumRows] = await client.execute(
        `SELECT COALESCE(SUM(di.cashCollected), 0) AS expectedAmount
         FROM dy_dispatch_items di
         JOIN dy_dispatch_orders ddo ON di.dispatchOrderId = ddo.id
         WHERE ddo.tenantId = ? AND ddo.driverId = ? AND ddo.dispatchDate = ?`,
        [input.tenantId, input.driverId, input.reportDate]
      );
      const expectedAmount = parseFloat((sumRows as any[])[0]?.expectedAmount ?? 0);
      const diff = input.actualAmount - expectedAmount;
      const status = Math.abs(diff) < 1 ? "normal" : "anomaly";

      const [result] = await client.execute(
        `INSERT INTO dy_driver_cash_reports
         (tenantId, driverId, reportDate, expectedAmount, actualAmount, diff, status, driverNote, createdAt)
         VALUES (?,?,?,?,?,?,?,?,NOW())`,
        [
          input.tenantId,
          input.driverId,
          input.reportDate,
          expectedAmount,
          input.actualAmount,
          diff,
          status,
          input.driverNote ?? null,
        ]
      );
      return { id: (result as any).insertId, expectedAmount, diff, status };
    }),

  // 6. 解除現金異常
  resolveAnomaly: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        adminNote: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        `UPDATE dy_driver_cash_reports
         SET status='resolved', adminNote=?, resolvedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [input.adminNote, input.id, input.tenantId]
      );
      return { success: true };
    }),

  // 7. 月結對帳單
  monthlyStatement: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        customerId: z.number(),
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const monthStr = String(input.month).padStart(2, "0");
      const startDate = `${input.year}-${monthStr}-01`;
      const endDate = `${input.year}-${monthStr}-31`;

      // 客戶基本資料
      const [custRows] = await client.execute(
        `SELECT * FROM dy_customers WHERE id=? AND tenantId=?`,
        [input.customerId, input.tenantId]
      );
      const customer = (custRows as any[])[0];
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "客戶不存在" });

      // 當月訂單
      const [orderRows] = await client.execute(
        `SELECT o.*, c.name AS customerName
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         WHERE o.tenantId=? AND o.customerId=?
           AND o.deliveryDate BETWEEN ? AND ?
           AND o.status != 'cancelled'
         ORDER BY o.deliveryDate ASC`,
        [input.tenantId, input.customerId, startDate, endDate]
      );
      const orders = orderRows as any[];

      // AR 記錄
      const [arRows] = await client.execute(
        `SELECT * FROM dy_ar_records
         WHERE tenantId=? AND customerId=?
           AND dueDate BETWEEN ? AND ?
         ORDER BY dueDate ASC`,
        [input.tenantId, input.customerId, startDate, endDate]
      );
      const arRecords = arRows as any[];

      // 空箱餘額
      const [boxRows] = await client.execute(
        `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
        [input.tenantId, input.customerId]
      );
      const boxBalance = (boxRows as any[])[0]?.currentBalance ?? 0;

      const totalAmount = orders.reduce((s: number, o: any) => s + parseFloat(o.totalAmount ?? 0), 0);
      const paidAmount = arRecords.reduce((s: number, r: any) => s + parseFloat(r.paidAmount ?? 0), 0);
      const unpaidAmount = totalAmount - paidAmount;

      return { customer, orders, totalAmount, paidAmount, unpaidAmount, boxBalance, arRecords };
    }),
});

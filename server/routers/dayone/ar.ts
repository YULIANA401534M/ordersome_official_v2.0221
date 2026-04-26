import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";


function normalizeArStatus(amount: number, paidAmount: number) {
  if (paidAmount >= amount) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
}

async function syncOrderPaymentFromAr(
  client: any,
  payload: {
    tenantId: number;
    orderId?: number | null;
    paidAmount: number;
    paymentStatus: string;
  }
) {
  if (!payload.orderId) return;

  await client.execute(
    `UPDATE dy_orders
     SET paidAmount=?, paymentStatus=?, updatedAt=NOW()
     WHERE id=? AND tenantId=?`,
    [payload.paidAmount, payload.paymentStatus, payload.orderId, payload.tenantId]
  );
}

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
        `SELECT orderId, amount, paidAmount FROM dy_ar_records WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const record = (rows as any[])[0];
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      const totalAmount = parseFloat(record.amount);
      const currentPaid = parseFloat(record.paidAmount ?? 0);
      const nextPaidAmount = Math.min(totalAmount, currentPaid + input.paidAmount);
      const newStatus = normalizeArStatus(totalAmount, nextPaidAmount);

      await client.execute(
        `UPDATE dy_ar_records
         SET paidAmount=?, paymentMethod=?, paidAt=NOW(), status=?, adminNote=?, updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [
          nextPaidAmount,
          input.paymentMethod,
          newStatus,
          input.adminNote ?? null,
          input.id,
          input.tenantId,
        ]
      );

      await syncOrderPaymentFromAr(client, {
        tenantId: input.tenantId,
        orderId: record.orderId == null ? null : Number(record.orderId),
        paidAmount: nextPaidAmount,
        paymentStatus: newStatus,
      });

      return { success: true, status: newStatus, paidAmount: nextPaidAmount };
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

  // 7a. 客戶逾期統計（按客戶聚合，含最早未付訂單日期、未付總額）
  customerOverdueStats: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      // 每個客戶的未付帳款總額 + 最早一筆未付訂單距今天數
      const [rows] = await client.execute(
        `SELECT
           c.id AS customerId,
           c.name AS customerName,
           c.settlementCycle,
           COUNT(ar.id) AS unpaidCount,
           COALESCE(SUM(ar.amount - ar.paidAmount), 0) AS unpaidAmount,
           DATEDIFF(NOW(), MIN(ar.dueDate)) AS daysSinceOldest
         FROM dy_customers c
         LEFT JOIN dy_ar_records ar
           ON ar.customerId = c.id AND ar.tenantId = c.tenantId AND ar.status IN ('unpaid', 'overdue', 'partial')
         WHERE c.tenantId = ?
         GROUP BY c.id, c.name, c.settlementCycle
         HAVING unpaidCount > 0
         ORDER BY daysSinceOldest DESC`,
        [input.tenantId]
      );
      return (rows as any[]).map((r: any) => {
        const days = Number(r.daysSinceOldest ?? 0);
        const cycle = r.settlementCycle;
        let threshold = 30;
        if (cycle === "weekly") threshold = 7;
        else if (cycle === "per_delivery" || cycle === "cash") threshold = 0;
        const isOverdue = days > threshold;
        return { ...r, daysSinceOldest: days, isOverdue, overdueDays: isOverdue ? days - threshold : 0 };
      });
    }),

  // 7b. 每月收款統計（含已收/未收）
  monthlyCollectionStats: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), year: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const year = input.year ?? new Date().getFullYear();
      const [rows] = await (db as any).$client.execute(
        `SELECT
           MONTH(dueDate) AS month,
           SUM(amount) AS totalAmount,
           SUM(CASE WHEN status = 'paid' THEN paidAmount ELSE 0 END) AS paidAmount,
           SUM(CASE WHEN status != 'paid' THEN (amount - paidAmount) ELSE 0 END) AS unpaidAmount
         FROM dy_ar_records
         WHERE tenantId = ? AND YEAR(dueDate) = ?
         GROUP BY MONTH(dueDate)
         ORDER BY month ASC`,
        [input.tenantId, year]
      );
      return rows as any[];
    }),

  // 8. 空箱流水帳（dy_box_transactions）
  listBoxTransactions: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        customerId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const offset = (input.page - 1) * 30;
      let sql = `SELECT bt.*, c.name AS customerName
                 FROM dy_box_transactions bt
                 JOIN dy_customers c ON bt.customerId = c.id
                 WHERE bt.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.customerId) { sql += " AND bt.customerId = ?"; params.push(input.customerId); }
      if (input.startDate) { sql += " AND DATE(bt.createdAt) >= ?"; params.push(input.startDate); }
      if (input.endDate) { sql += " AND DATE(bt.createdAt) <= ?"; params.push(input.endDate); }
      sql += ` ORDER BY bt.createdAt DESC LIMIT 30 OFFSET ${offset}`;
      const [rows] = await client.execute(sql, params);
      return rows as any[];
    }),

  // 9. 各客戶目前空箱餘額彙整
  boxBalanceSummary: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT bl.customerId, bl.currentBalance, c.name AS customerName
         FROM dy_box_ledger bl
         JOIN dy_customers c ON c.id = bl.customerId
         WHERE bl.tenantId = ?
         ORDER BY bl.currentBalance DESC`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  // 10. 帳齡分析（0-30 / 31-60 / 61-90 / 90+ 天分桶）
  agingReport: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const [rows] = await client.execute(
        `SELECT
           c.id AS customerId,
           c.name AS customerName,
           c.settlementCycle,
           c.creditLimit,
           COALESCE(SUM(ar.amount - ar.paidAmount), 0) AS totalUnpaid,
           COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), ar.dueDate) BETWEEN 0 AND 30 THEN ar.amount - ar.paidAmount ELSE 0 END), 0) AS bucket0_30,
           COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), ar.dueDate) BETWEEN 31 AND 60 THEN ar.amount - ar.paidAmount ELSE 0 END), 0) AS bucket31_60,
           COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), ar.dueDate) BETWEEN 61 AND 90 THEN ar.amount - ar.paidAmount ELSE 0 END), 0) AS bucket61_90,
           COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), ar.dueDate) > 90 THEN ar.amount - ar.paidAmount ELSE 0 END), 0) AS bucket90plus,
           MAX(DATEDIFF(NOW(), ar.dueDate)) AS maxOverdueDays
         FROM dy_customers c
         LEFT JOIN dy_ar_records ar
           ON ar.customerId = c.id AND ar.tenantId = c.tenantId
           AND ar.status IN ('unpaid','partial','overdue')
           AND ar.dueDate < NOW()
         WHERE c.tenantId = ?
         GROUP BY c.id, c.name, c.settlementCycle, c.creditLimit
         HAVING totalUnpaid > 0
         ORDER BY totalUnpaid DESC`,
        [input.tenantId]
      );
      return (rows as any[]).map((r: any) => ({
        ...r,
        totalUnpaid: Number(r.totalUnpaid),
        bucket0_30: Number(r.bucket0_30),
        bucket31_60: Number(r.bucket31_60),
        bucket61_90: Number(r.bucket61_90),
        bucket90plus: Number(r.bucket90plus),
        creditLimit: Number(r.creditLimit ?? 0),
        maxOverdueDays: Number(r.maxOverdueDays ?? 0),
        overCreditLimit: Number(r.creditLimit ?? 0) > 0 && Number(r.totalUnpaid) > Number(r.creditLimit ?? 0),
      }));
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

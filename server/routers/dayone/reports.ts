import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";

export const dyReportsRouter = router({
  // 每日彙總：同時讀 dy_orders（訂單數）和 dy_ar_records（帳務實況）
  dailySummary: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), date: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 訂單面：筆數、狀態分布
      const [orderRows] = await client.execute(
        `SELECT
           COUNT(*) AS totalOrders,
           SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS deliveredCount,
           SUM(CASE WHEN status='pending'   THEN 1 ELSE 0 END) AS pendingCount,
           SUM(CASE WHEN status='returned'  THEN 1 ELSE 0 END) AS returnedCount,
           SUM(totalAmount) AS orderTotalAmount
         FROM dy_orders WHERE tenantId=? AND deliveryDate=?`,
        [input.tenantId, input.date]
      );
      const orderSummary = (orderRows as any[])[0];

      // AR 面：已建立 AR 的應收、實收、未收（才是帳務真相）
      const [arRows] = await client.execute(
        `SELECT
           SUM(ar.amount)     AS arTotalAmount,
           SUM(ar.paidAmount) AS arTotalPaid,
           SUM(ar.amount - ar.paidAmount) AS arTotalUnpaid,
           SUM(CASE WHEN ar.paymentMethod='cash'     THEN ar.paidAmount ELSE 0 END) AS cashReceived,
           SUM(CASE WHEN ar.paymentMethod='transfer' THEN ar.paidAmount ELSE 0 END) AS transferReceived
         FROM dy_ar_records ar
         JOIN dy_orders o ON o.id = ar.orderId
         WHERE ar.tenantId=? AND o.deliveryDate=?`,
        [input.tenantId, input.date]
      );
      const arSummary = (arRows as any[])[0];

      // 每位司機的明細（訂單數 + AR 實收）
      const [byDriver] = await client.execute(
        `SELECT
           d.name AS driverName,
           COUNT(DISTINCT o.id) AS orderCount,
           SUM(o.totalAmount) AS orderAmount,
           COALESCE(SUM(ar.paidAmount), 0) AS actualCollected,
           COALESCE(SUM(ar.amount - ar.paidAmount), 0) AS unpaidAmount
         FROM dy_orders o
         LEFT JOIN dy_drivers d ON o.driverId = d.id
         LEFT JOIN dy_ar_records ar ON ar.orderId = o.id AND ar.tenantId = o.tenantId
         WHERE o.tenantId=? AND o.deliveryDate=?
         GROUP BY o.driverId, d.name`,
        [input.tenantId, input.date]
      );

      return { orderSummary, arSummary, byDriver };
    }),

  // 每月營收：從 AR 讀實際收款，另外保留訂單應收對比
  monthlyRevenue: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT
           DATE(o.deliveryDate) AS date,
           COUNT(DISTINCT o.id) AS orders,
           SUM(o.totalAmount) AS invoiced,
           COALESCE(SUM(ar.paidAmount), 0) AS collected
         FROM dy_orders o
         LEFT JOIN dy_ar_records ar ON ar.orderId = o.id AND ar.tenantId = o.tenantId
         WHERE o.tenantId=? AND YEAR(o.deliveryDate)=? AND MONTH(o.deliveryDate)=?
           AND o.status='delivered'
         GROUP BY DATE(o.deliveryDate)
         ORDER BY date`,
        [input.tenantId, input.year, input.month]
      );
      return rows as any[];
    }),

  // 司機日結對帳單（含訂單明細、現金繳報、備用箱）
  driverDailyStatement: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), driverId: z.number(), date: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 派車單基本資訊
      const [dispatchRows] = await client.execute(
        `SELECT do2.id, do2.status, do2.routeCode, d.name AS driverName
         FROM dy_dispatch_orders do2
         JOIN dy_drivers d ON d.id = do2.driverId
         WHERE do2.tenantId=? AND do2.driverId=? AND do2.dispatchDate=?
         LIMIT 1`,
        [input.tenantId, input.driverId, input.date]
      );
      const dispatch = (dispatchRows as any[])[0] ?? null;

      // 訂單明細（含 AR 狀態）
      const [orderRows] = await client.execute(
        `SELECT
           o.id, o.orderNo, o.totalAmount, o.paidAmount, o.paymentStatus, o.status AS orderStatus,
           c.name AS customerName, c.settlementCycle,
           ar.paidAmount AS arPaid, ar.status AS arStatus, ar.paymentMethod
         FROM dy_orders o
         JOIN dy_customers c ON c.id = o.customerId
         LEFT JOIN dy_ar_records ar ON ar.orderId = o.id AND ar.tenantId = o.tenantId
         WHERE o.tenantId=? AND o.driverId=? AND o.deliveryDate=?
         ORDER BY o.id ASC`,
        [input.tenantId, input.driverId, input.date]
      );

      // 現金繳款報告
      const [cashReportRows] = await client.execute(
        `SELECT * FROM dy_driver_cash_reports
         WHERE tenantId=? AND driverId=? AND reportDate=? LIMIT 1`,
        [input.tenantId, input.driverId, input.date]
      );
      const cashReport = (cashReportRows as any[])[0] ?? null;

      // 備用箱（這張派車單）
      const [extraRows] = await client.execute(
        `SELECT ei.qty, ei.note, p.name AS productName, p.unit
         FROM dy_dispatch_extra_items ei
         JOIN dy_products p ON p.id = ei.productId
         WHERE ei.dispatchOrderId=? AND ei.tenantId=?`,
        [dispatch?.id ?? 0, input.tenantId]
      );

      // 補單動用備用箱量
      const [suppRows] = await client.execute(
        `SELECT oi.productId, p.name AS productName, SUM(oi.qty) AS suppQty
         FROM dy_dispatch_items di
         JOIN dy_orders o ON o.id = di.orderId
         JOIN dy_order_items oi ON oi.orderId = o.id
         JOIN dy_products p ON p.id = oi.productId
         WHERE di.dispatchOrderId=? AND di.tenantId=? AND o.orderType='supplement'
         GROUP BY oi.productId, p.name`,
        [dispatch?.id ?? 0, input.tenantId]
      );

      // 已回庫量
      const [returnRows] = await client.execute(
        `SELECT pr.productId, p.name AS productName, SUM(pr.qty) AS returnedQty
         FROM dy_pending_returns pr
         JOIN dy_products p ON p.id = pr.productId
         WHERE pr.dispatchOrderId=? AND pr.tenantId=?
         GROUP BY pr.productId, p.name`,
        [dispatch?.id ?? 0, input.tenantId]
      );

      return {
        dispatch,
        orders: orderRows as any[],
        cashReport,
        extraItems: extraRows as any[],
        suppItems: suppRows as any[],
        returnItems: returnRows as any[],
      };
    }),

  // 每日跨司機收款彙總（管理員用）
  dailyCashSummary: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), date: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [rows] = await client.execute(
        `SELECT
           d.id AS driverId,
           d.name AS driverName,
           do2.id AS dispatchOrderId,
           do2.routeCode,
           do2.status AS dispatchStatus,
           COALESCE(SUM(CASE WHEN c.settlementCycle='per_delivery' THEN ar.amount ELSE 0 END), 0) AS perDeliveryAR,
           COALESCE(SUM(CASE WHEN c.settlementCycle='per_delivery' THEN ar.paidAmount ELSE 0 END), 0) AS perDeliveryPaid,
           dcr.expectedAmount AS reportExpected,
           dcr.actualAmount   AS reportActual,
           dcr.diff           AS reportDiff,
           dcr.status         AS reportStatus
         FROM dy_dispatch_orders do2
         JOIN dy_drivers d ON d.id = do2.driverId
         LEFT JOIN dy_dispatch_items di ON di.dispatchOrderId = do2.id
         LEFT JOIN dy_orders o ON o.id = di.orderId
         LEFT JOIN dy_customers c ON c.id = o.customerId
         LEFT JOIN dy_ar_records ar ON ar.orderId = o.id AND ar.tenantId = do2.tenantId
         LEFT JOIN dy_driver_cash_reports dcr
           ON dcr.driverId = do2.driverId AND dcr.reportDate = do2.dispatchDate AND dcr.tenantId = do2.tenantId
         WHERE do2.tenantId=? AND do2.dispatchDate=?
         GROUP BY d.id, d.name, do2.id, do2.routeCode, do2.status,
                  dcr.expectedAmount, dcr.actualAmount, dcr.diff, dcr.status`,
        [input.tenantId, input.date]
      );
      return rows as any[];
    }),

  // 月結對帳單（給特定客戶、特定月份）
  monthlyStatement: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), customerId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [customerRows] = await client.execute(
        `SELECT id, name, phone, address, settlementCycle, overdueDays
         FROM dy_customers WHERE id=? AND tenantId=? LIMIT 1`,
        [input.customerId, input.tenantId]
      );
      const customer = (customerRows as any[])[0];

      const [orderRows] = await client.execute(
        `SELECT
           o.id, o.orderNo, o.deliveryDate, o.totalAmount, o.paidAmount, o.paymentStatus,
           ar.amount AS arAmount, ar.paidAmount AS arPaid, ar.status AS arStatus, ar.dueDate
         FROM dy_orders o
         LEFT JOIN dy_ar_records ar ON ar.orderId = o.id AND ar.tenantId = o.tenantId
         WHERE o.tenantId=? AND o.customerId=?
           AND YEAR(o.deliveryDate)=? AND MONTH(o.deliveryDate)=?
           AND o.status IN ('delivered','picked','delivering')
         ORDER BY o.deliveryDate ASC`,
        [input.tenantId, input.customerId, input.year, input.month]
      );
      const orders = orderRows as any[];

      // 每筆訂單的品項
      const orderIds = orders.map((o: any) => Number(o.id));
      let itemsByOrder: Record<number, any[]> = {};
      if (orderIds.length > 0) {
        const placeholders = orderIds.map(() => "?").join(",");
        const [itemRows] = await client.execute(
          `SELECT oi.orderId, p.name AS productName, oi.qty, oi.unitPrice, oi.subtotal
           FROM dy_order_items oi
           JOIN dy_products p ON p.id = oi.productId
           WHERE oi.orderId IN (${placeholders})
           ORDER BY oi.orderId, p.name`,
          orderIds
        );
        for (const item of itemRows as any[]) {
          const oid = Number(item.orderId);
          if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
          itemsByOrder[oid].push(item);
        }
      }

      const totalInvoiced = orders.reduce((s: number, o: any) => s + Number(o.arAmount ?? o.totalAmount ?? 0), 0);
      const totalPaid = orders.reduce((s: number, o: any) => s + Number(o.arPaid ?? o.paidAmount ?? 0), 0);
      const totalUnpaid = totalInvoiced - totalPaid;

      // 月結到期日（取最大的那筆，或用當月月底+overdueDays）
      const dueDate = orders.find((o: any) => o.dueDate)?.dueDate ?? null;

      return { customer, orders, itemsByOrder, totalInvoiced, totalPaid, totalUnpaid, dueDate };
    }),

  // 前端已用：保留
  topCustomers: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT c.name, c.phone, COUNT(o.id) as orderCount, SUM(o.totalAmount) as totalSpending
         FROM dy_customers c JOIN dy_orders o ON c.id = o.customerId
         WHERE c.tenantId=? AND o.status='delivered'
         GROUP BY c.id, c.name, c.phone ORDER BY totalSpending DESC LIMIT ${input.limit}`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  inventoryAlerts: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT i.*, p.name as productName, p.code FROM dy_inventory i
         JOIN dy_products p ON i.productId = p.id
         WHERE i.tenantId=? AND i.currentQty <= i.safetyQty ORDER BY i.currentQty ASC`,
        [input.tenantId]
      );
      return rows as any[];
    }),
});

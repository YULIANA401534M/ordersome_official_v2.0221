import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";


export const dyReportsRouter = router({
  // Daily summary: orders count, total amount, by driver
  dailySummary: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), date: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [summaryRows] = await (db as any).$client.execute(
        `SELECT 
           COUNT(*) as totalOrders,
           SUM(totalAmount) as totalAmount,
           SUM(paidAmount) as totalPaid,
           SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as deliveredCount,
           SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pendingCount
         FROM dy_orders WHERE tenantId=? AND deliveryDate=?`,
        [input.tenantId, input.date]
      ) as any;
      const summary = (summaryRows as any[])[0];
      const [byDriver] = await (db as any).$client.execute(
        `SELECT d.name as driverName, COUNT(o.id) as orderCount, SUM(o.totalAmount) as totalAmount
         FROM dy_orders o LEFT JOIN dy_drivers d ON o.driverId = d.id
         WHERE o.tenantId=? AND o.deliveryDate=?
         GROUP BY o.driverId, d.name`,
        [input.tenantId, input.date]
      );
      return { summary, byDriver };
    }),

  // Monthly revenue
  monthlyRevenue: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT DATE(deliveryDate) as date, COUNT(*) as orders, SUM(totalAmount) as revenue
         FROM dy_orders WHERE tenantId=? AND YEAR(deliveryDate)=? AND MONTH(deliveryDate)=? AND status='delivered'
         GROUP BY DATE(deliveryDate) ORDER BY date`,
        [input.tenantId, input.year, input.month]
      );
      return rows as any[];
    }),

  // Top customers by spending
  topCustomers: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT c.name, c.phone, COUNT(o.id) as orderCount, SUM(o.totalAmount) as totalSpending
         FROM dy_customers c JOIN dy_orders o ON c.id = o.customerId
         WHERE c.tenantId=? AND o.status='delivered'
         GROUP BY c.id, c.name, c.phone ORDER BY totalSpending DESC LIMIT ${input.limit}`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  // Inventory alerts (below safety qty)
  inventoryAlerts: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT i.*, p.name as productName, p.code FROM dy_inventory i
         JOIN dy_products p ON i.productId = p.id
         WHERE i.tenantId=? AND i.currentQty <= i.safetyQty ORDER BY i.currentQty ASC`,
        [input.tenantId]
      );
      return rows as any[];
    }),
});

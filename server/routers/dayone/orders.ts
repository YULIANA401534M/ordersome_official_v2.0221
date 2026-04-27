import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure, dayoneDriverProcedure as dyDriverProcedure } from "./procedures";
import { calcDueDate, upsertArRecord } from "./utils";

export const dyOrdersRouter = router({
  list: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        deliveryDate: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        driverId: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      let sql = `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone,
                        d.name as driverName, dist.name as districtName
                 FROM dy_orders o
                 JOIN dy_customers c ON o.customerId = c.id
                 LEFT JOIN dy_drivers d ON o.driverId = d.id
                 LEFT JOIN dy_districts dist ON o.districtId = dist.id
                 WHERE o.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.deliveryDate) {
        sql += " AND o.deliveryDate = ?";
        params.push(input.deliveryDate);
      }
      if (input.dateFrom) {
        sql += " AND o.deliveryDate >= ?";
        params.push(input.dateFrom);
      }
      if (input.dateTo) {
        sql += " AND o.deliveryDate <= ?";
        params.push(input.dateTo);
      }
      if (input.driverId) {
        sql += " AND o.driverId = ?";
        params.push(input.driverId);
      }
      if (input.status) {
        sql += " AND o.status = ?";
        params.push(input.status);
      }
      sql += " ORDER BY o.deliveryDate DESC, o.id DESC";
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  getWithItems: dyDriverProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [orderRows] = (await (db as any).$client.execute(
        `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone
         FROM dy_orders o JOIN dy_customers c ON o.customerId = c.id
         WHERE o.id=? AND o.tenantId=?`,
        [input.id, input.tenantId]
      )) as any;
      const order = (orderRows as any[])[0];
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      const [items] = await (db as any).$client.execute(
        `SELECT oi.*, p.name as productName, p.code, p.unit FROM dy_order_items oi
         JOIN dy_products p ON oi.productId = p.id WHERE oi.orderId=?`,
        [input.id]
      );
      return { ...order, items };
    }),

  create: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        customerId: z.number(),
        driverId: z.number().optional(),
        deliveryDate: z.string(),
        districtId: z.number().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            qty: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const totalAmount = input.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
      const orderNo = `DY${Date.now()}`;
      const [result] = await client.execute(
        `INSERT INTO dy_orders (tenantId, orderNo, customerId, driverId, deliveryDate, districtId, status, totalAmount, paidAmount, paymentStatus, prevBoxes, inBoxes, returnBoxes, remainBoxes, note, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,'pending',?,0,'unpaid',0,0,0,0,?,NOW(),NOW())`,
        [input.tenantId, orderNo, input.customerId, input.driverId ?? null, input.deliveryDate, input.districtId ?? null, totalAmount, input.note ?? null]
      );
      const orderId = (result as any).insertId;
      for (const item of input.items) {
        await client.execute(
          `INSERT INTO dy_order_items (tenantId, orderId, productId, qty, unitPrice, subtotal, returnQty) VALUES (?,?,?,?,?,?,0)`,
          [input.tenantId, orderId, item.productId, item.qty, item.unitPrice, item.qty * item.unitPrice]
        );
      }
      return { id: orderId, orderNo };
    }),

  updateStatus: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        status: z.enum(["pending", "assigned", "picked", "delivering", "delivered", "returned", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        `UPDATE dy_orders SET status=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.status, input.id, input.tenantId]
      );
      return { success: true };
    }),

  setDriver: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number(), driverId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        `UPDATE dy_orders SET driverId=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.driverId, input.id, input.tenantId]
      );
      return { success: true };
    }),

  getLiffOrders: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT o.id as orderId, o.orderNo, o.createdAt, o.totalAmount, o.status,
                c.name as customerName, c.phone as customerPhone
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         WHERE o.orderSource = 'liff' AND o.tenantId = ?
         ORDER BY o.createdAt DESC`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  deleteOrder: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 先確認訂單狀態（已取消的直接允許刪除，不管派車單）
      const [orderCheck] = await client.execute(
        `SELECT status FROM dy_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const orderStatus = (orderCheck as any[])[0]?.status;
      const isCancelled = orderStatus === "cancelled";

      // 若此訂單已在派車單裡，確認派車單狀態（已取消訂單跳過此檢查）
      const [diRows] = await client.execute(
        `SELECT di.id, di.dispatchOrderId, ddo.status AS dispatchStatus
         FROM dy_dispatch_items di
         JOIN dy_dispatch_orders ddo ON ddo.id = di.dispatchOrderId
         WHERE di.orderId=? AND di.tenantId=?`,
        [input.id, input.tenantId]
      );
      for (const di of diRows as any[]) {
        if (!isCancelled && ["printed", "pending_handover", "completed"].includes(di.dispatchStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "此訂單已列印派車單或正在配送，無法刪除。請先處理派車單。",
          });
        }
        await client.execute(`DELETE FROM dy_dispatch_items WHERE id=? AND tenantId=?`, [di.id, input.tenantId]);
      }

      // 刪除應收帳款
      await client.execute(`DELETE FROM dy_ar_records WHERE orderId=? AND tenantId=?`, [input.id, input.tenantId]);
      // 只刪除與這筆訂單直接關聯的 pending_returns（不影響同派車單其他停點）
      // pending_returns 沒有 orderId 欄位，以 dispatchOrderId + productId 比對訂單品項
      if ((diRows as any[]).length > 0) {
        const [orderItemRows] = await client.execute(
          `SELECT productId FROM dy_order_items WHERE orderId=? AND tenantId=?`,
          [input.id, input.tenantId]
        );
        const productIds = (orderItemRows as any[]).map((r: any) => r.productId);
        const dispatchOrderIds = [...new Set((diRows as any[]).map((di: any) => di.dispatchOrderId))];
        for (const doid of dispatchOrderIds) {
          // 只刪除這張派車單下、對應這筆訂單品項的 pending_returns
          // 若其他訂單也有同樣品項，仍以此保守策略刪除（比全部刪更安全）
          if (productIds.length > 0) {
            const placeholders = productIds.map(() => "?").join(",");
            await client.execute(
              `DELETE FROM dy_pending_returns
               WHERE tenantId=? AND dispatchOrderId=? AND status='pending'
                 AND productId IN (${placeholders})`,
              [input.tenantId, doid, ...productIds]
            );
          }
        }
      }
      // 刪除訂單品項與訂單
      await client.execute(`DELETE FROM dy_order_items WHERE orderId=? AND tenantId=?`, [input.id, input.tenantId]);
      await client.execute(`DELETE FROM dy_orders WHERE id=? AND tenantId=?`, [input.id, input.tenantId]);
      return { success: true };
    }),

  confirmDelivery: dyDriverProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        signatureUrl: z.string().optional(),
        photoUrl: z.string().optional(),
        inBoxes: z.number().default(0),
        returnBoxes: z.number().default(0),
        paidAmount: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      await client.execute(
        `UPDATE dy_orders
         SET status='delivered', signatureUrl=?, photoUrl=?, inBoxes=?, returnBoxes=?, paidAmount=?,
             paymentStatus=IF(? >= totalAmount,'paid',IF(? > 0,'partial','unpaid')), updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [input.signatureUrl ?? null, input.photoUrl ?? null, input.inBoxes, input.returnBoxes, input.paidAmount, input.paidAmount, input.paidAmount, input.id, input.tenantId]
      );

      const [rows] = await client.execute(
        `SELECT o.id, o.customerId, o.deliveryDate, o.totalAmount, o.paidAmount, c.settlementCycle, c.overdueDays
         FROM dy_orders o
         JOIN dy_customers c ON c.id = o.customerId
         WHERE o.id=? AND o.tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const order = (rows as any[])[0];
      if (order) {
        await upsertArRecord(client, {
          tenantId: input.tenantId,
          orderId: order.id,
          customerId: order.customerId,
          amount: Number(order.totalAmount ?? 0),
          paidAmount: Number(order.paidAmount ?? 0),
          dueDate: calcDueDate(order.deliveryDate, order.settlementCycle, order.overdueDays),
        });
      }
      return { success: true };
    }),
});

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
                        c.settlementCycle as customerSettlementCycle,
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

  getWithItems: dyAdminProcedure
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

      // 信用額度檢查：查客戶 creditLimit + 目前未結金額
      const [custRows] = await client.execute(
        `SELECT c.creditLimit,
                COALESCE(SUM(o.totalAmount - o.paidAmount), 0) AS unpaidTotal
         FROM dy_customers c
         LEFT JOIN dy_orders o ON o.customerId = c.id AND o.tenantId = c.tenantId
           AND o.status NOT IN ('cancelled','returned')
           AND o.paymentStatus != 'paid'
         WHERE c.id = ? AND c.tenantId = ?
         GROUP BY c.creditLimit`,
        [input.customerId, input.tenantId]
      );
      const cust = (custRows as any[])[0];
      const creditLimit = Number(cust?.creditLimit ?? 0);
      const unpaidTotal = Number(cust?.unpaidTotal ?? 0);
      const overCredit = creditLimit > 0 && (unpaidTotal + totalAmount) > creditLimit;

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

      // 庫存不足檢查（不阻擋，回傳警告清單）
      const lowStockWarnings: { productId: number; productName: string; ordered: number; currentQty: number }[] = [];
      if (input.items.length) {
        const productIds = input.items.map((i) => i.productId);
        const placeholders = productIds.map(() => "?").join(",");
        const [invRows] = await client.execute(
          `SELECT i.productId, i.currentQty, p.name AS productName
           FROM dy_inventory i
           JOIN dy_products p ON i.productId = p.id
           WHERE i.tenantId = ? AND i.productId IN (${placeholders})`,
          [input.tenantId, ...productIds]
        );
        const invMap: Record<number, { currentQty: number; productName: string }> = {};
        for (const row of invRows as any[]) {
          invMap[Number(row.productId)] = { currentQty: Number(row.currentQty ?? 0), productName: row.productName };
        }
        for (const item of input.items) {
          const inv = invMap[item.productId];
          if (inv && item.qty > inv.currentQty) {
            lowStockWarnings.push({
              productId: item.productId,
              productName: inv.productName,
              ordered: item.qty,
              currentQty: inv.currentQty,
            });
          }
        }
      }

      return {
        id: orderId,
        orderNo,
        overCredit,
        creditLimit,
        unpaidTotal: unpaidTotal + totalAmount,
        lowStockWarnings,
      };
    }),

  updateItems: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        items: z.array(z.object({
          id: z.number(),
          qty: z.number().positive(),
          unitPrice: z.number().min(0),
        })),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [orderCheck] = await client.execute(
        `SELECT id FROM dy_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      if (!(orderCheck as any[])[0]) throw new TRPCError({ code: "NOT_FOUND" });

      for (const item of input.items) {
        const subtotal = item.qty * item.unitPrice;
        await client.execute(
          `UPDATE dy_order_items SET qty=?, unitPrice=?, subtotal=? WHERE id=? AND orderId=?`,
          [item.qty, item.unitPrice, subtotal, item.id, input.id]
        );
      }

      // 重新算 totalAmount 寫回 dy_orders
      const [sumRows] = await client.execute(
        `SELECT COALESCE(SUM(subtotal), 0) AS total FROM dy_order_items WHERE orderId=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const newTotal = Number((sumRows as any[])[0]?.total ?? 0);
      await client.execute(
        `UPDATE dy_orders SET totalAmount=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [newTotal, input.id, input.tenantId]
      );

      // 同步更新 AR（如果這張訂單已有應收記錄）
      const [arRows] = await client.execute(
        `SELECT ar.id, ar.paidAmount, ar.dueDate, o.customerId, o.deliveryDate,
                c.settlementCycle, c.overdueDays
         FROM dy_ar_records ar
         JOIN dy_orders o ON ar.orderId = o.id
         JOIN dy_customers c ON o.customerId = c.id
         WHERE ar.orderId=? AND ar.tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const arRow = (arRows as any[])[0];
      if (arRow && newTotal > 0) {
        const { calcDueDate } = await import("./utils");
        const rawDate = arRow.deliveryDate instanceof Date
          ? new Date(arRow.deliveryDate.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : String(arRow.deliveryDate ?? arRow.dueDate ?? "").slice(0, 10);
        const dueDate = calcDueDate(rawDate, arRow.settlementCycle, arRow.overdueDays);
        const paidAmount = Number(arRow.paidAmount ?? 0);
        const newStatus = paidAmount >= newTotal ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
        await client.execute(
          `UPDATE dy_ar_records SET amount=?, status=?, dueDate=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
          [newTotal, newStatus, dueDate, arRow.id, input.tenantId]
        );
      }

      // 同步更新派車單站點的 paymentStatus（若訂單已在派車單中）
      const [paidRows] = await client.execute(
        `SELECT paidAmount FROM dy_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const currentPaid = Number((paidRows as any[])[0]?.paidAmount ?? 0);
      const newDispatchPayStatus = newTotal > 0 && currentPaid >= newTotal ? "paid"
        : currentPaid > 0 ? "partial"
        : "unpaid";
      await client.execute(
        `UPDATE dy_dispatch_items SET paymentStatus=? WHERE orderId=? AND tenantId=?`,
        [newDispatchPayStatus, input.id, input.tenantId]
      );

      return { success: true, totalAmount: newTotal };
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
      const client = (db as any).$client;

      await client.execute(
        `UPDATE dy_orders SET status=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.status, input.id, input.tenantId]
      );

      // 狀態改為 delivered → 建立或更新 AR
      if (input.status === "delivered") {
        const [orderRows] = await client.execute(
          `SELECT o.id, o.customerId, o.deliveryDate, o.totalAmount, o.paidAmount, c.settlementCycle, c.overdueDays
           FROM dy_orders o JOIN dy_customers c ON c.id = o.customerId
           WHERE o.id=? AND o.tenantId=? LIMIT 1`,
          [input.id, input.tenantId]
        );
        const order = (orderRows as any[])[0];
        if (order) {
          await upsertArRecord(client, {
            tenantId: input.tenantId,
            orderId: Number(order.id),
            customerId: Number(order.customerId),
            amount: Number(order.totalAmount ?? 0),
            paidAmount: Number(order.paidAmount ?? 0),
            dueDate: calcDueDate(
              new Date(new Date(order.deliveryDate).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10),
              order.settlementCycle,
              order.overdueDays
            ),
          });
        }
      }

      // 狀態改為 cancelled 或 returned → 刪除應收帳款（貨物未送出，帳款不應存在）
      if (input.status === "cancelled" || input.status === "returned") {
        await client.execute(
          `DELETE FROM dy_ar_records WHERE orderId=? AND tenantId=?`,
          [input.id, input.tenantId]
        );
        // 同步清除 draft 派車單的站點（已列印/配送中的不動，由 generateDispatch 處理或司機手動處理）
        await client.execute(
          `DELETE di FROM dy_dispatch_items di
           JOIN dy_dispatch_orders ddo ON ddo.id = di.dispatchOrderId
           WHERE di.orderId = ? AND di.tenantId = ? AND ddo.status = 'draft'`,
          [input.id, input.tenantId]
        );
      }

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
    .input(z.object({
      tenantId: z.number(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      let sql = `SELECT o.id as orderId, o.orderNo, o.createdAt, o.deliveryDate,
                        o.totalAmount, o.paidAmount, o.status, o.paymentStatus, o.note,
                        c.name as customerName, c.phone as customerPhone
                 FROM dy_orders o
                 JOIN dy_customers c ON o.customerId = c.id
                 WHERE o.orderSource = 'liff' AND o.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.dateFrom) { sql += " AND DATE(o.createdAt) >= ?"; params.push(input.dateFrom); }
      if (input.dateTo)   { sql += " AND DATE(o.createdAt) <= ?"; params.push(input.dateTo); }
      sql += " ORDER BY o.createdAt DESC LIMIT 200";

      const [rows] = await client.execute(sql, params);
      const orderList = (rows as any[]).map((r) => ({
        ...r,
        orderId: Number(r.orderId),
        totalAmount: Number(r.totalAmount ?? 0),
        paidAmount: Number(r.paidAmount ?? 0),
      }));

      // 撈每筆訂單的 items
      if (orderList.length) {
        const ids = orderList.map((o: any) => o.orderId);
        const placeholders = ids.map(() => "?").join(",");
        const [itemRows] = await client.execute(
          `SELECT oi.orderId, oi.qty, oi.unitPrice, oi.subtotal, p.name as productName
           FROM dy_order_items oi
           JOIN dy_products p ON oi.productId = p.id
           WHERE oi.orderId IN (${placeholders}) AND oi.tenantId = ?`,
          [...ids, input.tenantId]
        );
        const itemMap: Record<number, any[]> = {};
        for (const item of itemRows as any[]) {
          const oid = Number(item.orderId);
          if (!itemMap[oid]) itemMap[oid] = [];
          itemMap[oid].push({ ...item, orderId: oid, qty: Number(item.qty), unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) });
        }
        for (const o of orderList) {
          o.items = itemMap[o.orderId] ?? [];
        }
      }

      return orderList;
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

import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { ensureDyPendingReturnsTable } from "./pendingReturns";
import { dayoneAdminProcedure as dyAdminProcedure, dayoneDriverProcedure as driverProcedure } from "./procedures";



async function ensureDyDispatchSchema(client: any) {
  await client.execute(
    `ALTER TABLE dy_dispatch_items
     MODIFY COLUMN paymentStatus ENUM('paid','partial','unpaid','monthly','weekly') NOT NULL DEFAULT 'unpaid'`
  );
}

function calcDueDate(dispatchDate: string, settlementCycle?: string | null, overdueDays?: number | null) {
  const date = new Date(dispatchDate);
  if (settlementCycle === "weekly") {
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }
  if (settlementCycle === "monthly") {
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    monthEnd.setDate(monthEnd.getDate() + Number(overdueDays ?? 5));
    return monthEnd.toISOString().slice(0, 10);
  }
  return dispatchDate;
}

async function upsertReceivable(
  client: any,
  payload: {
    tenantId: number;
    orderId: number;
    customerId: number;
    amount: number;
    paidAmount: number;
    paymentStatus: string;
    dueDate: string;
  }
) {
  const [existingRows] = await client.execute(
    `SELECT id FROM dy_ar_records WHERE tenantId=? AND orderId=? LIMIT 1`,
    [payload.tenantId, payload.orderId]
  );
  const existing = (existingRows as any[])[0];

  const paidAmount = Number(payload.paidAmount ?? 0);
  const amount = Number(payload.amount ?? 0);
  const normalizedStatus =
    payload.paymentStatus === "paid" || paidAmount >= amount
      ? "paid"
      : paidAmount > 0
        ? "partial"
        : "unpaid";

  if (existing) {
    await client.execute(
      `UPDATE dy_ar_records
       SET amount=?, paidAmount=?, status=?, dueDate=?, paymentMethod=IF(? > 0, 'cash', paymentMethod),
           paidAt=CASE WHEN ? = 'paid' OR ? >= ? THEN NOW() ELSE paidAt END,
           updatedAt=NOW()
       WHERE id=? AND tenantId=?`,
      [amount, paidAmount, normalizedStatus, payload.dueDate, paidAmount, payload.paymentStatus, paidAmount, amount, existing.id, payload.tenantId]
    );
    return existing.id;
  }

  const [result] = await client.execute(
    `INSERT INTO dy_ar_records
     (tenantId, orderId, customerId, amount, paidAmount, status, dueDate, paymentMethod, paidAt, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,IF(? > 0, 'cash', NULL), CASE WHEN ? = 'paid' OR ? >= ? THEN NOW() ELSE NULL END, NOW(), NOW())`,
    [payload.tenantId, payload.orderId, payload.customerId, amount, paidAmount, normalizedStatus, payload.dueDate, paidAmount, payload.paymentStatus, paidAmount, amount]
  );
  return (result as any).insertId;
}

async function resolveDriverScope(client: any, tenantId: number, userId: number, role: string) {
  if (role === "super_admin" || role === "manager") {
    return null;
  }

  const [driverRows] = await client.execute(
    `SELECT id FROM dy_drivers WHERE tenantId=? AND userId=? AND status='active' LIMIT 1`,
    [tenantId, userId]
  );
  const driver = (driverRows as any[])[0];
  if (!driver) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Driver account is not linked to Dayone" });
  }
  return Number(driver.id);
}

export const dyDispatchRouter = router({
  generateDispatch: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), dispatchDate: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      await ensureDyDispatchSchema(client);

      const [orderRows] = await client.execute(
        `SELECT o.*, c.settlementCycle, c.overdueDays, c.address AS customerAddress,
                c.name AS customerName, c.customerLevel,
                dist.sortOrder, dist.routeCode
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         LEFT JOIN dy_districts dist ON o.districtId = dist.id
         WHERE o.tenantId=?
           AND o.deliveryDate=?
           AND o.status IN ('pending', 'assigned')
           AND NOT EXISTS (
             SELECT 1
             FROM dy_dispatch_items di
             JOIN dy_dispatch_orders ddo
               ON ddo.id = di.dispatchOrderId
              AND ddo.tenantId = di.tenantId
             WHERE di.tenantId = o.tenantId
               AND di.orderId = o.id
               AND ddo.status IN ('draft', 'printed', 'completed')
           )
         ORDER BY o.driverId, dist.sortOrder, o.id`,
        [input.tenantId, input.dispatchDate]
      );
      const orders = orderRows as any[];

      if (orders.length === 0) {
        return { dispatchOrders: [], message: "No dispatchable orders for this date" };
      }

      const driverMap = new Map<number, any[]>();
      for (const order of orders) {
        const driverId = Number(order.driverId ?? 0);
        if (!driverMap.has(driverId)) driverMap.set(driverId, []);
        driverMap.get(driverId)!.push(order);
      }

      const dispatchOrders: any[] = [];

      for (const [driverId, driverOrders] of Array.from(driverMap.entries())) {
        const routeCode = driverOrders[0]?.routeCode ?? "R00";
        const [dispatchResult] = await client.execute(
          `INSERT INTO dy_dispatch_orders
           (tenantId, dispatchDate, driverId, routeCode, status, generatedAt, createdAt, updatedAt)
           VALUES (?,?,?,?,'draft',NOW(),NOW(),NOW())`,
          [input.tenantId, input.dispatchDate, driverId, routeCode]
        );
        const dispatchOrderId = (dispatchResult as any).insertId;

        let stopSequence = 1;
        for (const order of driverOrders) {
          const [boxRows] = await client.execute(
            `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
            [input.tenantId, order.customerId]
          );
          const prevBoxes = Number((boxRows as any[])[0]?.currentBalance ?? 0);
          const paymentStatus =
            order.settlementCycle === "monthly"
              ? "monthly"
              : order.settlementCycle === "weekly"
                ? "weekly"
                : "unpaid";

          await client.execute(
            `INSERT INTO dy_dispatch_items
             (dispatchOrderId, tenantId, orderId, customerId, stopSequence,
              prevBoxes, deliverBoxes, returnBoxes, remainBoxes,
              paymentStatus, cashCollected, createdAt)
             VALUES (?,?,?,?,?,?,0,0,?,?,0,NOW())`,
            [dispatchOrderId, input.tenantId, order.id, order.customerId, stopSequence++, prevBoxes, prevBoxes, paymentStatus]
          );

          await client.execute(
            `UPDATE dy_orders SET status='assigned', updatedAt=NOW() WHERE id=? AND tenantId=?`,
            [order.id, input.tenantId]
          );
        }

        dispatchOrders.push({ id: dispatchOrderId, driverId, routeCode, itemCount: driverOrders.length });
      }

      return { dispatchOrders };
    }),

  listDispatch: driverProcedure
    .input(z.object({ tenantId: z.number(), dispatchDate: z.string().optional(), driverId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      await ensureDyDispatchSchema(client);
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      let sql = `SELECT do2.*, d.name AS driverName
                 FROM dy_dispatch_orders do2
                 JOIN dy_drivers d ON do2.driverId = d.id
                 WHERE do2.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (scopedDriverId) {
        sql += " AND do2.driverId = ?";
        params.push(scopedDriverId);
      }

      if (input.dispatchDate) {
        sql += " AND do2.dispatchDate = ?";
        params.push(input.dispatchDate);
      }
      if (input.driverId && !scopedDriverId) {
        sql += " AND do2.driverId = ?";
        params.push(input.driverId);
      }
      sql += " ORDER BY do2.dispatchDate DESC LIMIT 30";

      const [rows] = await client.execute(sql, params);
      return rows as any[];
    }),

  getDispatchDetail: driverProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      const [dispatchRows] = await client.execute(
        `SELECT do2.*, d.name AS driverName
         FROM dy_dispatch_orders do2
         JOIN dy_drivers d ON do2.driverId = d.id
         WHERE do2.id=? AND do2.tenantId=?`,
        [input.id, input.tenantId]
      );
      const dispatchOrder = (dispatchRows as any[])[0];
      if (!dispatchOrder) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch order not found" });
      if (scopedDriverId && Number(dispatchOrder.driverId) !== scopedDriverId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dispatch order belongs to another driver" });
      }

      const [itemRows] = await client.execute(
        `SELECT di.*, c.name AS customerName, c.address AS customerAddress,
                c.phone AS customerPhone, o.totalAmount AS orderAmount, o.orderNo
         FROM dy_dispatch_items di
         JOIN dy_customers c ON di.customerId = c.id
         LEFT JOIN dy_orders o ON di.orderId = o.id
         WHERE di.dispatchOrderId=? AND di.tenantId=?
         ORDER BY di.stopSequence ASC`,
        [input.id, input.tenantId]
      );

      const [productRows] = await client.execute(
        `SELECT oi.productId, p.name AS productName, p.unit, SUM(oi.qty) AS shippedQty
         FROM dy_dispatch_items di
         JOIN dy_order_items oi ON oi.orderId = di.orderId
         JOIN dy_products p ON p.id = oi.productId
         WHERE di.dispatchOrderId=? AND di.tenantId=?
         GROUP BY oi.productId, p.name, p.unit
         ORDER BY p.code, p.name`,
        [input.id, input.tenantId]
      );

      return { ...dispatchOrder, items: itemRows as any[], products: productRows as any[] };
    }),

  markPrinted: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [dispatchRows] = await client.execute(
        `SELECT * FROM dy_dispatch_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const dispatchOrder = (dispatchRows as any[])[0];
      if (!dispatchOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch order not found" });
      }

      if (["printed", "completed"].includes(dispatchOrder.status)) {
        return { success: true, alreadyPrinted: true };
      }

      const [itemRows] = await client.execute(
        `SELECT di.orderId, oi.productId, oi.qty
         FROM dy_dispatch_items di
         JOIN dy_order_items oi ON di.orderId = oi.orderId
         WHERE di.dispatchOrderId=? AND di.tenantId=? AND di.orderId IS NOT NULL`,
        [input.id, input.tenantId]
      );

      for (const item of itemRows as any[]) {
        await client.execute(
          `UPDATE dy_inventory
           SET currentQty = currentQty - ?, updatedAt=NOW()
           WHERE tenantId=? AND productId=?`,
          [item.qty, input.tenantId, item.productId]
        );

        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, note, createdAt)
           VALUES (?,?,'out',?,?,'dispatch_print',?,NOW())`,
          [input.tenantId, item.productId, item.qty, input.id, `Dispatch print for order ${item.orderId}`]
        );
      }

      await client.execute(
        `UPDATE dy_orders o
         JOIN dy_dispatch_items di ON di.orderId = o.id
         SET o.status='picked', o.updatedAt=NOW()
         WHERE di.dispatchOrderId=? AND o.tenantId=?`,
        [input.id, input.tenantId]
      );

      await client.execute(
        `UPDATE dy_dispatch_orders
         SET status='printed', printedAt=NOW(), updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );

      return { success: true };
    }),

  updateDispatchItem: driverProcedure
    .input(
      z.object({
        itemId: z.number(),
        tenantId: z.number(),
        returnBoxes: z.number(),
        cashCollected: z.number(),
        paymentStatus: z.string(),
        driverNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      const [itemRows] = await client.execute(
        `SELECT di.*, ddo.dispatchDate, ddo.driverId, o.status AS orderStatus, o.totalAmount, c.settlementCycle, c.overdueDays
         FROM dy_dispatch_items di
         LEFT JOIN dy_dispatch_orders ddo ON ddo.id = di.dispatchOrderId
         LEFT JOIN dy_orders o ON di.orderId = o.id
         LEFT JOIN dy_customers c ON di.customerId = c.id
         WHERE di.id=? AND di.tenantId=?`,
        [input.itemId, input.tenantId]
      );
      const item = (itemRows as any[])[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch item not found" });
      if (scopedDriverId && Number(item.driverId) !== scopedDriverId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dispatch item belongs to another driver" });
      }

      const remainBoxes = Number(item.prevBoxes ?? 0) + Number(item.deliverBoxes ?? 0) - Number(input.returnBoxes ?? 0);

      await client.execute(
        `UPDATE dy_dispatch_items
         SET returnBoxes=?, remainBoxes=?, cashCollected=?, paymentStatus=?, driverNote=?
         WHERE id=? AND tenantId=?`,
        [input.returnBoxes, remainBoxes, input.cashCollected, input.paymentStatus, input.driverNote ?? null, input.itemId, input.tenantId]
      );

      const [ledgerRows] = await client.execute(
        `SELECT id, currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
        [input.tenantId, item.customerId]
      );
      const ledger = (ledgerRows as any[])[0];
      const balanceBefore = Number(ledger?.currentBalance ?? 0);
      const balanceAfter = remainBoxes;

      if (ledger) {
        await client.execute(
          `UPDATE dy_box_ledger SET currentBalance=?, updatedAt=NOW() WHERE tenantId=? AND customerId=?`,
          [remainBoxes, input.tenantId, item.customerId]
        );
      } else {
        await client.execute(
          `INSERT INTO dy_box_ledger (tenantId, customerId, currentBalance) VALUES (?,?,?)`,
          [input.tenantId, item.customerId, remainBoxes]
        );
      }

      if (balanceBefore !== balanceAfter) {
        await client.execute(
          `INSERT INTO dy_box_transactions
           (tenantId, customerId, dispatchItemId, type, quantity, balanceBefore, balanceAfter, createdAt)
           VALUES (?,?,?,?,?,?,?,NOW())`,
          [
            input.tenantId,
            item.customerId,
            input.itemId,
            balanceAfter > balanceBefore ? "delivery" : "return",
            Math.abs(balanceAfter - balanceBefore),
            balanceBefore,
            balanceAfter,
          ]
        );
      }

      if (item.orderId && item.orderStatus === "delivered") {
        await upsertReceivable(client, {
          tenantId: input.tenantId,
          orderId: item.orderId,
          customerId: item.customerId,
          amount: Number(item.totalAmount ?? 0),
          paidAmount: Number(input.cashCollected ?? 0),
          paymentStatus: input.paymentStatus,
          dueDate: calcDueDate(item.dispatchDate ?? new Date().toISOString().slice(0, 10), item.settlementCycle, item.overdueDays),
        });

        await client.execute(
          `UPDATE dy_orders
           SET paidAmount=?, paymentStatus=?, returnBoxes=?, remainBoxes=?, updatedAt=NOW()
           WHERE id=? AND tenantId=?`,
          [
            input.cashCollected,
            input.paymentStatus === "paid" ? "paid" : input.cashCollected > 0 ? "partial" : "unpaid",
            input.returnBoxes,
            remainBoxes,
            item.orderId,
            input.tenantId,
          ]
        );
      }

      return { success: true, remainBoxes };
    }),

  returnInventory: driverProcedure
    .input(
      z.object({
        dispatchOrderId: z.number(),
        tenantId: z.number(),
        items: z.array(
          z.object({
            productId: z.number(),
            qty: z.number().positive(),
          })
        ),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      await ensureDyPendingReturnsTable(client);
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      const [dispatchRows] = await client.execute(
        `SELECT * FROM dy_dispatch_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.dispatchOrderId, input.tenantId]
      );
      const dispatchOrder = (dispatchRows as any[])[0];
      if (!dispatchOrder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch order not found" });
      }
      if (scopedDriverId && Number(dispatchOrder.driverId) !== scopedDriverId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dispatch order belongs to another driver" });
      }
      if (dispatchOrder.status === "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Draft dispatch cannot return stock to inventory" });
      }

      const [shippedRows] = await client.execute(
        `SELECT oi.productId, SUM(oi.qty) AS shippedQty
         FROM dy_dispatch_items di
         JOIN dy_order_items oi ON di.orderId = oi.orderId
         WHERE di.dispatchOrderId=? AND di.tenantId=?
         GROUP BY oi.productId`,
        [input.dispatchOrderId, input.tenantId]
      );
      const shippedQtyByProduct = new Map<number, number>(
        (shippedRows as any[]).map((row) => [Number(row.productId), Number(row.shippedQty ?? 0)])
      );

      const [reportedRows] = await client.execute(
        `SELECT productId, COALESCE(SUM(qty), 0) AS reportedQty
         FROM dy_pending_returns
         WHERE tenantId=? AND dispatchOrderId=?
         GROUP BY productId`,
        [input.tenantId, input.dispatchOrderId]
      );
      const reportedQtyByProduct = new Map<number, number>(
        (reportedRows as any[]).map((row) => [Number(row.productId), Number(row.reportedQty ?? 0)])
      );

      for (const item of input.items) {
        const shippedQty = Number(shippedQtyByProduct.get(Number(item.productId)) ?? 0);
        if (shippedQty <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product ${item.productId} was not part of this dispatch`,
          });
        }

        const alreadyReportedQty = Number(reportedQtyByProduct.get(Number(item.productId)) ?? 0);
        const requestedQty = Number(item.qty ?? 0);
        if (alreadyReportedQty + requestedQty > shippedQty) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Returned qty for product ${item.productId} exceeds shipped qty`,
          });
        }

        await client.execute(
          `INSERT INTO dy_pending_returns
           (tenantId, dispatchOrderId, productId, qty, status, source, note, reportedBy, reportedAt, createdAt, updatedAt)
           VALUES (?,?,?,?, 'pending', ?, ?, ?, NOW(), NOW(), NOW())`,
          [
            input.tenantId,
            input.dispatchOrderId,
            item.productId,
            requestedQty,
            ctx.user.role === "driver" ? "driver_worklog" : "dispatch_console",
            input.note?.trim() || `Pending truck return for dispatch ${input.dispatchOrderId}`,
            ctx.user.id,
          ]
        );
      }

      await client.execute(
        `UPDATE dy_dispatch_orders
         SET updatedAt=NOW(), status=CASE WHEN status='printed' THEN 'in_progress' ELSE status END
         WHERE id=? AND tenantId=?`,
        [input.dispatchOrderId, input.tenantId]
      );

      return { success: true, returnedItemCount: input.items.length, pendingReview: true };
    }),

  completeDispatch: driverProcedure
    .input(z.object({ id: z.number(), tenantId: z.number(), actualAmount: z.number(), driverNote: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      const [dispatchRows] = await client.execute(
        `SELECT driverId, dispatchDate FROM dy_dispatch_orders WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const dispatch = (dispatchRows as any[])[0];
      if (!dispatch) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch order not found" });
      if (scopedDriverId && Number(dispatch.driverId) !== scopedDriverId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dispatch order belongs to another driver" });
      }

      const [sumRows] = await client.execute(
        `SELECT COALESCE(SUM(cashCollected), 0) AS expectedAmount
         FROM dy_dispatch_items
         WHERE dispatchOrderId=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const expectedAmount = parseFloat((sumRows as any[])[0]?.expectedAmount ?? 0);
      const diff = input.actualAmount - expectedAmount;
      const status = Math.abs(diff) < 1 ? "normal" : "anomaly";

      await client.execute(
        `UPDATE dy_dispatch_orders
         SET status='completed', completedAt=NOW(), updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );

      const [reportResult] = await client.execute(
        `INSERT INTO dy_driver_cash_reports
         (tenantId, driverId, reportDate, expectedAmount, actualAmount, diff, status, driverNote, createdAt)
         VALUES (?,?,?,?,?,?,?,?,NOW())`,
        [
          input.tenantId,
          dispatch.driverId,
          dispatch.dispatchDate ?? new Date().toISOString().slice(0, 10),
          expectedAmount,
          input.actualAmount,
          diff,
          status,
          input.driverNote ?? null,
        ]
      );

      return { success: true, expectedAmount, diff, status, reportId: (reportResult as any).insertId };
    }),

  manualAddStop: driverProcedure
    .input(
      z.object({
        dispatchOrderId: z.number(),
        tenantId: z.number(),
        customerId: z.number(),
        deliverBoxes: z.number(),
        paymentStatus: z.string(),
        note: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            qty: z.number().positive(),
            unitPrice: z.number().nonnegative(),
          })
        ).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      const [dispatchRows] = await client.execute(
        `SELECT id, driverId, dispatchDate, status FROM dy_dispatch_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.dispatchOrderId, input.tenantId]
      );
      const dispatch = (dispatchRows as any[])[0];
      if (!dispatch) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch order not found" });
      if (scopedDriverId && Number(dispatch.driverId) !== scopedDriverId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dispatch order belongs to another driver" });
      }
      if (dispatch.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Completed dispatch cannot add stop" });
      }

      const [customerRows] = await client.execute(
        `SELECT id, districtId FROM dy_customers WHERE id=? AND tenantId=? LIMIT 1`,
        [input.customerId, input.tenantId]
      );
      const customer = (customerRows as any[])[0];
      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      const [seqRows] = await client.execute(
        `SELECT COALESCE(MAX(stopSequence), 0) AS maxSeq
         FROM dy_dispatch_items WHERE dispatchOrderId=? AND tenantId=?`,
        [input.dispatchOrderId, input.tenantId]
      );
      const nextSeq = Number((seqRows as any[])[0]?.maxSeq ?? 0) + 1;

      const [boxRows] = await client.execute(
        `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
        [input.tenantId, input.customerId]
      );
      const prevBoxes = Number((boxRows as any[])[0]?.currentBalance ?? 0);
      const remainBoxes = prevBoxes + input.deliverBoxes;
      const normalizedItems = input.items.filter((item) => item.qty > 0);
      const totalAmount = normalizedItems.reduce(
        (sum, item) => sum + Number(item.qty) * Number(item.unitPrice ?? 0),
        0
      );
      const shouldConsumeInventoryImmediately =
        normalizedItems.length > 0 && ["printed", "in_progress"].includes(String(dispatch.status ?? ""));
      const createdOrderStatus = dispatch.status === "draft" ? "assigned" : "picked";
      let orderId: number | null = null;

      if (normalizedItems.length > 0) {
        const orderNo = `DYS${Date.now()}`;
        const [orderResult] = await client.execute(
          `INSERT INTO dy_orders
           (tenantId, orderNo, customerId, driverId, deliveryDate, districtId, status, totalAmount,
            paidAmount, paymentStatus, prevBoxes, inBoxes, returnBoxes, remainBoxes, note, orderSource, createdAt, updatedAt)
           VALUES (?,?,?,?,?,?,?, ?,0,'unpaid',?,?,0,?,?,'dispatch_supplement',NOW(),NOW())`,
          [
            input.tenantId,
            orderNo,
            input.customerId,
            dispatch.driverId,
            dispatch.dispatchDate,
            customer.districtId ?? null,
            createdOrderStatus,
            totalAmount,
            prevBoxes,
            input.deliverBoxes,
            remainBoxes,
            input.note?.trim() || "Dispatch supplement order",
          ]
        );
        orderId = Number((orderResult as any).insertId);

        for (const item of normalizedItems) {
          await client.execute(
            `INSERT INTO dy_order_items
             (tenantId, orderId, productId, qty, unitPrice, subtotal, returnQty)
             VALUES (?,?,?,?,?,?,0)`,
            [
              input.tenantId,
              orderId,
              item.productId,
              item.qty,
              item.unitPrice,
              Number(item.qty) * Number(item.unitPrice ?? 0),
            ]
          );
        }

        if (shouldConsumeInventoryImmediately) {
          for (const item of normalizedItems) {
            await client.execute(
              `UPDATE dy_inventory
               SET currentQty = currentQty - ?, updatedAt=NOW()
               WHERE tenantId=? AND productId=?`,
              [item.qty, input.tenantId, item.productId]
            );

            await client.execute(
              `INSERT INTO dy_stock_movements
               (tenantId, productId, type, qty, refId, refType, note, createdAt)
               VALUES (?,?,'out',?,?,'dispatch_supplement',?,NOW())`,
              [
                input.tenantId,
                item.productId,
                item.qty,
                orderId,
                input.note?.trim() || `Dispatch supplement order ${orderId}`,
              ]
            );
          }
        }
      }

      const [result] = await client.execute(
        `INSERT INTO dy_dispatch_items
         (dispatchOrderId, tenantId, orderId, customerId, stopSequence,
          prevBoxes, deliverBoxes, returnBoxes, remainBoxes, paymentStatus, cashCollected, createdAt)
         VALUES (?,?,?,?,?,?,?,0,?,?,0,NOW())`,
        [
          input.dispatchOrderId,
          input.tenantId,
          orderId,
          input.customerId,
          nextSeq,
          prevBoxes,
          input.deliverBoxes,
          remainBoxes,
          input.paymentStatus,
        ]
      );

      if ((boxRows as any[]).length > 0) {
        await client.execute(
          `UPDATE dy_box_ledger SET currentBalance=?, updatedAt=NOW() WHERE tenantId=? AND customerId=?`,
          [remainBoxes, input.tenantId, input.customerId]
        );
      } else {
        await client.execute(
          `INSERT INTO dy_box_ledger (tenantId, customerId, currentBalance) VALUES (?,?,?)`,
          [input.tenantId, input.customerId, remainBoxes]
        );
      }

      return {
        id: (result as any).insertId,
        stopSequence: nextSeq,
        orderId,
        createdOrder: !!orderId,
      };
    }),
});

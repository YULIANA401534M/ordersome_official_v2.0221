import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { ensureDyPendingReturnsTable } from "./pendingReturns";
import { dayoneAdminProcedure as dyAdminProcedure, dayoneDriverProcedure as driverProcedure } from "./procedures";
import { calcDueDate, upsertArRecord } from "./utils";

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

      // ── Step 1：清除 draft 派車單裡已取消的站點 ──────────────────────
      // 只清除「對應訂單已 cancelled」的站點；手動加站（orderId 為 null 或訂單不存在）不動
      const [draftDispatchRows] = await client.execute(
        `SELECT id FROM dy_dispatch_orders
         WHERE tenantId=? AND dispatchDate=? AND status='draft'`,
        [input.tenantId, input.dispatchDate]
      );
      const draftIds = (draftDispatchRows as any[]).map((r: any) => Number(r.id));

      let cancelledStopsRemoved = 0;
      if (draftIds.length > 0) {
        // 找出 draft 派車單裡、對應訂單已 cancelled 的 stop
        const placeholders = draftIds.map(() => "?").join(",");
        const [cancelledItemRows] = await client.execute(
          `SELECT di.id AS itemId, di.orderId
           FROM dy_dispatch_items di
           JOIN dy_orders o ON o.id = di.orderId
           WHERE di.dispatchOrderId IN (${placeholders})
             AND di.tenantId = ?
             AND o.status = 'cancelled'`,
          [...draftIds, input.tenantId]
        );
        const cancelledItems = cancelledItemRows as any[];
        if (cancelledItems.length > 0) {
          const itemIds = cancelledItems.map((r: any) => Number(r.itemId));
          const itemPlaceholders = itemIds.map(() => "?").join(",");
          await client.execute(
            `DELETE FROM dy_dispatch_items WHERE id IN (${itemPlaceholders})`,
            itemIds
          );
          // 取消訂單狀態回復（從 assigned → pending，讓它們不再佔著派車位）
          const orderIds = [...new Set(cancelledItems.map((r: any) => Number(r.orderId)))];
          // 訂單本身已是 cancelled，不需要改狀態，只是移除站點即可
          cancelledStopsRemoved = itemIds.length;
        }

        // ── Step 2：清除 0 站的空草稿派車單 ──────────────────────────
        for (const dId of draftIds) {
          const [countRows] = await client.execute(
            `SELECT COUNT(*) AS cnt FROM dy_dispatch_items WHERE dispatchOrderId=?`,
            [dId]
          );
          if (Number((countRows as any[])[0]?.cnt) === 0) {
            await client.execute(
              `DELETE FROM dy_dispatch_orders WHERE id=? AND tenantId=? AND status='draft'`,
              [dId, input.tenantId]
            );
          }
        }
      }

      // ── Step 3：把新的可派車訂單加入派車單（原有邏輯）──────────────
      const [orderRows] = await client.execute(
        `SELECT o.*, c.settlementCycle, c.overdueDays, c.address AS customerAddress,
                c.name AS customerName, c.customerLevel,
                dist.sortOrder, d.routeCode AS driverRouteCode
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         LEFT JOIN dy_districts dist ON o.districtId = dist.id
         LEFT JOIN dy_drivers d ON o.driverId = d.id
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
               AND ddo.status IN ('draft', 'printed', 'in_progress', 'pending_handover', 'completed')
           )
         ORDER BY o.driverId, dist.sortOrder, o.id`,
        [input.tenantId, input.dispatchDate]
      );
      const orders = orderRows as any[];

      const driverMap = new Map<number, any[]>();
      for (const order of orders) {
        const driverId = Number(order.driverId ?? 0);
        if (!driverMap.has(driverId)) driverMap.set(driverId, []);
        driverMap.get(driverId)!.push(order);
      }

      const dispatchOrders: any[] = [];

      for (const [driverId, driverOrders] of Array.from(driverMap.entries())) {
        const routeCode = driverOrders[0]?.driverRouteCode ?? "R00";

        // 複用既有 draft，沒有才新建
        const [existingRows] = await client.execute(
          `SELECT id FROM dy_dispatch_orders
           WHERE tenantId=? AND dispatchDate=? AND driverId=? AND status='draft' LIMIT 1`,
          [input.tenantId, input.dispatchDate, driverId]
        );
        let dispatchOrderId: number;
        if ((existingRows as any[]).length > 0) {
          dispatchOrderId = Number((existingRows as any[])[0].id);
        } else {
          const [dispatchResult] = await client.execute(
            `INSERT INTO dy_dispatch_orders
             (tenantId, dispatchDate, driverId, routeCode, status, generatedAt, createdAt, updatedAt)
             VALUES (?,?,?,?,'draft',NOW(),NOW(),NOW())`,
            [input.tenantId, input.dispatchDate, driverId, routeCode]
          );
          dispatchOrderId = (dispatchResult as any).insertId;
        }

        // stopSequence 接著現有最大值
        const [maxSeqRows] = await client.execute(
          `SELECT COALESCE(MAX(stopSequence), 0) AS maxSeq FROM dy_dispatch_items WHERE dispatchOrderId=?`,
          [dispatchOrderId]
        );
        let stopSequence = Number((maxSeqRows as any[])[0]?.maxSeq ?? 0) + 1;

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

      return { dispatchOrders, cancelledStopsRemoved, newOrdersAdded: orders.length };
    }),

  mergeDraftDispatches: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), driverId: z.number(), dispatchDate: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 找該司機當天所有 draft 派車單，依 id 排序（最小的為主單）
      const [draftRows] = await client.execute(
        `SELECT id FROM dy_dispatch_orders
         WHERE tenantId=? AND dispatchDate=? AND driverId=? AND status='draft'
         ORDER BY id ASC`,
        [input.tenantId, input.dispatchDate, input.driverId]
      );
      const drafts = draftRows as any[];
      if (drafts.length < 2) {
        return { merged: false, message: "沒有需要合併的草稿" };
      }

      const primaryId = Number(drafts[0].id);
      const secondaryIds = drafts.slice(1).map((r: any) => Number(r.id));

      // 取主單目前最大 stopSequence
      const [maxSeqRows] = await client.execute(
        `SELECT COALESCE(MAX(stopSequence), 0) AS maxSeq FROM dy_dispatch_items WHERE dispatchOrderId=?`,
        [primaryId]
      );
      let nextSeq = Number((maxSeqRows as any[])[0]?.maxSeq ?? 0) + 1;

      // 把次要單的所有站點搬到主單，stopSequence 重新編
      for (const secId of secondaryIds) {
        const [secItems] = await client.execute(
          `SELECT * FROM dy_dispatch_items WHERE dispatchOrderId=? ORDER BY stopSequence ASC`,
          [secId]
        );
        for (const item of secItems as any[]) {
          await client.execute(
            `UPDATE dy_dispatch_items SET dispatchOrderId=?, stopSequence=? WHERE id=?`,
            [primaryId, nextSeq++, item.id]
          );
        }
        // 刪除空的次要派車單
        await client.execute(
          `DELETE FROM dy_dispatch_orders WHERE id=? AND tenantId=? AND status='draft'`,
          [secId, input.tenantId]
        );
      }

      return { merged: true, primaryId, mergedCount: secondaryIds.length };
    }),

  listDispatch: driverProcedure
    .input(z.object({ tenantId: z.number(), dispatchDate: z.string().optional(), driverId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const scopedDriverId = await resolveDriverScope(client, input.tenantId, ctx.user.id, ctx.user.role ?? "");

      let sql = `SELECT do2.*, d.name AS driverName,
                        (SELECT COUNT(*) FROM dy_dispatch_items di WHERE di.dispatchOrderId=do2.id) AS totalStops,
                        (SELECT COUNT(*) FROM dy_dispatch_items di
                         JOIN dy_orders o ON o.id=di.orderId
                         WHERE di.dispatchOrderId=do2.id AND o.status='delivered') AS deliveredStops,
                        (SELECT COUNT(*) FROM dy_dispatch_items di
                         JOIN dy_orders o ON o.id=di.orderId
                         WHERE di.dispatchOrderId=do2.id AND o.status='delivered'
                           AND o.cashCollected < o.totalAmount AND o.totalAmount > 0) AS shortfallStops,
                        wl.totalCollected AS wlTotalCollected,
                        wl.cashHandedOver AS wlCashHandedOver,
                        wl.handoverNote AS wlHandoverNote
                 FROM dy_dispatch_orders do2
                 JOIN dy_drivers d ON do2.driverId = d.id
                 LEFT JOIN dy_work_logs wl ON wl.driverId = do2.driverId
                   AND wl.workDate = do2.dispatchDate AND wl.tenantId = do2.tenantId
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
      sql += " ORDER BY do2.dispatchDate DESC, do2.id ASC LIMIT 30";

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
                c.phone AS customerPhone, o.totalAmount AS orderAmount, o.orderNo,
                o.cashCollected AS orderCashCollected, o.driverNote AS orderDriverNote, o.status AS orderStatus
         FROM dy_dispatch_items di
         JOIN dy_customers c ON di.customerId = c.id
         LEFT JOIN dy_orders o ON di.orderId = o.id
         WHERE di.dispatchOrderId=? AND di.tenantId=?
         ORDER BY di.stopSequence ASC`,
        [input.id, input.tenantId]
      );

      // per-stop products (keyed by orderId for frontend grouping)
      // Only join rows where orderId is not null (manual stops have no orderId)
      // stopSequence included in GROUP BY to satisfy only_full_group_by sql_mode
      const [productRows] = await client.execute(
        `SELECT di.orderId, di.stopSequence, oi.productId, p.name AS productName, p.unit, SUM(oi.qty) AS shippedQty
         FROM dy_dispatch_items di
         JOIN dy_order_items oi ON oi.orderId = di.orderId
         JOIN dy_products p ON p.id = oi.productId
         WHERE di.dispatchOrderId=? AND di.tenantId=? AND di.orderId IS NOT NULL
         GROUP BY di.orderId, di.stopSequence, oi.productId, p.name, p.unit
         ORDER BY di.stopSequence, p.name`,
        [input.id, input.tenantId]
      );

      // aggregate totals across all stops (for剩貨回庫)
      const productTotals: Record<number, any> = {};
      for (const row of productRows as any[]) {
        const pid = Number(row.productId);
        if (!productTotals[pid]) {
          productTotals[pid] = { productId: pid, productName: row.productName, unit: row.unit, shippedQty: 0 };
        }
        productTotals[pid].shippedQty += Number(row.shippedQty ?? 0);
      }

      // pending returns for this dispatch (司機已回報但管理員尚未確認)
      const [pendingReturnRows] = await client.execute(
        `SELECT productId, SUM(qty) AS returnedQty
         FROM dy_pending_returns
         WHERE tenantId=? AND dispatchOrderId=?
         GROUP BY productId`,
        [input.tenantId, input.id]
      );
      const pendingReturnsByProduct: Record<number, number> = {};
      for (const row of pendingReturnRows as any[]) {
        pendingReturnsByProduct[Number(row.productId)] = Number(row.returnedQty ?? 0);
      }

      return {
        ...dispatchOrder,
        items: itemRows as any[],
        products: Object.values(productTotals),
        productsByOrder: productRows as any[],
        pendingReturnsByProduct,
      };
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
           SET currentQty = GREATEST(0, currentQty - ?), updatedAt=NOW()
           WHERE tenantId=? AND productId=?`,
          [item.qty, input.tenantId, item.productId]
        );

        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, note, createdAt)
           VALUES (?,?,'out',?,?,'dispatch_print',?,NOW())`,
          [input.tenantId, item.productId, item.qty, input.id, `派車單列印扣庫 #${item.orderId}`]
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
        `SELECT di.*, ddo.dispatchDate, ddo.driverId, o.status AS orderStatus,
                o.totalAmount, o.customerId AS orderCustomerId, o.deliveryDate AS orderDeliveryDate,
                c.settlementCycle, c.overdueDays
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

      if (item.orderId) {
        await client.execute(
          `UPDATE dy_orders
           SET paidAmount=?, paymentStatus=IF(? >= totalAmount,'paid',IF(? > 0,'partial','unpaid')),
               returnBoxes=?, remainBoxes=?, updatedAt=NOW()
           WHERE id=? AND tenantId=?`,
          [
            input.cashCollected,
            input.cashCollected, input.cashCollected,
            input.returnBoxes,
            remainBoxes,
            item.orderId,
            input.tenantId,
          ]
        );

        // 同步更新 AR（避免帳務頁與訂單付款狀態不一致）
        if (item.orderDeliveryDate && item.orderCustomerId) {
          const dueDate = calcDueDate(
            item.orderDeliveryDate,
            item.settlementCycle,
            item.overdueDays
          );
          await upsertArRecord(client, {
            tenantId: input.tenantId,
            orderId: Number(item.orderId),
            customerId: Number(item.orderCustomerId),
            amount: Number(item.totalAmount ?? 0),
            paidAmount: Number(input.cashCollected),
            dueDate,
          });
        }
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

  // 管理員點收確認：一鍵完成剩貨入庫 + 現收應收結清 + 派車單完成
  confirmHandover: dyAdminProcedure
    .input(z.object({
      dispatchOrderId: z.number(),
      tenantId: z.number(),
      cashConfirmed: z.number().min(0),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [dispatchRows] = await client.execute(
        `SELECT do2.*, d.name AS driverName, wl.totalCollected, wl.cashHandedOver, wl.handoverNote
         FROM dy_dispatch_orders do2
         JOIN dy_drivers d ON d.id = do2.driverId
         LEFT JOIN dy_work_logs wl ON wl.driverId = do2.driverId AND wl.workDate = do2.dispatchDate AND wl.tenantId = do2.tenantId
         WHERE do2.id=? AND do2.tenantId=? LIMIT 1`,
        [input.dispatchOrderId, input.tenantId]
      );
      const dispatch = (dispatchRows as any[])[0];
      if (!dispatch) throw new TRPCError({ code: "NOT_FOUND", message: "找不到派車單" });

      // 1. 確認剩貨入庫（把 pending_returns 轉為 received，寫庫存）
      const [pendingRows] = await client.execute(
        `SELECT * FROM dy_pending_returns WHERE tenantId=? AND dispatchOrderId=? AND status='pending'`,
        [input.tenantId, input.dispatchOrderId]
      );
      for (const ret of pendingRows as any[]) {
        await client.execute(
          `UPDATE dy_inventory SET currentQty = currentQty + ?, updatedAt=NOW()
           WHERE tenantId=? AND productId=?`,
          [Number(ret.qty), input.tenantId, ret.productId]
        );
        await client.execute(
          `INSERT INTO dy_stock_movements (tenantId, productId, type, qty, refId, refType, note, createdAt)
           VALUES (?,?,'in',?,?,'pending_return_confirmed',?,NOW())`,
          [input.tenantId, ret.productId, Number(ret.qty), ret.id, `管理員點收確認回庫 #${input.dispatchOrderId}`]
        );
        await client.execute(
          `UPDATE dy_pending_returns SET status='received', receivedBy=?, receivedAt=NOW(), updatedAt=NOW() WHERE id=?`,
          [ctx.user.id, ret.id]
        );
      }

      // 2. 現收應收帳款結清（這張派車單下、AR 尚未付清的記錄，管理員點收現金後標為已付）
      const [cashArRows] = await client.execute(
        `SELECT ar.id, ar.amount, ar.paidAmount
         FROM dy_ar_records ar
         JOIN dy_orders o ON o.id = ar.orderId
         JOIN dy_dispatch_items di ON di.orderId = o.id
         WHERE di.dispatchOrderId=? AND ar.tenantId=?
           AND ar.status IN ('unpaid','partial')`,
        [input.dispatchOrderId, input.tenantId]
      );

      const noteText = input.adminNote
        ? `管理員點收確認。備註：${input.adminNote}`
        : `管理員點收確認，現金 NT$${input.cashConfirmed.toLocaleString()}`;

      for (const ar of cashArRows as any[]) {
        await client.execute(
          `UPDATE dy_ar_records
           SET paidAmount=amount, status='paid', paidAt=NOW(), paymentMethod='cash', adminNote=?, updatedAt=NOW()
           WHERE id=? AND tenantId=?`,
          [noteText, ar.id, input.tenantId]
        );
      }

      // 3. 派車單標已完成
      await client.execute(
        `UPDATE dy_dispatch_orders
         SET status='completed', handoverConfirmedAt=NOW(), handoverConfirmedBy=?, completedAt=NOW(), updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [ctx.user.id, input.dispatchOrderId, input.tenantId]
      );

      const diff = input.cashConfirmed - Number(dispatch.totalCollected ?? 0);

      return {
        success: true,
        pendingReturnCount: (pendingRows as any[]).length,
        cashArSettled: (cashArRows as any[]).length,
        cashConfirmed: input.cashConfirmed,
        systemExpected: Number(dispatch.totalCollected ?? 0),
        diff,
      };
    }),
});

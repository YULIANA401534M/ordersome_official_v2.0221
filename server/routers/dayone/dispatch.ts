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

const driverProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  if (!["super_admin", "manager", "driver"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員或司機權限" });
  }
  return next({ ctx });
});

export const dyDispatchRouter = router({
  // 1. 產生派車單（管理員）
  generateDispatch: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        dispatchDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // a. 查當日訂單，JOIN 客戶取得 settlementCycle 等資訊
      const [orderRows] = await client.execute(
        `SELECT o.*, c.settlementCycle, c.overdueDays, c.address AS customerAddress,
                c.name AS customerName, c.customerLevel,
                dist.sortOrder, dist.routeCode
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         LEFT JOIN dy_districts dist ON o.districtId = dist.id
         WHERE o.tenantId=? AND o.deliveryDate=? AND o.status != 'cancelled'
         ORDER BY o.driverId, dist.sortOrder`,
        [input.tenantId, input.dispatchDate]
      );
      const orders = orderRows as any[];

      if (orders.length === 0) {
        return { dispatchOrders: [], message: "當日無訂單" };
      }

      // b. 按 driverId 分組
      const driverMap = new Map<number, any[]>();
      for (const o of orders) {
        const driverId = o.driverId ?? o.driverId ?? 0;
        if (!driverMap.has(driverId)) driverMap.set(driverId, []);
        driverMap.get(driverId)!.push(o);
      }

      const dispatchOrders: any[] = [];

      for (const [driverId, driverOrders] of Array.from(driverMap.entries())) {
        const routeCode = driverOrders[0]?.routeCode ?? "R00";

        // c. 建立 dispatch_order
        const [doResult] = await client.execute(
          `INSERT INTO dy_dispatch_orders
           (tenantId, dispatchDate, driverId, routeCode, status, generatedAt, createdAt, updatedAt)
           VALUES (?,?,?,?,'draft',NOW(),NOW(),NOW())`,
          [input.tenantId, input.dispatchDate, driverId, routeCode]
        );
        const dispatchOrderId = (doResult as any).insertId;

        let stopSeq = 1;
        for (const order of driverOrders) {
          // c. 取 prevBoxes（空箱帳餘額）
          const [boxRows] = await client.execute(
            `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
            [input.tenantId, order.customerId]
          );
          const prevBoxes = (boxRows as any[])[0]?.currentBalance ?? 0;

          // 依 settlementCycle 決定 paymentStatus
          const settlementCycle = order.settlementCycle ?? "monthly";
          let paymentStatus = "unpaid";
          if (settlementCycle === "monthly") paymentStatus = "monthly";
          else if (settlementCycle === "weekly") paymentStatus = "weekly";

          // d. INSERT dispatch_item
          await client.execute(
            `INSERT INTO dy_dispatch_items
             (dispatchOrderId, tenantId, orderId, customerId, stopSequence,
              prevBoxes, deliverBoxes, returnBoxes, remainBoxes,
              paymentStatus, cashCollected, createdAt)
             VALUES (?,?,?,?,?,?,0,0,?,?,0,NOW())`,
            [
              dispatchOrderId,
              input.tenantId,
              order.id,
              order.customerId,
              stopSeq++,
              prevBoxes,
              prevBoxes,
              paymentStatus,
            ]
          );

          // f. 建立 AR 記錄
          const today = input.dispatchDate;
          let dueDate = today;
          if (settlementCycle === "monthly") {
            // 月底 + overdueDays
            const d = new Date(today);
            const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const overdueDays = order.overdueDays ?? 5;
            lastDay.setDate(lastDay.getDate() + overdueDays);
            dueDate = lastDay.toISOString().slice(0, 10);
          } else if (settlementCycle === "weekly") {
            const d = new Date(today);
            d.setDate(d.getDate() + 7);
            dueDate = d.toISOString().slice(0, 10);
          }

          await client.execute(
            `INSERT INTO dy_ar_records
             (tenantId, orderId, customerId, amount, paidAmount, status, dueDate, createdAt, updatedAt)
             VALUES (?,?,?,?,0,'unpaid',?,NOW(),NOW())`,
            [input.tenantId, order.id, order.customerId, order.totalAmount, dueDate]
          );
        }

        dispatchOrders.push({ id: dispatchOrderId, driverId, routeCode, itemCount: driverOrders.length });
      }

      return { dispatchOrders };
    }),

  // 2. 派車單列表（管理員）
  listDispatch: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        dispatchDate: z.string().optional(),
        driverId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      let sql = `SELECT do2.*, d.name AS driverName
                 FROM dy_dispatch_orders do2
                 JOIN dy_drivers d ON do2.driverId = d.id
                 WHERE do2.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (input.dispatchDate) { sql += " AND do2.dispatchDate = ?"; params.push(input.dispatchDate); }
      if (input.driverId) { sql += " AND do2.driverId = ?"; params.push(input.driverId); }
      sql += " ORDER BY do2.dispatchDate DESC LIMIT 30";

      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 3. 取得派車單詳情（管理員 + 司機）
  getDispatchDetail: driverProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [doRows] = await client.execute(
        `SELECT do2.*, d.name AS driverName
         FROM dy_dispatch_orders do2
         JOIN dy_drivers d ON do2.driverId = d.id
         WHERE do2.id=? AND do2.tenantId=?`,
        [input.id, input.tenantId]
      );
      const dispatchOrder = (doRows as any[])[0];
      if (!dispatchOrder) throw new TRPCError({ code: "NOT_FOUND" });

      const [itemRows] = await client.execute(
        `SELECT di.*, c.name AS customerName, c.address AS customerAddress,
                c.phone AS customerPhone,
                o.totalAmount AS orderAmount, o.orderNo
         FROM dy_dispatch_items di
         JOIN dy_customers c ON di.customerId = c.id
         LEFT JOIN dy_orders o ON di.orderId = o.id
         WHERE di.dispatchOrderId=? AND di.tenantId=?
         ORDER BY di.stopSequence ASC`,
        [input.id, input.tenantId]
      );

      return { ...dispatchOrder, items: itemRows as any[] };
    }),

  // 4. 標記已列印（管理員）
  markPrinted: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        `UPDATE dy_dispatch_orders SET status='printed', printedAt=NOW(), updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),

  // 5. 司機更新配送站點（司機）
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 取得現有 dispatch_item
      const [diRows] = await client.execute(
        `SELECT * FROM dy_dispatch_items WHERE id=? AND tenantId=?`,
        [input.itemId, input.tenantId]
      );
      const item = (diRows as any[])[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const remainBoxes = item.prevBoxes + item.deliverBoxes - input.returnBoxes;

      // 更新 dispatch_item
      await client.execute(
        `UPDATE dy_dispatch_items
         SET returnBoxes=?, remainBoxes=?, cashCollected=?, paymentStatus=?, driverNote=?
         WHERE id=? AND tenantId=?`,
        [
          input.returnBoxes,
          remainBoxes,
          input.cashCollected,
          input.paymentStatus,
          input.driverNote ?? null,
          input.itemId,
          input.tenantId,
        ]
      );

      // 更新 box_ledger
      const [ledgerRows] = await client.execute(
        `SELECT id, currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
        [input.tenantId, item.customerId]
      );
      const ledger = (ledgerRows as any[])[0];
      const balanceBefore = ledger?.currentBalance ?? 0;
      const balanceAfter = remainBoxes;

      if (ledger) {
        await client.execute(
          `UPDATE dy_box_ledger SET currentBalance=?, updatedAt=NOW()
           WHERE tenantId=? AND customerId=?`,
          [remainBoxes, input.tenantId, item.customerId]
        );
      } else {
        await client.execute(
          `INSERT INTO dy_box_ledger (tenantId, customerId, currentBalance)
           VALUES (?,?,?)`,
          [input.tenantId, item.customerId, remainBoxes]
        );
      }

      // 若餘額有變動，記錄交易
      if (balanceBefore !== balanceAfter) {
        const txType = balanceAfter > balanceBefore ? "delivery" : "return";
        const quantity = Math.abs(balanceAfter - balanceBefore);
        await client.execute(
          `INSERT INTO dy_box_transactions
           (tenantId, customerId, dispatchItemId, type, quantity, balanceBefore, balanceAfter, createdAt)
           VALUES (?,?,?,?,?,?,?,NOW())`,
          [input.tenantId, item.customerId, input.itemId, txType, quantity, balanceBefore, balanceAfter]
        );
      }

      // 若現付且已付，更新 AR
      if (input.paymentStatus === "paid" && item.orderId) {
        await client.execute(
          `UPDATE dy_ar_records SET paidAt=NOW(), status='paid', updatedAt=NOW()
           WHERE tenantId=? AND orderId=?`,
          [input.tenantId, item.orderId]
        );
      }

      return { success: true, remainBoxes };
    }),

  // 6. 司機完成派車（司機）
  completeDispatch: driverProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        actualAmount: z.number(),
        driverNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 計算應收總額
      const [sumRows] = await client.execute(
        `SELECT COALESCE(SUM(cashCollected), 0) AS expectedAmount,
                MIN(tenantId) AS tenantId, MIN(dispatchOrderId) AS dispatchOrderId
         FROM dy_dispatch_items
         WHERE dispatchOrderId=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const expectedAmount = parseFloat((sumRows as any[])[0]?.expectedAmount ?? 0);
      const diff = input.actualAmount - expectedAmount;
      const status = Math.abs(diff) < 1 ? "normal" : "anomaly";

      // 取得司機 ID
      const [doRows] = await client.execute(
        `SELECT driverId FROM dy_dispatch_orders WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const driverId = (doRows as any[])[0]?.driverId;

      // 更新派車單狀態
      await client.execute(
        `UPDATE dy_dispatch_orders
         SET status='completed', completedAt=NOW(), updatedAt=NOW()
         WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );

      // 建立司機現金繳款報告
      const today = new Date().toISOString().slice(0, 10);
      const [reportResult] = await client.execute(
        `INSERT INTO dy_driver_cash_reports
         (tenantId, driverId, reportDate, expectedAmount, actualAmount, diff, status, driverNote, createdAt)
         VALUES (?,?,?,?,?,?,?,?,NOW())`,
        [
          input.tenantId,
          driverId,
          today,
          expectedAmount,
          input.actualAmount,
          diff,
          status,
          input.driverNote ?? null,
        ]
      );

      return { success: true, expectedAmount, diff, status, reportId: (reportResult as any).insertId };
    }),

  // 7. 臨時加站（管理員 + 司機）
  manualAddStop: driverProcedure
    .input(
      z.object({
        dispatchOrderId: z.number(),
        tenantId: z.number(),
        customerId: z.number(),
        deliverBoxes: z.number(),
        paymentStatus: z.string(),
        items: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 取得目前最大 stopSequence
      const [seqRows] = await client.execute(
        `SELECT COALESCE(MAX(stopSequence), 0) AS maxSeq
         FROM dy_dispatch_items WHERE dispatchOrderId=? AND tenantId=?`,
        [input.dispatchOrderId, input.tenantId]
      );
      const nextSeq = ((seqRows as any[])[0]?.maxSeq ?? 0) + 1;

      // 取得空箱餘額
      const [boxRows] = await client.execute(
        `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
        [input.tenantId, input.customerId]
      );
      const prevBoxes = (boxRows as any[])[0]?.currentBalance ?? 0;
      const remainBoxes = prevBoxes + input.deliverBoxes;

      // INSERT dispatch_item
      const [result] = await client.execute(
        `INSERT INTO dy_dispatch_items
         (dispatchOrderId, tenantId, orderId, customerId, stopSequence,
          prevBoxes, deliverBoxes, returnBoxes, remainBoxes, paymentStatus, cashCollected, createdAt)
         VALUES (?,?,NULL,?,?,?,?,0,?,?,0,NOW())`,
        [
          input.dispatchOrderId,
          input.tenantId,
          input.customerId,
          nextSeq,
          prevBoxes,
          input.deliverBoxes,
          remainBoxes,
          input.paymentStatus,
        ]
      );

      // 更新 box_ledger
      if ((boxRows as any[]).length > 0) {
        await client.execute(
          `UPDATE dy_box_ledger SET currentBalance=?, updatedAt=NOW()
           WHERE tenantId=? AND customerId=?`,
          [remainBoxes, input.tenantId, input.customerId]
        );
      } else {
        await client.execute(
          `INSERT INTO dy_box_ledger (tenantId, customerId, currentBalance)
           VALUES (?,?,?)`,
          [input.tenantId, input.customerId, remainBoxes]
        );
      }

      return { id: (result as any).insertId, stopSequence: nextSeq };
    }),
});

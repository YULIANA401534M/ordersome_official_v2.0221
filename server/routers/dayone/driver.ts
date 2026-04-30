import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { storagePut } from "../../storage";
import { dayoneDriverProcedure as driverProcedure } from "./procedures";
import { calcDueDate, todayTW, upsertArRecord } from "./utils";

function cashCollectedStatus(cash: number, total: number, cycle: string): string {
  if (cycle === "monthly") return "monthly";
  if (cycle === "weekly") return "weekly";
  if (cash >= total && total > 0) return "paid";
  if (cash > 0) return "partial";
  return "unpaid";
}

async function getDriverByUser(client: any, userId: number, tenantId: number) {
  const [rows] = await client.execute(
    `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
    [userId, tenantId]
  );
  return (rows as any[])[0];
}

export const dyDriverRouter = router({
  getMyTodayOrders: driverProcedure
    .input(z.object({ tenantId: z.number(), deliveryDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const date = input.deliveryDate ?? todayTW();
      const client = (db as any).$client;

      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Driver account is not linked to Dayone" });
      }

      // TiDB 不支援 JOIN ON 內有子查詢，先查出當日派車單 ID 再帶入
      const [dispatchRows] = await client.execute(
        `SELECT id FROM dy_dispatch_orders
         WHERE tenantId=? AND driverId=?
           AND DATE(CONVERT_TZ(dispatchDate,'+00:00','+08:00'))=?
           AND status IN ('draft','printed','in_progress','pending_handover')
         ORDER BY id DESC LIMIT 1`,
        [input.tenantId, driver.id, date]
      );
      const dispatchId = (dispatchRows as any[])[0]?.id ?? 0;

      const [rows] = await client.execute(
        `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone,
                c.settlementCycle, c.overdueDays,
                dist.name as districtName,
                di.stopSequence,
                (SELECT COALESCE(SUM(uo.totalAmount - uo.paidAmount), 0)
                 FROM dy_orders uo
                 WHERE uo.customerId = o.customerId AND uo.tenantId = o.tenantId
                   AND uo.paymentStatus != 'paid' AND uo.status = 'delivered'
                   AND uo.id != o.id) AS customerUnpaidAmount
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         LEFT JOIN dy_districts dist ON o.districtId = dist.id
         LEFT JOIN dy_dispatch_items di
           ON di.orderId = o.id AND di.tenantId = o.tenantId AND di.dispatchOrderId = ?
         WHERE o.tenantId = ? AND o.driverId = ?
           AND DATE(CONVERT_TZ(o.deliveryDate,'+00:00','+08:00')) = ?
           AND o.status NOT IN ('cancelled','delivered')
         ORDER BY COALESCE(di.stopSequence, 9999) ASC, o.id ASC`,
        [dispatchId, input.tenantId, driver.id, date]
      );
      return rows as any[];
    }),

  updateOrderStatus: driverProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        status: z.enum(["picked", "delivering", "delivered", "returned"]),
        driverNote: z.string().optional(),
        inBoxes: z.number().int().min(0).optional(),
        returnBoxes: z.number().int().min(0).optional(),
        cashCollected: z.number().min(0).optional(),
        rejectNote: z.string().optional(), // 拒收原因
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "FORBIDDEN", message: "司機帳號未連結" });
      }

      // 拒收時把原因合入 driverNote
      const effectiveNote = input.rejectNote
        ? `【拒收】${input.rejectNote}`
        : (input.driverNote ?? null);

      const setParts = [
        "status=?",
        "driverNote=COALESCE(?, driverNote)",
        "updatedAt=NOW()",
      ];
      const params: any[] = [input.status, effectiveNote];

      if (input.inBoxes !== undefined) {
        setParts.push("inBoxes=?");
        params.push(input.inBoxes);
      }
      if (input.returnBoxes !== undefined) {
        setParts.push("returnBoxes=?");
        params.push(input.returnBoxes);
      }
      if (input.cashCollected !== undefined) {
        setParts.push("cashCollected=?", "paidAmount=?");
        setParts.push("paymentStatus=IF(? >= totalAmount,'paid',IF(? > 0,'partial','unpaid'))");
        params.push(input.cashCollected, input.cashCollected, input.cashCollected, input.cashCollected);
      }

      params.push(input.id, input.tenantId, driver.id);
      await client.execute(
        `UPDATE dy_orders SET ${setParts.join(",")} WHERE id=? AND tenantId=? AND driverId=?`,
        params
      );

      if (input.status === "delivered") {
        if (input.rejectNote) {
          // 拒收：不應有應收帳款，若已有舊 AR 一併刪除
          await client.execute(
            `DELETE FROM dy_ar_records WHERE tenantId=? AND orderId=?`,
            [input.tenantId, input.id]
          );
        } else {
          // 正常送達：建立或更新 AR
          const [orderRows] = await client.execute(
            `SELECT o.id, o.customerId, o.deliveryDate, o.totalAmount, o.paidAmount, c.settlementCycle, c.overdueDays
             FROM dy_orders o JOIN dy_customers c ON c.id = o.customerId
             WHERE o.id=? AND o.tenantId=? LIMIT 1`,
            [input.id, input.tenantId]
          );
          const order = (orderRows as any[])[0];
          if (order) {
            const twDate = new Date(new Date(order.deliveryDate).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
            await upsertArRecord(client, {
              tenantId: input.tenantId,
              orderId: order.id,
              customerId: order.customerId,
              amount: Number(order.totalAmount ?? 0),
              paidAmount: Number(order.paidAmount ?? 0),
              dueDate: calcDueDate(twDate, order.settlementCycle, order.overdueDays),
            });
          }
        }
      }

      return { success: true };
    }),

  recordCashPayment: driverProcedure
    .input(z.object({ orderId: z.number(), tenantId: z.number(), cashCollected: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver account is not linked to Dayone" });
      }

      await client.execute(
        `UPDATE dy_orders
         SET cashCollected=?, paidAmount=?, paymentStatus=IF(? >= totalAmount, 'paid', IF(? > 0, 'partial', 'unpaid')), updatedAt=NOW()
         WHERE id=? AND tenantId=? AND driverId=?`,
        [input.cashCollected, input.cashCollected, input.cashCollected, input.cashCollected, input.orderId, input.tenantId, driver.id]
      );

      const [orderRows] = await client.execute(
        `SELECT o.id, o.customerId, o.deliveryDate, o.status, o.totalAmount, o.paidAmount, c.settlementCycle, c.overdueDays
         FROM dy_orders o
         JOIN dy_customers c ON c.id = o.customerId
         WHERE o.id=? AND o.tenantId=? AND o.driverId=? LIMIT 1`,
        [input.orderId, input.tenantId, driver.id]
      );
      const order = (orderRows as any[])[0];
      const isRejected = String(order?.driverNote ?? "").startsWith("【拒收】");
      if (order && order.status === "delivered" && !isRejected) {
        const twDate = new Date(new Date(order.deliveryDate).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
        await upsertArRecord(client, {
          tenantId: input.tenantId,
          orderId: order.id,
          customerId: order.customerId,
          amount: Number(order.totalAmount ?? 0),
          paidAmount: Number(order.paidAmount ?? 0),
          dueDate: calcDueDate(twDate, order.settlementCycle, order.overdueDays),
        });
        // 同步更新派車單站點的收款金額（確保派車工作台數字與 AR 一致）
        const cashVal = input.cashCollected;
        const totalVal = Number(order.totalAmount ?? 0);
        const newPayStatus = cashVal >= totalVal && totalVal > 0 ? "paid" : cashVal > 0 ? "partial" : "unpaid";
        await client.execute(
          `UPDATE dy_dispatch_items SET cashCollected=?, paymentStatus=?
           WHERE orderId=? AND tenantId=?`,
          [cashVal, newPayStatus, input.orderId, input.tenantId]
        );
      }

      return { success: true };
    }),

  submitWorkLog: driverProcedure
    .input(z.object({
      tenantId: z.number(),
      workDate: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      note: z.string().optional(),
      cashHandedOver: z.number().min(0).optional(),
      handoverNote: z.string().optional(),
      dispatchOrderId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver account is not linked to Dayone" });
      }

      // 只計算這張派車單關聯的已送達訂單
      const [summaryRows] = await client.execute(
        `SELECT COUNT(*) as totalOrders, COALESCE(SUM(o.cashCollected),0) as totalCollected
         FROM dy_dispatch_items di
         JOIN dy_orders o ON o.id = di.orderId
         WHERE di.dispatchOrderId=? AND di.tenantId=? AND o.status='delivered'`,
        [input.dispatchOrderId, input.tenantId]
      );
      const summary = (summaryRows as any[])[0];
      const cashHandedOver = input.cashHandedOver ?? null;

      await client.execute(
        `INSERT INTO dy_work_logs
           (tenantId, driverId, dispatchOrderId, workDate, startTime, endTime, totalOrders, totalCollected, cashHandedOver, handoverNote, note, createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())
         ON DUPLICATE KEY UPDATE startTime=VALUES(startTime), endTime=VALUES(endTime),
         totalOrders=VALUES(totalOrders), totalCollected=VALUES(totalCollected),
         cashHandedOver=VALUES(cashHandedOver), handoverNote=VALUES(handoverNote), note=VALUES(note)`,
        [input.tenantId, driver.id, input.dispatchOrderId, input.workDate,
         input.startTime ?? null, input.endTime ?? null,
         summary?.totalOrders ?? 0, summary?.totalCollected ?? 0,
         cashHandedOver, input.handoverNote ?? null, input.note ?? null]
      );

      // 標記這張派車單為待點收
      await client.execute(
        `UPDATE dy_dispatch_orders SET status='pending_handover', updatedAt=NOW()
         WHERE id=? AND tenantId=? AND driverId=? AND status IN ('printed','in_progress')`,
        [input.dispatchOrderId, input.tenantId, driver.id]
      );

      return { success: true, totalOrders: summary?.totalOrders ?? 0, totalCollected: Number(summary?.totalCollected ?? 0) };
    }),

  uploadSignature: driverProcedure
    .input(z.object({ orderId: z.number(), tenantId: z.number(), imageBase64: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver account is not linked to Dayone" });
      }

      const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileKey = `signatures/${input.tenantId}/${input.orderId}-${Date.now()}.png`;
      const { url } = await storagePut(fileKey, buffer, "image/png");

      await client.execute(
        `UPDATE dy_orders SET signatureUrl=?, updatedAt=NOW() WHERE id=? AND tenantId=? AND driverId=?`,
        [url, input.orderId, input.tenantId, driver.id]
      );
      await client.execute(
        `INSERT INTO dy_delivery_signatures (tenantId, refId, refType, signatureUrl, signedBy, signedAt)
         VALUES (?,?,'order',?,?,NOW())`,
        [input.tenantId, input.orderId, url, driver.id]
      );
      return { success: true, signatureUrl: url };
    }),

  // 司機今日路線上的客戶清單（補單用）
  getMyRouteCustomers: driverProcedure
    .input(z.object({ tenantId: z.number(), deliveryDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) throw new TRPCError({ code: "NOT_FOUND", message: "Driver not linked" });
      const date = input.deliveryDate ?? todayTW();

      // 今日路線上的客戶（不重複）
      const [rows] = await client.execute(
        `SELECT DISTINCT c.id, c.name, c.phone, c.address, c.settlementCycle
         FROM dy_orders o
         JOIN dy_customers c ON c.id = o.customerId
         WHERE o.tenantId=? AND o.driverId=? AND DATE(CONVERT_TZ(o.deliveryDate,'+00:00','+08:00'))=?
         ORDER BY c.name ASC`,
        [input.tenantId, driver.id, date]
      );
      return rows as any[];
    }),

  // 臨時加貨補單（司機現場）
  addSupplementOrder: driverProcedure
    .input(z.object({
      tenantId: z.number(),
      dispatchOrderId: z.number(),
      // 客戶：選現有客戶 or 填臨時名稱
      customerId: z.number().optional(),
      tempCustomerName: z.string().optional(),
      tempCustomerNote: z.string().optional(),
      // 品項
      items: z.array(z.object({
        productId: z.number(),
        qty: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      })),
      // 收款
      cashCollected: z.number().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) throw new TRPCError({ code: "FORBIDDEN", message: "Driver not linked" });

      const [dispatchRows] = await client.execute(
        `SELECT id, driverId, dispatchDate, status FROM dy_dispatch_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.dispatchOrderId, input.tenantId]
      );
      const dispatch = (dispatchRows as any[])[0];
      if (!dispatch) throw new TRPCError({ code: "NOT_FOUND", message: "Dispatch not found" });
      if (Number(dispatch.driverId) !== Number(driver.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "此派車單不屬於你" });
      }
      if (!["printed", "in_progress"].includes(dispatch.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "只有已列印或配送中的派車單可加補單" });
      }
      if (!input.customerId && !input.tempCustomerName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "需選擇客戶或填臨時客戶名稱" });
      }

      let customerId = input.customerId;
      let settlementCycle = "per_delivery";
      let customerOverdueDays = 30;

      if (customerId) {
        const [cRows] = await client.execute(
          `SELECT id, settlementCycle, overdueDays, districtId FROM dy_customers WHERE id=? AND tenantId=? LIMIT 1`,
          [customerId, input.tenantId]
        );
        const c = (cRows as any[])[0];
        if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        settlementCycle = c.settlementCycle ?? "per_delivery";
        customerOverdueDays = Number(c.overdueDays ?? 30);
      } else {
        // 建立臨時客戶
        const [cResult] = await client.execute(
          `INSERT INTO dy_customers (tenantId, name, settlementCycle, status, creditLimit, outstandingAmount, createdAt, updatedAt)
           VALUES (?,?,'per_delivery','active',0,0,NOW(),NOW())`,
          [input.tenantId, input.tempCustomerName!.trim()]
        );
        customerId = Number((cResult as any).insertId);
        // 在客戶備註記管理員可見的說明
        if (input.tempCustomerNote) {
          await client.execute(
            `UPDATE dy_customers SET portalNote=? WHERE id=?`,
            [`[臨時客戶] ${input.tempCustomerNote}`, customerId]
          );
        }
      }

      const addedAmount = input.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      // dispatchDate 從 DB 取出是 UTC，轉成台灣日期字串（+8h）
      const twDeliveryDate = new Date(new Date(dispatch.dispatchDate).getTime() + 8 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

      // ── 嘗試合併到同客戶今日未完成訂單（僅限現有客戶，臨時客戶永遠建新單）──
      let mergedOrderId: number | null = null;
      if (customerId) {
        const [existRows] = await client.execute(
          `SELECT o.id, o.totalAmount, o.paidAmount, o.cashCollected
           FROM dy_orders o
           JOIN dy_dispatch_items di ON di.orderId = o.id
           WHERE di.dispatchOrderId = ? AND o.customerId = ? AND o.tenantId = ?
             AND o.status IN ('picked','delivering','assigned')
           ORDER BY o.id DESC LIMIT 1`,
          [input.dispatchOrderId, customerId, input.tenantId]
        );
        const existOrder = (existRows as any[])[0];
        if (existOrder) {
          mergedOrderId = Number(existOrder.id);
          // 追加品項到現有訂單
          for (const item of input.items) {
            await client.execute(
              `INSERT INTO dy_order_items (tenantId, orderId, productId, qty, unitPrice, subtotal, returnQty)
               VALUES (?,?,?,?,?,?,0)`,
              [input.tenantId, mergedOrderId, item.productId, item.qty, item.unitPrice, item.qty * item.unitPrice]
            );
          }
          // 從 dy_ar_records 讀現有已收金額（比 dy_orders 更準確，管理員可能已手動登帳）
          const [existArRows] = await client.execute(
            `SELECT paidAmount FROM dy_ar_records WHERE tenantId=? AND orderId=? LIMIT 1`,
            [input.tenantId, mergedOrderId]
          );
          const arPaidAmount = Number((existArRows as any[])[0]?.paidAmount ?? existOrder.paidAmount ?? 0);

          // 重算訂單金額
          const newTotal = Number(existOrder.totalAmount) + addedAmount;
          const newCash = Number(existOrder.cashCollected ?? 0) + input.cashCollected;
          const newPaid = arPaidAmount + input.cashCollected;
          const newPayStatus = cashCollectedStatus(newCash, newTotal, settlementCycle);
          await client.execute(
            `UPDATE dy_orders SET totalAmount=?, cashCollected=?, paidAmount=?, paymentStatus=?, updatedAt=NOW() WHERE id=?`,
            [newTotal, newCash, newPaid, newPayStatus, mergedOrderId]
          );
          // 更新派車單站點的金額
          await client.execute(
            `UPDATE dy_dispatch_items SET paymentStatus=?, cashCollected=? WHERE dispatchOrderId=? AND orderId=?`,
            [newPayStatus, newCash, input.dispatchOrderId, mergedOrderId]
          );
          // 更新 AR
          const dueDate = calcDueDate(twDeliveryDate, settlementCycle, customerOverdueDays);
          await upsertArRecord(client, {
            tenantId: input.tenantId,
            orderId: mergedOrderId,
            customerId: customerId!,
            amount: newTotal,
            paidAmount: newPaid,
            dueDate,
          });
        }
      }

      // ── 無法合併（臨時客戶 or 該客戶今日無未完成訂單）→ 建新補單 ──
      let orderId: number;
      let orderNo: string;
      if (mergedOrderId) {
        orderId = mergedOrderId;
        orderNo = `MERGED-${orderId}`;
      } else {
        const totalAmount = addedAmount;
        const paymentStatus = cashCollectedStatus(input.cashCollected, totalAmount, settlementCycle);
        orderNo = `SUPP${Date.now()}`;

        const [orderResult] = await client.execute(
          `INSERT INTO dy_orders
           (tenantId, orderNo, customerId, driverId, deliveryDate, status, totalAmount,
            paidAmount, paymentStatus, cashCollected, orderType, orderSource, createdAt, updatedAt)
           VALUES (?,?,?,?,?,'delivered',?,?,?,?,'supplement','driver_app',NOW(),NOW())`,
          [
            input.tenantId, orderNo, customerId, driver.id, twDeliveryDate,
            totalAmount, input.cashCollected, paymentStatus, input.cashCollected,
          ]
        );
        orderId = Number((orderResult as any).insertId);

        for (const item of input.items) {
          await client.execute(
            `INSERT INTO dy_order_items (tenantId, orderId, productId, qty, unitPrice, subtotal, returnQty)
             VALUES (?,?,?,?,?,?,0)`,
            [input.tenantId, orderId, item.productId, item.qty, item.unitPrice, item.qty * item.unitPrice]
          );
        }

        // 加入派車單站點
        const [seqRows] = await client.execute(
          `SELECT COALESCE(MAX(stopSequence),0) AS maxSeq FROM dy_dispatch_items WHERE dispatchOrderId=?`,
          [input.dispatchOrderId]
        );
        const nextSeq = Number((seqRows as any[])[0]?.maxSeq ?? 0) + 1;
        await client.execute(
          `INSERT INTO dy_dispatch_items
           (dispatchOrderId, tenantId, orderId, customerId, stopSequence,
            prevBoxes, deliverBoxes, returnBoxes, remainBoxes, paymentStatus, cashCollected, createdAt)
           VALUES (?,?,?,?,?,0,0,0,0,?,?,NOW())`,
          [input.dispatchOrderId, input.tenantId, orderId, customerId, nextSeq, paymentStatus, input.cashCollected]
        );

        // AR
        const dueDate = calcDueDate(twDeliveryDate, settlementCycle, customerOverdueDays);
        await upsertArRecord(client, {
          tenantId: input.tenantId,
          orderId,
          customerId: customerId!,
          amount: totalAmount,
          paidAmount: input.cashCollected,
          dueDate,
        });
      }

      // 庫存移轉記錄（無論合併或新建）
      for (const item of input.items) {
        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, note, createdAt)
           VALUES (?,?,'out',?,?,'supplement_order',?,NOW())`,
          [
            input.tenantId,
            item.productId,
            item.qty,
            orderId,
            `補單#${orderId} 動用備用箱 派車單#${input.dispatchOrderId}`,
          ]
        );
      }

      return { success: true, orderId, orderNo, totalAmount: addedAmount, merged: !!mergedOrderId };
    }),

  getOrderItems: driverProcedure
    .input(z.object({ orderId: z.number(), tenantId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) throw new TRPCError({ code: "FORBIDDEN", message: "Driver not linked" });
      // 確認這筆訂單屬於這位司機（安全檢查）
      const [orderRows] = await client.execute(
        `SELECT id FROM dy_orders WHERE id=? AND tenantId=? AND driverId=? LIMIT 1`,
        [input.orderId, input.tenantId, driver.id]
      );
      if (!(orderRows as any[])[0]) throw new TRPCError({ code: "FORBIDDEN", message: "無此訂單" });
      const [items] = await client.execute(
        `SELECT oi.id, oi.productId, oi.qty, oi.unitPrice, oi.subtotal,
                p.name as productName, p.code, p.unit
         FROM dy_order_items oi
         JOIN dy_products p ON p.id = oi.productId
         WHERE oi.orderId=? AND oi.tenantId=?`,
        [input.orderId, input.tenantId]
      );
      return items as any[];
    }),

  getMyWorkLog: driverProcedure
    .input(z.object({ tenantId: z.number(), workDate: z.string(), dispatchOrderId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) return null;

      if (input.dispatchOrderId) {
        const [logRows] = await client.execute(
          `SELECT * FROM dy_work_logs WHERE driverId=? AND dispatchOrderId=? AND tenantId=? LIMIT 1`,
          [driver.id, input.dispatchOrderId, input.tenantId]
        );
        return (logRows as any[])[0] ?? null;
      }
      // fallback: 按 workDate 查最新一筆（向下相容）
      const [logRows] = await client.execute(
        `SELECT * FROM dy_work_logs WHERE driverId=? AND workDate=? AND tenantId=? ORDER BY id DESC LIMIT 1`,
        [driver.id, input.workDate, input.tenantId]
      );
      return (logRows as any[])[0] ?? null;
    }),
});

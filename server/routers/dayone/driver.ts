import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { storagePut } from "../../storage";
import { dayoneDriverProcedure as driverProcedure } from "./procedures";
import { calcDueDate, todayTW, upsertArRecord } from "./utils";

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
         LEFT JOIN dy_dispatch_items di ON di.orderId = o.id AND di.tenantId = o.tenantId
         WHERE o.tenantId = ? AND o.driverId = ? AND o.deliveryDate = ?
         ORDER BY COALESCE(di.stopSequence, 9999) ASC, o.id ASC`,
        [input.tenantId, driver.id, date]
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
        // Box counts recorded when driver arrives at customer
        inBoxes: z.number().int().min(0).optional(),
        returnBoxes: z.number().int().min(0).optional(),
        // Cash collected at this stop (for delivered)
        cashCollected: z.number().min(0).optional(),
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

      // Build dynamic SET clauses for optional fields
      const setParts = [
        "status=?",
        "driverNote=COALESCE(?, driverNote)",
        "updatedAt=NOW()",
      ];
      const params: any[] = [input.status, input.driverNote ?? null];

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
            orderId: order.id,
            customerId: order.customerId,
            amount: Number(order.totalAmount ?? 0),
            paidAmount: Number(order.paidAmount ?? 0),
            dueDate: calcDueDate(order.deliveryDate, order.settlementCycle, order.overdueDays),
          });
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
      if (order && order.status === "delivered") {
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

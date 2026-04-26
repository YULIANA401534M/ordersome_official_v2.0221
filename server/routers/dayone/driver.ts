import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { storagePut } from "../../storage";
import { dayoneDriverProcedure as driverProcedure } from "./procedures";


function calcDueDate(deliveryDate: string, settlementCycle?: string | null, overdueDays?: number | null) {
  const date = new Date(deliveryDate);
  if (settlementCycle === "weekly") {
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }
  if (settlementCycle === "monthly") {
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    monthEnd.setDate(monthEnd.getDate() + Number(overdueDays ?? 5));
    return monthEnd.toISOString().slice(0, 10);
  }
  return deliveryDate;
}

async function getDriverByUser(client: any, userId: number, tenantId: number) {
  const [rows] = await client.execute(
    `SELECT id FROM dy_drivers WHERE userId = ? AND tenantId = ? LIMIT 1`,
    [userId, tenantId]
  );
  return (rows as any[])[0];
}

async function upsertOrderReceivable(
  client: any,
  payload: {
    tenantId: number;
    orderId: number;
    customerId: number;
    deliveryDate: string;
    settlementCycle?: string | null;
    overdueDays?: number | null;
    totalAmount: number;
    paidAmount: number;
  }
) {
  const dueDate = calcDueDate(payload.deliveryDate, payload.settlementCycle, payload.overdueDays);
  const status = payload.paidAmount >= payload.totalAmount ? "paid" : payload.paidAmount > 0 ? "partial" : "unpaid";
  const [existingRows] = await client.execute(
    `SELECT id FROM dy_ar_records WHERE tenantId=? AND orderId=? LIMIT 1`,
    [payload.tenantId, payload.orderId]
  );
  const existing = (existingRows as any[])[0];

  if (existing) {
    await client.execute(
      `UPDATE dy_ar_records
       SET amount=?, paidAmount=?, status=?, dueDate=?, paymentMethod=IF(? > 0, 'cash', paymentMethod),
           paidAt=CASE WHEN ? >= ? THEN NOW() ELSE paidAt END, updatedAt=NOW()
       WHERE id=? AND tenantId=?`,
      [payload.totalAmount, payload.paidAmount, status, dueDate, payload.paidAmount, payload.paidAmount, payload.totalAmount, existing.id, payload.tenantId]
    );
    return existing.id;
  }

  const [result] = await client.execute(
    `INSERT INTO dy_ar_records
     (tenantId, orderId, customerId, amount, paidAmount, status, dueDate, paymentMethod, paidAt, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,IF(? > 0, 'cash', NULL), CASE WHEN ? >= ? THEN NOW() ELSE NULL END, NOW(), NOW())`,
    [payload.tenantId, payload.orderId, payload.customerId, payload.totalAmount, payload.paidAmount, status, dueDate, payload.paidAmount, payload.paidAmount, payload.totalAmount]
  );
  return (result as any).insertId;
}

export const dyDriverRouter = router({
  getMyTodayOrders: driverProcedure
    .input(z.object({ tenantId: z.number(), deliveryDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const date = input.deliveryDate ?? new Date().toISOString().slice(0, 10);
      const client = (db as any).$client;

      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Driver account is not linked to Dayone" });
      }

      const [rows] = await client.execute(
        `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone,
                c.settlementCycle, c.overdueDays,
                dist.name as districtName,
                (SELECT COALESCE(SUM(uo.totalAmount - uo.paidAmount), 0)
                 FROM dy_orders uo
                 WHERE uo.customerId = o.customerId AND uo.tenantId = o.tenantId
                   AND uo.paymentStatus != 'paid' AND uo.status = 'delivered'
                   AND uo.id != o.id) AS customerUnpaidAmount
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         LEFT JOIN dy_districts dist ON o.districtId = dist.id
         WHERE o.tenantId = ? AND o.driverId = ? AND o.deliveryDate = ?
         ORDER BY o.id ASC`,
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
      })
    )
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
         SET status=?, driverNote=COALESCE(?, driverNote), updatedAt=NOW()
         WHERE id=? AND tenantId=? AND driverId=?`,
        [input.status, input.driverNote ?? null, input.id, input.tenantId, driver.id]
      );

      if (input.status === "delivered") {
        const [orderRows] = await client.execute(
          `SELECT o.id, o.customerId, o.deliveryDate, o.totalAmount, o.paidAmount, c.settlementCycle, c.overdueDays
           FROM dy_orders o
           JOIN dy_customers c ON c.id = o.customerId
           WHERE o.id=? AND o.tenantId=? LIMIT 1`,
          [input.id, input.tenantId]
        );
        const order = (orderRows as any[])[0];
        if (order) {
          await upsertOrderReceivable(client, {
            tenantId: input.tenantId,
            orderId: order.id,
            customerId: order.customerId,
            deliveryDate: order.deliveryDate,
            settlementCycle: order.settlementCycle,
            overdueDays: order.overdueDays,
            totalAmount: Number(order.totalAmount ?? 0),
            paidAmount: Number(order.paidAmount ?? 0),
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
        await upsertOrderReceivable(client, {
          tenantId: input.tenantId,
          orderId: order.id,
          customerId: order.customerId,
          deliveryDate: order.deliveryDate,
          settlementCycle: order.settlementCycle,
          overdueDays: order.overdueDays,
          totalAmount: Number(order.totalAmount ?? 0),
          paidAmount: Number(order.paidAmount ?? 0),
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
      dispatchOrderId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver account is not linked to Dayone" });
      }

      const [summaryRows] = await client.execute(
        `SELECT COUNT(*) as totalOrders, COALESCE(SUM(cashCollected),0) as totalCollected
         FROM dy_orders WHERE tenantId=? AND driverId=? AND deliveryDate=? AND status='delivered'`,
        [input.tenantId, driver.id, input.workDate]
      );
      const summary = (summaryRows as any[])[0];
      const cashHandedOver = input.cashHandedOver ?? null;

      await client.execute(
        `INSERT INTO dy_work_logs (tenantId, driverId, workDate, startTime, endTime, totalOrders, totalCollected, cashHandedOver, handoverNote, note, createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,NOW())
         ON DUPLICATE KEY UPDATE startTime=VALUES(startTime), endTime=VALUES(endTime),
         totalOrders=VALUES(totalOrders), totalCollected=VALUES(totalCollected),
         cashHandedOver=VALUES(cashHandedOver), handoverNote=VALUES(handoverNote), note=VALUES(note)`,
        [input.tenantId, driver.id, input.workDate, input.startTime ?? null, input.endTime ?? null,
         summary?.totalOrders ?? 0, summary?.totalCollected ?? 0,
         cashHandedOver, input.handoverNote ?? null, input.note ?? null]
      );

      // Mark dispatch order as pending_handover so admin knows driver is back
      if (input.dispatchOrderId) {
        await client.execute(
          `UPDATE dy_dispatch_orders SET status='pending_handover', updatedAt=NOW()
           WHERE id=? AND tenantId=? AND driverId=? AND status='printed'`,
          [input.dispatchOrderId, input.tenantId, driver.id]
        );
      }

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
    .input(z.object({ tenantId: z.number(), workDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;
      const driver = await getDriverByUser(client, ctx.user.id, input.tenantId);
      if (!driver) return null;

      const [logRows] = await client.execute(
        `SELECT * FROM dy_work_logs WHERE driverId=? AND workDate=? AND tenantId=? LIMIT 1`,
        [driver.id, input.workDate, input.tenantId]
      );
      return (logRows as any[])[0] ?? null;
    }),
});

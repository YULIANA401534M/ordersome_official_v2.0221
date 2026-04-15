import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

const dyDriverProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  if (!['super_admin', 'manager', 'driver'].includes(role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員或司機權限' });
  }
  return next({ ctx });
});

export const dyOrdersRouter = router({
  list: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      deliveryDate: z.string().optional(),
      driverId: z.number().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      let sql = `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone,
                        d.name as driverName, dist.name as districtName
                 FROM dy_orders o
                 JOIN dy_customers c ON o.customerId = c.id
                 LEFT JOIN dy_drivers d ON o.driverId = d.id
                 LEFT JOIN dy_districts dist ON o.districtId = dist.id
                 WHERE o.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.deliveryDate) { sql += ' AND o.deliveryDate = ?'; params.push(input.deliveryDate); }
      if (input.driverId) { sql += ' AND o.driverId = ?'; params.push(input.driverId); }
      if (input.status) { sql += ' AND o.status = ?'; params.push(input.status); }
      sql += ' ORDER BY o.deliveryDate DESC, o.id DESC';
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  getWithItems: dyDriverProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [orderRows] = await (db as any).$client.execute(
        `SELECT o.*, c.name as customerName, c.address as customerAddress, c.phone as customerPhone
         FROM dy_orders o JOIN dy_customers c ON o.customerId = c.id
         WHERE o.id=? AND o.tenantId=?`,
        [input.id, input.tenantId]
      ) as any;
      const order = (orderRows as any[])[0];
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
      const [items] = await (db as any).$client.execute(
        `SELECT oi.*, p.name as productName, p.code, p.unit FROM dy_order_items oi
         JOIN dy_products p ON oi.productId = p.id WHERE oi.orderId=?`,
        [input.id]
      );
      return { ...order, items };
    }),

  create: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      driverId: z.number().optional(),
      deliveryDate: z.string(),
      districtId: z.number().optional(),
      items: z.array(z.object({
        productId: z.number(),
        qty: z.number().positive(),
        unitPrice: z.number().positive(),
      })),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
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
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      status: z.enum(['pending', 'assigned', 'picked', 'delivering', 'delivered', 'returned', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `UPDATE dy_orders SET status=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.status, input.id, input.tenantId]
      );
      return { success: true };
    }),

  getLiffOrders: dyAdminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT o.id as orderId, o.orderNo, o.createdAt, o.totalAmount, o.status,
                c.name as customerName, c.phone as customerPhone
         FROM dy_orders o
         JOIN dy_customers c ON o.customerId = c.id
         WHERE o.orderSource = 'liff' AND o.tenantId = 90004
         ORDER BY o.createdAt DESC`,
        []
      );
      return rows as any[];
    }),

  deleteOrder: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      await client.execute(`DELETE FROM dy_order_items WHERE orderId=? AND tenantId=?`, [input.id, input.tenantId]);
      await client.execute(`DELETE FROM dy_orders WHERE id=? AND tenantId=?`, [input.id, input.tenantId]);
      return { success: true };
    }),

  // Driver: update delivery result (signature, photo, boxes)
  confirmDelivery: protectedProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      signatureUrl: z.string().optional(),
      photoUrl: z.string().optional(),
      inBoxes: z.number().default(0),
      returnBoxes: z.number().default(0),
      paidAmount: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `UPDATE dy_orders SET status='delivered', signatureUrl=?, photoUrl=?, inBoxes=?, returnBoxes=?, paidAmount=?, paymentStatus=IF(paidAmount>=totalAmount,'paid','partial'), updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.signatureUrl ?? null, input.photoUrl ?? null, input.inBoxes, input.returnBoxes, input.paidAmount, input.id, input.tenantId]
      );
      return { success: true };
    }),
});

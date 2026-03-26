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

export const dyPurchaseRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      let sql = `SELECT po.*, s.name as supplierName FROM dy_purchase_orders po
                 JOIN dy_suppliers s ON po.supplierId = s.id
                 WHERE po.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.status) { sql += ' AND po.status = ?'; params.push(input.status); }
      sql += ' ORDER BY po.deliveryDate DESC, po.id DESC';
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  create: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      supplierId: z.number(),
      deliveryDate: z.string(),
      items: z.array(z.object({
        productId: z.number(),
        expectedQty: z.number().positive(),
        unitPrice: z.number().positive(),
      })),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      const totalAmount = input.items.reduce((sum, i) => sum + i.expectedQty * i.unitPrice, 0);
      const [res] = await client.execute(
        `INSERT INTO dy_purchase_orders (tenantId, supplierId, deliveryDate, status, totalAmount, note, createdAt, updatedAt)
         VALUES (?,?,?,'pending',?,?,NOW(),NOW())`,
        [input.tenantId, input.supplierId, input.deliveryDate, totalAmount, input.note ?? null]
      );
      const poId = (res as any).insertId;
      for (const item of input.items) {
        await client.execute(
          `INSERT INTO dy_purchase_order_items (tenantId, purchaseOrderId, productId, expectedQty, actualQty, unitPrice) VALUES (?,?,?,?,0,?)`,
          [input.tenantId, poId, item.productId, item.expectedQty, item.unitPrice]
        );
      }
      return { id: poId };
    }),

  receive: dyAdminProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      items: z.array(z.object({
        itemId: z.number(),
        productId: z.number(),
        actualQty: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      for (const item of input.items) {
        await client.execute(
          `UPDATE dy_purchase_order_items SET actualQty=? WHERE id=? AND purchaseOrderId=?`,
          [item.actualQty, item.itemId, input.id]
        );
        // Update inventory
        await client.execute(
          `INSERT INTO dy_inventory (tenantId, productId, currentQty, safetyQty, unit, updatedAt)
           SELECT ?, ?, 0, 0, p.unit, NOW() FROM dy_products p WHERE p.id=? AND p.tenantId=?
           ON DUPLICATE KEY UPDATE currentQty = currentQty + ?, updatedAt=NOW()`,
          [input.tenantId, item.productId, item.productId, input.tenantId, item.actualQty]
        );
        // Log movement
        await client.execute(
          `INSERT INTO dy_stock_movements (tenantId, type, productId, qty, refId, refType, operatorId, createdAt)
           VALUES (?,?,?,?,?,'purchase_order',?,NOW())`,
          [input.tenantId, 'in', item.productId, item.actualQty, input.id, ctx.user.id]
        );
      }
      await client.execute(
        `UPDATE dy_purchase_orders SET status='received', receivedBy=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [ctx.user.id, input.id, input.tenantId]
      );
      return { success: true };
    }),

  suppliers: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM dy_suppliers WHERE tenantId = ? AND status='active' ORDER BY name`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  upsertSupplier: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      name: z.string().max(100),
      contact: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      bankAccount: z.string().optional(),
      status: z.enum(['active', 'inactive']).default('active'),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_suppliers SET name=?, contact=?, phone=?, address=?, bankAccount=?, status=? WHERE id=? AND tenantId=?`,
          [input.name, input.contact ?? null, input.phone ?? null, input.address ?? null, input.bankAccount ?? null, input.status, input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [res] = await client.execute(
          `INSERT INTO dy_suppliers (tenantId, name, contact, phone, address, bankAccount, status, createdAt) VALUES (?,?,?,?,?,?,?,NOW())`,
          [input.tenantId, input.name, input.contact ?? null, input.phone ?? null, input.address ?? null, input.bankAccount ?? null, input.status]
        );
        return { id: (res as any).insertId };
      }
    }),
});

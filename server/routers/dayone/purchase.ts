import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";


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
        unitPrice: z.number().min(0),
      })),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      const totalAmount = input.items.reduce((sum, i) => sum + i.expectedQty * i.unitPrice, 0);
      const [result] = await client.execute(
        `INSERT INTO dy_purchase_orders (tenantId, supplierId, deliveryDate, status, totalAmount, note, createdAt, updatedAt)
         VALUES (?,?,?,'pending',?,?,NOW(),NOW())`,
        [input.tenantId, input.supplierId, input.deliveryDate, totalAmount, input.note ?? null]
      );
      const poId = (result as any).insertId;
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;

      const [rows] = await client.execute(
        `SELECT id, status FROM dy_purchase_orders WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const order = (rows as any[])[0];
      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Purchase order not found' });
      }

      // Dayone now uses purchase receipts as the only inventory-entry path.
      // Leaving the old receive mutation active would create a second direct write
      // into dy_inventory and break the confirmed sign -> warehouse-confirm rule.
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Purchase order receive is disabled. Use Dayone purchase receipts and warehouse confirmation instead.',
      });
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
        const [result] = await client.execute(
          `INSERT INTO dy_suppliers (tenantId, name, contact, phone, address, bankAccount, status, createdAt) VALUES (?,?,?,?,?,?,?,NOW())`,
          [input.tenantId, input.name, input.contact ?? null, input.phone ?? null, input.address ?? null, input.bankAccount ?? null, input.status]
        );
        return { id: (result as any).insertId };
      }
    }),
});

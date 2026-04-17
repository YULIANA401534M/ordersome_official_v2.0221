import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { getDb } from '../db';

export const osProductsRouter = router({

  // ── 供應商 ──────────────────────────────────────────────────────────────

  supplierList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [] as any[];
    const [rows] = await (db as any).$client.execute(
      `SELECT * FROM os_suppliers ORDER BY isActive DESC, name ASC`
    );
    return rows as any[];
  }),

  supplierUpsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      phone: z.string().optional(),
      contact: z.string().optional(),
      paymentType: z.string().default('現付'),
      rebateRate: z.number().default(0),
      rebateCondition: z.number().default(0),
      isActive: z.boolean().default(true),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      if (input.id) {
        await (db as any).$client.execute(
          `UPDATE os_suppliers SET name=?, phone=?, contact=?, paymentType=?, rebateRate=?, rebateCondition=?, isActive=?, note=? WHERE id=?`,
          [input.name, input.phone || null, input.contact || null, input.paymentType,
           input.rebateRate, input.rebateCondition, input.isActive ? 1 : 0, input.note || null, input.id]
        );
        return { id: input.id };
      } else {
        const [result] = await (db as any).$client.execute(
          `INSERT INTO os_suppliers (name, phone, contact, paymentType, rebateRate, rebateCondition, isActive, note) VALUES (?,?,?,?,?,?,?,?)`,
          [input.name, input.phone || null, input.contact || null, input.paymentType,
           input.rebateRate, input.rebateCondition, input.isActive ? 1 : 0, input.note || null]
        );
        return { id: (result as any).insertId };
      }
    }),

  supplierDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(`DELETE FROM os_suppliers WHERE id=?`, [input.id]);
      return { success: true };
    }),

  // ── 品項 ────────────────────────────────────────────────────────────────

  productList: adminProcedure
    .input(z.object({
      supplierId: z.number().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      let sql = `
        SELECT p.*, s.name as supplierName
        FROM os_products p
        LEFT JOIN os_suppliers s ON s.id = p.supplierId
        WHERE 1=1
      `;
      const params: any[] = [];
      if (input.supplierId) { sql += ` AND p.supplierId = ?`; params.push(input.supplierId); }
      if (input.category) { sql += ` AND p.category = ?`; params.push(input.category); }
      sql += ` ORDER BY p.category ASC, p.name ASC`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  productUpsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      supplierId: z.number().optional(),
      category: z.string().default(''),
      name: z.string(),
      unit: z.string().default(''),
      unitSize: z.number().default(1),
      unitCost: z.number().default(0),
      batchPrice: z.number().default(0),
      batchSize: z.number().default(1),
      note: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      if (input.id) {
        await (db as any).$client.execute(
          `UPDATE os_products SET supplierId=?, category=?, name=?, unit=?, unitSize=?, unitCost=?, batchPrice=?, batchSize=?, note=?, isActive=? WHERE id=?`,
          [input.supplierId || null, input.category, input.name, input.unit,
           input.unitSize, input.unitCost, input.batchPrice, input.batchSize,
           input.note || null, input.isActive ? 1 : 0, input.id]
        );
        return { id: input.id };
      } else {
        const [result] = await (db as any).$client.execute(
          `INSERT INTO os_products (supplierId, category, name, unit, unitSize, unitCost, batchPrice, batchSize, note, isActive) VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [input.supplierId || null, input.category, input.name, input.unit,
           input.unitSize, input.unitCost, input.batchPrice, input.batchSize,
           input.note || null, input.isActive ? 1 : 0]
        );
        return { id: (result as any).insertId };
      }
    }),

  productDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(`DELETE FROM os_products WHERE id=?`, [input.id]);
      return { success: true };
    }),

  updateCost: adminProcedure
    .input(z.object({
      id: z.number(),
      unitCost: z.number(),
      batchPrice: z.number().optional(),
      updatedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const today = new Date().toISOString().slice(0, 10);
      if (input.batchPrice !== undefined) {
        await (db as any).$client.execute(
          `UPDATE os_products SET unitCost=?, batchPrice=?, lastUpdated=?, updatedBy=? WHERE id=?`,
          [input.unitCost, input.batchPrice, today, input.updatedBy, input.id]
        );
      } else {
        await (db as any).$client.execute(
          `UPDATE os_products SET unitCost=?, lastUpdated=?, updatedBy=? WHERE id=?`,
          [input.unitCost, today, input.updatedBy, input.id]
        );
      }
      return { success: true };
    }),
});

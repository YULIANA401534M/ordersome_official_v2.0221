import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../_core/trpc';
import { getDb } from '../db';

const TENANT_ID = 1;

export const inventoryRouter = router({

  list: adminProcedure
    .input(z.object({
      supplierName: z.string().optional(),
      category: z.string().optional(),
      belowSafety: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let sql = `SELECT *,
    ROUND(currentQty * unitCost, 0) AS itemValue
    FROM os_inventory WHERE tenantId = ?`;
      const params: any[] = [TENANT_ID];
      if (input.supplierName) {
        sql += ' AND supplierName = ?';
        params.push(input.supplierName);
      }
      if (input.category) {
        sql += ' AND category = ?';
        params.push(input.category);
      }
      if (input.belowSafety) {
        sql += ' AND safetyQty > 0 AND currentQty < safetyQty';
      }
      sql += ' ORDER BY supplierName, productName';
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  getTotalValue: adminProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalValue: 0, bValue: 0, bCount: 0, totalCount: 0 };
      const TENANT_ID = ctx.tenantId ?? 1;
      const [[row]] = await (db as any).$client.execute(
        `SELECT
          ROUND(SUM(currentQty * unitCost), 0) AS totalValue,
          COUNT(*) AS totalCount,
          SUM(CASE WHEN s.deliveryType='yulian' THEN 1 ELSE 0 END) AS bCount,
          ROUND(SUM(CASE WHEN s.deliveryType='yulian' THEN currentQty * unitCost ELSE 0 END), 0) AS bValue
         FROM os_inventory i
         LEFT JOIN os_suppliers s ON s.name = i.supplierName AND s.isActive=1
         WHERE i.tenantId=?`,
        [TENANT_ID]
      );
      return {
        totalValue: Number(row?.totalValue ?? 0),
        bValue: Number(row?.bValue ?? 0),
        totalCount: Number(row?.totalCount ?? 0),
        bCount: Number(row?.bCount ?? 0),
      };
    }),

  getDetail: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [itemRows] = await (db as any).$client.execute(
        'SELECT * FROM os_inventory WHERE id = ? AND tenantId = ? LIMIT 1',
        [input.id, TENANT_ID]
      );
      const item = (itemRows as any[])[0];
      if (!item) return null;
      const [logRows] = await (db as any).$client.execute(
        'SELECT * FROM os_inventory_logs WHERE inventoryId = ? ORDER BY createdAt DESC LIMIT 20',
        [input.id]
      );
      return { ...item, logs: logRows as any[] };
    }),

  adjust: adminProcedure
    .input(z.object({
      id: z.number(),
      newQty: z.number(),
      note: z.string().min(1, '請填寫調整原因'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const [rows] = await (db as any).$client.execute(
        'SELECT currentQty FROM os_inventory WHERE id = ? AND tenantId = ? LIMIT 1',
        [input.id, TENANT_ID]
      );
      const item = (rows as any[])[0];
      if (!item) throw new Error('品項不存在');
      const oldQty = parseFloat(item.currentQty);
      const newQty = input.newQty;
      await (db as any).$client.execute(
        'UPDATE os_inventory SET currentQty = ?, updatedAt = NOW() WHERE id = ?',
        [newQty, input.id]
      );
      await (db as any).$client.execute(
        `INSERT INTO os_inventory_logs (tenantId, inventoryId, changeType, qty, qtyBefore, qtyAfter, refType, note, operatorId)
         VALUES (?, ?, 'adjust', ?, ?, ?, 'manual', ?, ?)`,
        [TENANT_ID, input.id, newQty - oldQty, oldQty, newQty, input.note, ctx.user.id]
      );
      return { success: true };
    }),

  count: adminProcedure
    .input(z.object({
      id: z.number(),
      countQty: z.number(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const [rows] = await (db as any).$client.execute(
        'SELECT currentQty FROM os_inventory WHERE id = ? AND tenantId = ? LIMIT 1',
        [input.id, TENANT_ID]
      );
      const item = (rows as any[])[0];
      if (!item) throw new Error('品項不存在');
      const oldQty = parseFloat(item.currentQty);
      const newQty = input.countQty;
      const today = new Date().toISOString().slice(0, 10);
      await (db as any).$client.execute(
        'UPDATE os_inventory SET currentQty = ?, lastCountDate = ?, updatedAt = NOW() WHERE id = ?',
        [newQty, today, input.id]
      );
      await (db as any).$client.execute(
        `INSERT INTO os_inventory_logs (tenantId, inventoryId, changeType, qty, qtyBefore, qtyAfter, refType, note, operatorId)
         VALUES (?, ?, 'count', ?, ?, ?, 'manual', ?, ?)`,
        [TENANT_ID, input.id, newQty - oldQty, oldQty, newQty, input.note ?? null, ctx.user.id]
      );
      return { success: true };
    }),

  setSafety: adminProcedure
    .input(z.object({
      id: z.number(),
      safetyQty: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        'UPDATE os_inventory SET safetyQty = ?, updatedAt = NOW() WHERE id = ? AND tenantId = ?',
        [input.safetyQty, input.id, TENANT_ID]
      );
      return { success: true };
    }),

  addProduct: adminProcedure
    .input(z.object({
      supplierName: z.string(),
      productName: z.string(),
      unit: z.string(),
      category: z.string().optional(),
      unitCost: z.number().optional(),
      safetyQty: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        `INSERT INTO os_inventory (tenantId, supplierName, productName, unit, category, unitCost, safetyQty)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          TENANT_ID,
          input.supplierName,
          input.productName,
          input.unit,
          input.category ?? '未分類',
          input.unitCost ?? 0,
          input.safetyQty ?? 0,
        ]
      );
      return { success: true };
    }),

  getHistory: adminProcedure
    .input(z.object({ inventoryId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await (db as any).$client.execute(
        `SELECT changeType, qty, qtyBefore, qtyAfter, refType, refId, note, createdAt
         FROM os_inventory_logs
         WHERE inventoryId=? AND tenantId=?
         ORDER BY createdAt DESC LIMIT 10`,
        [input.inventoryId, ctx.tenantId ?? TENANT_ID]
      );
      return rows as any[];
    }),

  alertCount: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return 0;
      const [rows] = await (db as any).$client.execute(
        'SELECT COUNT(*) as cnt FROM os_inventory WHERE tenantId = ? AND safetyQty > 0 AND currentQty < safetyQty',
        [TENANT_ID]
      );
      return Number((rows as any[])[0].cnt);
    }),

  listYulianSuppliers: adminProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await (db as any).$client.execute(
        "SELECT name FROM os_suppliers WHERE deliveryType='yulian' AND isActive=1 ORDER BY name",
        []
      );
      return rows as { name: string }[];
    }),

  deleteItem: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const [rows] = await (db as any).$client.execute(
        'SELECT * FROM os_inventory WHERE id=? AND tenantId=?',
        [input.id, TENANT_ID]
      );
      const item = (rows as any[])[0];
      if (!item) throw new TRPCError({ code: 'NOT_FOUND' });
      await (db as any).$client.execute(
        `INSERT INTO os_audit_logs (tenantId, action, targetTable, targetId, snapshot, reason, operatorId, createdAt)
         VALUES (?, 'delete', 'os_inventory', ?, ?, ?, ?, NOW())`,
        [TENANT_ID, input.id, JSON.stringify(item), input.reason, ctx.user?.id ?? null]
      );
      await (db as any).$client.execute(
        'DELETE FROM os_inventory WHERE id=? AND tenantId=?',
        [input.id, TENANT_ID]
      );
      return { success: true };
    }),
});

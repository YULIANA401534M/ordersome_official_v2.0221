import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";
import { ensureDyPendingReturnsTable } from "./pendingReturns";


export const dyInventoryRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT i.*, p.name as productName, p.code FROM dy_inventory i
         JOIN dy_products p ON i.productId = p.id
         WHERE i.tenantId = ? ORDER BY p.code`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  adjust: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      productId: z.number(),
      type: z.enum(['in', 'out', 'return', 'adjust']),
      qty: z.number(),
      batchNo: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      const delta = input.type === 'out' ? -Math.abs(input.qty) : Math.abs(input.qty);
      if (input.type === 'adjust') {
        // 調整：直接設定為指定數量
        await client.execute(
          `INSERT INTO dy_inventory (tenantId, productId, currentQty, safetyQty, unit, updatedAt)
           SELECT ?, ?, ?, 0, p.unit, NOW() FROM dy_products p WHERE p.id=? AND p.tenantId=?
           ON DUPLICATE KEY UPDATE currentQty = ?, updatedAt=NOW()`,
          [input.tenantId, input.productId, input.qty, input.productId, input.tenantId, input.qty]
        );
      } else {
        // 入庫/出庫/退貨：增減
        await client.execute(
          `INSERT INTO dy_inventory (tenantId, productId, currentQty, safetyQty, unit, updatedAt)
           SELECT ?, ?, ?, 0, p.unit, NOW() FROM dy_products p WHERE p.id=? AND p.tenantId=?
           ON DUPLICATE KEY UPDATE currentQty = currentQty + ?, updatedAt=NOW()`,
          [input.tenantId, input.productId, delta, input.productId, input.tenantId, delta]
        );
      }
      // Log movement（out 記負數，adjust/in/return 記正數）
      const logQty = input.type === 'out' ? -Math.abs(input.qty) : Math.abs(input.qty);
      await client.execute(
        `INSERT INTO dy_stock_movements (tenantId, type, productId, qty, batchNo, operatorId, note, createdAt)
         VALUES (?,?,?,?,?,?,?,NOW())`,
        [input.tenantId, input.type, input.productId, logQty, input.batchNo ?? null, ctx.user.id, input.note ?? null]
      );
      return { success: true };
    }),

  setSafety: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), productId: z.number(), safetyQty: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `UPDATE dy_inventory SET safetyQty=?, updatedAt=NOW() WHERE tenantId=? AND productId=?`,
        [input.safetyQty, input.tenantId, input.productId]
      );
      return { success: true };
    }),

  movements: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), productId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      let sql = `SELECT m.*, m.type as movementType, p.name as productName, p.code FROM dy_stock_movements m
                 JOIN dy_products p ON m.productId = p.id
                 WHERE m.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.productId) { sql += ' AND m.productId = ?'; params.push(input.productId); }
      sql += ` ORDER BY m.createdAt DESC LIMIT ${Number(input.limit)}`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  pendingReturns: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      await ensureDyPendingReturnsTable(client);
      const [rows] = await client.execute(
        `SELECT pr.*, p.name AS productName, p.code AS productCode, p.unit,
                d.name AS driverName, ddo.dispatchDate, ddo.routeCode
         FROM dy_pending_returns pr
         JOIN dy_products p ON pr.productId = p.id
         LEFT JOIN dy_dispatch_orders ddo ON pr.dispatchOrderId = ddo.id
         LEFT JOIN dy_drivers d ON ddo.driverId = d.id
         WHERE pr.tenantId=? AND pr.status='pending'
         ORDER BY pr.reportedAt DESC, pr.id DESC`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  confirmPendingReturn: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), pendingReturnId: z.number(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      await ensureDyPendingReturnsTable(client);
      await client.execute('START TRANSACTION');
      try {
        const [rows] = await client.execute(
          `SELECT pr.*, p.unit
           FROM dy_pending_returns pr
           JOIN dy_products p ON pr.productId = p.id
           WHERE pr.id=? AND pr.tenantId=?
           LIMIT 1
           FOR UPDATE`,
          [input.pendingReturnId, input.tenantId]
        );
        const pendingReturn = (rows as any[])[0];
        if (!pendingReturn) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pending return not found' });
        }
        if (pendingReturn.status !== 'pending') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pending return already confirmed' });
        }

        await client.execute(
          `UPDATE dy_pending_returns
           SET status='received', receivedBy=?, receivedAt=NOW(), receiveNote=?, updatedAt=NOW()
           WHERE id=? AND tenantId=? AND status='pending'`,
          [ctx.user.id, input.note?.trim() || null, input.pendingReturnId, input.tenantId]
        );

        await client.execute(
          `INSERT INTO dy_inventory (tenantId, productId, currentQty, safetyQty, unit, updatedAt)
           VALUES (?,?,?,0,?,NOW())
           ON DUPLICATE KEY UPDATE currentQty=currentQty + VALUES(currentQty), unit=COALESCE(unit, VALUES(unit)), updatedAt=NOW()`,
          [input.tenantId, pendingReturn.productId, pendingReturn.qty, pendingReturn.unit ?? null]
        );

        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, note, operatorId, createdAt)
           VALUES (?,?,'in',?,?,'dispatch_return_receive',?,?,NOW())`,
          [
            input.tenantId,
            pendingReturn.productId,
            pendingReturn.qty,
            pendingReturn.dispatchOrderId,
            input.note?.trim() || pendingReturn.note || `Confirmed truck return for dispatch ${pendingReturn.dispatchOrderId}`,
            ctx.user.id,
          ]
        );

        await client.execute('COMMIT');
        return { success: true };
      } catch (error) {
        await client.execute('ROLLBACK');
        throw error;
      }
    }),
});

import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";


export const dyCustomersRouter = router({
  // ─── Groups ──────────────────────────────────────────────────────────
  listGroups: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT g.*, COUNT(c.id) as memberCount
         FROM dy_customer_groups g
         LEFT JOIN dy_customers c ON c.groupId = g.id AND c.tenantId = g.tenantId
         WHERE g.tenantId = ?
         GROUP BY g.id
         ORDER BY g.name`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  upsertGroup: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      name: z.string().min(1).max(100),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_customer_groups SET name=?, note=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
          [input.name, input.note ?? null, input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [result] = await client.execute(
          `INSERT INTO dy_customer_groups (tenantId, name, note, createdAt, updatedAt) VALUES (?,?,?,NOW(),NOW())`,
          [input.tenantId, input.name, input.note ?? null]
        );
        return { id: (result as any).insertId };
      }
    }),

  deleteGroup: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      // Unlink customers in this group first
      await client.execute(
        `UPDATE dy_customers SET groupId=NULL WHERE groupId=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      await client.execute(
        `DELETE FROM dy_customer_groups WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),

  // ─── Customers ───────────────────────────────────────────────────────
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), groupId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      let sql = `SELECT c.*, d.name as districtName, g.name as groupName,
                        dr.name as defaultDriverName
                 FROM dy_customers c
                 LEFT JOIN dy_districts d ON c.districtId = d.id
                 LEFT JOIN dy_customer_groups g ON c.groupId = g.id
                 LEFT JOIN dy_drivers dr ON c.defaultDriverId = dr.id
                 WHERE c.tenantId = ?`;
      const params: any[] = [input.tenantId];
      if (input.groupId) {
        sql += ' AND c.groupId = ?';
        params.push(input.groupId);
      }
      sql += ' ORDER BY g.name IS NULL, g.name, c.name';
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  upsert: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      name: z.string().max(100),
      phone: z.string().max(20).optional(),
      address: z.string().optional(),
      districtId: z.number().optional(),
      groupId: z.number().optional(),
      paymentType: z.enum(['cash', 'transfer', 'check']).default('cash'),
      creditLimit: z.number().default(0),
      status: z.enum(['active', 'suspended']).default('active'),
      customerLevel: z.string().optional(),
      settlementCycle: z.string().optional(),
      overdueDays: z.number().optional(),
      loginEmail: z.string().optional(),
      isPortalActive: z.boolean().optional(),
      portalNote: z.string().optional(),
      defaultDriverId: z.number().optional(),
      deliveryFrequency: z.enum(['D1', 'D2', 'daily']).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_customers SET name=?, phone=?, address=?, districtId=?, groupId=?, paymentType=?, creditLimit=?, status=?,
           customerLevel=?, settlementCycle=?, overdueDays=?, loginEmail=?, isPortalActive=?, portalNote=?,
           defaultDriverId=?, deliveryFrequency=?, updatedAt=NOW()
           WHERE id=? AND tenantId=?`,
          [input.name, input.phone ?? null, input.address ?? null, input.districtId ?? null, input.groupId ?? null,
           input.paymentType, input.creditLimit, input.status,
           input.customerLevel ?? 'retail', input.settlementCycle ?? 'monthly', input.overdueDays ?? 30,
           input.loginEmail ?? null, input.isPortalActive ? 1 : 0, input.portalNote ?? null,
           input.defaultDriverId ?? null, input.deliveryFrequency ?? 'daily',
           input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [result] = await client.execute(
          `INSERT INTO dy_customers (tenantId, groupId, name, phone, address, districtId, paymentType, creditLimit, outstandingAmount, status,
           customerLevel, settlementCycle, overdueDays, loginEmail, isPortalActive, portalNote,
           defaultDriverId, deliveryFrequency, createdAt, updatedAt)
           VALUES (?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [input.tenantId, input.groupId ?? null, input.name, input.phone ?? null, input.address ?? null, input.districtId ?? null,
           input.paymentType, input.creditLimit, input.status,
           input.customerLevel ?? 'retail', input.settlementCycle ?? 'monthly', input.overdueDays ?? 30,
           input.loginEmail ?? null, input.isPortalActive ? 1 : 0, input.portalNote ?? null,
           input.defaultDriverId ?? null, input.deliveryFrequency ?? 'daily']
        );
        return { id: (result as any).insertId };
      }
    }),

  delete: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      const [orderRows] = await client.execute(
        `SELECT COUNT(*) as cnt FROM dy_orders WHERE customerId=? AND tenantId=?`,
        [input.id, input.tenantId]
      ) as any;
      const orderCount = Number((orderRows as any[])[0]?.cnt ?? 0);
      if (orderCount > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `此客戶有 ${orderCount} 筆訂單，無法刪除` });
      }
      await client.execute(
        `DELETE FROM dy_customer_prices WHERE customerId=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      await client.execute(
        `DELETE FROM dy_customers WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),

  // 三段式定價：客製 → 分級 → 主檔，回傳此客戶每個商品的有效單價
  getPricesForCustomer: dyAdminProcedure
    .input(z.object({ customerId: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;

      // 取得客戶等級
      const [custRows] = await client.execute(
        `SELECT customerLevel FROM dy_customers WHERE id=? AND tenantId=? LIMIT 1`,
        [input.customerId, input.tenantId]
      );
      const level = (custRows as any[])[0]?.customerLevel ?? 'retail';

      // 取得所有商品
      const [prodRows] = await client.execute(
        `SELECT id, defaultPrice FROM dy_products WHERE tenantId=? AND isActive=1`,
        [input.tenantId]
      );
      const products = prodRows as any[];

      // 取得此客戶的客製定價（最新生效）
      const [cpRows] = await client.execute(
        `SELECT productId, price FROM dy_customer_prices
         WHERE customerId=? AND tenantId=? AND effectiveDate <= CURDATE()
         ORDER BY effectiveDate DESC, id DESC`,
        [input.customerId, input.tenantId]
      );
      const customPriceMap: Record<number, number> = {};
      for (const r of cpRows as any[]) {
        const pid = Number(r.productId);
        if (!(pid in customPriceMap)) customPriceMap[pid] = Number(r.price);
      }

      // 取得此等級的分級定價（最新生效）
      const [lpRows] = await client.execute(
        `SELECT productId, price FROM dy_level_prices
         WHERE level=? AND tenantId=? AND effectiveDate <= CURDATE()
         ORDER BY effectiveDate DESC, id DESC`,
        [level, input.tenantId]
      );
      const levelPriceMap: Record<number, number> = {};
      for (const r of lpRows as any[]) {
        const pid = Number(r.productId);
        if (!(pid in levelPriceMap)) levelPriceMap[pid] = Number(r.price);
      }

      // 三段式合併
      const result: Record<number, number> = {};
      for (const p of products) {
        const pid = Number(p.id);
        result[pid] = customPriceMap[pid] ?? levelPriceMap[pid] ?? Number(p.defaultPrice);
      }
      return result; // { [productId]: effectivePrice }
    }),

  getCustomerPrices: dyAdminProcedure
    .input(z.object({ customerId: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT cp.*, p.name as productName, p.code, p.unit
         FROM dy_customer_prices cp
         JOIN dy_products p ON cp.productId = p.id
         WHERE cp.customerId = ? AND cp.tenantId = ?
         ORDER BY p.code, cp.effectiveDate DESC, cp.id DESC`,
        [input.customerId, input.tenantId]
      );
      return rows as any[];
    }),

  setCustomerPrice: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      customerId: z.number(),
      productId: z.number(),
      price: z.number().positive(),
      effectiveDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [result] = await (db as any).$client.execute(
        `INSERT INTO dy_customer_prices (tenantId, customerId, productId, price, effectiveDate, createdAt) VALUES (?,?,?,?,?,NOW())`,
        [input.tenantId, input.customerId, input.productId, input.price, input.effectiveDate]
      );
      return { id: (result as any).insertId };
    }),

  // ── 分級定價（零售 / 門市 / 供應商）──

  getLevelPrices: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT lp.*, p.name as productName, p.code, p.unit
         FROM dy_level_prices lp
         JOIN dy_products p ON lp.productId = p.id
         WHERE lp.tenantId = ?
         ORDER BY p.code, lp.level`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  setLevelPrice: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      level: z.enum(['retail', 'store', 'supplier']),
      productId: z.number(),
      price: z.number().min(0),
      effectiveDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `INSERT INTO dy_level_prices (tenantId, level, productId, price, effectiveDate, createdAt, updatedAt)
         VALUES (?,?,?,?,?,NOW(),NOW())
         ON DUPLICATE KEY UPDATE price=VALUES(price), effectiveDate=VALUES(effectiveDate), updatedAt=NOW()`,
        [input.tenantId, input.level, input.productId, input.price, input.effectiveDate]
      );
      return { success: true };
    }),

  deleteLevelPrice: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `DELETE FROM dy_level_prices WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),
});

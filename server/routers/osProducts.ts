import { z } from 'zod';
import { router, adminProcedure, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';

const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要超級管理員權限' });
  }
  return next({ ctx });
});

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

      const [oldRows] = await (db as any).$client.execute(
        `SELECT unitCost FROM os_products WHERE id=?`, [input.id]
      ) as any;
      const oldCost = (oldRows as any[])?.[0]?.unitCost ?? null;

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

      await (db as any).$client.execute(
        `INSERT INTO os_cost_audit_log (tableTarget, recordId, fieldName, oldValue, newValue, changedBy)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['os_products', input.id, 'unitCost', String(oldCost), String(input.unitCost), input.updatedBy]
      );

      return { success: true };
    }),

  // ── 菜單品項（第二層）──────────────────────────────────────────────────────

  menuCategoryList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [] as string[];
    const [rows] = await (db as any).$client.execute(
      `SELECT DISTINCT category FROM os_menu_items WHERE isActive=1 ORDER BY category ASC`
    );
    return (rows as any[]).map((r: any) => r.category as string);
  }),

  menuItemList: adminProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [] as any[];

      const hasCostAccess =
        ctx.user.role === 'super_admin' || ctx.user.has_procurement_access === true;

      let sql = `SELECT * FROM os_menu_items WHERE isActive=1`;
      const params: any[] = [];
      if (input.category) { sql += ` AND category=?`; params.push(input.category); }
      sql += ` ORDER BY category ASC, name ASC`;
      const [itemRows] = await (db as any).$client.execute(sql, params);
      const items = itemRows as any[];

      if (items.length === 0) return [];

      const ids = items.map((r: any) => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const [ingRows] = await (db as any).$client.execute(
        `SELECT i.*, p.unitCost as productUnitCost
         FROM os_menu_item_ingredients i
         LEFT JOIN os_products p ON p.id = i.productId
         WHERE i.menuItemId IN (${placeholders})
         ORDER BY i.menuItemId, i.sortOrder`,
        ids
      );
      const ingredients = ingRows as any[];

      const ingByItem: Record<number, any[]> = {};
      for (const ing of ingredients) {
        if (!ingByItem[ing.menuItemId]) ingByItem[ing.menuItemId] = [];
        const unitCost = ing.costOverride !== null && ing.costOverride !== undefined
          ? Number(ing.costOverride)
          : Number(ing.productUnitCost ?? 0);
        ingByItem[ing.menuItemId].push({
          ...ing,
          resolvedUnitCost: hasCostAccess ? unitCost : null,
        });
      }

      return items.map((item: any) => {
        const ings = ingByItem[item.id] ?? [];
        let totalIngredientCost = 0;
        let totalPackagingCost = 0;
        for (const ing of ings) {
          const lineCost = (ing.resolvedUnitCost ?? 0) * Number(ing.quantity);
          if (ing.ingredientType === 'packaging') {
            totalPackagingCost += lineCost;
          } else {
            totalIngredientCost += lineCost;
          }
        }
        const dineInCost = totalIngredientCost + totalPackagingCost;
        const takeoutCost = totalIngredientCost + totalPackagingCost;
        const cp = Number(item.currentPrice ?? 0);
        const pp = Number(item.platformPrice ?? 0);

        const dineInMargin = cp > 0 ? ((cp / 1.05 - dineInCost) / cp) : null;
        const takeoutMargin = cp > 0 ? ((cp / 1.05 - takeoutCost) / cp) : null;
        const platformMargin = pp > 0 ? ((pp * 0.6024 - takeoutCost) / pp) : null;

        return {
          ...item,
          ingredients: ings,
          totalIngredientCost: hasCostAccess ? totalIngredientCost : null,
          totalPackagingCost: hasCostAccess ? totalPackagingCost : null,
          dineInCost: hasCostAccess ? dineInCost : null,
          takeoutCost: hasCostAccess ? takeoutCost : null,
          dineInMargin: hasCostAccess ? dineInMargin : null,
          takeoutMargin: hasCostAccess ? takeoutMargin : null,
          platformMargin: hasCostAccess ? platformMargin : null,
        };
      });
    }),

  menuItemUpsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      category: z.string(),
      name: z.string(),
      mainIngredient: z.string().optional(),
      servingType: z.enum(['both', 'dine_in_only', 'takeout_only']).default('both'),
      basePrice: z.number().optional(),
      currentPrice: z.number().optional(),
      platformPrice: z.number().optional(),
      note: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const updatedBy = ctx.user.name ?? ctx.user.email ?? 'admin';
      if (input.id) {
        await (db as any).$client.execute(
          `UPDATE os_menu_items SET category=?, name=?, mainIngredient=?, servingType=?, basePrice=?, currentPrice=?, platformPrice=?, note=?, isActive=?, updatedBy=? WHERE id=?`,
          [input.category, input.name, input.mainIngredient ?? null, input.servingType,
           input.basePrice ?? null, input.currentPrice ?? null, input.platformPrice ?? null,
           input.note ?? null, input.isActive ? 1 : 0, updatedBy, input.id]
        );
        return { id: input.id };
      } else {
        const [result] = await (db as any).$client.execute(
          `INSERT INTO os_menu_items (tenantId, category, name, mainIngredient, servingType, basePrice, currentPrice, platformPrice, note, isActive, updatedBy) VALUES (1,?,?,?,?,?,?,?,?,?,?)`,
          [input.category, input.name, input.mainIngredient ?? null, input.servingType,
           input.basePrice ?? null, input.currentPrice ?? null, input.platformPrice ?? null,
           input.note ?? null, input.isActive ? 1 : 0, updatedBy]
        );
        return { id: (result as any).insertId };
      }
    }),

  menuItemDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        `UPDATE os_menu_items SET isActive=0 WHERE id=?`, [input.id]
      );
      return { success: true };
    }),

  menuIngredientSave: adminProcedure
    .input(z.object({
      menuItemId: z.number(),
      ingredients: z.array(z.object({
        productId: z.number().optional(),
        ingredientName: z.string(),
        quantity: z.number(),
        unit: z.string().optional(),
        costOverride: z.number().optional(),
        ingredientType: z.enum(['ingredient', 'packaging']).default('ingredient'),
        note: z.string().optional(),
        sortOrder: z.number().default(0),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        `DELETE FROM os_menu_item_ingredients WHERE menuItemId=?`, [input.menuItemId]
      );
      for (const ing of input.ingredients) {
        await (db as any).$client.execute(
          `INSERT INTO os_menu_item_ingredients (menuItemId, productId, ingredientName, quantity, unit, costOverride, ingredientType, note, sortOrder) VALUES (?,?,?,?,?,?,?,?,?)`,
          [input.menuItemId, ing.productId ?? null, ing.ingredientName, ing.quantity,
           ing.unit ?? null, ing.costOverride ?? null, ing.ingredientType,
           ing.note ?? null, ing.sortOrder]
        );
      }
      return { success: true };
    }),

  // ── OEM 品項（第三層）─────────────────────────────────────────────────────

  oemProductList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [] as any[];
    const [itemRows] = await (db as any).$client.execute(
      `SELECT * FROM os_oem_products WHERE isActive=1 ORDER BY name ASC`
    );
    const items = itemRows as any[];
    if (items.length === 0) return [];

    const ids = items.map((r: any) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const [ingRows] = await (db as any).$client.execute(
      `SELECT i.*, p.unitCost as productUnitCost
       FROM os_oem_ingredients i
       LEFT JOIN os_products p ON p.id = i.productId
       WHERE i.oemProductId IN (${placeholders})
       ORDER BY i.oemProductId, i.sortOrder`,
      ids
    );
    const ingredients = ingRows as any[];

    const ingByOem: Record<number, any[]> = {};
    for (const ing of ingredients) {
      if (!ingByOem[ing.oemProductId]) ingByOem[ing.oemProductId] = [];
      ingByOem[ing.oemProductId].push(ing);
    }

    return items.map((item: any) => ({
      ...item,
      ingredients: ingByOem[item.id] ?? [],
    }));
  }),

  oemProductUpsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      unit: z.string().default('公斤'),
      processingFee: z.number().default(0),
      packagingCost: z.number().default(0),
      batchPrice: z.number().optional(),
      note: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const updatedBy = ctx.user.name ?? ctx.user.email ?? 'admin';
      if (input.id) {
        await (db as any).$client.execute(
          `UPDATE os_oem_products SET name=?, unit=?, processingFee=?, packagingCost=?, batchPrice=?, note=?, isActive=?, updatedBy=? WHERE id=?`,
          [input.name, input.unit, input.processingFee, input.packagingCost,
           input.batchPrice ?? null, input.note ?? null, input.isActive ? 1 : 0, updatedBy, input.id]
        );
        return { id: input.id };
      } else {
        const [result] = await (db as any).$client.execute(
          `INSERT INTO os_oem_products (tenantId, name, unit, processingFee, packagingCost, batchPrice, note, isActive, updatedBy) VALUES (1,?,?,?,?,?,?,?,?)`,
          [input.name, input.unit, input.processingFee, input.packagingCost,
           input.batchPrice ?? null, input.note ?? null, input.isActive ? 1 : 0, updatedBy]
        );
        return { id: (result as any).insertId };
      }
    }),

  oemIngredientSave: adminProcedure
    .input(z.object({
      oemProductId: z.number(),
      ingredients: z.array(z.object({
        productId: z.number().optional(),
        ingredientName: z.string(),
        quantity: z.number(),
        unit: z.string().optional(),
        costOverride: z.number().optional(),
        sortOrder: z.number().default(0),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        `DELETE FROM os_oem_ingredients WHERE oemProductId=?`, [input.oemProductId]
      );
      for (const ing of input.ingredients) {
        await (db as any).$client.execute(
          `INSERT INTO os_oem_ingredients (oemProductId, productId, ingredientName, quantity, unit, costOverride, sortOrder) VALUES (?,?,?,?,?,?,?)`,
          [input.oemProductId, ing.productId ?? null, ing.ingredientName, ing.quantity,
           ing.unit ?? null, ing.costOverride ?? null, ing.sortOrder]
        );
      }
      return { success: true };
    }),

  // ── 成本修改歷史（super_admin only）────────────────────────────────────────

  costAuditLog: superAdminProcedure
    .input(z.object({
      tableTarget: z.enum(['os_products', 'os_menu_items', 'os_oem_products']),
      recordId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM os_cost_audit_log WHERE tableTarget=? AND recordId=? ORDER BY changedAt DESC`,
        [input.tableTarget, input.recordId]
      );
      return rows as any[];
    }),
});

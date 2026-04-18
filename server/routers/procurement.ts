import { z } from 'zod';
import { router, adminProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';

function genOrderNo() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `OS${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${Date.now().toString().slice(-6)}`;
}

export const procurementRouter = router({

  // Make 呼叫此 endpoint 寫入大麥 Email 解析結果
  importFromDamai: publicProcedure
    .input(z.object({
      secret: z.string(),
      orderNo: z.string(),
      orderDate: z.string(),
      items: z.array(z.object({
        supplierName: z.string(),
        storeName: z.string(),
        productName: z.string(),
        unit: z.string().optional(),
        quantity: z.number(),
        temperature: z.enum(['常溫','冷藏','冷凍']).optional(),
      }))
    }))
    .mutation(async ({ input }) => {
      if (input.secret !== process.env.SYNC_SECRET) {
        throw new Error('Unauthorized');
      }
      const db = await getDb();
      if (!db) throw new Error('DB not available');

      const existingCheck = await (db as any).$client.execute(
        'SELECT id FROM os_procurement_orders WHERE orderNo = ? LIMIT 1',
        [input.orderNo]
      );
      if ((existingCheck[0] as any[]).length > 0) {
        return { success: true, message: '訂單已存在，略過' };
      }

      await (db as any).$client.execute(`
        INSERT INTO os_procurement_orders (orderNo, orderDate, status, sourceType, createdBy)
        VALUES (?, ?, 'pending', 'damai_import', 'Make自動匯入')
      `, [input.orderNo, input.orderDate]);

      const [orderResult] = await (db as any).$client.execute(
        'SELECT id FROM os_procurement_orders WHERE orderNo = ? LIMIT 1',
        [input.orderNo]
      );
      const orderId = (orderResult as any[])[0].id;

      for (const item of input.items) {
        const [supRows] = await (db as any).$client.execute(
          'SELECT id FROM os_suppliers WHERE name = ? LIMIT 1',
          [item.supplierName]
        );
        const supplierId = (supRows as any[])[0]?.id || null;

        await (db as any).$client.execute(`
          INSERT INTO os_procurement_items
            (procurementOrderId, supplierId, supplierName, storeName, productName, unit, quantity, temperature)
          VALUES (?,?,?,?,?,?,?,?)
        `, [orderId, supplierId, item.supplierName, item.storeName,
            item.productName, item.unit || '', item.quantity,
            item.temperature || '常溫']);
      }

      return { success: true, orderId, itemCount: input.items.length };
    }),

  // 手動建立採購單
  create: adminProcedure
    .input(z.object({
      orderDate: z.string(),
      note: z.string().optional(),
      items: z.array(z.object({
        supplierName: z.string(),
        storeName: z.string(),
        productName: z.string(),
        unit: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number().optional(),
        temperature: z.enum(['常溫','冷藏','冷凍']).optional(),
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const orderNo = genOrderNo();
      const createdBy = (ctx.user as any).name || (ctx.user as any).email;

      await (db as any).$client.execute(`
        INSERT INTO os_procurement_orders (orderNo, orderDate, status, sourceType, note, createdBy)
        VALUES (?, ?, 'pending', 'manual', ?, ?)
      `, [orderNo, input.orderDate, input.note || null, createdBy]);

      const [orderResult] = await (db as any).$client.execute(
        'SELECT id FROM os_procurement_orders WHERE orderNo = ? LIMIT 1',
        [orderNo]
      );
      const orderId = (orderResult as any[])[0].id;

      for (const item of input.items) {
        const [supRows] = await (db as any).$client.execute(
          'SELECT id FROM os_suppliers WHERE name = ? LIMIT 1',
          [item.supplierName]
        );
        const supplierId = (supRows as any[])[0]?.id || null;
        const amount = (item.quantity || 0) * (item.unitPrice || 0);

        await (db as any).$client.execute(`
          INSERT INTO os_procurement_items
            (procurementOrderId, supplierId, supplierName, storeName,
             productName, unit, quantity, unitPrice, amount, temperature)
          VALUES (?,?,?,?,?,?,?,?,?,?)
        `, [orderId, supplierId, item.supplierName, item.storeName,
            item.productName, item.unit || '', item.quantity,
            item.unitPrice || 0, amount, item.temperature || '常溫']);
      }

      return { success: true, orderNo, orderId };
    }),

  // 列表（可篩選日期、狀態）
  list: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
      supplierName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      let sql = `
        SELECT po.*,
          COUNT(pi.id) as itemCount,
          GROUP_CONCAT(DISTINCT pi.supplierName) as suppliers,
          GROUP_CONCAT(DISTINCT pi.storeName) as stores
        FROM os_procurement_orders po
        LEFT JOIN os_procurement_items pi ON pi.procurementOrderId = po.id
        WHERE po.tenantId = 1
      `;
      const params: any[] = [];
      if (input.startDate) { sql += ` AND po.orderDate >= ?`; params.push(input.startDate); }
      if (input.endDate) { sql += ` AND po.orderDate <= ?`; params.push(input.endDate); }
      if (input.status) { sql += ` AND po.status = ?`; params.push(input.status); }
      sql += ` GROUP BY po.id ORDER BY po.orderDate DESC, po.id DESC LIMIT 200`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 取得單張採購單明細
  getDetail: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const [order] = await (db as any).$client.execute(
        'SELECT * FROM os_procurement_orders WHERE id = ? LIMIT 1',
        [input.orderId]
      );
      const [items] = await (db as any).$client.execute(
        'SELECT * FROM os_procurement_items WHERE procurementOrderId = ? ORDER BY supplierName, storeName',
        [input.orderId]
      );
      return {
        order: (order as any[])[0],
        items: items as any[],
      };
    }),

  // 更新狀態
  updateStatus: adminProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending','sent','confirmed','received','cancelled']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        'UPDATE os_procurement_orders SET status = ? WHERE id = ?',
        [input.status, input.orderId]
      );
      return { success: true };
    }),

  // 彙整採購單 → 依廠商分組，準備推播 LINE
  groupBySupplier: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      const [rows] = await (db as any).$client.execute(`
        SELECT
          pi.supplierName,
          sl.lineGroupId,
          sl.isActive as lineActive,
          GROUP_CONCAT(
            CONCAT(pi.storeName, '｜', pi.productName, '｜', pi.quantity, pi.unit)
            ORDER BY pi.storeName
            SEPARATOR '\n'
          ) as itemList,
          COUNT(pi.id) as itemCount
        FROM os_procurement_items pi
        LEFT JOIN os_supplier_line sl ON sl.supplierName = pi.supplierName
        WHERE pi.procurementOrderId = ?
        GROUP BY pi.supplierName, sl.lineGroupId, sl.isActive
      `, [input.orderId]);
      return rows as any[];
    }),

  // 推播 LINE 給廠商
  pushToLine: adminProcedure
    .input(z.object({
      orderId: z.number(),
      orderDate: z.string(),
      supplierGroups: z.array(z.object({
        supplierName: z.string(),
        lineGroupId: z.string(),
        itemList: z.string(),
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!LINE_TOKEN) throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');

      const results: { supplier: string; success: boolean; error?: string }[] = [];

      for (const group of input.supplierGroups) {
        if (!group.lineGroupId) {
          results.push({ supplier: group.supplierName, success: false, error: 'LINE群組ID未設定' });
          continue;
        }

        const message = `【來點什麼採購訂單】\n日期：${input.orderDate}\n\n${group.itemList}\n\n請確認並回覆收到，謝謝！`;

        try {
          const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LINE_TOKEN}`,
            },
            body: JSON.stringify({
              to: group.lineGroupId,
              messages: [{ type: 'text', text: message }],
            }),
          });

          if (res.ok) {
            await (db as any).$client.execute(`
              UPDATE os_procurement_items
              SET lineSent = 1, lineSentAt = NOW()
              WHERE procurementOrderId = ? AND supplierName = ?
            `, [input.orderId, group.supplierName]);
            results.push({ supplier: group.supplierName, success: true });
          } else {
            const err = await res.text();
            results.push({ supplier: group.supplierName, success: false, error: err });
          }
        } catch (e: any) {
          results.push({ supplier: group.supplierName, success: false, error: e.message });
        }
      }

      if (results.every(r => r.success)) {
        await (db as any).$client.execute(
          'UPDATE os_procurement_orders SET status = ? WHERE id = ?',
          ['sent', input.orderId]
        );
      }

      return { results };
    }),

  // 廠商 LINE 設定管理
  supplierLineList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [] as any[];
    const [rows] = await (db as any).$client.execute(
      'SELECT * FROM os_supplier_line ORDER BY supplierName'
    );
    return rows as any[];
  }),

  supplierLineUpsert: adminProcedure
    .input(z.object({
      supplierName: z.string(),
      lineGroupId: z.string().optional(),
      lineUserId: z.string().optional(),
      isActive: z.boolean().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(`
        INSERT INTO os_supplier_line (supplierName, lineGroupId, lineUserId, isActive, note)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          lineGroupId=VALUES(lineGroupId), lineUserId=VALUES(lineUserId),
          isActive=VALUES(isActive), note=VALUES(note)
      `, [input.supplierName, input.lineGroupId || null, input.lineUserId || null,
          input.isActive !== false ? 1 : 0, input.note || null]);
      return { success: true };
    }),

  getSuppliers: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [] as any[];
      const [rows] = await (db as any).$client.execute(
        'SELECT id, name, rebateType, rebateRate FROM os_suppliers WHERE isActive = 1 ORDER BY name',
        []
      );
      return rows as any[];
    }),

  deleteOrder: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        'DELETE FROM os_procurement_items WHERE procurementOrderId = ?',
        [input.orderId]
      );
      await (db as any).$client.execute(
        'DELETE FROM os_procurement_orders WHERE id = ? AND status = "pending"',
        [input.orderId]
      );
      return { success: true };
    }),

  updateNote: adminProcedure
    .input(z.object({ orderId: z.number(), note: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        'UPDATE os_procurement_orders SET note = ? WHERE id = ?',
        [input.note, input.orderId]
      );
      return { success: true };
    }),
});

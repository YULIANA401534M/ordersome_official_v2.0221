import { z } from 'zod';
import { router, adminProcedure, publicProcedure, superAdminProcedure } from '../_core/trpc';
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

  // 列表（可篩選日期、狀態、門市、廠商）
  list: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.string().optional(),
      supplierName: z.string().optional(),
      storeName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      let sql = `
        SELECT po.*,
          COUNT(pi.id) as itemCount,
          COALESCE(SUM(pi.amount), 0) as totalAmt,
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
      if (input.supplierName) {
        sql += ` AND EXISTS (SELECT 1 FROM os_procurement_items pi2 WHERE pi2.procurementOrderId = po.id AND pi2.supplierName = ?)`;
        params.push(input.supplierName);
      }
      if (input.storeName) {
        sql += ` AND EXISTS (SELECT 1 FROM os_procurement_items pi3 WHERE pi3.procurementOrderId = po.id AND pi3.storeName = ?)`;
        params.push(input.storeName);
      }
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

  // 更新狀態（cancelled 時寫 audit log，reason 為選填）
  updateStatus: adminProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending','sent','confirmed','received','cancelled']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      await (db as any).$client.execute(
        'UPDATE os_procurement_orders SET status = ? WHERE id = ?',
        [input.status, input.orderId]
      );
      if (input.status === 'cancelled') {
        const operatorEmail = (ctx.user as any).email ?? null;
        await (db as any).$client.execute(
          `INSERT INTO os_audit_logs (tenantId, operatorId, operatorEmail, action, targetTable, targetId, reason)
           VALUES (1, ?, ?, 'cancel', 'os_procurement_orders', ?, ?)`,
          [ctx.user.id, operatorEmail, input.orderId, input.reason ?? null]
        );
      }
      if (input.status === 'received') {
        try {
          // os_procurement_orders has no supplierName column; get it from items
          const [itemSupRows] = await (db as any).$client.execute(
            'SELECT DISTINCT supplierName FROM os_procurement_items WHERE procurementOrderId=? LIMIT 1',
            [input.orderId]
          );
          const supplierName = (itemSupRows as any[])[0]?.supplierName;
          if (!supplierName) throw new Error('找不到叫貨單品項');
          const [supRows] = await (db as any).$client.execute(
            'SELECT deliveryType FROM os_suppliers WHERE name=? AND isActive=1 LIMIT 1',
            [supplierName]
          );
          if ((supRows as any[])[0]?.deliveryType === 'yulian') {
            const [itemRows] = await (db as any).$client.execute(
              'SELECT productName, quantity, unit FROM os_procurement_items WHERE procurementOrderId=?',
              [input.orderId]
            );
            for (const item of itemRows as any[]) {
              const [invRows] = await (db as any).$client.execute(
                'SELECT id, currentQty FROM os_inventory WHERE tenantId=? AND supplierName=? AND productName=? LIMIT 1',
                [ctx.tenantId, supplierName, item.productName]
              );
              if ((invRows as any[]).length > 0) {
                const inv = (invRows as any[])[0];
                const qtyBefore = Number(inv.currentQty);
                const qtyAfter = qtyBefore + Number(item.quantity);
                await (db as any).$client.execute(
                  'UPDATE os_inventory SET currentQty=?, updatedAt=NOW() WHERE id=?',
                  [qtyAfter, inv.id]
                );
                await (db as any).$client.execute(
                  "INSERT INTO os_inventory_logs (tenantId, inventoryId, changeType, qty, qtyBefore, qtyAfter, refType, refId, note, createdAt) VALUES (?,?,'in',?,?,?,'procurement',?,'叫貨收貨自動入庫',NOW())",
                  [ctx.tenantId, inv.id, Number(item.quantity), qtyBefore, qtyAfter, input.orderId]
                );
              } else {
                const [insertResult] = await (db as any).$client.execute(
                  'INSERT INTO os_inventory (tenantId, supplierName, productName, unit, currentQty, safetyQty, lastCountDate, createdAt, updatedAt) VALUES (?,?,?,?,?,0,NULL,NOW(),NOW())',
                  [ctx.tenantId, supplierName, item.productName, item.unit, Number(item.quantity)]
                );
                const newId = (insertResult as any).insertId;
                await (db as any).$client.execute(
                  "INSERT INTO os_inventory_logs (tenantId, inventoryId, changeType, qty, qtyBefore, qtyAfter, refType, refId, note, createdAt) VALUES (?,?,'in',?,0,?,'procurement',?,'叫貨收貨自動建立品項',NOW())",
                  [ctx.tenantId, newId, Number(item.quantity), Number(item.quantity), input.orderId]
                );
              }
            }
          }
        } catch (e) {
          console.error('[庫存自動入庫失敗]', e);
        }
      }
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

  deleteOrder: superAdminProcedure
    .input(z.object({
      orderId: z.number(),
      reason: z.string().min(1, '請填寫刪除原因'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      // 快照刪除前資料
      const [snapRows] = await (db as any).$client.execute(
        'SELECT * FROM os_procurement_orders WHERE id = ? LIMIT 1',
        [input.orderId]
      );
      const snapshot = (snapRows as any[])[0] ?? null;
      await (db as any).$client.execute(
        'DELETE FROM os_procurement_items WHERE procurementOrderId = ?',
        [input.orderId]
      );
      await (db as any).$client.execute(
        'DELETE FROM os_procurement_orders WHERE id = ? AND status = "pending"',
        [input.orderId]
      );
      const operatorEmail = (ctx.user as any).email ?? null;
      await (db as any).$client.execute(
        `INSERT INTO os_audit_logs (tenantId, operatorId, operatorEmail, action, targetTable, targetId, targetSnapshot, reason)
         VALUES (1, ?, ?, 'delete', 'os_procurement_orders', ?, ?, ?)`,
        [ctx.user.id, operatorEmail, input.orderId, snapshot ? JSON.stringify(snapshot) : null, input.reason]
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

  // 批量刪除（只刪 pending，僅 super_admin）
  batchDeleteOrders: superAdminProcedure
    .input(z.object({
      ids: z.array(z.number()),
      reason: z.string().min(1, '請填寫刪除原因'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const tenantId = (ctx.user as any).tenantId ?? 1;
      const operatorEmail = (ctx.user as any).email ?? null;
      for (const id of input.ids) {
        const [snapRows] = await (db as any).$client.execute(
          'SELECT * FROM os_procurement_orders WHERE id = ? LIMIT 1',
          [id]
        );
        const snapshot = (snapRows as any[])[0] ?? null;
        await (db as any).$client.execute(
          'DELETE FROM os_procurement_items WHERE procurementOrderId = ?',
          [id]
        );
        await (db as any).$client.execute(
          'DELETE FROM os_procurement_orders WHERE id = ? AND status = "pending" AND tenantId = ?',
          [id, tenantId]
        );
        await (db as any).$client.execute(
          `INSERT INTO os_audit_logs (tenantId, operatorId, operatorEmail, action, targetTable, targetId, targetSnapshot, reason)
           VALUES (1, ?, ?, 'delete', 'os_procurement_orders', ?, ?, ?)`,
          [ctx.user.id, operatorEmail, id, snapshot ? JSON.stringify(snapshot) : null, input.reason]
        );
      }
      return { success: true, deleted: input.ids.length };
    }),

  // 修改品項（寫 audit log）
  updateItem: adminProcedure
    .input(z.object({
      itemId: z.number(),
      productName: z.string().optional(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      temperature: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const tenantId = (ctx.user as any).tenantId ?? 1;
      const [check] = await (db as any).$client.execute(`
        SELECT pi.id FROM os_procurement_items pi
        JOIN os_procurement_orders po ON po.id = pi.procurementOrderId
        WHERE pi.id = ? AND po.tenantId = ? LIMIT 1
      `, [input.itemId, tenantId]);
      if ((check as any[]).length === 0) throw new Error('品項不存在或無權限');

      // 快照修改前資料
      const [snapRows] = await (db as any).$client.execute(
        'SELECT * FROM os_procurement_items WHERE id = ? LIMIT 1',
        [input.itemId]
      );
      const snapshot = (snapRows as any[])[0] ?? null;

      const sets: string[] = [];
      const params: any[] = [];
      if (input.productName !== undefined) { sets.push('productName = ?'); params.push(input.productName); }
      if (input.quantity !== undefined) { sets.push('quantity = ?'); params.push(input.quantity); }
      if (input.unit !== undefined) { sets.push('unit = ?'); params.push(input.unit); }
      if (input.temperature !== undefined) { sets.push('temperature = ?'); params.push(input.temperature); }
      if (sets.length === 0) return { success: true };
      params.push(input.itemId);
      await (db as any).$client.execute(
        `UPDATE os_procurement_items SET ${sets.join(', ')} WHERE id = ?`,
        params
      );
      const operatorEmail = (ctx.user as any).email ?? null;
      await (db as any).$client.execute(
        `INSERT INTO os_audit_logs (tenantId, operatorId, operatorEmail, action, targetTable, targetId, targetSnapshot)
         VALUES (1, ?, ?, 'update', 'os_procurement_items', ?, ?)`,
        [ctx.user.id, operatorEmail, input.itemId, snapshot ? JSON.stringify(snapshot) : null]
      );
      return { success: true };
    }),

  // 新增品項
  addItem: adminProcedure
    .input(z.object({
      orderId: z.number(),
      productName: z.string(),
      unit: z.string(),
      quantity: z.number(),
      temperature: z.enum(['常溫','冷藏','冷凍']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const tenantId = (ctx.user as any).tenantId ?? 1;
      const [orderRows] = await (db as any).$client.execute(
        'SELECT id, supplierName FROM os_procurement_orders WHERE id = ? AND tenantId = ? LIMIT 1',
        [input.orderId, tenantId]
      );
      if ((orderRows as any[]).length === 0) throw new Error('叫貨單不存在');

      // 取得此單首筆品項的 supplierName/storeName 作為預設
      const [firstItem] = await (db as any).$client.execute(
        'SELECT supplierName, storeName FROM os_procurement_items WHERE procurementOrderId = ? LIMIT 1',
        [input.orderId]
      );
      const supplierName = (firstItem as any[])[0]?.supplierName ?? '';
      const storeName = (firstItem as any[])[0]?.storeName ?? '';

      const [supRows] = await (db as any).$client.execute(
        'SELECT id FROM os_suppliers WHERE name = ? LIMIT 1',
        [supplierName]
      );
      const supplierId = (supRows as any[])[0]?.id || null;

      await (db as any).$client.execute(`
        INSERT INTO os_procurement_items
          (procurementOrderId, supplierId, supplierName, storeName, productName, unit, quantity, unitPrice, amount, temperature)
        VALUES (?,?,?,?,?,?,?,0,0,?)
      `, [input.orderId, supplierId, supplierName, storeName,
          input.productName, input.unit, input.quantity,
          input.temperature || '常溫']);
      return { success: true };
    }),

  // 取得當前篩選期間的 distinct storeName
  listStoreNames: adminProcedure
    .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as string[];
      let sql = `
        SELECT DISTINCT pi.storeName
        FROM os_procurement_items pi
        JOIN os_procurement_orders po ON po.id = pi.procurementOrderId
        WHERE po.tenantId = 1 AND pi.storeName != ''
      `;
      const params: any[] = [];
      if (input.startDate) { sql += ` AND po.orderDate >= ?`; params.push(input.startDate); }
      if (input.endDate) { sql += ` AND po.orderDate <= ?`; params.push(input.endDate); }
      sql += ` ORDER BY pi.storeName`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return (rows as any[]).map(r => r.storeName as string);
    }),

  // 取得所有 distinct supplierName（從品項表）
  listSupplierNames: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [] as string[];
      const [rows] = await (db as any).$client.execute(
        `SELECT DISTINCT pi.supplierName FROM os_procurement_items pi JOIN os_procurement_orders po ON po.id = pi.procurementOrderId WHERE po.tenantId = 1 AND pi.supplierName != '' ORDER BY pi.supplierName`
      );
      return (rows as any[]).map(r => r.supplierName as string);
    }),

  // 撿貨單：B 類廠商叫貨品項清單
  getPickList: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await (db as any).$client.execute(`
        SELECT
          po.id as orderId,
          po.orderNo,
          po.orderDate,
          po.status,
          pi.supplierName,
          pi.storeName,
          pi.productName,
          pi.quantity,
          pi.unit,
          pi.temperature,
          po.printedAt
        FROM os_procurement_orders po
        JOIN os_procurement_items pi ON pi.procurementOrderId = po.id
        JOIN os_suppliers s ON s.name = pi.supplierName AND s.deliveryType = 'yulian'
        WHERE po.tenantId = ?
          AND po.orderDate >= ?
          AND po.orderDate <= ?
          AND po.status IN ('sent', 'confirmed')
        ORDER BY pi.supplierName, po.orderDate, pi.storeName, pi.productName
      `, [ctx.tenantId ?? 1, input.startDate, input.endDate]);
      return rows as any[];
    }),

  // 標記撿貨單已列印
  markPrinted: adminProcedure
    .input(z.object({ orderIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      for (const id of input.orderIds) {
        await (db as any).$client.execute(
          'UPDATE os_procurement_orders SET printedAt=NOW() WHERE id=? AND tenantId=?',
          [id, ctx.tenantId ?? 1]
        );
      }
      return { ok: true };
    }),

  // 大麥 Excel 批次匯入
  importFromDamaiExcel: adminProcedure
    .input(z.object({
      rows: z.array(z.object({
        orderNo: z.string(),
        supplierName: z.string(),
        storeName: z.string(),
        productName: z.string(),
        unit: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        temperature: z.string().optional(),
        orderDate: z.string(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;
      let created = 0, skipped = 0, flagged = 0;

      const grouped = new Map<string, typeof input.rows>();
      for (const row of input.rows) {
        if (!grouped.has(row.orderNo)) grouped.set(row.orderNo, []);
        grouped.get(row.orderNo)!.push(row);
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const cutoff = new Date('2026-04-01');

      for (const [orderNo, items] of Array.from(grouped)) {
        const [existing] = await (db as any).$client.execute(
          'SELECT id FROM os_procurement_orders WHERE tenantId=? AND orderNo=? LIMIT 1',
          [tenantId, orderNo]
        );
        if ((existing as any[]).length > 0) { skipped++; continue; }

        const firstItem = items[0];
        const [supRows] = await (db as any).$client.execute(
          'SELECT deliveryType FROM os_suppliers WHERE name=? AND isActive=1 LIMIT 1',
          [firstItem.supplierName]
        );
        const isYulian = (supRows as any[])[0]?.deliveryType === 'yulian';
        const sourceType = isYulian ? 'damai_yulian' : 'damai_import';
        const isHistorical = firstItem.orderDate.slice(0, 10) < todayStr;
        const status = isHistorical ? 'received' : 'pending';

        const [orderResult] = await (db as any).$client.execute(
          `INSERT INTO os_procurement_orders (tenantId, orderNo, orderDate, status, sourceType, createdAt, updatedAt)
           VALUES (?,?,?,?,?,NOW(),NOW())`,
          [tenantId, orderNo, firstItem.orderDate.slice(0, 10), status, sourceType]
        );
        const orderId = (orderResult as any).insertId;
        created++;

        for (const item of items) {
          const [prodRows] = await (db as any).$client.execute(
            `SELECT id FROM os_products WHERE tenantId=1 AND isActive=1
             AND (name=? OR JSON_CONTAINS(aliases, JSON_QUOTE(?))) LIMIT 1`,
            [item.productName, item.productName]
          );
          const needsReview = (prodRows as any[]).length === 0 ? 1 : 0;
          if (needsReview) flagged++;
          const amount = item.unitPrice * item.quantity;
          await (db as any).$client.execute(
            `INSERT INTO os_procurement_items
             (procurementOrderId, supplierName, storeName, productName, unit, quantity,
              unitPrice, amount, temperature, needsReview, createdAt)
             VALUES (?,?,?,?,?,?,?,?,?,?,NOW())`,
            [orderId, item.supplierName, item.storeName, item.productName,
             item.unit, item.quantity, item.unitPrice, amount,
             item.temperature ?? '常溫', needsReview]
          );
        }

        // 4/1 之後的歷史 B 類訂單：觸發庫存入庫
        const orderDateObj = new Date(firstItem.orderDate.slice(0, 10));
        if (isHistorical && isYulian && orderDateObj >= cutoff) {
          try {
            for (const item of items) {
              const [invRows] = await (db as any).$client.execute(
                'SELECT id, currentQty FROM os_inventory WHERE tenantId=? AND supplierName=? AND productName=? LIMIT 1',
                [tenantId, firstItem.supplierName, item.productName]
              );
              if ((invRows as any[]).length > 0) {
                const inv = (invRows as any[])[0];
                const qtyAfter = Number(inv.currentQty) + Number(item.quantity);
                await (db as any).$client.execute(
                  'UPDATE os_inventory SET currentQty=?, updatedAt=NOW() WHERE id=?',
                  [qtyAfter, inv.id]
                );
                await (db as any).$client.execute(
                  `INSERT INTO os_inventory_logs (tenantId, inventoryId, changeType, qty, qtyBefore, qtyAfter, refType, refId, note, createdAt)
                   VALUES (?,?,'in',?,?,?,'procurement',?,'大麥Excel歷史匯入',NOW())`,
                  [tenantId, inv.id, Number(item.quantity), Number(inv.currentQty), qtyAfter, orderId]
                );
              }
            }
          } catch (e) {
            console.error('[歷史匯入庫存失敗]', e);
          }
        }
      }

      return {
        created, skipped, flagged,
        message: `建立 ${created} 張叫貨單，略過 ${skipped} 張（重複），${flagged} 筆品名待確認`,
      };
    }),

  listNeedsReview: adminProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await (db as any).$client.execute(
        `SELECT pi.id, pi.productName, pi.supplierName, po.orderNo, po.orderDate
         FROM os_procurement_items pi
         JOIN os_procurement_orders po ON po.id = pi.procurementOrderId
         WHERE po.tenantId=? AND pi.needsReview=1
         ORDER BY po.orderDate DESC
         LIMIT 100`,
        [ctx.tenantId ?? 1]
      );
      return rows as any[];
    }),
});

import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { getDb } from '../db';

export const osRebateRouter = router({

  // 計算某月退佣（從叫貨明細自動算）
  calculate: adminProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const confirmedBy = (ctx.user as any).name || (ctx.user as any).email;

      const [purchaseSums] = await (db as any).$client.execute(`
        SELECT
          pi.supplierName,
          pi.supplierId,
          SUM(pi.amount) as totalAmount,
          COUNT(pi.id) as itemCount
        FROM os_procurement_items pi
        JOIN os_procurement_orders po ON po.id = pi.procurementOrderId
        WHERE YEAR(po.orderDate) = ? AND MONTH(po.orderDate) = ?
          AND po.status != 'cancelled'
          AND po.tenantId = 1
        GROUP BY pi.supplierName, pi.supplierId
      `, [input.year, input.month]);

      const results: any[] = [];

      for (const row of purchaseSums as any[]) {
        const [supRows] = await (db as any).$client.execute(
          'SELECT * FROM os_suppliers WHERE name = ? LIMIT 1',
          [row.supplierName]
        );
        const supplier = (supRows as any[])[0];
        if (!supplier) continue;

        let rebateAmount = 0;
        const rebateType = supplier.rebateType || 'percentage';

        if (rebateType === 'percentage' && supplier.rebateRate > 0) {
          rebateAmount = Math.round(row.totalAmount * supplier.rebateRate);
        } else if (rebateType === 'fixed') {
          rebateAmount = Number(supplier.rebateRate) || 0;
        } else if (rebateType === 'offset') {
          rebateAmount = Math.round(row.totalAmount * (Number(supplier.rebateRate) || 0));
        }

        await (db as any).$client.execute(`
          INSERT INTO os_rebate_records
            (tenantId, supplierName, supplierId, rebateType, rebateRate,
             periodYear, periodMonth, totalPurchaseAmount, rebateAmount,
             status, confirmedBy)
          VALUES (1,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            totalPurchaseAmount=VALUES(totalPurchaseAmount),
            rebateAmount=VALUES(rebateAmount),
            status='calculated',
            confirmedBy=VALUES(confirmedBy),
            calculatedAt=NOW()
        `, [row.supplierName, row.supplierId || null, rebateType,
            supplier.rebateRate || 0, input.year, input.month,
            row.totalAmount, rebateAmount,
            rebateType === 'offset' ? 'offset' : 'calculated',
            confirmedBy]);

        const netPayable = rebateType === 'offset'
          ? row.totalAmount - rebateAmount
          : row.totalAmount;

        await (db as any).$client.execute(`
          INSERT INTO os_payables
            (tenantId, supplierName, supplierId, periodYear, periodMonth,
             totalAmount, rebateOffset, netPayable, status)
          VALUES (1,?,?,?,?,?,?,?,'pending')
          ON DUPLICATE KEY UPDATE
            totalAmount=VALUES(totalAmount),
            rebateOffset=VALUES(rebateOffset),
            netPayable=VALUES(netPayable)
        `, [row.supplierName, row.supplierId || null,
            input.year, input.month,
            row.totalAmount,
            rebateType === 'offset' ? rebateAmount : 0,
            netPayable]);

        results.push({
          supplierName: row.supplierName,
          totalAmount: Number(row.totalAmount),
          rebateAmount,
          rebateType,
          netPayable,
        });
      }

      return { success: true, results, count: results.length };
    }),

  // 列表（月份篩選）
  list: adminProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [rebates] = await (db as any).$client.execute(`
        SELECT r.*, p.netPayable as payableNetPayable, p.status as payableStatus, p.paidDate
        FROM os_rebate_records r
        LEFT JOIN os_payables p ON p.supplierName = r.supplierName
          AND p.periodYear = r.periodYear AND p.periodMonth = r.periodMonth
        WHERE r.tenantId = 1 AND r.periodYear = ? AND r.periodMonth = ?
        ORDER BY r.rebateAmount DESC
      `, [input.year, input.month]);
      return rebates as any[];
    }),

  // 確認退佣已收
  confirmReceived: adminProcedure
    .input(z.object({
      id: z.number(),
      receivedDate: z.string(),
      bankTxNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await (db as any).$client.execute(`
        UPDATE os_rebate_records
        SET status='received', receivedDate=?, bankTxNote=?
        WHERE id=?
      `, [input.receivedDate, input.bankTxNote || null, input.id]);
      return { success: true };
    }),

  // 應付帳款列表
  payableList: adminProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      let sql = `
        SELECT * FROM os_payables
        WHERE tenantId = 1 AND periodYear = ? AND periodMonth = ?
      `;
      const params: any[] = [input.year, input.month];
      if (input.status) { sql += ` AND status = ?`; params.push(input.status); }
      sql += ` ORDER BY netPayable DESC`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 標記已付款
  markPaid: adminProcedure
    .input(z.object({
      id: z.number(),
      paidDate: z.string(),
      paidAmount: z.number(),
      bankTxNote: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await (db as any).$client.execute(`
        UPDATE os_payables
        SET status='paid', paidDate=?, paidAmount=?, bankTxNote=?
        WHERE id=?
      `, [input.paidDate, input.paidAmount, input.bankTxNote || null, input.id]);
      return { success: true };
    }),

  // 匯入廣弘回扣表（手動上傳 Excel 解析後傳入）
  importGuanghong: adminProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
      items: z.array(z.object({
        storeName: z.string(),
        productCode: z.string().optional(),
        productName: z.string(),
        quantity: z.number(),
        amount: z.number(),
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const totalAmount = input.items.reduce((sum, i) => sum + i.amount, 0);
      const rebateAmount = Math.round(totalAmount * (1 - 1/1.12));

      await (db as any).$client.execute(`
        INSERT INTO os_rebate_records
          (tenantId, supplierName, supplierId, rebateType, rebateRate,
           periodYear, periodMonth, totalPurchaseAmount, rebateAmount, status)
        VALUES (1,'廣弘',NULL,'percentage',0.1071,?,?,?,?,'calculated')
        ON DUPLICATE KEY UPDATE
          totalPurchaseAmount=VALUES(totalPurchaseAmount),
          rebateAmount=VALUES(rebateAmount),
          calculatedAt=NOW()
      `, [input.year, input.month, totalAmount, rebateAmount]);

      return {
        success: true,
        totalAmount,
        rebateAmount,
        itemCount: input.items.length
      };
    }),
});

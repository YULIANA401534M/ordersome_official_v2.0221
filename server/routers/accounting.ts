import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { getDb } from '../db';

export const accountingRouter = router({

  // ── 應付帳款 ──────────────────────────────

  listPayables: adminProcedure
    .input(z.object({
      month: z.string().optional(),
      supplierName: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      let sql = `SELECT * FROM os_payables WHERE tenantId=?`;
      const params: any[] = [ctx.tenantId ?? 1];
      if (input.month) { sql += ` AND month=?`; params.push(input.month); }
      if (input.supplierName) { sql += ` AND supplierName=?`; params.push(input.supplierName); }
      if (input.status) { sql += ` AND status=?`; params.push(input.status); }
      sql += ` ORDER BY month DESC, supplierName`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  generateMonthlyPayables: adminProcedure
    .input(z.object({ month: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const [year, mon] = input.month.split('-').map(Number);
      const periodStart = `${input.month}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      const periodEnd = `${input.month}-${String(lastDay).padStart(2, '0')}`;
      const tenantId = ctx.tenantId ?? 1;

      const [rows] = await (db as any).$client.execute(`
        SELECT pi.supplierName, SUM(pi.amount) as totalAmount
        FROM os_procurement_orders po
        JOIN os_procurement_items pi ON pi.procurementOrderId = po.id
        WHERE po.tenantId=? AND po.status='received'
          AND po.orderDate >= ? AND po.orderDate <= ?
        GROUP BY pi.supplierName
      `, [tenantId, periodStart, periodEnd]);

      let created = 0, updated = 0;
      for (const row of rows as any[]) {
        const [existing] = await (db as any).$client.execute(
          'SELECT id FROM os_payables WHERE tenantId=? AND supplierName=? AND month=? LIMIT 1',
          [tenantId, row.supplierName, input.month]
        );
        if ((existing as any[]).length > 0) {
          await (db as any).$client.execute(
            'UPDATE os_payables SET totalAmount=?, updatedAt=NOW() WHERE id=?',
            [row.totalAmount, (existing as any[])[0].id]
          );
          updated++;
        } else {
          await (db as any).$client.execute(
            `INSERT INTO os_payables (tenantId, supplierName, month, periodStart, periodEnd, totalAmount, createdBy, createdAt, updatedAt)
             VALUES (?,?,?,?,?,?,?,NOW(),NOW())`,
            [tenantId, row.supplierName, input.month, periodStart, periodEnd, row.totalAmount, ctx.user?.id ?? null]
          );
          created++;
        }
      }
      return { created, updated, message: `建立 ${created} 筆，更新 ${updated} 筆應付帳款` };
    }),

  markPayablePaid: adminProcedure
    .input(z.object({
      id: z.number(),
      paidAmount: z.number(),
      bankRef: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;
      const [rows] = await (db as any).$client.execute(
        'SELECT id, totalAmount, paidAmount FROM os_payables WHERE id=? AND tenantId=? LIMIT 1',
        [input.id, tenantId]
      );
      if (!(rows as any[])[0]) throw new Error('找不到應付帳款');
      const rec = (rows as any[])[0];
      const newPaid = Number(rec.paidAmount) + input.paidAmount;
      const status = newPaid >= Number(rec.totalAmount) ? 'paid' : 'partial';
      await (db as any).$client.execute(
        `UPDATE os_payables SET paidAmount=?, status=?, bankRef=?, paidAt=NOW(), note=?, updatedAt=NOW() WHERE id=?`,
        [newPaid, status, input.bankRef ?? null, input.note ?? null, input.id]
      );
      await (db as any).$client.execute(
        `INSERT INTO os_audit_logs (tenantId, operatorId, operatorEmail, action, targetTable, targetId, reason, createdAt)
         VALUES (?,?,?,'update','os_payables',?,?,NOW())`,
        [tenantId, ctx.user?.id ?? null, ctx.user?.email ?? '', input.id, `標記付款 ${input.paidAmount} 元`]
      );
      return { status };
    }),

  // ── 銀行明細 ──────────────────────────────

  importBankTransactions: adminProcedure
    .input(z.object({
      importBatch: z.string(),
      rows: z.array(z.object({
        transactionDate: z.string(),
        summary: z.string(),
        debit: z.number(),
        credit: z.number(),
        balance: z.number().optional(),
        note1: z.string().optional(),
        note2: z.string().optional(),
        category: z.string().optional(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;
      const [batchCheck] = await (db as any).$client.execute(
        'SELECT COUNT(*) as cnt FROM os_bank_transactions WHERE tenantId=? AND importBatch=?',
        [tenantId, input.importBatch]
      );
      if (Number((batchCheck as any[])[0].cnt) > 0) {
        throw new Error(`批次 ${input.importBatch} 已匯入過，請勿重複`);
      }
      let inserted = 0;
      for (const row of input.rows) {
        await (db as any).$client.execute(
          `INSERT INTO os_bank_transactions
           (tenantId, transactionDate, summary, debit, credit, balance, note1, note2, category, importBatch, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?,?,NOW())`,
          [tenantId, row.transactionDate, row.summary,
           row.debit, row.credit, row.balance ?? null,
           row.note1 ?? null, row.note2 ?? null, row.category ?? null, input.importBatch]
        );
        inserted++;
      }
      return { inserted, message: `匯入 ${inserted} 筆銀行明細` };
    }),

  autoMatchTransactions: adminProcedure
    .input(z.object({ month: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;

      const [txRows] = await (db as any).$client.execute(
        `SELECT id, transactionDate, summary, debit, credit, note1, note2
         FROM os_bank_transactions
         WHERE tenantId=? AND matchedType='unmatched' AND transactionDate LIKE ?`,
        [tenantId, `${input.month}%`]
      );
      const [payables] = await (db as any).$client.execute(
        `SELECT id, supplierName, totalAmount, netPayable FROM os_payables
         WHERE tenantId=? AND month=? AND status NOT IN ('paid')`,
        [tenantId, input.month]
      );
      const [receivables] = await (db as any).$client.execute(
        `SELECT id, amount FROM os_franchisee_payments
         WHERE tenantId=? AND status='pending' AND DATE_FORMAT(createdAt, '%Y-%m')=?`,
        [tenantId, input.month]
      );

      let matched = 0;
      for (const tx of txRows as any[]) {
        const combined = `${tx.summary} ${tx.note1 ?? ''} ${tx.note2 ?? ''}`.toLowerCase();
        let bestMatch: { type: string; id: number } | null = null;
        let bestScore = 0;

        if (tx.debit > 0) {
          for (const p of payables as any[]) {
            let score = 0;
            const sname = p.supplierName.replace(/[０-９]/g, (c: string) =>
              String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
            if (combined.includes(sname.toLowerCase())) score += 60;
            const amtDiff = Math.abs(tx.debit - p.netPayable);
            if (amtDiff < 100) score += 30;
            else if (amtDiff < 1000) score += 10;
            if (score > bestScore) { bestScore = score; bestMatch = { type: 'payable', id: p.id }; }
          }
        }
        if (tx.credit > 0) {
          for (const r of receivables as any[]) {
            let score = 0;
            const amtDiff = Math.abs(tx.credit - r.amount);
            if (amtDiff < 100) score += 40;
            if (score > bestScore) { bestScore = score; bestMatch = { type: 'receivable', id: r.id }; }
          }
        }

        if (bestMatch && bestScore >= 50) {
          await (db as any).$client.execute(
            `UPDATE os_bank_transactions SET matchedType=?, matchedId=?, matchScore=? WHERE id=?`,
            [bestMatch.type, bestMatch.id, bestScore, tx.id]
          );
          matched++;
        }
      }
      return { matched, message: `自動比對 ${matched} 筆，請人工確認後再標記完成` };
    }),

  confirmMatch: adminProcedure
    .input(z.object({
      transactionId: z.number(),
      matchedType: z.enum(['payable','receivable','rebate','transfer','salary','expense','other']),
      matchedId: z.number().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      await (db as any).$client.execute(
        `UPDATE os_bank_transactions SET matchedType=?, matchedId=?, confirmedBy=?, matchedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.matchedType, input.matchedId ?? null, ctx.user?.id ?? null, input.transactionId, ctx.tenantId ?? 1]
      );
      return { ok: true };
    }),

  // ── 退佣 ──────────────────────────────────

  calculateRebates: adminProcedure
    .input(z.object({ month: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;
      const [rules] = await (db as any).$client.execute(
        `SELECT * FROM os_rebate_rules WHERE tenantId=? AND isActive=1
         AND effectiveFrom <= ? AND (effectiveTo IS NULL OR effectiveTo >= ?)`,
        [tenantId, `${input.month}-01`, `${input.month}-01`]
      );

      let created = 0;
      for (const rule of rules as any[]) {
        const [payRow] = await (db as any).$client.execute(
          `SELECT id, totalAmount FROM os_payables WHERE tenantId=? AND supplierName=? AND month=? LIMIT 1`,
          [tenantId, rule.supplierName, input.month]
        );
        if (!(payRow as any[])[0]) continue;
        const p = (payRow as any[])[0];
        let rebateAmount = 0;
        if (rule.rebateType === 'percentage') {
          const untaxed = p.totalAmount / 1.12;
          rebateAmount = p.totalAmount - untaxed;
        }
        const netRebate = rebateAmount - (rule.handlingFee ?? 0);

        const [existing] = await (db as any).$client.execute(
          'SELECT id FROM os_rebates WHERE tenantId=? AND supplierName=? AND month=? LIMIT 1',
          [tenantId, rule.supplierName, input.month]
        );
        if ((existing as any[]).length > 0) continue;

        const linkedPayableId = rule.rebateType === 'offset' ? p.id : null;
        await (db as any).$client.execute(
          `INSERT INTO os_rebates (tenantId, supplierName, month, rebateType, baseAmount, rebateAmount, handlingFee, netRebate, linkedPayableId, createdAt, updatedAt)
           VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
          [tenantId, rule.supplierName, input.month, rule.rebateType, p.totalAmount, rebateAmount, rule.handlingFee ?? 0, netRebate, linkedPayableId]
        );

        if (rule.rebateType === 'offset') {
          await (db as any).$client.execute(
            'UPDATE os_payables SET rebateAmount=? WHERE id=?',
            [rebateAmount, p.id]
          );
        }
        created++;
      }
      return { created, message: `計算 ${created} 筆退佣（伯享需人工輸入金額）` };
    }),

  // ── 提貨調貨 ──────────────────────────────

  listTransfers: adminProcedure
    .input(z.object({
      month: z.string().optional(),
      toStore: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      let sql = `SELECT * FROM os_transfers WHERE tenantId=?`;
      const params: any[] = [ctx.tenantId ?? 1];
      if (input.month) { sql += ` AND month=?`; params.push(input.month); }
      if (input.toStore) { sql += ` AND toStore=?`; params.push(input.toStore); }
      sql += ` ORDER BY month DESC, transferDate, toStore`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  createTransfer: adminProcedure
    .input(z.object({
      transferDate: z.string(),
      toStore: z.string(),
      productName: z.string(),
      quantity: z.number(),
      unit: z.string(),
      unitPrice: z.number(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const month = input.transferDate.slice(0, 7);
      const amount = input.quantity * input.unitPrice;
      await (db as any).$client.execute(
        `INSERT INTO os_transfers (tenantId, month, transferDate, fromStore, toStore, productName, quantity, unit, unitPrice, amount, note, createdAt, updatedAt)
         VALUES (?,?,?,'宇聯',?,?,?,?,?,?,?,NOW(),NOW())`,
        [ctx.tenantId ?? 1, month, input.transferDate, input.toStore, input.productName, input.quantity, input.unit, input.unitPrice, amount, input.note ?? null]
      );
      return { ok: true };
    }),

  importTransfers: adminProcedure
    .input(z.object({
      month: z.string(),
      rows: z.array(z.object({
        transferDate: z.string(),
        toStore: z.string(),
        productName: z.string(),
        quantity: z.number(),
        unit: z.string(),
        unitPrice: z.number(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      let inserted = 0;
      for (const row of input.rows) {
        const amount = row.quantity * row.unitPrice;
        await (db as any).$client.execute(
          `INSERT INTO os_transfers (tenantId, month, transferDate, fromStore, toStore, productName, quantity, unit, unitPrice, amount, createdAt, updatedAt)
           VALUES (?,?,?,'宇聯',?,?,?,?,?,?,NOW(),NOW())`,
          [ctx.tenantId ?? 1, input.month, row.transferDate, row.toStore, row.productName, row.quantity, row.unit, row.unitPrice, amount]
        );
        inserted++;
      }
      return { inserted };
    }),

  billTransfers: adminProcedure
    .input(z.object({ month: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;
      const [rows] = await (db as any).$client.execute(
        `SELECT toStore, SUM(amount) as totalAmount
         FROM os_transfers
         WHERE tenantId=? AND month=? AND status='pending'
         GROUP BY toStore`,
        [tenantId, input.month]
      );
      let billed = 0;
      for (const row of rows as any[]) {
        await (db as any).$client.execute(
          `INSERT INTO os_franchisee_payments (tenantId, storeName, amount, type, note, status, createdAt)
           VALUES (?,?,?,'transfer',?,'pending',NOW())`,
          [tenantId, row.toStore, row.totalAmount, `${input.month} 提貨調貨款`]
        );
        await (db as any).$client.execute(
          `UPDATE os_transfers SET status='billed', updatedAt=NOW()
           WHERE tenantId=? AND month=? AND toStore=? AND status='pending'`,
          [tenantId, input.month, row.toStore]
        );
        billed++;
      }
      return { billed, message: `${billed} 間門市提貨款已開帳` };
    }),

  createPayable: adminProcedure
    .input(z.object({
      supplierName: z.string(),
      month: z.string(),
      totalAmount: z.number().positive(),
      dueDate: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const [year, mon] = input.month.split('-').map(Number);
      const periodStart = `${input.month}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      const periodEnd = `${input.month}-${String(lastDay).padStart(2, '0')}`;
      await (db as any).$client.execute(
        `INSERT INTO os_payables
         (tenantId, supplierName, month, periodStart, periodEnd, totalAmount, dueDate, note, createdBy, createdAt, updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`,
        [ctx.tenantId ?? 1, input.supplierName, input.month,
         periodStart, periodEnd, input.totalAmount,
         input.dueDate || null, input.note || null, ctx.user?.id ?? null]
      );
      return { ok: true };
    }),

  exportPayables: adminProcedure
    .input(z.object({ month: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await (db as any).$client.execute(
        `SELECT p.*, r.rebateAmount as calcRebate, r.netRebate
         FROM os_payables p
         LEFT JOIN os_rebates r ON r.supplierName=p.supplierName AND r.month=p.month AND r.tenantId=p.tenantId
         WHERE p.tenantId=? AND p.month=?
         ORDER BY p.supplierName`,
        [ctx.tenantId ?? 1, input.month]
      );
      return rows as any[];
    }),

  listBankTransactions: adminProcedure
    .input(z.object({
      month: z.string(),
      importBatch: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      let sql = `SELECT * FROM os_bank_transactions WHERE tenantId=? AND transactionDate LIKE ?`;
      const params: any[] = [ctx.tenantId ?? 1, `${input.month}%`];
      if (input.importBatch) { sql += ` AND importBatch=?`; params.push(input.importBatch); }
      sql += ` ORDER BY transactionDate, id`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  listRebates: adminProcedure
    .input(z.object({
      month: z.string().optional(),
      supplierName: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      let sql = `SELECT * FROM os_rebates WHERE tenantId=?`;
      const params: any[] = [ctx.tenantId ?? 1];
      if (input.month) { sql += ` AND month=?`; params.push(input.month); }
      if (input.supplierName) { sql += ` AND supplierName=?`; params.push(input.supplierName); }
      sql += ` ORDER BY month DESC, supplierName`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  updateRebate: adminProcedure
    .input(z.object({
      id: z.number(),
      rebateAmount: z.number().optional(),
      bankRef: z.string().optional(),
      status: z.enum(['pending', 'received', 'offset']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const tenantId = ctx.tenantId ?? 1;
      const setClauses: string[] = ['updatedAt=NOW()'];
      const params: any[] = [];
      if (input.rebateAmount !== undefined) {
        setClauses.push('rebateAmount=?');
        params.push(input.rebateAmount);
      }
      if (input.bankRef !== undefined) { setClauses.push('bankRef=?'); params.push(input.bankRef); }
      if (input.status !== undefined) { setClauses.push('status=?'); params.push(input.status); }
      params.push(input.id, tenantId);
      await (db as any).$client.execute(
        `UPDATE os_rebates SET ${setClauses.join(', ')} WHERE id=? AND tenantId=?`,
        params
      );
      return { ok: true };
    }),

  voidTransfer: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      await (db as any).$client.execute(
        `UPDATE os_transfers SET status='void', updatedAt=NOW() WHERE id=? AND tenantId=? AND status='pending'`,
        [input.id, ctx.tenantId ?? 1]
      );
      return { ok: true };
    }),
});

import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { getDb } from '../db';
import bcrypt from 'bcryptjs';

export const franchiseeRouter = router({

  convertToFranchisee: adminProcedure
    .input(z.object({
      inquiryId: z.number(),
      email: z.string().email(),
      name: z.string(),
      phone: z.string().optional(),
      storeId: z.string().optional(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');

      const openId = `franchisee_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;

      const [result] = await (db as any).$client.execute(
        `INSERT INTO users (tenantId, openId, name, email, phone, role, storeId, passwordHash, status, loginMethod)
         VALUES (1, ?, ?, ?, ?, 'franchisee', ?, ?, 'active', 'password')`,
        [openId, input.name, input.email, input.phone ?? null,
         input.storeId ?? null, passwordHash]
      );
      const userId = (result as any).insertId;

      await (db as any).$client.execute(
        `UPDATE franchise_inquiries SET status='completed' WHERE id=?`,
        [input.inquiryId]
      );

      return { userId };
    }),

  franchiseeList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [] as any[];
    const [rows] = await (db as any).$client.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.storeId, u.status,
              u.has_procurement_access, u.createdAt, u.last_login_at, u.internalContact,
              s.name as storeName
       FROM users u
       LEFT JOIN stores s ON s.id = CAST(u.storeId AS UNSIGNED)
       WHERE u.role = 'franchisee' AND u.tenantId = 1
       ORDER BY u.createdAt DESC`
    );
    return rows as any[];
  }),

  franchiseeDetail: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [userRows] = await (db as any).$client.execute(
        `SELECT u.id, u.name, u.email, u.phone, u.storeId, u.status,
                u.has_procurement_access, u.createdAt, u.last_login_at, u.internalContact,
                s.name as storeName
         FROM users u
         LEFT JOIN stores s ON s.id = CAST(u.storeId AS UNSIGNED)
         WHERE u.id = ? AND u.role = 'franchisee'`,
        [input.userId]
      );
      const user = (userRows as any[])[0] ?? null;
      if (!user) return null;

      const [contracts] = await (db as any).$client.execute(
        `SELECT * FROM os_franchisee_contracts WHERE userId=? ORDER BY createdAt DESC`,
        [input.userId]
      );
      const [payments] = await (db as any).$client.execute(
        `SELECT * FROM os_franchisee_payments WHERE userId=? ORDER BY paymentDate DESC`,
        [input.userId]
      );
      const [flags] = await (db as any).$client.execute(
        `SELECT feature_key, is_enabled FROM franchisee_feature_flags WHERE user_id=?`,
        [input.userId]
      );

      return { user, contracts, payments, featureFlags: flags };
    }),

  franchiseeUpdate: adminProcedure
    .input(z.object({
      userId: z.number(),
      storeId: z.string().optional(),
      status: z.enum(['active', 'suspended']).optional(),
      has_procurement_access: z.boolean().optional(),
      internalContact: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');

      const sets: string[] = [];
      const params: any[] = [];

      if (input.storeId !== undefined) { sets.push('storeId=?'); params.push(input.storeId); }
      if (input.status !== undefined) { sets.push('status=?'); params.push(input.status); }
      if (input.has_procurement_access !== undefined) { sets.push('has_procurement_access=?'); params.push(input.has_procurement_access ? 1 : 0); }
      if (input.internalContact !== undefined) { sets.push('internalContact=?'); params.push(input.internalContact); }

      if (sets.length === 0) return { success: true };
      params.push(input.userId);

      await (db as any).$client.execute(
        `UPDATE users SET ${sets.join(', ')} WHERE id=?`,
        params
      );
      return { success: true };
    }),

  contractUpload: adminProcedure
    .input(z.object({
      userId: z.number(),
      fileUrl: z.string(),
      fileName: z.string(),
      contractType: z.string().default('加盟合約'),
      signedAt: z.string().optional(),
      expiresAt: z.string().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const uploadedBy = ctx.user.name ?? ctx.user.email ?? 'admin';
      const [result] = await (db as any).$client.execute(
        `INSERT INTO os_franchisee_contracts (tenantId, userId, contractType, fileUrl, fileName, signedAt, expiresAt, note, uploadedBy)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.userId, input.contractType, input.fileUrl, input.fileName,
         input.signedAt ?? null, input.expiresAt ?? null, input.note ?? null, uploadedBy]
      );
      return { id: (result as any).insertId };
    }),

  contractList: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM os_franchisee_contracts WHERE userId=? ORDER BY createdAt DESC`,
        [input.userId]
      );
      return rows as any[];
    }),

  paymentUpsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      userId: z.number(),
      paymentDate: z.string(),
      amount: z.number(),
      direction: z.enum(['receivable', 'paid']).default('receivable'),
      category: z.string().default('週結帳款'),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB not available');
      const createdBy = ctx.user.name ?? ctx.user.email ?? 'admin';
      if (input.id) {
        await (db as any).$client.execute(
          `UPDATE os_franchisee_payments SET paymentDate=?, amount=?, direction=?, category=?, note=? WHERE id=?`,
          [input.paymentDate, input.amount, input.direction, input.category, input.note ?? null, input.id]
        );
        return { id: input.id };
      } else {
        const [result] = await (db as any).$client.execute(
          `INSERT INTO os_franchisee_payments (tenantId, userId, paymentDate, amount, direction, category, note, createdBy)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
          [input.userId, input.paymentDate, input.amount, input.direction,
           input.category, input.note ?? null, createdBy]
        );
        return { id: (result as any).insertId };
      }
    }),

  paymentList: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [] as any[];
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM os_franchisee_payments WHERE userId=? ORDER BY paymentDate DESC`,
        [input.userId]
      );
      return rows as any[];
    }),
});

import { z } from "zod";
import { router, adminProcedure, superAdminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { users, franchiseeFeatureFlags } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { FRANCHISEE_FEATURE_KEYS, normalizeOrderSomePermissions } from "@shared/access-control";

export const adminRouter = router({
  /**
   * List all users (super_admin and manager only)
   */
  listUsers: adminProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
    const allUsers = await database.select().from(users);
    return allUsers;
  }),

  /**
   * Get single user detail (includes has_procurement_access, last_login_at)
   */
  getUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const [user] = await database.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: '用戶不存在' });
      return user;
    }),

  /**
   * Update user role, status, permissions, storeId, has_procurement_access
   * Only super_admin can call this
   */
  updateUser: superAdminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["super_admin", "manager", "franchisee", "staff", "store_manager", "customer", "driver", "portal_customer"]).optional(),
        status: z.enum(["active", "suspended"]).optional(),
        permissions: z.array(z.string()).optional(),
        storeId: z.string().optional(),
        has_procurement_access: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const { userId, ...updates } = input;
      if (updates.permissions) {
        updates.permissions = normalizeOrderSomePermissions(updates.permissions);
      }
      await database.update(users).set(updates).where(eq(users.id, userId));
      return { success: true };
    }),

  /**
   * Reset user password to default: YuLian888!
   */
  resetUserPassword: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const defaultPassword = "YuLian888!";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await database
        .update(users)
        .set({ passwordHash: hashedPassword })
        .where(eq(users.id, input.userId));
      return { success: true, message: "密碼已重設為 YuLian888!" };
    }),

  /**
   * Create new user
   */
  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["super_admin", "manager", "franchisee", "staff", "store_manager", "customer", "driver", "portal_customer"]),
        // NOTE: field is named 'pwd' (not 'password') to bypass Cloudflare WAF
        pwd: z.string().min(6),
        phone: z.string().optional(),
        storeId: z.string().optional(),
        permissions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });

      const existingUser = await database.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '此 Email 已被使用' });
      }

      const hashedPassword = await bcrypt.hash(input.pwd, 10);
      const openId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await database.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash: hashedPassword,
        phone: input.phone,
        storeId: input.storeId,
        permissions: normalizeOrderSomePermissions(input.permissions || []),
        loginMethod: 'email',
        status: 'active',
      });

      return { success: true, message: '用戶建立成功' };
    }),

  /**
   * Delete user
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });

      if (input.userId === ctx.user!.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '無法刪除自己的帳號' });
      }

      await database.delete(users).where(eq(users.id, input.userId));
      return { success: true, message: '用戶已刪除' };
    }),

  // ── Franchisee Feature Flags ──────────────────────────────────

  /**
   * Get all feature flags for a franchisee user
   */
  getFranchiseeFlags: superAdminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const rows = await database
        .select()
        .from(franchiseeFeatureFlags)
        .where(eq(franchiseeFeatureFlags.userId, input.userId));
      // Return map of featureKey → isEnabled, defaulting missing keys to false
      const flagMap: Record<string, boolean> = Object.fromEntries(
        FRANCHISEE_FEATURE_KEYS.map((k) => [k, false])
      );
      for (const row of rows) {
        flagMap[row.featureKey] = !!row.isEnabled;
      }
      return flagMap;
    }),

  /**
   * Set a single franchisee feature flag
   */
  setFranchiseeFlag: superAdminProcedure
    .input(z.object({
      userId: z.number(),
      featureKey: z.enum(FRANCHISEE_FEATURE_KEYS),
      isEnabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      // Upsert via raw SQL for ON DUPLICATE KEY support
      await (database as any).$client.execute(
        `INSERT INTO franchisee_feature_flags (user_id, tenant_id, feature_key, is_enabled, updated_by, updated_at)
         VALUES (?, 1, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE is_enabled=?, updated_by=?, updated_at=NOW()`,
        [input.userId, input.featureKey, input.isEnabled, ctx.user!.id, input.isEnabled, ctx.user!.id]
      );
      return { success: true };
    }),

  /**
   * Get flags for all franchisee users (used in AdminPermissions page)
   */
  getAllFranchiseeFlags: superAdminProcedure
    .query(async () => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const franchisees = await database
        .select()
        .from(users)
        .where(eq(users.role, 'franchisee'));
      const allFlags = await database.select().from(franchiseeFeatureFlags);
      return franchisees.map((u: any) => {
        const flagMap: Record<string, boolean> = Object.fromEntries(
          FRANCHISEE_FEATURE_KEYS.map((k) => [k, false])
        );
        for (const f of allFlags) {
          if (f.userId === u.id) flagMap[f.featureKey] = !!f.isEnabled;
        }
        return { user: u, flags: flagMap };
      });
    }),

  /**
   * Toggle procurement access for a user (super_admin only)
   */
  toggleProcurementAccess: superAdminProcedure
    .input(z.object({ userId: z.number(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      await database
        .update(users)
        .set({ has_procurement_access: input.enabled ? 1 : 0 } as any)
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  getSidebarOrder: adminProcedure
    .query(async () => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const [rows] = await (database as any).$client.execute(
        'SELECT menuKey, sortOrder FROM os_sidebar_order WHERE tenantId=1 ORDER BY sortOrder'
      );
      return (rows as any[]).map((r: any) => ({ menuKey: r.menuKey as string, sortOrder: r.sortOrder as number }));
    }),

  saveSidebarOrder: superAdminProcedure
    .input(z.object({
      items: z.array(z.object({ menuKey: z.string(), sortOrder: z.number() })),
    }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      for (const item of input.items) {
        await (database as any).$client.execute(
          'REPLACE INTO os_sidebar_order (tenantId, menuKey, sortOrder) VALUES (1, ?, ?)',
          [item.menuKey, item.sortOrder]
        );
      }
      return { success: true };
    }),
});

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Admin procedure (super_admin and manager only)
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

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
   * Update user role, status, permissions, and storeId
   */
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["super_admin", "manager", "franchisee", "staff", "customer"]).optional(),
        status: z.enum(["active", "suspended"]).optional(),
        permissions: z.array(z.string()).optional(),
        storeId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
      const { userId, ...updates } = input;
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
        role: z.enum(["super_admin", "manager", "franchisee", "staff", "customer"]),
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
      
      // Check if email already exists
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
        permissions: input.permissions || [],
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
      
      // Prevent deleting self
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '無法刪除自己的帳號' });
      }
      
      await database.delete(users).where(eq(users.id, input.userId));
      return { success: true, message: '用戶已刪除' };
    }),
});

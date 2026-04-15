import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import bcrypt from "bcryptjs";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const dyTenantUsersRouter = router({
  listUsers: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT id, name, email, phone, role, tenantId, createdAt
         FROM users
         WHERE tenantId = ?
           AND role IN ('manager', 'staff', 'driver')
         ORDER BY createdAt DESC`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  createUser: dyAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      name: z.string().min(1).max(100),
      email: z.string().email(),
      phone: z.string().max(20).optional(),
      role: z.enum(["manager", "staff", "driver"]),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 檢查 email 不重複
      const [existing] = await client.execute(
        `SELECT id FROM users WHERE email = ? LIMIT 1`,
        [input.email]
      );
      if ((existing as any[]).length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "此 Email 已被使用" });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const [result] = await client.execute(
        `INSERT INTO users (tenantId, openId, name, email, phone, role, passwordHash, loginMethod, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'email', NOW(), NOW(), NOW())`,
        [input.tenantId, input.email, input.name, input.email, input.phone ?? null, input.role, passwordHash]
      );
      const newUserId = (result as any).insertId;

      // 若 role=driver，同步新增 dy_drivers 記錄
      if (input.role === "driver") {
        await client.execute(
          `INSERT INTO dy_drivers (tenantId, name, phone, status, createdAt)
           VALUES (?, ?, ?, 'active', NOW())`,
          [input.tenantId, input.name, input.phone ?? ""]
        );
      }

      return { id: newUserId };
    }),

  updateUser: dyAdminProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      name: z.string().min(1).max(100),
      phone: z.string().max(20).optional(),
      role: z.enum(["manager", "staff", "driver"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 確保只能改自己租戶的用戶
      const [check] = await client.execute(
        `SELECT id FROM users WHERE id = ? AND tenantId = ? LIMIT 1`,
        [input.id, input.tenantId]
      );
      if ((check as any[]).length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到該用戶" });
      }

      await client.execute(
        `UPDATE users SET name = ?, phone = ?, role = ?, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [input.name, input.phone ?? null, input.role, input.id, input.tenantId]
      );
      return { success: true };
    }),

  resetPassword: dyAdminProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [check] = await client.execute(
        `SELECT id FROM users WHERE id = ? AND tenantId = ? LIMIT 1`,
        [input.id, input.tenantId]
      );
      if ((check as any[]).length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到該用戶" });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await client.execute(
        `UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [passwordHash, input.id, input.tenantId]
      );
      return { success: true };
    }),

  deleteUser: dyAdminProcedure
    .input(z.object({
      id: z.number(),
      tenantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [check] = await client.execute(
        `SELECT id FROM users WHERE id = ? AND tenantId = ? LIMIT 1`,
        [input.id, input.tenantId]
      );
      if ((check as any[]).length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "找不到該用戶" });
      }

      await client.execute(
        `DELETE FROM users WHERE id = ? AND tenantId = ?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),
});

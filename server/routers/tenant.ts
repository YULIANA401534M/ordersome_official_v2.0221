import { z } from "zod";
import { router, superAdminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const tenantRouter = router({
  /**
   * List all tenants (super_admin only)
   */
  list: superAdminProcedure.query(async () => {
    return await db.getAllTenants();
  }),

  /**
   * Get tenant by ID
   */
  getById: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const tenant = await db.getTenantById(input.id);
      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "租戶不存在" });
      }
      return tenant;
    }),

  /**
   * Create a new tenant
   */
  create: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(1, "名稱不可為空"),
        slug: z.string().min(1, "代碼不可為空").regex(/^[a-z0-9-]+$/, "代碼只能包含小寫字母、數字和連字號"),
        plan: z.enum(["trial", "basic", "pro"]).default("trial"),
      })
    )
    .mutation(async ({ input }) => {
      // Check slug uniqueness
      const existing = await db.getTenantBySlug(input.slug);
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "此代碼已被使用" });
      }
      await db.createTenant(input);
      return { success: true, message: "租戶建立成功" };
    }),

  /**
   * Update tenant
   */
  update: superAdminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
        plan: z.enum(["trial", "basic", "pro"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      // If changing slug, check uniqueness
      if (data.slug) {
        const existing = await db.getTenantBySlug(data.slug);
        if (existing && existing.id !== id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "此代碼已被使用" });
        }
      }
      await db.updateTenant(id, data);
      return { success: true, message: "租戶更新成功" };
    }),
});

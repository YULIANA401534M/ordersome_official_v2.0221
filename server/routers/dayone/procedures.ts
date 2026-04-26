import { TRPCError } from "@trpc/server";
import { TENANTS, canAccessTenant, hasAnyRole, isAdminUser, isSuperAdminUser } from "@shared/access-control";
import { protectedProcedure } from "../../_core/trpc";

function requireDayoneTenant(user: Parameters<typeof canAccessTenant>[0], rawInput?: unknown) {
  if (!canAccessTenant(user, TENANTS.DAYONE)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "沒有權限存取大永租戶" });
  }

  const inputTenantId =
    rawInput && typeof rawInput === "object" && !Array.isArray(rawInput)
      ? (rawInput as { tenantId?: unknown }).tenantId
      : undefined;
  if (inputTenantId != null && Number(inputTenantId) !== TENANTS.DAYONE) {
    throw new TRPCError({ code: "FORBIDDEN", message: "大永 API 僅允許 tenantId=90004" });
  }
}

export const dayoneAdminProcedure = protectedProcedure.use((opts) => {
  const { ctx, next } = opts;
  if (!isAdminUser(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要大永管理員權限" });
  }
  requireDayoneTenant(ctx.user, (opts as any).rawInput);
  return next({ ctx });
});

export const dayoneSuperAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isSuperAdminUser(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要超級管理員權限" });
  }
  return next({ ctx });
});

export const dayoneDriverProcedure = protectedProcedure.use((opts) => {
  const { ctx, next } = opts;
  if (!hasAnyRole(ctx.user, ["super_admin", "manager", "driver"])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要大永司機或管理員權限" });
  }
  requireDayoneTenant(ctx.user, (opts as any).rawInput);
  return next({ ctx });
});

export const dayonePortalCustomerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.user as typeof ctx.user & { dyCustomerId?: number | null };
  if (user?.tenantId !== TENANTS.DAYONE || user.dyCustomerId == null) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要大永客戶帳號" });
  }
  return next({ ctx });
});

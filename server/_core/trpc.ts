import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";

// NOTE: superjson transformer intentionally removed.
// Cloudflare WAF blocks POST requests whose body contains a top-level "json" key
// (the superjson wire format: {"json":{...},"meta":{...}}).
// Without the transformer, tRPC uses standard JSON which passes through Cloudflare.
// Date fields are transmitted as ISO strings and parsed with `new Date(str)` on the client.
const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: '僅 super_admin 可執行此操作' });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * franchiseeOrAdminProcedure: 允許 super_admin / manager / franchisee
 * 供加盟主可查看（但受資料過濾）的 procedure 使用
 */
export const franchiseeOrAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const allowed = ['super_admin', 'manager', 'franchisee'];
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * tenantProcedure: 繼承 protectedProcedure，確保 ctx 中有 tenantId
 * 供需要資料隔離的 router 使用
 */
export const tenantProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    // tenantId 已在 createContext 中解析，這裡確保它存在
    if (!ctx.tenantId || ctx.tenantId < 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tenant context" });
    }
    return next({ ctx });
  }),
);

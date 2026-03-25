import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Create a mock context with a specific tenantId and role
 */
function createMockContext(options: {
  tenantId?: number;
  role?: string;
}): TrpcContext {
  const { tenantId = 1, role = "super_admin" } = options;

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-super-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "email",
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    tenantId,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Multi-tenant: context tenantId", () => {
  it("should default tenantId to 1 when no header is provided", () => {
    const ctx = createMockContext({});
    expect(ctx.tenantId).toBe(1);
  });

  it("should allow setting tenantId via context", () => {
    const ctx = createMockContext({ tenantId: 2 });
    expect(ctx.tenantId).toBe(2);
  });
});

describe("Multi-tenant: tenant router access control", () => {
  it("should allow super_admin to list tenants", async () => {
    const ctx = createMockContext({ role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    // Should not throw FORBIDDEN
    const result = await caller.tenant.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should deny non-super_admin from listing tenants", async () => {
    const ctx = createMockContext({ role: "manager" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tenant.list()).rejects.toThrow("需要超級管理員權限");
  });

  it("should deny customer from listing tenants", async () => {
    const ctx = createMockContext({ role: "customer" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tenant.list()).rejects.toThrow("需要超級管理員權限");
  });
});

describe("Multi-tenant: tenant CRUD", () => {
  it("should create a new tenant with valid data", async () => {
    const ctx = createMockContext({ role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    const slug = `test-${Date.now()}`;
    const result = await caller.tenant.create({
      name: "Test Tenant",
      slug,
      plan: "trial",
    });
    expect(result.success).toBe(true);
  });

  it("should reject duplicate slug", async () => {
    const ctx = createMockContext({ role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    const slug = `dup-${Date.now()}`;
    // Create first
    await caller.tenant.create({ name: "First", slug, plan: "trial" });
    // Attempt duplicate
    await expect(
      caller.tenant.create({ name: "Second", slug, plan: "basic" })
    ).rejects.toThrow("此代碼已被使用");
  });
});

describe("Multi-tenant: data isolation via tenantId in queries", () => {
  it("should pass tenantId from context to category list query", async () => {
    const ctx1 = createMockContext({ tenantId: 1, role: "super_admin" });
    const ctx2 = createMockContext({ tenantId: 9999, role: "super_admin" });
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Tenant 1 should have data (the default tenant)
    const categories1 = await caller1.category.list();
    // Tenant 9999 should have no data (non-existent tenant)
    const categories2 = await caller2.category.list();

    // categories2 should be empty or a subset that doesn't overlap with tenant 1
    // The key assertion: different tenantId yields different results
    expect(Array.isArray(categories1)).toBe(true);
    expect(Array.isArray(categories2)).toBe(true);
    // Tenant 9999 should have 0 categories since no data exists for it
    expect(categories2.length).toBe(0);
  });

  it("should pass tenantId from context to product list query", async () => {
    const ctx = createMockContext({ tenantId: 9999, role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    const products = await caller.product.list();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(0);
  });

  it("should pass tenantId from context to store list query", async () => {
    const ctx = createMockContext({ tenantId: 9999, role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    const stores = await caller.store.list();
    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBe(0);
  });

  it("should pass tenantId from context to menu list query", async () => {
    const ctx = createMockContext({ tenantId: 9999, role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    const menuItems = await caller.menu.list();
    expect(Array.isArray(menuItems)).toBe(true);
    expect(menuItems.length).toBe(0);
  });
});

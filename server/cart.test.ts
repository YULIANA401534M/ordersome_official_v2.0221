import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getCartItems: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      productId: 1,
      quantity: 2,
      product: {
        id: 1,
        name: "台韓辣椒醬（單瓶）",
        price: "239",
        imageUrl: "/products/chili-sauce-1.jpg",
      },
    },
  ]),
  addToCart: vi.fn().mockResolvedValue({ id: 1, userId: 1, productId: 1, quantity: 1 }),
  updateCartItemQuantity: vi.fn().mockResolvedValue({ id: 1, quantity: 3 }),
  removeCartItem: vi.fn().mockResolvedValue(true),
  clearCart: vi.fn().mockResolvedValue(true),
  getActiveProducts: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "台韓辣椒醬（單瓶）",
      slug: "korean-chili-sauce-single",
      price: "239",
      isActive: true,
    },
    {
      id: 2,
      name: "台韓辣椒醬（兩入組）",
      slug: "korean-chili-sauce-double",
      price: "398",
      isActive: true,
    },
  ]),
  getActiveCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "辣椒醬系列", slug: "chili-sauce", isActive: true },
  ]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("cart procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists cart items for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.list();

    expect(result).toHaveLength(1);
    expect(result[0].product.name).toBe("台韓辣椒醬（單瓶）");
    expect(result[0].quantity).toBe(2);
  });

  it("adds item to cart for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.add({ productId: 1, quantity: 1 });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("productId", 1);
  });

  it("updates cart item quantity", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.updateQuantity({ id: 1, quantity: 3 });

    expect(result).toHaveProperty("quantity", 3);
  });

  it("removes item from cart", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.remove({ id: 1 });

    expect(result).toBe(true);
  });

  it("clears cart for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.clear();

    expect(result).toBe(true);
  });
});

describe("product procedures", () => {
  it("lists active products for public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.product.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("台韓辣椒醬（單瓶）");
    expect(result[0].price).toBe("239");
  });

  it("lists active categories for public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.category.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("辣椒醬系列");
  });
});

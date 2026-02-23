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
  getStoreSettings: vi.fn().mockResolvedValue({
    baseShippingFee: 100,
    freeShippingThreshold: 1000,
  }),
  createOrder: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "ORD20260108001",
    userId: 1,
    status: "pending",
    paymentStatus: "pending",
    subtotal: "478.00",
    shippingFee: "100.00",
    total: "578.00",
  }),
  createOrderItems: vi.fn().mockResolvedValue(true),
  clearCart: vi.fn().mockResolvedValue(true),
  getOrdersByUser: vi.fn().mockResolvedValue([
    {
      id: 1,
      orderNumber: "ORD20260108001",
      status: "pending",
      total: "578.00",
      createdAt: new Date(),
    },
  ]),
  getOrderById: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "ORD20260108001",
    userId: 1,
    status: "pending",
    total: "578.00",
  }),
  getOrderItems: vi.fn().mockResolvedValue([
    {
      id: 1,
      orderId: 1,
      productId: 1,
      productName: "台韓辣椒醬（單瓶）",
      price: "239",
      quantity: 2,
      subtotal: "478.00",
    },
  ]),
  getOrderByNumber: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "ORD20260108001",
    status: "pending",
    total: "578.00",
  }),
  updateOrderStatus: vi.fn().mockResolvedValue({ id: 1, status: "paid" }),
  getAllOrders: vi.fn().mockResolvedValue([
    {
      id: 1,
      orderNumber: "ORD20260108001",
      status: "pending",
      total: "578.00",
    },
  ]),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(): TrpcContext {
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

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "super_admin",
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

describe("order procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates order for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.create({
      recipientName: "張三",
      recipientPhone: "0912345678",
      recipientEmail: "test@example.com",
      shippingAddress: "台北市中正區忠孝東路一段1號",
      paymentMethod: "credit_card",
      invoiceType: "personal",
      items: [
        {
          id: 1,
          name: "台韓辣椒醬（單瓶）",
          price: 239,
          imageUrl: "/products/chili-sauce-1.jpg",
          quantity: 2,
        },
      ],
    });

    expect(result).toHaveProperty("orderNumber");
    expect(result.status).toBe("pending");
  });

  it("lists orders for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.list();

    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe("ORD20260108001");
  });

  it("gets order by id for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.getById({ id: 1 });

    expect(result).toHaveProperty("orderNumber", "ORD20260108001");
    expect(result?.items).toHaveLength(1);
  });

  it("admin can update order status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.updateStatus({ id: 1, status: "paid" });

    expect(result).toHaveProperty("status", "paid");
  });

  it("admin can list all orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.listAll();

    expect(result).toHaveLength(1);
  });
});

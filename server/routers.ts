import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { createPaymentOrder, parsePaymentResult, verifyCheckMacValue } from "./ecpay";
import { adminRouter } from "./routers/admin";
import { contentRouter } from "./routers/content";
import { storageRouter } from "./routers/storage";
import { sopRouter } from "./routers/sop";

// Admin procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

// Franchisee procedure (franchisee or admin)
const franchiseeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'franchisee' && ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要加盟主或管理員權限' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Email/Password login for franchisees and admins
    loginWithPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmailWithPassword(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '電子郵件或密碼錯誤' });
        }
        
        // Verify password
        const { verifyPassword } = await import('./lib/password');
        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '電子郵件或密碼錯誤' });
        }
        
        // Update last signed in
        await db.updateUserLastSignedIn(user.id);
        
        // Create session token (JWT) using the same mechanism as OAuth
        const { sdk } = await import('./_core/sdk');
        const sessionToken = await sdk.createSessionToken(user.openId, {
          expiresInMs: 30 * 24 * 60 * 60 * 1000, // 30 days
          name: user.name || user.email || '',
        });
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        shippingAddress: z.string().optional(),
        avatarUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    // Password reset flow
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmailWithPassword(input.email);
        if (!user || !user.passwordHash) {
          // Don't reveal if email exists for security
          return { success: true, message: "如果該電子郵件存在，我們已發送重設密碼連結" };
        }

        // Generate reset token (valid for 1 hour)
        const { v4: uuidv4 } = await import('uuid');
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.setPasswordResetToken(input.email, token, expiresAt);

        // TODO: Send email with reset link
        // For now, log the reset link
        const resetLink = `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
        console.log(`[Password Reset] Reset link for ${input.email}: ${resetLink}`);

        return { success: true, message: "如果該電子郵件存在，我們已發送重設密碼連結", resetLink };
      }),

    verifyResetToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const user = await db.getUserByResetToken(input.token);
        if (!user || !user.passwordResetExpires) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '無效的重設連結' });
        }

        if (new Date() > user.passwordResetExpires) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '重設連結已過期' });
        }

        return { valid: true, email: user.email };
      }),

    resetPassword: publicProcedure
      .input(z.object({ 
        token: z.string(),
        newPassword: z.string().min(6, "密碼至少需要 6 個字元")
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByResetToken(input.token);
        if (!user || !user.passwordResetExpires) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '無效的重設連結' });
        }

        if (new Date() > user.passwordResetExpires) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '重設連結已過期' });
        }

        // Hash new password
        const { hashPassword } = await import('./lib/password');
        const newPasswordHash = await hashPassword(input.newPassword);

        // Update password and clear reset token
        await db.resetUserPassword(user.id, newPasswordHash);

        return { success: true, message: "密碼已成功重設，請使用新密碼登入" };
      }),
  }),

  // Categories
  category: router({
    list: publicProcedure.query(() => db.getActiveCategories()),
    listAll: adminProcedure.query(() => db.getAllCategories()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getCategoryBySlug(input.slug)),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => db.createCategory(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateCategory(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteCategory(input.id)),
  }),

  // Products
  product: router({
    list: publicProcedure.query(() => db.getActiveProducts()),
    listAll: adminProcedure.query(() => db.getAllProducts()),
    featured: publicProcedure.query(() => db.getFeaturedProducts()),
    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(({ input }) => db.getProductsByCategory(input.categoryId)),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getProductBySlug(input.slug)),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getProductById(input.id)),
    create: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        price: z.string(),
        originalPrice: z.string().optional(),
        imageUrl: z.string().optional(),
        images: z.string().optional(),
        specifications: z.string().optional(),
        stock: z.number().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => db.createProduct(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        originalPrice: z.string().optional(),
        imageUrl: z.string().optional(),
        images: z.string().optional(),
        specifications: z.string().optional(),
        stock: z.number().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateProduct(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteProduct(input.id)),
  }),

  // Cart
  cart: router({
    list: protectedProcedure.query(({ ctx }) => db.getCartItems(ctx.user.id)),
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().optional().default(1),
      }))
      .mutation(({ ctx, input }) => db.addToCart(ctx.user.id, input.productId, input.quantity)),
    updateQuantity: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number(),
      }))
      .mutation(({ input }) => db.updateCartItemQuantity(input.id, input.quantity)),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.removeCartItem(input.id)),
    clear: protectedProcedure.mutation(({ ctx }) => db.clearCart(ctx.user.id)),
  }),

  // Orders
  order: router({
    list: protectedProcedure.query(({ ctx }) => db.getOrdersByUser(ctx.user.id)),
    listAll: adminProcedure.query(() => db.getAllOrders()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) return null;
        // Only allow user to view their own orders or admin
        if (order.userId !== ctx.user.id && ctx.user.role !== 'super_admin' && ctx.user.role !== 'manager') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),
    getByNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) return null;
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
    create: protectedProcedure
      .input(z.object({
        recipientName: z.string(),
        recipientPhone: z.string(),
        recipientEmail: z.string().optional(),
        shippingAddress: z.string(),
        note: z.string().optional(),
        paymentMethod: z.string(),
        items: z.array(z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          imageUrl: z.string().nullable().optional(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Use cart items from frontend
        const cartItems = input.items;
        if (cartItems.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '購物車是空的' });
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
        const shippingFee = subtotal >= 1000 ? 0 : 100; // Free shipping over 1000
        const total = subtotal + shippingFee;

        // Create order
        const order = await db.createOrder({
          userId: ctx.user.id,
          status: 'pending',
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          subtotal: subtotal.toFixed(2),
          shippingFee: shippingFee.toFixed(2),
          total: total.toFixed(2),
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          recipientEmail: input.recipientEmail,
          shippingAddress: input.shippingAddress,
          note: input.note,
        });

        if (!order) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '建立訂單失敗' });
        }

        // Create order items
        const orderItemsData = cartItems.map(item => ({
          orderId: order.id,
          productId: item.id,
          productName: item.name,
          productImage: item.imageUrl,
          price: item.price.toFixed(2),
          quantity: item.quantity,
          subtotal: (item.price * item.quantity).toFixed(2),
        }));
        await db.createOrderItems(orderItemsData);

        // Notify owner
        await notifyOwner({
          title: `新訂單通知 - ${order.orderNumber}`,
          content: `收到新訂單！\n訂單編號：${order.orderNumber}\n收件人：${input.recipientName}\n金額：NT$ ${total}\n付款方式：${input.paymentMethod}`,
        });

        return order;
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
      }))
      .mutation(({ input }) => db.updateOrderStatus(input.id, input.status)),
  }),

  // Stores
  store: router({
    list: publicProcedure.query(() => db.getActiveStores()),
    listAll: adminProcedure.query(() => db.getAllStores()),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        address: z.string(),
        phone: z.string().optional(),
        openingHours: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => db.createStore(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        openingHours: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateStore(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteStore(input.id)),
  }),

  // News
  news: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(({ input }) => db.getPublishedNews(input?.category)),
    listAll: adminProcedure.query(() => db.getAllNews()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getNewsBySlug(input.slug)),
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        category: z.enum(['brand', 'corporate', 'promotion', 'event']).optional(),
        isPublished: z.boolean().optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(({ input }) => db.createNews(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        category: z.enum(['brand', 'corporate', 'promotion', 'event']).optional(),
        isPublished: z.boolean().optional(),
        publishedAt: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateNews(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteNews(input.id)),
  }),

  // Menu Items
  menu: router({
    list: publicProcedure.query(() => db.getAvailableMenuItems()),
    listAll: adminProcedure.query(() => db.getAllMenuItems()),
    create: adminProcedure
      .input(z.object({
        categoryName: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string().optional(),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => db.createMenuItem(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        categoryName: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateMenuItem(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMenuItem(input.id)),
  }),

  // Payment
  payment: router({
    createPayment: protectedProcedure
      .input(z.object({ orderId: z.number(), testAmount: z.number().optional() }))
      .mutation(async ({ input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        const items = await db.getOrderItems(input.orderId);
        const itemName = items.map(i => `${i.productName} x${i.quantity}`).join('#');
        
        const baseUrl = process.env.VITE_APP_URL || 'https://example.com';
        // testAmount: 強制覆蓋金額（用於 1 元 E2E 測試）
        const totalAmount = input.testAmount ?? Math.round(parseFloat(order.total));
        const paymentData = createPaymentOrder({
          orderNumber: order.orderNumber,
          totalAmount,
          itemName: input.testAmount ? `[測試] ${itemName}` : itemName,
          tradeDesc: input.testAmount ? '[E2E測試] 宇聯國際線上商城訂單' : '宇聯國際線上商城訂單',
          returnUrl: `${baseUrl}/api/payment/callback`,
          clientBackUrl: `${baseUrl}/member/orders`,
          orderResultUrl: `${baseUrl}/shop/order-complete/${order.orderNumber}`,
        });
        
        return paymentData;
      }),
    getPaymentForm: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        const items = await db.getOrderItems(order.id);
        const itemName = items.map(i => `${i.productName} x${i.quantity}`).join('#');
        
        const baseUrl = process.env.VITE_APP_URL || 'https://example.com';
        const paymentData = createPaymentOrder({
          orderNumber: order.orderNumber,
          totalAmount: Math.round(parseFloat(order.total)),
          itemName,
          tradeDesc: '宇聯國際線上商城訂單',
          returnUrl: `${baseUrl}/api/payment/callback`,
          clientBackUrl: `${baseUrl}/member/orders`,
          orderResultUrl: `${baseUrl}/shop/order-complete/${order.orderNumber}`,
        });
        
        return paymentData;
      }),
  }),

  // Contact
  contact: router({
    submit: publicProcedure
      .input(z.object({
        source: z.enum(['brand', 'corporate', 'franchise']),
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createContactSubmission(input);
        // Notify owner
        await notifyOwner({
          title: `新聯絡表單 - ${input.source === 'franchise' ? '加盟諮詢' : '客戶詢問'}`,
          content: `來源：${input.source}\n姓名：${input.name}\n信箱：${input.email}\n電話：${input.phone || '未提供'}\n主旨：${input.subject || '無'}\n內容：${input.message}`,
        });
        return { success: true };
      }),
    list: adminProcedure.query(() => db.getAllContactSubmissions()),
    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.markContactAsRead(input.id)),
  }),

  // Franchisee Dashboard
  franchise: router({
    // Get franchisee dashboard data
    dashboard: franchiseeProcedure.query(async ({ ctx }) => {
      // TODO: Implement franchisee-specific dashboard data
      return {
        user: ctx.user,
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
        },
      };
    }),
    // Submit franchise inquiry
    submitInquiry: publicProcedure
      .input(z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        location: z.string().optional(),
        budget: z.string().optional(),
        experience: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createFranchiseInquiry(input);
        // Notify owner
        await notifyOwner({
          title: `新加盟諮詢 - ${input.name}`,
          content: `姓名：${input.name}\n電話：${input.phone}\nEmail：${input.email}\n預計地點：${input.location || '未提供'}\n預算範圍：${input.budget || '未提供'}\n餐飲經驗：${input.experience || '未提供'}\n其他訊息：${input.message || '無'}`,
        });
        return { success: true };
      }),
    // List all franchise inquiries (admin only)
    listInquiries: adminProcedure.query(async () => {
      return await db.getAllFranchiseInquiries();
    }),
    // Update inquiry status (admin only)
    updateInquiryStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "contacted", "meeting_scheduled", "completed", "cancelled"]) }))
      .mutation(async ({ input }) => {
        return await db.updateFranchiseInquiryStatus(input.id, input.status);
      }),

    // Update inquiry notes (admin only)
    updateInquiryNotes: adminProcedure
      .input(z.object({ id: z.number(), notes: z.string() }))
      .mutation(async ({ input }) => {
        return await db.updateFranchiseInquiryNotes(input.id, input.notes);
      }),
  }),
  // Admin Dashboard
  admin: adminRouter,
  // Content Management System
  content: contentRouter,
  storage: storageRouter,
  // SOP 知識庫系統
  sop: sopRouter,
});

export type AppRouter = typeof appRouter;
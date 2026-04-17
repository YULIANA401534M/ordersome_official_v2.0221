import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  categories, InsertCategory,
  products, InsertProduct,
  cartItems, InsertCartItem,
  orders, InsertOrder,
  orderItems, InsertOrderItem,
  stores, InsertStore,
  news, InsertNews,
  menuItems, InsertMenuItem,
  contactSubmissions, InsertContactSubmission,
  franchiseInquiries, InsertFranchiseInquiry,
  storeSettings, StoreSettings,
  tenants, InsertTenant,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const { createPool } = await import('mysql2/promise');
      const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
      const pool = createPool({
        host: url.hostname,
        port: Number(url.port) || 4000,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ''),
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 10,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
// 注意：upsertUser 和 getUserByXxx 不加 tenantId 過濾（登入流程全系統共用）
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "address"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmailWithPassword(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by email (for RBAC-safe OAuth account linking)
 * Returns user without requiring password - used for OAuth provider binding
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Link a third-party OAuth provider ID to an existing user account.
 * RBAC SAFETY: Only updates lineId/googleId and lastSignedIn.
 * NEVER modifies role, status, or permissions.
 */
export async function linkOAuthProvider(
  userId: number,
  provider: 'line' | 'google',
  providerId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { lastSignedIn: new Date() };
  if (provider === 'line') updateData.lineId = providerId;
  if (provider === 'google') updateData.googleId = providerId;
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { 
  name?: string; 
  fullName?: string;
  email?: string;
  phone?: string; 
  address?: string;
  shippingAddress?: string;
  avatarUrl?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

/** 修改已登入用戶的密碼（需先驗證舊密碼） */
export async function updateUserPassword(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, userId));
}

// ============ CATEGORY FUNCTIONS ============
export async function getAllCategories(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.tenantId, tenantId)).orderBy(categories.sortOrder);
}

export async function getActiveCategories(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(and(eq(categories.isActive, true), eq(categories.tenantId, tenantId))).orderBy(categories.sortOrder);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ============ PRODUCT FUNCTIONS ============
export async function getAllProducts(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.tenantId, tenantId)).orderBy(products.sortOrder);
}

export async function getActiveProducts(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isActive, true), eq(products.isHidden, false), eq(products.tenantId, tenantId))).orderBy(products.sortOrder);
}

export async function getFeaturedProducts(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isActive, true), eq(products.isFeatured, true), eq(products.isHidden, false), eq(products.tenantId, tenantId))).orderBy(products.sortOrder);
}

export async function getProductsByCategory(categoryId: number, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.categoryId, categoryId), eq(products.isActive, true), eq(products.isHidden, false), eq(products.tenantId, tenantId))).orderBy(products.sortOrder);
}

export async function getProductBySlug(slug: string, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.tenantId, tenantId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number, tenantId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  // tenantId is optional here for backward compatibility (e.g. cart lookups)
  const conditions = tenantId
    ? and(eq(products.id, id), eq(products.tenantId, tenantId))
    : eq(products.id, id);
  const result = await db.select().from(products).where(conditions).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

// B2B 封閉式賣場：依專屬網址後綴查詢單一商品
export async function getProductByExclusiveSlug(exclusiveSlug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products)
    .where(eq(products.exclusiveSlug, exclusiveSlug))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

// ============ CART FUNCTIONS ============
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  
  // Get product details for each cart item
  const result = [];
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (product) {
      result.push({
        ...item,
        product
      });
    }
  }
  return result;
}

export async function addToCart(userId: number, productId: number, quantity: number = 1) {
  const db = await getDb();
  if (!db) return;
  
  // Check if item already exists
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(cartItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function updateCartItemQuantity(id: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
  }
}

export async function removeCartItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.id, id));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ============ ORDER FUNCTIONS ============
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${year}${month}${day}${random}`;
}

export async function createOrder(data: Omit<InsertOrder, 'orderNumber'>) {
  const db = await getDb();
  if (!db) return undefined;
  
  const orderNumber = generateOrderNumber();
  await db.insert(orders).values({ ...data, orderNumber });
  
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) return;
  await db.insert(orderItems).values(items);
}

export async function getOrdersByUser(userId: number, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.tenantId, tenantId))).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number, tenantId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = tenantId
    ? and(eq(orders.id, id), eq(orders.tenantId, tenantId))
    : eq(orders.id, id);
  const result = await db.select().from(orders).where(conditions).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.tenantId, tenantId)).orderBy(desc(orders.createdAt));
}

export async function deleteOrder(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return;
  // Delete order items first to avoid FK constraint issues
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
}

export async function updateOrderStatus(id: number, status: InsertOrder['status']) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === 'shipped') updateData.shippedAt = new Date();
  if (status === 'delivered') updateData.deliveredAt = new Date();
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function updateOrderShippingProof(id: number, shippingProofUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ shippingProofUrl } as any).where(eq(orders.id, id));
}

export async function updateOrderPayment(orderNumber: string, paymentStatus: InsertOrder['paymentStatus'], ecpayTradeNo?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { paymentStatus };
  if (paymentStatus === 'paid') {
    updateData.paidAt = new Date();
    updateData.status = 'paid';
  }
  if (ecpayTradeNo) updateData.ecpayTradeNo = ecpayTradeNo;
  await db.update(orders).set(updateData).where(eq(orders.orderNumber, orderNumber));
}

// ============ STORE FUNCTIONS ============
export async function getAllStores(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores).where(eq(stores.tenantId, tenantId)).orderBy(stores.sortOrder);
}

export async function getActiveStores(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores).where(and(eq(stores.isActive, true), eq(stores.tenantId, tenantId))).orderBy(stores.sortOrder);
}

export async function createStore(data: InsertStore) {
  const db = await getDb();
  if (!db) return;
  await db.insert(stores).values(data);
}

export async function updateStore(id: number, data: Partial<InsertStore>) {
  const db = await getDb();
  if (!db) return;
  await db.update(stores).set(data).where(eq(stores.id, id));
}

export async function deleteStore(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(stores).where(eq(stores.id, id));
}

// ============ NEWS FUNCTIONS ============
export async function getAllNews(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).where(eq(news.tenantId, tenantId)).orderBy(desc(news.createdAt));
}

export async function getPublishedNews(category?: string, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(news)
      .where(and(eq(news.isPublished, true), eq(news.category, category as any), eq(news.tenantId, tenantId)))
      .orderBy(desc(news.publishedAt));
  }
  return db.select().from(news).where(and(eq(news.isPublished, true), eq(news.tenantId, tenantId))).orderBy(desc(news.publishedAt));
}

export async function getNewsBySlug(slug: string, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(and(eq(news.slug, slug), eq(news.tenantId, tenantId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createNews(data: InsertNews) {
  const db = await getDb();
  if (!db) return;
  await db.insert(news).values(data);
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) return;
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(news).where(eq(news.id, id));
}

// ============ MENU FUNCTIONS ============
export async function getAllMenuItems(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId)).orderBy(menuItems.sortOrder);
}

export async function getAvailableMenuItems(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(and(eq(menuItems.isAvailable, true), eq(menuItems.tenantId, tenantId))).orderBy(menuItems.sortOrder);
}

export async function createMenuItem(data: InsertMenuItem) {
  const db = await getDb();
  if (!db) return;
  await db.insert(menuItems).values(data);
}

export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(menuItems).set(data).where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ============ CONTACT FUNCTIONS ============
export async function createContactSubmission(data: InsertContactSubmission) {
  const db = await getDb();
  if (!db) return;
  await db.insert(contactSubmissions).values(data);
}

export async function getAllContactSubmissions(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactSubmissions).where(eq(contactSubmissions.tenantId, tenantId)).orderBy(desc(contactSubmissions.createdAt));
}

export async function markContactAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(contactSubmissions).set({ isRead: true }).where(eq(contactSubmissions.id, id));
}

// ============ PASSWORD RESET FUNCTIONS ============
export async function setPasswordResetToken(email: string, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ 
      passwordResetToken: token,
      passwordResetExpires: expiresAt
    })
    .where(eq(users.email, email));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function resetUserPassword(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users)
    .set({ 
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    })
    .where(eq(users.id, userId));
}

// ===== Franchise Inquiries =====

export async function createFranchiseInquiry(data: {
  name: string;
  phone: string;
  email?: string;
  location?: string;
  budget?: string;
  experience?: string;
  message?: string;
  tenantId?: number;
}) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const result = await db.insert(franchiseInquiries).values({
    ...data,
    tenantId: data.tenantId ?? 1,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
  return result;
}

export async function getAllFranchiseInquiries(tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(franchiseInquiries).where(eq(franchiseInquiries.tenantId, tenantId)).orderBy(desc(franchiseInquiries.createdAt));
}

export async function updateFranchiseInquiryStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(franchiseInquiries)
    .set({ status: status as any })
    .where(eq(franchiseInquiries.id, id));
}

// ============ STORE SETTINGS FUNCTIONS ============
export async function getStoreSettings(tenantId: number = 1): Promise<StoreSettings> {
  const db = await getDb();
  const defaultSettings: StoreSettings = { id: 1, tenantId, baseShippingFee: 100, freeShippingThreshold: 1000, updatedAt: new Date() };
  if (!db) return defaultSettings;
  const rows = await db.select().from(storeSettings).where(and(eq(storeSettings.id, 1), eq(storeSettings.tenantId, tenantId))).limit(1);
  return rows.length > 0 ? rows[0] : defaultSettings;
}
export async function updateStoreSettings(data: { baseShippingFee?: number; freeShippingThreshold?: number }, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return;
  await db.update(storeSettings).set(data).where(and(eq(storeSettings.id, 1), eq(storeSettings.tenantId, tenantId)));
}

export async function updateFranchiseInquiryNotes(id: number, notes: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(franchiseInquiries)
    .set({ notes, updatedAt: new Date() })
    .where(eq(franchiseInquiries.id, id));
}

// ============ TENANT FUNCTIONS ============
export async function getAllTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenants).orderBy(tenants.id);
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTenantBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) return;

  // 建立租戶
  await db.insert(tenants).values(data);

  // 取得剛建立的租戶 ID
  const [result] = await (db as any).$client.execute(
    `SELECT id FROM tenants WHERE slug = ? LIMIT 1`,
    [data.slug]
  );
  const newTenantId = (result as any[])[0]?.id;
  if (!newTenantId) return;

  // 根據方案自動分配基礎模組（全部預設關閉，由 super_admin 手動開啟）
  await (db as any).$client.execute(
    `INSERT INTO tenant_modules (tenantId, moduleKey, isEnabled, createdAt, updatedAt)
     SELECT ?, moduleKey, 0, NOW(), NOW()
     FROM module_definitions`,
    [newTenantId]
  );
}

export async function updateTenant(id: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tenants).set(data).where(eq(tenants.id, id));
}

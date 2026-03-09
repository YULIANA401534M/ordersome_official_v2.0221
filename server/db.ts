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
  storeSettings, StoreSettings
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
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
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getActiveCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
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
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.sortOrder);
}

export async function getActiveProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true)).orderBy(products.sortOrder);
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isActive, true), eq(products.isFeatured, true))).orderBy(products.sortOrder);
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.categoryId, categoryId), eq(products.isActive, true))).orderBy(products.sortOrder);
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
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

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
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

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: InsertOrder['status']) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === 'shipped') updateData.shippedAt = new Date();
  if (status === 'delivered') updateData.deliveredAt = new Date();
  await db.update(orders).set(updateData).where(eq(orders.id, id));
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
export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores).orderBy(stores.sortOrder);
}

export async function getActiveStores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stores).where(eq(stores.isActive, true)).orderBy(stores.sortOrder);
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
export async function getAllNews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).orderBy(desc(news.createdAt));
}

export async function getPublishedNews(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(news)
      .where(and(eq(news.isPublished, true), eq(news.category, category as any)))
      .orderBy(desc(news.publishedAt));
  }
  return db.select().from(news).where(eq(news.isPublished, true)).orderBy(desc(news.publishedAt));
}

export async function getNewsBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
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
export async function getAllMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).orderBy(menuItems.sortOrder);
}

export async function getAvailableMenuItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.isAvailable, true)).orderBy(menuItems.sortOrder);
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

export async function getAllContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
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
}) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const result = await db.insert(franchiseInquiries).values({
    ...data,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
  return result;
}

export async function getAllFranchiseInquiries() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(franchiseInquiries).orderBy(desc(franchiseInquiries.createdAt));
}

export async function updateFranchiseInquiryStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(franchiseInquiries)
    .set({ status: status as any })
    .where(eq(franchiseInquiries.id, id));
}

// ============ STORE SETTINGS FUNCTIONS ============
export async function getStoreSettings(): Promise<StoreSettings> {
  const db = await getDb();
  const defaultSettings: StoreSettings = { id: 1, baseShippingFee: 100, freeShippingThreshold: 1000, updatedAt: new Date() };
  if (!db) return defaultSettings;
  const rows = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  return rows.length > 0 ? rows[0] : defaultSettings;
}
export async function updateStoreSettings(data: { baseShippingFee?: number; freeShippingThreshold?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(storeSettings).set(data).where(eq(storeSettings.id, 1));
}

export async function updateFranchiseInquiryNotes(id: number, notes: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(franchiseInquiries)
    .set({ notes, updatedAt: new Date() })
    .where(eq(franchiseInquiries.id, id));
}

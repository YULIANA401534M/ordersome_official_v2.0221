import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // Role-based access control: 5 roles (super_admin, manager, franchisee, staff, customer)
  role: mysqlEnum("role", ["super_admin", "manager", "franchisee", "staff", "customer"]).default("customer").notNull(),
  // Additional profile fields
  fullName: text("fullName"),
  shippingAddress: text("shippingAddress"),
  avatarUrl: text("avatarUrl"),
  // Third-party OAuth provider IDs for account linking (RBAC-safe binding, never overwrites role)
  lineId: varchar("lineId", { length: 128 }),
  googleId: varchar("googleId", { length: 128 }),

  // Password hash for email/password authentication (franchisee & admin only)
  passwordHash: varchar("passwordHash", { length: 255 }),
  // Password reset token and expiry
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  
  // Customer specific fields (Marketing)
  birthday: date("birthday"),
  gender: varchar("gender", { length: 20 }),
  accumulatedSpending: decimal("accumulatedSpending", { precision: 10, scale: 2 }).default("0.00"),
  
  // Staff/Franchisee specific fields (Operations)
  storeId: varchar("storeId", { length: 50 }),
  internalContact: varchar("internalContact", { length: 100 }),
  department: varchar("department", { length: 100 }),
  
  // Account status
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  // Fine-grained permissions (JSON array of permission strings)
  permissions: json("permissions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Product categories
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  images: text("images"), // JSON array of image URLs
  specifications: text("specifications"), // JSON object for specs
  specDetails: text("specDetails"), // Markdown for spec details tab
  shippingDetails: text("shippingDetails"), // Markdown for shipping details tab
  stock: int("stock").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Shopping cart items
 */
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingFee: decimal("shippingFee", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  recipientName: varchar("recipientName", { length: 100 }).notNull(),
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  shippingAddress: text("shippingAddress").notNull(),
  note: text("note"),
  paidAt: timestamp("paidAt"),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  ecpayTradeNo: varchar("ecpayTradeNo", { length: 50 }),
  invoiceType: mysqlEnum("invoiceType", ["personal", "company"]).default("personal").notNull(),
  companyTaxId: varchar("companyTaxId", { length: 8 }),
  companyName: varchar("companyName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items
 */
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 200 }).notNull(),
  productImage: text("productImage"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Store locations
 */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }),
  openingHours: text("openingHours"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * News articles
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  imageUrl: text("imageUrl"),
  category: mysqlEnum("category", ["brand", "corporate", "promotion", "event"]).default("brand").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * Menu items for brand website
 */
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryName: varchar("categoryName", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Contact form submissions
 */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  source: mysqlEnum("source", ["brand", "corporate", "franchise"]).default("brand").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Posts table for blog/news content management system
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  // Publish targets: JSON array of ['corporate', 'brand'] - supports multiple targets
  publishTargets: json("publishTargets").$type<string[]>().default(["brand"]).notNull(),
  authorId: int("authorId").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Franchise inquiries table
 */
export const franchiseInquiries = mysqlTable("franchise_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  location: varchar("location", { length: 200 }),
  budget: varchar("budget", { length: 100 }),
  experience: text("experience"),
  message: text("message"),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "contacted", "meeting_scheduled", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FranchiseInquiry = typeof franchiseInquiries.$inferSelect;
export type InsertFranchiseInquiry = typeof franchiseInquiries.$inferInsert;

// ===== SOP 知識庫系統 =====

/** SOP 分類表 */
export const sopCategories = mysqlTable("sop_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  displayOrder: int("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SopCategory = typeof sopCategories.$inferSelect;

/** SOP 文件表 */
export const sopDocuments = mysqlTable("sop_documents", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  pdfUrl: text("pdf_url"),
  version: varchar("version", { length: 20 }).default("1.0"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  isVisibleToStaff: boolean("is_visible_to_staff").default(true).notNull(),
  authorId: int("author_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SopDocument = typeof sopDocuments.$inferSelect;

/** SOP 閱讀簽收表 */
export const sopReadReceipts = mysqlTable("sop_read_receipts", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("document_id").notNull(),
  userId: int("user_id").notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
  acknowledged: boolean("acknowledged").default(false),
});
export type SopReadReceipt = typeof sopReadReceipts.$inferSelect;

/** 設備報修表 */
export const equipmentRepairs = mysqlTable("equipment_repairs", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("store_id").notNull(),
  equipmentName: varchar("equipment_name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).default("其他").notNull(),
  issueDescription: text("issue_description").notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  imageUrl: text("image_url"),
  reportedBy: int("reported_by").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "resolved", "cancelled"]).default("pending").notNull(),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type EquipmentRepair = typeof equipmentRepairs.$inferSelect;

/** 每日檢查表 */
export const dailyChecklists = mysqlTable("daily_checklists", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("store_id").notNull(),
  checklistType: mysqlEnum("checklist_type", ["opening", "closing"]).notNull(),
  checkedBy: int("checked_by").notNull(),
  checkDate: date("check_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type DailyChecklist = typeof dailyChecklists.$inferSelect;

/** 每日檢查項目表 */
export const dailyChecklistItems = mysqlTable("daily_checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklist_id").notNull(),
  itemName: varchar("item_name", { length: 100 }).notNull(),
  isChecked: boolean("is_checked").default(false).notNull(),
  notes: text("notes"),
});
export type DailyChecklistItem = typeof dailyChecklistItems.$inferSelect;

/** SOP 權限關聯表：控制特定角色或特定用戶可見哪些 SOP 分類與文件 */
export const sopPermissions = mysqlTable("sop_permissions", {
  id: int("id").autoincrement().primaryKey(),
  /** 目標類型：role（角色）或 user（特定用戶） */
  targetType: mysqlEnum("target_type", ["role", "user"]).notNull(),
  /** 角色名稱（當 targetType = 'role' 時使用）*/
  targetRole: varchar("target_role", { length: 50 }),
  /** 用戶 ID（當 targetType = 'user' 時使用）*/
  targetUserId: int("target_user_id"),
  /** 授權範圍：category（分類）或 document（文件）*/
  scopeType: mysqlEnum("scope_type", ["category", "document"]).notNull(),
  /** 分類 ID（當 scopeType = 'category' 時使用）*/
  categoryId: int("category_id"),
  /** 文件 ID（當 scopeType = 'document' 時使用）*/
  documentId: int("document_id"),
  /** 是否授予存取權限（true = 允許，false = 拒絕）*/
  isGranted: boolean("is_granted").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SopPermission = typeof sopPermissions.$inferSelect;
export type InsertSopPermission = typeof sopPermissions.$inferInsert;

/**
 * Store global settings (singleton row, id=1)
 */
export const storeSettings = mysqlTable("store_settings", {
  id: int("id").autoincrement().primaryKey(),
  baseShippingFee: int("baseShippingFee").default(100).notNull(),
  freeShippingThreshold: int("freeShippingThreshold").default(1000).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = typeof storeSettings.$inferInsert;

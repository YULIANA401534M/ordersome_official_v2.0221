# CLAUDE_REFERENCE.md — OrderSome 完整技術參考

> 這份文件是「查閱用」，不是每次都要讀。
> 開新對話時只需讀 `CLAUDE.md`，有需要才查這裡。
> 最後更新：2026-04-13

---

## R1、技術棧

| 層次 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 路由 | Wouter 3 |
| 狀態管理 | TanStack Query v5 + Zustand 5 |
| UI 組件 | shadcn/ui（Radix UI） + Tailwind CSS 4 |
| 動畫 | Framer Motion 12 |
| 後端框架 | Express 4 |
| API 層 | tRPC 11（type-safe RPC） |
| ORM | Drizzle ORM（MySQL 方言） |
| 資料庫 | TiDB Cloud（MySQL 相容） |
| 圖片儲存 | Cloudflare R2（S3-compatible） |
| 金流 | 綠界（ECPay） |
| 認證 | Google OAuth + LINE OAuth + Email/Password |
| 打包 | Vite 7（前端）+ esbuild（後端） |
| 套件管理 | pnpm 10 |
| 測試 | Vitest |
| 富文本 | Tiptap 3 |
| 表單 | React Hook Form + Zod |
| 圖表 | Recharts |
| 自動化 | Make（Webhook/Scenario） |

---

## R2、目錄結構

```
ordersome_official_v2/
├── client/src/
│   ├── App.tsx                  # 主路由
│   ├── pages/                   # 所有頁面組件
│   ├── components/              # 共用組件
│   ├── hooks/                   # 自訂 hooks
│   ├── stores/cartStore.ts      # Zustand 購物車
│   └── lib/trpc.ts              # tRPC 客戶端
│
├── server/
│   ├── routers.ts               # 主 appRouter
│   ├── db.ts                    # 資料庫查詢助手（mysql2 + SSL）
│   ├── storage.ts               # R2 上傳（r2Put / r2Get）
│   ├── ecpay.ts                 # 綠界金流
│   ├── routers/
│   │   ├── admin.ts / content.ts / storage.ts / sop.ts / tenant.ts
│   │   └── dayone/              # 大永 ERP（11 個子路由）
│   └── _core/                   # ⚠️ 核心框架，勿隨意修改
│       ├── env.ts / context.ts / trpc.ts / oauth.ts / index.ts
│
├── drizzle/
│   ├── schema.ts                # 所有表定義
│   └── 0000_*.sql ~ 0020_*.sql  # migration 文件
│
└── shared/
    ├── const.ts / types.ts / _core/errors.ts
```

---

## R3、前端路由（完整清單）

### 品牌官網（來點什麼）
| 路徑 | 組件 |
|------|------|
| `/brand` | `BrandHome` |
| `/brand/story` | `BrandStory` |
| `/brand/stores` | `BrandStores` |
| `/brand/menu` | `BrandMenu` |
| `/brand/news` | `BrandNews` |
| `/brand/contact` | `BrandContact` |
| `/brand/franchise` | `BrandFranchise` |

### 集團官網（宇聯國際）
| 路徑 | 組件 |
|------|------|
| `/corporate` | `CorporateHome` |
| `/corporate/about` | `CorporateAbout` |
| `/corporate/brands` | `CorporateBrands` |
| `/corporate/culture` | `CorporateCulture` |
| `/corporate/news` | `CorporateNews` |
| `/corporate/news/:slug` | `CorporateNewsArticle` |
| `/corporate/franchise` | `CorporateFranchise` |
| `/corporate/contact` | `CorporateContact` |

### 電商購物
| 路徑 | 組件 |
|------|------|
| `/shop` | `ShopHome` |
| `/shop/category/:slug` | `ShopCategory` |
| `/shop/product/:id` | `ProductDetail` |
| `/shop/cart` | `Cart` |
| `/shop/checkout` | `Checkout` |
| `/shop/order/:id` | `OrderDetail` |
| `/shop/payment/:orderNumber` | `PaymentRedirect` |
| `/shop/order-complete/:orderNumber` | `OrderComplete` |
| `/shop/my-orders` | `MyOrders` |
| `/exclusive/:slug` | `ExclusiveProduct`（B2B 福委賣場） |

### 認證 & 會員
`/login` / `/forgot-password` / `/reset-password/:token` / `/profile` / `/member/profile` / `/member/orders`

### 後台管理
| 路徑 | 組件 |
|------|------|
| `/dashboard` | `Dashboard`（智慧入口） |
| `/dashboard/admin/ecommerce` | `AdminDashboard` |
| `/dashboard/admin/products` | `AdminProducts` |
| `/dashboard/admin/orders` | `AdminOrders` |
| `/dashboard/admin/categories` | `AdminCategories` |
| `/dashboard/admin/users` | `AdminUsers` |
| `/dashboard/admin/permissions` | `AdminPermissions` |
| `/dashboard/admin/tenants` | `AdminTenants` |
| `/dashboard/content` | `ContentManagement` |
| `/dashboard/content/new` | `ContentEditor` |
| `/dashboard/content/edit/:id` | `ContentEditor` |
| `/dashboard/franchise-inquiries` | `FranchiseInquiries` |
| `/dashboard/sop` | `SOPKnowledgeBase` |
| `/dashboard/repairs` | `EquipmentRepairs` |
| `/dashboard/checklist` | `DailyChecklist` |
| `/dashboard/ai-writer` | `AIWriter`（AI 文章助手） |

### 大永 ERP（管理端）
`/dayone` / `/dayone/orders` / `/dayone/customers` / `/dayone/drivers` / `/dayone/products` / `/dayone/inventory` / `/dayone/purchase` / `/dayone/districts` / `/dayone/reports` / `/dayone/suppliers` / `/dayone/liff-orders` / `/dayone/ar` / `/dayone/dispatch` / `/dayone/purchase-receipts`

### 大永客戶 Portal（公開，不包 DayoneLayout）
`/dayone/portal` → `DayonePortalHome`
`/dayone/portal/login` → `DayonePortalLogin`
`/dayone/portal/register` → `DayonePortalRegister`
`/dayone/portal/orders` → `DayonePortalOrders`
`/dayone/portal/statement` → `DayonePortalStatement`
`/dayone/portal/account` → `DayonePortalAccount`

### LIFF（LINE 前台）
`/liff/order?tenant=dayone`

### ⚠️ 司機 App（`/driver/`，不是 `/dayone/driver/`）
`/driver` / `/driver/today` / `/driver/orders` / `/driver/order/:id` / `/driver/pickup` / `/driver/done` / `/driver/worklog` / `/driver/profile`

### Super Admin
`/super-admin/tenants` / `/super-admin/modules`

---

## R4、資料庫 Tables

### Drizzle 管理的表（`drizzle/schema.ts`）

| 表名 | 用途 |
|------|------|
| `tenants` | 多租戶 |
| `users` | 用戶（super_admin / manager / franchisee / staff / customer / driver） |
| `categories` | 商品分類 |
| `products` | 商品（含 isHidden / exclusiveSlug） |
| `cart_items` | 購物車 |
| `orders` | 電商訂單（含 `shippingProofUrl` 出貨證明欄位） |
| `order_items` | 訂單明細 |
| `stores` | 門市 |
| `news` | 新聞 |
| `menu_items` | 菜單 |
| `contact_submissions` | 聯絡表單 |
| `posts` | CMS 文章（publishTargets JSON、scheduledAt、category） |
| `franchise_inquiries` | 加盟詢問 |
| `sop_categories` / `sop_documents` / `sop_read_receipts` / `sop_permissions` | SOP 系統 |
| `equipment_repairs` | 設備報修 |
| `daily_checklists` / `daily_checklist_items` | 每日檢查表 |
| `store_settings` | 門市設定（運費/免運門檻） |
| `tenant_modules` | 模組開關（Lego 架構） |
| `dy_work_logs` | 大永司機工作日誌 |
| `dy_districts` | 大永行政區（migration 0020） |

**posts 表新欄位：**
- `scheduledAt` timestamp — 排定發布時間，null = 無排程
- `category` varchar(50) — 文章分類（如：餐飲新聞、加盟快報）

### ⚠️ 大永 ERP raw SQL 表（不在 schema.ts）

操作方式：`(db as any).$client.execute(...)`

| 表名 | 重要欄位備註 |
|------|------|
| `dy_customers` | 待加 `lineUserId`（LIFF 用） |
| `dy_orders` | `totalAmount`（非 total）、`orderSource`、`customerId` NOT NULL |
| `dy_products` | `code` / `unit` / `price` |
| `dy_inventory` | `safetyQty` |
| `dy_drivers` / `dy_customer_prices` / `dy_purchase_orders` / `dy_purchase_order_items` / `dy_stock_movements` / `dy_suppliers` / `dy_delivery_signatures` | — |

---

## R5、tRPC API 路由（完整清單）

呼叫方式：`trpc.<router>.<procedure>.useQuery()` / `.useMutation()`

### auth
`me` / `logout` / `loginWithPassword`（密碼欄位 `pwd`）/ `updateProfile` / `requestPasswordReset` / `verifyResetToken` / `resetPassword`（密碼欄位 `newPwd`）/ `changePassword`

### 基礎 CRUD 路由
- `category`：`list` / `listAll` / `getBySlug` / `create` / `update` / `delete`
- `product`：`list` / `listAll` / `featured` / `byCategory` / `getBySlug` / `getById` / `getByExclusiveSlug` / `create` / `update` / `delete`
- `cart`：`list` / `add` / `updateQuantity` / `remove` / `clear`
- `order`：`list` / `listAll` / `getById` / `getByNumber` / `create` / `updateStatus` / `delete`（adminProcedure）
- `store` / `news` / `menu`：各有 `list` / `listAll` / `create` / `update` / `delete`

### content（CMS 文章）
`listPosts` / `getPostBySlug` / `getPostById` / `createPost` / `updatePost` / `deletePost` / `publishScheduled`

**`getPublishedPosts` 格式（已改為分頁）：**
```typescript
// input
{ publishTarget?: "brand"|"corporate", category?: string, page?: number, pageSize?: number }
// output — 注意：不再直接回傳陣列！
{ posts: Post[], total: number, page: number, pageSize: number, totalPages: number }
```
⚠️ 前端用 `data?.posts?.map()`，不是 `data?.map()`

### storage（圖片/PDF 上傳）
```typescript
trpc.storage.uploadImage.mutate({ fileName, fileData, contentType })
// → result.url: "https://pub-...r2.dev/posts/timestamp-random.jpg"
```
Procedures: `uploadImage` / `uploadPdf`

### sop
`getCategories` / `createCategory` / `updateCategory` / `getDocuments` / `getAllDocuments` / `getDocumentById` / `createDocument`（預設 status=published）/ `updateDocument` / `getSopPermissions` / `updateSopPermissions` / `getAccessibleCategories`

### aiWriter
`generateArticle`（Gemini 2.5 Flash + NewsAPI，後端：`server/routers/ai-writer.ts`）

### dayone（大永 ERP）
| Sub-router | Procedures |
|-----------|-----------|
| `dayone.customers` | `list` / `upsert` / `getCustomerPrices` / `setCustomerPrice` |
| `dayone.districts` | `list` / `upsert` / `delete` |
| `dayone.driver` | `getMyTodayOrders` / `updateOrderStatus` / `recordCashPayment` / `submitWorkLog` / `uploadSignature` / `getMyWorkLog` |
| `dayone.drivers` | `list` / `upsert` / `myOrders` |
| `dayone.inventory` | `list` / `adjust` / `setSafety` / `movements` |
| `dayone.orders` | `list` / `getWithItems` / `create` / `updateStatus` / `confirmDelivery` / `getLiffOrders` |
| `dayone.products` | `list` / `upsert` / `delete` |
| `dayone.purchase` | `list` / `create` / `receive` / `suppliers` / `upsertSupplier` |
| `dayone.reports` | `dailySummary` / `monthlyRevenue` / `topCustomers` / `inventoryAlerts` |
| `dayone.suppliers` | `list` / `upsert` / `toggleStatus` / `delete` |
| `dayone.ar` | `listReceivables` / `markPaid` / `addAdminNote` / `listDriverCashReports` / `createDriverCashReport` / `resolveAnomaly` / `monthlyStatement` |
| `dayone.ap` | `listPayables` / `markPaid` / `supplierPriceList` / `upsertSupplierPrice` |
| `dayone.purchaseReceipt` | `list` / `create` / `sign` / `detail` / `reportAnomaly` |
| `dayone.dispatch` | `generateDispatch` / `listDispatchOrders` / `getDispatchDetail` / `updateDispatchItem` / `completeDispatch` / `manualAddStop` / `updateDispatchStatus` |
| `dayone.portal` | `register` / `loginWithLine` / `me` / `myOrders` / `myReceivables` / `addCustomerNote` / `myStatement` / `myPrices` / `changePassword` / `bindLine` |

---

## R6、認證系統

### 用戶角色（6 種）
```
super_admin  — 超級管理員
manager      — 管理員（admin 功能）
franchisee   — 加盟商
staff        — 員工（SOP/reports）
customer     — 一般會員
driver       — 司機（大永）
```

### tRPC Procedure 類型
| 類型 | 限制 |
|------|------|
| `publicProcedure` | 無限制 |
| `protectedProcedure` | 需登入 |
| `adminProcedure` | 需 super_admin 或 manager |
| `franchiseeProcedure` | 需 franchisee / super_admin / manager |
| `dyAdminProcedure` | 需 super_admin 或 manager |
| `driverProcedure` | 需 driver / manager / super_admin |

---

## R7、公開 Webhook Endpoints

| Endpoint | 說明 |
|----------|------|
| `POST /api/payment/callback` | 綠界 ECPay 付款回調 |
| `POST /api/dayone/line-order` | 大永 LINE@ 接單（Make → 後端） |

**Make Scenario**：`Webhooks[1] → Filter(文字訊息) → Google Gemini AI[7] → HTTP[5](後端)`
Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`

---

## R8、圖片儲存路徑規則

| 類型 | R2 Key 格式 |
|------|------------|
| 商品/文章圖片 | `posts/{timestamp}-{random}.{ext}` |
| SOP PDF | `sop-pdfs/{timestamp}-{random}.pdf` |
| 司機簽名 | `signatures/{tenantId}/{orderId}-{timestamp}.png` |
| 本地靜態 | `client/public/images/menu/korean-roll/`（⚠️ 應遷移 R2） |

---

## R9、購物車 & 綠界金流

### 購物車（Zustand 5 + localStorage，不走 tRPC）
```typescript
useCartStore().addItem(item) / .removeItem(id) / .updateQuantity(id, qty) / .clearCart()
useCartStore().getTotalPrice() / .getTotalItems() / .getItemQuantity(id, specs)
```

### 綠界金流
- 測試環境（無 ECPAY env 時自動）：`https://payment-stage.ecpay.com.tw/...`
- 生產環境：需 `ECPAY_MERCHANT_ID && ECPAY_HASH_KEY && ECPAY_HASH_IV`

---

## R10、LIFF 客戶下單（已完成）

### 架構
```
客戶點 LINE 選單 → LIFF 網頁（/liff/order?tenant=dayone）→ lineUserId 識別身份
→ 選品下單 → 後端寫入 dy_orders（orderSource='liff'）→ 大永後台查看（/dayone/liff-orders）
```

### 多租戶擴充方式
- **後端** `server/liff.ts`：`TENANT_MAP` 加一行 `newslug: tenantId`
- **前端** `client/src/pages/liff/LiffOrder.tsx`：`TENANT_CONFIG` 加一行 `newslug: { liffId: "...", brandName: "..." }`

### LIFF ID
- 現用：`2009700774-rWyJ27md`（測試用，建立在 Leo 的 LINE 後台）
- ⚠️ 正式上線前：蛋博需用自己的 LINE 後台建立 LIFF，取得新 liffId，更新前端 `TENANT_CONFIG` 的 dayone.liffId

### URL 格式
```
/liff/order?tenant=dayone
```

### 相關檔案
| 檔案 | 說明 |
|------|------|
| `server/liff.ts` | LIFF tRPC router（getProducts / createOrder），多租戶 |
| `client/src/pages/liff/LiffOrder.tsx` | LIFF 下單頁面，讀 ?tenant= query string |
| `client/src/pages/dayone/DayoneLiffOrders.tsx` | 大永後台 LIFF 訂單查看頁 |
| `server/routers/dayone/orders.ts` | getLiffOrders procedure |

---

## R11、大永蛋品業務背景

- 聯絡人：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- 地址：台中市西屯區西林巷 63-18 號
- 業務：雞蛋批發配送，台中地區，約 28 個行政區，D1/D2 兩條配送路線
- tenantId = 90004
- 蛋品 SKU：白大箱、白小箱、白紙、液白、液紙、粉蛋、紅蛋、液體蛋、破蛋、洗選白帶裝、洗選白袋裝、洗選白盒裝、A液紙、鹹蛋、皮蛋、水皮蛋

### 分業客戶
- tenantId=1：宇聯國際（來點什麼，自用）
- tenantId=90004：大永蛋品（付費客戶，開發費 20-40 萬 + 月租 3,000-8,000）
- tenantId=3+：未來其他食品批發商

---

## R12、SEO 架構

| Hook | 用途 |
|------|------|
| `useCanonical()` | 動態 canonical URL |
| `useBreadcrumbList()` | BreadcrumbList Schema |
| `useArticleSchema()` | 文章頁 JSON-LD |
| `useProductSchema()` | 商品頁 JSON-LD |
| `useRestaurantSchema()` | 餐廳 JSON-LD |

---

*CLAUDE_REFERENCE.md — 查閱用，開新對話只讀 CLAUDE.md 即可*

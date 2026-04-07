# CLAUDE.md — OrderSome 專案完整說明

> 最後更新：2026-04-07 | 核對版本：commit c853002（本機尚有未 push 的 content/schema 修改）
> 適用對象：Claude Code、VS Code、任何接手的 AI 或開發者

---

## 一、專案總覽

**來點什麼（OrderSome）** 是宇聯國際餐飲集團的數位平台，整合以下子系統於單一 Monorepo：

| 子系統 | 說明 | 路由前綴 |
|--------|------|---------|
| 品牌官網 | 「來點什麼」韓式飯捲品牌展示 | `/brand/` |
| 集團官網 | 宇聯國際企業形象 | `/corporate/` |
| 電商購物 | 消費者購物、結帳（綠界金流） | `/shop/` |
| B2B 福委賣場 | 封閉式一頁式賣場（URL slug 存取） | `/exclusive/:slug` |
| 後台管理 | 多角色後台（admin/franchisee/staff） | `/dashboard/` |
| SOP 知識庫 | 門市作業標準、設備報修、每日檢查表 | `/dashboard/sop` 等 |
| 大永 ERP | 蛋品配送 B2B ERP（訂單/庫存/採購） | `/dayone/` |
| 司機 App | 配送員手機 App | `/driver/` |
| 會員中心 | 消費者個人資料、訂單查詢 | `/member/` |

**商業目標**：一套程式碼服務多個品牌、多個角色，透過 `tenantId` + 模組開關（Lego 架構）靈活擴充。

---

## 二、技術棧

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
| 密碼 | bcryptjs |
| 打包 | Vite 7（前端）+ esbuild（後端） |
| 套件管理 | pnpm 10 |
| 測試 | Vitest |
| 富文本 | Tiptap 3 |
| 表單 | React Hook Form + Zod |
| 圖表 | Recharts |
| 簽名 | react-signature-canvas |
| 自動化 | Make（Webhook/Scenario） |

---

## 三、部署資訊

### 3.1 生產環境（Railway）
```
服務名稱: ordersome_official_v2.0221
生產網址: https://ordersome.com.tw
自動部署: 推送到 GitHub main 分支後自動觸發（約 2-3 分鐘）
```

### 3.2 GitHub 推送指令
```bash
git push origin main
```

### 3.3 TiDB Cloud 資料庫
```
平台:   TiDB Cloud（MySQL 相容）
主機:   gateway01.ap-northeast-1.prod.aws.tidbcloud.com
埠:     4000
資料庫: ordersome
SSL:    rejectUnauthorized: true
注意:   TiDB 不支援 ADD COLUMN IF NOT EXISTS，需用 SHOW COLUMNS 確認再 ALTER
```

### 3.4 Cloudflare R2 圖片儲存
```
Bucket:        ordersome-b2b
公開 URL 前綴: https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev
```

### 3.5 Railway 完整環境變數
```
NODE_ENV=production
DATABASE_URL=（TiDB Cloud 連線字串）
JWT_SECRET=ordersome-yulian-secret-2026-xK9mP
VITE_APP_ID=ordersome
VITE_APP_URL=https://ordersome.com.tw
OAUTH_SERVER_URL=https://ordersome.com.tw
R2_ACCOUNT_ID=d4dbdd11c1db22961203972fd5c46b06
R2_ACCESS_KEY_ID=（R2 金鑰）
R2_SECRET_ACCESS_KEY=（R2 私鑰）
R2_BUCKET=ordersome-b2b
R2_PUBLIC_URL_PREFIX=https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev
GOOGLE_CLIENT_ID=（Google OAuth）
GOOGLE_CLIENT_SECRET=（Google OAuth）
LINE_CLIENT_ID=2009201434
LINE_CLIENT_SECRET=（LINE OAuth）
VITE_GOOGLE_MAPS_API_KEY=（Google Maps，直接引用，已移除 Forge Proxy）
GEMINI_API_KEY=（Google AI Studio，供後端 line-order endpoint 使用）
LINE_CHANNEL_ACCESS_TOKEN=（大永 LINE@ Messaging API Token，供後端直接回覆 LINE 用）
```

---

## 四、常用指令

```bash
pnpm dev              # 開發伺服器（port 3000）
pnpm build            # 生產構建（Vite + esbuild）
pnpm start            # 啟動生產伺服器
pnpm check            # TypeScript 型別檢查
pnpm test             # 執行所有測試
pnpm db:push          # 生成並執行 Drizzle migration
pnpm format           # Prettier 格式化
```

---

## 五、目錄結構

```
ordersome_official_v2/
├── client/
│   ├── index.html                   # HTML 入口（Google Fonts CDN）
│   ├── public/                      # 靜態資源（直接部署到 Railway）
│   │   ├── images/menu/korean-roll/ # ⚠️ 韓式飯捲菜單圖（在 Railway，非 R2）
│   │   ├── images/products/
│   │   ├── images/stores/
│   │   ├── logos/
│   │   └── og-image.jpg / sitemap.xml / robots.txt
│   └── src/
│       ├── App.tsx                  # 主路由（所有前端路由）
│       ├── main.tsx                 # React 啟動點
│       ├── index.css                # 全局樣式（Tailwind + CSS 變數）
│       ├── pages/                   # 所有頁面組件（見第六節）
│       ├── components/              # 共用組件（見第七節）
│       ├── contexts/ThemeContext.tsx
│       ├── hooks/                   # 自訂 hooks（SEO、組合輸入法等）
│       ├── stores/cartStore.ts      # Zustand 購物車（localStorage 持久化）
│       └── lib/
│           ├── trpc.ts              # tRPC 客戶端
│           └── utils.ts             # shadcn/ui cn() 工具
│
├── server/
│   ├── routers.ts                   # 主 appRouter（整合所有子路由）
│   ├── db.ts                        # 資料庫查詢助手（mysql2 + SSL 修正）
│   ├── storage.ts                   # ✅ R2 上傳（storagePut / storageGet）
│   ├── ecpay.ts                     # 綠界金流
│   ├── routers/
│   │   ├── admin.ts                 # 用戶管理
│   │   ├── content.ts               # 文章/內容管理 CMS
│   │   ├── storage.ts               # uploadImage / uploadPdf procedures
│   │   ├── sop.ts                   # SOP 知識庫
│   │   ├── tenant.ts                # 多租戶管理
│   │   └── dayone/                  # 大永 ERP（11 個子路由）
│   │       ├── index.ts
│   │       ├── customers.ts
│   │       ├── districts.ts
│   │       ├── driver.ts            # 司機個人端
│   │       ├── drivers.ts           # 司機管理端
│   │       ├── inventory.ts
│   │       ├── modules.ts
│   │       ├── orders.ts
│   │       ├── products.ts
│   │       ├── purchase.ts
│   │       ├── reports.ts
│   │       └── suppliers.ts
│   └── _core/                       # ⚠️ 核心框架，勿隨意修改
│       ├── env.ts                   # 所有環境變數（統一從這裡讀取）
│       ├── context.ts               # tRPC 上下文（認證）
│       ├── trpc.ts                  # tRPC 初始化（publicProcedure / protectedProcedure）
│       ├── oauth.ts                 # OAuth 認證邏輯
│       ├── notification.ts          # notifyOwner()
│       └── index.ts                 # Express 入口（含公開 Webhook endpoints）
│
├── drizzle/
│   ├── schema.ts                    # ✅ 所有 Drizzle 表定義（見第八節）
│   ├── relations.ts
│   └── 0000_*.sql ~ 0020_*.sql     # SQL 遷移文件
│
└── shared/
    ├── const.ts
    ├── types.ts
    └── _core/errors.ts
```

---

## 六、前端路由（完整清單）

### 6.1 品牌官網（來點什麼）
| 路徑 | 組件 |
|------|------|
| `/brand` | `BrandHome` |
| `/brand/story` | `BrandStory` |
| `/brand/stores` | `BrandStores` |
| `/brand/menu` | `BrandMenu` |
| `/brand/news` | `BrandNews` |
| `/brand/contact` | `BrandContact` |
| `/brand/franchise` | `BrandFranchise` |

### 6.2 集團官網（宇聯國際）
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

### 6.3 電商購物
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

### 6.4 認證 & 會員
| 路徑 | 組件 |
|------|------|
| `/login` | `Login` |
| `/forgot-password` | `ForgotPassword` |
| `/reset-password/:token` | `ResetPassword` |
| `/profile/complete` | `ProfileComplete` |
| `/complete-profile` | `CompleteProfile` |
| `/profile` | `Profile` |
| `/member/profile` | `MemberProfile` |
| `/member/orders` | `MemberOrders` |

### 6.5 後台管理
| 路徑 | 組件 | 備註 |
|------|------|------|
| `/dashboard` | `Dashboard` | 智慧入口，依角色跳轉 |
| `/dashboard/admin/ecommerce` | `AdminDashboard` | |
| `/dashboard/admin/products` | `AdminProducts` | 含圖片上傳 |
| `/dashboard/admin/orders` | `AdminOrders` | |
| `/dashboard/admin/categories` | `AdminCategories` | |
| `/dashboard/admin/users` | `AdminUsers` | |
| `/dashboard/admin/permissions` | `AdminPermissions` | |
| `/dashboard/admin/sop-permissions` | `AdminSopPermissions` | |
| `/dashboard/admin/tenants` | `AdminTenants` | |
| `/dashboard/content` | `ContentManagement` | |
| `/dashboard/content/new` | `ContentEditor` | |
| `/dashboard/content/edit/:id` | `ContentEditor` | |
| `/dashboard/franchise-inquiries` | `FranchiseInquiries` | |
| `/dashboard/franchise` | `FranchiseDashboardPage` | |
| `/dashboard/staff` | `StaffDashboardPage` | |
| `/dashboard/sop` | `SOPKnowledgeBase` | |
| `/dashboard/repairs` | `EquipmentRepairs` | |
| `/dashboard/checklist` | `DailyChecklist` | |

### 6.6 大永 ERP（管理端）
| 路徑 | 組件 |
|------|------|
| `/dayone` | `DayoneDashboard` |
| `/dayone/orders` | `DayoneOrders` |
| `/dayone/customers` | `DayoneCustomers` |
| `/dayone/drivers` | `DayoneDrivers` |
| `/dayone/products` | `DayoneProducts` |
| `/dayone/inventory` | `DayoneInventory` |
| `/dayone/purchase` | `DayonePurchase` |
| `/dayone/districts` | `DayoneDistricts` |
| `/dayone/reports` | `DayoneReports` |
| `/dayone/suppliers` | `SupplierList`（`pages/erp/dayone/`） |

### 6.7 ⚠️ 司機 App（`/driver/`，不是 `/dayone/driver/`）
| 路徑 | 組件 |
|------|------|
| `/driver` | `DriverHome` |
| `/driver/today` | `DriverToday` |
| `/driver/orders` | `DriverOrders` |
| `/driver/order/:id` | `DriverOrderDetail` |
| `/driver/pickup` | `DriverPickup` |
| `/driver/done` | `DriverDone` |
| `/driver/worklog` | `DriverWorkLog` |
| `/driver/profile` | `DriverProfile` |

### 6.8 Super Admin
| 路徑 | 組件 |
|------|------|
| `/super-admin/tenants` | `SuperAdminTenants` |
| `/super-admin/modules` | `SuperAdminModules` |

---

## 七、組件清單

### 業務組件（`client/src/components/`）
| 組件 | 用途 |
|------|------|
| `AIChatBox.tsx` | AI 聊天（串流 + Markdown） |
| `Map.tsx` | Google Maps |
| `RichTextEditor.tsx` | Tiptap 富文本編輯器 |
| `UserMenu.tsx` | 頭像、登出 |
| `ErrorBoundary.tsx` | React 錯誤邊界 |
| `MarketingTrap.tsx` | 行銷誘導 |
| `ModuleGuard.tsx` | 模組權限守衛 |
| `Analytics.tsx` | Google Analytics 4 |
| `CountUpNumber.tsx` | 數字動畫 |
| `LogoIntro.tsx` | Logo 動畫 |

### 佈局組件（`client/src/components/layout/`）
| 組件 | 用途 |
|------|------|
| `BrandLayout.tsx` + `BrandHeader.tsx` + `BrandFooter.tsx` | 品牌官網 |
| `CorporateLayout.tsx` + `CorporateHeader.tsx` + `CorporateFooter.tsx` | 集團官網 |
| `DashboardLayout.tsx` | 後台側邊欄 |

---

## 八、公開 Webhook Endpoints（server/_core/index.ts）

這些 endpoint 不走 tRPC，直接掛在 Express（無需登入）：

| Endpoint | 說明 |
|----------|------|
| `POST /api/payment/callback` | 綠界 ECPay 付款回調 |
| `POST /api/dayone/line-order` | 大永 LINE@ 接單 Webhook（Make → 後端） |

### POST /api/dayone/line-order 規格

**Request Body（Make 傳來）：**
```json
{
  "tenantId": 2,
  "lineUserId": "Uxxxx",
  "replyToken": "xxxxxx",
  "rawMessage": "鴻大客戶白大箱5箱 液白3箱 明天配",
  "parsedText": "Gemini 解析後的 JSON 字串（可能含 markdown 標記）"
}
```

**後端處理邏輯：**
1. 驗證 tenantId === 2
2. 清洗 parsedText（移除 ```json 標記，並 JSON.parse）
3. 用 customerName 查 dy_customers（模糊比對）
4. 用 productName 查 dy_products（取 id 和 price）
5. INSERT dy_orders（orderSource = 'line'）
6. INSERT dy_order_items
7. 直接呼叫 LINE Reply API 回覆客戶
8. 回傳 { success, orderNo, replyMessage }

**Make Scenario 結構（大永蛋品LINE接單）：**
```
Webhooks[1] → Filter(只處理文字訊息) → Google Gemini AI[7] → HTTP[5](後端)
```
- HTTP[6]（LINE Reply）已廢棄，後端直接呼叫 LINE API
- Make Webhook URL：https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu

---

## 九、資料庫 Tables（完整清單）

### 9.1 Drizzle 管理的表（`drizzle/schema.ts`）

| 表名 | 用途 |
|------|------|
| `tenants` | 多租戶 |
| `users` | 用戶（5 角色：super_admin / manager / franchisee / staff / customer） |
| `categories` | 商品分類 |
| `products` | 商品（含 isHidden / exclusiveSlug B2B 欄位） |
| `cart_items` | 購物車 |
| `orders` | 電商訂單 |
| `order_items` | 訂單明細 |
| `stores` | 門市 |
| `news` | 新聞 |
| `menu_items` | 菜單 |
| `contact_submissions` | 聯絡表單 |
| `posts` | CMS 文章（publishTargets JSON 陣列，新增 `scheduledAt` / `category` 欄位）<br>　└ `scheduledAt` timestamp — 排定發布時間，null = 無排程<br>　└ `category` varchar(50) — 文章分類（如：餐飲新聞、加盟快報） |
| `franchise_inquiries` | 加盟詢問 |
| `sop_categories` | SOP 分類 |
| `sop_documents` | SOP 文件 |
| `sop_read_receipts` | SOP 閱讀簽收 |
| `sop_permissions` | SOP 細粒度權限 |
| `equipment_repairs` | 設備報修 |
| `daily_checklists` | 每日檢查表 |
| `daily_checklist_items` | 每日檢查項目 |
| `store_settings` | 門市設定（運費/免運門檻） |
| `tenant_modules` | 模組開關（Lego 架構） |
| `dy_work_logs` | 大永司機工作日誌 |
| `dy_districts` | ✅ 大永行政區（已加入 schema，migration 0020） |

### 9.2 ⚠️ 大永 ERP 的 raw SQL 表（不在 schema.ts，直接在 TiDB）

這是已知技術債，目前以 raw SQL 操作：`(db as any).$client.execute(...)`

| 表名 | 用途 | 重要欄位備註 |
|------|------|------|
| `dy_customers` | 客戶 | 待加 `lineUserId` 欄位（LIFF 身份綁定用） |
| `dy_customer_prices` | 客戶特殊定價 | |
| `dy_drivers` | 司機 | 含 `userId` 連結 users 表 |
| `dy_orders` | 大永訂單 | `orderSource`（line/manual）、`totalAmount`（非 total）、`status` enum |
| `dy_order_items` | 訂單明細 | |
| `dy_products` | 商品 | 含 `code`/`unit`/`price` 欄位 |
| `dy_inventory` | 庫存 | 含 `safetyQty` |
| `dy_purchase_orders` | 採購單 | |
| `dy_purchase_order_items` | 採購明細 | |
| `dy_stock_movements` | 庫存異動記錄 | |
| `dy_suppliers` | 供應商 | |
| `dy_delivery_signatures` | 送貨簽名 | |

**⚠️ dy_orders 重要欄位名稱（踩過的坑）：**
- 金額欄位是 `totalAmount`，不是 `total`
- `orderSource` 欄位已有 ALTER TABLE 新增（DEFAULT 'general'）
- `customerId` 是 NOT NULL，找不到客戶時傳 0 不傳 null

---

## 十、tRPC API 路由（完整清單）

> 呼叫方式：`trpc.<router>.<procedure>.useQuery()` / `.useMutation()`

### auth（認證）
| Procedure | 類型 | 說明 |
|-----------|------|------|
| `auth.me` | public query | 取得目前用戶 |
| `auth.logout` | public mutation | 登出 |
| `auth.loginWithPassword` | public mutation | Email+密碼登入（欄位名 `pwd`，非 `password`，因 Cloudflare WAF） |
| `auth.updateProfile` | protected mutation | 更新個人資料 |
| `auth.requestPasswordReset` | public mutation | 申請密碼重設 |
| `auth.verifyResetToken` | public query | 驗證重設 token |
| `auth.resetPassword` | public mutation | 重設密碼（欄位名 `newPwd`） |
| `auth.changePassword` | protected mutation | 修改密碼 |

### category（商品分類）
`list` / `listAll` / `getBySlug` / `create` / `update` / `delete`

### product（商品）
`list` / `listAll` / `featured` / `byCategory` / `getBySlug` / `getById` / `getByExclusiveSlug` / `create` / `update` / `delete`

### cart（購物車）
`list` / `add` / `updateQuantity` / `remove` / `clear`

### order（電商訂單）
`list` / `listAll` / `getById` / `getByNumber` / `create` / `updateStatus` / `delete`（adminProcedure，先刪 order_items 再刪 orders）

### store（門市）
`list` / `listAll` / `create` / `update` / `delete`

### news（新聞）
`list` / `listAll` / `getBySlug` / `create` / `update` / `delete`

### menu（菜單）
`list` / `listAll` / `create` / `update` / `delete`

### payment（綠界金流）
`createPayment` / `getPaymentForm`

### contact（聯絡表單）
`submit` / `list` / `markRead`

### franchise（加盟）
`dashboard` / `submitInquiry` / `listInquiries` / `updateInquiryStatus` / `updateInquiryNotes`

### storeSettings（門市設定）
`get` / `update`（baseShippingFee 預設 100，freeShippingThreshold 預設 1000）

### admin（用戶管理）
`listUsers` / `updateUser` / `resetUserPassword` / `createUser` / `deleteUser`

### content（CMS 文章）
`listPosts` / `getPublishedPosts` / `getPostBySlug` / `getPostById` / `createPost` / `updatePost` / `deletePost` / `publishScheduled`

**getPublishedPosts 回傳格式（已改為分頁）：**
```typescript
// input
{ publishTarget?: "brand"|"corporate", category?: string, page?: number, pageSize?: number }
// output（注意：不再直接回傳陣列，改為物件）
{ posts: Post[], total: number, page: number, pageSize: number, totalPages: number }
```
⚠️ **前端呼叫 getPublishedPosts 的地方需更新**：BrandNews.tsx、CorporateNews.tsx 目前仍用舊格式（直接 `.map()`），新對話中需修改為 `.posts.map()`。

### storage（圖片/PDF 上傳）
```typescript
// 上傳圖片到 R2
const result = await trpc.storage.uploadImage.mutate({
  fileName: "product.jpg",
  fileData: "data:image/jpeg;base64,...",  // Base64
  contentType: "image/jpeg",
});
// result.url → "https://pub-...r2.dev/posts/timestamp-random.jpg"
```
Procedures: `uploadImage` / `uploadPdf`

### sop（SOP 知識庫）
`getCategories` / `createCategory` / `updateCategory` / `getDocuments` / `getAllDocuments` / `getDocumentById` / `createDocument` / `updateDocument` / `getSopPermissions` / `updateSopPermissions` / `getAccessibleCategories`

### tenant（多租戶）
`list` / `getById` / `create` / `update`

### dayone（大永 ERP）
| Sub-router | Procedures |
|-----------|-----------|
| `dayone.customers` | `list` / `upsert` / `getCustomerPrices` / `setCustomerPrice` |
| `dayone.districts` | `list` / `upsert` / `delete` |
| `dayone.driver` | `getMyTodayOrders` / `updateOrderStatus` / `recordCashPayment` / `submitWorkLog` / `uploadSignature` / `getMyWorkLog` |
| `dayone.drivers` | `list` / `upsert` / `myOrders` |
| `dayone.inventory` | `list` / `adjust` / `setSafety` / `movements` |
| `dayone.modules` | `list` / `toggle` / `allTenantModules` |
| `dayone.orders` | `list` / `getWithItems` / `create` / `updateStatus` / `confirmDelivery` |
| `dayone.products` | `list` / `upsert` / `delete` |
| `dayone.purchase` | `list` / `create` / `receive` / `suppliers` / `upsertSupplier` |
| `dayone.reports` | `dailySummary` / `monthlyRevenue` / `topCustomers` / `inventoryAlerts` |
| `dayone.suppliers` | `list` / `upsert` / `toggleStatus` / `delete` |

---

## 十一、認證系統

### 11.1 OAuth 流程
- Google OAuth（Client ID: `615601412173-...`）
- LINE OAuth（Client ID: `2009201434`）
- Email + 密碼（bcryptjs，僅 franchisee/admin 角色）

### 11.2 ⚠️ Cloudflare WAF 特殊命名
登入 mutation 的密碼欄位命名刻意避開保留字：
- 登入：`pwd`（非 `password`）
- 重設密碼：`newPwd`（非 `newPassword`）

### 11.3 用戶角色（6 種）
```
super_admin  — 超級管理員（可存取所有功能）
manager      — 管理員（可存取 admin 功能）
franchisee   — 加盟商（可存取 /dashboard/franchise）
staff        — 員工（可存取 SOP/reports/repairs/checklist）
customer     — 一般會員（預設，可購物）
driver       — 司機（大永）
```

### 11.4 tRPC 程序類型
| 類型 | 限制 |
|------|------|
| `publicProcedure` | 無限制 |
| `protectedProcedure` | 需登入 |
| `adminProcedure` | 需 super_admin 或 manager |
| `franchiseeProcedure` | 需 franchisee / super_admin / manager |
| `dyAdminProcedure` | 需 super_admin 或 manager |
| `driverProcedure` | 需 driver / manager / super_admin |

---

## 十二、購物車架構

購物車使用 **Zustand 5 + localStorage**（key: `"cart-storage"`），**不使用 tRPC**：

```typescript
// stores/cartStore.ts
useCartStore().addItem(item)               // 加入（自動合併相同規格）
useCartStore().removeItem(id)              // 移除
useCartStore().updateQuantity(id, qty)     // 更新數量（qty≤0 自動刪除）
useCartStore().clearCart()                 // 清空
useCartStore().getTotalPrice()             // 總金額
useCartStore().getTotalItems()             // 總件數
useCartStore().getItemQuantity(id, specs)  // 某商品目前數量
```

---

## 十三、綠界金流（ECPay）

- **測試環境**（無 ECPAY env 時自動啟用）：`https://payment-stage.ecpay.com.tw/...`
- **生產環境**（三個 env 都有才啟用）：`https://payment.ecpay.com.tw/...`
- 判斷條件：`ECPAY_MERCHANT_ID && ECPAY_HASH_KEY && ECPAY_HASH_IV`

```typescript
// server/ecpay.ts 主要函式
createPaymentOrder(params)        // 建立付款參數（含 CheckMacValue）
generatePaymentFormHtml(params)   // 產生自動提交 HTML 表單
parsePaymentResult(data)          // 解析回傳結果
verifyCheckMacValue(params, val)  // 驗證簽章
```

---

## 十四、圖片儲存路徑規則

| 類型 | R2 Key 格式 |
|------|------------|
| 商品/文章圖片 | `posts/{timestamp}-{random}.{ext}` |
| SOP PDF | `sop-pdfs/{timestamp}-{random}.pdf` |
| 司機簽名 | `signatures/{tenantId}/{orderId}-{timestamp}.png` |
| 本地靜態（Railway） | `client/public/images/menu/korean-roll/`（⚠️ 應遷移到 R2） |

---

## 十五、核心架構原則

### 15.1 Lego 模組架構
- 每個功能模組可透過 `tenant_modules` 表的 `moduleKey` 開關
- 前端 `ModuleGuard` 組件根據 `useModules()` hook 控制頁面存取
- 大永 ERP 的 `tenantId = 2`，官網是 `tenantId = 1`

### 15.2 tenantId 隔離
- **所有資料查詢必須帶 tenantId**（防止租戶資料互串）
- `ctx.tenantId` 由 tRPC context 自動注入
- 大永 ERP 的 queries 需手動傳入 `tenantId` 參數
- **絕對禁止 hardcode tenantId**（影響 SaaS 擴充）

### 15.3 shared/ 共用型別
```typescript
// shared/types.ts — 前後端共用型別從這裡 import
export type * from "../drizzle/schema";
export * from "./_core/errors";

// shared/const.ts
COOKIE_NAME = "app_session_id"
```

### 15.4 server/_core/ 目錄
**勿隨意修改**，除非擴展基礎設施：
- `env.ts` — 所有環境變數統一讀取
- `trpc.ts` — tRPC 初始化與 procedure 定義
- `context.ts` — 認證上下文
- `oauth.ts` — OAuth 邏輯
- `index.ts` — Express 入口（含 Vite 開發中間件）

---

## 十六、SEO 架構

每個頁面透過 hooks 動態注入 JSON-LD：

| Hook | 用途 |
|------|------|
| `useCanonical()` | 動態 canonical URL（全站啟用） |
| `useBreadcrumbList()` | BreadcrumbList Schema（全站） |
| `useArticleSchema()` | 文章頁 JSON-LD |
| `useProductSchema()` | 商品頁 JSON-LD |
| `useRestaurantSchema()` | 餐廳 JSON-LD |

---

## 十七、測試

```
server/admin.test.ts          — 用戶管理
server/auth.logout.test.ts    — 登出
server/auth.password.test.ts  — 密碼重設
server/cart.test.ts           — 購物車
server/content.test.ts        — 內容管理
server/oauth.rbac.test.ts     — OAuth 權限控制
server/order.test.ts          — 訂單
server/exclusive.test.ts      — 福委賣場
server/tenant.test.ts         — 多租戶
server/storage.r2.test.ts     — R2 圖片上傳

總計：10 個測試檔案，58 個測試，全部通過
```

---

## 十八、每次開發前必做的確認清單

- [ ] `git pull origin main` → 先拉最新程式碼
- [ ] `git status` → 確認工作目錄狀態
- [ ] 每次 commit 只用 `git add 指定檔案`，**絕不用 `git add -A`**
- [ ] 所有 DB 查詢帶 `tenantId`
- [ ] 圖片上傳走 `trpc.storage.uploadImage`
- [ ] R2 環境變數用 `R2_ACCESS_KEY_ID`（不是 `R2_ACCESS_KEY`）
- [ ] 密碼欄位：登入 `pwd`、重設 `newPwd`
- [ ] 司機路由是 `/driver/`，不是 `/dayone/driver/`
- [ ] **勿修改 `server/_core/`**（除非整體基礎設施）
- [ ] 大永 raw SQL 用 `(db as any).$client.execute(...)`
- [ ] Schema 變更後執行 `pnpm db:push`
- [ ] `pnpm run build` 零錯誤才能 push
- [ ] 兩台電腦（家裡/公司）開始前都要先 `git pull`
- [ ] 每次任務結束 Claude Code 執行 `/clear`

---

## 十九、已知問題與技術債

### ✅ 已修復
1. 大永 `dy_districts` 不在 schema → 已加入，migration: `0020_add_dy_districts.sql`
2. TiDB SSL 連線失敗 → `server/db.ts` 改用 `mysql2/promise` 手動解析 URL + SSL
3. Google Maps Forge Proxy 問題 → 改用 `VITE_GOOGLE_MAPS_API_KEY` 直接引用
4. LINE@ 接單 JSON 格式問題 → 改用 Data Structure 模式 + 後端清洗
5. `dy_orders` 缺少 `orderSource` 欄位 → 已 ALTER TABLE 新增
6. 大永訂單 `unitPrice` 型別錯誤 → `DayoneOrders.tsx` 加入 `Number()` 轉型
7. `@/components/ui/alert-dialog` 缺失 → 已建立（來自 @radix-ui/react-alert-dialog）
8. `uploadPdf` 用 Manus Forge storagePut（dev-only）→ 改為 `r2Put`（Cloudflare R2，生產可用）
9. Tiptap 編輯器編輯既有文章時內容空白 → `RichTextEditor.tsx` 加入 `useEffect` 在 `editor.isEmpty` 時 `setContent`
10. `AdminOrders` 建立時間無時分 → 改用 `toLocaleString` 含 hour/minute

### 🔴 高優先級（待處理）
11. **大永 ERP 12 張 `dy_` 表不在 schema.ts** — 技術債，暫以 raw SQL 操作
12. **`dy_customers` 缺少 `lineUserId` 欄位** — LIFF 身份綁定需要此欄位
13. **BrandNews / CorporateNews 前端尚未更新分頁格式** — `getPublishedPosts` 已改回傳 `{ posts, total, ... }`，前端仍用舊格式 `.map()`，需改為 `data?.posts?.map()`，並加入分頁 UI

### 🟡 中優先級
14. 韓式飯捲菜單圖打包在 Railway — 應批次上傳到 R2 改用 CDN URL
15. 密碼重設郵件尚未實作 — 目前只 `console.log` 重設連結
16. **posts 表新增 `scheduledAt` / `category` 欄位的 migration SQL 尚未在 TiDB 執行** — 本機 drizzle-kit SSL 無法連 TiDB，需 push 後在 Railway shell 執行或手動 ALTER TABLE

---

## 二十、開發路線圖（依優先順序）

### 階段 A（大永蛋品上線）→ 進行中
- ✅ 大永後台基礎（客戶、訂單、庫存、進貨、行政區、司機）
- ✅ 司機手機工作站（/driver）
- ✅ 電子簽收（DriverSign.tsx）
- ✅ 派車單打印（DeliveryNote.tsx）
- ✅ SuperAdminModules 模組開關控制台
- ✅ Google Maps 修復
- ✅ LINE@ 接單整合（Make → Gemini → 後端 → LINE Reply）
- ⏳ **LIFF 客戶下單（高優先）**
- ⏳ 帳務管理（應收應付、月結對帳）
- ⏳ 積欠款提醒（司機配送時顯示）

### 階段 A-2（宇聯官網/電商優化）→ 進行中
- ✅ AdminOrders 改版（時間格式、來源篩選、刪除功能、refunded 狀態）
- ✅ AdminDashboard 改版（6 張統計卡片）
- ✅ ContentEditor / RichTextEditor 修復（草稿空白問題）
- ✅ CMS 後端升級（category 欄位、scheduledAt 排程發布、分頁）
- ✅ 訂單管理：來源篩選下拉（中文顯示）、刪除訂單（super_admin）、時間顯示到分鐘
- ✅ 商城總覽：訂單卡片拆分為6個（待處理/付款處理中/已出貨送達/總計）
- ✅ 草稿文章：編輯時內容不再消失（RichTextEditor useEffect 修復）
- ✅ SOP PDF 上傳：改用 Cloudflare R2，生產環境可正常使用
- ✅ posts 表新增 scheduledAt、category 欄位（migration SQL 已生成，待 Railway 執行）
- ✅ 後端新增 publishScheduled procedure + 每分鐘排程器
- ✅ getPublishedPosts 支援分頁（page/pageSize）和分類篩選
- ⏳ **Railway 執行 migration SQL（scheduledAt、category 欄位）**
- ⏳ 前端 ContentEditor.tsx：加 category 下拉、scheduledAt 日期時間選擇器
- ⏳ 前端 ContentManagement.tsx：加分類篩選、顯示分類標籤
- ⏳ 前端 BrandNews.tsx：分頁、雙模式（卡片/清單）、圖片 16:9、分類篩選
- ⏳ 前端 CorporateNews.tsx：同上
- ⏳ AdminOrders.tsx：訂單編號後紫色標籤文字改中文

### 階段 B（大永穩定後，宇聯 ERP）
- 庫存管理、排班系統、門市日報、異常警報中心

### 階段 C
- 採購物流、財務報表、人資薪資

### 階段 D（SaaS 化）
- 多租戶管理完善、計費系統、白牌客製化

---

## 二十一、最近的變更記錄（2026-04-07）

### AdminOrders.tsx 修改
- 建立時間格式：`toLocaleString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })`
- 新增來源篩選下拉（動態從資料生成，`ORDER_SOURCE_LABELS` mapping 顯示中文）
- 新增刪除按鈕（`super_admin` 限定，紅色 Trash2，`window.confirm` 二次確認）
- 補上 `refunded`（已退款）狀態選項

### AdminDashboard.tsx 修改
- 統計卡片從 4 個→6 個，grid 改 `grid-cols-2 md:grid-cols-3`
- 新增：待處理訂單（amber）、付款/處理中（blue）、已出貨/送達（green）

### server/db.ts 修改
- 新增 `deleteOrder(id, tenantId)`：先 DELETE order_items，再 DELETE orders

### server/routers.ts 修改
- 新增 `order.delete`：adminProcedure，帶 tenantId 隔離

### RichTextEditor.tsx 修改
- 新增 `useEffect`：API 資料回來後，若 `editor.isEmpty` 則 `setContent(content)`
- 解決編輯既有文章時 Tiptap 顯示空白的問題

### server/routers/storage.ts 修改
- `uploadPdf` 從 `storagePut`（Manus Forge dev-only）改為 `r2Put`（Cloudflare R2）
- 移除 `import { storagePut } from "../storage"`

### drizzle/schema.ts 修改
- `posts` 表新增：`scheduledAt: timestamp("scheduledAt")` 和 `category: varchar("category", { length: 50 })`
- Migration SQL 已生成：`drizzle/0020_medical_forge.sql`
- ⚠️ **TiDB 尚未執行此 migration（本機 drizzle-kit 無法連線 TiDB SSL）**

### server/routers/content.ts 重寫
- `getPublishedPosts`：新增 `category` / `page` / `pageSize` 參數，回傳改為 `{ posts, total, page, pageSize, totalPages }`
- `listPosts`：新增 `category` 篩選
- `createPost` / `updatePost`：新增 `category` 和 `scheduledAt` 欄位
- 新增 `publishScheduled`：adminProcedure，批次發布到期排程文章

### server/_core/index.ts 修改
- 新增 import：`posts`（schema）、`and / eq / sql`（drizzle-orm）
- `server.listen` callback 內加入每分鐘排程器，自動發布 `scheduledAt <= now` 的草稿

---

## 二十二、下一個任務（前端 CMS / 新聞頁升級）

### 待辦清單（依優先順序）
1. ⚠️ **Railway 執行 migration SQL** — `ALTER TABLE posts ADD scheduledAt timestamp; ALTER TABLE posts ADD category varchar(50);`
2. `ContentEditor.tsx`：新增 `category` select 下拉（選項：餐飲新聞 / 加盟快報 / 品牌動態 / 集團公告）和 `scheduledAt` datetime-local 選擇器
3. `ContentManagement.tsx`：加分類篩選 tab / 下拉，列表顯示分類標籤
4. `BrandNews.tsx`：分頁（`page` state + prev/next 按鈕）、雙模式（卡片/清單切換）、圖片 16:9 裁切、分類篩選
5. `CorporateNews.tsx`：同上
6. `AdminOrders.tsx`：訂單編號後紫色標籤文字改中文

### 第一次給 Claude Code 的指令
```
請先讀 CLAUDE.md。開始前 git pull origin main。

任務：升級前端 CMS 和新聞頁，配合後端已更新的功能。

【背景】
- getPublishedPosts 回傳格式已改為 { posts, total, page, pageSize, totalPages }
- posts 表已有 category / scheduledAt 欄位（migration 需先在 Railway 執行）
- 前端目前仍用舊格式 newsItems?.map(...)，會直接 crash

【任務一】ContentEditor.tsx
- 新增 category select（選項：餐飲新聞 / 加盟快報 / 品牌動態 / 集團公告 / 空白）
- 新增 scheduledAt datetime-local input（選填）
- createPost / updatePost mutation 帶入這兩個欄位

【任務二】BrandNews.tsx
- useQuery 改接 { posts, total, totalPages }
- 改用 data?.posts?.map()
- 加入分頁（page state，prev/next 按鈕，顯示「第 X / Y 頁」）
- 圖片改為 16:9 aspect-ratio

【任務三】CorporateNews.tsx（同任務二）

完成後 pnpm run build 零錯誤，不要 push。
```

---

## 二十三、下一個任務（LIFF 客戶下單）

### 架構
```
客戶點 LINE 選單
→ 開啟 LIFF 網頁（/liff/order）
→ 系統用 lineUserId 自動識別客戶身份
→ 客戶選擇品項和數量
→ 送出
→ 後端寫入 dy_orders（orderSource = 'liff'）
→ LINE 回覆確認訊息
```

### 需要做的事
1. `dy_customers` 加 `lineUserId VARCHAR(50)` 欄位
2. 前端新增 `/liff/order` 頁面（手機優化，從 dy_products 撈品項）
3. 後端新增 `POST /api/dayone/liff-order`（用 lineUserId 查客戶）
4. LINE Developers 建立 LIFF（取回 LIFF ID）
5. LINE 選單設定入口連結

### 第一次給 Claude Code 的指令
```
請先讀 CLAUDE.md。

任務：調查（不要修改任何東西）。

1. 執行 SQL：SHOW COLUMNS FROM dy_customers;
   確認有沒有 lineUserId 欄位

2. 執行 SQL：SELECT id, name, price, isActive FROM dy_products WHERE tenantId = 2 AND isActive = 1 LIMIT 20;
   回報結果

3. 列出 client/src/pages/dayone/ 目錄所有檔案

4. 不要做任何東西，只回報
```

---

## 二十四、大永蛋品業務背景

- 聯絡人：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- 地址：台中市西屯區西林巷 63-18 號
- 業務：雞蛋批發配送，台中地區，約 28 個行政區，D1/D2 兩條配送路線
- tenantId = 2
- 蛋品 SKU：白大箱、白小箱、白紙、液白、液紙、粉蛋、紅蛋、液體蛋、破蛋、洗選白帶裝、洗選白袋裝、洗選白盒裝、A液紙、鹹蛋、鹹蛋、皮蛋、水皮蛋

---

## 二十五、分業客戶

- tenantId=1：宇聯國際（來點什麼餐飲連鎖，自用）
- tenantId=2：大永蛋品（雞蛋批發，付費客戶，開發費 20-40 萬 + 月租 3,000-8,000）
- tenantId=3+：未來其他食品批發商

大永做完的功能，改顏色和細節就能賣給下一個批發商。透過模組授權接近零邊際成本。

---

## 二十六、踩坑紀錄（避免再踩）

- `git add -A` 絕對不能用
- 兩台電腦要先 pull，不然有衝突
- Procedure 參數名稱要對（DeliveryNote bug：前端傳 orderId，後端要 id）
- Gemini REST API 對免費帳號有模型限制，Make 內建模組才能正常使用
- Make JSON string 模式無法處理換行符號，改用 Data structure 模式
- `dy_orders` 欄位名稱是 `totalAmount` 不是 `total`
- `dy_orders.customerId` 是 NOT NULL，找不到客戶傳 0 不傳 null
- LINE Reply 由後端直接呼叫（用 LINE_CHANNEL_ACCESS_TOKEN），不經過 Make
- TiDB 不支援 `ADD COLUMN IF NOT EXISTS`
- `drizzle-kit migrate` 在本機無法連 TiDB（SSL profile 型別錯誤），需在 Railway shell 執行或手動 ALTER TABLE
- `getPublishedPosts` 回傳格式已改為分頁物件 `{ posts, total, ... }`，前端用 `.posts` 取陣列
- `DayoneLayout` 元件要加入 git（untracked 檔案 Railway build 找不到）
- Tiptap `RichTextEditor` 的 `content` prop 只在初始化時讀取，編輯既有文章時需在 `useEffect` 內用 `editor.commands.setContent()` 才能更新編輯器內容
- SOP 的 `uploadPdf` 原本用 Manus Forge `storagePut`（dev-only），已改為 `r2Put`（Cloudflare R2），生產環境才能正常上傳

---

*文件版本：CLAUDE.md v2.1*
*核對時間：2026-04-07*
*最後 push commit：c853002*
*本機待 push：drizzle/schema.ts / server/routers/content.ts / server/_core/index.ts / drizzle/0020_medical_forge.sql*
*核對來源：schema.ts / routers.ts / routers/content.ts / routers/storage.ts / AdminOrders.tsx / AdminDashboard.tsx / RichTextEditor.tsx / db.ts*

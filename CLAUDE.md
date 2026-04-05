# CLAUDE.md — OrderSome 專案完整說明

> 最後更新：2026-04-05 | 核對版本：commit bb4f9b33
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
| 認證 | Manus OAuth + Google OAuth + LINE OAuth + Email/Password |
| 密碼 | bcryptjs |
| 打包 | Vite 7（前端）+ esbuild（後端） |
| 套件管理 | pnpm 10 |
| 測試 | Vitest |
| 富文本 | Tiptap 3 |
| 表單 | React Hook Form + Zod |
| 圖表 | Recharts |
| 簽名 | react-signature-canvas |

---

## 三、部署資訊

### 3.1 生產環境（Railway）
```
服務名稱: ordersome_official_v2.0221
生產網址: https://ordersome.com.tw
自動部署: 推送到 GitHub main 分支後自動觸發
```

### 3.2 GitHub 推送指令
```bash
# ⚠️ 必須用 user_github，不是 origin
git push user_github main
```
> `origin` 指向 Manus 內部 S3 備份，`user_github` 才是真正的 GitHub。

### 3.3 TiDB Cloud 資料庫
```
平台:   TiDB Cloud（MySQL 相容）
主機:   gateway01.ap-northeast-1.prod.aws.tidbcloud.com
埠:     4000
資料庫: ordersome
用戶:   2PEiAB7nB6htiep.root
SSL:    rejectUnauthorized: true（server/db.ts 手動解析 URL）
```

### 3.4 Cloudflare R2 圖片儲存
```
Bucket:        ordersome-b2b
Account:       d4dbdd11c1db22961203972fd5c46b06
公開 URL 前綴: https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev

環境變數（標準 AWS SDK 命名，勿使用 R2_ACCESS_KEY 舊格式）：
R2_ACCOUNT_ID        = d4dbdd11c1db22961203972fd5c46b06
R2_ACCESS_KEY_ID     = d1908a2d75c6af2adfccb1f587dc811a
R2_SECRET_ACCESS_KEY = 168b4fd65f3fe105dceb48e706724e08e10cad5f262fee05da936253c934db1a
R2_BUCKET            = ordersome-b2b
R2_PUBLIC_URL_PREFIX = https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev
```

### 3.5 Railway 完整環境變數
```
NODE_ENV="production"
DATABASE_URL="mysql://2PEiAB7nB6htiep.root:Y9QkbXSPa0Zgulq0@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/ordersome?ssl={\"rejectUnauthorized\":true}"
JWT_SECRET="ordersome-yulian-secret-2026-xK9mP"
VITE_APP_ID="ordersome"
VITE_APP_URL="https://ordersome.com.tw"
OAUTH_SERVER_URL="https://ordersome.com.tw"
R2_ACCOUNT_ID="d4dbdd11c1db22961203972fd5c46b06"
R2_ACCESS_KEY_ID="d1908a2d75c6af2adfccb1f587dc811a"
R2_SECRET_ACCESS_KEY="168b4fd65f3fe105dceb48e706724e08e10cad5f262fee05da936253c934db1a"
R2_BUCKET="ordersome-b2b"
R2_PUBLIC_URL_PREFIX="https://pub-344b4e8c0e374787a0dd2b2024ee46c6.r2.dev"
GOOGLE_CLIENT_ID="615601412173-un3n4k1t25tg3863t1gef251vuqc6ug4.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
LINE_CLIENT_ID="2009201434"
LINE_CLIENT_SECRET="e2d1022c6417b4c1fdd5e5bd51e30aac"
```

---

## 四、常用指令

```bash
pnpm dev              # 開發伺服器（port 3000）
pnpm build            # 生產構建（Vite + esbuild）
pnpm start            # 啟動生產伺服器
pnpm check            # TypeScript 型別檢查
pnpm test             # 執行所有測試（58/58 通過）
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
│   ├── _core/                       # ⚠️ 核心框架，勿隨意修改
│   │   ├── env.ts                   # 所有環境變數（統一從這裡讀取）
│   │   ├── context.ts               # tRPC 上下文（認證）
│   │   ├── trpc.ts                  # tRPC 初始化（publicProcedure / protectedProcedure）
│   │   ├── oauth.ts                 # OAuth 認證邏輯
│   │   ├── llm.ts                   # LLM 集成（invokeLLM）
│   │   ├── notification.ts          # notifyOwner()
│   │   ├── index.ts                 # Express 入口
│   │   └── ...
│   └── lib/
│       └── password.ts              # bcrypt 密碼雜湊
│
├── drizzle/
│   ├── schema.ts                    # ✅ 所有 Drizzle 表定義（見第八節）
│   ├── relations.ts
│   └── 0000_*.sql ~ 0020_*.sql     # SQL 遷移文件（21 個）
│
├── shared/
│   ├── const.ts                     # 共用常數（COOKIE_NAME 等）
│   ├── types.ts                     # re-export 所有 schema 型別
│   └── _core/errors.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
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

## 八、資料庫 Tables（完整清單）

### 8.1 Drizzle 管理的表（`drizzle/schema.ts`）

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
| `posts` | CMS 文章（publishTargets JSON 陣列） |
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

### 8.2 ⚠️ 大永 ERP 的 raw SQL 表（不在 schema.ts，直接在 TiDB）

這是已知技術債，目前以 raw SQL 操作：

| 表名 | 用途 |
|------|------|
| `dy_customers` | 客戶 |
| `dy_customer_prices` | 客戶特殊定價 |
| `dy_drivers` | 司機（含 `userId` 連結 users 表） |
| `dy_orders` | 大永訂單（含 boxes/signature/cash 欄位） |
| `dy_order_items` | 訂單明細 |
| `dy_products` | 商品（含 code/unit 欄位） |
| `dy_inventory` | 庫存（含 safetyQty） |
| `dy_purchase_orders` | 採購單 |
| `dy_purchase_order_items` | 採購明細 |
| `dy_stock_movements` | 庫存異動記錄 |
| `dy_suppliers` | 供應商 |
| `dy_delivery_signatures` | 送貨簽名 |

---

## 九、tRPC API 路由（完整清單）

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
`list` / `listAll` / `getById` / `getByNumber` / `create` / `updateStatus`

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
`listPosts` / `getPublishedPosts` / `getPostBySlug` / `getPostById` / `createPost` / `updatePost`

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

## 十、認證系統

### 10.1 OAuth 流程
- Manus OAuth（App ID: `ordersome`）
- Google OAuth（Client ID: `615601412173-...`）
- LINE OAuth（Client ID: `2009201434`）
- Email + 密碼（bcryptjs，僅 franchisee/admin 角色）

### 10.2 ⚠️ Cloudflare WAF 繞過
登入 mutation 的密碼欄位命名刻意避開保留字：
- 登入：`pwd`（非 `password`）
- 重設密碼：`newPwd`（非 `newPassword`）

### 10.3 用戶角色（5 種）
```
super_admin  — 超級管理員（可存取所有功能）
manager      — 管理員（可存取 admin 功能）
franchisee   — 加盟商（可存取 /dashboard/franchise）
staff        — 員工（可存取 SOP/reports/repairs/checklist）
customer     — 一般會員（預設，可購物）
```

### 10.4 tRPC 程序類型
| 類型 | 限制 |
|------|------|
| `publicProcedure` | 無限制 |
| `protectedProcedure` | 需登入 |
| `adminProcedure` | 需 super_admin 或 manager |
| `franchiseeProcedure` | 需 franchisee / super_admin / manager |
| `dyAdminProcedure`（大永） | 需 super_admin 或 manager |
| `driverProcedure` | 需 driver / manager / super_admin |

---

## 十一、購物車架構

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

## 十二、綠界金流（ECPay）

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

## 十三、圖片儲存路徑規則

| 類型 | R2 Key 格式 |
|------|------------|
| 商品/文章圖片 | `posts/{timestamp}-{random}.{ext}` |
| SOP PDF | `sop-pdfs/{timestamp}-{random}.pdf` |
| 司機簽名 | `signatures/{tenantId}/{orderId}-{timestamp}.png` |
| 本地靜態（Railway） | `client/public/images/menu/korean-roll/`（⚠️ 應遷移到 R2） |

---

## 十四、核心架構原則

### 14.1 Lego 模組架構
- 每個功能模組可透過 `tenant_modules` 表的 `moduleKey` 開關
- 前端 `ModuleGuard` 組件根據 `useModules()` hook 控制頁面存取
- 大永 ERP 的 `tenantId = 2`，官網是 `tenantId = 1`

### 14.2 tenantId 隔離
- **所有資料查詢必須帶 tenantId**（防止租戶資料互串）
- `ctx.tenantId` 由 tRPC context 自動注入
- 大永 ERP 的 queries 需手動傳入 `tenantId` 參數

### 14.3 shared/ 共用型別
```typescript
// shared/types.ts — 前後端共用型別從這裡 import
export type * from "../drizzle/schema";
export * from "./_core/errors";

// shared/const.ts
COOKIE_NAME = "app_session_id"
```

### 14.4 server/_core/ 目錄
**勿隨意修改**，除非在擴展基礎設施。包含：
- `env.ts` — 所有環境變數統一讀取
- `trpc.ts` — tRPC 初始化與 procedure 定義
- `context.ts` — 認證上下文
- `oauth.ts` — OAuth 邏輯
- `index.ts` — Express 入口（含 Vite 開發中間件）

---

## 十五、SEO 架構

每個頁面透過 hooks 動態注入 JSON-LD：

| Hook | 用途 |
|------|------|
| `useCanonical()` | 動態 canonical URL（全站啟用） |
| `useBreadcrumbList()` | BreadcrumbList Schema（全站） |
| `useArticleSchema()` | 文章頁 JSON-LD |
| `useProductSchema()` | 商品頁 JSON-LD |
| `useRestaurantSchema()` | 餐廳 JSON-LD |

---

## 十六、測試

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

## 十七、已知問題與技術債

### ✅ 已修復（2026-04-05）
1. **大永 `dy_districts` 不在 schema.ts** → 已加入，migration: `0020_add_dy_districts.sql`
2. **TiDB SSL 連線失敗** → `server/db.ts` 改用 `mysql2/promise` 手動解析 URL + SSL
3. **大永訂單 `unitPrice` 型別錯誤** → `DayoneOrders.tsx` 加入 `Number()` 轉型

### 🔴 高優先級（待處理）
4. **大永 ERP 其餘 12 張 `dy_` 表不在 schema.ts** — 以 raw SQL 操作，是技術債。修復方式：逐一在 `drizzle/schema.ts` 補上表定義並執行 migration。

### 🟡 中優先級
5. **韓式飯捲菜單圖打包在 Railway** — `client/public/images/menu/korean-roll/` 有大量圖片，建議批次上傳到 R2 改用 CDN URL。
6. **密碼重設郵件尚未實作** — `requestPasswordReset` 目前只 `console.log` 重設連結，應串接 nodemailer。

---

## 十八、每次開發前必做的確認清單

- [ ] **git pull origin main 先拉最新程式碼** — 再開始任何工作
- [ ] **git status 確認工作目錄狀態** — 確認沒有意外的 deleted 或 modified 檔案再 commit
- [ ] **git push 只用精準的 git add 檔案名稱** — 絕不用 `git add -A` 或 `git add .`
- [ ] **資料查詢帶 tenantId** — 勿漏掉租戶隔離
- [ ] **圖片上傳走 `trpc.storage.uploadImage`** — 底層是 `server/storage.ts`（R2），使用 Base64 傳送
- [ ] **R2 環境變數使用標準命名** — `R2_ACCESS_KEY_ID`（不是 `R2_ACCESS_KEY`）
- [ ] **密碼欄位命名** — 登入 `pwd`、重設 `newPwd`（Cloudflare WAF 限制）
- [ ] **購物車狀態** — 用 Zustand `useCartStore`，不是 tRPC
- [ ] **司機路由** — `/driver/`，不是 `/dayone/driver/`
- [ ] **GitHub 推送** — `git push user_github main`，不是 `origin`
- [ ] **勿修改 `server/_core/`** — 除非擴充基礎設施
- [ ] **大永 ERP raw SQL 表** — 不在 Drizzle ORM，需用 `(db as any).$client.execute(...)` 操作
- [ ] **新增 Drizzle Schema** — 必須執行 `pnpm db:push` 生成並執行 migration
- [ ] **posts 表 publishTargets** — TiDB 不支援 JSON 欄位預設值，應用層必須提供（預設 `["brand"]`）

---

## 十九、Manus / Claude Code 分工說明

| 情境 | 建議工具 |
|------|---------|
| 閱讀 / 修改現有程式碼 | Claude Code（直接讀寫） |
| 大型新功能開發 | Manus（有 sandbox 環境、可跑測試） |
| 部署到 Railway | GitHub push → Railway 自動觸發 |
| 資料庫 migration | `pnpm db:push`（本地或 Manus sandbox） |
| R2 批次上傳 | `scripts/r2-upload-and-tidb-write.mjs` |
| 測試驗證 | `pnpm test`（58/58 應全部通過） |

---

## 二十、商業願景與 SaaS 策略

這個系統的終極目標是成為「台灣餐飲/食品批發業的 SaaS 平台」。

### 核心商業邏輯：
- **tenantId=1**：宇聯國際（來點什麼餐飲連鎖，自用）
- **tenantId=2**：大永蛋品（雞蛋批發配送，付費客戶，開發費 20-40 萬 + 月租 3,000-8,000）
- **tenantId=3+**：未來其他食品批發商（蔬菜、飲料、肉品等）

### 為什麼要做多租戶：
- 同一套程式碼服務所有客戶，邊際成本接近零
- 每個客戶的資料完全隔離（tenantId 隔離）
- 功能用 tenant_modules 開關，不需要重寫程式碼
- 大永蛋品做完的功能，改顏色和細節就能賣給下一個批發商
- **這就是為什麼所有程式碼絕對禁止 hardcode tenantId**

---

## 二十一、開發路線圖（依優先順序）

### 階段 A（現在，大永蛋品上線）：
- 修復現有 5 個基礎 Bug
- 派車單（出貨單）數位化 + 列印
- LINE@ 接單整合（用 Make Webhook，不寫 LINE SDK）
- 積欠款提醒（司機頁面）
- 帳務管理頁面（月結對帳）

### 階段 B（大永穩定後，宇聯 ERP）：
- 庫存管理（食材盤點、低庫存警報）—— 最痛的問題
- 排班系統（取代 Excel 紙本）
- 門市日報系統（整合現有 Make 自動報表）
- 異常警報中心（整合以上所有警報）

### 階段 C（宇聯 ERP 完成後）：
- 採購物流系統
- 財務報表
- 人資薪資

### 階段 D（SaaS 化）：
- 多租戶管理介面完善
- 計費系統
- 白牌客製化（每個客戶可以改 logo 和顏色）

---

## 二十二、大永蛋品功能清單（對應紙本作業數位化）

### 已完成：
- 後台管理（`/dayone`）：客戶、訂單、庫存、進貨、行政區、司機管理
- 司機手機工作站（`/driver`）：今日路線、電子簽收、現金收款、工作日誌

### 待開發：
- 派車單列印（對應現有三聯單格式，含前箱/入箱/回箱/餘箱）
- LINE@ 自動接單（用 Make Webhook 整合）
- 積欠款提醒（司機配送時顯示客戶欠款）
- 帳務管理（應收應付、月結對帳）
- 進出貨日報表（對應現有紙本矩陣格式）

### 大永蛋品聯絡資訊：
- **聯絡人**：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- **地址**：台中市西屯區西林巷 63-18 號
- **主要業務**：雞蛋批發配送，台中地區，約 28 個行政區，D1/D2 兩條配送路線

---

*文件版本：CLAUDE.md v1.1*
*核對時間：2026-04-05*
*核對來源：schema.ts / routers.ts / App.tsx / dayone/*.ts / package.json / env.ts / storage.ts*

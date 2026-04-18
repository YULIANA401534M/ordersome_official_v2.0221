# CLAUDE_REFERENCE.md — OrderSome 完整技術參考

> 這份文件是「查閱用」，不是每次都要讀。
> 開新對話時只需讀 `CLAUDE.md`，有需要才查這裡。
> 最後更新：2026-04-19（v5.47 同步）

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
| Excel | SheetJS（xlsx 0.18.5） |

---

## R2、目錄結構

```
ordersome_official_v2/
├── client/src/
│   ├── App.tsx                  # 主路由
│   ├── pages/                   # 所有頁面組件
│   ├── components/              # 共用組件
│   │   └── AdminDashboardLayout.tsx  # 側邊欄（含拖曳排序、badge）
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
│   │   ├── admin.ts             # 用戶/權限/側邊欄排序
│   │   ├── accounting.ts        # 帳務系統（16 procedures）
│   │   ├── content.ts / storage.ts / sop.ts / tenant.ts
│   │   ├── delivery.ts          # 配送管理
│   │   ├── franchisee.ts / franchiseePayment.ts
│   │   ├── inventory.ts         # 庫存管理
│   │   ├── osProducts.ts        # 品項成本
│   │   ├── osRebate.ts          # 退佣帳款
│   │   ├── procurement.ts       # 叫貨管理（22 procedures）
│   │   ├── profitLoss.ts        # 損益儀表板
│   │   ├── scheduling.ts        # 排班管理
│   │   └── dayone/              # 大永 ERP（11 個子路由）
│   └── _core/                   # ⚠️ 核心框架，勿隨意修改
│       ├── env.ts / context.ts / trpc.ts / oauth.ts / index.ts
│
├── drizzle/
│   ├── schema.ts                # 所有表定義
│   └── 0000_*.sql ~ 0026_*.sql  # migration 文件
│
└── shared/
    ├── const.ts / types.ts / _core/errors.ts
```

---

## R3、前端路由（完整清單，截至 v5.47）

### 後台管理（/dashboard）— 來點什麼 ERP

| 路徑 | 組件 | 狀態 |
|------|------|------|
| `/dashboard` | `Dashboard`（智慧入口） | ✅ |
| `/dashboard/admin/ecommerce` | `AdminDashboard` | ✅ |
| `/dashboard/admin/products` | `AdminProducts` | ✅ |
| `/dashboard/admin/orders` | `AdminOrders` | ✅ |
| `/dashboard/admin/categories` | `AdminCategories` | ✅ |
| `/dashboard/admin/users` | `AdminUsers` | ✅ |
| `/dashboard/admin/permissions` | `AdminPermissions` | ✅ |
| `/dashboard/admin/tenants` | `AdminTenants` | ✅ |
| `/dashboard/content` | `ContentManagement` | ✅ |
| `/dashboard/content/new` | `ContentEditor` | ✅ |
| `/dashboard/content/edit/:id` | `ContentEditor` | ✅ |
| `/dashboard/franchise-inquiries` | `FranchiseInquiries` | ✅ |
| `/dashboard/sop` | `SOPKnowledgeBase` | ✅ |
| `/dashboard/repairs` | `EquipmentRepairs` | ✅ |
| `/dashboard/checklist` | `DailyChecklist` | ✅ |
| `/dashboard/ai-writer` | `AIWriter` | ✅ |
| `/dashboard/daily-report` | `OSDailyReport` | ✅ |
| `/dashboard/purchasing` | `OSPurchasing` | ✅ 撿貨單列印 + 大麥 Excel 匯入 |
| `/dashboard/products` | `OSProducts` | ✅ |
| `/dashboard/rebate` | `OSRebate` | ✅ |
| `/dashboard/ca-menu` | `OSCaMenu` | ✅ |
| `/dashboard/profit-loss` | `OSProfitLoss` | ✅ |
| `/dashboard/franchisee-payments` | `OSFranchiseePayments` | ✅ |
| `/dashboard/scheduling` | `OSScheduling` | ✅ |
| `/dashboard/delivery` | `OSDelivery` | ✅ |
| `/dashboard/inventory` | `OSInventory` | ✅ |
| `/dashboard/franchisees` | `OSCustomers` | ✅ |
| `/dashboard/accounting` | `OSAccounting` | ✅ 四 Tab 帳務管理 |
| `/dashboard/customers` | `ComingSoon` | ⏳ 空殼 |

### 品牌官網（來點什麼）
`/brand` / `/brand/story` / `/brand/stores` / `/brand/menu` / `/brand/news` / `/brand/contact` / `/brand/franchise`

### 集團官網（宇聯國際）
`/corporate` / `/corporate/about` / `/corporate/brands` / `/corporate/culture` / `/corporate/news` / `/corporate/news/:slug` / `/corporate/franchise` / `/corporate/contact`

### 電商購物
`/shop` / `/shop/category/:slug` / `/shop/product/:id` / `/shop/cart` / `/shop/checkout` / `/shop/order/:id` / `/shop/payment/:orderNumber` / `/shop/order-complete/:orderNumber` / `/shop/my-orders` / `/exclusive/:slug`

### 認證 & 會員
`/login` / `/forgot-password` / `/reset-password/:token` / `/profile` / `/member/profile` / `/member/orders`

### 大永 ERP（管理端）
`/dayone` / `/dayone/orders` / `/dayone/customers` / `/dayone/drivers` / `/dayone/products` / `/dayone/inventory` / `/dayone/purchase` / `/dayone/districts` / `/dayone/reports` / `/dayone/suppliers` / `/dayone/liff-orders` / `/dayone/ar` / `/dayone/dispatch` / `/dayone/purchase-receipts`

### 大永客戶 Portal
`/dayone/portal` / `/dayone/portal/login` / `/dayone/portal/register` / `/dayone/portal/orders` / `/dayone/portal/statement` / `/dayone/portal/account`

### 司機 App（`/driver/`）
`/driver` / `/driver/today` / `/driver/orders` / `/driver/order/:id` / `/driver/pickup` / `/driver/done` / `/driver/worklog` / `/driver/profile`

### LIFF
`/liff/order?tenant=dayone`

### Super Admin
`/super-admin/tenants` / `/super-admin/modules`

---

## R4、資料庫 Tables

### Drizzle 管理的表（`drizzle/schema.ts`）

| 表名 | 用途 |
|------|------|
| `tenants` | 多租戶 |
| `users` | 用戶（super_admin / manager / franchisee / staff / store_manager / customer / driver / portal_customer）+ `has_procurement_access` + `last_login_at` |
| `categories` / `products` / `cart_items` / `orders` / `order_items` | 電商 |
| `stores` / `news` / `menu_items` | 門市/內容 |
| `contact_submissions` / `franchise_inquiries` | 詢問表單 |
| `posts` | CMS 文章（publishTargets JSON、scheduledAt、category） |
| `sop_categories` / `sop_documents` / `sop_read_receipts` / `sop_permissions` | SOP 系統 |
| `equipment_repairs` | 設備報修 |
| `daily_checklists` / `daily_checklist_items` | 每日檢查表 |
| `store_settings` | 門市設定 |
| `tenant_modules` / `module_definitions` | 模組開關 |
| `franchisee_feature_flags` | 加盟主功能開關 |
| `dy_work_logs` / `dy_districts` | 大永 |

### 來點什麼 ERP raw SQL 表（不在 schema.ts）

| 表名 | 用途 | 重要欄位 |
|------|------|------|
| `os_daily_reports` | 門市日報 | generated columns：totalSales/guestTotal/productivity |
| `os_tw_holidays` | 台灣假日（2025-2027） | isHoliday boolean |
| `os_monthly_reports` | 月報補充 | 電費/水費/薪資/業績檢討 |
| `os_procurement_orders` | 叫貨主表 | orderNo/status/sourceType/printedAt |
| `os_procurement_items` | 叫貨明細 | supplierName/productName/quantity/needsReview |
| `os_supplier_line` | 廠商 LINE 群組 | 推播叫貨用 |
| `os_suppliers` | 供應商 | deliveryType('direct'/'yulian'/'other')/sortOrder |
| `os_products` | 品項成本 | unitQty/unitName/packUnit/packCost/aliases(JSON)/category1/category2 |
| `os_product_categories` | 品項分類 | 兩層分類管理 |
| `os_rebate_records` | 廠商退佣記錄 | — |
| `os_inventory` | 庫存主表（B類） | currentQty/safetyQty/lastCountDate |
| `os_inventory_logs` | 庫存異動記錄 | changeType('in'/'out'/'adjust')/refType |
| `os_audit_logs` | 稽核日誌（永久不可刪） | action/targetTable/targetId/reason |
| `os_schedule_templates` | 排班員工範本 | employeeName/shiftType |
| `os_schedules` | 每日班表 | scheduleDate/shiftType（UNIQUE: tenantId+storeId+employeeName+date） |
| `os_delivery_orders` | 派車單 | deliveryNo（DO-YYYYMMDD-001）/status |
| `os_delivery_items` | 派車品項 | — |
| `os_franchisee_contracts` | 加盟合約 | R2 URL/簽約日/到期日/settlementCycle |
| `os_franchisee_payments` | 應收帳款 | receivable/paid/isAutoGenerated/paidAt |
| `os_menu_items` | 菜單成本主表 | 售價/平台價/分頁 |
| `os_menu_item_ingredients` | 食材明細 | 連結 os_products |
| `os_oem_products` | OEM 品項 | 代工費/包材費/批價 |
| `os_oem_ingredients` | OEM 原料 | — |
| `os_cost_audit_log` | 成本修改歷史 | — |
| `os_sidebar_order` | 側邊欄排序 | tenantId/menuKey/sortOrder（super_admin 拖曳）|
| `os_payables` | 廠商應付帳款 | month/totalAmount/paidAmount/rebateAmount/netPayable/status/bankRef |
| `os_bank_transactions` | 銀行明細 | matchedType/matchedId/matchScore/confirmedBy/importBatch |
| `os_rebates` | 退佣帳款 | rebateType/baseAmount/netRebate/handlingFee/status |
| `os_rebate_rules` | 退佣規則 | supplierName/rebateType/handlingFee（已預填廣弘/伯享/韓濟） |
| `os_transfers` | 提貨調貨 | month/transferDate/toStore/amount/status('pending'/'billed'/'void') |

### 大永 ERP raw SQL 表（不在 schema.ts）

操作方式：`(db as any).$client.execute(...)`

| 表名 | 重要欄位備註 |
|------|------|
| `dy_customers` | 待加 `lineUserId`（LIFF 用） |
| `dy_orders` | `totalAmount`（非 total）、`orderSource`、`customerId` NOT NULL |
| `dy_products` | `code` / `unit` / `price` |
| `dy_inventory` | `safetyQty` |
| `dy_drivers` / `dy_customer_prices` / `dy_purchase_orders` / `dy_purchase_order_items` / `dy_stock_movements` / `dy_suppliers` / `dy_delivery_signatures` | — |

---

## R5、tRPC API 路由（截至 v5.47）

### auth
`me` / `logout` / `loginWithPassword`（密碼欄位 `pwd`）/ `updateProfile` / `requestPasswordReset` / `verifyResetToken` / `resetPassword`（密碼欄位 `newPwd`）/ `changePassword`

### 基礎 CRUD 路由
- `category`：`list` / `listAll` / `getBySlug` / `create` / `update` / `delete`
- `product`：`list` / `listAll` / `featured` / `byCategory` / `getBySlug` / `getById` / `getByExclusiveSlug` / `create` / `update` / `delete`
- `cart`：`list` / `add` / `updateQuantity` / `remove` / `clear`
- `order`：`list` / `listAll` / `getById` / `getByNumber` / `create` / `updateStatus` / `delete`（adminProcedure）
- `store` / `news` / `menu`：各有 `list` / `listAll` / `create` / `update` / `delete`

### content
`listPosts` / `getPostBySlug` / `getPostById` / `createPost` / `updatePost` / `deletePost` / `publishScheduled`

`getPublishedPosts` 回傳格式（分頁）：
```typescript
{ posts: Post[], total: number, page: number, pageSize: number, totalPages: number }
// ⚠️ 前端用 data?.posts?.map()，不是 data?.map()
```

### admin（adminRouter）
`listUsers` / `updateUserRole` / `getAllFranchiseeFlags` / `setFranchiseeFlag` / `toggleProcurementAccess` / `getSidebarOrder` / `saveSidebarOrder`

### procurement（22 procedures）
| Procedure | 權限 | 說明 |
|-----------|------|------|
| `importFromDamai` | public | Make Webhook CSV 匯入 |
| `create` | admin | 手動建立叫貨單 |
| `list` | admin | 列表（篩日期/狀態/廠商/門市） |
| `getDetail` | admin | 叫貨單 + 品項明細 |
| `updateStatus` | admin | 狀態推進；received 自動觸發 B 類庫存 |
| `groupBySupplier` | admin | 依廠商分組 |
| `pushToLine` | admin | 推播廠商 LINE |
| `supplierLineList` / `supplierLineUpsert` | admin | 廠商 LINE 管理 |
| `getSuppliers` | admin | 取得廠商列表 |
| `deleteOrder` | superAdmin | 刪除（寫 audit log） |
| `batchDeleteOrders` | superAdmin | 批量刪除 |
| `updateNote` / `updateItem` / `addItem` | admin | 備註/品項編輯 |
| `listStoreNames` / `listSupplierNames` | admin | 篩選下拉資料 |
| `getPickList` | admin | 撿貨單資料（B類 sent/confirmed，按廠商/門市） |
| `markPrinted` | admin | 標記叫貨單已列印（更新 printedAt） |
| `importFromDamaiExcel` | admin | 大麥 Excel 批次匯入（防重複/needsReview） |
| `listNeedsReview` | admin | 品名待確認品項（側邊欄 badge 用） |

### accounting（16 procedures）
| Procedure | 說明 |
|-----------|------|
| `listPayables` | 應付帳款列表（可篩月份/廠商/狀態） |
| `generateMonthlyPayables` | 依叫貨 received 自動匯總月應付 |
| `markPayablePaid` | 登記付款（partial/paid，寫 audit log） |
| `importBankTransactions` | 匯入銀行明細（防重複 importBatch） |
| `autoMatchTransactions` | 自動比對（matchScore≥50 才建議） |
| `confirmMatch` | 人工確認對帳 |
| `calculateRebates` | 計算月退佣（廣弘自動，伯享/韓濟待人工） |
| `listTransfers` / `createTransfer` / `importTransfers` | 提貨調貨 CRUD |
| `billTransfers` | 月底結算→產生 os_franchisee_payments |
| `exportPayables` | 應付帳款查詢（匯出用） |
| `listBankTransactions` | 銀行明細列表 |
| `listRebates` | 退佣列表 |
| `updateRebate` | 更新退佣金額/狀態 |
| `voidTransfer` | 作廢提貨調貨（pending→void） |

### inventory
`list` / `getDetail` / `adjust` / `count` / `setSafety` / `addProduct` / `alertCount` / `listYulianSuppliers`

### scheduling
`listTemplates` / `upsertTemplate` / `deleteTemplate` / `listSchedules` / `upsertSchedule` / `batchUpsertSchedules` / `getMonthSummary`

### delivery
`listDeliveryOrders` / `getDeliveryDetail` / `createDeliveryOrder` / `updateStatus` / `getMonthStats`

### franchiseePayment
`listPayments` / `createPayment` / `markPaid` / `exportPayments`

### profitLoss
`getProfitLoss`（input: month/storeId，output: 日報加總+月報費用+退佣）

### osProducts
`productList` / `productUpsert` / `categoryList`

### osRebate
各退佣帳款相關 procedure

### dailyReport
`sync`（public，Make Webhook）/ `list` / `update` / `getMonthReport` / `updateMonthReport` / `getHolidaysByMonth`

### storage
`uploadImage` / `uploadPdf`

### sop
`getCategories` / `createCategory` / `updateCategory` / `getDocuments` / `getAllDocuments` / `getDocumentById` / `createDocument` / `updateDocument` / `getSopPermissions` / `updateSopPermissions` / `getAccessibleCategories`

### aiWriter
`generateArticle`（Gemini 2.5 Flash + NewsAPI）

### dayone（大永 ERP，11 個子路由）
`dayone.customers` / `dayone.districts` / `dayone.driver` / `dayone.drivers` / `dayone.inventory` / `dayone.orders` / `dayone.products` / `dayone.purchase` / `dayone.reports` / `dayone.suppliers` / `dayone.ar` / `dayone.ap` / `dayone.purchaseReceipt` / `dayone.dispatch` / `dayone.portal`

---

## R6、認證系統

### 用戶角色（8 種，migration 0023 新增 store_manager）
```
super_admin     — 超級管理員（跨租戶，寫 audit log）
manager         — 管理員（admin 功能，看自己租戶）
franchisee      — 加盟商
staff           — 員工（SOP/reports）
store_manager   — 門市主管
customer        — 一般會員
driver          — 司機（大永）
portal_customer — 大永客戶 Portal
```

### tRPC Procedure 類型
| 類型 | 限制 |
|------|------|
| `publicProcedure` | 無限制 |
| `protectedProcedure` | 需登入 |
| `adminProcedure` | 需 super_admin 或 manager |
| `superAdminProcedure` | 僅 super_admin（刪除/稽核用） |
| `franchiseeProcedure` | 需 franchisee / super_admin / manager |
| `dyAdminProcedure` | 需 super_admin 或 manager（大永） |
| `driverProcedure` | 需 driver / manager / super_admin |

---

## R7、公開 Webhook Endpoints

| Endpoint | 說明 |
|----------|------|
| `POST /api/payment/callback` | 綠界 ECPay 付款回調 |
| `POST /api/dayone/line-order` | 大永 LINE@ 接單（Make → 後端） |
| `POST /api/ecpay/map-result` | 綠界超商選擇地圖回調 |
| `POST /api/ecpay/logistics-notify` | 綠界物流狀態通知 |
| `POST /api/trpc/procurement.importFromDamai` | Make 解析大麥 Email → 寫入叫貨系統（需 SYNC_SECRET） |
| `POST /api/trpc/dailyReport.sync` | Make 門市自動報表（需 SYNC_SECRET） |

Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
SYNC_SECRET：`ordersome-sync-2026`

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

## R10、LIFF 客戶下單

架構：客戶點 LINE 選單 → LIFF 網頁（/liff/order?tenant=dayone）→ lineUserId 識別 → 選品下單 → dy_orders（orderSource='liff'）

- 現用 LIFF ID：`2009700774-rWyJ27md`（測試，建在 Leo 的 LINE 後台）
- ⚠️ 正式上線：蛋博需用自己的 LINE 後台建立，更新 `LiffOrder.tsx` 的 TENANT_CONFIG

---

## R11、大永蛋品業務背景

- 聯絡人：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- 地址：台中市西屯區西林巷 63-18 號
- tenantId = 90004
- 業務：雞蛋批發配送，台中，約 28 個行政區，D1/D2 兩條配送路線

---

## R12、SEO 架構

`useCanonical()` / `useBreadcrumbList()` / `useArticleSchema()` / `useProductSchema()` / `useRestaurantSchema()`

---

## R13、多租戶系統架構

```
宇聯國際（母公司）
├── 商城管理（tenantId=1）
├── 來點什麼 ERP（tenantId=1）
└── 大永蛋品 ERP（tenantId=90004，付費客戶）
```

- `manager` 只看自己租戶，`super_admin` 跨租戶全部
- `tenant_modules` 各租戶獨立隔離

---

## R14、模組開關

- `moduleKey` 清單：`delivery` / `crm_customers` / `inventory` / `purchasing` / `accounting` / `scheduling` / `daily_report` / `equipment_repair` / `ar_management` / `dispatch` / `purchase_receipts` / `customer_portal` / `erp_dashboard` / `products` / `districts` / `liff_orders` / `driver_mgmt`
- 側邊欄 badge：庫存低量（紅）/ 叫貨 needsReview（橘）/ 帳務待付款（紅）

---

## R15、Email 發信

- 服務：Resend（resend.com）
- 環境變數：`RESEND_API_KEY`
- ⚠️ Railway 環境封鎖 SMTP 出口（IPv6），nodemailer 目前不可用
- 未來需驗證 ordersome.com.tw 網域並用 Resend API

---

## R16、AI 文章助手

- 後端：`server/routers/ai-writer.ts`
- 前端：`client/src/pages/dashboard/AIWriter.tsx`
- 模型：Gemini 2.5 Flash（`gemini-2.5-flash`）
- 新聞來源：NewsAPI（`NEWS_API_KEY`）

---

## R17、綠界物流（ecpay-logistics.ts）

- 加密方式：**MD5**（金流用 SHA256，物流用 MD5，不可混用）
- Webhook 選擇店鋪：`POST /api/ecpay/map-result`
- Webhook 物流通知：`POST /api/ecpay/logistics-notify`
- 回應格式：必須回應 `1|OK`

---

## R18、帳務系統架構（2026-04-19 完成）

### 五張帳務核心表
- `os_payables`：廠商應付（月結，每廠商每月一筆）
- `os_bank_transactions`：銀行明細（matchScore/confirmedBy）
- `os_rebates`：退佣帳款
- `os_rebate_rules`：退佣規則 DB（已預填廣弘/伯享/韓濟）
- `os_transfers`：提貨調貨（月底結算→os_franchisee_payments）

### 銀行明細自動比對邏輯
- 支出 + 備註含廠商名 → 建議對應 os_payables
- 收入 + 備註含加盟店名 → 建議對應 os_franchisee_payments
- matchScore ≥ 50 才建議，全程需人工 confirmedBy 確認

### 大麥 Excel 匯入規則
- orderDate 早於今天 = 歷史訂單，status 直接設 received
- 3月份以前歷史 B 類：只記帳，不觸發庫存
- 4/1 後歷史 B 類：觸發庫存入庫
- 品名比對：name → aliases → 找不到 flag needsReview=1（橘色警示）

---

*CLAUDE_REFERENCE.md — 查閱用，開新對話只讀 CLAUDE.md 即可*

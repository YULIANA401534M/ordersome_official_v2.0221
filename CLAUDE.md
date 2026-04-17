# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

> **版本**：v5.6。**最後更新**：2026-04-17。**給 Claude 架構**：大覽（Claude.ai）+ 實作（Claude Code）

---

## 第一件事

拿到這份文件時，先執行：
```bash
git status && git log --oneline -3
```
確認 working tree clean、最新 commit 是今天的，再開始工作。

---

## 專案基本資訊

- **網址**：https://ordersome.com.tw
- **部署**：Railway（自動 CI/CD，push 後 2-3 分鐘生效）
- **資料庫**：TiDB Cloud（MySQL 相容）
- **檔案儲存**：Cloudflare R2
- **套件管理**：pnpm 10
- **Git 規則**：commit 只用 `git add 指定檔案`，絕不用 `git add -A`

---

## 技術棧

| 層次 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 路由 | Wouter 3 |
| 狀態管理 | TanStack Query v5 + Zustand 5 |
| UI 元件 | shadcn/ui（Radix UI）+ Tailwind CSS 4 |
| 動畫 | Framer Motion 12 |
| 後端框架 | Express 4 |
| API 層 | tRPC 11（type-safe RPC）|
| ORM | Drizzle ORM（MySQL 方言）|
| 資料庫 | TiDB Cloud（MySQL 相容）|
| 圖檔儲存 | Cloudflare R2（S3-compatible）|
| 金流 | 綠界（ECPay）|
| 認證 | Google OAuth + LINE OAuth + Email/Password |
| 打包 | Vite 7（前端）+ esbuild（後端）|
| 可視文本 | Tiptap 3 |
| 表單 | React Hook Form + Zod |
| 圖表 | Recharts |
| 自動化 | Make（Webhook/Scenario）|

---

## 設計系統（後台 /dashboard）

- **後台設計規範**：`DESIGN-dashboard.md`
- 底色：暖灰 `#f7f6f3`
- 主色：amber `#b45309`
- 側邊欄背景：`#1c1917`（深暖棕）
- KPI 數字字體：金萱 jf-kamabit（`client/public/fonts/jf-kamabit-1_0.otf`）
- 按鈕動效：hover 上浮 1px / active 下壓 1px / 80ms

---

## 多租戶架構

```
宇聯國際（母公司）
├── 商品管理（宇聯電商，tenantId=1）
├── 內容管理（宇聯文章，tenantId=1）
├── 人員管理（系統層級）
└── 系統管理（租戶/模組開關）

來點什麼（tenantId=1，子系統）：
├── 門市管理（SOP/報修/檢查表）
├── 人員管理（來點什麼自己的）
└── ERP 模組（依模組開關啟用）

大永蛋品（tenantId=90004，子系統）：
├── 完整 ERP
└── 人員管理
```

### 用戶角色對映

| 角色 | tenantId | 權限範圍 |
|------|----------|---------|
| `super_admin` | NULL（跨租戶）| 全部功能 |
| `manager`（來點什麼）| 1 | 宇聯商城/內容/人員 + 來點什麼門市 + ERP（依模組）|
| `manager`（大永）| 90004 | 大永 ERP |
| `franchisee`（門市夥伴）| 1 | SOP/報修/檢查表/線上點餐 |
| `staff` | 1 | SOP/線上點餐 |
| `customer` | 1 | 線上點餐/我的訂單 |
| `driver` | 90004 | 司機 App（`/driver/`）|
| `portal_customer` | 90004 | 大永客戶 Portal |

---

## 2026-04-17 完成項目（本次 session）

### 來點什麼 ERP（後台 /dashboard）
- `os_daily_reports` 重建（generated columns：totalSales/guestTotal/avgPrice/productivity）
- `os_tw_holidays` 台灣假日表（2025/2026 各 365 筆）
- `os_monthly_reports` 月報補充表（電費/水費/薪資/業績檢討/月計畫）
- 叫貨管理系統（`os_procurement_orders` / `os_procurement_items` / `os_supplier_line`）
- 叫貨一鍵推播 LINE 廠商（pushToLine procedure）
- 廠商退佣自動計算（`os_rebate_records` / `os_payables`）
- 供應商與品項成本管理（`os_suppliers` / `os_products`）
- 新增路由：`/dashboard/daily-report` / `/dashboard/purchasing` / `/dashboard/products` / `/dashboard/rebate`

### 設計系統
- `DESIGN-dashboard.md` 建立（後台設計規範，暖灰底色 #f7f6f3、amber 主色 #b45309）
- 金萱字體 jf-kamabit-1_0.otf 安裝至 client/public/fonts/
- 後台全域 CSS 變數系統建立（index.css）
- `AdminDashboardLayout.tsx` 套用深暖棕側邊欄 #1c1917、amber active 線、**側邊欄各組可收合**
- `button.tsx` 立體陰影動效（hover 上浮 1px / active 下壓 1px / 80ms）

### Bug 修復
- `/dashboard/purchasing` 崩潰：`SelectItem value=""` → `value="all"`
- 首頁「線上點餐」按鈕透明：`CorporateHome.tsx` 加 `bg-transparent`
- 加盟詢問：`INSERT` 明確帶入 `tenantId: 1`
- `exclusiveSlug` 404：移除 `isActive` 過濾條件
- 排程發布狀態：`ContentManagement.tsx` 加入「排程中」badge
- 大永側邊欄模組控制：`DayoneLayout.tsx` 引入 `useModules` hook

### 手機版 UI 修復
- 大永 ERP 頁面標題：`px-4` → `px-6`，`text-sm` → `text-base`
- 後台側邊欄主題文字：顏色改 amber，字型縮小加 tracking，支援收合
- 門市日報數字輸入：`text-center` → `text-right`（避免符號重疊）
- 商城統計卡片：`gap-6` → `gap-3 md:gap-6`，`p-6` → `p-4 md:p-6`

### Railway 環境變數（2026-04-17 確認完整）
```
NODE_ENV / DATABASE_URL / JWT_SECRET / VITE_APP_ID / VITE_APP_URL / OAUTH_SERVER_URL
R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL_PREFIX
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
LINE_CLIENT_ID / LINE_CLIENT_SECRET / LINE_CHANNEL_ACCESS_TOKEN
ECPAY_HASH_IV / ECPAY_HASH_KEY / ECPAY_MERCHANT_ID
ECPAY_LOGISTICS_MERCHANT_ID / ECPAY_LOGISTICS_HASH_KEY / ECPAY_LOGISTICS_HASH_IV
GEMINI_API_KEY / NEWS_API_KEY / RESEND_API_KEY
SMTP_FROM / SMTP_HOST / SMTP_PASS / SMTP_PORT / SMTP_USER
VITE_GOOGLE_MAPS_API_KEY
SYNC_SECRET=ordersome-sync-2026（新增，Make 推資料驗證用）
```

---

## Git 狀態（2026-04-17 EOD）

最後一個 commit（已 push）：
1. `fix: 手機版UI — 大永標題、側邊欄收合、日報輸入、商城卡片間距 2026-04-17`
2. `fix: purchasing Select空值、首頁按鈕樣式、加盟詢問tenantId`
3. `feat: 程式碼裝載 — 門市日報v2、叫貨管理、退佣計算、設計系統、bug修復 2026-04-17`

working tree: **clean**

---

## 後續事項

### 第一優先（設計確認後才能開發，明天討論）

以下問題需要 Leo 決定設計方向，程式不得先行開發：

**A. 系統角色與入口整合**
- 門市店長（franchisee/staff）登入後要看到什麼？目前只能進 SOP，報表沒有專屬入口
- 加盟主登入後功能範圍還沒定義清楚
- 用戶管理頁 vs 權限管理頁職責劃分，需要重新定義

**B. 權限系統整合**
- 現有 6 種權限未涵蓋新 ERP 頁面（報表/叫貨/退佣/品項成本/庫存）
- 新頁面對誰開放、誰可新增/修改/刪除，全部定義清楚
- 後台側邊欄新分組（門市 ERP）的可見性規則

**C. 來點什麼 ERP 語義澄清**
- 「客戶管理」= 加盟主管理，還是 B2B 客戶？點進去能做什麼？
- 「庫存管理」與「品項成本管理」如何聯動？
- 「進貨管理（叫貨）」是給宇聯自己的進貨管理（資產），要另外做嗎？
- 菜單管理是否需要，跟品項成本如何聯動？
- 供應商資料新增是要看到類似費用分析的商品？庫存管理要能連結看到聯動資料

**D. 模組管理更新**
- 系統管理的模組管理頁未新增今天加的新功能模組
- 新增：`daily_report_os` / `purchasing_os` / `rebate_os` / `products_os`

### 第二優先（兩方確次開發，設計確認後執行）

- **損益表**：整合日報 + 月報費用 + 退佣 → 每間店自動算損益
- **加盟主帳款**：週結帳款追蹤 → 銀行明細對帳 → 未收款提醒

### 第三優先（大永 ERP 後續，等蛋博確認）

- LIFF 正式 liffId 更新（蛋博建立正式 LIFF 後給 ID，程式只改一行）
- `dy_customers` 加 `lineUserId` 欄位（ALTER TABLE，migration script 框架已建）
- 積欠款 LINE 推播通知（cron 基礎已建，需實作發送邏輯）
- Portal 客戶重設密碼 email（Resend 架構已有，需完成）

### 第四優先：Make 自動化串接

- 門市自動報表 Webhook → 直接寫進 `os_daily_reports`（需先設定 SYNC_SECRET）
- 採購 importFromDamai → 不再走 Google Sheets

### 其他待確認（手機實測）

- 加盟詢問表單送出後，後台是否看得到記錄
- 手機後台側邊欄是否真的可以點選

---

## 技術債

- ⚠️ 大永 26 張 `dy_` 表不在 `schema.ts`，用 raw SQL 操作：`(db as any).$client.execute(...)`
- ⚠️ 來點什麼 ERP 的 `os_` 表也是 raw SQL，同上原因
- ⚠️ 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）

---

## 前端路由（完整清單）

### 品牌官網（來點什麼）
`/brand` / `/brand/story` / `/brand/stores` / `/brand/menu` / `/brand/news` / `/brand/contact` / `/brand/franchise`

### 集團官網（宇聯國際）
`/corporate` / `/corporate/about` / `/corporate/brands` / `/corporate/culture` / `/corporate/news` / `/corporate/news/:slug` / `/corporate/franchise` / `/corporate/contact`

### 電商購物
`/shop` / `/shop/category/:slug` / `/shop/product/:id` / `/shop/cart` / `/shop/checkout` / `/shop/order/:id` / `/shop/payment/:orderNumber` / `/shop/order-complete/:orderNumber` / `/shop/my-orders` / `/exclusive/:slug`（B2B 福委賣場）

### 認證 & 會員
`/login` / `/forgot-password` / `/reset-password/:token` / `/profile` / `/member/profile` / `/member/orders`

### 後台管理（/dashboard）
| 路徑 | 說明 |
|------|------|
| `/dashboard` | 智慧入口 |
| `/dashboard/admin/ecommerce` | AdminDashboard（商品總覽）|
| `/dashboard/admin/products` | 商品管理 |
| `/dashboard/admin/orders` | 訂單管理 |
| `/dashboard/admin/categories` | 分類管理 |
| `/dashboard/admin/users` | 用戶管理 |
| `/dashboard/admin/permissions` | 權限管理 |
| `/dashboard/admin/tenants` | 租戶管理 |
| `/dashboard/content` | 內容管理 |
| `/dashboard/content/new` | 新增文章 |
| `/dashboard/content/edit/:id` | 編輯文章 |
| `/dashboard/franchise-inquiries` | 加盟詢問 |
| `/dashboard/sop` | SOP 知識庫 |
| `/dashboard/repairs` | 設備報修 |
| `/dashboard/checklist` | 每日檢查表 |
| `/dashboard/ai-writer` | AI 文章助手 |
| `/dashboard/daily-report` | 門市日報（新）|
| `/dashboard/purchasing` | 叫貨管理（新）|
| `/dashboard/products` | 品項成本（新）|
| `/dashboard/rebate` | 退佣帳款（新）|

### 大永 ERP（/dayone）
`/dayone` / `/dayone/orders` / `/dayone/customers` / `/dayone/drivers` / `/dayone/products` / `/dayone/inventory` / `/dayone/purchase` / `/dayone/districts` / `/dayone/reports` / `/dayone/suppliers` / `/dayone/liff-orders` / `/dayone/ar` / `/dayone/dispatch` / `/dayone/purchase-receipts`

### 大永客戶 Portal（公開）
`/dayone/portal` / `/dayone/portal/login` / `/dayone/portal/register` / `/dayone/portal/orders` / `/dayone/portal/statement` / `/dayone/portal/account`

### 司機 App
`/driver` / `/driver/today` / `/driver/orders` / `/driver/order/:id` / `/driver/pickup` / `/driver/done` / `/driver/worklog` / `/driver/profile`

### LIFF（LINE 前台）
`/liff/order?tenant=dayone`

### Super Admin
`/super-admin/tenants` / `/super-admin/modules`

---

## 公開 Webhook Endpoints

| Endpoint | 說明 |
|----------|------|
| `POST /api/payment/callback` | 綠界 ECPay 付款回調 |
| `POST /api/dayone/line-order` | 大永 LINE@ 接單（Make → 後端）|
| `POST /api/ecpay/map-result` | 綠界超商選擇地圖回調 |
| `POST /api/ecpay/logistics-notify` | 綠界物流狀態通知 |

Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
SYNC_SECRET：`ordersome-sync-2026`（Make 推資料到 OrderSome API 驗證用）

---

## 大永蛋品業務背景

- 聯絡人：洪銘恆（蛋博）：0980190857，dayoneegg@gmail.com
- 地址：台中市西屯區西松巷 63-18 號
- 業務：雞蛋批發配送，台中區域，約 28 個行政區，D1/D2 兩條固定路線
- tenantId = 90004
- 蛋品 SKU：白大箱、白小箱、白紙、液白、液紙、粉蛋、紙蛋、液褐蛋、破蛋、洗選白帶裝、洗選白袋裝、洗選白盒裝、A液紙、鵝蛋、鴨蛋、水鴨蛋
- LIFF ID 現用：`2009700774-rWyJ27md`（測試用，等蛋博建立正式 LIFF 後更新）

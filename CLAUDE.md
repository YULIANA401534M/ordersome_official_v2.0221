# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

> **版本**：v5.11。**最後更新**：2026-04-18。**給 Claude 架構**：大覽（Claude.ai）+ 實作（Claude Code）

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

## 完成批次紀錄（累積）

### 2026-04-17 完成（第一~設計系統批）

**來點什麼 ERP（後台 /dashboard）**
- `os_daily_reports` 重建（generated columns：totalSales/guestTotal/avgPrice/productivity）
- `os_tw_holidays` 台灣假日表（2025/2026）
- `os_monthly_reports` 月報補充表（電費/水費/薪資/業績檢討/月計畫）
- 叫貨管理系統（`os_procurement_orders` / `os_procurement_items` / `os_supplier_line`）
- 廠商退佣自動計算（`os_rebate_records` / `os_payables`）
- 供應商與品項成本管理（`os_suppliers` / `os_products`）
- 路由：`/dashboard/daily-report` / `/dashboard/purchasing` / `/dashboard/products` / `/dashboard/rebate`

**設計系統**
- `DESIGN-dashboard.md` 建立、金萱字體、後台全域 CSS 變數
- `AdminDashboardLayout.tsx` 深暖棕側邊欄、側邊欄各組可收合
- `button.tsx` 立體陰影動效

### 2026-04-18 完成（第一批 0022 ～ 第四批 0025）

**第一批（0022）：模組管理補充**
- `drizzle/0022_os_erp_modules.sql` — module_definitions + tenant_modules 插入
- 新增：`daily_report_os` / `purchasing_os` / `rebate_os` / `products_os`（tenantId=1 預設開啟）
- `scripts/seed-os-erp-modules.mjs` 可手動執行

**第二批（0023）：角色擴充、用戶管理、權限管理**
- `drizzle/0023_role_and_permission_expansion.sql`
- `users.role` ENUM 新增 `store_manager`（現在共 8 種：super_admin / manager / franchisee / staff / store_manager / customer / driver / portal_customer）
- `users` 新增欄位：`has_procurement_access` TINYINT(1)、`last_login_at` TIMESTAMP
- 建立 `franchisee_feature_flags` 表（用戶功能開關）

**第三批（0024）：CA 表單數位化**
- `drizzle/0024_ca_menu_cost_tables.sql`
- `os_menu_items`（菜單品項主表，含分頁/售價/平台價）
- `os_menu_item_ingredients`（食材明細，連結 os_products）
- `os_oem_products`（OEM 品項，代工費/包材費/批價）
- `os_oem_ingredients`（OEM 原料明細）
- `os_cost_audit_log`（成本修改歷史，三表共用）

**第四批（0025）：加盟主管理頁**
- `drizzle/0025_franchisee_management.sql`
- `os_franchisee_contracts`（合約記錄，R2 URL + 簽約/到期日）
- `os_franchisee_payments`（帳款往來，receivable/paid）
- 前端：`OSCustomers.tsx`（加盟主管理頁）

### Migration 執行狀態

| 檔案 | 狀態 |
|------|------|
| `0022_os_erp_modules.sql` | ✅ 已執行（2026-04-18）|
| `0023_role_and_permission_expansion.sql` | ✅ 已執行（2026-04-18）|
| `0024_ca_menu_cost_tables.sql` | ✅ 已執行（2026-04-18）|
| `0025_franchisee_management.sql` | ✅ 已執行（2026-04-18）|

---

## Git 狀態（2026-04-18）

最後三個 commit（已 push）：
1. `785e825` — feat: 加盟主帳款系統 v1 2026-04-18
2. `200d595` — docs: CLAUDE.md v5.10 2026-04-18
3. `c6ec73e` — fix: 補上 cron 套件 2026-04-18

working tree: 只剩 `OSDelivery.tsx` / `OSPurchasing.tsx`（佔位殼）/ `package.json` / `pnpm-lock.yaml`（LF/CRLF）

---

## 後續事項

### Migration 標準驗證程序（每次必做）

執行任何 migration 後，**必須**用以下指令確認欄位真的存在於 TiDB，不能只看 SQL 跑完沒報錯：

```bash
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();
async function check() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname, port: parseInt(url.port)||4000,
    user: url.username, password: url.password,
    database: url.pathname.slice(1).split('?')[0],
    ssl: { rejectUnauthorized: false },
  });
  const [rows] = await conn.execute('DESCRIBE 表名');
  console.log(rows.map(r => r.Field).join(', '));
  await conn.end();
}
check().catch(console.error);
"
```

> **背景**：2026-04-18 因 0023 migration 未實際執行，TiDB 缺 `has_procurement_access` / `last_login_at` 兩欄，導致登入崩潰。SQL 跑完沒報錯不等於欄位已存在，必須 DESCRIBE 驗證。

---

### TiDB Migration 狀態

全部已執行完畢（0022 ～ 0025），無待辦。

### 第五批（損益儀表板）：✅ 已完成（cf4bb2a）
- `/dashboard/profit-loss`
- profitLoss router + OSProfitLoss.tsx

### 第六批（加盟主帳款週結）：✅ 已完成（785e825）
- `/dashboard/franchisee-payments`
- `server/routers/franchiseePayment.ts`（listPayments / createPayment / markPaid / exportPayments）
- `OSFranchiseePayments.tsx`（KPI 三卡片 / 明細表 / 週結摘要 / 新增帳款 / 標記已收款 / 匯出 Excel）
- DB：`os_franchisee_contracts` 加 `settlementCycle`；`os_franchisee_payments` 加 `isAutoGenerated` / `paidAt`

### 大永待辦（等蛋博確認）

- LIFF 正式 liffId（蛋博建立正式 LIFF 後給 ID，只改一行）
- 積欠款 LINE 推播通知（cron 基礎已建，需實作發送邏輯）
- Portal 客戶重設密碼 email（Resend 架構已有，需完成）
- `dy_customers` 加 `lineUserId` 欄位（`scripts/migrate-add-lineUserId.mjs` 已建）

### 技術債補強

- `has_procurement_access` 前端 any cast 補型別（`useAuth` User 型別正式擴充）
- 大永 26 張 `dy_` 表不在 `schema.ts`，用 raw SQL：`(db as any).$client.execute(...)`
- 來點什麼 ERP 的 `os_` 表也是 raw SQL，同上
- 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）

### Make 自動化串接

- 門市自動報表 Webhook → 直接寫進 `os_daily_reports`（SYNC_SECRET 已設）
- 採購 importFromDamai → 不再走 Google Sheets

### 已知佔位頁面與缺口（2026-04-18 掃描）

**佔位頁面（有路由但無實作）：**

| 路由 | 元件 | 狀態 |
|------|------|------|
| `/dashboard/delivery` | `OSDelivery.tsx` | 空殼，配送管理未開發 |
| `/dashboard/customers` | `ComingSoon` | 空殼，客戶管理未開發 |
| `/dashboard/scheduling` | `OSScheduling.tsx` | 空殼，排班管理未開發 |
| `/dashboard/accounting` | 無 Route | 側邊欄有連結但 App.tsx 完全沒有這條 Route |

**重複路由（需清理）：**
- `/dashboard/franchise` 在 App.tsx 重複定義兩次（`FranchiseDashboard` 和 `FranchiseDashboardPage`）

**加盟主入口未完成：**
- `/dashboard/franchise` → `FranchiseDashboard.tsx` 顯示「功能開發中」，加盟主完整功能（訂單/庫存/報表）尚未實作

---

## 技術債

- ⚠️ 大永 26 張 `dy_` 表不在 `schema.ts`，用 raw SQL 操作：`(db as any).$client.execute(...)`
- ⚠️ 來點什麼 ERP 的 `os_` 表也是 raw SQL，同上原因
- ⚠️ 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）

---

## R5 tRPC API 路由（server/routers.ts + server/routers/）

### admin（adminRouter — server/routers/admin.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `listUsers` | query | superAdminProcedure | 列出所有用戶 |
| `updateUserRole` | mutation | superAdminProcedure | 更新用戶角色 |
| `getAllFranchiseeFlags` | query | superAdminProcedure | 取得所有加盟主的 feature flags |
| `setFranchiseeFlag` | mutation | superAdminProcedure | 設定單一加盟主的功能開關 |
| `toggleProcurementAccess` | mutation | superAdminProcedure | 開關指定帳號的採購存取權 |

### profitLoss（profitLossRouter — server/routers/profitLoss.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `getProfitLoss` | query | adminProcedure | 取得指定門市指定月份的損益報表（日報加總 + 月報費用 + 退佣）|

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
| `/dashboard/ca-menu` | 菜單成本管理（新）|
| `/dashboard/profit-loss` | 損益儀表板（新）|
| `/dashboard/franchisee-payments` | 加盟主帳款（新）|

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

## 來點什麼採購流程背景

目前叫貨主流程（已跑兩個月，穩定運作）：
1. 加盟主 / 門市店長在大麥系統叫貨
2. 大麥系統寄送含 Excel 附件的 Email
3. Make 工作流一（統整）：解析 Excel → 彙整叫貨清單 → 寫入 `os_procurement_orders`
4. Make 工作流二（派發）：依廠商分組 → 推播 LINE 給對應供應商

OrderSome 的 `/dashboard/purchasing` 是這個流程的查看介面，
`importFromDamai` webhook 是 Make 寫入的端點。

加盟主帳款應收的來源 = 叫貨單確認出貨後自動產生，不是手動輸入。
`os_procurement_orders` 的 status 流程：
`pending → sent → confirmed → received`（可取消：`cancelled`）

---

## 大永蛋品業務背景

- 聯絡人：洪銘恆（蛋博）：0980190857，dayoneegg@gmail.com
- 地址：台中市西屯區西松巷 63-18 號
- 業務：雞蛋批發配送，台中區域，約 28 個行政區，D1/D2 兩條固定路線
- tenantId = 90004
- 蛋品 SKU：白大箱、白小箱、白紙、液白、液紙、粉蛋、紙蛋、液褐蛋、破蛋、洗選白帶裝、洗選白袋裝、洗選白盒裝、A液紙、鵝蛋、鴨蛋、水鴨蛋
- LIFF ID 現用：`2009700774-rWyJ27md`（測試用，等蛋博建立正式 LIFF 後更新）

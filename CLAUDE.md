# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

> **版本**：v5.28。**最後更新**：2026-04-18。**給 Claude 架構**：大覽（Claude.ai）+ 實作（Claude Code）

---

## 第一件事

拿到這份文件時，先執行：
```bash
git status && git log --oneline -3
```
確認 working tree clean、最新 commit 是今天的，再開始工作。

---

## 當前開發狀態（換對話框必讀）

> 最後更新：2026-04-18 v5.24。**新大腦進來請從這裡開始讀，不要跳過。**

### ⚠️ 開發守則（每次換對話框都要遵守）

1. 每次 commit 前**必須更新 CLAUDE.md**，反映最新完成項目和下一步
2. CLAUDE.md 是跨對話框的唯一記憶體，不更新等於下一個 Claude 失憶
3. 版本號每次 +0.01，格式 v5.XX

---

### 公司實際業務流程（大腦必讀）

**來點什麼採購主流程：**
加盟主/直營門市 → 大麥採購系統叫貨
↓
大麥系統自動寄 Excel 到 ordersome2020@gmail.com
↓
Make 統整工作流：Gmail 讀取 Excel → 解析品項 → 寫入 OrderSome 後台
↓ 依廠商類型分兩條路
[路線 A] 外部供應商品項（廣弘/裕展/韓濟/凱田/美食家/米谷等）
→ 叫貨管理（/dashboard/purchasing）自動 LINE 派發給廠商
→ 廠商出貨到宇聯倉庫 → 宇聯入庫 → 庫存增加
[路線 B] 宇聯自製/自配品項（supplierName = '宇聯_配合'）
→ 每周一早上，後台列印整周叫貨清單（/dashboard/purchasing 印單功能）
→ 物流去倉庫撿貨 → 司機送到各門市
→ 門市手機簽名確認收貨（/driver/ 或未來的門市 App）
→ 自動觸發：
① 加盟主應收帳款 +（/dashboard/franchisee-payments）
② 公司庫存 - 對應品項數量（/dashboard/inventory，含警戒機制）

**月底自動化目標（部分未完成）：**
- 應收帳款（加盟主）✅ 有頁面
- 應付帳款（外部供應商）⏳ 尚未建立
- 其他收入/支出（手動輸入）⏳ 尚未建立
- 月底自動損益表 ✅ /dashboard/profit-loss（目前手動觸發）

**庫存管理目標：**
- 叫貨收貨後自動更新庫存 ⏳ 尚未串接
- 庫存警戒：低於設定數量時通知補貨 ⏳ 尚未建立
- 退貨機制 ⏳ 尚未建立

**現在使用大麥採購系統（合約剩約一年），未來視情況開發自有採購前台。**

---

### 給新大腦的重要提醒

**郵件系統**：
- Railway 環境封鎖 SMTP 出口（IPv6 問題），nodemailer 無法連接 Gmail SMTP
- Resend 免費版只能寄到 verified email，無法寄到任意外部信箱
- 目前 `sendMail` 函數存在但實際不可用於生產環境
- 解決方案：未來需驗證自有網域（ordersome.com.tw）並用 Resend API
- 短期不要嘗試修復此問題，優先處理業務功能

**CA 表（菜單成本）**：
- `os_menu_items` 等 5 張表原本未執行 0024 migration
- 已於 2026-04-18 用 node script 補建，現在正常
- `/dashboard/ca-menu` 可正常使用

**連動關係（重要）**：
- 叫貨單（confirmed）→ 配送管理（新增派車單時可選關聯叫貨單，自動帶入品項）
- 配送管理簽收 → 自動產生 `os_franchisee_payments`（應收帳款）
- 應收帳款 → 損益儀表板（`arIncome` 欄位）
- 退佣 → 損益儀表板（`rebateIncome` 欄位）
- 加盟主管理頁 → 點「查看帳款往來」跳轉到帳款頁（帶 userId 篩選）

**宇聯總部 storeId = 401534**（機動人員排班用，不要改這個數字）

**下次換對話框前務必確認**：
1. `git status` clean
2. `pnpm run build` 零錯誤
3. CLAUDE.md 已更新版本號和 git 狀態

---

### 最新 Git 狀態（2026-04-18 v5.28）

最後三個 commit（已 push）：
1. `feat` — procurement import 改用 CSV 格式接收品項
2. `feat` — procurement import 自動對應品項單價 + 清理測試資料
3. `fix` — procurement import 移除不存在的 tenantId 欄位（os_procurement_items）

working tree: clean

**v5.28 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` 改用 CSV 格式接收品項
  - 原本接收 `items[]` 陣列，改為接收 `itemsCsv` 字串（避免 JSON 特殊字符問題）
  - 格式：每行一筆，欄位用 `|` 分隔：`supplierName|storeName|productName|unit|quantity|temperature`
  - endpoint 接收欄位：`{ secret, orderDate, orderNo?, itemsCsv }`

**v5.27 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` 自動從 `os_products` 查詢單價
  - items for loop 新增查詢 `os_products WHERE name = ?`，取得 `unitCost` → `unitPrice`
  - `amount = unitPrice * item.quantity`（無對應品項時 unitPrice=0）
  - INSERT 改帶入 `unitPrice` 和 `amount`
- DB：清除三筆測試空單（`os_procurement_orders` 刪 4 筆空 order，items 刪 0 筆）

**v5.26 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` items INSERT 移除不存在欄位
  - `os_procurement_items` 無 `tenantId` 欄位、無 `createdAt` 欄位，已從 INSERT 移除
  - `os_procurement_orders` 有 `tenantId`，orders INSERT 保留不動
  - SHOW COLUMNS 確認實際欄位：`id, procurementOrderId, supplierId, supplierName, storeName, productName, unit, quantity, unitPrice, amount, temperature, lineSent, lineSentAt`

**v5.25 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` 支援自動產生 orderNo
  - `orderNo` 改為 optional，未傳時自動產生 `DM-YYYYMMDD-{timestamp後6碼}`
  - 驗證邏輯調整：僅需 `orderDate` + `items[]`（`orderNo` 可省略）
  - 重複檢查：僅在有明確傳入 `orderNo` 時才執行略過邏輯
  - 回傳格式改為 `{ success, orderNo, orderId, itemCount }`
  - console.log 改為 `[Procurement Import] orderNo=..., items=...` 格式

**v5.24 完成項目：**
- `server/_core/index.ts`：品項 for loop 前加 `console.log("[Procurement Import] items received:", ...)` debug log
- `OSPurchasing.tsx`：orderDate 顯示改為 `?.slice(0, 10)`（相容 YYYY-MM-DD 與 ISO timestamp）
- `OSPurchasing.tsx`：品項展開時空陣列顯示「尚無品項記錄」而非空白
- DB：刪除 `os_procurement_orders id=1` 測試資料（items 已無殘留）

**v5.23 完成項目：**
- `server/_core/index.ts`：新增 `POST /api/procurement/import` 標準 REST endpoint
  - SYNC_SECRET 驗證
  - 重複 orderNo 自動略過
  - 插入 os_procurement_orders 主表 + os_procurement_items 品項
  - 廠商 id 自動從 os_suppliers 查找
  - 使用頂部已 import 的 `db.getDb()`（非動態 import）

**v5.22 完成項目：**
- `procurement.ts`：新增 `getSuppliers` procedure（adminProcedure，回傳 isActive=1 廠商列表）
- `OSPurchasing.tsx`：新增「手動補單」按鈕（outline variant，位於匯出 Excel 按鈕右側）
- 手動補單 Dialog：日期選擇 + 單號（自動產生 MAN-YYYYMMDD-xxx，可修改）+ 動態品項列表
  - 廠商欄位為下拉選單（從 getSuppliers 取得，確保名稱完全比對 os_suppliers.name）
  - 溫層下拉（常溫/冷藏/冷凍）
  - 呼叫 importFromDamai（secret hardcode，orderNo 重複自動 skip 不報錯）

---

### 已完成模組一覽（截至 2026-04-18）

| 路由 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| `/dashboard/profit-loss` | `OSProfitLoss.tsx` | ✅ 完成 | KPI 三卡片 + 費用明細 + canSeeCostModules 遮罩 |
| `/dashboard/franchisee-payments` | `OSFranchiseePayments.tsx` | ✅ 完成（有 TS 錯誤待修） | 應收管理 + 標記收款 + 週結摘要 + 匯出 Excel |
| `/dashboard/ca-menu` | `OSCaMenu.tsx` | ✅ 完成 | 菜單品項/OEM/成本歷史 三 Tab（DB 表於 2026-04-18 補建，現可正常使用）|
| `/dashboard/scheduling` | `OSScheduling.tsx` | ✅ 完成 | 早/晚/機動三 Tab + 假日標示 + 月統計 + Excel 匯出 |
| `/dashboard/delivery` | `OSDelivery.tsx` | ✅ 完成（有 TS 錯誤待修） | 派車單 + 狀態推進 + 簽收自動產生應收 |
| `/dashboard/franchisees` | `OSCustomers.tsx` | ✅ 完成 | 加盟主列表 + 功能開關 + 採購存取 + 新增帳號 |
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ✅ 完成 | KPI 卡片 + 叫貨單列表 + 詳情展開 + 新增 Dialog + LINE 推播 + 廠商 LINE 設定 + Excel 匯出 |
| `/dashboard/daily-report` | `OSDailyReport.tsx` | ✅ 完成 | 門市日報 |
| `/dashboard/products` | `OSProducts.tsx` | ✅ 完成 | 品項成本 |
| `/dashboard/rebate` | `OSRebate.tsx` | ✅ 完成 | 退佣帳款 |
| `/dayone/portal/forgot-password` | `DayonePortalForgotPassword.tsx` | ✅ 完成 | 改為顯示聯繫電話 0980-190-857，不走 email 流程 |

---

### 🔴 下一階段開發計畫（按優先順序）

#### ✅ 階段一：Debug — 已完成（2026-04-18）
修復了以下錯誤（非 TS7006 implicit any 的所有錯誤已清零，含 AdminPermissions TS7031）：
- `scheduling.ts` / `delivery.ts`：`db.execute(sql, params)` → `(db as any).$client.execute(sql, params)`
- `OSFranchiseePayments.tsx`：`isLoading` → `isPending`、`keepPreviousData` → `placeholderData`
- `OSProfitLoss.tsx`：`keepPreviousData` → `placeholderData`
- `OSDelivery.tsx`：`detail.items` → `detail?.items ?? []`
- `AdminDashboardLayout.tsx`：`listDispatchOrders` → `listDispatch`，補 `tenantId: 90004`
- `DayoneDashboard.tsx`：補 `tenantId: 90004`、`date` → `reportDate`
- `DayoneInventoryContent.tsx`：`safetyEdit` null → non-null assertion `!`
- `DriverOrders.tsx`：`dispatchItemId` → `itemId`，補正確欄位
- `DriverSign.tsx`：`base64/refId/refType/signerName` → `orderId/tenantId/imageBase64`
- `AdminOrders.tsx`：Set iteration 型別問題
- `BrandMenu.tsx`：`items` → `(items as any[])`
- `SOPKnowledgeBase.tsx`：`d` → `(d: any)`
- `server/db.ts`：`_db` 型別 → `any`

#### ✅ 階段二：進銷存重建 — OSPurchasing.tsx（已完成，2026-04-18）
**目標**：把 `/dashboard/purchasing` 從大永殼換成來點什麼自己的採購介面

後端 `procurement` router 已有完整 7 個 procedure：
- `list`：列出叫貨單（可篩日期/狀態）
- `create`：手動建立叫貨單
- `getDetail`：叫貨單 + 品項明細
- `updateStatus`：pending → sent → confirmed → received / cancelled
- `groupBySupplier`：依廠商分組顯示
- `pushToLine`：推播給廠商 LINE
- `supplierLineList` / `supplierLineUpsert`：廠商 LINE 管理
- `importFromDamai`：Make Webhook 匯入（已有，publicProcedure）

前端需要的功能：
1. 叫貨單列表（KPI 卡 + 篩選 + 狀態 Badge）
2. 叫貨單詳情 Dialog（品項明細 + 狀態推進按鈕）
3. 手動建立叫貨單 Dialog
4. 依廠商分組 Tab 或視圖
5. Excel 匯出

#### 階段三：帳務系統補強（待確認）
**目標**：帳務批次匯入，但使用者有非常多種 Excel 格式，需先討論確認範圍再動工。
- 暫緩，等使用者確認最急用的帳務類型與 Excel 欄位格式後再開始

#### 階段四：排班假日標示補完（小型，可立即開始）
- `OSScheduling.tsx` 已呼叫 `dailyReport.getHolidaysByMonth`，後端 procedure 需確認存在
- 若不存在需新增：input `{ year, month }`，回傳該月所有假日日期陣列

---

### 待處理清單（P1 全部完成，現在執行上方階段計畫）

**P2 — 需要外部確認後才能做**

1. **大永 LIFF 正式 liffId**（等蛋博用自己的 LINE 後台建立）
   建立後只需改 `client/src/pages/liff/LiffOrder.tsx` 的 `TENANT_CONFIG dayone.liffId` 一行

2. **大永積欠款 LINE 推播邏輯補完**
   cron 基礎已建（`server/_core/index.ts`），每小時整點執行
   等蛋博確認 `dy_settings` 的 `overdue_push_enabled` / `overdue_push_hour` 設定值

3. ✅ **已關閉：Portal 忘記密碼改為顯示聯繫電話**（0980-190-857）
   email 重設密碼功能暫不實作。原因：
   - 大永客戶 90% 用 LINE 登入，忘記密碼情境極少
   - Railway 環境封鎖 SMTP 出口（IPv6 問題），nodemailer 無法連接 Gmail SMTP
   - 蛋博可直接後台協助重設密碼
   - 頁面改為直接顯示聯繫電話，點擊可撥打（commit 即將 push）

**P3 — 設計討論後才能做**

4. **Make 串接實測**（endpoint 已建，需在 Make 建立 HTTP module）
5. **智慧排班 v2**（需 2-3 個月歷史資料後才有意義）
6. **來點什麼客戶管理**（業務邏輯待確認）

**技術債**

- 大永 / 來點什麼 ERP 的表不在 `schema.ts`，用 raw SQL
- 本機菜單圖未遷移 R2
- chunk size 超標（index.js 6141 kB），需 code splitting
- `ContentEditor.tsx` / `ContentManagement.tsx`：`post.category` 和 `post.scheduledAt` 用 `as any` cast，後端型別未完整宣告（低優先級）

---

### 重要常數（開發時用）

| 常數 | 值 | 說明 |
|------|----|------|
| `HQ_STORE_ID` | `401534` | 宇聯總部 storeId，機動人員用 |
| `SYNC_SECRET` | `ordersome-sync-2026` | Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004` | 大永蛋品 tenantId |
| `OS_TENANT_ID` | `1` | 來點什麼 tenantId |
| `GMAIL_APP_PASSWORD` | Railway 已設定 | 但 SMTP 出口被 Railway 封鎖（IPv6），sendMail 目前實際不可用 |

---

### 已知佔位頁面（尚未實作）

| 路由 | 元件 | 狀態 |
|------|------|------|
| `/dashboard/customers` | `ComingSoon` | 客戶管理，業務邏輯待確認 |
| `/dashboard/franchise` | `FranchiseDashboardPage` | 加盟主入口，部分功能未完成 |

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
- ⚠️ **0024 migration 當時未實際建立 DB 表**，於 2026-04-18 健康檢查時發現並補建，現已全部 ✅ 存在

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
| `0024_ca_menu_cost_tables.sql` | ✅ 已執行（SQL），但 DB 表未實際建立；2026-04-18 補建完成 ✅ |
| `0025_franchisee_management.sql` | ✅ 已執行（2026-04-18）|

---

## Git 狀態（2026-04-18 v5.14 更新）

最後三個 commit（已 push）：
1. `67feed7` — feat: 加盟主管理頁 v1 2026-04-18
2. `b1b3c32` — feat: 0026 SQL + 假日批次查詢 + OSScheduling 標示 2026-04-18
3. `fdc8216` — docs: CLAUDE.md v5.12 2026-04-18

working tree: clean

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

0022 ～ 0025 全部已執行完畢。

⚠️ **Migration 0026 待補建**：四張新表（`os_schedule_templates` / `os_schedules` / `os_delivery_orders` / `os_delivery_items`）已用 node script 直接建立於 TiDB，但尚未建立對應的 `drizzle/0026_scheduling_delivery.sql`。下次開 session 前需補建此檔案作為版本記錄。

✅ **假日標示**：`OSScheduling.tsx` 已呼叫 `dailyReport.getHolidaysByMonth`，假日欄位正常顯示（紅底色）。

### 第五批（損益儀表板）：✅ 已完成（cf4bb2a）
- `/dashboard/profit-loss`
- profitLoss router + OSProfitLoss.tsx

### 第六批（加盟主帳款週結）：✅ 已完成（785e825）
- `/dashboard/franchisee-payments`
- `server/routers/franchiseePayment.ts`（listPayments / createPayment / markPaid / exportPayments）
- `OSFranchiseePayments.tsx`（KPI 三卡片 / 明細表 / 週結摘要 / 新增帳款 / 標記已收款 / 匯出 Excel）
- DB：`os_franchisee_contracts` 加 `settlementCycle`；`os_franchisee_payments` 加 `isAutoGenerated` / `paidAt`

### 第八批（Bug 修復 + OSPurchasing 重建）：✅ 已完成（2026-04-18，489bada）

- `App.tsx`：路由改接 `OSPurchasing`（舊 `OSProcurement` 殼已棄用）
- `OSPurchasing.tsx`：完整重建，KPI 卡片 / 月份切換 / 叫貨單列表展開 / 狀態推進 / LINE 推播 / 廠商 LINE 設定 / 新增叫貨單 Dialog / Excel 匯出
- `OSDelivery.tsx` / `OSPurchasing.tsx` / `OSScheduling.tsx`：SelectItem `value=""` 崩潰全修（改 `"all"` / `"none"`）
- `OSScheduling.tsx`：空狀態畫面補 Dialog，新增員工按鈕現可正常使用
- `AdminPermissions.tsx`：TS7031 binding element any 補型別

### 第七批（排班 + 配送 + 路由清理）：✅ 已完成（22f9956）

**路由清理**
- 刪除重複 `/dashboard/franchise`（舊 `FranchiseDashboard` import + route）
- `/dashboard/delivery` 從 `ComingSoon` 改接 `OSDelivery`
- 帳務管理選單項目加 `superAdminOnly: true`，manager 不可見
- 宇聯總部 `storeId = 401534`（`stores` 表，`tenantId=1`）貫穿所有後端

**排班管理 v1**
- `server/routers/scheduling.ts`（7 個 procedure：listTemplates / upsertTemplate / deleteTemplate / listSchedules / upsertSchedule / batchUpsertSchedules / getMonthSummary）
- `OSScheduling.tsx`：早班 / 晚班 / 機動人員三 Tab、點格子編輯（Popover）、月統計表、員工設定 Drawer、Excel 匯出
- DB：`os_schedule_templates`（員工班別主表）+ `os_schedules`（每日班表，UNIQUE: tenantId+storeId+employeeName+scheduleDate）

**配送管理 v1**
- `server/routers/delivery.ts`（5 個 procedure：listDeliveryOrders / getDeliveryDetail / createDeliveryOrder / updateStatus / getMonthStats）
- `OSDelivery.tsx`：月統計 KPI 卡片、派車單卡片列表可展開、狀態依序推進（pending→picking→dispatched→delivered→signed）、簽收時自動計算批價金額並寫入 `os_franchisee_payments`、新增派車單 Dialog
- DB：`os_delivery_orders`（派車單主表，deliveryNo 自動產生：`DO-YYYYMMDD-001`）+ `os_delivery_items`（品項明細）

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

### 已知佔位頁面與缺口（2026-04-18 更新）

**佔位頁面（有路由但無實作）：**

| 路由 | 元件 | 狀態 |
|------|------|------|
| `/dashboard/customers` | `ComingSoon` | 空殼，客戶管理未開發 |
| `/dashboard/accounting` | `ComingSoon` | 帳務管理，superAdminOnly，範圍待確認 |

**路由已確認正常（之前疑慮已解除）：**
- `/dashboard/inventory` → `OSInventory`（App.tsx line 240，✅ 有對應元件）

**加盟主入口未完成：**
- `/dashboard/franchise` → `FranchiseDashboardPage.tsx` 顯示「功能開發中」，加盟主完整功能（訂單/庫存/報表）尚未實作

---

## 技術債

- ⚠️ 大永 26 張 `dy_` 表不在 `schema.ts`，用 raw SQL 操作：`(db as any).$client.execute(...)`
- ⚠️ 來點什麼 ERP 的 `os_` 表也是 raw SQL，同上原因
- ⚠️ 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）
- ⚠️ 叫貨收貨→退佣自動計算：設計暫緩，退佣規則複雜（廣弘10.71%/伯享差價/韓濟抵貨），目前手動月結，待實際使用後確認自動化需求
- ⚠️ `ContentEditor.tsx` / `ContentManagement.tsx`：`post.category` 和 `post.scheduledAt` 用 `as any` cast，後端 content router 型別未正式宣告這兩欄（低優先級）

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

### scheduling（schedulingRouter — server/routers/scheduling.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `listTemplates` | query | adminProcedure | 列出員工班別範本（可篩門市）|
| `upsertTemplate` | mutation | adminProcedure | 新增 / 更新員工班別範本 |
| `deleteTemplate` | mutation | adminProcedure | 停用員工班別範本（isActive=0）|
| `listSchedules` | query | adminProcedure | 列出指定月份班表（可篩門市）|
| `upsertSchedule` | mutation | adminProcedure | 新增 / 更新單格班表（ON DUPLICATE KEY UPDATE）|
| `batchUpsertSchedules` | mutation | adminProcedure | 批次寫入班表 |
| `getMonthSummary` | query | adminProcedure | 月統計（出勤/例休/事假/公假/曠職/加班/總工時）|

### delivery（deliveryRouter — server/routers/delivery.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `listDeliveryOrders` | query | adminProcedure | 列出指定月份派車單（可篩門市/狀態）|
| `getDeliveryDetail` | query | adminProcedure | 取得派車單 + 品項明細 |
| `createDeliveryOrder` | mutation | adminProcedure | 建立派車單（deliveryNo 自動產生 DO-YYYYMMDD-001）|
| `updateStatus` | mutation | adminProcedure | 狀態依序推進；簽收時自動計算批價金額並寫入 `os_franchisee_payments` |
| `getMonthStats` | query | adminProcedure | 月統計（各門市派車數 / 已簽收金額 / 待簽收金額）|

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
| `/dashboard/scheduling` | 排班管理（新，已完成）|
| `/dashboard/delivery` | 配送管理（新，已完成）|

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

# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

業務邏輯請讀 BUSINESS.md，技術參考請讀 CLAUDE_REFERENCE.md，歷史記錄請讀 DEVELOPMENT_LOG.md

> **版本**：v5.54。**最後更新**：2026-04-19。**給 Claude 架構**：大覽（Claude.ai）+ 實作（Claude Code）

---

## 第一件事

拿到這份文件時，先執行：
```bash
git status && git log --oneline -3
```
確認 working tree clean、最新 commit 是今天的，再開始工作。

---

## 當前開發狀態（換對話框必讀）

### ⚠️ 開發守則

1. 每次 commit 前**必須更新 CLAUDE.md**，反映最新完成項目和下一步
2. CLAUDE.md 是跨對話框的唯一記憶體，不更新等於下一個 Claude 失憶
3. 版本號每次 +0.01，格式 v5.XX
4. 零 TS 錯誤才 commit

---

### 開發原則（永久有效，每次換對話框必讀）

1. **RWD 優先**：所有頁面必須支援手機、平板、桌機，表格在手機上要能橫向捲動，文字必須清晰可讀
2. **模組完整性**：每個功能模組必須包含列表、新增、修改、詳情/明細、刪除（super_admin）或作廢（manager）
3. **資料關聯**：跨模組資料必須有 DB 層級關聯（JOIN 或外鍵），不能只靠前端組合
4. **稽核追蹤**：所有刪除寫 os_audit_logs（快照+原因），所有修改寫快照，os_inventory 異動寫 os_inventory_logs
5. **防重複**：所有匯入功能必須有唯一鍵防重複，匯入後輸出驗證報告（成功N筆/失敗N筆/原因）
6. **命名規則**：品項正式名稱存 os_products.name，外部系統名稱（大麥等）存 aliases JSON 陣列
7. **可修改性**：所有業務規則（B類廠商清單、退佣比率等）存 DB 不寫死在程式碼
8. **不動範圍**：大永 ERP（/dayone） + server/_core/ 不動

---

### 最新 Git 狀態（2026-04-19 v5.54）

最後三個 commit（已 push）：
1. `6ac2a05` — docs: CLAUDE.md v5.54
2. `73864a0` — feat: v5.54 派車單重構 — 從叫貨單自動建立、中文狀態按鈕、URL參數跳轉
3. `10023c6` — feat: v5.53 OSPurchasing 月份切換移除 + 標題 + badge 簡化 + storeName 原樣

working tree: clean

---

### 已完成模組一覽

| 路由 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ✅ | 叫貨管理，Make串接，Excel匯入，撿貨單列印 |
| `/dashboard/inventory` | `OSInventory.tsx` | ✅ | 庫存管理，B類，批次盤點，安全庫存 |
| `/dashboard/products` | `OSProducts.tsx` | ✅ | 品項成本，326筆，兩層分類，毛利率計算 |
| `/dashboard/ca-menu` | `OSCaMenu.tsx` | ✅ | 菜單成本管理（0024表已補建） |
| `/dashboard/delivery` | `OSDelivery.tsx` | ✅ | 配送管理，從叫貨單建立，簽收扣庫存 |
| `/dashboard/accounting` | `OSAccounting.tsx` | ✅ | 帳務管理，四Tab（應付/銀行對帳/退佣/提貨調貨） |
| `/dashboard/franchisee-payments` | `OSFranchiseePayments.tsx` | ✅ | 加盟主帳款，週結，匯出Excel |
| `/dashboard/rebate` | `OSRebate.tsx` | ✅ | 退佣帳款 |
| `/dashboard/profit-loss` | `OSProfitLoss.tsx` | ✅ | 損益儀表板，KPI三卡片 |
| `/dashboard/scheduling` | `OSScheduling.tsx` | ✅ | 排班管理，假日標示，月統計 |
| `/dashboard/daily-report` | `OSDailyReport.tsx` | ✅ | 門市日報 |
| `/dashboard/franchisees` | `OSCustomers.tsx` | ✅ | 加盟主列表，功能開關，採購存取 |
| `/dashboard/customers` | `ComingSoon` | ⏳ | 客戶管理，未開發 |
| `/dayone/portal/forgot-password` | `DayonePortalForgotPassword.tsx` | ✅ | 顯示聯繫電話 0980-190-857 |

---

### 下一步待辦

#### 明天立刻要做
- [ ] 從採購取得 3/31 盤點 Excel → 傳給大腦 → 出匯入腳本
- [ ] 測試派車單：叫貨單建立派車單 → 推進到 signed → 確認庫存減少
- [ ] 從大麥匯出各門市 4/1 到今天歷史訂單 Excel

#### 本週內
- [ ] 盤點資料匯入（庫存基準點，os_inventory.currentQty = 盤點數量，lastCountDate='2026-03-31'）
- [ ] 歷史訂單批次匯入（4/1後B類自動觸發庫存）
- [ ] 退佣規則實際測試（廣弘3月份數字驗算）
- [ ] 排班管理：新增員工後測試功能

#### 之後
- [ ] BOM 物料清單（os_bom 表，開工條件：採購資料穩定且 os_products 成本準確）
- [ ] 全系統 RWD 審查（所有頁面手機版）
- [ ] 客戶管理 /dashboard/customers

---

### 給新大腦的重要提醒

**郵件系統**：
- Railway 封鎖 SMTP 出口（IPv6 問題），nodemailer 無法連接 Gmail SMTP
- 短期不要嘗試修復，優先處理業務功能

**CA 表（菜單成本）**：
- `os_menu_items` 等 5 張表原本未執行 0024 migration
- 已於 2026-04-18 用 node script 補建，現在正常

**連動關係（重要）**：
- 叫貨單（confirmed）→ 配送管理（新增派車單時可選關聯叫貨單，自動帶入品項）
- 配送管理簽收 → 自動產生 `os_franchisee_payments`（應收帳款）
- 應收帳款 → 損益儀表板（`arIncome` 欄位）
- 退佣 → 損益儀表板（`rebateIncome` 欄位）
- 加盟主管理頁 → 點「查看帳款往來」跳轉到帳款頁（帶 userId 篩選）
- **叫貨單（received）→ 查 `os_suppliers.deliveryType='yulian'`（用 os_procurement_items 的 supplierName 查）→ 寫 `os_inventory`（changeType='in'）+ `os_inventory_logs`**
- **配送派車單（signed）→ JOIN os_inventory + os_suppliers 確認 B類品項 → 寫 `os_inventory`（currentQty-，不低於0）+ `os_inventory_logs(out)`**

**宇聯總部 storeId = 401534**（機動人員排班用，不要改這個數字）

**B類廠商清單（deliveryType='yulian'）**：現有5筆：宇聯_配合/宇聯/立墩/三柳/凱蒂

**下次換對話框前務必確認**：
1. `git status` clean
2. `pnpm run build` 零錯誤
3. CLAUDE.md 已更新版本號和 git 狀態

---

### 資料整合規劃

**基準點：2026-03-31 全宇聯資產盤點**
- 盤點資料格式待確認（4/19 從採購取得）
- 匯入後：os_inventory.currentQty = 盤點數量，lastCountDate = '2026-03-31'

**歷史訂單匯入（大麥 Excel 格式）**
- 欄位對應：訂單編號→orderNo, 供應商→supplierName, 訂購店家→storeName, 商品名稱→productName, 計價單位→unit, 計價數量→quantity, 進貨價→unitPrice, 溫層→temperature, 訂單日期→orderDate
- 防重複：以訂單編號（orderNo）為唯一鍵，重複略過
- B類叫貨單匯入後：3月以前只記帳不觸發庫存，4/1後觸發庫存入庫
- 匯入工具路徑：/dashboard/purchasing → 「匯入 Excel」按鈕

**大麥 vs 系統品名對照**
- 大麥品名格式：「勁辣雞腿排(特大)_10片*8包/箱」
- CA表品名格式：「東豪-勁辣雞腿(特大)10片/包」
- 匯入時：先比對 name，找不到比對 aliases，都找不到建立新品項並 flag 待確認（needsReview=1）
- 品名統一需等大麥歷史訂單匯入後，以實際大麥品名建立 aliases 對照

---

### 待完成功能清單

**P1 本週：**
- [ ] 3/31 盤點資料匯入庫存（4/19 取得資料後執行）

**P2 之後：**
- [ ] 全系統 RWD 審查（所有頁面手機版）
- [ ] 歷史資料批次匯入工具（銀行明細、日記帳）
- [ ] 退佣自動計算（廣弘10.71%、伯享差價、韓濟抵貨款）
- [ ] BOM 物料清單（os_bom 表，開工條件：採購資料穩定且 os_products 成本準確）

**P3 等外部配合：**
- [ ] 大永 LIFF 正式 liffId（等蛋博）
- [ ] 積欠款 LINE 推播

---

### 重要常數（開發時用）

| 常數 | 值 | 說明 |
|------|----|------|
| `HQ_STORE_ID` | `401534` | 宇聯總部 storeId，機動人員用 |
| `SYNC_SECRET` | `ordersome-sync-2026` | Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004` | 大永蛋品 tenantId |
| `OS_TENANT_ID` | `1` | 來點什麼 tenantId |
| `GMAIL_APP_PASSWORD` | Railway 已設定 | SMTP 出口被封鎖，sendMail 實際不可用 |

---

### 系統架構總覽（2026-04-19 定案）

**多租戶架構**
```
宇聯國際（母公司）
├── 來點什麼（tenantId=1）：早午餐連鎖，13間門市
└── 大永蛋品（tenantId=90004）：付費SaaS客戶

來點什麼 ERP 模組：
採購庫存（叫貨/庫存/品項）/ 帳務財務（帳務/退佣/損益）/ 門市作業（日報/排班/配送）
```

**技術棧快查**

| 層次 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 路由 | Wouter 3 |
| 狀態管理 | TanStack Query v5 + Zustand 5 |
| UI 元件 | shadcn/ui（Radix UI）+ Tailwind CSS 4 |
| 後端框架 | Express 4 |
| API 層 | tRPC 11 |
| ORM | Drizzle ORM（MySQL 方言）|
| 資料庫 | TiDB Cloud（MySQL 相容）|
| 圖檔儲存 | Cloudflare R2 |
| 金流 | 綠界（ECPay）|
| 自動化 | Make（Webhook/Scenario）|

**設計系統**
- 底色：暖灰 `#f7f6f3`，主色：amber `#b45309`
- 側邊欄背景：`#1c1917`（深暖棕）
- KPI 字體：金萱 jf-kamabit

---

### 帳務流程（定案）

**退佣計算**
- 廣弘：叫貨總金額 ÷ 1.12 = 未稅金額，差額 = 退佣
- 伯享：（系統銷價 - 宇聯成本價）× 數量 = 退佣
- 韓濟：同伯享計算，但退佣直接抵當月貨款

**月底對帳流程**
- 月結時間不固定，由會計彈性安排
- 宇聯：每週匯款支出，整理銀行明細建憑證給事務所
- 雙月整理發票給事務所

**加盟主帳款（週結：加盟主付給宇聯）**
- 配送簽收後自動產生 os_franchisee_payments

---

### 權限與稽核規則（永久有效，不得移除）

| 角色 | 刪除 | 作廢 | 修改 | 新增 |
|------|------|------|------|------|
| super_admin | 可以（必填原因，寫 audit log） | 可以 | 可以 | 可以 |
| manager | 不行 | 可以（必填原因） | 可以（寫快照） | 可以 |

所有刪除和修改寫 os_audit_logs，os_audit_logs 不可被刪除。

---

### 品項命名規範（永久有效）

**命名格式**：品名_規格/計價單位（廠商資訊只存 supplierName 欄位，不放品名裡）
**範例**：勁辣雞腿排(特大)_10片*8包/箱 / 壽司米_30KG/袋
**別名（aliases）**：外部系統名稱（大麥、CA表原始名）存 JSON 陣列

**兩層分類**：category1（冷凍食材/韓國食材/乾貨類 等）/ category2（由 os_product_categories 管理）

---

### 庫存範圍規範

- B類廠商（deliveryType='yulian'）：記宇聯總倉庫存，存 os_inventory
- A類廠商（deliveryType='direct'）：直送各門市，無庫存壓力，但需記帳（os_payables）
- 門市庫存：未來規劃，暫不實作

---

### 技術債

- `has_procurement_access` 前端 any cast 補型別（`useAuth` User 型別正式擴充）
- 大永/來點什麼 ERP 的 `dy_`/`os_` 表不在 `schema.ts`，用 raw SQL
- 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）
- chunk size 超標（index.js 6266 kB），需 code splitting

---

### Migration 標準驗證程序（每次必做）

執行任何 migration 後，**必須** DESCRIBE 確認欄位真的存在於 TiDB：
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

> **背景**：2026-04-18 因 0023 migration 未實際執行，TiDB 缺 `has_procurement_access` / `last_login_at` 兩欄，導致登入崩潰。SQL 跑完沒報錯不等於欄位已存在。

---

### 大永待辦（等蛋博確認）

- LIFF 正式 liffId（蛋博建立後只改 `client/src/pages/liff/LiffOrder.tsx` 一行）
- 積欠款 LINE 推播通知（cron 基礎已建，需實作發送邏輯）
- Portal 客戶重設密碼 email（需驗證自有網域後使用 Resend）

---

### Make 自動化串接

- 門市自動報表 Webhook → 直接寫進 `os_daily_reports`（SYNC_SECRET 已設）
- 採購 importFromDamai → 不再走 Google Sheets
- Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
- SYNC_SECRET：`ordersome-sync-2026`

---

### tRPC Procurement Router 完整 Procedures（截至 v5.54）

- `list` / `create` / `getDetail` / `updateStatus` / `groupBySupplier`
- `pushToLine` / `supplierLineList` / `supplierLineUpsert` / `getSuppliers`
- `deleteOrder`（superAdmin） / `batchDeleteOrders`（superAdmin） / `updateNote`
- `updateItem` / `addItem` / `listStoreNames` / `listSupplierNames`
- `getPickList` / `markPrinted` / `importFromDamai`（public） / `importFromDamaiExcel`
- `listNeedsReview`

### tRPC Delivery Router 完整 Procedures

- `listDeliveryOrders` / `getDeliveryDetail` / `createDeliveryOrder`
- `createFromProcurement` / `updateStatus` / `getMonthStats`

---

## 專案基本資訊

- **網址**：https://ordersome.com.tw
- **部署**：Railway（自動 CI/CD，push 後 2-3 分鐘生效）
- **資料庫**：TiDB Cloud（MySQL 相容）
- **套件管理**：pnpm 10
- **Git 規則**：commit 只用 `git add 指定檔案`，絕不用 `git add -A`

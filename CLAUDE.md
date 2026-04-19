# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

業務邏輯請讀 BUSINESS.md，技術參考請讀 CLAUDE_REFERENCE.md，歷史記錄請讀 DEVELOPMENT_LOG.md

> **版本**：v5.56。**最後更新**：2026-04-19。
> **給 Claude 架構**：大腦（Claude.ai）+ 手腳（Claude Code）

---

## 第一件事

拿到這份文件時，先執行：
```bash
git status && git log --oneline -3
```
確認 working tree clean、最新 commit 是今天的，再開始工作。

---

## 開發守則（每次換對話框必讀）

1. 每次 commit 前**必須更新 CLAUDE.md**，版本號 +0.01
2. CLAUDE.md 是跨對話框的唯一記憶體，不更新等於下一個 Claude 失憶
3. 版本號格式 v5.XX
4. 零 TS 錯誤才 commit

---

## 開發原則（永久有效）

1. **RWD 優先**：手機/平板/桌機，表格橫向捲動
2. **模組完整性**：列表、新增、修改、詳情、刪除（super_admin）或作廢（manager）
3. **資料關聯**：跨模組必須有 DB 層級關聯，不能只靠前端組合
4. **稽核追蹤**：所有刪除寫 os_audit_logs（快照+原因），庫存異動寫 os_inventory_logs
5. **防重複**：所有匯入必須有唯一鍵防重複，匯入後輸出驗證報告
6. **命名規則**：品項正式名稱存 os_products.name，外部系統名稱存 aliases JSON 陣列
7. **可修改性**：所有業務規則存 DB 不寫死程式碼
8. **不動範圍**：大永 ERP（/dayone） + server/_core/ 不動

---

## 當前開發狀態（換對話框必讀）

### 最新 Git 狀態（2026-04-19 v5.56）

最後三個 commit：
1. `dcb0f48` — feat: v5.56 叫貨管理刪除按鈕擴展至sent + 大麥244筆品項匯入 + CLAUDE.md v5.56
2. `f251968` — feat: v5.55 派車單簽收userId null修正 + 帳務手動新增應付帳款 + 庫存異動歷史查詢
3. `10023c6` — fix: 叫貨管理五項修正

working tree: clean

### 已完成模組

| 路由 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ✅ | 叫貨管理，Make串接，Excel匯入，撿貨單列印，排序 |
| `/dashboard/inventory` | `OSInventory.tsx` | ✅ | 庫存管理，B類，批次盤點，異動歷史 |
| `/dashboard/products` | `OSProducts.tsx` | ✅ | 品項成本，大麥244筆已匯入（共567筆），兩層分類 |
| `/dashboard/ca-menu` | `OSCaMenu.tsx` | ✅ | 菜單成本管理 |
| `/dashboard/delivery` | `OSDelivery.tsx` | ✅ | 配送管理，從叫貨單建立，簽收扣庫存 |
| `/dashboard/accounting` | `OSAccounting.tsx` | ✅ | 帳務管理，四Tab，手動新增應付 |
| `/dashboard/franchisee-payments` | `OSFranchiseePayments.tsx` | ✅ | 加盟主帳款 |
| `/dashboard/rebate` | `OSRebate.tsx` | ✅ | 退佣帳款 |
| `/dashboard/profit-loss` | `OSProfitLoss.tsx` | ✅ | 損益儀表板 |
| `/dashboard/scheduling` | `OSScheduling.tsx` | ⚠️ | 排班管理，需先新增員工資料 |
| `/dashboard/daily-report` | `OSDailyReport.tsx` | ✅ | 門市日報 |
| `/dashboard/franchisees` | `OSCustomers.tsx` | ✅ | 加盟主列表，功能開關，採購存取 |
| `/dashboard/customers` | `ComingSoon` | ⏳ | 客戶管理，未開發 |
| `/dayone/portal/forgot-password` | `DayonePortalForgotPassword.tsx` | ✅ | 顯示聯繫電話 0980-190-857 |

---

## 待完成功能清單

### 主線任務（採購系統對齊大麥）

**P1 本週：**
- [ ] 3/31 盤點資料匯入（等採購提供 Excel）
  格式需求：廠商、品名、單位、數量
- [ ] 大麥歷史叫貨訂單匯入（各門市 4/1 到今天）
  從大麥後台匯出各門市 Excel，每間一份
- [ ] 廠商/供應商對帳 89772 筆匯入（從大麥匯出 xls）
  → 對應 os_payables 歷史應付帳款
- [ ] 採購出貨管理 11112 筆匯入（從大麥下載 Excel）
  → 對應 os_procurement_orders 歷史叫貨記錄

**P2 本月：**
- [ ] 客戶/分店資料 14 筆（手動新增或腳本匯入）
  從大麥截圖可看到：OS014西屯福上/OS013瀋陽梅川/OS012北屯昌平/OS011草屯中山等
- [ ] 報價單功能（哪些店看哪些價格）
- [ ] 派車單統整列印（跨門市合併撿貨單）
- [ ] 銀行明細多格式支援（目前只有台新格式）

**P3 之後：**
- [ ] BOM 物料清單（開工條件：採購資料穩定 + os_products 成本準確）
- [ ] 大永 LIFF 正式 liffId（等蛋博）
- [ ] 全系統 RWD 審查
- [ ] 排班管理員工資料匯入

---

## 需要 Leo 提供的資料清單

以下資料需要 Leo 從大麥匯出後傳給大腦（Claude.ai），
大腦解析格式後出匯入腳本，手腳執行：

| 資料 | 從哪裡匯出 | 格式 | 用途 |
|------|----------|------|------|
| 3/31 盤點資料 | 採購人員提供 | Excel（廠商/品名/單位/數量） | 庫存基準點 |
| 各門市歷史叫貨 4/1-今天 | 大麥→網站訂單管理 | Excel（每門市一份） | 歷史叫貨記錄 |
| 廠商對帳報表 | 大麥→廠商/供應商管理→廠商對帳→匯出 | xls/xlsx | 歷史應付帳款 |
| 採購出貨管理 | 大麥→進出貨管理→採購出貨管理→下載報表 | Excel | 歷史進出貨記錄 |
| 客戶/分店資料 | 大麥截圖已有，手動新增或腳本 | 手動 | 門市基本資料 |
| 銀行明細（最新） | 台新銀行網銀匯出 | xlsx | 銀行對帳 |

---

## 重要業務邏輯（永久有效）

### 供應商分類
- **A類（直送）**：廣弘/凱田/韓濟/米谷/裕展/美食家等
  叫貨單 received → 只記應付帳款，不記庫存
- **B類（自配）**：宇聯/宇聯_配合/立墩/三柳/凱蒂
  叫貨單 received → 庫存增加 + 應付帳款
  派車單 signed → 庫存減少 + 應收帳款
  由 `os_suppliers.deliveryType='yulian'` 控制，不寫死程式碼

### 庫存邏輯
- 叫貨單 received（B類）→ os_inventory currentQty +，寫 os_inventory_logs(in)
- 派車單 signed（B類）→ os_inventory currentQty -，寫 os_inventory_logs(out)
- 手動調整：必填原因，寫 os_inventory_logs(adjust)
- 庫存基準點：2026-03-31 盤點（待匯入）

### 帳務連動
- 叫貨單 received → os_payables 累加（月底執行 generateMonthlyPayables）
- 銀行明細匯入 → autoMatchTransactions → 人工確認（不自動標記）
- 退佣：廣弘批價÷1.12差額 / 伯享差價 / 韓濟抵貨款（os_rebate_rules 存 DB）
- 提貨調貨 → 月底 billTransfers → os_franchisee_payments

### 品項命名規範
- 格式：品名_規格/計價單位（廠商不放品名裡，只存 supplierName）
- 別名：CA表舊名/大麥品名存 aliases JSON 陣列

---

## 給新大腦的重要提醒

**Make 串接：**
- 每天 14:55 自動執行，送資料到 /api/procurement/import
- secret: ordersome-sync-2026
- 已確認正常（Railway log 有 \[Procurement Import\] 記錄）

**郵件系統：**
- Railway 封鎖 SMTP，nodemailer 不可用
- 短期不要修，優先業務功能

**DB 注意事項：**
- os_products 共 567 筆（原有 325 筆 + 大麥匯入新增 242 筆），無重複
- os_products 的 `temperature` 欄位不存在，溫層存在 `category2`
- os_delivery_orders.toStoreId 已改為允許 NULL
- os_franchisee_payments.userId 已改為允許 NULL
- packCost = 大麥進貨價（直接對應），不是 unitQty × unit_cost

**⚠️ 已知資料問題（需人工確認）：**
骰子雞球、港式蘿蔔糕等品項「箱 vs 包」單位差異，進貨價差10倍，
需人工到 /dashboard/products 品項成本頁確認單位是否統一。

**連動關係：**
- 叫貨單 confirmed → 叫貨管理有「建立派車單」按鈕 → 跳轉 /dashboard/delivery
- 派車單 signed → 庫存減少 + os_franchisee_payments 自動產生
- 帳務管理 Tab1 應付帳款「查看明細」→ 跳轉叫貨管理帶廠商篩選

**下次換對話框前確認：**
1. `git status` clean
2. `pnpm run build` 零錯誤
3. CLAUDE.md 版本號已更新

---

## 系統常數

| 常數 | 值 | 說明 |
|------|----|------|
| `HQ_STORE_ID` | `401534` | 宇聯總部 storeId，機動人員排班用 |
| `SYNC_SECRET` | `ordersome-sync-2026` | Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004` | 大永蛋品 tenantId |
| `OS_TENANT_ID` | `1` | 來點什麼 tenantId |
| `GMAIL_APP_PASSWORD` | Railway 已設定 | SMTP 出口被封鎖，sendMail 實際不可用 |

---

## 系統架構總覽

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

## 權限與稽核規則（永久有效）

| 角色 | 刪除 | 作廢 | 修改 | 新增 |
|------|------|------|------|------|
| super_admin | 可以（必填原因，寫 audit log） | 可以 | 可以 | 可以 |
| manager | 不行 | 可以（必填原因） | 可以（寫快照） | 可以 |

所有刪除和修改寫 os_audit_logs，os_audit_logs 不可被刪除。

---

## 技術債

- `has_procurement_access` 前端 any cast 補型別（`useAuth` User 型別正式擴充）
- 大永/來點什麼 ERP 的 `dy_`/`os_` 表不在 `schema.ts`，用 raw SQL
- 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）
- chunk size 超標（index.js 6266 kB），需 code splitting

---

## Migration 標準驗證程序（每次必做）

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

## tRPC Procurement Router 完整 Procedures

- `list` / `create` / `getDetail` / `updateStatus` / `groupBySupplier`
- `pushToLine` / `supplierLineList` / `supplierLineUpsert` / `getSuppliers`
- `deleteOrder`（superAdmin） / `batchDeleteOrders`（superAdmin） / `updateNote`
- `updateItem` / `addItem` / `listStoreNames` / `listSupplierNames`
- `getPickList` / `markPrinted` / `importFromDamai`（public） / `importFromDamaiExcel`
- `listNeedsReview`

## tRPC Delivery Router 完整 Procedures

- `listDeliveryOrders` / `getDeliveryDetail` / `createDeliveryOrder`
- `createFromProcurement` / `updateStatus` / `getMonthStats`

---

## 大永待辦（等蛋博確認）

- LIFF 正式 liffId（蛋博建立後只改 `client/src/pages/liff/LiffOrder.tsx` 一行）
- 積欠款 LINE 推播通知（cron 基礎已建，需實作發送邏輯）
- Portal 客戶重設密碼 email（需驗證自有網域後使用 Resend）

---

## Make 自動化串接

- 門市自動報表 Webhook → 直接寫進 `os_daily_reports`（SYNC_SECRET 已設）
- 採購 importFromDamai → 不再走 Google Sheets
- Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
- SYNC_SECRET：`ordersome-sync-2026`

---

## 專案基本資訊

- **網址**：https://ordersome.com.tw
- **部署**：Railway（自動 CI/CD，push 後 2-3 分鐘生效）
- **資料庫**：TiDB Cloud（MySQL 相容）
- **套件管理**：pnpm 10
- **Git 規則**：commit 只用 `git add 指定檔案`，絕不用 `git add -A`

# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

業務邏輯請讀 BUSINESS.md，技術參考請讀 CLAUDE_REFERENCE.md，歷史記錄請讀 DEVELOPMENT_LOG.md

> **版本**：v5.64。**最後更新**：2026-04-19。
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
5. 每次 commit 前必須檢查 docs/ordersome_module_map_v1.html，若該次 commit 涉及模組狀態變更（功能完成、新問題發現、新功能建立），必須同步更新對應卡片的 status-pill class：
   - done（綠）= 完成正常運作
   - partial（藍）= 部分完成有問題
   - running（橘）= 需資料或連動
   - pending（灰）= 待建置
   同時更新 footer 的版本號（v1.0 → v1.1）與日期。

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

### 最新 Git 狀態（2026-04-19 v5.64）

最後三個 commit：
1. `本次commit` — fix: v5.64 損益表欄位名修正+庫存金額統計
2. `前次commit` — fix: v5.62 帳務修正：清理宇聯應付錯誤資料+補month欄位+修正import腳本排除B類自配
3. `fc3719e` — feat: v5.61 撿貨單邏輯修正：相同品項跨門市數量加總，新增門市分配小字

working tree: clean

### 已完成模組

| 路由 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ✅ | 叫貨管理，Make串接，Excel匯入，撿貨單列印，排序 |
| `/dashboard/inventory` | `OSInventory.tsx` | ✅ | 庫存管理，B類，批次盤點，異動歷史，下拉操作，刪除（super_admin），統計列 |
| `/dashboard/products` | `OSProducts.tsx` | ✅ | 品項成本，大麥244筆已匯入（共704筆），兩層分類 |
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

## DB 現況快照（2026-04-19 匯入後）

| 表 | 筆數 | 說明 |
|----|------|------|
| os_procurement_orders | 484 | 453張大麥歷史 + 31張系統既有 |
| os_procurement_items | 10263 | 含歷史品項行 |
| os_inventory | 187 | B類24 + 其他資產141 + 既有22 |
| os_inventory_logs | 706 | 含3/31盤點基準點165筆 + 4/1後庫存觸發181筆 |
| os_payables | 27 | 25筆大麥歷史（廠商×月份）+ 2筆手動 |
| os_products | 704 | 原567 + 大麥匯入新建137筆（needsReview=1） |
| os_stores | 12 | 來點什麼12間門市（2026-04-19建立） |
| os_suppliers | 9+ | 廣弘/裕展/韓濟/米谷/裕展/美食家/伯享/宇聯/宇聯_週活（+其他） |

### ⚠️ 已知資料缺陷

- `os_procurement_orders.storeId`：16筆仍為NULL（storeName空字串或非門市，屬正常）
- `os_procurement_items.unitPrice=0`：3376筆（對帳報表只涵蓋2026-02後，更早訂單無進貨價，預期行為）
- `os_products.needsReview=1`：137筆（大麥歷史匯入新建品項，需人工至 /dashboard/products 確認）
- 骰子雞球、港式蘿蔔糕等品項「箱 vs 包」單位差異，進貨價差10倍，需人工確認

### os_stores 門市清單（tenantId=1）

| 門市全名 | 短名 |
|---------|------|
| 來點什麼-北屯昌平店 | 北屯昌平店 |
| 來點什麼-南屯林新店 | 南屯林新店 |
| 來點什麼-大里店 | 大里店 |
| 來點什麼-東勢店 | 東勢店 |
| 來點什麼-東山店 | 東山店 |
| 來點什麼-民權店 | 民權店 |
| 來點什麼-永興店 | 永興店 |
| 來點什麼-瀋陽梅川店 | 瀋陽梅川店 |
| 來點什麼-草屯中山店 | 草屯中山店 |
| 來點什麼-西屯福上店 | 西屯福上店 |
| 來點什麼-財神店 | 財神店 |
| 來點什麼-逢甲旗艦店 | 逢甲旗艦店 |

---

## 待完成功能清單

### 主線任務

**P1 本週：**
- [x] ~~3/31 盤點資料匯入~~ — 2026-04-19 完成（165筆，含B類24+其他資產141）
- [x] ~~大麥歷史叫貨訂單匯入~~ — 2026-04-19 完成（453張，2025/12~2026/04）
- [x] ~~廠商對帳報表匯入~~ — 2026-04-19 完成（25筆應付帳款，2026-02~04）
- [ ] **前端驗證**：/dashboard/purchasing、/dashboard/inventory、/dashboard/accounting 顯示歷史資料是否正確
- [ ] **needsReview 品項確認**：137筆新建品項需人工至 /dashboard/products 逐一確認單位/成本

**P2 本月：**
- [ ] 報價單功能（哪些店看哪些價格）
- [ ] 派車單統整列印（跨門市合併撿貨單）
- [ ] 銀行明細多格式支援（目前只有台新格式）
- [ ] chunk size 優化（index.js 6453kB，需 code splitting）

**P3 之後：**
- [ ] BOM 物料清單（開工條件：採購資料穩定 + os_products 成本準確）
- [ ] 大永 LIFF 正式 liffId（等蛋博）
- [ ] 全系統 RWD 審查
- [ ] 排班管理員工資料匯入

---

## 需要 Leo 提供的資料清單

| 資料 | 從哪裡匯出 | 格式 | 用途 | 狀態 |
|------|----------|------|------|------|
| 3/31 盤點資料 | 採購人員提供 | Excel | 庫存基準點 | ✅ 已匯入 |
| 大麥歷史叫貨 | 大麥→出貨報表 | Excel | 歷史叫貨記錄 | ✅ 已匯入（2025/12起） |
| 廠商對帳報表 | 大麥→廠商對帳 | Excel | 歷史應付帳款 | ✅ 已匯入（2026-02起） |
| 採購出貨管理（2025全年） | 大麥→進出貨管理 | Excel | 2025歷史補齊 | ⏳ 後補（目前只有2025/12後） |
| 銀行明細（最新） | 台新銀行網銀匯出 | xlsx | 銀行對帳 | ⏳ 待提供 |

---

## 重要業務邏輯（永久有效）

### 供應商分類
- **A類（直送）**：廣弘/凱田/韓濟/米谷/裕展/美食家/伯享
  叫貨單 received → 只記應付帳款，不記庫存
- **B類（自配）**：宇聯/宇聯_週活/立璋/三洋泰/屈臣/永豐
  叫貨單 received → 庫存增加 + 應付帳款
  派車單 signed → 庫存減少 + 應收帳款
  由 `os_suppliers.deliveryType='yulian'` 控制，不寫死程式碼
  > **注意**：B類廠商正式名稱為「三洋泰」（非三洋），os_suppliers 與庫存統計表均以此為準

### 庫存邏輯
- **基準點**：2026-03-31 盤點已匯入（165筆，reason='3/31盤點基準點匯入'）
- 叫貨單 received（B類）→ os_inventory currentQty +，寫 os_inventory_logs(in)
- 派車單 signed（B類）→ os_inventory currentQty -，寫 os_inventory_logs(out)
- 手動調整：必填原因，寫 os_inventory_logs(adjust)
- **觸發條件**：B類 AND orderDate >= 2026-04-01（3/31前已含在基準點內，不重複觸發）

### 歷史匯入識別
- `os_procurement_orders.sourceType = 'damai_import'`：大麥歷史匯入的單
- `os_payables.sourceType = 'damai_import'`：大麥歷史應付帳款
- `os_inventory_logs.reason LIKE '大麥%'` 或 `'3/31盤點%'`：歷史匯入的庫存記錄
- 防重複鍵：叫貨單用 externalOrderId，應付帳款用 supplierName+yearMonth+sourceType

### 帳務連動
- 叫貨單 received → os_payables 累加（月底執行 generateMonthlyPayables）
- 銀行明細匯入 → autoMatchTransactions → 人工確認（不自動標記）
- 退佣：廣弘批價÷1.12差額 / 伯享差價 / 韓濟抵貨款（os_rebate_rules 存 DB）
- 提貨調貨 → 月底 billTransfers → os_franchisee_payments

### 品項命名規範
- 格式：品名_規格/計價單位（廠商不放品名裡，只存 supplierName）
- 別名：CA表舊名/大麥品名存 aliases JSON 陣列
- needsReview=1：大麥匯入新建品項，需人工確認，前端標橘色⚠

### os_stores 門市命名規範
- 全名格式：`來點什麼-{門市短名}`（例：來點什麼-大里店）
- 查詢時務必比對 name 與 CONCAT('來點什麼-', shortName) 避免不一致
- storeName（文字欄位）永遠存全名，storeId 為 FK

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
- os_payables.netPayable = totalAmount - rebateAmount，由 generateMonthlyPayables 初始化（初始值=totalAmount），calculateRebates offset 時更新
- profitLoss 退佣讀 os_rebates.netRebate（非 os_rebate_records）
- profitLoss 食材成本：有 os_payables 真實資料時用真實值，否則估算 35%（前端顯示標注來源）
- os_products 共 704 筆（v5.57後，含大麥歷史匯入新建137筆 needsReview=1）
- os_products 的 `temperature` 欄位不存在，溫層存在 `category2`
- os_delivery_orders.toStoreId 已改為允許 NULL
- os_franchisee_payments.userId 已改為允許 NULL
- packCost = 大麥進貨價（直接對應），不是 unitQty × unit_cost
- os_daily_reports 欄位全 camelCase：tenantId, reportDate, instoreSales, uberSales, pandaSales, guestInstore, guestUber, guestPanda, phoneOrderAmount, deliveryOrderAmount
- os_monthly_reports 欄位全 camelCase：tenantId, electricityFee, waterFee, staffSalaryCost, performanceReview, monthlyPlan
- profitLoss 日報 totalSales = instoreSales+uberSales+pandaSales+phoneOrderAmount+deliveryOrderAmount
- os_inventory.itemValue = currentQty × unitCost（查詢時計算，非實體欄位）
- os_stores 表於 2026-04-19 新建，含 12 間門市，schema 需一併更新

**os_stores 表結構：**
```sql
id INT AUTO_INCREMENT PRIMARY KEY
tenantId INT NOT NULL
name VARCHAR(100) NOT NULL        -- 全名，如「來點什麼-大里店」
shortName VARCHAR(50)             -- 短名，如「大里店」
storeCode VARCHAR(20)             -- 預留門市代碼
isActive TINYINT DEFAULT 1
createdAt DATETIME
updatedAt DATETIME
INDEX idx_tenant_name (tenantId, name)
```

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
├── 來點什麼（tenantId=1）：早午餐連鎖，12間門市（os_stores已建）
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
- chunk size 超標（index.js 6453kB），需 code splitting

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

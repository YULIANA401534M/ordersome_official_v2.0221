# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

業務邏輯請讀 BUSINESS.md，技術參考請讀 CLAUDE_REFERENCE.md，歷史記錄請讀 DEVELOPMENT_LOG.md

> **版本**：v5.81。**最後更新**：2026-04-22。
> **給 Claude 架構**：大腦（Claude.ai）+ 手腳（Claude Code）

---

## 第一件事

拿到這份文件時，先執行：
```bash
git status && git log --oneline -3
```
確認 working tree clean、最新 commit 是今天的，再開始工作。

---

## ⚠️ 安全守則（絕對禁止）

- **絕對不可以把密碼、DATABASE_URL、API Key 硬寫在任何 .ts / .mjs / .bat / .js 檔案裡**
- 所有憑證一律放 `.env`（本機）或 Railway Variables（production）
- `.env` 已在 `.gitignore`，不會被 commit，但 `.mjs` / `.bat` 不在保護範圍
- script 檔案讀資料庫請用 `process.env.DATABASE_URL`
- 2026-04-20 發生過一次密碼洩漏事件（寫死在 migrate_temp.mjs / tidb-check-and-sync.mjs / start-dev.bat），已重設密碼並清除

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

### 最新 Git 狀態（2026-04-22 v5.79）

最後三個 commit：
1. `(v5.81)` — fix: v5.81 AdminProducts Modal Footer固定：DialogContent內加明確flex容器避免grid衝突
2. `(v5.80)` — fix: v5.80 AdminProducts Modal移除overflow-hidden恢復捲動功能
2. `(v5.79)` — fix: v5.79 AdminProducts Modal橫向溢出根本修正：ScrollArea Viewport加overflow-x-hidden+DialogContent加!max-w-2xl
2. `(v5.77)` — fix: v5.77 scheduledAt查詢條件修正+時區處理統一+CLAUDE.md時區規則
3. `(v5.76)` — fix: v5.76 scheduledAt排程發布根本修正：getPublishedPosts加時間過濾+時區修正+清除排程null傳遞

working tree: clean

### 已完成模組

| 路由 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ✅ | 叫貨管理，Make串接，Excel匯入，撿貨單列印，排序 |
| `/dashboard/inventory` | `OSInventory.tsx` | ✅ | 庫存管理，B類，批次盤點，異動歷史（近10筆），下拉操作，刪除（super_admin），統計列，庫存金額（itemValue），最後修改時間 |
| `/dashboard/products` | `OSProducts.tsx` | ✅ | 品項成本，大麥244筆已匯入（共704筆），兩層分類 |
| `/dashboard/ca-menu` | `OSCaMenu.tsx` | ✅ | 菜單成本管理 |
| `/dashboard/delivery` | `OSDelivery.tsx` | ✅ | 配送管理，從叫貨單建立，簽收扣庫存 |
| `/dashboard/accounting` | `OSAccounting.tsx` | ✅ | 帳務管理，四Tab，手動新增應付 |
| `/dashboard/franchisee-payments` | `OSFranchiseePayments.tsx` | ✅ | 加盟主帳款 |
| `/dashboard/rebate` | `OSRebate.tsx` | ✅ | 退佣帳款 |
| `/dashboard/profit-loss` | `OSProfitLoss.tsx` | ✅ | 損益儀表板，KPI×4，AreaChart每日趨勢，PieChart通路分拆，BarChart費用結構，損益明細表 |
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

**P1 待驗證（換對話框後優先確認）：**
- [ ] **前端驗證**：/dashboard/purchasing、/dashboard/inventory、/dashboard/accounting 顯示歷史資料是否正確
- [ ] **needsReview 品項確認**：137筆新建品項需人工至 /dashboard/products 逐一確認單位/成本
- [ ] **損益表驗證**：確認 os_daily_reports 已有門市日報資料，損益表圖表有無正確顯示

**P2 本月：**
- [ ] 報價單功能（哪些店看哪些價格）
- [ ] 派車單統整列印（跨門市合併撿貨單）
- [ ] 銀行明細多格式支援（目前只有台新格式）
- [ ] chunk size 優化（index.js ~6500kB，需 code splitting）

**P3 之後：**
- [ ] BOM 物料清單（開工條件：採購資料穩定 + os_products 成本準確）
- [ ] 大永 LIFF 正式 liffId（等蛋博）
- [ ] 全系統 RWD 審查
- [ ] 排班管理員工資料匯入

**已完成（本對話框，2026-04-19）：**
- [x] 3/31 盤點資料匯入（165筆，B類24+其他資產141）
- [x] 大麥歷史叫貨訂單匯入（453張，2025/12~2026/04）
- [x] 廠商對帳報表匯入（25筆應付帳款，2026-02~04）
- [x] v5.63 帳務七項修正（netPayable/退佣表名/韓濟/食材成本接真實值）
- [x] v5.64 損益表欄位名全面修正（camelCase）+ 庫存金額統計
- [x] v5.65 損益儀表板圖表升級（recharts）+ 庫存最後修改時間 + 近10筆記錄
- [x] v5.67 第一梯修正：叫貨日期預設全部+快速選項 / 帳務月份預設全部+操作按鈕保護 / profitLoss.ts 確認已正確 / OSInventory.tsx deleteMut 確認已正確
- [x] v5.68 第二梯修正：manager權限B方案 / 損益擋住 / 庫存分頁30筆 / 品項分頁50筆+needsReview / 帳務查看明細跳轉
- [x] v5.69 補齊五項修正：DB開啟purchasing_os/daily_report_os / OSProfitLoss圖表+redirect確認 / 查看明細確認 / 庫存分頁確認 / 品項分頁+待確認確認
- [x] v5.70 退佣計算修正（rebateRate > 1 除以 100）/ profitLoss 已有 channelSales/dailyTrend/procurementCost/isCostEstimated / 退佣帳款加 accounting.listRebates + calculateRebates 按鈕 / OSDailyReport 月彙整改用 viewYear/viewMonth
- [x] v5.71 加盟主叫貨單權限：procurement list 改 franchiseeOrAdminProcedure，franchisee 用 storeId→os_stores 取得 storeName 自動篩選；OSPurchasing 加 isFranchisee 隱藏店別篩選/批量刪除/操作按鈕

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

**時區規則（全系統適用，v5.77）：**
- Railway 伺服器和 TiDB 資料庫均為 UTC
- 所有時間存進資料庫時存 UTC（`new Date()` 在 Node.js UTC 環境即為 UTC）
- 前端顯示時間：`toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })`
- 前端 datetime-local 輸入框**讀取**：`new Date(utcString).getTime() + 8*60*60*1000` 加 8 小時，再 `toISOString().slice(0,16)`
- 前端 datetime-local 輸入框**送出**：字串後加 `:00+08:00`，例如 `"2026-04-22T15:00"` → `"2026-04-22T15:00:00+08:00"`，後端 `new Date()` 自動轉 UTC
- 排程發布正確做法：`getPublishedPosts` WHERE 包含 `or(isNull(scheduledAt), lte(scheduledAt, now))`，文章時間到自然出現，**不需要任何 cron 或手動觸發**
- 此規則適用於所有現有和未來涉及時間的功能

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
- profitLoss.ts 月報表用 tenantId（camelCase），storeId 分支已無（os_monthly_reports 無 storeId 欄位）
- profitLoss 採購成本從 os_payables WHERE month=YYYY-MM 查，無資料 fallback 35%
- OSInventory.tsx deleteMut 已接通 inventory.deleteItem（deleteTarget/deleteReason state 齊備）
- 叫貨管理日期預設為空（查全部），快速選本週/本月/三個月/全部按鈕在日期輸入左側
- 帳務管理 month 預設為空（顯示全部月份），操作型 mutation（generatePayables/calcRebates/autoMatch/billTransfers）在 month 為空時 disabled
- manager 權限方案B：osModuleDefs 加 managerAllowed 欄位，只有 managerAllowed:true 的模組才對 manager 顯示（叫貨/配送/日報/SOP/設備報修/每日檢查表）
- 損益儀表板加 useEffect role 檢查，非 super_admin 且無 has_procurement_access 者直接導回 /dashboard
- 庫存管理加前端分頁每頁 30 筆，篩選（廠商/分類/低警戒）變動時重置頁碼
- 品項成本加分頁每頁 50 筆 + needsReview 後端篩選（osProducts.productList input 加 needsReview: z.boolean().optional()）
- 應付帳款每列加「查看明細」按鈕，跳轉 /dashboard/purchasing?supplier=廠商名
- OSPurchasing.tsx 讀 URL ?supplier= 參數自動帶入廠商篩選（useSearch + useEffect）
- os_products 共 704 筆（v5.57後，含大麥歷史匯入新建137筆 needsReview=1）
- os_products 的 `temperature` 欄位不存在，溫層存在 `category2`
- os_delivery_orders.toStoreId 已改為允許 NULL
- os_franchisee_payments.userId 已改為允許 NULL
- packCost = 大麥進貨價（直接對應），不是 unitQty × unit_cost
- os_daily_reports 欄位全 camelCase：tenantId, reportDate, instoreSales, uberSales, pandaSales, guestInstore, guestUber, guestPanda, phoneOrderAmount, deliveryOrderAmount
- os_monthly_reports 欄位全 camelCase：tenantId, electricityFee, waterFee, staffSalaryCost, performanceReview, monthlyPlan
- profitLoss 日報 totalSales = instoreSales+uberSales+pandaSales+phoneOrderAmount+deliveryOrderAmount
- os_inventory.itemValue = currentQty × unitCost（查詢時計算，非實體欄位）
- profitLoss 新增 dailyTrend（每日趨勢陣列）和 channelSales（通路分拆物件）和 procurementCost/isCostEstimated
- osRebate.calculate：rebateRate > 1 時除以 100（os_suppliers 存的是百分比整數，如 10.71 = 10.71%）
- procurement list 改用 franchiseeOrAdminProcedure（server/_core/trpc.ts 新增），franchisee 自動篩選只看 storeId→os_stores 對應的門市訂單
- OSPurchasing.tsx：isFranchisee = user.role==='franchisee'，隱藏店別篩選/批量刪除/新增叫貨/手動補單/匯入/列印等所有 canEdit 操作按鈕（canEdit 本已排除 franchisee）
- OSRebate.tsx 加 accounting.listRebates（查 os_rebates）和 accounting.calculateRebates 按鈕（計算本月退佣寫入 os_rebates）
- OSDailyReport MonthlyOverviewTab 年月 state 改名為 viewYear/viewMonth（Select 已同步更新）
- OSProfitLoss 使用 recharts：AreaChart 每日趨勢、PieChart 通路分拆、BarChart 費用結構
- **scheduledAt 排程發布（v5.76 根本修正）**：getPublishedPosts WHERE 條件包含 `or(isNull(scheduledAt), lte(scheduledAt, now))`，status=published 且排程未到自動不顯示前台；不需要 cron/publishScheduled 手動觸發；時區：DB存UTC，前端顯示轉台北（UTC+8），送出時附加+08:00；清除排程送 null（z.string().nullable().optional()）
- os_inventory.updatedAt 顯示最後修改時間（取代 lastCountDate 欄位）
- getHistory LIMIT 改為 10，historyDialog 顯示「近 10 筆異動記錄」
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

---

## 待建置大任務：集中式權限管理系統

**目標**：取代目前散落在各頁面的 role 判斷邏輯，建立集中式權限控制。

**規劃架構：**
1. DB 新增 `os_user_permissions` 表
   - `userId, moduleKey, canView, canEdit, canDelete`
2. 後端新增 `permissionMiddleware`（取代 adminProcedure/managerAllowed）
3. 前端用戶管理頁面加「權限設定」UI，管理員可對每個 user 開關模組
4. `AdminDashboardLayout` 改從 permissions API 讀取可見模組，不再 hardcode
5. 各頁面的 `isSuperAdmin`/`isManager`/`canSeeCost` 判斷統一從 permissions 讀

**優先順序**：P2，在目前 UAT fix 全部完成後執行。
**預估影響範圍**：`AdminDashboardLayout.tsx`、所有 OS ERP 頁面、後端 `trpc.ts`

---

## 待建置：菜單成本 os_menu_items 表

**問題**：`os_menu_items` 資料表在 TiDB 不存在，導致 OSCaMenu 頁面無資料。

**需要：**
1. 執行 migration 建立 `os_menu_items` 和 `os_menu_item_ingredients` 表
2. 匯入現有菜單品項資料
3. 聯動 `os_products.unitCost` 計算成本

**優先順序**：P2，下一輪處理。

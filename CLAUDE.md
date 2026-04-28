# CLAUDE.md — OrderSome 專案主腦

> 版本 v7.26｜最後更新：2026-04-29
> **每次開始新對話請讀完這份文件**，然後視任務需要讀 `todo.md` 或 `docs/` 子頁。
> 歷史變更記錄請看 `DEVELOPMENT_LOG.md`，不需要每次讀。

---

## 文件地圖

| 檔案 | 用途 | 何時讀 |
|------|------|--------|
| `CLAUDE.md`（本檔） | 規則、架構、帳號、踩坑、近期目標 | 每次開始 |
| `todo.md` | 待辦清單 P1/P2/P3 | 要選任務時 |
| `DEVELOPMENT_LOG.md` | 歷史 bug 修法、版本記錄 | 需要查舊記錄時 |
| `BUSINESS.md` | 業務邏輯（採購→庫存→帳務流程） | 要理解商業規則時 |
| `CLAUDE_REFERENCE.md` | 完整技術棧、API 清單 | 查 API 細節時 |
| `docs/dayone-real-world-business-flow-2026-04-26.md` | 大永業務流程（進貨→派車→收款） | 做大永功能時 |
| `docs/backoffice-visual-system-v1.md` | 後台視覺設計規範 | 做任何 UI 時 |

---

## 系統架構

### 多租戶架構

```
宇聯（OrderSome）  tenantId = 1     → 來點什麼 12 間門市
大永（Dayone）     tenantId = 90004 → 蛋品配送 ERP
```

### 技術棧

- **前端**：React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **後端**：Node.js + tRPC + Drizzle ORM
- **資料庫**：TiDB Cloud（MySQL 相容）
- **部署**：Railway（自動 CI/CD，push 後 2-3 分鐘上線）
- **套件管理**：npm 10

### 部署資訊

- 網址：https://ordersome.com.tw
- 資料庫：TiDB Cloud
- 儲存：Cloudflare R2（圖片/PDF 簽名）
- 郵件：Railway SMTP（nodemailer）
- LINE：LIFF（大永下單）

---

## 帳號與路由

### 系統角色

| 角色 | tenantId | 說明 |
|------|----------|------|
| super_admin | — | 全站最高權限 |
| admin | 1 / 90004 | 各租戶管理員 |
| manager | 1 | 宇聯來點什麼門市主管 |
| franchisee | 1 | 加盟主（只能看自己的叫貨） |
| driver | 90004 | 大永配送司機 |

### 重要帳號（開發/測試用）

| 帳號 | 密碼 | 角色 | 租戶 |
|------|------|------|------|
| osmanager@ordersome.com.tw | （Railway 環境變數）| manager | 1 |
| dayonevip@dayone.com | （Railway 環境變數） | manager | 90004 |

> 密碼存在 Railway Variables，不寫在這裡。

### 主要路由入口

**宇聯後台**
- `/dashboard` — 儀表板
- `/dashboard/products` — 商品管理
- `/dashboard/procurement` — 採購管理
- `/dashboard/inventory` — 庫存管理
- `/dashboard/daily-report` — 日報填報
- `/dashboard/profit-loss` — 損益報表
- `/dashboard/purchasing` — 叫貨管理
- `/dashboard/accounting` — 帳務（應付/銀行/退佣/調貨）
- `/dashboard/customers` — 客戶管理
- `/dashboard/delivery` — 配送管理

**大永後台**
- `/dayone` — 今日儀表板
- `/dayone/orders` — 訂單管理
- `/dayone/dispatch` — 派車工作台
- `/dayone/purchase-receipts` — 進貨簽收
- `/dayone/inventory` — 庫存管理
- `/dayone/ar` — 帳務（AR/AP/司機日報/空箱/月結）
- `/dayone/customers` — 客戶管理
- `/dayone/products` — 商品主檔
- `/dayone/purchase` — 供應商管理

**司機端**
- `/driver/today` — 今日任務
- `/driver/orders` — 訂單清單
- `/driver/pickup` — 撿貨唯讀路線
- `/driver/worklog` — 現金/剩貨回庫/日結

**客戶 Portal**
- `/dayone/portal/*` — 下游客戶入口

---

## 環境變數

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | TiDB 連線字串 |
| `HQ_STORE_ID` | `401534`，總部 storeId |
| `SYNC_SECRET` | `ordersome-sync-2026`，Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004` |
| `OS_TENANT_ID` | `1` |
| `GMAIL_APP_PASSWORD` | SMTP 發信 |

---

## 安全守則（最高優先）

- **絕對不能把 DATABASE_URL、API Key 寫死進任何程式檔**
- 敏感資料一律走 `.env`；部署走 Railway Variables
- `.env` 已在 `.gitignore`，不可 commit
- 腳本連線資訊一律用 `process.env.DATABASE_URL`
- 已清除含敏感資訊的 migrate_temp.mjs、tidb-check-and-sync.mjs、start-dev.bat，不要重建

---

## 開發規則（每次都要遵守）

### Commit 流程

1. 先更新 CLAUDE.md 版號 +0.01
2. 確認 `npm run build` 無 TypeScript 錯誤
3. 每次 commit 後同步更新 `docs/ordersome_module_map_v1.html` 的 status-pill
4. Commit message 格式：`feat: vX.XX [頁面名] [簡述]`
5. 歷史 bug 修法摘要寫進 `DEVELOPMENT_LOG.md`，不要塞回 CLAUDE.md

### 設計規則

- **色彩**：全用 OKLCH token，不硬寫 hex / Tailwind 顏色名
  - 後台主色：暖白 / 石墨 / amber，強調色只用在重點
  - 宇聯官網：`oklch(0.75 0.18 70)` 暖黃、`oklch(0.97 0.02 85)` 奶白、`oklch(0.18 0.02 60)` 深色文字
- **字型**：後台用穩定 UI 字體（不強制 JF-Kamabit）；官網大標可用 `--font-brand`（JF-Kamabit）
- **動畫**：官網用 Framer Motion EASE_OUT_EXPO `[0.16, 1, 0.3, 1]`；後台只用 CSS transition
- **禁止**：gradient text、bounce/elastic easing、卡片套卡片、標題上方放圓角 icon
- **非同步資料頁**：不用 `useInView` 控制 `animate`，改用直接 `animate`
- **前端設計工作**：使用 `impeccable` skill

### 後台改版規則

- tRPC 查詢邏輯和 Link href 路由一律不動，只改 JSX 結構與樣式
- 後台 CSS class 規範：`dayone-page-title`（1.35rem/700）、`dayone-page-subtitle`（0.8125rem）、`dayone-kpi-value`（clamp/tabular-nums）、`dayone-page-header`（flex justify-between）

### 程式碼規則

- tRPC 查詢和路由不動時，只改 JSX 結構與樣式
- 不可直接重上 manualChunks，任何拆包都要先驗證首頁與 `/dayone/*` 不白畫面
- `DriverSign.tsx` 是 legacy/未掛載，現行簽名路徑是 `DriverOrderDetail.tsx → dayone.driver.uploadSignature`

---

## 踩過的坑（必讀，避免重蹈）

### TiDB BigInt 問題（v6.78 根治）

- **症狀**：React Error #185、`JSON.stringify` 直接炸、頁面一載入就白畫面
- **根本原因**：mysql2 預設把 AUTO_INCREMENT id / COUNT / SUM 欄位回傳成 JS BigInt
- **根本修法**：`server/db.ts` createPool 加兩個選項，一次解決全站：
  ```
  supportBigNumbers: true,
  bigNumberStrings: false,
  ```
- **錯誤做法**：在前端或各 router 個別加 `Number()` 包，治標不治本，漏一個就炸

### TiDB LIMIT 參數化問題（v6.02 已修）

- **症狀**："Incorrect arguments to LIMIT"
- **原因**：drizzle-orm 0.44.x 把 LIMIT/OFFSET 當 `?` params，TiDB 不支援
- **修法**：`server/db.ts` 的 `inlineLimitOffsetParams` patch，把整數 params inline 進 SQL
- **注意**：升級 drizzle-orm 後確認這個 patch 還在

### 時區問題（v5.77 已修）

- Railway Node.js 時區是 UTC
- 前端顯示：`toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })`
- `datetime-local` 讀取：`new Date(utcString).getTime() + 8*60*60*1000`
- `datetime-local` 儲存：直接補 `:00+08:00`

### shadcn Dialog 捲動問題（v5.81 已修）

- `DialogContent` 預設 `grid`，加 `flex flex-col` 會被 tailwind-merge 覆蓋
- `ScrollArea` 必須給 `min-h-0`，否則 Footer 消失
- `overflow-hidden` 不能加在 `DialogContent`
- 正確做法：

```tsx
<DialogContent className="!max-w-2xl p-0 gap-0 max-h-[90vh]">
  <div className="flex flex-col h-full max-h-[90vh]">
    <DialogHeader className="... shrink-0">...</DialogHeader>
    <ScrollArea className="flex-1 min-h-0 w-full">...</ScrollArea>
    <DialogFooter className="... shrink-0">...</DialogFooter>
  </div>
</DialogContent>
```

### 派車單 Radix Portal 列印問題（v6.28 已修）

- Portal 掛在 `body` 下，`body > *` 的 print CSS 把它隱藏
- 修法：`handlePrint` 開新視窗注入 `.print-target` HTML 列印

### TiDB Migration 注意

- 每次跑 migration 前先 DESCRIBE 確認欄位是否存在（TiDB 不支援 IF NOT EXISTS 某些版本）
- `has_procurement_access` / `last_login_at` 等欄位要先查再跑

### 大永 manager 側欄缺項（v6.73 已修）

- **症狀**：大永管理員登入後，派車管理、進貨簽收、應收帳款不顯示
- **原因**：`module_definitions` 和 `tenant_modules`（tenantId=90004）缺少 `dispatch`、`purchase_receipts`、`ar_management` 三個 key
- **修法**：直接在 DB 補 INSERT — 不需要改程式，只需確保 tenant_modules 有對應的 key + isEnabled=1
- **新增功能時的提醒**：側欄新增 moduleKey 後，要同步在 DB 的 `module_definitions` 和 `tenant_modules` 補上，否則 manager 看不到

### 每次查詢時不要做 schema 檢查

- `ensureDyDispatchSchema` / `ensureDyPendingReturnsTable` 已移除（v6.48）
- 這類「查詢時跑 ALTER TABLE」的模式會拖慢所有查詢，不要重建

### 重要業務邏輯坑

- `settlementCycle`：DB enum 只有 `('per_delivery','weekly','monthly')`，沒有 `daily`
- `dayone.ar.markPaid`：要同步回寫 `dy_orders.paidAmount/paymentStatus`
- `generateDispatch`：NOT EXISTS 要排除全部 5 個 status（draft/printed/in_progress/pending_handover/completed）
- 進貨入倉邏輯：供應商簽名只建 AP，**不增加可賣庫存**；要等 `receiveToWarehouse` 管理員確認後才增庫存
- AR 建立/更新有多個入口，需統一（尚未完成）
- `dy_stock_movements.type` ENUM：只允許 `in/out/return/adjust`，**不允許** `transfer`（v6.99 踩坑）
- 司機端所有查詢必須用 `dayoneDriverProcedure`，`dayoneAdminProcedure` 司機呼叫會靜默失敗返回空陣列（products/suppliers 均踩過）
- `dispatch.dispatchDate` 從 DB 取出是 UTC datetime，存進 `deliveryDate`（DATE 欄位）前必須 `+8*60*60*1000` 換算台灣日期字串（v7.00 踩坑）
- React Query `invalidate()` 是非同步的：invalidate 後下一個 render 仍是舊 cache，需要本地 state 立即反映（`localSignatureUrl` 案例）

---

## 近期目標（詳細待辦看 todo.md）

### 第一優先：大永 LIFF 上線（完成就是 80%）

流程：LINE Developers 建 LIFF app → 換 liffId → 補客戶綁定流程（首次開 LIFF 輸入手機號碼綁 lineId）→ 每個客戶設好預設司機+送貨頻率 → 端對端測試

關鍵現況（v6.70）：
- `dy_customers` 已有 `defaultDriverId`、`deliveryFrequency`、`lineId` 欄位
- `server/liff.ts`：createOrder 已自動帶入 driverId、依頻率推算 deliveryDate
- **已完成：** LIFF ID `2009700774-rWyJ27md`（下單）、`2009700774-0nJKIzne`（訂單查詢）已確認
- **已完成：** 客戶首次綁定流程（`checkBinding` + `bindLineId`）
- **已完成：** 三段式定價（客製 → 分級 → 主檔）：`dy_customer_prices`、`dy_level_prices` 均已實作，LIFF 下單與顯示均套用
- **已完成：** 訂單查詢頁（`/liff/my-orders`）：單日/區間切換、每筆明細展開、付款狀態
- **已完成：** 客製定價管理（客戶管理頁 🏷 按鈕）：可新增、調整、保留完整歷史紀錄
- **已完成：** 分級定價管理（`/dayone/level-prices`）：零售/門市/供應商各別設定
- **已完成：** 信用額度軟性警示（建訂單超額時 toast 警告，不阻擋）
- **`dy_districts` 已停用**（側欄已隱藏，表留著不刪）
- 訂單管理頁已支援單筆換司機（pending/assigned 狀態才能換）

### 第二優先：大永落地驗收

目標是真人跑完完整一天作業流程，驗收 5 個條件：
1. 建訂單 → 派車 → 列印派車單有內容
2. 司機 APP 送達 → AR 應收出現
3. 司機收現 → 訂單付款狀態同步
4. 剩貨回庫待驗 → 管理員確認 → 庫存增加
5. 進貨簽收 → AP 出現 → 確認入倉 → 庫存增加

**已完成後端 Bug 修復（v6.71）：**
- `updateDispatchItem`：司機派車工作台填現收金額後，現在會同步更新 `dy_ar_records`（原本只改 `dy_orders`，帳務頁看到的是舊資料）
- Bug 2~8 逐一查驗，確認均已在先前版本修好

### 第二優先：宇聯後台數字落地

頁面都做完了，但數字還在 Google Sheet。按順序：
1. 日報閉環（daily-report → profit-loss 對得起 Google Sheet）
2. 採購閉環（Make 自動化資料進 purchasing）
3. 應付帳款閉環（月結廠商對 os_payables）
4. 銀行流水對帳

---

## 資料庫現況（2026-04-19 盤點）

| 資料表 | 筆數 | 備註 |
|--------|------|------|
| os_procurement_orders | 484 | 453筆大買 + 31筆頂好望族 |
| os_procurement_items | 10263 | 進貨明細 |
| os_inventory | 187 | B類4 + 嗡嗡蜂141 + 其他22 |
| os_inventory_logs | 706 | 含3/31期初盤點165筆 |
| os_payables | 27 | 25筆大買月結 + 2筆對帳中 |
| os_products | 704 | 啟用67 + 137筆 needsReview=1 |
| os_stores | 12 | 來點什麼門市 |

### 已知資料異常

- `os_procurement_orders.storeId`：6筆 storeId=NULL，待追蹤
- `os_products.needsReview=1`：137筆大買進貨匯入商品，需逐一審核
- `os_procurement_items.unitPrice=0`：376筆，2026-02 以前的閒置舊料

### os_stores 門市清單（tenantId=1）

東勢店、逢甲旗艦店、東山店、大里店、草屯中山店、北區永興店、財神店、民權店、西屯福上店、瀋陽梅川店、北屯昌平店、南屯林新店（共 12 間，**目前沒有豐原店**）

> 完整名稱格式：`來點什麼-{shortName}`，例如 `來點什麼-東勢店`
> 南屯林新店地址：台中市南屯區惠中路三段54號（舊表「大墩十一街453號」為舊資料）

---

## Make 自動化

- 每天 14:55 自動觸發採購匯入：`/api/procurement/import`
- Secret：`ordersome-sync-2026`
- Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
- 失敗時查 Railway log 找 `[Procurement Import]`

## Email 發信

- Railway 上跑 SMTP，用 nodemailer
- 目前沒有設定寄送時段限制

---

## 採購業務邏輯備忘

### 供應商分類

- **A類（直接進貨）**：廣弘、裕展、大買、凱田、韓濟、大永蛋行 → received 後自動月結應付
- **B類（大永自配）**：大永、椪椪（嗡嗡蜂）、長春騰、米谷、藍格 → received 後庫存增加 + 月結應付；signed 後庫存減少
- 用 `os_suppliers.deliveryType='yulian'` 判斷是否大永配送

### 庫存異動邏輯

- 期初盤點：2026-03-31，reason='3/31期初盤點入庫'
- 進貨 received：`os_inventory currentQty +`
- 簽收 signed：`os_inventory currentQty -`
- 手動調整：需填原因，type=adjust 設絕對值
- **限制**：只算 orderDate >= 2026-04-01，3/31 以前不回算

### 應付帳務

- `os_payables.netPayable = totalAmount - rebateAmount`
- `profitLoss` 讀 `os_rebates.netRebate`，不是 `os_rebate_records`
- rebateRate > 1 就除以 100（os_suppliers 存的是百分比整數如 10.71）

### 重要欄位備忘

- `os_daily_reports`：tenantId, reportDate, instoreSales, uberSales, pandaSales, guestInstore, guestUber, guestPanda, phoneOrderAmount, deliveryOrderAmount
- `os_monthly_reports`：tenantId, electricityFee, waterFee, staffSalaryCost, performanceReview, monthlyPlan
- `profitLoss.totalSales = instoreSales+uberSales+pandaSales+phoneOrderAmount+deliveryOrderAmount`
- `profitLoss`：tenantId 要 camelCase、storeId 要是字串
- `products.salesCountOffset`：調整累計銷量，實際銷量 = 訂單銷量 + offset
- manager 模組開關：`isModuleDefs` 的 `managerAllowed` 欄位控制
- 庫存表單商品超過 30 筆時要分頁

### os_stores Schema

```sql
id INT AUTO_INCREMENT PRIMARY KEY
tenantId INT NOT NULL
name VARCHAR(100) NOT NULL        -- 完整名稱，例如「來點什麼-東勢店」
shortName VARCHAR(50)             -- 簡稱，例如「東勢店」
storeCode VARCHAR(20)             -- 系統門市編號
isActive TINYINT DEFAULT 1
createdAt DATETIME
updatedAt DATETIME
INDEX idx_tenant_name (tenantId, name)
```

---

## 大永業務流程備忘

### 作業主線

1. **上游進貨**：建單 → 供應商簽名（只建 AP）→ 管理員確認入倉（庫存才增加）→ AP 核銷
2. **下游訂單**：LIFF/Portal/人工代建 → `dy_orders` → 管理端整併派車
3. **派車出車**：依日期/區域/司機生成派車單 → 列印時扣庫存 → 司機撿貨出車
4. **配送簽收**：客戶簽名、現收或月結 → 送達後形成/更新 AR
5. **剩貨回庫**：司機回報待驗 → 管理員確認 → `dy_inventory` 增加

### 主線 Table 對照

- 訂單：`dy_orders`
- 派車：`dy_dispatch_orders`, `dy_dispatch_items`
- 進貨：`dy_purchase_receipts`
- 庫存：`dy_inventory`, `dy_stock_movements`
- 待驗回庫：`dy_pending_returns`
- 應收：`dy_ar_records`
- 應付：`dy_ap_records`
- 工作日誌：`dy_work_logs`（含 dispatchOrderId 欄位，每張派車單各自日結）

### 三段式庫存視圖

- 可賣庫存：`dy_inventory.currentQty`
- 待入倉進貨：已簽收但尚未入倉的進貨單
- 回庫待驗：`dy_pending_returns`

### 進貨狀態流

`pending → signed（待入倉）→ warehoused（已入倉）`

---

## 後台存取架構

- 共用 role/tenant/module 常數在 `shared/access-control.ts`
- 核心 tRPC 守衛：admin / superAdmin / franchisee / content
- Dayone 路由守衛集中在 `server/routers/dayone/procedures.ts`
- `server/routers/dayone/modules.ts` 保留在通用核心（同時服務 OrderSome 和 Dayone）
- 繼續做權限工作前先執行 `node scripts/audit-access-control.mjs`
- `has_procurement_access` 目前用 any cast 暫解，待正式 permissions 系統完成

---

## 對 AI 助手的提醒

- 不要碰高風險 chunk / lazy route 拆包
- 不要自作主張大改視覺，優先邏輯閉環
- 不能說系統 100% 沒問題，要區分「已驗證」和「尚未驗證」
- 每做一輪都要 build 驗證後再 commit push
- 使用者非常在意：有沒有 commit、有沒有 push、有沒有更新 CLAUDE.md
- 回報要誠實，build 有過 ≠ 全站驗證完
- AR 建立/更新仍有多個入口，後續需統一
- 新增節點前先說明：屬哪條主線、觸發時點、影響哪些 Table、是否影響庫存/AR/AP

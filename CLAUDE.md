# CLAUDE.md — OrderSome 專案主腦

> 版本 v6.51｜最後更新：2026-04-27

---

## 業務邏輯交接入口（2026-04-26）

下一個對話若需要從真實業務角度理解大永、宇聯或 OrderSome，請先讀以下文件：

- `docs/dayone-real-world-business-flow-2026-04-26.md` — 大永業務流程（進貨→派車→收款）
- `docs/business-logic-reverse-prompt-2026-04-26.md` — 業務邏輯反推指南
- `docs/yulian-ordersome-wanwansia-business-map-2026-04-26.md` — 宇聯/來點什麼業務地圖
- `docs/backoffice-access-map-2026-04-26.md` — 後台存取與權限重構細節

建議閱讀策略：**最新優先**，從最近更新的資料夾/檔案開始，只在需要確認數字或供應商/門市/流程時回頭查舊資料。

**BowlHero / 碗碗俠**：最新確認來源（截至 2026-04-26）為 `C:\Users\barmy\Downloads\碗碗俠_試菜SOP記錄表_完整版_v2_20260424.xlsx` 與 `C:\Users\barmy\Downloads\碗碗俠_公司設立流程與開幕前準備_20260423.xlsx`；若與較舊的計劃 PDF 衝突，以這兩份為準。南屯林新店正確地址：「台中市南屯區惠中路三段54號」（舊表出現「大墩十一街453號」視為舊資料）。

---

## 後台存取重構備忘

- 共用的 role/tenant/module 常數放在 `shared/access-control.ts`
- 核心 tRPC 的 admin/superAdmin/franchisee/content 守衛使用這些 helper
- Dayone 路由使用 `server/routers/dayone/procedures.ts` 的集中守衛
- `server/routers/dayone/modules.ts` 刻意保留在通用核心 admin/superAdmin procedures，因為它同時服務 OrderSome 和 Dayone 的模組切換
- 第二輪清除了 `server/routers.ts`、`ai-writer.ts`、`content.ts`、`franchiseePayment.ts`、`osProducts.ts`、`sop.ts`、`storage.ts`、`tenant.ts` 裡的本地 middleware
- `AdminDashboardLayout.tsx` 現在使用共用 access helpers 處理 role/tenant/permissions/cost
- 第三輪新增了 `ORDER_SOME_PERMISSION_DEFINITIONS`，對建立/更新時的未知權限字串做清理，並讓 AdminUsers/AdminPermissions 顯示與每個權限關聯的頁面路由，加入全選/全移控制
- 繼續做權限工作前請先執行 `node scripts/audit-access-control.mjs`；下一步目標：共用側邊欄路由矩陣、`has_procurement_access` migration、權限稽核日誌
- `has_procurement_access` 目前用 any cast 暫解，需要等正式 permissions 系統完成

---

## 大永後台真資料閉環交接（v6.21 / app v1.1.0）

### 本輪已完成

- 直接連線 TiDB `ordersome`，確認大永租戶為 `tenantId=90004 / dayone-eggs`
- 以真資料完成**進貨 → 供應商簽收 → 入倉 → 派車 → 列印扣庫 → 司機收現/送達 → 回庫待驗 → 管理確認 → AP/AR 結清**整條閉環
- 補齊 `dy_pending_returns` 真表驗證、AP/AR 同步、庫存異動、司機日結與頁面聯動
- `/dayone/*` 與 `/driver/*` 主要路由登入後頁面審查，無新增 console/page error

### 本輪修掉的真實 Bug

- `dayone.ar.markPaid` 現在會同步回寫 `dy_orders.paidAmount/paymentStatus`，不再出現 AR 已收清但訂單仍是 partial
- `dayone.dispatch.generateDispatch` 現在只抓可派車且未進過派車單的訂單，避免同日重複派車把舊單打回 `picked`
- `driver.recordCashPayment` 與 `dispatch.updateDispatchItem` 不會再對未送達訂單提前建立 AR，避免流程中斷留下髒帳
- `purchaseReceipt.receiveToWarehouse` 已補 `dy_inventory.unit` 寫入
- `dy_purchase_receipts.status` 與 `dy_dispatch_items.paymentStatus` 已在路由層補 schema 對齊
- 本地開發缺 R2 憑證時，`server/storage.ts` 會回退到 `public/` 本地檔案，不阻斷簽名測試

### 驗證腳本（僅本地使用）

- `scripts/dayone-tidb-live-verify.mjs`
- `scripts/dayone-live-closure-audit.mjs`
- `scripts/dayone-live-repair.mjs`
- `scripts/dayone-ensure-e2e-users.mjs`
- `scripts/dayone-playwright-smoke.mjs`
- `scripts/dayone-playwright-route-audit.mjs`
- `scripts/dayone-e2e-closure-test.mjs`

### 已驗證結果

- 真資料 E2E 腳本通過，最新保留案例 tag：`E2E-1777121064902`
- closure audit 乾淨：`signedReceiptsMissingAp=0`、`deliveredOrdersMissingAr=0`、`printedDispatchMissingStockOut=0`、`completedDispatchMissingCashReport=0`、`arRecordsOnUndeliveredOrders=0`
- `npm run build` 已通過

**庫內保留狀態**：已清掉舊 `E2E-*` 測試殘留，只保留一組最新完整案例，方便下一輪對照頁面與 TiDB。不要手動刪除這組案例，除非下一輪要先重建基線。

---

## 後台改版任務（v6.05 起）

### 宇聯後台頁面改版進度（全部完成）

| 頁面 | 路由 | 版本 |
|------|------|------|
| AdminDashboardLayout.tsx | 全域 Shell | v6.05 |
| OSProducts.tsx | /dashboard/products | v6.08 |
| OSProcurement.tsx | /dashboard/procurement | v6.09 |
| OSInventory.tsx | /dashboard/inventory | v6.10 |
| OSDailyReport.tsx | /dashboard/daily-report | v6.11 |
| OSProfitLoss.tsx | /dashboard/profit-loss | v6.12 |
| OSPurchasing.tsx | /dashboard/purchasing | v6.13 |
| OSAccounting.tsx | /dashboard/accounting | v6.14 |
| OSRebate.tsx | /dashboard/rebate | v6.15 |
| OSDelivery.tsx | /dashboard/delivery | v6.16 |
| OSCustomers.tsx | /dashboard/customers | v6.17 |
| FranchiseDashboard / Franchisees / FranchiseInquiries | /dashboard/franchise* | v6.18 |
| AdminUsers / AdminPermissions / AdminTenants / AdminSopPermissions | /dashboard/admin-* | v6.19 |
| ContentManagement / ContentEditor / AIWriter | /dashboard/content* | v6.20 |
| SOPKnowledgeBase / DailyChecklist / EquipmentRepairs / OSScheduling | 其餘 | v6.21 |

### 大永後台頁面改版進度（全部完成，v6.24 字體統一）

已完成：DayoneLayout、DayoneDashboard、DayoneOrders、DayoneDispatch、DayonePurchaseReceipts、DayoneInventoryContent、DayoneARContent、DayoneCustomersContent、DayonePurchaseContent、DayoneLiffOrders、DayoneProducts、DayoneSettings、DayoneReports、DayoneUsers、DriverPickup、DriverLayout、DriverHome、DriverToday、DriverOrders、DriverDone、DriverOrderDetail、DriverWorkLog

### 商城頁面改版進度（尚未開始）

| 頁面 | 路由 |
|------|------|
| ShopHome.tsx | /shop |
| ShopCategory.tsx | /shop/category/* |
| ProductDetail.tsx | /shop/product/* |
| Cart / Checkout / OrderComplete | /shop/cart* |

### 設計規則（後台通用）

- tRPC 查詢邏輯和 Link href 路由一律不動，只改 JSX 結構與樣式
- 每頁改完必須 `npm run build` 通過再 commit
- 禁止 gradient text、bounce easing、卡片套卡片、圓角 icon 在標題上方
- 後台不用 Framer Motion 做頁面進場動畫（太重），只用 CSS transition
- 色彩全用 OKLCH token，不硬寫 hex / tailwind 顏色名
- 每頁 commit message 格式：`feat: vX.XX [頁面名] 後台改版 [簡述]`

---

## 前端官網改版進度（v6.03，全部完成）

### 品牌設計規範

- 色彩全用 OKLCH：暖黃 `oklch(0.75 0.18 70)`，奶白背景 `oklch(0.97 0.02 85)`，深色文字 `oklch(0.18 0.02 60)`
- 字型：`--font-brand`（JF-Kamabit）用於大標題，內文用系統字
- 動畫：Framer Motion，EASE_OUT_EXPO `[0.16, 1, 0.3, 1]`，須包 `prefers-reduced-motion`
- 禁止：gradient text、bounce/elastic easing、卡片套卡片、每個標題上方放圓角 icon
- 非同步資料頁：文章/門市卡片不可用 `useInView` 控制 `animate`，改用直接 `animate`
- tRPC 查詢與路由不動，每次改完必須 `npm run build` 通過再 commit

品牌子頁面（全部完成）：BrandHome、BrandMenu、BrandStores、BrandStory、BrandFranchise、BrandNews、BrandContact

### 企業子頁面（深暖碳黑＋品牌金銅色系，全部完成）

色彩 token：
- 背景：`oklch(0.12 0.01 60)`，淺色段：`oklch(0.97 0.02 85)`
- 文字：`oklch(0.95 0.01 80)`，次要：`oklch(0.60 0.025 75)`
- 強調金銅：`oklch(0.72 0.14 78)`，強調暗：`oklch(0.26 0.06 78)`
- 分隔線：`oklch(0.22 0.02 70)`

Hero 圖片規則：
- 一律用 `/images/logo-intro-dark.png`（深色背景金黃筆刷∞）
- `position:absolute` 右半滿版，`object-fit:cover object-left`
- 左側漸層 `linear-gradient(to right, bg 0%, transparent 40%)`
- 底部漸層 `linear-gradient(to top, bg 0%, transparent 35%)`
- 禁用 `corporate-logo.png`（白底 PNG 放深色背景會破圖）

頁面：CorporateAbout、CorporateBrands、CorporateCulture、CorporateFranchise、CorporateNews、CorporateContact（全部完成）

---

## 當前任務優先順序（2026-04-26 更新）

### 第一階段：大永落地（現在進行）

目標是讓大永可以真實跑完整一天作業。已完成的是頁面和後端邏輯，但**還沒有人跑過完整流程驗證數字**。

**已修的 bug（v6.29）：**
- 派車單列印空白（v6.28）：Sheet 透過 Radix Portal 掛載，`body > *` 的 print CSS 把 portal 容器一起隱藏。改成 `handlePrint` 開新視窗並注入 `.print-target` 的 HTML 列印，繞過 Portal。
- 客戶管理新增客戶失敗（v6.29）：`settlementCycle` 的 `daily` 不在 DB enum `('per_delivery','weekly','monthly')` 內 → 改成 `per_delivery`（逐筆結）。
- 庫存管理無修改按鈕（v6.29）：在目前庫存欄加入每列「調整」按鈕，inline 編輯新數量＋備註，呼叫 `adjust` mutation（type=adjust 設定絕對值）。
- 訂單狀態欄文字斷行（v6.29）：`whitespace-nowrap` 加進 badge。
- 訂單篩選只有單日（v6.29）：加「單日／區間」切換，區間模式顯示起訖日期 input，後端 `orders.list` 補 `dateFrom` / `dateTo` 參數。
- 所有大永頁面錯誤訊息改中文（v6.29）：dayone/* 與 portal/* 的 `toast.error(e.message)` 全替換為中文說明。
- 訂單新增表單（v6.30）：商品明細欄加標題列（商品/數量/單價/小計），選商品自動帶入預設價格，即時小計，合計顯示在標頭，可刪除單行。
- 訂單列表明細展開（v6.30）：每筆訂單左側加 ChevronDown 按鈕，點擊展開顯示商品、數量、單價、小計明細；手機版也支援展開。未指派司機訂單以⚠ 橘色標示。
- 庫存異動備註中文化（v6.30）：dispatch.ts 的 `Dispatch print for order` 改為「派車單列印扣庫」，inventory.ts 的 `Confirmed truck return` 改為「管理員確認剩貨回庫」，DayoneDispatch.tsx 的 `Admin return` 也改為中文。
- 派車管理未指派訂單（v6.30）：派車工作台顯示當日未指派司機的 pending 訂單清單（橘色警示），可直接在派車頁面指派司機後再建立派車單；後端新增 `orders.setDriver` mutation。
- 派車單重新設計（v6.30）：screen view 保留漸層卡片，print-target 改為緊湊表格版（客戶/地址/商品明細/金額/結帳/箱數/實收/簽名欄），有 footer 合計列與備註區塊。
- 客戶群組系統（v6.31）：後端新增 `dy_customer_groups` 表與 `listGroups/upsertGroup/deleteGroup` procedures；`customers.list` 支援 `groupId` 篩選並回傳 `groupName`；`customers.upsert` 支援 `groupId`。前端完整實作：群組管理面板（新增/編輯/刪除群組、顯示人數）、客戶列表依群組分組顯示並可折疊、群組篩選下拉、新增/編輯表單加「所屬群組」選擇、複製客戶按鈕（預填所有欄位並自動加「-副本」後綴）。

**大永落地驗收條件（需要真人跑過）：**
1. 建訂單 → 派車 → 列印派車單有內容（v6.28 已修）
2. 司機 APP 送達 → AR 應收自動出現在「應收帳款」
3. 司機收現 → 訂單付款狀態同步更新
4. 剩貨回庫待驗 → 管理員確認 → 庫存數字增加
5. 進貨簽收 → AP 應付出現 → 確認入倉 → 庫存增加

**v6.43 修掉的 bug：**
- `deleteOrder`：已取消訂單可直接刪除（跳過派車單狀態檢查）
- `deleteOrder`：`dy_pending_returns` 刪除改為只刪此訂單關聯的特定 dispatchOrderId，不再誤刪其他訂單的回庫記錄

**v6.44 帳務整合（DayoneARContent 五 tab）：**
- 應收帳款 tab：補帳齡分析（0-30/31-60/61-90/90+ 天分桶）、信用額度超額警示、收款方式（現金/轉帳）KPI 分列
- 應付帳款 tab：從進貨頁獨立出來，本週到期橘色橫幅（`ap.dueSoonCount`）、一鍵篩選本週到期、付款對話框
- 司機日報 tab：補管理員點收確認按鈕（呼叫 `dispatch.confirmHandover`，含剩貨入庫+AR結清+派車單完成）
- 空箱台帳 tab：各客戶空箱餘額一覽（快速選客戶按鈕）+ `dy_box_transactions` 流水明細
- 月結對帳單 tab：改用獨立列印視窗（含雙簽章欄）、Excel 匯出保留
- 後端新增：`ar.listBoxTransactions`、`ar.boxBalanceSummary`、`ar.agingReport`、`ap.dueSoonCount`
- `dispatch.listDispatch` SQL 補 LEFT JOIN `dy_work_logs`，管理端可取得司機回報現金數字

**v6.45 修掉的 bug：**
- `DriverWorkLog`：剩貨回庫送出後（`dispatch.status = pending_handover/completed`）或日結已送出後，剩貨區塊切換唯讀，顯示「帶出 N 回庫 N 箱」摘要，不可重複送出
- 修掉送出後 qty 跳回 shippedQty 的視覺錯誤（改由 dispatch status 控制鎖定，不再 reset state）

**v6.46 修掉的 bug（測試 3.3/3.4/4.1/4.2/4.7）：**
- `DayoneDispatch`：撿貨單列印樣式，商品數量 `Math.round()` 移除 `.00` 小數（如 `10.00箱` → `10箱`）
- `DayoneDispatch`：派車詳情頁底部移除管理員端「剩貨回庫」section（該功能已移至司機端 `DriverWorkLog`）
- `DayoneDispatch`（3.4）：派車單已列印後顯示「撿貨單已列印」綠色 badge；`status !== "draft"` 時常駐顯示
- `DayoneDispatch`（4.2）：「撿貨完畢並扣庫存」按鈕邏輯不變，但列印按鈕改為獨立動作（只開列印視窗，不觸發 markPrinted）
- `DriverPickup`（4.1）：頁面改版為唯讀路線明細參考頁，依 stopSequence 顯示每站客戶、地址、商品明細、金額；新員工只需看頁面即可跑路線；移除個別確認按鈕
- `DriverWorkLog`（4.7）：`defaultDispatchId` 預設選最新的非 `pending_handover/completed` 派車單，同一司機下午有新派車單時不再被早上已完成的派車單鎖定

**v6.47 修掉的 bug（回庫邏輯 + 數量格式）：**
- `DriverWorkLog` 回庫唯讀畫面：原本「回庫 N 箱」顯示的是 `returnQtyByProduct` state 預設值（等於 shippedQty），與實際無關。改為從 `dispatch.getDispatchDetail` 的 `pendingReturnsByProduct` 取實際已回報數量，客戶全部簽收則顯示「回庫 0 箱」
- `DriverWorkLog` 可填寫畫面：預設值由 `shippedQty` 改為 `0`（正確預設是全部送完），司機只填車上有剩的量
- `dispatch.getDispatchDetail`：回傳新增 `pendingReturnsByProduct`，從 `dy_pending_returns` 按 productId 聚合回報量（driver 和 admin 均可讀）
- `DayoneDispatch` screen view 站點卡片：`shippedQty` 補 `Math.round` 確保整數顯示

**v6.48 修掉的 bug（查詢速度 + 雙派車單顯示不穩定）：**
- `dispatch.listDispatch`：移除每次查詢都跑的 `ensureDyDispatchSchema`（ALTER TABLE），查詢速度大幅改善
- `dispatch.getDispatchDetail`：移除每次查詢都跑的 `ensureDyPendingReturnsTable`（9 條 ALTER TABLE），查詢速度大幅改善
- `listDispatch` ORDER BY 改為 `dispatchDate DESC, id ASC`，確保同一天多張派車單順序穩定（id 小的在前）
- `DriverWorkLog.defaultDispatchId`：從尾端 reverse 找最新的非完成派車單，避免同天兩張單時仍預設到早上已完成的舊單
- `DriverWorkLog.activeDispatchId`：`selectedDispatchId` 若不在當前 `dispatches` 清單內（資料重載後可能失效），自動回退到 `defaultDispatchId`

**v6.49 日結改為任務導向（每張派車單各自日結）：**
- `dy_work_logs` 新增 `dispatchOrderId BIGINT NULL` 欄位，建立 unique index `(tenantId, driverId, dispatchOrderId)`（TiDB migration 已執行）
- `driver.submitWorkLog`：`dispatchOrderId` 改為必填，`totalOrders/totalCollected` 改為只計算這張派車單關聯的已送達訂單（透過 `dy_dispatch_items JOIN dy_orders`），`pending_handover` 狀態改為 `IN ('printed','in_progress')` 均可觸發
- `driver.getMyWorkLog`：新增 `dispatchOrderId` 可選參數，有帶時按派車單查，否則 fallback 按 `workDate` 查最新一筆（向下相容）
- `DriverWorkLog` 前端：`getMyWorkLog` 帶入 `activeDispatchId`；`deliveredOrders` 改為只算當前派車單的訂單；工作日誌區加入派車單選擇器（多張單時顯示）；送出成功提示改為「本次派車單日結已送出」

**v6.50 修掉的 bug（派車單重複建立）：**
- `generateDispatch` 的 `NOT EXISTS` 原本只排除 `draft/printed/completed`，漏掉 `in_progress` 和 `pending_handover`，導致已在配送中的訂單可被再次撈出重複建立派車單
- 補上全部 5 個 status：`draft/printed/in_progress/pending_handover/completed`
- 清掉測試過程中產生的重複派車單（dispatch id: 150001-150004）

**v6.51 修掉的 bug（派車單 race condition 雙重防護）：**
- 前端 `GenerateDialog` 加 `firedRef`：按鈕觸發後立即鎖定，防止同一操作觸發兩次 mutation；mutation 錯誤時 reset，讓使用者可重試
- 後端 `generateDispatch` 加「複用 draft」邏輯：若同日同司機已有 draft 派車單則複用，不再新建；stopSequence 接續現有最大值；徹底消除並發請求導致的重複建立

**大永尚未測試的功能（P3）：**
- 多車同一天、跨日累積後庫存數字
- 補單（臨時加站）的差異對帳
- 供應商付款（AP 付款單）完整閉環

---

### 第二階段：宇聯後台落地（大永驗收完成後）

宇聯的頁面都已做完，問題是**數字還躺在 Google Sheet / Excel，系統沒有接住**。按照以下順序打通：

**Step 1 — 日報閉環（最快有感）**
- 目標：每天門市從 `/dashboard/daily-report` 填報，損益報表數字跟智慧報表一致
- 驗收：`/dashboard/profit-loss` 顯示的各店月損益，跟「來點什麼-智慧報表系統」Google Sheet 對得起來

**Step 2 — 採購閉環**
- 目標：Make 自動化採購總表打進來的叫貨資料，可在 `/dashboard/purchasing` 看到並確認
- 驗收：`os_procurement_orders` 筆數與「!!!2026_自動化採購總表」一致

**Step 3 — 應付帳款閉環**
- 目標：月結廠商進貨金額（藍色字 Excel）對應 `os_payables`，每月可在系統核銷
- 驗收：抽 2-3 個供應商，系統應付帳金額與 Excel 一致

**Step 4 — 銀行流水對帳**
- 目標：台新銀行帳戶明細 Excel 匯入 `os_bank_transactions`，自動比對 AP 付款
- 驗收：2026-02 某月，銀行流水付款金額 = AP 核銷金額

**Step 5 — 調貨 / 加盟週結閉環**
- 目標：門市調貨與加盟主週結貨款能在系統追蹤，不靠手工 Excel

---

## 參考文件

詳細業務邏輯請看 `BUSINESS.md`；完整技術棧與 API 清單請看 `CLAUDE_REFERENCE.md`；歷史變更請看 `DEVELOPMENT_LOG.md`。

---

## 安全守則（最高優先）

- **絕對不能把 DATABASE_URL、API Key 寫死進任何 .ts / .mjs / .bat / .js 檔案**
- 敏感資料一律走 `.env`，部署走 Railway Variables（production）
- `.env` 已在 `.gitignore`，不可 commit；`.mjs` / `.bat` 也注意不要硬寫
- 腳本裡的連線資訊一律用 `process.env.DATABASE_URL`
- 2026-04-24 已清除含敏感資訊的 `migrate_temp.mjs`、`tidb-check-and-sync.mjs`、`start-dev.bat`，不要再重建

---

## 每次 commit 前的標準流程

1. **先更新 CLAUDE.md**，版號 +0.01
2. CLAUDE.md 要讓下一個接手的 Claude 看完就能掌握全局
3. 版號格式 v6.XX（目前已到 v6.27）
4. 確認 TypeScript 無錯誤再 commit
5. 每次 commit 後也要更新 `docs/ordersome_module_map_v1.html`（每個功能模組的 status-pill）
6. **前端設計工作**：使用 `impeccable` skill

---

## 待辦（後端功能）

**P1 — 影響正常作業**
- [ ] **帳務核對**：/dashboard/purchasing、/dashboard/inventory、/dashboard/accounting 各有不完整功能待補
- [ ] **needsReview 商品審核**：137筆待審商品在 /dashboard/products 逐一確認
- [ ] **日報彙總功能**：`os_daily_reports` 目前各門市資料格式不統一，彙總計算有誤

**P2 — 重要**
- [ ] 太平東/北屯等多店的門市成本分攤問題
- [ ] 異常採購品項的成本追蹤
- [ ] 供應商對帳：`autoMatchTransactions` 尚未完成，目前為手動流程
- [ ] **細粒度權限系統**：DB 新增 `os_user_permissions`，後端 permissionMiddleware，前端動態 sidebar
- [ ] **os_menu_items 待建**：TiDB 尚未建立，OSCaMenu 功能不完整；需補 migration + `os_menu_item_ingredients` + `os_products.unitCost`
- [ ] **欄位驗證**：補完所有後台功能的 DB 欄位驗證
- [ ] **稽核日誌**：所有重要操作寫入 `os_audit_logs`，庫存異動寫入 `os_inventory_logs`
- [ ] **供應商匹配**：模糊比對 `os_products.name`，補完 aliases JSON 機制

**P3 — 備用**
- [ ] BOM 建立：整合品項主檔 + `os_products`（類似 CA 表功能）
- [ ] 大永 LIFF 功能：liffId 尚未設定，`LiffOrder.tsx` 連結不上
- [ ] 大永 LINE 通知：cron 排程尚未建立
- [ ] 大永 Portal 找回密碼：email 發送尚未串接 Resend
- [ ] 商城前端改版（ShopHome / ShopCategory / ProductDetail / Cart 等）
- [ ] 臨時加貨補單與差異對帳（dispatch.ts 已加 manualAddStop，端對端未驗）
- [ ] 供應商付款單完整閉環
- [ ] 逐頁完整人工 smoke test

---

## 給 Leo 的待辦資料

| 資料 | 狀態 |
|------|------|
| 3/31 期初盤點 | 已完成 |
| 大買進貨匯入 | 已完成 2025/12起 |
| 廣弘採購單 | 已完成 2026-02起 |
| 盤點初期表單（2025全年） | 尚未提供，只有2025/12起 |
| 供應商月結帳期（合約/憑單） | 尚未提供，處理中 |

---

## DB 資料現況（2026-04-19 盤點）

| 資料表 | 筆數 | 備註 |
|----|------|------|
| os_procurement_orders | 484 | 453筆大買進貨 + 31筆頂好望族進貨 |
| os_procurement_items | 10263 | 各家進貨明細 |
| os_inventory | 187 | B類4 + 嗡嗡蜂141 + 其他22 |
| os_inventory_logs | 706 | 含3/31期初盤點入庫165筆 + 4/1起正常進出81筆 |
| os_payables | 27 | 25筆大買進貨月結應付，另2筆對帳中 |
| os_products | 704 | 啟用67 + 大買進貨匯入137筆 needsReview=1 |
| os_stores | 12 | 來點什麼門市，2026-04-19更新 |
| os_suppliers | 20+ | 廣弘、裕展、韓濟、凱田、大買、宇聯_配合、美食家、米谷、立墩、三柳、凱蒂、永豐、壯佳果、藍格等 |

### 已知資料異常

- `os_procurement_orders.storeId`：6筆 storeId=NULL，storeName 欄位有值但無對應門市，待追蹤
- `os_procurement_items.unitPrice=0`：376筆，採購單項目在 2026-02 以前的閒置舊料
- `os_products.needsReview=1`：137筆大買進貨匯入商品，需在 /dashboard/products 逐一審核
- 商品重複計算問題：部分品項在不同供應商下重複，待梳理

### os_stores 門市清單（tenantId=1，來點什麼）

| 門市名稱 | 簡稱 |
|---------|------|
| 來點什麼 東勢店（創始店） | 東勢店 |
| 來點什麼 逢甲旗艦店（直營店） | 逢甲旗艦店 |
| 來點什麼 東山店（直營店） | 東山店 |
| 來點什麼 大里店（加盟店） | 大里店 |
| 來點什麼 草屯中山店（加盟店） | 草屯店 |
| 來點什麼 北區永興店（加盟店） | 永興店 |
| 來點什麼 財神店（加盟店） | 財神店 |
| 來點什麼 民權店（加盟店） | 民權店 |
| 來點什麼 西屯福上店（加盟店） | 福上店 |
| 來點什麼 瀋陽梅川店（加盟店） | 瀋陽梅川店 |
| 來點什麼 北屯昌平店（加盟店） | 昌平店 |
| 來點什麼 南屯林新店（加盟店） | 林新店 |

> 注意：目前**沒有**豐原店。完整名稱格式：`來點什麼-{shortName}`，例如 `來點什麼-東勢店`。

---

## 採購流程詳細紀錄

### 供應商分類

**A類（直接進貨）**：廣弘、裕展、大買、凱田、韓濟、大永蛋行
- 進貨後狀態 received → 自動結算月結應付

**B類（大永自配）**：大永、椪椪（嗡嗡蜂）、長春騰、米谷、藍格
- 進貨後 received → 庫存增加 + 月結應付
- 簽收 signed → 庫存減少 + 門市應付
- 用 `os_suppliers.deliveryType='yulian'` 判斷是否大永配送
- **重要**：供應商可能跨類，需在 `os_suppliers` 維護清楚配送類型

### 庫存異動邏輯

- **期初盤點**：2026-03-31，reason='3/31期初盤點入庫'
- 進貨 received：`os_inventory currentQty +`，寫 `os_inventory_logs(in)`
- 簽收 signed：`os_inventory currentQty -`，寫 `os_inventory_logs(out)`
- 手動調整：需填原因，寫入 `os_inventory_logs(adjust)`
- **重要限制**：庫存 AND orderDate >= 2026-04-01，3/31 以前的盤點不要回算

### 進貨資料來源標記

- `os_procurement_orders.sourceType = 'damai_import'`：大買進貨匯入
- `os_payables.sourceType = 'damai_import'`：大買進貨應付帳
- `os_inventory_logs.reason LIKE '大買%'` 或 `'3/31期初%'`：識別進貨來源
- 去重機制：比對 externalOrderId，重複用 supplierName+yearMonth+sourceType 組合

### 應付帳務邏輯

- 進貨 received → `os_payables` 月結（generateMonthlyPayables）
- 供應商對帳的自動比對功能（autoMatchTransactions）尚未完成
- rebate 規則：大永約 1.12 折 / 大永蛋行另算 / 其他依 `os_rebate_rules` 存 DB
- 轉帳費用 billTransfers → `os_franchisee_payments`

### 商品名稱對照問題

- 採購單/發票，商品名稱不一定對齊，需要 supplierName
- A 供應商用「大盒蛋」，大買進貨用 aliases JSON 對照
- `needsReview=1`：大買進貨匯入待審核商品，不能自動信任

### os_stores 門市命名規則

- 完整名稱格式：`來點什麼-{門市簡稱}`，例如：`來點什麼-東勢店`
- storeName 前端顯示用，storeId 才是 FK
- **目前沒有豐原店**（已向使用者確認）

---

## 已知 Bug 與修法

**TiDB + drizzle-orm LIMIT 問題（v6.02 修好）**

- 症狀：登入頁出現 "Incorrect arguments to LIMIT" / "Failed query: select ... LIMIT ?" 錯誤
- 原因：drizzle-orm 0.44.x 把 LIMIT/OFFSET 數字當成 `?` params 傳給 mysql2 `query()`，TiDB 不支援 `LIMIT ?` 參數化語法
- **正確修法（v6.02）**：在 `server/db.ts` 的 `getDb()` 中 patch `pool.query` 攔截器，把純整數 params inline 進 SQL（`LIMIT ?` → `LIMIT 1`）再送給 TiDB
- 已修 commit：6942480；升級 drizzle-orm / mysql2 後若再出現，確認 `inlineLimitOffsetParams` 邏輯在 `db.ts` 仍存在

**時區問題（v5.77 修）**

- Railway 部署的 Node.js 時區是 UTC
- 前端顯示：`toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })`
- `datetime-local` 讀取時：`new Date(utcString).getTime() + 8*60*60*1000`
- `datetime-local` 儲存時：直接補 `:00+08:00`，讓 `new Date()` 正確解析
- `scheduledAt` 查詢邏輯：WHERE 條件用 `or(isNull(scheduledAt), lte(scheduledAt, now))`

**shadcn Dialog 捲動問題（v5.81 修）**

- `DialogContent` 預設 className 是 `grid`，加了 `flex flex-col` 會被 tailwind-merge 覆蓋
- 正確做法：把 Header + 內容 + Footer 包在 `DialogContent` 裡的額外 `div`：
  ```tsx
  <DialogContent className="!max-w-2xl p-0 gap-0 max-h-[90vh]">
    <div className="flex flex-col h-full max-h-[90vh]">
      <DialogHeader className="... shrink-0">...</DialogHeader>
      <ScrollArea className="flex-1 min-h-0 w-full">...</ScrollArea>
      <DialogFooter className="... shrink-0">...</DialogFooter>
    </div>
  </DialogContent>
  ```
- `ScrollArea` 必須給 `min-h-0`，否則 Footer 會消失
- `overflow-hidden` 不能加在 `DialogContent`，會破壞 ScrollArea

**Make 連動**

- 每天 14:55 自動觸發，走 `/api/procurement/import`
- secret：`ordersome-sync-2026`
- 失敗時查 Railway log 找 `[Procurement Import]`

**Email 發送**

- Railway 上跑 SMTP，用 nodemailer 發信
- 目前沒有設定寄送時段限制

**DB 業務邏輯備忘**

- `os_payables.netPayable = totalAmount - rebateAmount`
- `profitLoss` 讀 `os_rebates.netRebate`，不是 `os_rebate_records`
- `profitLoss.ts` 注意 tenantId（camelCase），storeId 要是字串
- 進貨表單每次提交有驗證：供應商、門市、商品、數量、金額都要填
- 應付帳表單 month 欄位不能空（generatePayables/calcRebates/autoMatch/billTransfers）
- manager 模組開關：`isModuleDefs` 的 `managerAllowed` 欄位
- 庫存表單商品超過 30 筆限制時要分頁
- `osRebate.calculate`：rebateRate > 1 就除以 100，`os_suppliers` 存的是真實數字（10.71 = 10.71%）
- `os_daily_reports` 欄位（camelCase）：tenantId, reportDate, instoreSales, uberSales, pandaSales, guestInstore, guestUber, guestPanda, phoneOrderAmount, deliveryOrderAmount
- `os_monthly_reports` 欄位（camelCase）：tenantId, electricityFee, waterFee, staffSalaryCost, performanceReview, monthlyPlan
- `profitLoss` 的 `totalSales = instoreSales+uberSales+pandaSales+phoneOrderAmount+deliveryOrderAmount`
- `products.salesCountOffset`（v5.85）：調整累計銷量用，實際銷量 = 訂單銷量 + offset

**os_stores Schema**

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

## 環境變數清單

| 變數 | 說明 |
|------|------|
| `HQ_STORE_ID` | `401534`，總部 storeId，訂單特判用 |
| `SYNC_SECRET` | `ordersome-sync-2026`，Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004`，大永的 tenantId |
| `OS_TENANT_ID` | `1`，來點什麼的 tenantId |
| `GMAIL_APP_PASSWORD` | Railway 設定裡看，SMTP 發信用 |

---

## 系統架構備忘

**多租戶架構**

```
宇聯（OrderSome）：tenantId=1，目前12間來點什麼門市
大永（Dayone）：tenantId=90004，獨立 SaaS 架構
```

**部署資訊**

- 網址：https://ordersome.com.tw
- 部署：Railway，自動 CI/CD，push 後 2-3 分鐘上線
- 資料庫：TiDB Cloud（MySQL 相容）
- 套件管理：npm 10
- Git 規則：commit 只 add 指定檔案，不用 `git add -A`

---

## Migration 注意事項

每次跑 migration 前**務必**先 DESCRIBE 確認欄位存在（TiDB 不支援 IF NOT EXISTS 某些版本）：

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
  const [rows] = await conn.execute('DESCRIBE 資料表名稱');
  console.log(rows.map(r => r.Field).join(', '));
  await conn.end();
}
check().catch(console.error);
"
```

> 注意：2026-04-18 跑 0023 migration 時有問題，`has_procurement_access` / `last_login_at` 欄位必須先查有沒有再決定要不要跑。

---

## tRPC Procurement Router Procedures

- `list` / `create` / `getDetail` / `updateStatus` / `groupBySupplier`
- `pushToLine` / `supplierLineList` / `supplierLineUpsert` / `getSuppliers`
- `deleteOrder`（superAdmin）/ `batchDeleteOrders`（superAdmin）/ `updateNote`
- `updateItem` / `addItem` / `listStoreNames` / `listSupplierNames`
- `getPickList` / `markPrinted` / `importFromDamai`（public）/ `importFromDamaiExcel`
- `listNeedsReview`

## tRPC Delivery Router Procedures

- `listDeliveryOrders` / `getDeliveryDetail` / `createDeliveryOrder`
- `createFromProcurement` / `updateStatus` / `getMonthStats`

---

## 大永系統完整紀錄

### 視覺系統規範

- `docs/backoffice-visual-system-v1.md`：後台視覺規範文件
- 後台主標題用穩定可讀的 UI 字體，不用強勢品牌字
- 色彩：暖白 / 石墨 / amber，強調色只用在重點
- CSS class 規範：`dayone-page-title`（1.35rem/700）、`dayone-page-subtitle`（0.8125rem）、`dayone-kpi-value`（clamp 動態縮放/tabular-nums）、`dayone-page-header`（flex justify-between）

### 後端補強（2026-04-24）

- `server/routers/dayone/dispatch.ts`：manualAddStop 可建立補單含 `dy_order_items`
- `server/routers/dayone/driver.ts`：delivered 後更新 AR
- `server/routers/dayone/orders.ts`：confirmDelivery 補 paidAmount 判斷 paymentStatus，upsert AR
- `server/routers/dayone/ap.ts`：markPaid 改累加式付款；新增 `dayone.ap.summary`
- `server/routers/dayone/ar.ts`：markPaid 改累加式收款
- `server/routers/dayone/purchaseReceipt.ts`：新增 `reconcileAnomaly`

### 進貨庫存邏輯（2026-04-25 確認）

- 供應商簽名 = 進貨確認 → 建立 AP，**不應**增加可賣庫存
- 可賣庫存增加 = 貨品回到大永倉庫且管理員確認入倉後
- `purchaseReceipt.sign`：只建 AP，不寫 `dy_inventory`
- `purchaseReceipt.receiveToWarehouse`：管理員確認入倉，寫庫存異動（refType: `purchase_receipt_warehouse`）
- `purchase.receive` 現已封鎖（加了明確錯誤訊息），導向進貨簽收＋入倉確認流程
- 狀態流：`pending → signed（待入倉）→ warehoused（已入倉）`

### 回庫待驗流程（Phase 1，2026-04-25）

- `dispatch.returnInventory` 不再直接寫 `dy_inventory`，改建立 `dy_pending_returns` 紀錄
- `inventory.pendingReturns` + `inventory.confirmPendingReturn`（含 transaction + row lock）
- `/dayone/inventory` 頁面顯示待驗回庫，管理員可確認入庫
- 司機/派車 UI 文字改為「剩貨回庫待驗」

### 三段式庫存視圖（已實作）

- `可賣庫存` = `dy_inventory.currentQty`
- `待入倉進貨` = 已簽收但尚未入倉的進貨單
- `回庫待驗` = `dy_pending_returns`

### Dayone 頁面地圖

**管理端**
- `/dayone`：今日訂單、待簽收進貨、已送達、異常、金額與庫存警示
- `/dayone/orders`：訂單池（LIFF/Portal/代建單）
- `/dayone/customers`：客戶主檔（商家、電話、地址、月結條件、區域）
- `/dayone/drivers`：司機主檔
- `/dayone/products`：品項主檔（蛋品品項、單位、價格、啟用）
- `/dayone/inventory`：庫存總覽（現有庫存、警示、異動紀錄、待驗回庫）
- `/dayone/purchase`：採購與供應商管理
- `/dayone/districts`：區域與配送星期規則
- `/dayone/liff-orders`：LIFF 訂單入口查核
- `/dayone/dispatch`：派車工作台（建立、列印、臨時加站、剩貨回庫）
- `/dayone/purchase-receipts`：進貨簽收（供應商簽名、入庫、建 AP、AP 付款工作台）
- `/dayone/ar`：應收帳款（客戶未收/已收/逾期，司機日報，月結對帳）
- `/dayone/users`：帳號管理

**客戶端**
- `/dayone/portal/*`：下游客戶入口（下單、對帳、帳戶資料）

**司機端**
- `/driver/today`：今日任務總覽
- `/driver/orders`：訂單與停靠點清單
- `/driver/order/:id`：單筆配送、簽名、收款
- `/driver/pickup`：撿貨/上車作業
- `/driver/done`：已完成配送
- `/driver/worklog`：現金、剩貨回庫、日結

### 真實作業流程

1. **上游進貨**：建單 → 供應商簽名 → 管理員確認入倉 → 建 AP 明細 → AP 可付款核銷
2. **下游訂單**：LIFF/Portal/人工代建 → 統一進 `dy_orders` → 管理端整併派車
3. **派車出車**：依日期/區域/司機生成派車單 → 列印時扣庫存 → 司機撿貨出車
4. **配送簽收**：客戶簽名、現收或月結 → 送達後形成/更新 AR
5. **剩貨回庫**：車上剩貨建立待驗回庫紀錄 → 管理員確認 → 庫存增加

### 後續新增節點規則

每次新增節點前必須先說明：
1. 節點屬於哪條主線（訂單/進貨/派車配送/帳務）
2. 觸發時點（建立、列印、簽名、送達、回庫）
3. 影響哪些資料表
4. 是否影響庫存數量
5. 是否影響 AR / AP

**Dayone 主線 Table 對照：**
- 訂單主線：`dy_orders`
- 派車配送主線：`dy_dispatch_orders`, `dy_dispatch_items`
- 進貨主線：`dy_purchase_receipts`
- 庫存主線：`dy_inventory`, `dy_stock_movements`
- 待驗回庫：`dy_pending_returns`
- 下游應收：`dy_ar_records`
- 上游應付：`dy_ap_records`

### Chunk 策略

- 白畫面事故後已移除所有 `manualChunks`，回退保守單一 chunk 策略
- v6.26 已對重型靜態 import 改用動態載入：xlsx（OSAccounting/OSPurchasing/OSScheduling/DayoneARContent）、RichTextEditor/tiptap（ContentEditor/SOPKnowledgeBase），以及 App.tsx Router 內層加 `<Suspense fallback={null}>` 避免頁面切換時全屏白畫面
- 若未來再做 chunk 優化：先確認 Railway 部署與瀏覽器 runtime log，不可直接重上 manualChunks，任何拆包都必須先驗證首頁與 `/dayone/*` 不白畫面

### 對下一個對話框的提醒

- 不要碰高風險 chunk / lazy route 拆包
- 不要自作主張大改視覺，優先邏輯閉環
- 不能說系統 100% 沒問題，要區分「已驗證」和「尚未驗證」
- 每做一輪都要 build 驗證後再 commit、push
- 使用者非常在意：有沒有 commit、有沒有 push、有沒有更新 CLAUDE.md
- 回報要誠實，build 有過 ≠ 全站驗證完
- `DriverSign.tsx` 目前為 legacy/未掛載狀態，現行簽名路徑是 `DriverOrderDetail.tsx -> dayone.driver.uploadSignature`
- AR 建立/更新仍有多個入口，後續需統一

### Make 自動化相關

- 每天同步 Webhook 自動觸發 `os_daily_reports`，SYNC_SECRET 驗證
- 大買進貨 importFromDamai 透過 Google Sheets 觸發
- Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
- SYNC_SECRET：`ordersome-sync-2026`

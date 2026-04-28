# todo.md — OrderSome 待辦清單

> 上次更新：2026-04-29（v7.26）
> 有新想法就加在對應 P 等級下面。要開始做某件事，先把它標為 `[ 進行中 ]`，完成後打 `[x]`。
> 已完成的項目定期移到底部「已完成」區。

---

## P1 — 影響正常作業（優先做）

### 大永後端帳務 Bug 修復（靜態審查發現，需修完才能真實驗收）

- [x] **Bug 1（高）— `updateDispatchItem` AR 不同步**：司機派車工作台更新現收金額時，`dy_ar_records` 未同步更新，已修（v6.71）
- [x] **Bug 2（高）— `confirmHandover` 結清條件**：已確認程式碼為正確的 `ar.status IN ('unpaid','partial')`，無需修
- [x] **Bug 3（高）— `getMyTodayOrders` UTC 日期**：已使用 `todayTW()` 台灣時間，無需修
- [x] **Bug 4（中）— `deleteOrder` 誤刪 pending_returns**：已有細粒度 productId 比對邏輯，無需修
- [x] **Bug 5（中）— `markPrinted` 庫存負數**：已用 `GREATEST(0, currentQty - ?)` 保護，無需修
- [x] **Bug 6（中）— 月結對帳單月底日期**：已用 `new Date(year, month, 0).getDate()` 正確計算，無需修
- [x] **Bug 7（低）— `getLiffOrders` tenantId**：已透過 input.tenantId 傳入，無需修
- [x] **Bug 8（低）— `calcDueDate` 重複**：三個檔案均已 import utils.ts，無需修

### 大永落地驗收（2026-04-28 測試進行中）

驗收條件（需要真人跑過完整一天）：
- [x] 建訂單 → 派車 → 列印派車單有內容
- [x] 司機 APP 送達 → AR 應收自動出現在「應收帳款」
- [x] 司機收現 → 訂單付款狀態同步更新
- [ ] 剩貨回庫待驗 → 管理員確認 → 庫存數字增加（回庫上限邏輯已修，待完整驗收）
- [ ] 進貨簽收 → AP 應付出現 → 確認入倉 → 庫存增加

### 大永司機端待修（2026-04-28 session 發現）

- [ ] **簽名強制驗證**：已修邏輯（localSignatureUrl），需用新訂單實測確認無法繞過
- [ ] **月結客戶補單合併後，簽名頁流程**：合併到未完成訂單後，司機去現場時需正常走 DriverOrderDetail 簽名→送達，需端對端驗收

### 大永上線前驗收（程式碼靜態審查已通過 v7.26，剩實際跑流程）

- [ ] 剩貨回庫待驗 → 管理員確認 → 庫存數字增加
- [ ] 進貨簽收 → AP 應付出現 → 確認入倉 → 庫存增加

### 宇聯後台數字落地

- [ ] **日報閉環**：門市從 `/dashboard/daily-report` 填報，`/dashboard/profit-loss` 數字與 Google Sheet「來點什麼-智慧報表系統」對得起來
- [ ] **帳務核對**：`/dashboard/purchasing`、`/dashboard/inventory`、`/dashboard/accounting` 各有不完整功能待補
- [ ] **needsReview 商品審核**：137筆待審商品在 `/dashboard/products` 逐一確認
- [ ] **日報彙總功能**：`os_daily_reports` 各門市資料格式不統一，彙總計算有誤

---

## P2 — 重要（大永驗收完成後）

### 宇聯數字打通（按順序）

- [ ] **採購閉環**：Make 自動化採購總表資料可在 `/dashboard/purchasing` 看到並確認（目標：`os_procurement_orders` 筆數與「!!!2026_自動化採購總表」一致）
- [ ] **應付帳款閉環**：月結廠商進貨金額對 `os_payables`，每月可在系統核銷（抽查 2-3 個供應商）
- [ ] **銀行流水對帳**：台新銀行帳戶明細 Excel 匯入 `os_bank_transactions`，自動比對 AP 付款
- [ ] **調貨 / 加盟週結閉環**：門市調貨與加盟主週結貨款能在系統追蹤，不靠手工 Excel

### 系統功能補強

- [ ] **細粒度權限系統**：DB 新增 `os_user_permissions`，後端 permissionMiddleware，前端動態 sidebar
- [ ] **os_menu_items 待建**：TiDB 尚未建立，OSCaMenu 功能不完整；需補 migration + `os_menu_item_ingredients` + `os_products.unitCost`
- [ ] **欄位驗證**：補完所有後台功能的 DB 欄位驗證
- [ ] **稽核日誌**：所有重要操作寫入 `os_audit_logs`，庫存異動寫入 `os_inventory_logs`
- [ ] **供應商對帳**：`autoMatchTransactions` 尚未完成，目前為手動流程
- [ ] **供應商匹配**：模糊比對 `os_products.name`，補完 aliases JSON 機制
- [ ] **多店成本分攤**：太平東/北屯等多店的門市成本分攤問題

---

## P3 — 備用（有空再做）

- [ ] **商城前端改版**：ShopHome / ShopCategory / ProductDetail / Cart / Checkout / OrderComplete
- [ ] **大永 LINE 通知**：下單成功後自動傳確認訊息給客戶 LINE（需串 Messaging API）
- [ ] **大永 Portal 找回密碼**：email 發送尚未串接 Resend
- [ ] **補單差異對帳**：dispatch.ts 已加 manualAddStop，端對端未驗
- [ ] **供應商付款完整閉環**：AP 付款單端對端驗證
- [ ] **多車同日跨日庫存**：多車同一天、跨日累積後庫存數字驗證
- [ ] **逐頁人工 smoke test**：完整人工測試所有頁面
- [ ] **BOM 建立**：整合品項主檔 + `os_products`（CA 表功能）
- [ ] **LIFF 下單說明文字**：下單頁加「今日收單截止 08:00，超過將排至下一個送貨日」提示

---

## 給 Leo 的待辦資料

| 資料 | 狀態 |
|------|------|
| 3/31 期初盤點 | 已完成 |
| 大買進貨匯入（2025/12起） | 已完成 |
| 廣弘採購單（2026-02起） | 已完成 |
| 盤點初期表單（2025全年） | 尚未提供，只有2025/12起 |
| 供應商月結帳期（合約/憑單） | 尚未提供，處理中 |

---

## 已完成（記錄用）

- [x] 宇聯後台頁面改版全部（v6.05–v6.21）
- [x] 大永後台頁面改版全部（v6.22–v6.24，v6.24 字體統一）
- [x] 前端官網改版全部（v6.03，品牌 + 企業頁面）
- [x] 後台存取重構（shared/access-control.ts）
- [x] 大永真資料閉環驗證（E2E-1777121064902）
- [x] 派車單列印修正（v6.28）
- [x] 客戶群組系統（v6.31）
- [x] 帳務整合 DayoneARContent 五 tab（v6.44）
- [x] 工作日誌任務導向（每張派車單各自日結，v6.49）
- [x] generateDispatch 防重複（v6.50–v6.51）
- [x] LIFF 客戶綁定流程（v6.54–v6.56）
- [x] LIFF 商品圖片、庫存反灰、金額小計、成功畫面明細（v6.61）
- [x] LIFF 收單截止 08:00 配送日邏輯（v6.62）
- [x] 後台品項管理圖片上傳（v6.61）
- [x] 三段式定價架構（客製 → 分級 → 主檔，v6.63–v6.65）
- [x] `dy_level_prices` table + 分級定價管理頁（/dayone/level-prices，v6.65）
- [x] 客製定價管理（客戶管理頁 🏷 按鈕，新增/覆蓋，v6.66）
- [x] 信用額度軟性警示（建訂單超額 toast，v6.67）
- [x] LIFF 訂單查詢頁（/liff/my-orders，單日/區間/明細/付款狀態，v6.68）
- [x] LIFF 商品顯示正確客製定價（getProducts 帶入 lineId，v6.69）
- [x] 客製定價調整功能＋歷史紀錄（v6.70）
- [x] AR 同步修復：updateDispatchItem 補上 upsertArRecord（v6.71）
- [x] P1 Bug 全部驗證完畢，2~8 均已在先前版本修好（v6.71）
- [x] 後台帳務三張列印報表（司機日結、每日彙總、月結對帳單）+ 後端 reports router（v6.92）
- [x] confirmHandover 現金比例分配 + completeDispatch 防重複日結（v6.92）
- [x] 司機端進貨供應商 listForDriver 權限拆分（v6.93）
- [x] DriverOrderDetail 簽名必填強制 + localSignatureUrl 時序修正（v6.93–v6.95）
- [x] 司機端拒收（返單）流程：rejectNote + returned 狀態（v6.94）
- [x] 後台訂單管理今日未送達警示橫幅（v6.94）
- [x] 補貨商品 listForDriver 權限拆分（products + suppliers，v6.96–v6.98）
- [x] 補貨對話框選商品自動帶入 defaultPrice（v6.95）
- [x] 配送訂單頁卡片預設收合、展開顯示詳情（v6.97）
- [x] DriverLayout 底部導覽改用 h-dvh flex-col 結構固定貼底（v6.99）
- [x] 補單 deliveryDate 時區修正（UTC→台灣+8h，v7.00）
- [x] 回庫數量上限修正：shippedQty + extraQty − supplementUsed（v7.01）
- [x] 補單自動合併同客戶未完成訂單（A方案，v7.02）
- [x] 大永全站三輪靜態審查（時區/DECIMAL/ensureSchema/欄位名/權限，v7.23–v7.26）
  - 修正：CONVERT_TZ 時區（orders/ar/dispatch/driver/reports）
  - 修正：AR 逾期標記補 partial + CURDATE()
  - 修正：帳齡分析 DATEDIFF 全改 CURDATE()
  - 修正：移除所有 ensureSchema 反模式（purchaseReceipt/inventory/dispatch）
  - 修正：deliverBoxes/form.qty/calcDueDate 動態 import
  - 修正：LiffMyOrders 金額計算 NaN（TiDB DECIMAL string）
  - 修正：DriverLayout 補角色守衛（非 driver/super_admin 顯示友善提示）

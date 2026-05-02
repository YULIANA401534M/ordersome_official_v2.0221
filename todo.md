# todo.md — OrderSome 待辦清單

> 上次更新：2026-05-02（v7.40）
> 有新想法就加在對應 P 等級下面。要開始做某件事，先把它標為 `[ 進行中 ]`，完成後打 `[x]`。
> 已完成的項目定期移到底部「已完成」區。

---

## P1 — 影響正常作業（優先做）

### 宇聯後台數字落地（按順序）

- [ ] **日報閉環**：門市從 `/dashboard/daily-report` 填報，`/dashboard/profit-loss` 數字與 Google Sheet「來點什麼-智慧報表系統」對得起來
- [ ] **採購閉環**：Make 自動化採購總表資料可在 `/dashboard/purchasing` 看到並確認（目標：`os_procurement_orders` 筆數與「!!!2026_自動化採購總表」一致）
- [ ] **應付帳款閉環**：月結廠商進貨金額對 `os_payables`，每月可在系統核銷（抽查 2-3 個供應商）
- [ ] **銀行流水對帳**：台新銀行帳戶明細 Excel 匯入 `os_bank_transactions`，自動比對 AP 付款

### 大永 BUG 待命（使用中，有回報再處理）

- [ ] **剩貨回庫驗收**：剩貨回庫待驗 → 管理員確認 → 庫存增加（流程未完整跑過，待大永回報）
- [ ] **進貨入倉驗收**：進貨簽收 → AP 出現 → 確認入倉 → 庫存增加（流程未完整跑過，待大永回報）
- [ ] **司機 APP 回報**：等大永司機實際使用後回報任何操作問題

---

## P2 — 重要（宇聯數字落地後）

### 系統功能補強

- [ ] **needsReview 商品審核**：137筆待審商品在 `/dashboard/products` 逐一確認
- [ ] **日報彙總功能**：`os_daily_reports` 各門市資料格式不統一，彙總計算有誤
- [ ] **細粒度權限系統**：DB 新增 `os_user_permissions`，後端 permissionMiddleware，前端動態 sidebar
- [ ] **os_menu_items 待建**：TiDB 尚未建立，OSCaMenu 功能不完整；需補 migration + `os_menu_item_ingredients` + `os_products.unitCost`
- [ ] **欄位驗證**：補完所有後台功能的 DB 欄位驗證
- [ ] **稽核日誌**：所有重要操作寫入 `os_audit_logs`，庫存異動寫入 `os_inventory_logs`
- [ ] **調貨 / 加盟週結閉環**：門市調貨與加盟主週結貨款能在系統追蹤，不靠手工 Excel

---

## P3 — 備用（有空再做）

- [ ] **大永 LINE 通知**：下單成功後自動傳確認訊息給客戶 LINE（需串 Messaging API）
- [ ] **大永 Portal 找回密碼**：email 發送尚未串接
- [ ] **LIFF 下單說明文字**：下單頁加「今日收單截止 08:00，超過將排至下一個送貨日」提示
- [ ] **商城前端改版**：ShopHome / ShopCategory / ProductDetail / Cart / Checkout / OrderComplete
- [ ] **逐頁人工 smoke test**：完整人工測試所有頁面
- [ ] **BOM 建立**：整合品項主檔 + `os_products`（CA 表功能）
- [ ] **供應商付款完整閉環**：AP 付款單端對端驗證
- [ ] **多車同日跨日庫存**：多車同一天、跨日累積後庫存數字驗證

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
- [x] 大永全站三輪靜態審查（時區/DECIMAL/ensureSchema/欄位名/權限，v7.23–v7.27）
- [x] 大永全站多角色靜態審查 + 緊急 BUG 修復（v7.36–v7.40）
  - dispatch markPrinted/confirmHandover 加 transaction（v7.36）
  - franchiseePayment markPaid 補 tenantId 防跨租戶（v7.36）
  - 全站大永頁面 fmtDate 補 timeZone: Asia/Taipei（v7.36）
  - driver.getMyTodayOrders 修 TiDB JOIN ON 子查詢問題（v7.36）
  - inventory movements 修 TiDB LIMIT 參數化問題（v7.37）
  - DriverOrderDetail 出貨商品明細改用 driver.getOrderItems（v7.38）
  - LIFF 換為正式大永蛋品 Channel（v7.39）

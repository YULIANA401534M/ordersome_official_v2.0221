# todo.md — OrderSome 待辦清單

> 上次更新：2026-04-28
> 有新想法就加在對應 P 等級下面。要開始做某件事，先把它標為 `[ 進行中 ]`，完成後打 `[x]`。
> 已完成的項目定期移到底部「已完成」區。

---

## P1 — 影響正常作業（優先做）

### 大永落地驗收

驗收條件（需要真人跑過完整一天）：
- [ ] 建訂單 → 派車 → 列印派車單有內容
- [ ] 司機 APP 送達 → AR 應收自動出現在「應收帳款」
- [ ] 司機收現 → 訂單付款狀態同步更新
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

## P2 補充 — 大永 LIFF 上線（接下來要做）

> 這段完成就是整個系統 80% 了，很重要。

- [ ] **LINE Developers 建 LIFF app**：去 developers.line.biz 建立 LIFF，Endpoint URL 設為 `https://ordersome.com.tw/liff`，拿到新 liffId 後換掉 code 裡的舊值
- [ ] **客戶綁定流程**：`dy_customers` 有 `lineId` 欄位但前台沒有綁定入口。需在 LIFF 首次開啟時做「輸入手機號碼確認身份 → 系統寫入 lineId」的綁定流程（目前直接查 lineId 找不到會報錯）
- [ ] **每個客戶填好預設司機 + 送貨頻率**：後台 `/dayone/customers` 編輯每筆客戶資料
- [ ] **端對端測試**：用自己的 LINE 掃 QR Code → LIFF 下單 → 後台確認訂單有司機 → 早上建派車確認自動分配

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

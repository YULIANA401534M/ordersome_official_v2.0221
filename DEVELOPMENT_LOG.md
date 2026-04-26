# DEVELOPMENT_LOG.md — OrderSome 歷史變更紀錄

> 此檔案存放 CLAUDE.md 移出的舊版變更記錄，供查閱歷史。
> 新對話不需讀此檔案，有需要才查。

---

## 2026-04-15 — 大永 P0-P3 完善（Batch 1-3）

| 檔案 | 變更摘要 |
|------|---------|
| `drizzle/schema.ts` | role enum 加入 driver |
| `server/routers/dayone/tenantUsers.ts` | 租戶用戶管理（listUsers/createUser/updateUser/resetPassword/deleteUser），createUser(driver) 自動同步 dy_drivers |
| `server/routers/dayone/ar.ts` | 新增 customerOverdueStats（按客戶聚合逾期天數）/ monthlyCollectionStats（月度已收/未收） |
| `server/routers/dayone/driver.ts` | getMyTodayOrders 加入 customerUnpaidAmount 子查詢 |
| `client/src/components/TenantUserManagement.tsx` | 通用用戶管理元件（接受 tenantId prop，來點什麼可直接複用） |
| `client/src/pages/dayone/DayoneUsers.tsx` | 大永用戶管理頁 |
| `client/src/pages/dayone/DayoneAR.tsx` | 逾期篩選 tab（全部/逾期/正常）+ 紅色 ⚠️ badge |
| `client/src/pages/dayone/DayoneReports.tsx` | 改為 Tabs 結構，四報表各加 CSV 匯出按鈕，新增收款統計 tab + Recharts 柱狀圖 |
| `client/src/pages/dayone/driver/DriverOrderDetail.tsx` | 客戶有逾期帳款時顯示紅色警示橫幅 |
| `client/src/utils/exportCSV.ts` | 通用 CSV 匯出工具（含 BOM，支援 Excel 中文） |
| `client/src/components/DayoneLayout.tsx` | 側邊欄補「用戶管理」（UserCog 圖示） |
| `scripts/migrate-add-driver-role.mjs` | ALTER TABLE users MODIFY COLUMN role 加入 driver |
| `scripts/seed-dayone-suppliers.mjs` | Seed 17 家供應商（已執行） |
| `scripts/create-portal-test-account.mjs` | Portal 測試帳號（已執行） |
| `scripts/verify-dayone-system.mjs` | 16 項系統健康度驗證腳本（全通過） |

---

## 2026-04-13 — 大永帳務 + 客戶 Portal 全套

| 檔案 | 變更摘要 |
|------|---------|
| `scripts/migrate-dayone-phase2.mjs` | 新增 10 張 dy_ 表（ar/ap/driver_cash/purchase_receipts/dispatch/box_ledger 等），ALTER dy_customers/users |
| `server/routers/dayone/ar.ts` | 改寫為 7 procedures：listReceivables/markPaid/addAdminNote/listDriverCashReports/createDriverCashReport/resolveAnomaly/monthlyStatement |
| `server/routers/dayone/ap.ts` | 新增 4 procedures：listPayables/markPaid/supplierPriceList/upsertSupplierPrice |
| `server/routers/dayone/purchaseReceipt.ts` | 新增 5 procedures：list/create/sign/detail/reportAnomaly（含 R2 簽名上傳） |
| `server/routers/dayone/dispatch.ts` | 新增 7 procedures：generateDispatch/listDispatchOrders/getDispatchDetail/updateDispatchItem/completeDispatch/manualAddStop/updateDispatchStatus |
| `server/routers/dayone/portal.ts` | 新增 10 procedures：register/loginWithLine/me/myOrders/myReceivables/addCustomerNote/myStatement/myPrices/changePassword/bindLine |
| `server/routers/dayone/index.ts` | 新增 ap/purchaseReceipt/dispatch/portal 子路由 |
| `server/_core/index.ts` | 新增每日 07:00 台灣時間自動派車 cron |
| `client/src/pages/dayone/DayoneAR.tsx` | 完整改寫：3 Tabs（AR列表/司機現金/月結對帳），Excel/Print 匯出 |
| `client/src/pages/dayone/DayoneDispatch.tsx` | 新建：派車單列表、詳情 Sheet、手動加停靠點 |
| `client/src/pages/dayone/DayonePurchaseReceipts.tsx` | 新建：進貨簽收，Canvas 簽名，供應商價格預填 |
| `client/src/pages/dayone/portal/DayonePortalLayout.tsx` | 新建：Portal 版型（桌面側欄 + 手機底部導覽列） |
| `client/src/pages/dayone/portal/DayonePortalLogin.tsx` | 新建：LINE LIFF + Email/密碼 登入 |
| `client/src/pages/dayone/portal/DayonePortalRegister.tsx` | 新建：客戶自助註冊 |
| `client/src/pages/dayone/portal/DayonePortalHome.tsx` | 新建：Portal 首頁（未付/本月訂單/空箱摘要） |
| `client/src/pages/dayone/portal/DayonePortalOrders.tsx` | 新建：客戶訂單查詢（月份篩選/分頁/展開明細） |
| `client/src/pages/dayone/portal/DayonePortalStatement.tsx` | 新建：月結對帳單（可列印/加備註） |
| `client/src/pages/dayone/portal/DayonePortalAccount.tsx` | 新建：帳戶頁（基本資料/空箱/價目表/改密碼/LINE綁定） |
| `client/src/pages/dayone/DayoneCustomers.tsx` | 新增：customerLevel Badge/settlementCycle/Portal設定Tab/客戶專屬價格Tab |
| `client/src/pages/dayone/DayoneDashboard.tsx` | 新增：4 張財務 KPI 卡片（今日應收/逾期未付/異常司機/待簽收進貨） |
| `client/src/pages/dayone/driver/DriverOrders.tsx` | 完成配送時新增：空箱 Stepper/收款金額/備註，呼叫 dispatch.updateDispatchItem |
| `client/src/App.tsx` | 新增 /dayone/purchase-receipts + 6 portal 路由 |
| `client/src/components/DayoneLayout.tsx` | 側邊欄新增「進貨簽收」入口 |
| `client/src/components/AdminDashboardLayout.tsx` | DY ERP 新增 dispatch/purchase_receipts 入口，ar/dispatch/pending 紅色 badge 計數 |

---

## 2026-04-12

| 檔案 | 變更摘要 |
|------|---------|
| `client/src/pages/dayone/SupplierList.tsx` | tenantId hardcode 2→90004、包 DayoneLayout、加空狀態 |
| `server/routers/dayone/suppliers.ts` | 移除 updatedAt 欄位（dy_suppliers 表無此欄） |
| `client/src/pages/admin/SuperAdminTenants.tsx` | tenantMap 組裝邏輯修正，欄位對齊後端 |
| `client/src/pages/admin/SuperAdminModules.tsx` | toggle onSuccess invalidate 兩個 tenantId |
| `client/src/components/AdminDashboardLayout.tsx` | useEffect+useState 取代 render 陣列、osModuleDefs 補齊 7 筆、super-admin 路由包入 Layout |
| `client/src/App.tsx` | super-admin 路由包 AdminDashboardLayout |
| `server/routers/dayone/reports.ts` | topCustomers LIMIT 改內插避免 TiDB 綁定錯誤 |
| `users`（TiDB） | 新增 osmanager@ordersome.com.tw（tenantId=1, manager）、dayonevip@dayone.com（tenantId=90004, manager） |

---

## 2026-04-11

| 檔案 | 變更摘要 |
|------|---------|
| `client/src/pages/dayone/DayoneLayout.tsx` | **TENANT_ID 從 2 改為 90004**（影響全部大永頁面，根本性修復） |
| `client/src/pages/dayone/DayoneInventory.tsx` | 重構為 wrapper，傳入 TENANT_ID prop |
| `client/src/pages/dayone/DayoneInventoryContent.tsx` | 抽出為通用元件，接受 tenantId prop |
| `dy_inventory`（TiDB） | 補入 17 筆初始庫存記錄（productId 30001-30017，currentQty=0） |
| `scripts/check-dy-inventory.mjs` | 新增 DB 查詢確認腳本 |

---

## 2026-04-10

| 檔案 | 變更摘要 |
|------|---------|
| `server/mail.ts` | 改用 Resend API 發信（取代 SMTP） |
| `server/routers.ts` | 已出貨自動寄 Email 給買家、新訂單通知管理員 |
| `orders` 表 | 新增 `shippingProofUrl` 欄位 |
| `server/routers/sop.ts` | createDocument 預設 status 改為 published |
| `client/src/pages/dashboard/ContentEditor.tsx` | 排程發布警示文字 |
| `client/src/pages/admin/AdminOrders.tsx` | 訂單詳情顯示買家 Email、出貨證明上傳 |
| `server/routers/ai-writer.ts` | AI 文章助手後端 API（Gemini 2.5 Flash + NewsAPI） |
| `client/src/pages/dashboard/AIWriter.tsx` | AI 文章助手前端頁面 |
| `client/src/pages/Dashboard.tsx` | 入口頁重設計，依角色顯示功能卡片 |
| `client/src/components/AdminDashboardLayout.tsx` | 完全重寫側邊欄（純 Tailwind），三大分組：宇聯/來點什麼/大永 |
| `client/src/hooks/useModules.ts` | tenantId 修正為 90004 |

---

## 2026-04-08

| 檔案 | 變更摘要 |
|------|---------|
| `server/liff.ts` | LIFF 下單 API，多租戶支援（TENANT_MAP：dayone→90004），getProducts/createOrder 接 tenant 參數 |
| `client/src/pages/liff/LiffOrder.tsx` | LIFF 下單頁面，接 LINE SDK，從 ?tenant= 讀取租戶，多租戶 TENANT_CONFIG |
| `client/src/pages/dayone/DayoneLiffOrders.tsx` | 大永後台 LIFF 訂單查看頁（新建），手機/桌面雙版型 |
| `client/src/components/DayoneLayout.tsx` | 側邊選單新增「LIFF訂單」入口（/dayone/liff-orders） |
| `client/src/App.tsx` | 新增 /dayone/liff-orders 路由 |
| `server/routers/dayone/orders.ts` | 新增 getLiffOrders procedure（orderSource='liff', tenantId=90004） |

---

## 2026-04-07

| 檔案 | 變更摘要 |
|------|---------|
| `AdminOrders.tsx` | 時間格式含時分、來源篩選中文、super_admin 刪除按鈕、紫色標籤改中文 |
| `AdminDashboard.tsx` | 卡片從 4 個→6 個，grid 改 `grid-cols-2 md:grid-cols-3` |
| `server/db.ts` | 新增 `deleteOrder(id, tenantId)`（先刪 items 再刪 orders） |
| `server/routers.ts` | 新增 `order.delete`（adminProcedure） |
| `RichTextEditor.tsx` | useEffect 在 editor.isEmpty 時 setContent，修復草稿空白 |
| `server/routers/storage.ts` | uploadPdf 改用 r2Put（原為 Manus storagePut） |
| `drizzle/schema.ts` | posts 表新增 scheduledAt / category，migration: 0020_medical_forge.sql |
| `server/routers/content.ts` | getPublishedPosts 改分頁格式、新增 publishScheduled |
| `server/_core/index.ts` | 新增每分鐘排程器（自動發布到期草稿） |
| `ContentEditor.tsx` | 新增 category 下拉 + scheduledAt datetime-local 選擇器 |
| `ContentManagement.tsx` | 分類篩選 tab + 卡片顯示分類標籤 |
| `BrandNews.tsx` | 分頁、16:9 圖片、分類篩選 |
| `CorporateNews.tsx` | 同上 |

---

---

## 2026-04-18 到 2026-04-19 — 進銷存採購帳務系統建立（v5.23-v5.54）

### 採購系統
- Make → /api/procurement/import 串接（itemsCsv 格式，`;;` 分隔行，`|` 分隔欄位）
- OSPurchasing 四功能：篩選/批量刪除（superAdmin）/品項編輯/金額顯示
- 叫貨單狀態流程：pending→sent→confirmed→received
- 按鈕業務語言化：傳送訂單/廠商已確認/確認收貨入庫
- sourceType badge 簡化：自配/直送/手動
- 撿貨單列印（A4，B類，宇聯+來點什麼LOGO）
- 大麥 Excel 歷史訂單匯入（防重複以 orderNo 為唯一鍵，aliases 比對，needsReview 標記）
- 排序功能：日期/狀態/金額/廠商
- 移除月份切換箭頭，改固定本月篩選範圍
- storeName 原樣顯示（移除 .replace('來點什麼-', '') 前綴去除）

### 品項成本系統
- os_products 326筆從CA表匯入（seed-os-products-v2.mjs）
- 欄位：aliases(JSON)/unitQty/unitName/packUnit/packCost/batchPrice/category1/category2
- 品名命名規則定案（大麥格式：品名_規格/計價單位，不含廠商前綴）
- os_product_categories 兩層分類表

### 廠商管理
- os_suppliers 加 deliveryType ENUM('direct','yulian','other') DEFAULT 'direct'
- B類廠商由DB控制（deliveryType='yulian'），現有5筆：宇聯_配合/宇聯/立墩/三柳/凱蒂
- 移除所有 YULIAN_SUPPLIERS 硬編碼

### 庫存管理
- os_inventory + os_inventory_logs 建表
- 叫貨單 received（B類）→ 查 os_suppliers.deliveryType='yulian' → 庫存增加
- 配送派車單 signed（B類）→ 庫存減少（不低於0）
- 批次盤點多選功能（全選 checkbox + 批次 Dialog）
- 安全庫存警戒值（setSafety）
- os_audit_logs：稽核日誌（刪除/修改留快照，永久不可刪）

### 帳務系統
- os_payables：廠商應付帳款（月結，每廠商每月一筆）
- os_bank_transactions：銀行明細（自動比對建議 matchScore，人工 confirmedBy 確認）
- os_rebates：退佣帳款
- os_rebate_rules：退佣規則存DB（廣弘10.71%/伯享差價/韓濟抵貨款）
- os_transfers：提貨調貨（月底結算→門市應收）
- OSAccounting.tsx：四Tab（應付/銀行對帳/退佣/提貨調貨）

### 配送管理（v5.54 重構）
- 派車單從叫貨單自動建立（createFromProcurement procedure）
- 狀態：pending→picking→dispatched→delivered→signed
- 簽收觸發庫存減少 + 應收帳款產生
- toStoreId 改為允許 NULL（ALTER TABLE）
- 主按鈕改「從叫貨單建立」（橘）＋「手動新增」（outline）
- 三步驟 Dialog：選叫貨單 → 派車資訊 → 品項預覽
- useSearch 讀取 ?from= 自動開 Dialog（從 OSPurchasing 跳轉）
- 狀態按鈕中文化：開始撿貨/已出車/貨已送達/確認簽收
- signed 顯示綠色「已完成」badge

### 系統架構
- superAdminProcedure：刪除限 super_admin，作廢 manager 可做
- os_sidebar_order：側邊欄拖曳排序（dnd-kit，super_admin 專用）
- 側邊欄重構：宇聯集團/來點什麼（採購庫存/帳務財務/門市作業）/大永ERP

### 各版本要點
- **v5.23-v5.28**：Make→採購API串接，itemsCsv 格式，自動 orderNo
- **v5.31-v5.34**：OSPurchasing 四功能強化，deleteOrder/batchDeleteOrders/updateItem
- **v5.35-v5.38**：庫存管理系統v1，稽核日誌，B類廠商DB化，自動入庫修正
- **v5.39-v5.40**：品項資料重構，seed-os-products-v2，OSProducts 表格重整，側邊欄拖曳
- **v5.46-v5.49**：帳務系統完成（四Tab），五個bug修正（撿貨單/派車/packCost/批次盤點/checkbox）
- **v5.52-v5.53**：Make診斷修正，OSPurchasing視覺/排序，移除月份切換，storeName原樣顯示
- **v5.54**：派車單重構，從叫貨單自動建立，中文狀態按鈕，URL參數跳轉
- **v5.55**：派車單簽收 userId null bug 修正，帳務手動新增應付帳款，庫存異動歷史查詢
- **v5.56**：大麥商品244筆匯入 os_products（共567筆，無重複），叫貨管理刪除按鈕擴展至sent狀態，exportExcel 年月 bug 修正，文件大整理

---

## 2026-04-19 v5.45-v5.56 — 採購帳務配送系統完整建立

### 完成項目
- 帳務系統五張表建立（os_payables/os_bank_transactions/os_rebates/os_rebate_rules/os_transfers）
- OSAccounting.tsx 四Tab前端（應付/銀行對帳/退佣/提貨調貨）
- 配送派車單從叫貨單自動建立（createFromProcurement）
- 派車單 signed → 庫存減少連動
- 庫存批次盤點多選 + 異動歷史查詢
- 大麥商品244筆匯入（別名對照建立，原有325筆+新增242筆=共567筆，無重複）
- 叫貨管理：日期篩選修正、排序功能、刪除按鈕擴展至sent、exportExcel bug修正
- 撿貨單列印（A4，按廠商分區）
- 大麥Excel匯入（防重複，needsReview標記）
- 側邊欄重構（宇聯集團/來點什麼/大永ERP）
- BUSINESS.md 完整重寫，CLAUDE.md 文件大整理

### 已知問題與待確認
- 骰子雞球/港式蘿蔔糕等品項「箱 vs 包」單位差異，需人工到品項成本頁確認
- 3/31 盤點資料待匯入（庫存基準點尚未建立）
- 排班管理需先新增員工資料才能使用
- os_products 的 `temperature` 欄位不存在，溫層目前存在 `category2`

### 下一階段重點
- 大麥歷史資料批次匯入（廠商對帳89772筆/採購出貨11112筆）
- 盤點資料匯入
- 派車單跨門市合併撿貨單列印

*DEVELOPMENT_LOG.md — 查閱用，新對話只讀 CLAUDE.md 即可*

---

## 2026-04-19 v5.57–v5.71 — 歷史資料匯入、圖表升級、UAT 修正

- **v5.57** `c7588d6`：大麥三階段歷史資料匯入（453張叫貨單/10263筆品項/706筆庫存記錄）、os_stores 建立12間門市、健康檢查四項修復（tenantId型別/has_procurement_access欄位/storeId允許NULL/deliveryOrder userId允許NULL）
- **v5.58** `98fde53`：新增系統模組地圖（ordersome_module_map_v1.html）、CLAUDE.md 更新守則第5條（commit前同步模組地圖狀態）
- **v5.59** `3e1572f`：叫貨管理補表頭全選 checkbox、CLAUDE.md 版本號更新
- **v5.60** `ae6233d`：庫存管理六項重構——數字格式千分位、單位合併欄、下拉操作選單、刪除功能（super_admin）、統計列（總筆數/總庫存金額）、itemValue = currentQty × unitCost
- **v5.61** `fc3719e`：撿貨單邏輯修正——相同品項跨門市數量加總，小字顯示各門市分配明細
- **v5.62** `2847b0e`：帳務修正——清理宇聯應付錯誤資料、補 os_payables.month 欄位、修正 import 腳本排除 B 類自配廠商
- **v5.63** `9d51e9e`：帳務七項修正——netPayable 補寫、退佣表名統一、韓濟抵貨款登記、食材成本接真實數據（os_payables）、updateRebate 同步 netRebate
- **v5.64** `ecf0d77`：損益表欄位名全面修正（camelCase 統一）、庫存金額統計列
- **v5.65** `456004c`：損益儀表板圖表升級——recharts AreaChart 每日趨勢、PieChart 通路分拆、BarChart 費用結構；庫存最後修改時間（updatedAt）；近10筆異動記錄
- **v5.66** `99b4650`：對話框交接文件同步——commit hash 補全、模組說明更新、待辦清單重整
- **v5.66** `887e6d7`：新增 ERP 前端 UAT 驗收表 v1.0（72 項測試，含跨模組 Golden Path）
- **v5.67** `40912b8`：UAT 第一梯修正——叫貨日期預設空（查全部）+快速選本週/本月/三個月/全部、帳務月份預設空（顯示全部）+操作按鈕在 month 為空時 disabled、profitLoss 採購成本確認、deleteMut 確認接通
- **v5.68** `cf41c75`：UAT 第二梯修正——manager 權限 B 方案（osModuleDefs.managerAllowed 控制可見模組）、損益儀表板非授權者導回 /dashboard、叫貨管理廠商下拉篩選、庫存分頁每頁30筆、品項分頁每頁50筆+needsReview篩選、帳務「查看明細」跳轉叫貨管理帶廠商篩選
- **v5.69** `cb57eac`：補齊 v5.68 未套用的五項修正——DB 開放 purchasing_os/daily_report_os 模組、OSProfitLoss 圖表確認、查看明細確認、庫存分頁確認、品項分頁+待確認確認
- **v5.70** `1bf182f`：退佣計算修正（rebateRate > 1 時除以100，os_suppliers 存百分比整數如10.71）、os_rebate_records 清空重算、profitLoss 補齊 channelSales/dailyTrend/procurementCost/isCostEstimated、退佣帳款頁新增 accounting.listRebates query 和「計算本月退佣」按鈕、OSDailyReport 月彙整 state 改名 viewYear/viewMonth
- **v5.71** `d5868fd`：加盟主叫貨單權限——server/_core/trpc.ts 新增 franchiseeOrAdminProcedure、procurement list 改用新 procedure、franchisee 自動用 storeId→os_stores 取得 storeName 篩選（storeId 為 null 回傳空）、OSPurchasing 加 isFranchisee 隱藏店別篩選/批量刪除/所有 canEdit 操作按鈕、空狀態提示依角色切換
- **v5.71** `7c877fe`：CLAUDE.md 新增兩個大任務規劃——集中式權限管理系統（os_user_permissions、permissionMiddleware，P2）、菜單成本 os_menu_items 表建置（P2）

---

## 2026-04-20 v6.01–v6.27 — 大永真資料閉環 + 後台改版啟動

- **v6.01–v6.02**：TiDB LIMIT 參數化 bug 修正（`db.ts` inlineLimitOffsetParams patch）、連線確認
- **v6.03**：前端官網改版全部完成（BrandHome/BrandMenu/BrandStores/BrandStory/BrandFranchise/BrandNews/BrandContact + CorporateAbout/CorporateBrands/CorporateCulture/CorporateFranchise/CorporateNews/CorporateContact），OKLCH 色彩規範建立
- **v6.05–v6.21**：宇聯後台改版全部完成（AdminDashboardLayout → OSProducts → OSProcurement → OSInventory → OSDailyReport → OSProfitLoss → OSPurchasing → OSAccounting → OSRebate → OSDelivery → OSCustomers → Franchise* → Admin* → Content* → SOP/Checklist/Equipment/Scheduling）
- **v6.21**：大永真資料閉環驗證通過（E2E-1777121064902），closure audit 全 0 錯誤
- **v6.22–v6.24**：大永後台改版全部完成（DayoneLayout → DayoneDashboard → DayoneOrders → DayoneDispatch → DayonePurchaseReceipts → DayoneInventoryContent → DayoneARContent → DayoneCustomersContent → DayonePurchaseContent → DayoneLiffOrders → DayoneProducts → DayoneSettings → DayoneReports → DayoneUsers → DriverPickup → DriverLayout → DriverHome → DriverToday → DriverOrders → DriverDone → DriverOrderDetail → DriverWorkLog），v6.24 字體統一
- **v6.25**：後台存取重構（shared/access-control.ts，集中式 role/tenant/module 常數，第一輪清除本地 middleware）
- **v6.26**：Chunk 優化（xlsx/tiptap 改動態 import，App.tsx Router 加 Suspense），避免白畫面
- **v6.27**：權限系統第三輪（ORDER_SOME_PERMISSION_DEFINITIONS，未知權限清理，AdminUsers/AdminPermissions 頁面路由顯示，全選/全移控制）

---

## 2026-04-21~27 v6.28–v6.51 — 大永落地 Bug 修正

- **v6.28**：派車單列印空白 → handlePrint 開新視窗注入 `.print-target` HTML，繞過 Radix Portal 被 `body > *` print CSS 隱藏
- **v6.29**：新增客戶失敗（settlementCycle `daily` 不在 DB enum，改 `per_delivery`）；庫存管理加「調整」按鈕（inline 編輯，type=adjust 設絕對值）；訂單狀態欄 `whitespace-nowrap`；訂單篩選加「單日/區間」切換（後端補 dateFrom/dateTo）；dayone/* 全站錯誤訊息中文化
- **v6.30**：訂單新增表單加商品明細標題列、選商品自動帶預設價格、即時小計；訂單列表 ChevronDown 展開明細；庫存異動備註中文化；派車管理顯示未指派訂單橘色警示 + 指派司機按鈕（後端 `orders.setDriver`）；派車單重設計（screen 漸層卡片 + print 緊湊表格）
- **v6.31**：客戶群組系統（`dy_customer_groups` 表，listGroups/upsertGroup/deleteGroup，customers.list 支援 groupId 篩選，群組管理面板 + 群組分組顯示 + 複製客戶按鈕）
- **v6.43**：deleteOrder 已取消訂單可直接刪除（跳過派車單狀態檢查）；`dy_pending_returns` 刪除改為只刪特定 dispatchOrderId，不誤刪其他訂單
- **v6.44**：帳務整合 DayoneARContent 五 tab（帳齡分析/信用警示/應付帳款獨立 tab/司機日報管理員確認/空箱台帳/月結改獨立列印視窗）；後端新增 ar.listBoxTransactions/boxBalanceSummary/agingReport、ap.dueSoonCount；listDispatch SQL 補 LEFT JOIN dy_work_logs
- **v6.45**：DriverWorkLog 剩貨回庫送出後切換唯讀，修掉送出後 qty 跳回 shippedQty 的視覺錯誤
- **v6.46**：撿貨單 shippedQty 移除 `.00` 小數；DayoneDispatch 移除管理端剩貨回庫 section；派車單已列印顯示綠色 badge（status !== draft 常駐）；列印按鈕改獨立動作不觸發 markPrinted；DriverPickup 改版為唯讀路線明細頁；DriverWorkLog defaultDispatchId 預設最新非完成派車單
- **v6.47**：DriverWorkLog 回庫唯讀改從 `pendingReturnsByProduct` 取實際已回報數量；可填寫畫面預設值由 shippedQty 改為 0；dispatch.getDispatchDetail 回傳 pendingReturnsByProduct
- **v6.48**：移除 ensureDyDispatchSchema/ensureDyPendingReturnsTable（每次查詢跑 ALTER TABLE），大幅提升查詢速度；listDispatch ORDER BY 改 `dispatchDate DESC, id ASC`；DriverWorkLog activeDispatchId 失效時自動回退 defaultDispatchId
- **v6.49**：工作日誌改為任務導向（每張派車單各自日結）；dy_work_logs 新增 dispatchOrderId 欄位 + unique index；submitWorkLog dispatchOrderId 必填；getMyWorkLog 支援 dispatchOrderId 參數
- **v6.50**：generateDispatch NOT EXISTS 補全 5 個 status（補上 in_progress/pending_handover），修掉重複派車單問題；清掉測試殘留 dispatch id 150001-150004
- **v6.51**：前端 GenerateDialog 加 firedRef 防重複觸發；後端 generateDispatch 加「複用 draft」邏輯（同日同司機已有 draft 則複用，stopSequence 接續最大值）

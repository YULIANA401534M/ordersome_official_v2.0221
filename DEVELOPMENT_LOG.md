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

*DEVELOPMENT_LOG.md — 查閱用，新對話只讀 CLAUDE.md 即可*

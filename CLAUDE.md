# CLAUDE.md — 宇聯國際餐飲 OrderSome 開發主檔

業務邏輯請讀 BUSINESS.md，技術參考請讀 CLAUDE_REFERENCE.md

> **版本**：v5.49。**最後更新**：2026-04-19。**給 Claude 架構**：大覽（Claude.ai）+ 實作（Claude Code）

---

## 第一件事

拿到這份文件時，先執行：
```bash
git status && git log --oneline -3
```
確認 working tree clean、最新 commit 是今天的，再開始工作。

---

## 當前開發狀態（換對話框必讀）

> 最後更新：2026-04-19 v5.48。**新大腦進來請從這裡開始讀，不要跳過。**

### ⚠️ 開發守則（每次換對話框都要遵守）

1. 每次 commit 前**必須更新 CLAUDE.md**，反映最新完成項目和下一步
2. CLAUDE.md 是跨對話框的唯一記憶體，不更新等於下一個 Claude 失憶
3. 版本號每次 +0.01，格式 v5.XX

---

### 開發原則（永久有效，每次換對話框必讀）

1. **RWD 優先**：所有頁面必須支援手機、平板、桌機，表格在手機上要能橫向捲動，文字必須清晰可讀
2. **模組完整性**：每個功能模組必須包含列表、新增、修改、詳情/明細、刪除（super_admin）或作廢（manager）
3. **資料關聯**：跨模組資料必須有 DB 層級關聯（JOIN 或外鍵），不能只靠前端組合
4. **稽核追蹤**：所有刪除寫 os_audit_logs（快照+原因），所有修改寫快照，os_inventory 異動寫 os_inventory_logs
5. **防重複**：所有匯入功能必須有唯一鍵防重複，匯入後輸出驗證報告（成功N筆/失敗N筆/原因）
6. **命名規則**：品項正式名稱存 os_products.name，外部系統名稱（大麥等）存 aliases JSON 陣列
7. **可修改性**：所有業務規則（B類廠商清單、退佣比率等）存 DB 不寫死在程式碼

---

### 資料整合規劃

**基準點：2026-03-31 全宇聯資產盤點**
- 盤點資料格式待確認（4/19 從採購取得）
- 匯入後：os_inventory.currentQty = 盤點數量，lastCountDate = '2026-03-31'

**歷史訂單匯入（大麥 Excel 格式）**
- 欄位對應：訂單編號→orderNo, 供應商→supplierName, 訂購店家→storeName, 商品名稱→productName, 計價單位→unit, 計價數量→quantity, 進貨價→unitPrice, 溫層→temperature, 訂單日期→orderDate
- 防重複：以訂單編號（orderNo）為唯一鍵，重複略過
- B類叫貨單匯入後自動標記 received，觸發庫存入庫邏輯
- 匯入工具路徑：/dashboard/purchasing → 「匯入 Excel」按鈕

**大麥 vs 系統品名對照**
- 大麥品名格式：「勁辣雞腿排(特大)_10片*8包/箱」
- CA表品名格式：「東豪-勁辣雞腿(特大)10片/包」
- 系統正式名稱：存 os_products.name
- 別名：所有外部名稱存 os_products.aliases JSON 陣列
- 匯入時：先比對 name，找不到比對 aliases，都找不到建立新品項並 flag 待確認

---

### 待完成功能清單（依優先順序）

**P1 本週：**
- [x] 叫貨管理新增匯入大麥 Excel ✅
- [x] 撿貨單列印 ✅
- [x] 帳務管理基礎建置 ✅
- [ ] 3/31 盤點資料匯入庫存（4/19 取得資料後執行）

**P2 之後：**
- [ ] 全系統 RWD 審查（所有頁面手機版）
- [ ] 歷史資料批次匯入工具（銀行明細、日記帳）
- [ ] 退佣自動計算（廣弘10.71%、伯享差價、韓濟抵貨款）
- [ ] BOM 物料清單（os_bom 表，開工條件：採購資料穩定且 os_products 成本準確）

**P3 等外部配合：**
- [ ] 大永 LIFF 正式 liffId（等蛋博）
- [ ] 積欠款 LINE 推播

---

### 給新大腦的重要提醒

**郵件系統**：
- Railway 環境封鎖 SMTP 出口（IPv6 問題），nodemailer 無法連接 Gmail SMTP
- Resend 免費版只能寄到 verified email，無法寄到任意外部信箱
- 目前 `sendMail` 函數存在但實際不可用於生產環境
- 解決方案：未來需驗證自有網域（ordersome.com.tw）並用 Resend API
- 短期不要嘗試修復此問題，優先處理業務功能

**CA 表（菜單成本）**：
- `os_menu_items` 等 5 張表原本未執行 0024 migration
- 已於 2026-04-18 用 node script 補建，現在正常
- `/dashboard/ca-menu` 可正常使用

**連動關係（重要）**：
- 叫貨單（confirmed）→ 配送管理（新增派車單時可選關聯叫貨單，自動帶入品項）
- 配送管理簽收 → 自動產生 `os_franchisee_payments`（應收帳款）
- 應收帳款 → 損益儀表板（`arIncome` 欄位）
- 退佣 → 損益儀表板（`rebateIncome` 欄位）
- 加盟主管理頁 → 點「查看帳款往來」跳轉到帳款頁（帶 userId 篩選）
- **叫貨單（received）→ 查 `os_suppliers.deliveryType='yulian'`（用 os_procurement_items 的 supplierName 查）→ 寫 `os_inventory`（changeType='in'）+ `os_inventory_logs`**

**宇聯總部 storeId = 401534**（機動人員排班用，不要改這個數字）

**下次換對話框前務必確認**：
1. `git status` clean
2. `pnpm run build` 零錯誤
3. CLAUDE.md 已更新版本號和 git 狀態

---

### 最新 Git 狀態（2026-04-19 v5.49）

最後三個 commit（已 push）：
1. （本次）fix: v5.49 五個 bug 修正
2. docs: BUSINESS.md 完整重寫 v5.48，反映 2026-04-19 所有業務邏輯
3. feat: 前端四頁面 v5.46 — 撿貨單列印 + 大麥匯入 + 帳務管理 + 側邊欄 badge

working tree: clean

**v5.49 完成項目（五個 bug 修正）：**
- **Bug 1（撿貨單查不到資料）**：`procurement.ts` getPickList SQL 改為 `NOT IN ('cancelled', 'received')`，前端說明文字同步更新
- **Bug 2（派車單 beginTransaction 錯誤）**：`delivery.ts` 移除所有 `beginTransaction/commit/rollback`，改用 try-catch + console.error（TiDB Cloud pool 不支援 transaction）
- **Bug 3（packCost 計算錯誤）**：DB 直接修正兩筆：壽司米 1224→1225、糖粉 0.05→45；seed 腳本新增支援 `it.cost` 欄位直接使用 CA 表成本（東豪-勁辣雞腿 DB 不存在，略過）
- **Bug 4（批次盤點多選）**：`OSInventory.tsx` 新增批次盤點模式，含全選 checkbox、逐行 checkbox、盤點 Dialog（數量 input + 共用備註）、完成後顯示 N 筆結果
- **Bug 5（叫貨管理 checkbox）**：`OSPurchasing.tsx` checkbox 條件改為 `isPending || order.status === "sent"`，sent 狀態也顯示 checkbox

**rename 執行結果（2026-04-18 最終診斷）**：
- 更新 0 筆（新）+ 13 筆（上次已改），找不到 175 筆
- **根本原因確認**：DB 裡的 os_products 是 CA 表命名體系（seed-os-products-v2 建），而 rename 清單 original 是大麥格式品名，兩套體系不同
  - 廠商名也有差異（如大麥「韓澤」/ CA表「韓濟」、品名「招牌壽司米」/ DB「台梗壽司米」）
- **處理策略**：品名統一需等大麥 Excel 匯入後，以實際大麥品名建立 aliases 對照，不能事先批次更新

**v5.40 完成項目（seed 欄位修正 + OSProducts 表格重整）：**
- seed-os-products-v2.mjs：
  - pattern 重寫（按片/張/顆/根/入/kg/g/ml/L 順序，不含條和包）
  - packUnit 過濾無效單位：元/克/毫升/片/張 → 留空
  - packCost 改為 unitQty × unit_cost（整包進貨總成本）
  - batchPrice = it.price（整包批售價），unitCost = it.unit_cost（最小單位成本）
  - aliases = JSON.stringify([it.name])
  - 326 筆全部更新，失敗 0 筆
- OSProducts.tsx：
  - 表格欄位改為「供應商|品名|分類|最小單位|整包單位|成本|批價|毛利率|操作」
  - 最小單位格：unitQty+unitName 合併（如「10片」「30000克」）
  - packUnit 空時顯示「-」
  - 毛利率：(batchPrice-packCost)/batchPrice，packCost=0 或 batchPrice=0 顯示「-」
  - 毛利率顏色：≥20% 綠/5-20% 橘/<5% 紅
  - 欄位標題：「成本」（原整包進貨成本）、「批價」（原批售價）

**注意：packUnit 有部分品項為空（CA 表原始資料未填，如 unit='片'/'克' 等），需後台手動修正。**

**v5.39 完成項目（品項資料重構 + 前端更新 + 側邊欄拖曳）：**
- DB：os_products 新增 aliases(JSON)/unitQty/unitName/packUnit/packCost 五欄
- scripts/seed-os-products-v2.mjs：326 筆全部 UPSERT，解析品名中的片/克/毫升/根等單位
- server/_core/index.ts：採購匯入改查 packCost 並支援 aliases JSON_CONTAINS 比對
- server/routers/osProducts.ts：productUpsert 加入新欄位
- OSProducts.tsx：表格欄位改為「品名|品類|供應商|最小單位|單位成本|整包單位|整包成本|批售價|毛利率」，毛利率改用 (batchPrice-packCost)/batchPrice，Dialog 加 aliases/unitQty/unitName/packUnit/packCost
- OSPurchasing.tsx：按鈕名稱改業務語言（傳送訂單給廠商/廠商已確認收單/確認收貨入庫），狀態 badge 顏色統一，received 顯示綠色「已完成」badge
- DB：建立 os_sidebar_order 表（tenantId/menuKey/sortOrder）
- server/routers/admin.ts：新增 getSidebarOrder / saveSidebarOrder（superAdminProcedure）
- AdminDashboardLayout.tsx：super_admin 登入時「來點什麼 ERP」群組右上角有「排列」按鈕，點擊進入 dnd-kit 拖曳模式，儲存後寫入 DB

**v5.38 完成項目（全專案 debug + B 類廠商補齊）：**
- DB：`os_suppliers` 新增四筆 B 類廠商（宇聯/立墩/三柳/凱蒂），deliveryType='yulian'（宇聯_配合已存在，共 5 筆 yulian）
- **Bug 修正一（嚴重）**：`procurement.ts` `updateStatus` received 邏輯錯誤 — 舊版查 `SELECT supplierName FROM os_procurement_orders`，但此欄位不存在於 `os_procurement_orders` 表。改為查 `SELECT DISTINCT supplierName FROM os_procurement_items WHERE procurementOrderId=?`，B 類自動入庫才能實際執行。
- **Bug 修正二（業務規則）**：`OSPurchasing.tsx` 作廢 Dialog — 原為「作廢原因（選填）」且按鈕無 disabled 保護；改為「必填」並加 `disabled={!cancelReason.trim()}`，與稽核日誌規範一致。

**v5.37 完成項目（deliveryType + 移除硬編碼 + 自動入庫）：**
- DB：`os_suppliers` 加 `deliveryType ENUM('direct','yulian','other') DEFAULT 'direct'`
- DB：`宇聯_配合` 已設為 yulian（其他 B 類廠商待後台手動維護）
- `server/_core/index.ts`：移除 `YULIAN_DELIVERY_SUPPLIERS` 硬編碼，改查 `os_suppliers.deliveryType`
- `server/routers/inventory.ts`：新增 `listYulianSuppliers` procedure（查 deliveryType='yulian' 的廠商）
- `client/src/pages/dashboard/OSInventory.tsx`：移除 `YULIAN_SUPPLIERS` 陣列，廠商下拉改呼叫 `listYulianSuppliers`
- `server/routers/procurement.ts`：`updateStatus` 收到 received 時自動判斷 B 類廠商並寫入 `os_inventory`
- `BUSINESS.md`：B 類廠商說明改為資料庫驅動描述

**v5.36 完成項目（稽核日誌 + 權限分離）：**
- DB：建立 `os_audit_logs`（稽核日誌表，永久不可刪）
- `server/_core/trpc.ts`：新增 export `superAdminProcedure`（僅 super_admin）
- `server/routers/procurement.ts`：
  - `deleteOrder`：改為 superAdminProcedure，必填 reason，刪前快照寫 audit log
  - `batchDeleteOrders`：改為 superAdminProcedure，必填 reason，每筆寫 audit log
  - `updateStatus`：cancelled 時寫 audit log（action='cancel'）
  - `updateItem`：修改前快照寫 audit log（action='update'）
- `server/routers/inventory.ts`：`adjust` note 改為必填（min 1）
- `OSPurchasing.tsx`：刪除按鈕限 super_admin；「取消」改「作廢」加 reason Dialog；刪除 Dialog 加 reason textarea（必填）
- `OSInventory.tsx`：調整庫存 Dialog reason 改必填

**v5.35 完成項目（庫存管理系統 v1）：**
- DB：建立 `os_inventory`（品項主表）+ `os_inventory_logs`（異動記錄）
- `server/routers/inventory.ts`：7 個 procedure（list/getDetail/adjust/count/setSafety/addProduct/alertCount）
- `server/routers.ts`：掛載 `inventoryRouter`
- `OSInventory.tsx`：完整重建（廠商/分類篩選 + 低庫存 checkbox + 狀態 badge + 調整/設警戒 Dialog + 新增品項 Dialog + KPI 三卡片）
- `AdminDashboardLayout.tsx`：庫存管理側邊欄顯示低庫存警告紅色 badge（alertCount）
- 備註：B 類廠商（宇聯/立墩/三柳/凱蒂）在 os_products 無資料，os_inventory 目前為空表，需手動新增品項或未來 ETL

**v5.34 完成項目（OSPurchasing 四功能強化）：**
- `procurement.ts`：`list` 新增 storeName 篩選 + totalAmt 加總；新增 `batchDeleteOrders`、`updateItem`、`addItem`、`listStoreNames`、`listSupplierNames` 五個 procedure
- `OSPurchasing.tsx`：
  - 功能一：日期範圍篩選（startDate/endDate，預設本週一～今天）+ 店別下拉 + 廠商下拉
  - 功能二：pending 單卡片左側 checkbox + 批量刪除按鈕（含確認 Dialog）
  - 功能三：品項明細每行 pencil 編輯按鈕 + 表格底部「新增品項」按鈕（各自開 Dialog）
  - 功能四：卡片顯示合計金額（totalAmt>0 顯示 $X,XXX，否則「金額待填」）+ 明細表格新增「單價」「金額」兩欄

**v5.31 完成項目：**
- DB：清除三筆測試舊單（items 刪 16 筆、orders 刪 3 筆），保留最新兩筆（廣弘、宇聯_配合）
- `server/routers/procurement.ts`：新增 `deleteOrder`、`updateNote` 兩個 procedure
  - `deleteOrder`：先刪 items，再刪 status=pending 的 order
  - `updateNote`：UPDATE note 欄位
- `OSPurchasing.tsx`：操作按鈕區新增「刪除」（status=pending 才顯示）和「備註」（所有狀態）
  - 刪除：確認 Dialog → 呼叫 deleteOrder mutation
  - 備註：textarea Dialog → 呼叫 updateNote mutation

**v5.28 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` 改用 CSV 格式接收品項
  - 原本接收 `items[]` 陣列，改為接收 `itemsCsv` 字串（避免 JSON 特殊字符問題）
  - 格式：每行一筆，欄位用 `|` 分隔：`supplierName|storeName|productName|unit|quantity|temperature`
  - endpoint 接收欄位：`{ secret, orderDate, orderNo?, itemsCsv }`

**v5.27 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` 自動從 `os_products` 查詢單價
  - items for loop 新增查詢 `os_products WHERE name = ?`，取得 `unitCost` → `unitPrice`
  - `amount = unitPrice * item.quantity`（無對應品項時 unitPrice=0）
  - INSERT 改帶入 `unitPrice` 和 `amount`
- DB：清除三筆測試空單（`os_procurement_orders` 刪 4 筆空 order，items 刪 0 筆）

**v5.26 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` items INSERT 移除不存在欄位
  - `os_procurement_items` 無 `tenantId` 欄位、無 `createdAt` 欄位，已從 INSERT 移除
  - `os_procurement_orders` 有 `tenantId`，orders INSERT 保留不動
  - SHOW COLUMNS 確認實際欄位：`id, procurementOrderId, supplierId, supplierName, storeName, productName, unit, quantity, unitPrice, amount, temperature, lineSent, lineSentAt`

**v5.25 完成項目：**
- `server/_core/index.ts`：`POST /api/procurement/import` 支援自動產生 orderNo
  - `orderNo` 改為 optional，未傳時自動產生 `DM-YYYYMMDD-{timestamp後6碼}`
  - 驗證邏輯調整：僅需 `orderDate` + `items[]`（`orderNo` 可省略）
  - 重複檢查：僅在有明確傳入 `orderNo` 時才執行略過邏輯
  - 回傳格式改為 `{ success, orderNo, orderId, itemCount }`
  - console.log 改為 `[Procurement Import] orderNo=..., items=...` 格式

**v5.24 完成項目：**
- `server/_core/index.ts`：品項 for loop 前加 `console.log("[Procurement Import] items received:", ...)` debug log
- `OSPurchasing.tsx`：orderDate 顯示改為 `?.slice(0, 10)`（相容 YYYY-MM-DD 與 ISO timestamp）
- `OSPurchasing.tsx`：品項展開時空陣列顯示「尚無品項記錄」而非空白
- DB：刪除 `os_procurement_orders id=1` 測試資料（items 已無殘留）

**v5.23 完成項目：**
- `server/_core/index.ts`：新增 `POST /api/procurement/import` 標準 REST endpoint
  - SYNC_SECRET 驗證
  - 重複 orderNo 自動略過
  - 插入 os_procurement_orders 主表 + os_procurement_items 品項
  - 廠商 id 自動從 os_suppliers 查找
  - 使用頂部已 import 的 `db.getDb()`（非動態 import）

**v5.22 完成項目：**
- `procurement.ts`：新增 `getSuppliers` procedure（adminProcedure，回傳 isActive=1 廠商列表）
- `OSPurchasing.tsx`：新增「手動補單」按鈕（outline variant，位於匯出 Excel 按鈕右側）
- 手動補單 Dialog：日期選擇 + 單號（自動產生 MAN-YYYYMMDD-xxx，可修改）+ 動態品項列表
  - 廠商欄位為下拉選單（從 getSuppliers 取得，確保名稱完全比對 os_suppliers.name）
  - 溫層下拉（常溫/冷藏/冷凍）
  - 呼叫 importFromDamai（secret hardcode，orderNo 重複自動 skip 不報錯）

---

### 已完成模組一覽（截至 2026-04-19 v5.46）

| 路由 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| `/dashboard/profit-loss` | `OSProfitLoss.tsx` | ✅ 完成 | KPI 三卡片 + 費用明細 + canSeeCostModules 遮罩 |
| `/dashboard/franchisee-payments` | `OSFranchiseePayments.tsx` | ✅ 完成（有 TS 錯誤待修） | 應收管理 + 標記收款 + 週結摘要 + 匯出 Excel |
| `/dashboard/ca-menu` | `OSCaMenu.tsx` | ✅ 完成 | 菜單品項/OEM/成本歷史 三 Tab（DB 表於 2026-04-18 補建，現可正常使用）|
| `/dashboard/scheduling` | `OSScheduling.tsx` | ✅ 完成 | 早/晚/機動三 Tab + 假日標示 + 月統計 + Excel 匯出 |
| `/dashboard/delivery` | `OSDelivery.tsx` | ✅ 完成（有 TS 錯誤待修） | 派車單 + 狀態推進 + 簽收自動產生應收 |
| `/dashboard/franchisees` | `OSCustomers.tsx` | ✅ 完成 | 加盟主列表 + 功能開關 + 採購存取 + 新增帳號 |
| `/dashboard/purchasing` | `OSPurchasing.tsx` | ✅ 更新 | KPI 卡片 + 叫貨單列表 + 詳情展開 + 新增 Dialog + LINE 推播 + 廠商 LINE 設定 + Excel 匯出 + 撿貨單列印（A4）+ 大麥 Excel 匯入 |
| `/dashboard/accounting` | `OSAccounting.tsx` | ✅ 完成 | 四 Tab（應付/銀行對帳/退佣/提貨調貨）+ KPI 卡片 + 匯入匯出 |
| `os_inventory` + `os_inventory_logs` | — | ✅ 完成 | 庫存管理兩張表（B類廠商用）|
| `os_audit_logs` | — | ✅ 完成 | 稽核日誌表（永久不可刪）|
| `os_suppliers.deliveryType` | — | ✅ 完成 | B 類廠商由 DB 控制，現有 5 筆 yulian |
| `/dashboard/inventory` | `OSInventory.tsx` | ✅ 完成 | 庫存管理頁 |
| `/dashboard/daily-report` | `OSDailyReport.tsx` | ✅ 完成 | 門市日報 |
| `/dashboard/products` | `OSProducts.tsx` | ✅ 完成 | 品項成本 |
| `/dashboard/rebate` | `OSRebate.tsx` | ✅ 完成 | 退佣帳款 |
| `/dayone/portal/forgot-password` | `DayonePortalForgotPassword.tsx` | ✅ 完成 | 改為顯示聯繫電話 0980-190-857，不走 email 流程 |

---

### 🔴 下一階段開發計畫（按優先順序）

#### ✅ 階段一：Debug — 已完成（2026-04-18）
#### ✅ 階段二：進銷存重建 — OSPurchasing.tsx（已完成，2026-04-18）
**目標**：把 `/dashboard/purchasing` 從大永殼換成來點什麼自己的採購介面

後端 `procurement` router 完整 procedures（截至 v5.46）：
- `list` / `create` / `getDetail` / `updateStatus` / `groupBySupplier`
- `pushToLine` / `supplierLineList` / `supplierLineUpsert` / `getSuppliers`
- `deleteOrder`（superAdmin） / `batchDeleteOrders`（superAdmin） / `updateNote`
- `updateItem` / `addItem` / `listStoreNames` / `listSupplierNames`
- `getPickList` / `markPrinted` / `importFromDamai`（public） / `importFromDamaiExcel`
- `listNeedsReview`

#### 階段三：帳務系統 ✅ 已完成（v5.45/v5.46）
- `/dashboard/accounting`：OSAccounting.tsx（四 Tab）
- accounting router：16 個 procedure 完整
- 銀行對帳自動比對邏輯、退佣計算、提貨調貨月底結算

#### 階段四：排班假日標示 ✅ 已完成
- `dailyReport.getHolidaysByMonth` 已存在，OSScheduling.tsx 正常使用

---

### 待處理清單

**P1 — 來點什麼**

1. **撿貨單列印功能**（B 類，`/dashboard/purchasing`）— 收貨後可列印每單品項清單
2. **os_menu_items 菜單成本匯入**（CA 表各菜單分頁）— 手動填入或 ETL
3. **BOM 物料清單（第二步）**— 開工條件：採購叫貨資料穩定、os_products 成本資料準確

**P2 — 需要外部確認**

4. **大永 LIFF 正式 liffId**（等蛋博用自己的 LINE 後台建立）
   建立後只需改 `client/src/pages/liff/LiffOrder.tsx` 的 `TENANT_CONFIG dayone.liffId` 一行
5. **大永積欠款 LINE 推播邏輯補完**
   cron 基礎已建（`server/_core/index.ts`），每小時整點執行，等蛋博確認設定值

**技術債**

- `has_procurement_access` 前端型別補強（`useAuth` User 型別正式擴充）
- 大永 / 來點什麼 ERP 的表不在 `schema.ts`，用 raw SQL
- 本機菜單圖未遷移 R2
- chunk size 超標（index.js 6266 kB），需 code splitting

---

### 重要常數（開發時用）

| 常數 | 值 | 說明 |
|------|----|------|
| `HQ_STORE_ID` | `401534` | 宇聯總部 storeId，機動人員用 |
| `SYNC_SECRET` | `ordersome-sync-2026` | Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004` | 大永蛋品 tenantId |
| `OS_TENANT_ID` | `1` | 來點什麼 tenantId |
| `GMAIL_APP_PASSWORD` | Railway 已設定 | 但 SMTP 出口被 Railway 封鎖（IPv6），sendMail 目前實際不可用 |

---

### 已知佔位頁面（尚未實作）

| 路由 | 元件 | 狀態 |
|------|------|------|
| `/dashboard/customers` | `ComingSoon` | 客戶管理，業務邏輯待確認 |
| `/dashboard/franchise` | `FranchiseDashboardPage` | 加盟主入口，部分功能未完成 |

---

---

---

### 系統架構總覽（2026-04-18 定案）

**為什麼仿大麥**
- 大麥是目前實際在用的採購系統，加盟主和店長習慣其品名格式和操作邏輯
- 目標：把大麥功能搬進 Ordersome，讓資料不再分散於大麥/ASANA/Google雲端/Excel
- 大麥的進銷存邏輯設計完整，直接學習參考

**大麥系統功能對照（已觀察）**
- 採購訂單管理：篩選器豐富、批次撥款、列印收貨表、下載報表
- 商品資料：系統編號、兩層分類、進貨價/銷貨價/定價、溫層、排序、調貨記錄
- 分店管理：每間門市各自庫存（倉庫庫存+店面庫存+總庫存+安全庫存）
- 廠商對帳：應付帳款、下載對帳明細、列印報表
- 報表：銷售品項統計、採購訂單統計折線圖、分店採購銷售統計KPI
- 帳務管理：月結對帳、發票管理

**我們目前的缺口（待完成，2026-04-19 更新）**
- 菜單成本 BOM 連動（os_bom 表，開工條件：採購資料穩定）
- 3/31 盤點資料匯入庫存（等 Excel 格式確認）
- 分店庫存（未來，目前只記宇聯總倉 B 類）
- 客戶管理（/dashboard/customers 仍為 ComingSoon）

### 歷史資料整合計畫（2026-04-18 定案）

**基準點：2026-03-31 全宇聯資產盤點**
- 盤點資料 4/19 從採購取得（Excel格式待確認）
- 匯入後：os_inventory.currentQty = 實際盤點數量，lastCountDate='2026-03-31'
- 匯入後再逐筆匯入 4/1～今天大麥歷史訂單，B類自動累加庫存

**大麥歷史訂單 Excel 欄位對應（已確認）**
- 訂單編號→orderNo（唯一鍵，重複略過）
- 供應商→supplierName
- 訂購店家→storeName（格式：來點什麼-逢甲旗艦店）
- 商品名稱→productName（存 aliases 比對）
- 計價單位→unit
- 計價數量→quantity
- 進貨價→unitPrice
- 溫層→temperature
- 訂單日期→orderDate

### 帳務流程（2026-04-18 定案，人工確認，待系統化）

**退佣計算**
- 廣弘：叫貨總金額 ÷ 1.12 = 未稅金額，差額 = 退佣，匯入公司帳（扣30手續費）
- 伯享：（系統銷價 - 宇聯成本價）× 數量 = 退佣，匯入公司帳
- 韓濟：同伯享計算，但退佣直接抵當月貨款（付現金）
- 目前：會計用 Excel 手算，尚未系統化

**月底對帳流程**
- 月結時間不固定，由會計彈性安排（非固定15-18號），核對銀行明細，對應日記帳
- 宇聯：每週匯款支出，整理銀行明細建憑證給事務所
- 雙月整理發票給事務所

**加盟主帳款（週結：加盟主付給宇聯）**
- 加盟主每週匯款給宇聯，目前用 ASANA 追蹤、Excel 銀行明細備查（不是廠商付給宇聯）
- 系統已有 os_franchisee_payments，配送簽收後自動產生

### 帳務系統架構（2026-04-19 建立）

**五張帳務核心表**
- `os_payables`：廠商應付帳款（月結，每廠商每月一筆，由叫貨收貨自動匯總）
- `os_bank_transactions`：銀行明細（匯入Excel，自動比對建議，人工確認）
- `os_rebates`：退佣帳款（月底計算，廣弘自動，伯享/韓濟人工確認）
- `os_rebate_rules`：退佣規則（存DB可後台修改，不寫死；已預填廣弘/伯享/韓濟三筆）
- `os_transfers`：提貨調貨（宇聯公司貨送各門市，月底自動產生門市應付帳款）

**連動流程**
- 叫貨單received → `generateMonthlyPayables` 月底匯總 → os_payables（每廠商每月一筆）
- 銀行明細匯入 → `autoMatchTransactions` 自動建議 → 人工 `confirmMatch` 確認
- 月底退佣 → `calculateRebates` → 廣弘自動算，伯享人工輸入，韓濟抵貨款（更新 rebateAmount）
- 提貨調貨 → `billTransfers` 月底結算 → os_franchisee_payments 門市應收

**銀行明細自動比對邏輯**
- 支出 + 備註含廠商名 → 建議對應 os_payables（matchScore 信心分數）
- 收入 + 備註含加盟店名 → 建議對應 os_franchisee_payments
- 信心分數 >= 50 才更新建議，人工 confirmedBy 確認後才真正標記
- 不自動確認，全程需人工二次確認防弊

**大麥Excel匯入規則（importFromDamaiExcel）**
- orderDate 早於今天 = 歷史訂單，status 直接設 received
- 3月份以前的歷史B類訂單：只記帳，不觸發庫存（庫存基準點=3/31盤點）
- 4/1之後的歷史B類訂單：觸發庫存入庫（比對 os_inventory）
- 品名比對：先查 name，再查 aliases，找不到 → 標 needsReview=1（橘色警示）
- 重複 orderNo 自動略過，回傳 created/skipped/flagged 三個計數

**os_procurement_orders 新增欄位（2026-04-19）**
- `printedAt DATETIME`：最後列印撿貨單時間

**os_procurement_items 新增欄位（2026-04-19）**
- `needsReview TINYINT`：1=品名未對應到 os_products，需人工確認

### 權限架構（2026-04-18 定案）

| 角色 | 刪除 | 作廢 | 修改 | 新增 | 說明 |
|------|------|------|------|------|------|
| super_admin | 可以（必填原因，寫 audit log） | 可以 | 可以 | 可以 | 兼系統開發者 |
| manager | 不行 | 可以（必填原因） | 可以（寫快照） | 可以 | 一般管理人員 |

所有刪除和修改寫 os_audit_logs，os_audit_logs 不可被刪除。

---

### 品項命名規範（永久有效）

**命名格式**：品名_規格/計價單位
**廠商資訊**：只存 supplierName 欄位，不放在品名裡
**規格格式**：數量+單位，多層規格用 * 連接（如 10片*8包）
**範例**：
  - 勁辣雞腿排(特大)_10片*8包/箱
  - 厚切牛肉堡_20片/包
  - 壽司米_30KG/袋
  - 純綠茶包_24入/袋

**別名（aliases）**：外部系統名稱（大麥、CA表原始名）存 JSON 陣列
**大麥品名**：匯入時以 aliases 比對，找不到才建新品項並 flag 待確認

**⚠️ 2026-04-18 品名統一狀態（重要）**：
- os_products 現有品名由 seed-os-products-v2.mjs 從 CA 表建立，是 CA 表的命名體系
- 大麥系統的廠商名和 CA 表廠商名不完全一致（如大麥「韓濟」= DB 有5筆，大麥「米谷」= DB「招牌壽司米_30KG」但 DB 實際名稱為「台梗壽司米_30KG」）
- 189 筆 rename 清單的 original 欄位是大麥格式品名，但 DB 裡這些品名根本不存在（是不同命名體系）
- **結論：品名統一需等大麥歷史訂單 Excel 匯入後，才能以實際大麥品名建立 aliases 對照**
- 舊名稱保留在 aliases 欄位，採購匯入時仍可比對
- 命名仍需採購現場實際核對後二次確認

### 分類規範（永久有效）

**兩層分類**：
- category1（第一層）：冷凍食材/韓國食材/乾貨類/冷藏類/麵包/茶包泡粉/醬粉類/包材類/清潔類/公司配送食品/公司配送訂製/公司配送雜貨/生鮮自購
- category2（第二層）：由 os_product_categories 表管理，可在後台新增修改
- 分類由 os_product_categories 表控制，不寫死在程式碼

### 庫存範圍規範（永久有效）

- B類廠商（deliveryType='yulian'）：記宇聯總倉庫存，存 os_inventory
- A類廠商（deliveryType='direct'）：直送各門市，宇聯無庫存壓力，但需記帳（應付帳款）
- 門市庫存：未來規劃，參考大麥「分店庫存管理」模式，暫不實作
- 帳務：A類和B類都要記應付帳款（os_payables，✅ 已建，透過 /dashboard/accounting 管理）

---

### 權限與稽核規則（永久有效，不得移除）

**刪除權限**
- 真實刪除（DELETE FROM DB）：僅 super_admin 可執行，且必須填寫原因
- 每次刪除前自動快照資料，寫入 `os_audit_logs`，此表不可被刪除
- manager 只能作廢（status='cancelled'），作廢需填原因，寫入 `os_audit_logs`
- 此規則套用範圍：採購叫貨、配送管理、應收帳款、庫存管理
- 技術實現：`superAdminProcedure`（server/_core/trpc.ts）用於真實刪除的 procedure

**BOM 物料清單（第二步，待完成）**
- 目前狀態：os_menu_items 存放菜單成本快照（手動維護）
- 待完成：建立 os_bom 表，記錄每道菜使用的食材和用量
  - os_bom: id, tenantId, menuItemId, productId, productName, qty, unit
  - 完成後：修改任何 os_products.unitCost，自動觸發關聯菜單的成本重算
  - 影響範圍：os_menu_items.cost, os_profit_loss 的食材成本欄位
  - 開工條件：採購叫貨資料穩定、os_products 成本資料準確後再做

---

## 專案基本資訊

- **網址**：https://ordersome.com.tw
- **部署**：Railway（自動 CI/CD，push 後 2-3 分鐘生效）
- **資料庫**：TiDB Cloud（MySQL 相容）
- **檔案儲存**：Cloudflare R2
- **套件管理**：pnpm 10
- **Git 規則**：commit 只用 `git add 指定檔案`，絕不用 `git add -A`

---

## 技術棧

| 層次 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 路由 | Wouter 3 |
| 狀態管理 | TanStack Query v5 + Zustand 5 |
| UI 元件 | shadcn/ui（Radix UI）+ Tailwind CSS 4 |
| 動畫 | Framer Motion 12 |
| 後端框架 | Express 4 |
| API 層 | tRPC 11（type-safe RPC）|
| ORM | Drizzle ORM（MySQL 方言）|
| 資料庫 | TiDB Cloud（MySQL 相容）|
| 圖檔儲存 | Cloudflare R2（S3-compatible）|
| 金流 | 綠界（ECPay）|
| 認證 | Google OAuth + LINE OAuth + Email/Password |
| 打包 | Vite 7（前端）+ esbuild（後端）|
| 可視文本 | Tiptap 3 |
| 表單 | React Hook Form + Zod |
| 圖表 | Recharts |
| 自動化 | Make（Webhook/Scenario）|

---

## 設計系統（後台 /dashboard）

- **後台設計規範**：`DESIGN-dashboard.md`
- 底色：暖灰 `#f7f6f3`
- 主色：amber `#b45309`
- 側邊欄背景：`#1c1917`（深暖棕）
- KPI 數字字體：金萱 jf-kamabit（`client/public/fonts/jf-kamabit-1_0.otf`）
- 按鈕動效：hover 上浮 1px / active 下壓 1px / 80ms

---

## 多租戶架構

```
宇聯國際（母公司）
├── 商品管理（宇聯電商，tenantId=1）
├── 內容管理（宇聯文章，tenantId=1）
├── 人員管理（系統層級）
└── 系統管理（租戶/模組開關）

來點什麼（tenantId=1，子系統）：
├── 門市管理（SOP/報修/檢查表）
├── 人員管理（來點什麼自己的）
└── ERP 模組（依模組開關啟用）

大永蛋品（tenantId=90004，子系統）：
├── 完整 ERP
└── 人員管理
```

### 用戶角色對映

| 角色 | tenantId | 權限範圍 |
|------|----------|---------|
| `super_admin` | NULL（跨租戶）| 全部功能 |
| `manager`（來點什麼）| 1 | 宇聯商城/內容/人員 + 來點什麼門市 + ERP（依模組）|
| `manager`（大永）| 90004 | 大永 ERP |
| `franchisee`（門市夥伴）| 1 | SOP/報修/檢查表/線上點餐 |
| `staff` | 1 | SOP/線上點餐 |
| `customer` | 1 | 線上點餐/我的訂單 |
| `driver` | 90004 | 司機 App（`/driver/`）|
| `portal_customer` | 90004 | 大永客戶 Portal |

---

## 完成批次紀錄（累積）

### 2026-04-17 完成（第一~設計系統批）

**來點什麼 ERP（後台 /dashboard）**
- `os_daily_reports` 重建（generated columns：totalSales/guestTotal/avgPrice/productivity）
- `os_tw_holidays` 台灣假日表（2025/2026）
- `os_monthly_reports` 月報補充表（電費/水費/薪資/業績檢討/月計畫）
- 叫貨管理系統（`os_procurement_orders` / `os_procurement_items` / `os_supplier_line`）
- 廠商退佣自動計算（`os_rebate_records` / `os_payables`）
- 供應商與品項成本管理（`os_suppliers` / `os_products`）
- 路由：`/dashboard/daily-report` / `/dashboard/purchasing` / `/dashboard/products` / `/dashboard/rebate`

**設計系統**
- `DESIGN-dashboard.md` 建立、金萱字體、後台全域 CSS 變數
- `AdminDashboardLayout.tsx` 深暖棕側邊欄、側邊欄各組可收合
- `button.tsx` 立體陰影動效

### 2026-04-18 完成（第一批 0022 ～ 第四批 0025）

**第一批（0022）：模組管理補充**
- `drizzle/0022_os_erp_modules.sql` — module_definitions + tenant_modules 插入
- 新增：`daily_report_os` / `purchasing_os` / `rebate_os` / `products_os`（tenantId=1 預設開啟）
- `scripts/seed-os-erp-modules.mjs` 可手動執行

**第二批（0023）：角色擴充、用戶管理、權限管理**
- `drizzle/0023_role_and_permission_expansion.sql`
- `users.role` ENUM 新增 `store_manager`（現在共 8 種：super_admin / manager / franchisee / staff / store_manager / customer / driver / portal_customer）
- `users` 新增欄位：`has_procurement_access` TINYINT(1)、`last_login_at` TIMESTAMP
- 建立 `franchisee_feature_flags` 表（用戶功能開關）

**第三批（0024）：CA 表單數位化**
- `drizzle/0024_ca_menu_cost_tables.sql`
- `os_menu_items`（菜單品項主表，含分頁/售價/平台價）
- `os_menu_item_ingredients`（食材明細，連結 os_products）
- `os_oem_products`（OEM 品項，代工費/包材費/批價）
- `os_oem_ingredients`（OEM 原料明細）
- `os_cost_audit_log`（成本修改歷史，三表共用）
- ⚠️ **0024 migration 當時未實際建立 DB 表**，於 2026-04-18 健康檢查時發現並補建，現已全部 ✅ 存在

**第四批（0025）：加盟主管理頁**
- `drizzle/0025_franchisee_management.sql`
- `os_franchisee_contracts`（合約記錄，R2 URL + 簽約/到期日）
- `os_franchisee_payments`（帳款往來，receivable/paid）
- 前端：`OSCustomers.tsx`（加盟主管理頁）

### Migration 執行狀態

| 檔案 | 狀態 |
|------|------|
| `0022_os_erp_modules.sql` | ✅ 已執行（2026-04-18）|
| `0023_role_and_permission_expansion.sql` | ✅ 已執行（2026-04-18）|
| `0024_ca_menu_cost_tables.sql` | ✅ 已執行（SQL），但 DB 表未實際建立；2026-04-18 補建完成 ✅ |
| `0025_franchisee_management.sql` | ✅ 已執行（2026-04-18）|

---

## Git 狀態（2026-04-18 v5.14 更新）

最後三個 commit（已 push）：
1. `67feed7` — feat: 加盟主管理頁 v1 2026-04-18
2. `b1b3c32` — feat: 0026 SQL + 假日批次查詢 + OSScheduling 標示 2026-04-18
3. `fdc8216` — docs: CLAUDE.md v5.12 2026-04-18

working tree: clean

---

## 後續事項

### Migration 標準驗證程序（每次必做）

執行任何 migration 後，**必須**用以下指令確認欄位真的存在於 TiDB，不能只看 SQL 跑完沒報錯：

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

> **背景**：2026-04-18 因 0023 migration 未實際執行，TiDB 缺 `has_procurement_access` / `last_login_at` 兩欄，導致登入崩潰。SQL 跑完沒報錯不等於欄位已存在，必須 DESCRIBE 驗證。

---

### TiDB Migration 狀態

0022 ～ 0025 全部已執行完畢。

⚠️ **Migration 0026 待補建**：四張新表（`os_schedule_templates` / `os_schedules` / `os_delivery_orders` / `os_delivery_items`）已用 node script 直接建立於 TiDB，但尚未建立對應的 `drizzle/0026_scheduling_delivery.sql`。下次開 session 前需補建此檔案作為版本記錄。

✅ **假日標示**：`OSScheduling.tsx` 已呼叫 `dailyReport.getHolidaysByMonth`，假日欄位正常顯示（紅底色）。

### 第五批（損益儀表板）：✅ 已完成（cf4bb2a）
- `/dashboard/profit-loss`
- profitLoss router + OSProfitLoss.tsx

### 第六批（加盟主帳款週結）：✅ 已完成（785e825）
- `/dashboard/franchisee-payments`
- `server/routers/franchiseePayment.ts`（listPayments / createPayment / markPaid / exportPayments）
- `OSFranchiseePayments.tsx`（KPI 三卡片 / 明細表 / 週結摘要 / 新增帳款 / 標記已收款 / 匯出 Excel）
- DB：`os_franchisee_contracts` 加 `settlementCycle`；`os_franchisee_payments` 加 `isAutoGenerated` / `paidAt`

### 第八批（Bug 修復 + OSPurchasing 重建）：✅ 已完成（2026-04-18，489bada）

- `App.tsx`：路由改接 `OSPurchasing`（舊 `OSProcurement` 殼已棄用）
- `OSPurchasing.tsx`：完整重建，KPI 卡片 / 月份切換 / 叫貨單列表展開 / 狀態推進 / LINE 推播 / 廠商 LINE 設定 / 新增叫貨單 Dialog / Excel 匯出
- `OSDelivery.tsx` / `OSPurchasing.tsx` / `OSScheduling.tsx`：SelectItem `value=""` 崩潰全修（改 `"all"` / `"none"`）
- `OSScheduling.tsx`：空狀態畫面補 Dialog，新增員工按鈕現可正常使用
- `AdminPermissions.tsx`：TS7031 binding element any 補型別

### 第七批（排班 + 配送 + 路由清理）：✅ 已完成（22f9956）

**路由清理**
- 刪除重複 `/dashboard/franchise`（舊 `FranchiseDashboard` import + route）
- `/dashboard/delivery` 從 `ComingSoon` 改接 `OSDelivery`
- 帳務管理選單項目原加 `superAdminOnly: true`；v5.46 已改為 manager 也可見
- 宇聯總部 `storeId = 401534`（`stores` 表，`tenantId=1`）貫穿所有後端

**排班管理 v1**
- `server/routers/scheduling.ts`（7 個 procedure：listTemplates / upsertTemplate / deleteTemplate / listSchedules / upsertSchedule / batchUpsertSchedules / getMonthSummary）
- `OSScheduling.tsx`：早班 / 晚班 / 機動人員三 Tab、點格子編輯（Popover）、月統計表、員工設定 Drawer、Excel 匯出
- DB：`os_schedule_templates`（員工班別主表）+ `os_schedules`（每日班表，UNIQUE: tenantId+storeId+employeeName+scheduleDate）

**配送管理 v1**
- `server/routers/delivery.ts`（5 個 procedure：listDeliveryOrders / getDeliveryDetail / createDeliveryOrder / updateStatus / getMonthStats）
- `OSDelivery.tsx`：月統計 KPI 卡片、派車單卡片列表可展開、狀態依序推進（pending→picking→dispatched→delivered→signed）、簽收時自動計算批價金額並寫入 `os_franchisee_payments`、新增派車單 Dialog
- DB：`os_delivery_orders`（派車單主表，deliveryNo 自動產生：`DO-YYYYMMDD-001`）+ `os_delivery_items`（品項明細）

### 大永待辦（等蛋博確認）

- LIFF 正式 liffId（蛋博建立正式 LIFF 後給 ID，只改一行）
- 積欠款 LINE 推播通知（cron 基礎已建，需實作發送邏輯）
- Portal 客戶重設密碼 email（Resend 架構已有，需完成）
- `dy_customers` 加 `lineUserId` 欄位（`scripts/migrate-add-lineUserId.mjs` 已建）

### 技術債補強

- `has_procurement_access` 前端 any cast 補型別（`useAuth` User 型別正式擴充）
- 大永 26 張 `dy_` 表不在 `schema.ts`，用 raw SQL：`(db as any).$client.execute(...)`
- 來點什麼 ERP 的 `os_` 表也是 raw SQL，同上
- 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）

### Make 自動化串接

- 門市自動報表 Webhook → 直接寫進 `os_daily_reports`（SYNC_SECRET 已設）
- 採購 importFromDamai → 不再走 Google Sheets

### 已知佔位頁面與缺口（2026-04-19 更新）

**佔位頁面（有路由但無實作）：**

| 路由 | 元件 | 狀態 |
|------|------|------|
| `/dashboard/customers` | `ComingSoon` | 空殼，客戶管理未開發 |

**加盟主入口未完成：**
- `/dashboard/franchise` → `FranchiseDashboardPage.tsx` 顯示「功能開發中」，加盟主完整功能（訂單/庫存/報表）尚未實作

---

## 技術債

- ⚠️ 大永 26 張 `dy_` 表不在 `schema.ts`，用 raw SQL 操作：`(db as any).$client.execute(...)`
- ⚠️ 來點什麼 ERP 的 `os_` 表也是 raw SQL，同上原因
- ⚠️ 本機菜單圖尚未遷移到 R2（`client/public/images/menu/korean-roll/`）
- ⚠️ 叫貨收貨→退佣自動計算：設計暫緩，退佣規則複雜（廣弘10.71%/伯享差價/韓濟抵貨），目前手動月結，待實際使用後確認自動化需求
- ⚠️ `ContentEditor.tsx` / `ContentManagement.tsx`：`post.category` 和 `post.scheduledAt` 用 `as any` cast，後端 content router 型別未正式宣告這兩欄（低優先級）

---

## R5 tRPC API 路由（server/routers.ts + server/routers/）

### admin（adminRouter — server/routers/admin.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `listUsers` | query | superAdminProcedure | 列出所有用戶 |
| `updateUserRole` | mutation | superAdminProcedure | 更新用戶角色 |
| `getAllFranchiseeFlags` | query | superAdminProcedure | 取得所有加盟主的 feature flags |
| `setFranchiseeFlag` | mutation | superAdminProcedure | 設定單一加盟主的功能開關 |
| `toggleProcurementAccess` | mutation | superAdminProcedure | 開關指定帳號的採購存取權 |

### profitLoss（profitLossRouter — server/routers/profitLoss.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `getProfitLoss` | query | adminProcedure | 取得指定門市指定月份的損益報表（日報加總 + 月報費用 + 退佣）|

### scheduling（schedulingRouter — server/routers/scheduling.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `listTemplates` | query | adminProcedure | 列出員工班別範本（可篩門市）|
| `upsertTemplate` | mutation | adminProcedure | 新增 / 更新員工班別範本 |
| `deleteTemplate` | mutation | adminProcedure | 停用員工班別範本（isActive=0）|
| `listSchedules` | query | adminProcedure | 列出指定月份班表（可篩門市）|
| `upsertSchedule` | mutation | adminProcedure | 新增 / 更新單格班表（ON DUPLICATE KEY UPDATE）|
| `batchUpsertSchedules` | mutation | adminProcedure | 批次寫入班表 |
| `getMonthSummary` | query | adminProcedure | 月統計（出勤/例休/事假/公假/曠職/加班/總工時）|

### delivery（deliveryRouter — server/routers/delivery.ts）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `listDeliveryOrders` | query | adminProcedure | 列出指定月份派車單（可篩門市/狀態）|
| `getDeliveryDetail` | query | adminProcedure | 取得派車單 + 品項明細 |
| `createDeliveryOrder` | mutation | adminProcedure | 建立派車單（deliveryNo 自動產生 DO-YYYYMMDD-001）|
| `updateStatus` | mutation | adminProcedure | 狀態依序推進；簽收時自動計算批價金額並寫入 `os_franchisee_payments` |
| `getMonthStats` | query | adminProcedure | 月統計（各門市派車數 / 已簽收金額 / 待簽收金額）|

---

## 前端路由（完整清單）

### 品牌官網（來點什麼）
`/brand` / `/brand/story` / `/brand/stores` / `/brand/menu` / `/brand/news` / `/brand/contact` / `/brand/franchise`

### 集團官網（宇聯國際）
`/corporate` / `/corporate/about` / `/corporate/brands` / `/corporate/culture` / `/corporate/news` / `/corporate/news/:slug` / `/corporate/franchise` / `/corporate/contact`

### 電商購物
`/shop` / `/shop/category/:slug` / `/shop/product/:id` / `/shop/cart` / `/shop/checkout` / `/shop/order/:id` / `/shop/payment/:orderNumber` / `/shop/order-complete/:orderNumber` / `/shop/my-orders` / `/exclusive/:slug`（B2B 福委賣場）

### 認證 & 會員
`/login` / `/forgot-password` / `/reset-password/:token` / `/profile` / `/member/profile` / `/member/orders`

### 後台管理（/dashboard）
| 路徑 | 說明 |
|------|------|
| `/dashboard` | 智慧入口 |
| `/dashboard/admin/ecommerce` | AdminDashboard（商品總覽）|
| `/dashboard/admin/products` | 商品管理 |
| `/dashboard/admin/orders` | 訂單管理 |
| `/dashboard/admin/categories` | 分類管理 |
| `/dashboard/admin/users` | 用戶管理 |
| `/dashboard/admin/permissions` | 權限管理 |
| `/dashboard/admin/tenants` | 租戶管理 |
| `/dashboard/content` | 內容管理 |
| `/dashboard/content/new` | 新增文章 |
| `/dashboard/content/edit/:id` | 編輯文章 |
| `/dashboard/franchise-inquiries` | 加盟詢問 |
| `/dashboard/sop` | SOP 知識庫 |
| `/dashboard/repairs` | 設備報修 |
| `/dashboard/checklist` | 每日檢查表 |
| `/dashboard/ai-writer` | AI 文章助手 |
| `/dashboard/daily-report` | 門市日報（新）|
| `/dashboard/purchasing` | 叫貨管理（新）|
| `/dashboard/products` | 品項成本（新）|
| `/dashboard/rebate` | 退佣帳款（新）|
| `/dashboard/ca-menu` | 菜單成本管理（新）|
| `/dashboard/profit-loss` | 損益儀表板（新）|
| `/dashboard/franchisee-payments` | 加盟主帳款（新）|
| `/dashboard/scheduling` | 排班管理（新，已完成）|
| `/dashboard/delivery` | 配送管理（新，已完成）|

### 大永 ERP（/dayone）
`/dayone` / `/dayone/orders` / `/dayone/customers` / `/dayone/drivers` / `/dayone/products` / `/dayone/inventory` / `/dayone/purchase` / `/dayone/districts` / `/dayone/reports` / `/dayone/suppliers` / `/dayone/liff-orders` / `/dayone/ar` / `/dayone/dispatch` / `/dayone/purchase-receipts`

### 大永客戶 Portal（公開）
`/dayone/portal` / `/dayone/portal/login` / `/dayone/portal/register` / `/dayone/portal/orders` / `/dayone/portal/statement` / `/dayone/portal/account`

### 司機 App
`/driver` / `/driver/today` / `/driver/orders` / `/driver/order/:id` / `/driver/pickup` / `/driver/done` / `/driver/worklog` / `/driver/profile`

### LIFF（LINE 前台）
`/liff/order?tenant=dayone`

### Super Admin
`/super-admin/tenants` / `/super-admin/modules`

---

## 公開 Webhook Endpoints

| Endpoint | 說明 |
|----------|------|
| `POST /api/payment/callback` | 綠界 ECPay 付款回調 |
| `POST /api/dayone/line-order` | 大永 LINE@ 接單（Make → 後端）|
| `POST /api/ecpay/map-result` | 綠界超商選擇地圖回調 |
| `POST /api/ecpay/logistics-notify` | 綠界物流狀態通知 |

Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
SYNC_SECRET：`ordersome-sync-2026`（Make 推資料到 OrderSome API 驗證用）

---


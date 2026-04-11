# CLAUDE.md — OrderSome 工作主檔

> 最後更新：2026-04-11 | 文件版本：v5.0
> 詳細參考（路由/API/DB表/架構）→ 見 `CLAUDE_REFERENCE.md`

---

## 一、專案定位

**來點什麼（OrderSome）** — 宇聯國際餐飲集團數位平台，單一 Monorepo。

| 子系統 | 路由前綴 |
|--------|---------|
| 品牌官網 | `/brand/` |
| 集團官網 | `/corporate/` |
| 電商購物 + B2B 福委賣場 | `/shop/` `/exclusive/:slug` |
| 後台管理 | `/dashboard/` |
| SOP 知識庫 | `/dashboard/sop` |
| 大永蛋品 ERP | `/dayone/` |
| 司機 App | `/driver/` |
| 會員中心 | `/member/` |

**tenantId=1**：宇聯官網 ｜ **tenantId=90004**：大永蛋品

---

## 二、部署 & 環境

```
生產網址:   https://ordersome.com.tw
平台:       Railway（push main 分支後 2-3 分鐘自動部署）
資料庫:     TiDB Cloud（MySQL 相容，gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000）
圖片儲存:   Cloudflare R2（bucket: ordersome-b2b）
```

**⚠️ TiDB 注意事項：**
- 不支援 `ADD COLUMN IF NOT EXISTS`，ALTER 前先 `SHOW COLUMNS` 確認
- `drizzle-kit migrate` 本機無法連線（SSL 問題），需在 Railway shell 執行

---

## 三、常用指令

```bash
pnpm dev          # 開發伺服器（port 3000）
pnpm build        # 生產構建（push 前必跑，確認零錯誤）
pnpm check        # TypeScript 型別檢查
pnpm test         # 執行所有測試（10 檔，58 個）
pnpm db:push      # 生成並執行 Drizzle migration
```

---

## 四、每次開發前必做

- [ ] `git pull origin main` — 兩台電腦（家裡/公司）都要先拉
- [ ] `git status` — 確認工作目錄狀態
- [ ] commit 只用 `git add 指定檔案`，**絕不用 `git add -A`**
- [ ] `pnpm run build` 零錯誤才能 push
- [ ] 任務結束前執行 git status，確認無未 commit 檔案，全部 push 才算完成
- [ ] 安裝新套件後（pnpm add），確認 package.json 和 pnpm-lock.yaml 都有加入 git add
- [ ] 每次任務結束執行 `/clear`

---

## 五、核心規則（違反會出 bug）

- 所有 DB 查詢必須帶 `tenantId`，**禁止 hardcode**
- 密碼欄位：DB 實際欄位為 `passwordHash`；API 傳參用 `pwd`（登入）、`newPwd`（重設），Cloudflare WAF 規避
- 司機路由是 `/driver/`，不是 `/dayone/driver/`
- 圖片上傳走 `trpc.storage.uploadImage`（R2），R2 key 用 `R2_ACCESS_KEY_ID`
- 大永 raw SQL 用 `(db as any).$client.execute(...)`
- **勿修改 `server/_core/`**（除非整體基礎設施）

---

## 六、已知問題 & 技術債

### 🔴 高優先（待處理）
- ✅ posts migration 已完成（2026-04-07，本機直連 TiDB 執行）
- **大永 12 張 dy_ 表不在 schema.ts** — 技術債，raw SQL 操作
- **`dy_customers` 缺 `lineUserId` 欄位** — LIFF 身份綁定用

### 🟡 中優先
- 韓式飯捲菜單圖打包在 Railway，應遷移到 R2
- 密碼重設郵件尚未實作（目前只 console.log）

---

## 七、開發路線圖

### 階段 A — 大永蛋品上線（進行中）
- ✅ 大永後台基礎（客戶/訂單/庫存/進貨/行政區/司機）
- ✅ 司機手機工作站、電子簽收、派車單打印
- ✅ SuperAdminModules 模組開關
- ✅ Google Maps 修復
- ✅ LINE@ 接單整合（Make → Gemini → 後端 → LINE Reply）
- ✅ **LIFF 客戶下單**（多租戶，/liff/order?tenant=dayone）
- ✅ 大永獨立登入入口：/dayone/login
- ✅ 庫存管理通用化：DayoneInventoryContent 接受 tenantId prop
- ✅ DayoneLayout.tsx TENANT_ID 修正為 90004
- ✅ dy_inventory 補入 17 筆初始庫存記錄
- ⏳ 帳務管理（應收應付、月結對帳）
- ⏳ 積欠款提醒

### 階段 A-2 — 宇聯官網/電商優化（進行中）
- ✅ AdminOrders：來源篩選（中文）、刪除功能（super_admin）、時間顯示到分鐘
- ✅ AdminDashboard：6 張統計卡片（待處理/付款處理中/已出貨送達/總計）
- ✅ RichTextEditor：useEffect 修復草稿空白問題
- ✅ SOP PDF 上傳改為 Cloudflare R2
- ✅ posts 表新增 scheduledAt / category（migration SQL 已生成，待 Railway 執行）
- ✅ 後端新增 publishScheduled procedure + 每分鐘排程器
- ✅ getPublishedPosts 支援分頁（page/pageSize）和分類篩選
- ✅ posts 表 migration 已執行（scheduledAt、category 欄位已存在於 TiDB）
- ✅ ContentEditor.tsx：category 下拉 + scheduledAt 日期時間選擇器
- ✅ ContentManagement.tsx：分類篩選 tab + 分類標籤
- ✅ BrandNews.tsx：分頁、圖片 16:9、分類篩選
- ✅ CorporateNews.tsx：同上
- ✅ AdminOrders.tsx：紫色標籤文字改用 ORDER_SOURCE_LABELS 中文顯示
- ✅ Email 通知系統（Resend）
- ✅ AI 文章助手（半自動，Gemini 2.5 Flash）
- ✅ 後台 UI 統一（側邊欄重組，三大分組）
- ✅ 入口頁依角色顯示功能卡片
- ✅ 來點什麼 ERP 路由補齊：/dashboard/inventory、/dashboard/scheduling、/dashboard/daily-report

### 階段 B — 宇聯 ERP（大永穩定後）
- 庫存管理、排班、門市日報、異常警報

### 階段 C / D
- 採購物流、財務報表 → SaaS 化、多租戶計費

---

## 八、最近變更（2026-04-12）

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

## 八-B-2、舊變更紀錄（2026-04-11）

| 檔案 | 變更摘要 |
|------|---------|
| `client/src/pages/dayone/DayoneLayout.tsx` | **TENANT_ID 從 2 改為 90004**（影響全部大永頁面，根本性修復） |
| `client/src/pages/dayone/DayoneInventory.tsx` | 重構為 wrapper，傳入 TENANT_ID prop |
| `client/src/pages/dayone/DayoneInventoryContent.tsx` | 抽出為通用元件，接受 tenantId prop |
| `dy_inventory`（TiDB） | 補入 17 筆初始庫存記錄（productId 30001-30017，currentQty=0） |
| `scripts/check-dy-inventory.mjs` | 新增 DB 查詢確認腳本 |

---

## 八-B、舊變更紀錄（2026-04-10）

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

## 八-C、舊變更紀錄（2026-04-08）

| 檔案 | 變更摘要 |
|------|---------|
| `server/liff.ts` | LIFF 下單 API，多租戶支援（TENANT_MAP：dayone→90004），getProducts/createOrder 接 tenant 參數 |
| `client/src/pages/liff/LiffOrder.tsx` | LIFF 下單頁面，接 LINE SDK，從 ?tenant= 讀取租戶，多租戶 TENANT_CONFIG |
| `client/src/pages/dayone/DayoneLiffOrders.tsx` | 大永後台 LIFF 訂單查看頁（新建），手機/桌面雙版型 |
| `client/src/components/DayoneLayout.tsx` | 側邊選單新增「LIFF訂單」入口（/dayone/liff-orders） |
| `client/src/App.tsx` | 新增 /dayone/liff-orders 路由 |
| `server/routers/dayone/orders.ts` | 新增 getLiffOrders procedure（orderSource='liff', tenantId=90004） |

**LIFF URL 格式**：`/liff/order?tenant=dayone`

---

## 八-D、舊變更紀錄（2026-04-07）

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

## 九、下一個任務

### Migration 做法（重要）
- Railway 新版介面**已移除 Shell**，不能在 Railway 上直接執行 SQL
- 正確做法：在本機 VS Code 終端機執行 `node scripts/migrate-posts-columns.mjs`
- `.env` 裡有 `DATABASE_URL` 直連 TiDB，本機可以直接操作生產資料庫
- 改完 schema.ts 後，寫一個 `scripts/migrate-xxx.mjs` 腳本，在本機跑即可

### 待處理任務
1. ⏳ 模組 toggle 側邊欄連動驗證中（osmanager console.log debug 進行中）
2. ⏳ `/dashboard/delivery`、`/dashboard/customers`、`/dashboard/purchasing`、`/dashboard/accounting` 頁面尚未建立（點擊 404）
3. ⏳ 供應商管理複用給來點什麼（需新增 moduleKey + 頁面）
4. ⏳ 大永側邊欄模組控制（DayoneLayout 架構債，第二個外部客戶簽約前處理）
5. ⏳ 加盟主功能範圍定義
6. ⏳ 來點什麼排班管理、門市日報功能開發
7. ⏳ 庫存管理 UI 優化
8. ⏳ 帳務管理（應收應付、月結對帳）
9. ⏳ 積欠款提醒
10. ⏳ LIFF 正式上線：蛋博用自己的 LINE 後台建立 LIFF，更新前端 `TENANT_CONFIG` 的 liffId

---

## 十、踩坑紀錄（避免再踩）

- `git add -A` 絕對不能用，只能 `git add 指定檔案`
- 兩台電腦開始前都要先 `git pull`，不然有衝突
- Procedure 參數名稱要對（DeliveryNote bug：前端傳 orderId，後端要 id）
- Gemini REST API 對免費帳號有模型限制，Make 內建模組才能正常使用
- Make JSON string 模式無法處理換行符號，改用 Data structure 模式
- `dy_orders` 欄位名稱是 `totalAmount`，不是 `total`
- `dy_orders.customerId` 是 NOT NULL，找不到客戶傳 0 不傳 null
- LINE Reply 由後端直接呼叫（用 LINE_CHANNEL_ACCESS_TOKEN），不經過 Make
- TiDB 不支援 `ADD COLUMN IF NOT EXISTS`
- `drizzle-kit migrate` 本機無法連 TiDB（SSL profile 型別錯誤）；Railway 新版介面也已移除 Shell → 正確做法：寫 `scripts/migrate-xxx.mjs` 在本機用 DATABASE_URL 直連執行
- `getPublishedPosts` 回傳格式已改為分頁物件 `{ posts, total, ... }`，前端用 `.posts` 取陣列
- `DayoneLayout` 元件要加入 git（untracked 檔案 Railway build 找不到）
- Tiptap `RichTextEditor` 的 `content` prop 只在初始化時讀取，需在 useEffect 裡用 `editor.commands.setContent()` 更新
- SOP `uploadPdf` 已從 Manus `storagePut` 改為 `r2Put`（Cloudflare R2）
- **`DayoneLayout.tsx` 的 `TENANT_ID` 曾被錯誤設為 `2`，正確值是 `90004`**（已修正，commit 6fb3df0）
- **`dy_inventory` 初始為空**，需執行 seed INSERT 為每個 dy_products 建立初始記錄
- `mysql2` 連接 TiDB 不能直接傳 DATABASE_URL 字串（SSL profile boolean 錯誤），需手動解析 URL 並設 `ssl: { rejectUnauthorized: false }`
- `dy_suppliers` 表無 `updatedAt` 欄位，upsert/toggle SQL 不可包含此欄
- TiDB `LIMIT ?` 參數綁定會報 `Incorrect arguments to LIMIT`，改用 `LIMIT ${input.limit}` 內插
- `useMemo` 內不可呼叫會變動 reference 的 function，改用 `useEffect + useState`
- super-admin 路由若不包 `AdminDashboardLayout`，invalidate 發出後無組件監聽，側邊欄不連動
- `users` 表密碼欄位實際為 `passwordHash`（非 `pwd`），登入 email 需為合法格式（openId 不能重複）

---

## 十一、系統架構說明

### 多租戶架構

```
宇聯國際（母公司）
├── 商城管理（官網電商，tenantId=1）
├── 內容管理（官網文章，tenantId=1）
├── 人員管理（系統層級）
└── 系統管理（租戶/模組開關）

來點什麼（tenantId=1，子系統）
├── 門市管理（SOP/報修/檢查表）
├── 人員管理（來點什麼自己的）
└── ERP 模組（依模組開關啟用）

大永蛋品（tenantId=90004，子系統）
├── 完整 ERP
└── 人員管理
```

### 多租戶隔離（2026-04-11 更新）

- `AdminDashboardLayout` 加入 `isOSTenant` / `isDYTenant` 判斷
- `manager` 只看自己租戶的功能，`super_admin` 跨租戶看全部
- `tenant_modules` 各租戶記錄乾淨隔離（來點什麼 10 筆、大永 10 筆）

### 用戶角色與 tenantId 對應

| 角色 | tenantId | 權限範圍 |
|------|----------|---------|
| `super_admin` | NULL（跨租戶） | 全部功能 + 可調整所有人的模組權限 |
| `manager`（來點什麼） | 1 | 宇聯商城/內容/人員 + 來點什麼門市 + ERP（依模組開關） |
| `manager`（大永） | 90004 | 大永 ERP（**帳號尚未建立**） |
| `franchisee`（門市夥伴） | 1 | SOP/報修/檢查表/線上商城 |
| `staff` | 1 | SOP/線上商城 |
| `customer` | 1 | 線上商城/我的訂單 |
| `driver` | 90004 | 司機 App（`/driver/`） |

### 模組開關（module_definitions + tenant_modules 表）

- `module_definitions` 表：15 個模組定義，3 個 category
  - `store_ops`：門市營運相關
  - `erp`：來點什麼 ERP
  - `dayone`：大永蛋品 ERP
- `moduleKey` 清單：`delivery` / `crm_customers` / `inventory` / `purchasing` / `accounting` / `scheduling` / `daily_report` / `equipment_repair`
- `createTenant` 建立新租戶時自動 INSERT 所有模組定義（預設全關）
- `SuperAdminModules.tsx`：label/category 全部來自 DB（非 hardcode）
- `allTenantModules` 改為 JOIN（非 CROSS JOIN），每租戶只顯示自己的模組
- toggle 後 invalidate modules cache，側邊欄快取失效

查詢：`trpc.dayone.modules.list({ tenantId })`
前端 hook：`useModules()`（`client/src/hooks/useModules.ts`）

### Email 發信

- 服務：Resend（resend.com）
- 環境變數：`RESEND_API_KEY`
- 觸發時機：訂單狀態改為 `shipped` → 寄給買家；新訂單建立 → 寄給所有 `manager`/`super_admin`
- 重設密碼信件 URL 從 localhost:3000 改為讀取環境變數 `BASE_URL`

### AI 文章助手

| 項目 | 說明 |
|------|------|
| 後端 | `server/routers/ai-writer.ts` |
| 前端 | `client/src/pages/dashboard/AIWriter.tsx` |
| 路由 | `/dashboard/ai-writer` |
| 模型 | Gemini 2.5 Flash（`gemini-2.5-flash`） |
| 新聞來源 | NewsAPI（`NEWS_API_KEY`） |
| 品牌資訊 | 已內建完整 Prompt（來點什麼品牌故事/產品/加盟資訊） |
| 模式 | 半自動（AI 生成草稿，人工審核後發布） |

---

*CLAUDE.md v5.0 — 精簡主檔，詳細參考見 CLAUDE_REFERENCE.md*

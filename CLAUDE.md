# CLAUDE.md — OrderSome 工作主檔

> 最後更新：2026-04-17 | 文件版本：v5.5
> 詳細參考（路由/API/DB表/架構）→ 見 `CLAUDE_REFERENCE.md`
> 歷史變更紀錄 → 見 `DEVELOPMENT_LOG.md`

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
| 大永客戶 Portal | `/dayone/portal/` |
| 司機 App | `/driver/` |
| 會員中心 | `/member/` |

**tenantId=1**：宇聯官網 ｜ **tenantId=90004**：大永蛋品

---

## 二、部署 & 環境

```
生產網址:   https://ordersome.com.tw
平台:       Railway（push main 分支後 2-3 分鐘自動部署）
資料庫:     TiDB Cloud（MySQL 相容）
圖片儲存:   Cloudflare R2（bucket: ordersome-b2b）
```

**⚠️ TiDB 注意事項：**
- 不支援 `ADD COLUMN IF NOT EXISTS`，ALTER 前先 `SHOW COLUMNS` 確認
- Migration 做法：寫 `scripts/migrate-xxx.mjs`，在本機用 `DATABASE_URL` 直連執行（Railway 已移除 Shell）

---

## 三、常用指令

```bash
pnpm dev          # 開發伺服器（port 3000）
pnpm build        # 生產構建（push 前必跑，確認零錯誤）
pnpm check        # TypeScript 型別檢查
pnpm test         # 執行所有測試
pnpm db:push      # 生成並執行 Drizzle migration
```

---

## 四、每次開發前必做

- [ ] `git pull origin main` — 兩台電腦（家裡/公司）都要先拉
- [ ] `git status` — 確認工作目錄狀態
- [ ] commit 只用 `git add 指定檔案`，**絕不用 `git add -A`**
- [ ] `pnpm run build` 零錯誤才能 push
- [ ] 任務結束前確認無未 commit 檔案，全部 push 才算完成
- [ ] 安裝新套件後（pnpm add），確認 package.json 和 pnpm-lock.yaml 都有加入 git add
- [ ] 每次任務結束執行 `/clear`

---

## 五、核心規則（違反會出 bug）

- 所有 DB 查詢必須帶 `tenantId`，**禁止 hardcode**
- 密碼欄位：DB 實際欄位為 `passwordHash`；API 傳參用 `pwd`（登入）、`newPwd`（重設），Cloudflare WAF 規避
- 司機路由是 `/driver/`，不是 `/dayone/driver/`
- 大永 raw SQL 用 `(db as any).$client.execute(...)`
- **勿修改 `server/_core/`**（除非整體基礎設施）
- **Portal 路由不包 DayoneLayout**，改用 PortalLayout（`/dayone/portal/...` 是公開路由）
- **綠界金流用 SHA256（ecpay.ts），物流用 MD5（ecpay-logistics.ts），不可混用**

---

## 六、已知問題 & 技術債

### 🔴 高優先（待處理）
- **大永 26 張 dy_ 表不在 schema.ts** — 技術債，raw SQL 操作
- **⏳ GEMINI_API_KEY 未設定** — AI 文章助手功能受限

### 🟡 中優先
- 開箱飯捲菜單圖打包在 Railway，應遷移到 R2
- 密碼重設郵件尚未實作（目前只 console.log）
- `dy_customers` 缺 `lineUserId` 欄位 — LIFF 身份綁定用

---

## 七、開發路線圖

### 階段 A — 大永蛋品上線（進行中）
- ✅ 大永後台基礎（客戶/訂單/庫存/進貨/行政區/司機）
- ✅ 司機手機工作站、電子簽收、派車單打印
- ✅ SuperAdminModules 模組開關
- ✅ LINE@ 接單整合（Make → Gemini → 後端 → LINE Reply）
- ✅ LIFF 客戶下單（多租戶，/liff/order?tenant=dayone）
- ✅ 帳務管理（應收應付、月結對帳）— Phase 2
- ✅ 派車管理（自動/手動派車、完成配送）— Phase 2
- ✅ 進貨簽收（Canvas 簽名 + R2 上傳）— Phase 2
- ✅ 客戶門戶 Portal（LINE 登入、查帳、月結）— Phase 2
- ✅ 用戶管理（TenantUserManagement 通用元件）— A-3
- ✅ 積欠款紅色警示 + 報表 CSV 匯出 + 收款統計圖表 — A-3
- ⏳ 積欠款 LINE 推播通知（portal.ts 已建 cron 基礎）

### 階段 A-2 — 宇聯官網/電商優化（已完成）
- ✅ AdminOrders 優化、AdminDashboard 統計卡片
- ✅ SOP PDF 上傳改為 R2
- ✅ posts 表排程發布（scheduledAt/category）
- ✅ Email 通知系統（Resend）
- ✅ AI 文章助手（Gemini 2.5 Flash）
- ✅ 後台 UI 統一（側邊欄重組，三大分組）

### 階段 A-3 — 大永蛋品 P0-P3 完善（已完成，2026-04-15）
- ✅ schema.ts role enum 加入 driver
- ✅ 大永用戶管理（TenantUserManagement 通用元件）
- ✅ Seed 17 家供應商 + Portal 測試帳號
- ✅ 系統驗證腳本（16 項全通過）

### 階段 A-4 — 綠界物流（進行中）
- ✅ 後端 + DB + API 完成
- ✅ 前端完成（結帳頁/後台/我的訂單/付款完成頁）
  - ✅ 後台：訂單列表顯示配送方式 + 建立物流單按鈕
  - ✅ 我的訂單：物流狀態 Badge
  - ✅ 正式帳號切換（Railway 環境變數已設定 fallback）
- ⏳ LIFF 正式上線（蛋博建立正式 LIFF 後更新 liffId）

### 階段 B — 宇聯 ERP（大永穩定後）
- 庫存管理、排班、門市日報、異常警報

### 階段 C / D
- 採購物流、財務報表 → SaaS 化、多租戶計費

---

## 八、最近變更

### 2026-04-17 完成項目

#### 來點什麼 ERP（後台 /dashboard）
- os_daily_reports 重建（generated columns：totalSales/guestTotal/avgPrice/productivity）
- os_tw_holidays 台灣假日表（2025/2026 各 365 筆，來源 ruyut/TaiwanCalendar）
- os_monthly_reports 月報補充表（電費/水費/薪資/業績檢討/月計畫）
- 叫貨管理系統（os_procurement_orders / os_procurement_items / os_supplier_line）
- 叫貨一鍵推播 LINE 廠商（pushToLine procedure，呼叫 LINE Messaging API）
- 廠商退佣自動計算（os_rebate_records / os_payables）
- 供應商與品項成本管理（os_suppliers / os_products）
- 新增路由：/dashboard/daily-report / /dashboard/purchasing / /dashboard/products / /dashboard/rebate

#### 設計系統
- DESIGN-dashboard.md 建立（後台設計規範，暖灰底色 #f7f6f3、amber 主色 #b45309）
- 金萱字體 jf-kamabit-1_0.otf 安裝至 client/public/fonts/
- 後台全域 CSS 變數系統建立（index.css）
- AdminDashboardLayout.tsx 套用深暖棕側邊欄 #1c1917、amber active 線
- AdminDashboard.tsx KPI 數字套用品牌字體 36px
- button.tsx 立體陰影動效（hover 上浮 1px / active 下壓 1px / 80ms）

#### Bug 修復
- exclusiveSlug 404：移除 isActive 過濾條件（server/db.ts）
- 排程發布狀態：ContentManagement.tsx 加入第三種 badge「排程中」
- 大永側邊欄模組控制：DayoneLayout.tsx 引入 useModules hook，super_admin 全顯示

#### Railway 環境變數（2026-04-17 確認完整）
DATABASE_URL / JWT_SECRET / VITE_APP_ID / VITE_APP_URL / OAUTH_SERVER_URL
R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL_PREFIX
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
LINE_CLIENT_ID / LINE_CLIENT_SECRET / LINE_CHANNEL_ACCESS_TOKEN
ECPAY_HASH_IV / ECPAY_HASH_KEY / ECPAY_MERCHANT_ID
ECPAY_LOGISTICS_MERCHANT_ID / ECPAY_LOGISTICS_HASH_KEY / ECPAY_LOGISTICS_HASH_IV
GEMINI_API_KEY / NEWS_API_KEY / RESEND_API_KEY
SMTP_FROM / SMTP_HOST / SMTP_PASS / SMTP_PORT / SMTP_USER
VITE_GOOGLE_MAPS_API_KEY
SYNC_SECRET（新增，Make 推資料驗證用，值：ordersome-sync-2026）

---

### 最近變更（2026-04-16）— 綠界物流

| 類別 | 變更 |
|------|------|
| 物流 | ecpay-logistics.ts + webhook + logistics router + orders 7 欄位 |
| 前端 | 結帳頁選擇配送 + 後台建立物流單 + 我的訂單物流狀態 Badge + 付款完成頁 |
| 環境 | Railway 環境變數 ECPAY_LOGISTICS_* fallback 已設定 |
| 物流 | ECPAY_LOGISTICS_* 環境變數正式啟用，解決「找不到加密金鑰」錯誤 |
| 用戶管理 | TenantUserManagement 通用元件 + tenantUsers router |
| 帳務 | 逾期警示 + 司機端提示 + 收款統計 |
| 報表 | CSV 匯出（BOM 中文相容） |
| 審計 | order_audit_logs 表 + 訂單明細彈窗 |
| B2B | ExclusiveProduct slug 依照公司 |
| Schema | role enum 加 driver |
| 行政修復 | 訂單價格/刪除、設定刪除、售票單修正、Portal 登出修正 |

---

## 九、下一個任務

### 待人工確認（回家測試）
- 加盟詢問表單送出後，後台是否看得到記錄（手腳說邏輯正確但測試報告說看不到）
- 手機後台側邊欄是否真的可以點選（需手機實測）

### 待開發（依序）
1. 損益儀表板：整合日報 + 月報費用 + 退佣 → 自動算每間店損益
2. 加盟主帳款管理：週結帳款追蹤 → 銀行明細對帳 → 未收款提醒
3. Make 串接：門市自動報表 Webhook 直接寫進 os_daily_reports（需先設定 SYNC_SECRET）
4. Make 串接：採購 importFromDamai → 不再走 Google Sheets
5. 門市名稱清單改為後台可設定（目前寫死在 dailyReport.ts STORES 陣列）
6. 供應商編輯介面確認 rebateRate 可從後台調整
7. 官網前台動畫：Clay 等級動效 + 毛玻璃（最後一批）
8. 大永 LIFF 正式 liffId 更新（等蛋博用自己 LINE 後台建立）

---

## 十、踩坑紀錄（避免再踩）

### Git & 流程
- `git add -A` 絕對不能用，只能 `git add 指定檔案`
- 兩台電腦開始前都要先 `git pull`，不然有衝突
- `DayoneLayout` 元件要加入 git（untracked 檔案 Railway build 找不到）

### TiDB 限制
- 不支援 `ADD COLUMN IF NOT EXISTS`
- TiDB `LIMIT ?` 參數綁定報 `Incorrect arguments to LIMIT`，改用 `LIMIT ${input.limit}` 內插
- `mysql2` 連接 TiDB 需手動解析 URL 並設 `ssl: { rejectUnauthorized: false }`
- `drizzle-kit migrate` 本機無法連 TiDB，用 `scripts/migrate-xxx.mjs` 直連執行

### 大永 ERP 特殊規則
- `dy_orders` 欄位名稱是 `totalAmount`，不是 `total`
- `dy_orders.customerId` 是 NOT NULL，找不到客戶傳 0 不傳 null
- `dy_suppliers` 表無 `updatedAt` 欄位，upsert/toggle SQL 不可包含此欄
- `createUser(role='driver')` 需同步 INSERT `dy_drivers` 表，否則司機管理頁查不到
- `users` 表 role enum 原本沒有 `driver`，需執行 ALTER TABLE 加入，不能只改 schema.ts

### 綠界物流
- **金流用 SHA256（ecpay.ts），物流用 MD5（ecpay-logistics.ts），不可混用**
- 物流 env var 有 fallback：`ECPAY_LOGISTICS_*` → `ECPAY_*`
- 物流回調必須回應 `1|OK`
- UNIMART 需額外傳 `CollectionAmount`
- 超商取貨超過 60 件收超重費，超金額上限必須分批
- 前端選擇地圖用 postMessage 回傳

### Portal 路由
- Portal 路由（`/dayone/portal/...`）不能包 `DayoneLayout`（DayoneLayout 內部驗證 dyAdmin）
- Portal 是公開給客戶用的，直接在 App.tsx 放 public Route
- Portal 登出要導到 `/dayone/portal/login`

### 其他
- Procedure 參數名稱要對（DeliveryNote bug：前端傳 orderId，後端要 id）
- `getPublishedPosts` 回傳格式是分頁物件 `{ posts, total, ... }`，前端用 `data?.posts?.map()`
- Tiptap `RichTextEditor` 的 `content` prop 只在初始化時讀取，需在 useEffect 裡用 `editor.commands.setContent()` 更新
- CSV 匯出需加 BOM（`\uFEFF`）否則 Excel 開啟中文亂碼；用 `exportCSV.ts` 工具統一處理
- `TenantUserManagement` 是通用元件，來點什麼複用只需傳 `tenantId={1} tenantName="來點什麼"`
- `useMemo` 內不可呼叫會變動 reference 的 function，改用 `useEffect + useState`
- Map/Set iteration 在 TS `downlevelIteration` 未啟用時報 TS2802，改用 `Array.from(map.entries())`
- Canvas 簽名在 iOS Safari touch event 座標需用 `e.touches[0]`，不是 `e.clientX`
- DayoneDashboard 的 Finance KPI 查詢需確認 portal.ts/dispatch.ts/purchaseReceipt.ts 已匯入 index.ts
- LINE Reply 由後端直接呼叫（用 LINE_CHANNEL_ACCESS_TOKEN），不經過 Make
- Make JSON string 模式無法處理換行符號，改用 Data structure 模式
- `DayoneLayout.tsx` 的 `TENANT_ID` 正確值是 `90004`（曾被錯誤設為 `2`，commit 6fb3df0 已修正）

---

*CLAUDE.md v5.5 — 精簡主檔，詳細參考見 CLAUDE_REFERENCE.md，歷史變更見 DEVELOPMENT_LOG.md*

# CLAUDE.md — OrderSome 工作主檔

> 最後更新：2026-04-16 | 文件版本：v5.4
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

## 八、最近變更（2026-04-16）— 綠界物流

| 類別 | 變更 |
|------|------|
| 物流 | ecpay-logistics.ts + webhook + logistics router + orders 7 欄位 |
| 前端 | 結帳頁選擇配送 + 後台建立物流單 + 我的訂單物流狀態 Badge + 付款完成頁 |
| 環境 | Railway 環境變數 ECPAY_LOGISTICS_* fallback 已設定 |
| 用戶管理 | TenantUserManagement 通用元件 + tenantUsers router |
| 帳務 | 逾期警示 + 司機端提示 + 收款統計 |
| 報表 | CSV 匯出（BOM 中文相容） |
| 審計 | order_audit_logs 表 + 訂單明細彈窗 |
| B2B | ExclusiveProduct slug 依照公司 |
| Schema | role enum 加 driver |
| 行政修復 | 訂單價格/刪除、設定刪除、售票單修正、Portal 登出修正 |

---

## 九、下一個任務

### 待處理任務

#### 大永蛋品（進入蛋博實測階段）
1. ⏳ LIFF 正式上線：蛋博用自己的 LINE 後台建立 LIFF，更新前端 `TENANT_CONFIG` 的 liffId
2. ⏳ 蛋博實測回饋 + 客戶真實資料匯入
3. ⏳ 積欠款 LINE 推播通知（portal.ts 已建 cron 基礎）
4. ⏳ Portal 客戶重設密碼 email（後端尚未實作發信）
5. ⏳ dy_customers upsert procedure 需接受新欄位（customerLevel/settlementCycle 等）

#### 來點什麼 ERP（下一優先）
6. ⏳ 來點什麼 ERP 四模組（配送/客戶/進貨/帳務）— 複用大永通用元件（TenantUserManagement 傳 tenantId=1）
7. ⏳ 來點什麼門市 ERP（排班/日報/食材庫存）
8. ⏳ `/dashboard/delivery`、`/dashboard/customers`、`/dashboard/purchasing`、`/dashboard/accounting` 頁面尚未建立（點擊 404）
9. ⏳ 供應商管理複用給來點什麼（需新增 moduleKey + 頁面）

#### 架構債
10. ⏳ 大永側邊欄模組控制（DayoneLayout，第二個外部客戶簽約前處理）
11. ⏳ 加盟主功能範圍定義

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

*CLAUDE.md v5.4 — 精簡主檔，詳細參考見 CLAUDE_REFERENCE.md，歷史變更見 DEVELOPMENT_LOG.md*

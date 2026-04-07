# CLAUDE.md — OrderSome 工作主檔

> 最後更新：2026-04-07 | 文件版本：v3.0
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

**tenantId=1**：宇聯官網 ｜ **tenantId=2**：大永蛋品

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
- [ ] 每次任務結束執行 `/clear`

---

## 五、核心規則（違反會出 bug）

- 所有 DB 查詢必須帶 `tenantId`，**禁止 hardcode**
- 密碼欄位：登入用 `pwd`、重設用 `newPwd`（Cloudflare WAF 規避）
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
- ⏳ **LIFF 客戶下單（高優先）**
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

### 階段 B — 宇聯 ERP（大永穩定後）
- 庫存管理、排班、門市日報、異常警報

### 階段 C / D
- 採購物流、財務報表 → SaaS 化、多租戶計費

---

## 八、最近變更（2026-04-07）

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

**⚠️ 待處理**：Railway shell 執行 `ALTER TABLE posts ADD scheduledAt timestamp; ALTER TABLE posts ADD category varchar(50);`
**⚠️ 本機未 push**：drizzle/schema.ts / server/routers/content.ts / server/_core/index.ts / drizzle/0020_medical_forge.sql

---

## 九、下一個任務（LIFF 客戶下單）

### Migration 做法（重要）
- Railway 新版介面**已移除 Shell**，不能在 Railway 上直接執行 SQL
- 正確做法：在本機 VS Code 終端機執行 `node scripts/migrate-posts-columns.mjs`
- `.env` 裡有 `DATABASE_URL` 直連 TiDB，本機可以直接操作生產資料庫
- 改完 schema.ts 後，寫一個 `scripts/migrate-xxx.mjs` 腳本，在本機跑即可

### 下一個開發任務：LIFF 客戶下單
見 CLAUDE_REFERENCE.md R10 節。

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

---

*CLAUDE.md v3.0 — 精簡主檔，詳細參考見 CLAUDE_REFERENCE.md*

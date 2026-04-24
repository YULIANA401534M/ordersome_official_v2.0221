# CLAUDE.md — OrderSome 專案主腦


### 前端官網改版進度快照（2026-04-24 v5.98）

**設計規範（品牌系列）**
- 色彩全用 OKLCH：暖黃 oklch(0.75 0.18 70)，奶白背景 oklch(0.97 0.02 85)，深色文字 oklch(0.18 0.02 60)
- 字型：--font-brand（JF-Kamabit）用於大標題，內文用系統字
- 動畫：Framer Motion，EASE_OUT_EXPO [0.16, 1, 0.3, 1]，須包 prefers-reduced-motion
- 絕對禁止：gradient text（bg-clip-text）、bounce/elastic easing、卡片套卡片、每個標題上方放圓角 icon
- 非同步資料頁：文章/門市卡片不可用 useInView 控制 animate，改用直接 animate
- tRPC 查詢邏輯和 Link href 路由一律不動
- 每次改完必須 npm run build 確認通過再 commit & push

**品牌子頁面（全部完成）**
| 頁面 | 狀態 | 特色 |
|------|------|------|
| BrandHome.tsx | done | 視差 Hero「今天，來點什麼？」，食物照片牆，門市數字條 |
| BrandMenu.tsx | done | 菜單圖片貼紙標籤，分類 Tab + 圖片磚格子 |
| BrandStores.tsx | done | 地圖全寬，auto-fill minmax(260px,1fr) 格子，useInView 時序修正 |
| BrandStory.tsx | done | 視差 Hero，暗底引言帶，四里程碑時間軸，三大理念橫線，暖黃願景帶 |
| BrandFranchise.tsx | done | 深色 Hero，四大優勢橫線，暖黃引言帶，六步驟格子，FAQ，深色表單 |
| BrandNews.tsx | done | 視差 Hero，分類 tab，非同步文章格子（直接 animate），空狀態大字 |
| BrandContact.tsx | done | 深色 Hero，雙欄（聯絡資訊橫線 / 表單），hover 暖黃按鈕 |

**企業子頁面 — 深暖碳黑 + 品牌金銅色系**
色彩 token（正確版，勿用 hue 250 冷藍灰）：
- 背景：oklch(0.12 0.01 60)，淺色段：oklch(0.97 0.02 85)
- 文字：oklch(0.95 0.01 80)，次要：oklch(0.60 0.025 75)
- 強調金銅：oklch(0.72 0.14 78)，強調暗：oklch(0.26 0.06 78)
- 分隔線：oklch(0.22 0.02 70)

Hero 圖片規則：
- 一律用 /images/logo-intro-dark.png（深色背景金黃筆刷∞，天生融入）
- position:absolute 右半滿版，object-fit:cover object-left
- 左側漸層 linear-gradient(to right, bg 0%, transparent 40%)
- 底部漸層 linear-gradient(to top, bg 0%, transparent 35%)
- 絕對不用 corporate-logo.png（白底 PNG 放深色背景會破圖）

| 頁面 | 狀態 | 備註 |
|------|------|------|
| CorporateAbout.tsx | done | 深暖碳黑+金銅，Hero logo-intro-dark 滿版，橫線數字帶，願景使命橫線，五大價值觀 |
| CorporateBrands.tsx | done | Hero 視差+右半logo，主品牌全版展示（橫線三特色+數字帶+CTA），食物小圖六格，即將推出三欄，引言帶 BRANDS |
| CorporateCulture.tsx | done | Hero 視差+右半logo，核心宣言帶，八大行動準則橫線，職場三承諾雙欄，引言帶 CULTURE，CTA底帶 |
| CorporateFranchise.tsx | pending | 企業加盟（與品牌版稍有不同） |
| CorporateNews.tsx | pending | 集團消息（publishTarget = corporate） |
| CorporateContact.tsx | pending | 企業聯絡，B2B 合作詢問 |

使用設計 skill：/impeccable craft CorporateBrands 等指令觸發。

---

## 參考文件

詳細業務邏輯請看 BUSINESS.md；完整技術棧與 API 清單請看 CLAUDE_REFERENCE.md；歷史變更請看 DEVELOPMENT_LOG.md

---

## 安全守則（高優先）

- **絕對不能把 DATABASE_URL、API Key 寫死進任何 .ts / .mjs / .bat / .js 檔案**
- 敏感資料一律走 `.env`，部署走 Railway Variables（production）
- `.env` 已在 `.gitignore`，不可 commit；`.mjs` / `.bat` 也注意不要硬寫
- script 檔案裡的連線資訊一律用 `process.env.DATABASE_URL`
- 2026-04-24 已清除含敏感資訊的 migrate_temp.mjs / tidb-check-and-sync.mjs / start-dev.bat，不要再重建

---

## 每次 commit 前的標準流程

1. 每次 commit 前**先更新 CLAUDE.md**，版號 +0.01
2. CLAUDE.md 要讓下一個接手的 Claude 看完就能掌握全局
3. 版號格式 v5.XX
4. 確認 TS 無錯誤再 commit
5. 每次 commit 後也要更新 docs/ordersome_module_map_v1.html（每個功能模組的狀態 status-pill）
   - done：完整可用
   - partial：部分功能可用
   - running：開發中
   - pending：尚未開始
6. **前端設計工作**：使用 impeccable skill，skill name = `impeccable`

---

## 待辦（後端功能）

1. **RWD 優化**：部分手機/桌面版面跑版
2. **細粒度權限**：目前只有 super_admin 和 manager 兩層
3. **鞈查**：補完所有後台功能的 DB 欄位驗證
4. **稽核日誌**：所有重要操作寫入 os_audit_logs，包含庫存異動寫入 os_inventory_logs
5. **供應商匹配**：模糊比對 os_products.name，補完 aliases JSON 機制
6. **商品名稱對照**：目前 A 供應商用「大盒蛋」，進貨用 aliases JSON 對照
7. **庫存盤點**：目前手動調整沒有完整 DB 紀錄
8. **多租戶架構**：宇聯 ERP（os_）+ dayone（dy_）+ server/_core/ 分開

---

## DB 資料現況（2026-04-19 盤點）

| 資料表 | 筆數 | 備註 |
|----|------|------|
| os_procurement_orders | 484 | 453筆大買進貨 + 31筆頂好望族進貨 |
| os_procurement_items | 10263 | 各家進貨明細 |
| os_inventory | 187 | B類4 + 嗡嗡蜂141 + 其他22 |
| os_inventory_logs | 706 | 含3/31期初盤點入庫165筆 + 4/1起正常進出81筆 |
| os_payables | 27 | 25筆大買進貨月結應付，另2筆對帳中 |
| os_products | 704 | 啟用67 + 大買進貨匯入137筆 needsReview=1 |
| os_stores | 12 | 靘?隞暻?2間門市，2026-04-19更新 |
| os_suppliers | 9+ | 撱??/鋆?/大買/蝐唾健/頂好/大永蛋行/摰/摰_望暑，含嗡嗡蜂 |

### 已知資料異常

- `os_procurement_orders.storeId`：6筆 storeId=NULL，storeName 欄位有值但無對應門市，待追蹤
- `os_procurement_items.unitPrice=0`：376筆，採購梯"項目在2026-02以前的閒置舊料
- `os_products.needsReview=1`：137筆大買進貨匯入商品，需在 /dashboard/products 逐一審核
- 商品重複計算問題：部分品項在不同供應商下重複，待梳理

### os_stores 門市清單（tenantId=1）

| 門市名稱 | 簡稱 |
|---------|------|
| 靘?隞暻?北屯中清店 | 北屯中清店 |
| 靘?隞暻?北屯崇德店 | 北屯崇德店 |
| 靘?隞暻?豐原店 | 豐原店 |
| 靘?隞暻?太平店 | 太平店 |
| 靘?隞暻?太平東店 | 太平東店 |
| 靘?隞暻?霧峰店 | 霧峰店 |
| 靘?隞暻?霧峰南店 | 霧峰南店 |
| 靘?隞暻?大里店 | 大里店 |
| 靘?隞暻?北屯文心控股店 | 北屯文心控股店 |
| 靘?隞暻?鎮平扈蝳?店 | 鎮平扈蝳?店 |
| 靘?隞暻?鞎∠?店 | 鞎∠?店 |
| 靘?隞暻?東勢店 | 東勢店 |

---

## 待解決的業務 Todo

### 緊急（影響正常作業）

**P1 需要盡快修的**
- [ ] **帳務核對**：/dashboard/purchasing、/dashboard/inventory、/dashboard/accounting 各有不完整功能待補
- [ ] **needsReview 商品審核**：137筆待審商品在 /dashboard/products 逐一確認
- [ ] **日報彙總功能**：os_daily_reports 目前各門市梯?資料格式不統一，彙總計算有誤

**P2 重要**
- [ ] 太平東/北屯等多店的門市成本分攤問題
- [ ] 瘣曇???採購品項的成本追蹤
- [ ] 供應商蝝啣??澆??舀：目前唳撘?
- [ ] chunk size 優化：index.js ~6500kB，需 code splitting

**P3 備用**
- [ ] BOM 建立：撌交?隞塚??∟頃鞈?蝛拙? + os_products 皞?
- [ ] 大永 LIFF 功能：liffId 尚未上線
- [ ] 加盟商 RWD 優化
- [ ] 商品蝞∠??∪極鞈??臬

**已完成事項（2026-04-19）**
- [x] 3/31 期初盤點入庫，165筆（B類4+嗡嗡蜂141）
- [x] 大買進貨匯入閮?臬，453筆 2025/12~2026/04
- [x] 撱?採購梯"?臬，5筆隞董甈橘? 2026-02~04
- [x] v5.63 撣喳?銝?修正
- [x] v5.64 加盟商月結修正
- [x] v5.65 損益銵冽修正 + 餈?0筆規則
- [x] v5.67 進貨/撣喳?蝞∠?修正 + profitLoss 撌脫 + OSInventory deleteMut 修正
- [x] v5.68 manager 甈??B規則 + 商品30筆 + 商品50筆needsReview + 撣喳???敦
- [x] v5.69 鋆?修正 + OSProfitLoss redirect + 異常修正 + 商品+庫存隤踵
- [x] v5.70 rebateRate > 1 支誑100 + profitLoss 撌脫 channelSales/dailyTrend/procurementCost + OSDailyReport viewYear/viewMonth
- [x] v5.71 加盟商採購列表 franchiseeOrAdminProcedure，franchisee 限 storeId + storeName 顯示

---

## 給 Leo 的待辦資料

| 資料 | 需要提供 | 格式 | 用途 | 狀態 |
|------|----------|------|------|------|
| 3/31 期初盤點 | 盤點人員簽核 | Excel | 庫存入庫基準 | 已撌脣完成 |
| 大買進貨匯入 | 大買進貨憑單 | Excel | 進貨匯入閮? | 已撌脣 2025/12起 |
| 撱?採購梯" | 大買進貨帶來的 | Excel | 進貨梯"撣單狡 | 已撌脣 2026-02起 |
| 盤點?箄疏蝞∠?（2025全年） | 大買進貨脣憑函恣 | Excel | 2025進貨鋆? | 尚未提供，只有2025/12起 |
| 供應商蝝堆???堆? | 唳?銵雯??臬 | xlsx | 供應商撣? | 尚未提供，靘?中 |

---

## 採購流程詳細紀錄（給 Claude 看）

### 靘?供應商分類

**A類（直接進貨）**：撱??/鋆?/大買/蝐唾健/鋆?/大永蛋行
  進貨後狀態 received → 自動結算月結應付

**B類（大永自配）**：大永/摰_望暑/蝡?/銝?瘜?撅/瘞貉?
  進貨後 received → 庫存增加 + 月結應付
  瘣曇???signed → 庫存減少 + 門市應付
  用 `os_suppliers.deliveryType='yulian'` 判斷是否大永配送
  > **重要**：供應商可能跨類，需在 os_suppliers 維護清楚配送類型

### 庫存異動邏輯
- **期初盤點**：2026-03-31 盤點，reason='3/31期初盤點入庫'
- 進貨 received：os_inventory currentQty +，寫 os_inventory_logs(in)
- 瘣曇???signed：os_inventory currentQty -，寫 os_inventory_logs(out)
- 手動調整：需填原因，寫入 os_inventory_logs(adjust)
- **重要限制**：庫存 AND orderDate >= 2026-04-01，3/31以前的盤點不要閫貊

### 進貨資料來源標記
- `os_procurement_orders.sourceType = 'damai_import'`：大買進貨匯入
- `os_payables.sourceType = 'damai_import'`：大買進貨應付帳
- `os_inventory_logs.reason LIKE '大買%'` 或 `'3/31期初%'`：識別進貨來源
- 去重機制：比對 externalOrderId，重複用 supplierName+yearMonth+sourceType 組合

### 撣喳?帳務邏輯
- 進貨 received → os_payables 月結（generateMonthlyPayables）
- 供應商蝝啣????autoMatchTransactions 功能尚未完成
- rebate 規則：大永繩1.12撌桅? / 大永蛋行撌桀 / 其他菔疏甈橘? os_rebate_rules 存DB
- 轉帳疏理 billTransfers → os_franchisee_payments

### 商品名稱對照問題
- 採購：採購閬/閮?梯"，商品不一定對，需要 supplierName
- 問題：A供應商用「大盒蛋」，大買進貨用 aliases JSON 對照
- needsReview=1：大買進貨匯入待審核商品，不能自動信任

### os_stores 門市命名規則
- 完整名稱格式：`靘?隞暻?{門市簡稱}`，例如：靘?隞暻?豐原店
- 目前前端 name 用 CONCAT('靘?隞暻?', shortName) 顯示
- storeName：前端顯示用，storeId 才是 FK

---

## 已知 Bug 與修法（給 Claude 看）

**時區問題（v5.77 已修）**
- Railway 部署的 Node.js 時區是 UTC
- `new Date()` 在 Node.js 回傳 UTC，不是台灣時間 UTC+8
- 前端顯示：`toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })`
- datetime-local **讀取**時：`new Date(utcString).getTime() + 8*60*60*1000` 加8小時，再 `toISOString().slice(0,16)`
- datetime-local **儲存**時：直接補 `:00+08:00`，例如 `"2026-04-24T15:00"` 變 `"2026-04-24T15:00:00+08:00"`，讓 `new Date()` 正確解析 UTC
- scheduledAt 查詢邏輯：`getPublishedPosts` WHERE 條件用 `or(isNull(scheduledAt), lte(scheduledAt, now))`，不需要 cron，但注意DB存UTC
- 時區問題會影響所有排程相關功能

**shadcn Dialog 捲動問題（v5.81 已解）**
- shadcn `DialogContent` 預設 className 是 `grid`，加了 `flex flex-col` 會被 tailwind-merge 覆蓋 display，導致 flex sizing 失效
- **正確做法**：把 Header + 內容 + Footer 包在 `DialogContent` 裡面額外加一個 `div`：
  ```tsx
  <DialogContent className="!max-w-2xl p-0 gap-0 max-h-[90vh]">
    <div className="flex flex-col h-full max-h-[90vh]">
      <DialogHeader className="... shrink-0">...</DialogHeader>
      <ScrollArea className="flex-1 min-h-0 w-full">...</ScrollArea>
      <DialogFooter className="... shrink-0">...</DialogFooter>
    </div>
  </DialogContent>
  ```
- `DialogContent` 自帶圓角，不要在外層 div 加
- `ScrollArea` 必須給 `min-h-0`，否則 flex 容器壓不住，Footer 會消失
- `overflow-hidden` **不能加在 `DialogContent`**，會破壞 ScrollArea 捲動
- 圓角圖片問題：`rounded-*` 和 `overflow-hidden` 要加在**最內層 div**，不是 img，img 用 `w-full h-full object-cover object-center`

**Make 連動**
- 每天 14:55 自動觸發，走 /api/procurement/import
- secret: ordersome-sync-2026
- 如果失敗去查 Railway log 找 `[Procurement Import]` 即可

**Email 發送**
- Railway 上跑 SMTP，用 nodemailer 發信
- 目前沒有設定靽殷，任何時間都會發

**DB 業務邏輯備忘**
- os_payables.netPayable = totalAmount - rebateAmount；generateMonthlyPayables 計算的是 totalAmount，calculateRebates 再 offset 計算
- profitLoss 是讀 os_rebates.netRebate，不是 os_rebate_records
- profitLoss 帳目：os_payables 裡有採購帳，採購帳的利潤約 35%，不是精確數字
- profitLoss.ts 要注意 tenantId（camelCase），storeId 要是字串，os_monthly_reports 有 storeId 欄位
- profitLoss 要從 os_payables WHERE month=YYYY-MM 取資料，沒資料才 fallback 35%
- OSInventory.tsx deleteMut 是 inventory.deleteItem，deleteTarget/deleteReason state 要清空
- 進貨蝞∠?每次提交有表單驗證，券、敹恍?祇??祆?/銝?/券???冽?撓?亙椰?都要驗
- 撣喳?蝞∠? month 表單驗證，mutation（generatePayables/calcRebates/autoMatch/billTransfers）month 不能空
- manager 模組開關：isModuleDefs 的 managerAllowed 欄位，managerAllowed:true 的路由讓 manager 可以進入
- 商品清單用 useEffect role 切換，super_admin 要有 has_procurement_access 才能進 /dashboard
- 庫存蝞∠?商品超過 30 筆限制時要分頁
- 商品清單超過 50 筆 + needsReview 分頁，OSProducts.productList input 有 needsReview: z.boolean().optional()
- 採購撣單狡瘥????dz 連結到 /dashboard/purchasing?supplier=撱???
- OSPurchasing.tsx 讀 URL ?supplier= 參數，用 useSearch + useEffect 帶入篩選
- os_products 共 704 筆，v5.57 起從大買進貨匯入，有37筆 needsReview=1
- os_products 有 `temperature` 欄位但目前沒在用，改走 `category2`
- **採購撣單狡修正（v5.92）**：procurement.updateStatus received → upsert os_payables，撱?+遢蝝臬? totalAmount，netPayable=totalAmount-rebateAmount，不再靠獨立的 generateMonthlyPayables 去補
- **rebate 梁絞銝（v5.86）**：OSRebate.tsx 的按鈕走 accounting 路由，listRebates/calculateRebates/updateRebate + listPayables/markPayablePaid，osRebate router 重新整理，Ⅱ隤甈?dialog 修正，rebate 靘摩鈭箏極頛詨
- os_delivery_orders.toStoreId 目前為 NULL
- os_franchisee_payments.userId 目前為 NULL
- packCost = 大買進貨脰疏?對??湔撠?，用 unitQty × unit_cost 計算
- os_daily_reports 欄位（camelCase）：tenantId, reportDate, instoreSales, uberSales, pandaSales, guestInstore, guestUber, guestPanda, phoneOrderAmount, deliveryOrderAmount
- os_monthly_reports 欄位（camelCase）：tenantId, electricityFee, waterFee, staffSalaryCost, performanceReview, monthlyPlan
- profitLoss 的 totalSales = instoreSales+uberSales+pandaSales+phoneOrderAmount+deliveryOrderAmount
- os_inventory.itemValue = currentQty × unitCost，閰Ｘ?閮?時撖阡?甈?
- profitLoss 要有 dailyTrend（日趨勢），channelSales（通路銷售），procurementCost/isCostEstimated
- osRebate.calculate：rebateRate > 1 就除以 100，os_suppliers 存的是真實數字，10.71 = 10.71%
- procurement list 走 franchiseeOrAdminProcedure，在 server/_core/trpc.ts 定義；franchisee 只顯示自己 storeId 的 os_stores 門市名稱
- OSPurchasing.tsx：isFranchisee = user.role==='franchisee'，加盟商看不到其他門市/進貨/月結/庫存/筆數，canEdit 只在非 franchisee 時有效
- OSRebate.tsx 用 accounting.listRebates 查 os_rebates，accounting.calculateRebates 計算再神入 os_rebates
- OSDailyReport MonthlyOverviewTab 有獨立 state 控 viewYear/viewMonth，select 要帶入正確值
- OSProfitLoss 用 recharts：AreaChart 瘥頞典，PieChart 通路銷售，BarChart 鞎餌蝯?
- **scheduledAt 時區問題（v5.76 修正）**：getPublishedPosts WHERE 條件用 `or(isNull(scheduledAt), lte(scheduledAt, now))`；status=published 不夠用，要加時間判斷；排程發布不需要 cron，但注意 DB 存 UTC+8，Node.js 解析 UTC，要在儲存時補 +08:00
- os_inventory.updatedAt 用來顯示最後盤點日期，等同 lastCountDate
- products.salesCountOffset（v5.85）：蝞∠?累計銷量用，實際銷量 = 訂單銷量 + offset，migration 0028 在 Railway 是 ADD COLUMN IF NOT EXISTS
- getHistory LIMIT 調整為 10，historyDialog 最多顯示 10 筆

**os_stores Schema**
```sql
id INT AUTO_INCREMENT PRIMARY KEY
tenantId INT NOT NULL
name VARCHAR(100) NOT NULL        -- 完整名稱，例如「靘?隞暻?豐原店」
shortName VARCHAR(50)             -- 簡稱，例如「豐原」
storeCode VARCHAR(20)             -- 系統門市編號
isActive TINYINT DEFAULT 1
createdAt DATETIME
updatedAt DATETIME
INDEX idx_tenant_name (tenantId, name)
```

**採購流程觸發點**
- 進貨 confirmed → 進貨蝞∠?觸發配送，連結到 /dashboard/delivery
- 瘣曇???signed → 庫存減少 + os_franchisee_payments 建立
- 撣喳?蝞∠? Tab1 的撣單狡篩選，頝唾?進貨蝞∠?帶入預選供應商

**每次 commit 前標準確認**
1. `git status` clean
2. `npm run build` 成功
3. CLAUDE.md 版號更新

---

## 環境變數清單

| 變數 | 值 | 說明 |
|------|----|------|
| `HQ_STORE_ID` | `401534` | 總部 storeId，訂單特判用 |
| `SYNC_SECRET` | `ordersome-sync-2026` | Make Webhook 驗證 |
| `DAYONE_TENANT_ID` | `90004` | 大永的 tenantId |
| `OS_TENANT_ID` | `1` | 靘?隞暻?的 tenantId |
| `GMAIL_APP_PASSWORD` | Railway 設定裡看 | SMTP 發信用，sendMail 才會用到 |

---

## 系統架構備忘

**多租戶架構**
```
宇聯（OrderSome）：tenantId=1，目前12間門市
大永（Dayone）：tenantId=90004，獨立 SaaS 架構
```

**部署資訊**
- 網址：https://ordersome.com.tw
- 部署：Railway，自動 CI/CD，push 後 2-3 分鐘上線
- 資料庫：TiDB Cloud（MySQL 相容）
- 套件管理：npm 10
- Git 規則：commit 只 add 指定檔案，不用 `git add -A`

**注意事項**
- `has_procurement_access` 目前用 any cast 暫解，需要等正式 permissions 系統完成
- 大永/靘?隞暻?ERP 的 table 用 `dy_`/`os_` 前綴區分，在 `schema.ts` 管理，不走 raw SQL
- 圖片目前寄放在 R2，路徑如 `client/public/images/menu/korean-roll/`
- chunk size 警告：index.js 6453kB，後續再規劃 code splitting

---

## Migration 注意事項

每次跑 migration 前**務必**先 DESCRIBE 確認欄位存在（TiDB 不支援 IF NOT EXISTS 版本）：
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
  const [rows] = await conn.execute('DESCRIBE 資料表名稱');
  console.log(rows.map(r => r.Field).join(', '));
  await conn.end();
}
check().catch(console.error);
"
```

> **注意**：2026-04-18 跑 0023 migration 時有問題，TiDB 的 `has_procurement_access` / `last_login_at` 欄位，不能直接照 SQL 語法加，必須先查有沒有再決定要不要跑

---

## tRPC Procurement Router Procedures

- `list` / `create` / `getDetail` / `updateStatus` / `groupBySupplier`
- `pushToLine` / `supplierLineList` / `supplierLineUpsert` / `getSuppliers`
- `deleteOrder`（superAdmin）/ `batchDeleteOrders`（superAdmin）/ `updateNote`
- `updateItem` / `addItem` / `listStoreNames` / `listSupplierNames`
- `getPickList` / `markPrinted` / `importFromDamai`（public）/ `importFromDamaiExcel`
- `listNeedsReview`

## tRPC Delivery Router Procedures

- `listDeliveryOrders` / `getDeliveryDetail` / `createDeliveryOrder`
- `createFromProcurement` / `updateStatus` / `getMonthStats`

---

## 大永（Dayone）未完成功能

- LIFF 功能：liffId 尚未設定，`client/src/pages/liff/LiffOrder.tsx` 連結不上
- 蝛? LINE 通知：cron 排程尚未建立
- Portal 找回密碼：email 發送尚未串接 Resend

---

## Make 自動化相關

- 每天同步 Webhook 自動觸發 `os_daily_reports`，SYNC_SECRET 驗證
- 大買進貨 importFromDamai 透過 Google Sheets 觸發
- Make Webhook URL：`https://hook.us2.make.com/6ihglkavm26i29mdgg33dvxngggv1xiu`
- SYNC_SECRET：`ordersome-sync-2026`

---

## 細粒度權限系統（待開發）

**現況**：role 欄位只有粗粒度的角色判斷，進階的 module 開關 hardcode 在前端

**計劃做法**
1. DB 新增 `os_user_permissions` 資料表
   - `userId, moduleKey, canView, canEdit, canDelete`
2. 後端新增 `permissionMiddleware`，擴充 adminProcedure/managerAllowed
3. 前端改用動態讀取 permissions API，不要 hardcode 功能開關
4. `AdminDashboardLayout` 從 permissions API 動態生成側邊欄，不再 hardcode
5. 統一 `isSuperAdmin`/`isManager`/`canSeeCost` 判斷改走 permissions 表

**優先順序**：2，等 UAT fix 穩定後再做
**關鍵檔案**：`AdminDashboardLayout.tsx`、`OSERP 相關`、`trpc.ts`

---

## os_menu_items 待建

**問題**：`os_menu_items` 欄位在 TiDB 沒有，OSCaMenu 功能目前不完整

**計劃**
1. 補 migration 建立 `os_menu_items` 和 `os_menu_item_ingredients` 資料表
2. 補後端對應的查詢
3. 補 `os_products.unitCost` 計算

**優先順序**：2，目前功能暫缺

---

## Dayone 系統完整紀錄

### 視覺系統規範（已建立）
- `docs/backoffice-visual-system-v1.md`：後台視覺規範文件
- 後台主標題用穩定可讀的 UI 字體，不用強勢品牌字
- 色彩：暖白 / 石墨 / amber，強調色只用在重點
- 同一套規範可延伸到宇聯後台

### 已重寫完成的頁面（2026-04-24）
- `client/src/components/DayoneLayout.tsx`
- `client/src/pages/dayone/DayoneDashboard.tsx`
- `client/src/pages/dayone/DayoneOrders.tsx`
- `client/src/pages/dayone/DayoneCustomersContent.tsx`
- `client/src/pages/dayone/DayoneLiffOrders.tsx`
- `client/src/pages/dayone/DayoneProducts.tsx`
- `client/src/pages/dayone/DayoneInventoryContent.tsx`
- `client/src/pages/dayone/DayonePurchaseContent.tsx`
- `client/src/pages/dayone/DayoneUsers.tsx`
- `client/src/pages/dayone/DayonePurchaseReceipts.tsx`
- `client/src/pages/dayone/DayoneARContent.tsx`
- `client/src/pages/dayone/driver/DriverPickup.tsx`
- `client/src/pages/dayone/driver/DriverLayout.tsx`
- `client/src/pages/dayone/driver/DriverHome.tsx`
- `client/src/pages/dayone/driver/DriverToday.tsx`
- `client/src/pages/dayone/driver/DriverOrders.tsx`
- `client/src/pages/dayone/driver/DriverDone.tsx`
- `client/src/pages/dayone/driver/DriverOrderDetail.tsx`
- `client/src/pages/dayone/driver/DriverWorkLog.tsx`
- `client/src/pages/dayone/DayoneDispatch.tsx`

### 後端補強（2026-04-24）
- `server/routers/dayone/dispatch.ts`：manualAddStop 可建立 dispatch_supplement 補單，含 dy_order_items
- `server/routers/dayone/driver.ts`：delivered 後更新 AR
- `server/routers/dayone/orders.ts`：confirmDelivery 補 paidAmount 判斷 paymentStatus，upsert AR
- `server/routers/dayone/ap.ts`：markPaid 改累加式付款（不再覆蓋前次）；新增 dayone.ap.summary（供應商月度 AP 彙總）
- `server/routers/dayone/ar.ts`：markPaid 改累加式收款（不再覆蓋前次）
- `server/routers/dayone/purchaseReceipt.ts`：新增 reconcileAnomaly（進貨異常對帳）

### 已補的文件
- `docs/system-boundary-matrix-v1.md`：宇聯 / 來點什麼 / 大永系統邊界
- `docs/dayone-smoke-test-and-stock-plan-2026-04-24.md`：smoke test 規劃與庫存三段式計劃

### Dayone 頁面地圖

**管理端**
- `/dayone`：今日訂單、待簽收進貨、已送達、異常、金額與庫存警示
- `/dayone/orders`：訂單池（LIFF/Portal/代建單，統一進 dy_orders）
- `/dayone/customers`：客戶主檔（商家、電話、地址、月結條件、區域）
- `/dayone/drivers`：司機主檔（司機、車牌、聯絡方式、帳號）
- `/dayone/products`：品項主檔（蛋品品項、單位、價格、啟用）
- `/dayone/inventory`：庫存總覽（現有庫存、警示、異動紀錄）
- `/dayone/purchase`：採購與供應商管理
- `/dayone/districts`：區域與配送星期規則
- `/dayone/liff-orders`：LIFF 訂單入口查核
- `/dayone/dispatch`：派車工作台（建立、列印、臨時加站、剩貨回庫）
- `/dayone/purchase-receipts`：進貨簽收（供應商簽名、入庫、建 AP、AP 付款工作台）
- `/dayone/ar`：應收帳款（客戶未收/已收/逾期，司機日報，月結對帳）
- `/dayone/users`：帳號管理

**客戶端**
- `/dayone/portal/*`：下游客戶入口（下單、對帳、帳戶資料）

**司機端**
- `/driver/today`：今日任務總覽
- `/driver/orders`：訂單與停靠點清單
- `/driver/order/:id`：單筆配送、簽名、收款
- `/driver/pickup`：撿貨/上車作業
- `/driver/done`：已完成配送
- `/driver/worklog`：現金、剩貨回庫、日結

### 真實作業流程

1. **上游進貨**：建單 → 供應商簽名 → 入庫 → 建 AP 明細 → AP 可付款核銷
2. **下游訂單**：LIFF/Portal/人工代建 → 統一進 dy_orders → 管理端整併派車
3. **派車出車**：依日期/區域/司機生成派車單 → 列印時扣庫存 → 司機撿貨出車
4. **配送簽收**：客戶簽名、現收或月結 → 送達後形成/更新 AR
5. **剩貨回庫**：車上剩貨回倉 → 庫存增加 → 寫庫存異動 → 保留日結痕跡

### 後續新增節點規則
每次新增節點前，必須先寫清楚這五件事：
1. 節點屬於哪條主線（訂單/進貨/派車配送/帳務）
2. 觸發時點（建立、列印、簽名、送達、回庫）
3. 影響哪些資料表
4. 是否影響庫存數量
5. 是否影響 AR / AP

Dayone 主線 Table 對照：
- 訂單主線：`dy_orders`
- 派車配送主線：`dy_dispatch_orders`, `dy_dispatch_items`
- 進貨主線：`dy_purchase_receipts`
- 庫存主線：`dy_inventory`, `dy_stock_movements`
- 下游應收：`dy_ar_records`
- 上游應付：`dy_ap_records`

### Dayone 目前已完成 vs 尚未完成

**較完整的部分**
- 上游進貨：建單 → 供應商簽名 → 入庫 → 建 AP → 可付款核銷
- 下游應收：送達後形成/更新 AR → 可分次收款
- 司機流程：撿貨 → 配送 → 簽收/收款 → 剩貨回庫 → 日結
- 進貨頁可直接看供應商月度 AP 聚合

**尚未完成**
- 逐頁完整人工 smoke test
- 臨時加貨補單與差異對帳（dispatch.ts 已加 manualAddStop，但端對端未驗）
- 庫存三段式狀態：可用 / 已派車 / 回庫待驗（只有計劃，未實作）
- 供應商付款單完整閉環
- 低頻頁面殘留舊樣式清理

### Chunk 策略
- 白畫面事故後已移除所有 manualChunks，回退保守單一 chunk 策略
- 若未來再做 chunk 優化：先確認 Railway 部署與瀏覽器 runtime log，不可直接重上 manualChunks，任何拆包都必須先驗證首頁與 `/dayone/*` 不白畫面

### 最新 Dayone Commit
- `1242b34` feat: strengthen dayone payment workflows（2026-04-24 最後已 push）

### 對下一個對話框的提醒
- 不要碰高風險 chunk / lazy route 拆包
- 不要自作主張大改視覺，優先邏輯閉環
- 不能說系統 100% 沒問題，要區分「已驗證」和「尚未驗證」
- 每做一輪都要 build 驗證後再 commit、push
- 使用者非常在意：有沒有 commit、有沒有 push、有沒有更新 CLAUDE.md
- 回報要誠實，build 有過 ≠ 全站驗證完

### Dayone 最新 progress（本輪）
- Static route review covered: /dayone, /dayone/orders, /dayone/customers, /dayone/dispatch, /dayone/purchase-receipts, /dayone/ar, /driver/*
- dispatch.ts 的 manualAddStop 可建 dispatch_supplement
- purchaseReceipt.ts 新增 reconcileAnomaly
- DayoneDispatch.tsx 加了臨時補貨輸入，沒動 chunk 結構
- DayoneDashboard.tsx 修正 anomaly KPI 用 status === 'anomaly'
- npm run build 通過



## Dayone 2026-04-25 logic re-check note
- Re-checked last round's Dayone supplement / receipt flow instead of assuming build == fully verified.
- Confirmed and fixed one real supplement-order risk:
  - If a dispatch was already printed or in_progress, manualAddStop with supplement items could create dy_orders / dy_order_items without consuming inventory.
  - dispatch.ts now consumes inventory immediately for supplement items on printed/in_progress dispatches and blocks adding stops on completed dispatches.
  - Supplement orders created after dispatch print now use picked status instead of assigned.
- Confirmed and fixed purchase receipt state-safety gaps:
  - purchaseReceipt.sign now only allows pending receipts.
  - purchaseReceipt.markAnomaly now only allows pending receipts.
  - purchaseReceipt.reconcileAnomaly now only allows anomaly receipts.
  - sign now checks existing AP by purchaseReceiptId before insert to avoid duplicate AP records on repeated signing.
- DayoneDispatch.tsx now disables add-stop action when dispatch status is completed so UI matches backend guard.

### Verified this round
- End-to-end code-path review was re-done for supplement dispatch and purchase receipt state flow.
- npm run build passed after the logic fixes above.

### Still not fully verified
- No full browser click-through across all Dayone and /driver routes yet.
- No live DB scenario replay was run for supplement order after printed dispatch.
- Existing mojibake/text-encoding issues still exist in some Dayone UI copy and were not cleaned in this logic round.

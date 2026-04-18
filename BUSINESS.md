# BUSINESS.md — 宇聯國際業務邏輯與工作流程
> 給大腦讀的。手腳只讀 CLAUDE.md。
> 最後更新：2026-04-19

## 一、公司結構

宇聯國際文化餐飲有限公司
- 來點什麼（tenantId=1）：早午餐連鎖，13間門市（直營+加盟）
- 碗碗俠 BowlHero（開發中）：目標2026年6-7月首店
- 大永蛋品（tenantId=90004）：付費SaaS客戶，月租3,000-8,000

## 二、採購流程全貌

### 日常採購（大麥系統）

加盟主/直營店長 → 大麥採購系統叫貨（合約剩約一年）
↓
大麥自動寄 Excel 到 ordersome2020@gmail.com（一封信=一間門市）
↓
Make 統整工作流（每天14:55自動執行）：
Gmail搜尋標籤 → 取信 → 下載Excel → 寫入Google Sheets
→ Text aggregator（;; 分隔，| 欄位分隔）
→ HTTP POST 到 /api/procurement/import
→ Gmail標記已處理
↓
OrderSome 後端按 supplierName 分組，每廠商各建一張叫貨單

### 歷史訂單匯入

- 從大麥後台匯出各門市 Excel（欄位：訂單編號/供應商/門市/品名/單位/數量/進貨價/溫層/訂單日期）
- 至 /dashboard/purchasing → 「匯入大麥 Excel」
- 系統防重複（訂單編號為唯一鍵）
- 歷史訂單（早於今天）自動設 received 狀態
- 3月份以前 B類不觸發庫存（基準點為3/31盤點）
- 4/1之後 B類觸發庫存入庫

## 三、供應商分類（核心業務規則）

### A類：直送廠商
廣弘、凱田、韓濟、米谷、裕展、美食家、椪椪、長春騰等

- 廠商直接送到各門市，宇聯沒有庫存壓力
- sourceType = 'damai_import'
- 需記應付帳款（月結），不記庫存
- 退佣規則：廣弘10.71%（含稅反推）、伯享差價、韓濟抵貨款

### B類：宇聯自配廠商
宇聯、宇聯_配合、立墩、三柳、凱蒂

- 廠商送到宇聯倉庫（或寄庫於凱田），宇聯自己配送給門市
- sourceType = 'damai_yulian'
- 需記庫存（os_inventory）+ 應付帳款
- B類廠商清單由 os_suppliers.deliveryType='yulian' 控制，不寫死程式碼
- 宇聯_配合：OEM/ODM貨物，實體放在凱田倉庫（寄庫），付凱田運費，但仍是宇聯資產

### 廠商資訊說明
- 廠商資料管理在 os_suppliers 表
- 品項命名不顯示廠商前綴（大麥命名規則）
- 廠商資訊只在 os_products.supplierName 和 os_suppliers 查詢

## 四、品項命名規範（定案 2026-04-18）

**格式**：品名_規格/計價單位
**廠商資訊**：只存 supplierName 欄位，不放在品名裡
**範例**：
- 勁辣雞腿排(特大)_10片*8包/箱
- 厚切牛肉堡_20片/包
- 壽司米_30KG/袋

**別名（aliases）**：
- 外部系統名稱（大麥品名、CA表原始名）存 os_products.aliases JSON陣列
- 匯入時先比對 name，找不到比對 aliases，都找不到建新品項（標橘色⚠待確認）
- 統一別名後採購系統可自動帶入成本

**兩層分類**：
- 第一層（category1）：冷凍食材/韓國食材/乾貨類/冷藏類/麵包/茶包泡粉/醬粉類/包材類/清潔類/公司配送食品/公司配送訂製/公司配送雜貨/生鮮自購
- 第二層（category2）：由 os_product_categories 表管理，後台可新增修改

## 五、庫存管理邏輯

### 範圍：只管 B類（宇聯自配）的庫存

| 動作 | 觸發時機 | 效果 |
|------|---------|------|
| 庫存增加 | 叫貨單 status → received（B類） | os_inventory.currentQty +，寫 os_inventory_logs(in) |
| 庫存減少 | 配送派車單簽收（B類品項） | os_inventory.currentQty -，寫 os_inventory_logs(out) |
| 手動調整 | 後台 OSInventory 調整按鈕 | 必填原因，寫 os_inventory_logs(adjust) |
| 盤點 | 後台盤點功能 | 寫 os_inventory_logs(count)，更新 lastCountDate |

### 庫存基準點
- 2026-03-31 全宇聯資產盤點（4/19取得，匯入後設為初始庫存）
- 匯入後再匯入 4/1後的歷史大麥訂單（B類觸發庫存累加）
- 差異由手動調整修正（寫原因進 os_audit_logs）

### 安全庫存
- 各品項可設 safetyQty 警戒值
- currentQty < safetyQty → 庫存管理頁橘色「低庫存」badge
- currentQty = 0 → 紅色「缺貨」badge
- 側邊欄顯示低庫存品項數量 badge

### A類庫存說明
- A類直送廠商宇聯不記庫存（無庫存壓力）
- 少數例外（如漲價前囤貨）用手動調整處理

## 六、帳務流程

### 應付帳款（宇聯付給廠商）

**自動化流程：**
叫貨單 received → 月底執行「自動匯總本月帳款」
→ os_payables 按廠商各建一筆（每廠商每月一筆）
→ 會計確認金額後匯款
→ 登記付款（輸入銀行摘要）→ 對應銀行明細

**退佣計算（月底執行）：**
- 廣弘：叫貨批價 ÷ 1.12 = 未稅，差額 = 退佣，匯入公司帳（扣30元手續費）
- 伯享：（系統銷價 - 宇聯成本）× 數量 = 退佣，匯入公司帳（金額人工確認）
- 韓濟：同伯享算法，退佣直接抵當月貨款（付現金，os_payables.rebateAmount 欄位）

**退佣規則存 os_rebate_rules 表，後台可修改，不寫死程式碼。**

### 銀行明細對帳

1. 每月匯入台新銀行 Excel 明細（格式：序號/日期/摘要/支出/收入/餘額/備註/備註2/備註3/說明）
2. 系統自動比對（matchScore 信心分數）：
   - 備註含廠商名 → 建議對應 os_payables
   - 備註含加盟店名 → 建議對應 os_franchisee_payments
   - 信心分數 ≥ 50 才顯示建議
3. **人工確認後才標記完成（不自動確認，防弊）**
4. 分類標記：進貨/費用/薪資/其他

### 應收帳款（加盟主付給宇聯）

**自動產生：**
- 配送派車單簽收 → os_franchisee_payments（週結）
- 提貨調貨月底結算 → os_franchisee_payments（月結）

**加盟主週結：**
每週加盟主匯款，目前用 ASANA 追蹤、Excel 銀行明細備查。
系統對應到 os_franchisee_payments，銀行明細匯入後系統建議比對。

### 提貨調貨（宇聯公司貨送給門市）

宇聯 OEM/ODM 品項送給各直營/加盟門市，門市每月應付宇聯貨款。

- 每月記錄：日期、門市、品名、數量、單位、單價
- 月底執行「月底結算」→ 自動產生 os_franchisee_payments
- 門市應付金額可從「加盟主帳款」頁確認

### 雙月對發票
雙月整理發票給事務所。這個目前系統不支援，手動處理。

## 七、Make HTTP模組設定（模組25）

- URL：https://ordersome.com.tw/api/procurement/import
- Method：POST，Body input method：JSON string
- Body content：`{"secret":"ordersome-sync-2026","orderDate":"{{formatDate(now; "YYYY-MM-DD")}}","itemsCsv":"{{28.text}}"}`

Tools[28] Text aggregator 設定：
- Source Module：Google Sheets [10]
- Row separator：Other，Separator：;;
- Text：`{{10.`1`}}|{{replace(10.`4`; "來點什麼-"; "")}}|{{10.`7`}}|{{10.`8`}}|{{10.`9`}}|{{if(10.`13`; 10.`13`; "常溫")}}`

Google Sheets 模組10 欄位對應：
- 0=訂單號, 1=供應商, 4=門市(含來點什麼-前綴), 7=商品名稱, 8=單位, 9=數量, 13=溫層

## 八、叫貨單狀態流程
pending（待處理）
↓「傳送訂單給廠商」
sent（已傳送）
↓「廠商已確認收單」
confirmed（已確認）
↓「確認收貨入庫」
received（已到貨）→ B類自動觸發庫存入庫 + 帳款累計

- cancelled（已作廢）：manager 以上可操作，必填原因，寫 os_audit_logs
- 刪除：僅 super_admin，必填原因，寫 os_audit_logs + 快照

**撿貨單：**
- 只列印 sent 和 confirmed 狀態的 B類叫貨單
- A4直式，按廠商分區（宇聯第一區、宇聯_配合第二區）
- 列印後標記 printedAt，避免重複列印混淆
- 每週一建議執行一次

## 九、系統模組連動全圖
大麥採購 Excel / Make 自動推送
↓
os_procurement_orders（叫貨單主表）
os_procurement_items（品項明細）
↓ received（B類）
os_inventory（庫存主表）          os_payables（應付帳款）
os_inventory_logs（異動記錄）      ↓ 月底計算
↓ 配送簽收（B類）         os_rebates（退佣帳款）
os_franchisee_payments（應收）          ↓
↓                        os_bank_transactions（銀行明細）
os_profit_loss（損益儀表板）            ↓ 人工確認
對帳完成
提貨調貨：
os_transfers（調貨明細）
↓ 月底結算
os_franchisee_payments（門市應付宇聯）

## 十、退佣規則（存 os_rebate_rules，後台可改）

| 廠商 | 計算類型 | 規則 | 備註 |
|------|---------|------|------|
| 廣弘 | percentage | 批價 ÷ 1.12，差額=退佣 | 匯入公司帳，扣30元手續費 |
| 伯享 | fixed_diff | 銷價-成本=退佣 | 每月人工確認金額 |
| 韓濟 | offset | 銷價-成本=退佣 | 直接抵當月貨款（付現金） |

## 十一、大永蛋品業務（tenantId=90004）

- 聯絡人：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- 業務：雞蛋批發，台中，約28個行政區，D1/D2路線
- LIFF ID現用：2009700774-rWyJ27md（測試用，等蛋博建正式LIFF）
- 大永 ERP 功能獨立，不與來點什麼 ERP 混用

## 十二、未來計畫（按優先順序）

**P1 本週內：**
- 3/31 盤點資料匯入庫存（4/19 從採購取得後執行）

**P2 之後：**
- 全系統 RWD 審查（所有頁面手機版）
- 退佣自動計算上線（伯享金額確認後）
- BOM 物料清單（os_bom，開工條件：採購資料穩定 + os_products 成本準確）
- 銀行明細歷史資料批次匯入

**P3 等外部配合：**
- 大永 LIFF 正式 liffId（等蛋博）
- 積欠款 LINE 推播（cron 基礎已建）

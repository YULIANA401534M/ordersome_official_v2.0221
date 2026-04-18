# BUSINESS.md — 宇聯國際業務邏輯與工作流程
> 給大腦讀的。手腳只讀 CLAUDE.md。
> 最後更新：2026-04-18

## 一、公司結構
宇聯國際文化餐飲有限公司
- 來點什麼（tenantId=1）：早午餐連鎖，13間門市（直營+加盟）
- 碗碗俠 BowlHero（開發中）：目標2026年6-7月首店
- 大永蛋品（tenantId=90004）：付費SaaS客戶，月租3,000-8,000

## 二、來點什麼採購主流程
加盟主/直營店長 → 大麥採購系統叫貨（合約剩約一年）
↓
大麥自動寄 Excel 到 ordersome2020@gmail.com
一封 Email = 一間門市，可含多個供應商
↓
Make 統整工作流（每天14:55自動）：
Gmail[1] 搜尋標籤 → Gmail[3] 取信 → Router[15]
→ Text parser[2] → HTTP[6] 下載 Excel
→ Google Drive[8] 上傳 → Google Sheets[10] 讀取
→ Google Sheets[13] 寫入統整總表
→ Tools[28] Text aggregator（;; 分隔，| 欄位分隔）
→ HTTP[25] POST 到 /api/procurement/import
→ Gmail[14] 標記已處理
↓
OrderSome 後端按 supplierName 分組建叫貨單

## 三、供應商分兩類（核心邏輯）

A類：直送廠商（廣弘、凱田、韓濟、米谷、裕展、美食家等）
- 廠商直接送到各門市，宇聯沒有庫存壓力
- sourceType = 'damai_import'
- 系統只需記錄叫貨單和帳款

B類：OEM/ODM自配廠商（宇聯、宇聯_配合、立墩、三柳、凱蒂等）
- 廠商送到宇聯倉庫，宇聯自己配送
- sourceType = 'damai_yulian'
- YULIAN_DELIVERY_SUPPLIERS = ['宇聯', '宇聯_配合']
- 宇聯有庫存壓力，需要管庫存數量和警戒值

## 四、Make HTTP模組設定（模組25）

- URL：https://ordersome.com.tw/api/procurement/import
- Method：POST，Body input method：JSON string
- Body content：
  {"secret":"ordersome-sync-2026","orderDate":"{{formatDate(now; "YYYY-MM-DD")}}","itemsCsv":"{{28.text}}"}

Tools[28] Text aggregator 設定：
- Source Module：Google Sheets [10]
- Row separator：Other，Separator：;;
- Text：{{10.`1`}}|{{replace(10.`4`; "來點什麼-"; "")}}|{{10.`7`}}|{{10.`8`}}|{{10.`9`}}|{{if(10.`13`; 10.`13`; "常溫")}}

Google Sheets 模組10 欄位對應：
- 0=訂單號, 1=供應商, 4=門市(含來點什麼-前綴), 7=商品名稱
- 8=單位, 9=數量, 13=溫層, 14=叫貨時間

## 五、REST endpoint 規格

POST /api/procurement/import
- 接收：secret, orderDate, itemsCsv（;; 分隔，| 欄位分隔）
- itemsCsv 欄位順序：supplierName|storeName|productName|unit|quantity|temperature
- 按 supplierName 分組，每廠商各建一張叫貨單
- A類 sourceType='damai_import'，B類 sourceType='damai_yulian'
- 重複單號略過，orderNo 自動產生 DM-YYYYMMDD-xxxxxx

## 六、帳務聯動邏輯

應收帳款（加盟主）：
- 配送管理派車單簽收後自動寫入 os_franchisee_payments
- /dashboard/franchisee-payments 可查看

應付帳款（外部廠商）：
- 尚未建立，需另外開發 /dashboard/accounting

退佣規則：
- 廣弘：10.71%（含稅價反推）
- 伯享：固定差價
- 韓濟：抵貨款
- 以上目前手動月結，未來自動化

## 七、庫存管理邏輯（尚未完成）

只管 B類（宇聯自配）的庫存：
- 叫貨單收貨（status→received）→ os_inventory 庫存增加
- 配送管理簽收（status→signed）→ os_inventory 庫存減少
- 警戒值：低於設定數量時通知補貨（尚未實作）
- 退貨機制：尚未實作

## 八、大永蛋品業務

- 聯絡人：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- 業務：雞蛋批發，台中，約28個行政區，D1/D2路線
- tenantId = 90004
- LIFF ID現用：2009700774-rWyJ27md（測試用，等蛋博建正式LIFF）

## 九、未來計畫（按優先順序）

1. 今天：sourceType ENUM 修好，測試兩封信完整跑通
2. 本週：B類叫貨單列印撿貨單功能
3. 本週：到貨確認自動更新 os_inventory（B類）
4. 本週：os_inventory 庫存警戒機制
5. 下週：os_products 填入真實品項成本資料
6. 下週：應付帳款 AP 建立（外部廠商）
7. 月底：月底自動損益表優化

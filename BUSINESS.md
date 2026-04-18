# BUSINESS.md — 宇聯國際業務邏輯與工作流程

> 給大腦讀的。手腳只讀 CLAUDE.md。
> 最後更新：2026-04-18

## 一、公司結構
宇聯國際文化餐飲有限公司
- 來點什麼（tenantId=1）：早午餐連鎖，現有約13間門市（直營+加盟）
- 碗碗俠 BowlHero（開發中）：中式快餐，目標2026年6-7月首店開幕
- 大永蛋品（tenantId=90004）：付費客戶，雞蛋批發配送

## 二、採購業務流程（來點什麼）

### 供應商分兩類

A類：直送廠商（廣弘、凱田、韓濟、米谷、裕展、美食家等）
- 宇聯幫門市叫貨，廠商直接送到各門市
- 宇聯沒有庫存壓力
- 系統只需記錄叫貨單和帳款
- sourceType = 'damai_import'

B類：OEM/ODM自配廠商（宇聯、宇聯_配合、立墩、三柳、凱蒂等）
- 廠商把成品送到宇聯倉庫
- 宇聯自己配送到各門市
- 宇聯有庫存壓力，需要管庫存數量和警戒值
- sourceType = 'damai_yulian'
- YULIAN_DELIVERY_SUPPLIERS = ['宇聯', '宇聯_配合']

### 採購流程
加盟主/直營門市 → 大麥採購系統叫貨
↓
大麥系統自動寄 Excel 到 ordersome2020@gmail.com
一封 Email = 一間門市，包含多個供應商的品項
↓
Make 統整工作流（每天14:55自動）：
Gmail 搜尋標籤[MAKE]-採購待處理訂單
→ 取得 Email
→ Router（上路線）→ Text parser → HTTP下載Excel → Google Drive上傳
→ Google Sheets讀取 → Google Sheets寫入統整總表
→ Text aggregator（模組28）收集所有品項
→ HTTP POST到 https://ordersome.com.tw/api/procurement/import
→ Gmail標記已處理
↓
OrderSome 後端：

按 supplierName 分組
每個廠商各建一張叫貨單
A類廠商：sourceType='damai_import'
B類廠商：sourceType='damai_yulian'
↓
Make 派發工作流（另一個Scenario）：
Google Sheets讀今日資料 → Text aggregator → Router依廠商分流 → LINE Push給各廠商


### Make HTTP模組設定（統整工作流模組25）
- URL：https://ordersome.com.tw/api/procurement/import
- Method：POST
- Body input method：JSON string
- Body content：
  {"secret":"ordersome-sync-2026","orderDate":"{{formatDate(now; "YYYY-MM-DD")}}","itemsCsv":"{{28.text}}"}
- Text aggregator（模組28）Separator：;;
- Text aggregator Text欄位：
  {{10.`1`}}|{{replace(10.`4`; "來點什麼-"; "")}}|{{10.`7`}}|{{10.`8`}}|{{10.`9`}}|{{if(10.`13`; 10.`13`; "常溫")}}

### Google Sheets模組10欄位對應
- 0=訂單號, 1=供應商, 4=門市(含來點什麼-前綴), 7=商品名稱, 8=單位, 9=數量, 13=溫層, 14=叫貨時間

## 三、庫存管理邏輯

只管 B類（宇聯自配）的庫存：
- 叫貨單到貨（status→received）→ 庫存增加
- 配送管理簽收（status→signed）→ 庫存減少
- A類廠商直送，宇聯不管庫存

庫存警戒：低於設定數量時通知補貨（尚未實作）
退貨機制：尚未實作

## 四、帳務邏輯

應收帳款：配送管理簽收後自動產生（已實作）
應付帳款：外部供應商帳款（尚未建立）
退佣：廣弘10.71%、伯享固定差價、韓濟抵貨款（手動月結）
損益表：每月手動查看 /dashboard/profit-loss

## 五、大永蛋品業務
- 聯絡人：洪靖博（蛋博），0980190857，dayoneegg@gmail.com
- 業務：雞蛋批發配送，台中，約28個行政區，D1/D2路線
- tenantId = 90004
- LIFF ID現用：2009700774-rWyJ27md（測試用，等蛋博建正式LIFF）
- 積欠款LINE推播：cron基礎已建，等蛋博確認設定值

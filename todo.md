# 宇聯國際文化餐飲有限公司 - 數位平台開發 TODO

## 資料庫結構
- [x] 商品資料表 (products)
- [x] 商品分類資料表 (categories)
- [x] 購物車資料表 (cart_items)
- [x] 訂單資料表 (orders)
- [x] 訂單明細資料表 (order_items)
- [x] 門市據點資料表 (stores)
- [x] 最新消息資料表 (news)

## 「來點什麼」品牌形象官網
- [x] 品牌首頁設計
- [x] 品牌故事頁面
- [x] 門市據點展示（含 Google Maps）
- [x] 菜單介紹頁面
- [x] 最新消息頁面
- [x] 聯絡我們頁面
- [x] 加盟諮詢專區頁面

## 集團總部官網（宇聯國際文化餐飲有限公司）
- [x] 集團首頁設計
- [x] 企業介紹頁面
- [x] 品牌旗下事業頁面
- [x] 企業文化頁面
- [x] 新聞中心頁面
- [x] 加盟資訊頁面
- [x] 聯絡我們頁面

## 商品展示系統
- [x] 商品分類頁面
- [x] 商品列表頁面
- [x] 商品詳情頁面
- [x] 商品圖片展示
- [x] 價格與規格說明

## 購物車功能
- [x] 加入購物車功能
- [x] 購物車清單頁面
- [x] 數量調整功能
- [x] 小計計算功能
- [x] 結帳流程頁面

## 訂單管理系統
- [x] 訂單建立功能
- [x] 訂單狀態追蹤
- [x] 訂單歷史查詢
- [x] 訂單詳情顯示

## 台灣金流串接
- [x] 綠界 ECPay 整合（測試模式）
- [x] 信用卡付款支援
- [x] ATM 轉帳支援
- [x] 超商代碼支援
- [x] 付款回調處理
- [x] 正式環境金鑰設定（待用戶提供）

## 會員系統
- [x] Manus OAuth 登入整合
- [x] 個人資料管理頁面
- [x] 訂單歷史查詢頁面

## 後台管理介面
- [x] 商品管理（新增、編輯、刪除）
- [x] 訂單管理頁面
- [x] 訂單狀態更新功能
- [x] 分類管理頁面
- [x] 後台儀表板

## 其他功能
- [x] 響應式設計優化
- [x] SEO 優化設定
- [x] 新訂單通知功能
- [x] Google Maps 門市據點整合

## 設計風格參考
- [x] 參考韓國 Mega MGC Coffee 網站風格
- [x] 「來點什麼」品牌配色：黃色、白色、灰色
- [x] 整合用戶提供的 LOGO 檔案
- [x] 整合社群平台連結（YouTube, Facebook, Instagram, Linktree）


## 新增任務
- [x] 匯入實際門市據點資料（從 Excel）- 12 間門市
- [x] 設定綠界金流正式環境
- [x] 修復購物車結帳流程「購物車是空的」錯誤
- [x] 壓縮網站圖片以提升載入速度 (621MB → 9.2MB)
- [x] 修復結帳時價格資料類型錯誤 (string → number)
- [x] 修復會員中心 404 錯誤
- [x] 整合綠界金流跳轉功能
- [x] 修復會員訂單查詢功能
- [x] 更新宇聯國際頁面的聯絡資訊和英文名稱
- [x] 修復 /brand 頁面的 SEO 標題長度
- [x] 統一所有頁面的分頁標題為「宇聯國際文化餐飲有限公司」
- [x] 建立 Google Search Console 驗證檔案
- [x] 建立 Sitemap.xml
- [x] 分析築間官網設計亮點
- [x] 設計宇聯 LOGO 漸變動畫
- [x] 優化首頁視覺設計和排版
- [x] 使用大面積色塊設計提升視覺衝擊力
- [x] 善用 JF Kamabit 字體進行大字排版
- [x] 增加質感漸層和陰影效果
- [x] 優化留白和呼吸空間
- [x] 重新設計品牌首頁 Hero 區
- [x] 從 Google Drive 下載餐點照片（照片｜客顯輪播圖）
- [x] 從 Google Drive 下載門市環境照片（照片｜門市環境）
- [x] 整合餐點照片到品牌首頁菜單預覽區
- [x] 整合門市環境照片到品牌首頁和門市據點頁面
- [x] 壓縮餐點照片（1-1.6MB → 57-214KB）
- [x] 壓縮門市照片（400-700KB → 60-181KB）
- [x] 尋找水墨/毛筆風格的中文字體
- [x] 更新 LOGO 開場動画字體為大氣穩重的書法字體（演示夏行楷）
- [x] 修復餐點和門市照片無法顯示的問題（移動到正確的 client/public 目錄）
- [x] 從 Google Drive【來點 LOGO】資料夾下載所有 LOGO（排除 109 資料夾）
- [x] 整理 LOGO 資源到 /home/ubuntu/logo_assets/
- [x] 準備宇聯金黑無限符號 LOGO 作為總部頁面 favicon
- [x] 準備來點什麼黃色蛋型 LOGO 作為品牌頁面 favicon
- [x] 實作動態 favicon 切換功能（根據路由自動切換）
- [x] 測試 favicon 在不同頁面的顯示效果（首頁顯示宇聯 LOGO，來點頁面顯示來點 LOGO）
- [x] 修正來點 favicon 為黃色底版本（重新轉換為多尺寸 ICO）
- [x] 修復 LogoIntro 字體載入失敗問題（改用 JF Kamabit 字體）
- [x] 更換首頁來點 LOGO 為黃色底版本
- [x] 優化首頁標題：移除「歡迎來到」，使用 JF Kamabit 字體，增加字距和尺寸
- [x] 改善首頁整體排版和視覺衝擊力
- [x] 更新加盟諮詢頁面的加盟金資訊（36 萬）
- [x] 更新裝潢費用資訊（138-158 萬）
- [x] 更新加盟合約年限（三年一約）
- [x] 說明不收權利金及抽取營業額
- [x] 更新加盟諮詢頁面的聯絡資訊（電話、Email、地址）
- [x] 確認宇聯和來點什麼的聯絡資訊一致性
- [x] 更正所有頁面的電話號碼為 (04)-2437-9666
- [x] 更換首頁漂浮蛋形 LOGO 為黃色底版本
- [x] 更換導航列左上角 LOGO 為黃色底版本（已是黃色底）
- [x] 更換 Footer 左下角 LOGO 為黃色底版本（移除 brightness 濾鏡）
- [x] 品牌故事頁面：生成「我們的理念」右側 AI 圖片（韓式飯捲、台式蛋餅、鐵板麵）
- [x] 品牌故事頁面：重新設計核心價值三個 ICON（粗重線條、力量感、穩重感）
- [x] 聯絡我們頁面：更新左側聯絡資訊（電話、Email、地址）
- [x] 宇聯首頁：更正英文名稱為 YULIAN International Cultural Catering Co., Ltd.
- [x] 宇聯首頁：移除左側頂部的 LOGO，直接顯示標題
- [x] 宇聯首頁：右側大方塊改為宇聯 LOGO（移除濾鏡，完整顯示金黑配色）
- [x] 宇聯加盟資訊頁面：更新「立即諮詢」的電話、Email、地址
- [x] 宇聯企業介紹頁面：修正企業故事右側 LOGO 的比例和背景質感

## 新增修正任務（2026-01-08）

- [x] 修正宇聯首頁英文公司名稱：YULIAN → YULIIAN（兩個 I）
- [x] 修正 LogoIntro 動畫英文名稱：YULIAN → YULIIAN
- [x] 優化宇聯首頁右側 LOGO 視覺：使用水墨筆觸風格 LOGO，加入金黃光暈效果
- [x] 整合 3D 金屬質感 LOGO 到宇聯首頁右側
- [x] 優化金色背光效果與深色背景的融合
- [x] 修改宇聯首頁統計數據：直營門市 10+ → 5+，加盟門市 5+ → 10+
- [x] 移除宇聯所有頁面右下角的隱私權政策和服務條款連結
- [x] 更新企業介紹頁面經營團隊名字和職位
- [x] 實作頁面切換時自動滾動到頂部功能（平滑滾動效果）
- [x] 更新網站 OG 圖片為宇聯水墨 LOGO（修正通訊軟體分享預覽）
- [x] 更新宇聯頁尾左側 LOGO 為水墨風格（移除空白方格）
- [x] 更新來點什麼品牌頁面服務顧客數字：10,000+ → 1,200,000+
- [x] 修正來點什麼品牌頁面導航列 LOGO 顯示灰色問題（更換為彩色版本）
- [x] 更新網站開場 LOGO 動畫為淡黃色背景金色 YULIAN 圖片

## 全面更新宇聯 LOGO（2026-01-08）

- [x] 複製所有新 LOGO 檔案到 public/logos 目錄
- [x] 更新導航列 LOGO 為橫式版本（宇聯LOGO-05.png）
- [x] 更新頁尾 LOGO 為橫式版本（宇聯LOGO-05.png）
- [x] 更新開場動畫為深色背景版本（iyHZSQGHRkyjqhYM.png）
- [x] 更新 OG 圖片為方形版本（宇聯LOGO.png）
- [x] 更新首頁右側大圖為中英文完整版（宇聯LOGO-04.png）

## 修正視覺問題（2026-01-08）

- [x] 修正開場動畫：改為淡黃色背景滿版顯示（移除周圍留白）
- [x] 優化首頁右側 LOGO 視覺對比度（加強白色光暈和陰影效果）

## 緊急修正任務（2026-01-12）

- [x] 上傳響應式開場動畫圖片（桌面版 1920x1080 + 手機版 1080x1920）
- [x] 實作開場動畫響應式切換功能（桌面顯示橫向圖，手機顯示直立圖）
- [x] 修復導航列左上角 LOGO 圖片無法顯示的問題
- [x] 全站更正英文名稱：YULIIAN → YULIAN（移除多餘的 I）
- [x] 檢查所有使用英文名稱的檔案和組件
- [x] 測試桌面和手機版開場動畫顯示效果

## LOGO 圖片路徑修復（2026-01-12）

- [x] 發現導航列和頁尾 LOGO 圖片無法顯示（中文檔名問題）
- [x] 將中文檔名 LOGO 複製為英文檔名（yulian-logo-horizontal.png、yulian-logo-full.png）
- [x] 更新 CorporateHeader.tsx LOGO 路徑
- [x] 更新 CorporateFooter.tsx LOGO 路徑
- [x] 測試導航列和頁尾 LOGO 顯示效果

## 視覺編輯器變更（2026-01-12）

- [x] 更新首頁宇聯國際卡片描述文字：「集團總部 · 企業資訊 · 線上商城」→「集團總部 · 企業資訊 · 線上商城、加盟主專區」

## 混合式會員與認證系統開發（2026-01-12）

### 資料庫架構擴充
- [x] 擴充 users 表新增角色相關欄位（role, full_name, phone, shipping_address, avatar_url）
- [x] 建立資料庫遷移腳本
- [x] 執行 db:push 更新資料庫

### 認證流程實作
- [x] 保留現有 Google OAuth 登入（給一般顧客使用）
- [x] 新增 Email/Password 登入功能（給加盟主和管理員使用）
- [x] 建立登入頁面 UI（雙重登入選項）

### 角色權限控制
- [x] 建立 middleware 檢查用戶角色
- [x] 保護 /dashboard/franchise 路由（僅 franchisee 和 admin）
- [x] 保護 /profile 路由（所有登入用戶）
- [x] 建立 403 禁止訪問頁面（在 FranchiseDashboard 中實作）

### 前端頁面開發
- [x] 登入頁面：Google OAuth 按鈕 + 加盟主登入切換
- [x] 個人資料頁面：編輯 full_name, phone, shipping_address
- [x] 加盟主專區首頁（/dashboard/franchise）
- [x] 管理員專區首頁（使用現有 /admin 路由）

### 測試與驗證
- [x] 測試 Google OAuth 登入流程
- [x] 測試 Email/Password 登入流程
- [x] 測試角色權限控制（customer 無法訪問 franchise dashboard）
- [x] 測試個人資料更新功能

## 登入流程修正（2026-01-12）

- [x] 檢查導航列登入按鈕的實作方式（目前導向 Manus 內建 OAuth）
- [x] 修改登入頁面整合 Manus OAuth 和自訂 Email/Password 登入
- [x] 更新導航列登入按鈕導向自訂 /login 頁面
- [x] 測試完整登入流程（Google OAuth + Email/Password）

## 忘記密碼功能開發（2026-01-12）

### 資料庫架構
- [x] 擴充 users 表新增 passwordResetToken 和 passwordResetExpires 欄位
- [x] 執行資料庫遷移

### 後端 API
- [x] 實作 requestPasswordReset endpoint（生成 token 並發送郵件）
- [x] 實作 verifyResetToken endpoint（驗證 token 有效性）
- [x] 實作 resetPassword endpoint（更新密碼）
- [x] 設定 token 過期時間（1 小時）

### Email 發送
- [ ] 整合 Manus 內建通知 API 或使用 Nodemailer
- [ ] 設計密碼重設郵件模板（含重設連結）

### 前端頁面
- [x] 在登入頁面新增「忘記密碼？」連結
- [x] 建立密碼重設請求頁面（/forgot-password）
- [x] 建立密碼重設表單頁面（/reset-password/:token）
- [x] 新增成功/失敗提示訊息

### 測試與驗證
- [ ] 測試完整密碼重設流程
- [ ] 測試 token 過期處理
- [ ] 測試無效 token 處理

## 企業級角色管理系統擴充（2026-01-19）

### STEP 1: 資料庫架構更新
- [x] 擴充 role 欄位支援五種角色：super_admin, manager, franchisee, staff, customer
- [x] 新增 birthday (date) 欄位
- [x] 新增 gender (text) 欄位
- [x] 新增 accumulatedSpending (numeric, default 0) 欄位
- [x] 新增 storeId (text, nullable) 欄位
- [x] 新增 internalContact (text, nullable) 欄位
- [x] 新增 department (text, nullable) 欄位
- [x] 新增 status (text, default 'active') 欄位
- [x] 執行資料庫遷移

### STEP 2: 建立超級管理員帳號
- [x] 編寫 seed script 建立 super_admin 帳號
- [x] Email: barmyhy1688@gmail.com
- [x] Password: Aa123456
- [x] Role: super_admin
- [x] Name: Boss Leo
- [x] Phone: 0900000000
- [x] 執行 seed script

### STEP 3: 強制填寫電話號碼邏輯（Marketing Trap）
- [ ] 建立 /profile/complete 頁面
- [ ] 實作登入後檢查：role=customer 且 phone 為空
- [ ] 強制導向 /profile/complete 直到填寫完成
- [ ] 表單欄位：phone, shipping_address
- [ ] 防止用戶跳過此步驟

### STEP 4: 管理員後台
- [ ] 建立 /dashboard/admin 頁面
- [ ] 顯示所有用戶列表（含角色、狀態）
- [ ] 新增「建立加盟主帳號」按鈕和表單
- [ ] 實作建立加盟主 API endpoint

### STEP 5: 員工專區
- [ ] 建立 /dashboard/staff 頁面
- [ ] 建立設備維修表單（機器名稱、問題描述）
- [ ] 建立 equipment_repairs 資料表
- [ ] 實作提交維修請求 API

### STEP 6: 擴充加盟主專區
- [ ] 在加盟主專區新增 SOP 文件連結區塊
- [ ] 在加盟主專區新增門市資料顯示
- [ ] 根據 storeId 顯示對應門市資訊

### STEP 7: 測試與驗證
- [ ] 測試超級管理員登入（barmyhy1688@gmail.com）
- [ ] 測試 Google OAuth 登入後的電話號碼強制填寫
- [ ] 測試角色導向邏輯（5 種角色）
- [ ] 測試管理員建立加盟主帳號功能
- [ ] 測試員工提交設備維修表單

## 緊急修復：Email/Password 登入功能（2026-01-19）

- [x] 檢查登入 API 錯誤日誌
- [x] 檢查 loginWithPassword mutation 實作
- [x] 檢查登入後的 session 建立邏輯
- [x] 修復登入後卡在載入畫面的問題
- [x] 修復登入後跳轉到 OAuth 選擇頁面的問題
- [x] 測試超級管理員登入流程
- [x] 測試加盟主登入流程（使用 super_admin 帳號測試）

## 媒體帝國與品牌霸權升級（2026-01-19）
### 資料庫升級（Permissions & Posts）

- [x] 擴充 users 表新增 permissions 欄位（JSON 或 Text Array）
- [x] 建立 posts 表（id, title, slug, excerpt, content, cover_image, status, author_id, published_at）
- [x] 執行資料庫遷移

### 管理員後台用戶管理 UI（/dashboard/admin/users）

- [x] 建立用戶列表頁面（顯示 Name, Email, Role, Status, Permissions）
- [x] 實作角色篩選功能
- [x] 建立「編輯用戶」Modal
- [x] 實作角色變更功能
- [x] 實作權限勾選框（view_finance, manage_users, manage_franchise, publish_content）
- [x] 實作一鍵重設密碼功能（重設為 YuLian888!）

### CMS 內容管理系統

**後台編輯器（/dashboard/content）**
- [x] 建立文章列表頁面
- [x] 建立文章編輯器（Rich Text Editor）
- [x] 實作文章建立/編輯/刪除功能
- [x] 實作文章狀態管理（draft/published）
- [x] 權限控制：僅 super_admin 或具有 publish_content 權限的用戶可訪問

**前台新聞頁面（/news）**
- [x] 建立新聞列表頁面（Grid 佈局）
- [x] 建立文章詳情頁面（/news/[slug]）
- [x] 實作文章封面圖片顯示
- [x] 實作文章發布時間顯示

### SEO/GEO 品牌定位策略

**全域 Metadata（layout.tsx）**
- [x] 設定 Title Template："%s | 來點什麼 (Ordersome) - 台中必吃台韓式早午餐 & 加盟首選"
- [x] 設定 Default Description：來點什麼品牌定位描述
- [x] 設定 Open Graph 和 Twitter Card metadata

**JSON-LD 結構化資料**
- [x] 首頁：注入 Organization + LocalBusiness Schema
- [ ] 加盟頁面：注入 Product Schema（加盟方案）
- [ ] 新聞文章頁面：注入 Article Schema

**語義結構優化**
- [x] 首頁使用 <h1> 標籤：「全台最好吃的台韓式早午餐 - 來點什麼」
- [ ] 使用 <h2> 標籤：加盟優勢、熱門菜單等區塊

### 測試與驗證

- [x] 測試用戶權限管理功能（admin.test.ts - 5 個測試全部通過）
- [x] 測試 CMS 文章建立和發布流程（content.test.ts - 6 個測試全部通過）
- [x] 測試前台新聞頁面顯示（已建立 /news 和 /news/:slug 路由）
- [x] 驗證 SEO metadata 和 JSON-LD 正確性（已注入 Organization + Restaurant Schema）
- [ ] 使用 Google Rich Results Test 驗證結構化資料
## 會員中心後台入口優化（2026-01-19）

- [x] 在會員中心頁面新增「後台管理」區塊
- [x] 根據用戶角色顯示對應的後台入口按鈕
  - super_admin / manager：顯示「管理員後台」按鈕（導向 /dashboard/admin/users）
  - franchisee：顯示「加盟主專區」按鈕（導向 /dashboard/franchise）
  - staff：顯示「員工專區」按鈕（導向 /dashboard/staff）
  - customer：不顯示後台按鈕
  - 具有 publish_content 權限：顯示「內容管理」按鈕
- [x] 測試不同角色的後台入口顯示邏輯

## Analytics 基礎設施與管理員快捷連結（2026-01-19）

- [x] 建立 Analytics.tsx 組件（GA4 追蹤腳本）
- [x] 將 Analytics 組件注入到 App.tsx
- [x] 在 index.html 新增 Google Search Console 驗證標籤佔位符
- [x] 在管理員後台新增「流量與行銷情報」區塊
- [x] 新增 GA4 快捷連結按鈕（導向 Google Analytics）
- [x] 新增 Search Console 快捷連結按鈕（導向 Google Search Console）
- [x] 測試 GA4 追蹤功能

## GA4 登入事件追蹤（2026-01-19）

- [x] 建立 GA4 事件追蹤輔助函數（trackEvent）
- [x] 在 Analytics.tsx 中匯出 trackEvent 函數
- [x] 在登入成功後觸發 'login' 事件
  - Email 登入：在 Login.tsx 中觸發
  - OAuth 登入：在 Profile.tsx 中觸發（首次載入用戶資料時）
- [x] 附上 user_role 和 permissions 參數
- [x] 測試事件追蹤功能

## 修正用戶角色設定（2026-01-19）

- [ ] 檢查用戶 barmyhy1688@gmail.com 的角色
- [ ] 將該用戶角色設定為 super_admin
- [ ] 測試後台入口按鈕是否正確顯示

## 修正後台入口按鈕消失問題（2026-01-19）

- [ ] 移除 Profile.tsx 中的 sessionStorage login_tracked 邏輯
- [ ] 確保後台入口按鈕始終根據用戶角色顯示
- [ ] 測試多次進出會員中心頁面，確認按鈕不會消失

## 修正前端後台入口按鈕顯示邏輯（2026-01-19）

- [x] 檢查 Profile.tsx 中的條件判斷邏輯
- [x] 確保 user.permissions 正確解析（JSON 字串 vs Array）
- [x] 新增 hasPermission 輔助函數
- [x] 測試 super_admin 能看到所有按鈕
- [ ] 移除不必要的 console.log

## 權限管理頁面（2026-01-19）

- [x] 建立權限管理頁面 UI（/dashboard/admin/permissions）
- [x] 顯示所有用戶的權限列表
- [x] 實作權限編輯 Modal（勾選框）
- [x] 實作按角色篩選功能
- [x] 在管理員後台新增「權限管理」導航連結
- [x] 在 App.tsx 中註冊路由
- [x] 測試權限更新功能（頁面正常顯示）

## 建立測試帳號和擴充用戶管理（2026-01-19）

- [x] 建立測試帳號到資料庫（admin, manager, franchisee, staff, customer）
- [x] 為測試帳號設定密碼 hash（YuLian888!）
- [x] 在用戶管理頁面新增「新增用戶」按鈕和 Modal
- [x] 實作新增用戶功能（設定所有欄位）
- [x] 擴充編輯用戶 Modal（包含所有可編輯欄位）
- [x] 新增刪除用戶功能（帶確認對話框）
- [x] 新增後端 API：createUser, deleteUser
- [x] 測試完整的 CRUD 功能（頁面正常顯示）

## 後台導航系統改進（2026-01-19）

- [x] 在網站右上角導航列新增「後台」按鈕（根據用戶角色顯示）
  - CorporateHeader（宇聯國際官網）
  - BrandHeader（來點什麼官網）
- [x] 建立後台側邊欄導航組件（AdminDashboardLayout）
- [x] 新增管理員導航選項（用戶管理、權限管理、內容管理、流量分析）
- [ ] 新增加盟主導航選項（門市管理、SOP 文件）
- [ ] 新增員工導航選項（設備維修、工作表單）
- [x] 將管理員後台頁面套用新的導航組件（AdminUsers, AdminPermissions）
- [x] 測試導航功能（伺服器正常運行）

## 動態權限更新與專屬 Dashboard Layout（2026-01-19）

### 動態權限更新機制
- [x] 修改 AdminDashboardLayout 根據 user.permissions 動態顯示導航選項
- [x] 在 AdminUsers 和 AdminPermissions 頁面的 mutation 成功後刷新用戶資料
- [ ] 測試權限修改後導航即時更新

### 加盟主專屬 Dashboard Layout
- [x] 建立 FranchiseeDashboardLayout 組件
- [x] 新增加盟主導航選項（門市管理、SOP 文件、營運報表、庫存管理）
- [x] 建立加盟主後台首頁（/dashboard/franchise）
- [x] 在 App.tsx 中註冊路由

### 員工專屬 Dashboard Layout
- [x] 建立 StaffDashboardLayout 組件
- [x] 新增員工導航選項（設備維修、工作表單、排班系統、公告事項）
- [x] 建立員工後台首頁（/dashboard/staff）
- [x] 在 App.tsx 中註冊路由

### 測試與整合
- [x] 測試不同角色的後台導航顯示（伺服器正常運行）
- [x] 測試權限動態更新功能（已實作 invalidateQueries）
- [ ] 儲存 checkpoint

## 2026 加盟策略報告實作（2026-01-19）

### 首頁內容改版
- [x] 更新 Hero Section H1 標題（台中逢甲早午餐加盟首選 | 台韓混血．雙時段營收．深夜食堂）
- [x] 更新 Hero Section 副標題（不僅是早餐店，更是您的全時段獲利夥伴）
- [x] 更新 CTA 按鈕文字（查看加盟方案 (免權利金)）
- [x] 新增 3 個 Value Proposition Cards（台韓混血、雙時段獲利、智能 SOP）

##### 加盟頁面 FAQ 區塊
- [x] 建立 FAQ Accordion 組件（已存在）
- [x] 新增 3 個防禦性 FAQ 問題和答案
- [x] 整合到加盟頁面（/brand/franchise）

### 部落格內容種子
- [x] 確認 posts 表結構（id, title, slug, status, publishedAt, content, excerpt, coverImage, authorId）
- [x] 新增 5 篇草稿文章到 posts 表（2026 加盟殘酷真相、開店成本試算、缺工救星、營收翻倍術、逢甲讀書餐廳）

### GEO 結構化資料
- [x] 在 index.html 中新增 Restaurant Schema（FastFoodRestaurant）
- [x] 強調 OpeningHours: Mo-Su 06:00-02:00
- [x] 新增 alternateName: 台韓混血早午餐
- [x] 新增 servesCuisine: Tai-Korean Fusion, Brunch, 深夜食堂
- [x] 新增 hasMenu 與 knowsAbout 屬性
- [ ] 強調 Cuisine: Tai-Korean Fusion, Brunch
- [ ] 設定 PriceRange: $

### 測試與驗證
- [ ] 測試首頁內容顯示
- [ ] 測試加盟頁面 FAQ 功能
- [ ] 驗證 JSON-LD 結構化資料（使用 Google Rich Results Test）
- [ ] 儲存 checkpoint

## Google Maps 重複載入問題修復（2026-01-19）

- [x] 分析 Map.tsx 腳本載入邏輯
- [x] 實作全域腳本載入狀態管理（防止重複載入）
- [x] 新增錯誤處理機制（try-catch）
- [x] 新增 google.maps API 可用性檢查
- [ ] 測試多個頁面切換時的地圖載入行為
- [ ] 儲存 checkpoint

## 文章發布系統修復與發布目標功能（2026-01-19）

- [x] 檢查 posts 表結構和現有欄位
- [x] 新增 publishTarget 欄位（corporate / brand）
- [x] 更新資料庫 schema 和執行 migration
- [x] 修改後台文章編輯器新增「發布目標」選擇器
- [x] 修改 CorporateNews 頁面的資料查詢（只顯示 publishTarget = 'corporate'）
- [x] 修改 BrandNews 頁面的資料查詢（只顯示 publishTarget = 'brand'）
- [x] 修改 News.tsx 頁面的資料查詢（只顯示 publishTarget = 'brand'）
- [x] 修復 content router 的 TypeScript 類型錯誤
- [ ] 更新現有草稿文章的 publishTarget 欄位
- [ ] 測試文章發布流程
- [ ] 儲存 checkpoint

## 文章系統優化（2026-01-19）

### 文章卡片點擊功能
- [x] 為 BrandNews.tsx 文章卡片加入 onClick 事件
- [x] 為 CorporateNews.tsx 文章卡片加入 onClick 事件
- [x] 導向文章詳情頁 `/news/{slug}`

### 文章詳情頁美化
- [x] 新增「返回新聞列表」按鈕（頂部和底部）
- [x] 優化 Typography（標題、內文、間距）
- [x] 優化封面圖片顯示（aspect-ratio, hover 效果）
- [x] 新增發布日期和作者資訊
- [x] 支援 Markdown 渲染（react-markdown + remark-gfm）

### 多目標發布功能
- [x] 重新設計資料結構（publishTarget 改為 publishTargets JSON 陣列）
- [x] 更新資料庫 schema（ALTER TABLE 新增 publishTargets JSON 欄位）
- [x] 修改後台編輯器支援多選（Checkbox 界面）
- [x] 更新 API 查詢邏輯（JSON_CONTAINS 查詢）
- [x] 支援獨立修改/刪除各官網文章（勾選/取消勾選）

### 圖片上傳功能
- [x] 整合 S3 storage helpers
- [x] 在文章編輯器新增「上傳圖片」按鈕
- [x] 實作圖片上傳 API endpoint（storage router）
- [x] 上傳後自動填入圖片 URL
- [x] 新增圖片預覽和移除功能
- [x] 檔案大小驗證（5MB 限制）
- [x] 說明 S3 儲存不佔用伺服器空間

### 測試與交付
- [ ] 測試文章卡片點擊
- [ ] 測試文章詳情頁顯示
- [ ] 測試多目標發布
- [ ] 測試圖片上傳
- [ ] 儲存 checkpoint

## 宇聯官網快捷導航列新增（2026-01-19）

- [x] 在 CorporateHome.tsx Hero Section 下方新增快捷導航列
- [x] 設計 5 個快捷入口卡片（旗下品牌、門市據點、加盟資訊、新聞中心、線上商城）
- [x] 使用 Grid 佈局和 Hover 效果（hover:shadow-lg hover:scale-105）
- [x] 新增對應的圖示（Building2, MapPin, Handshake, Newspaper, ShoppingBag）
- [ ] 測試快捷導航列顯示和點擊功能
- [ ] 儲存 checkpoint

## 未完成需求統整（待優先處理）

### 內容相關
- [ ] 閱讀並分析加盟說明 PPT 內容（排除第 28 頁）
- [ ] 提取 PPT 中的品牌故事、發展歷程、特色介紹
- [ ] 提取 PPT 中的背景底圖和視覺元素
- [ ] 整合 PPT 內容到品牌故事頁面
- [ ] 整合 PPT 內容到加盟諮詢頁面
- [ ] 使用 AI 生圖補充視覺素材

### 會員系統（Marketing Trap）
- [ ] 建立 /profile/complete 頁面
- [ ] 實作登入後檢查：role=customer 且 phone 為空
- [ ] 強制導向 /profile/complete 直到填寫完成
- [ ] 表單欄位：phone, shipping_address
- [ ] 防止用戶跳過此步驟
- [ ] 忘記密碼功能的 Email 發送整合（Nodemailer 或 Manus 通知 API）

### 員工與加盟主功能
- [ ] 建立設備維修表單（/dashboard/staff/repairs）
- [ ] 建立 equipment_repairs 資料表
- [ ] 實作提交維修請求 API
- [ ] 在加盟主專區新增 SOP 文件連結區塊
- [ ] 在加盟主專區新增門市資料顯示（根據 storeId）

### SEO/GEO 優化
- [ ] 加盟頁面：注入 Product Schema（加盟方案）
- [ ] 新聞文章頁面：注入 Article Schema
- [ ] 使用 Google Rich Results Test 驗證結構化資料
- [ ] 新增文章 SEO 優化：metaDescription 欄位和 meta 標籤

### 測試與驗證
- [ ] 測試文章卡片點擊功能
- [ ] 測試文章詳情頁顯示
- [ ] 測試多目標發布功能
- [ ] 測試圖片上傳功能
- [ ] 測試多個頁面切換時的地圖載入行為
- [ ] 測試超級管理員登入（barmyhy1688@gmail.com）
- [ ] 測試 Google OAuth 登入後的電話號碼強制填寫
- [ ] 測試角色導向邏輯（5 種角色）
- [ ] 測試管理員建立加盟主帳號功能
- [ ] 測試員工提交設備維修表單

## 宇聯官網文章路由修復（2026-01-19）

- [x] 建立宇聯官網獨立文章詳情頁路由（/corporate/news/:slug）
- [x] 建立 CorporateNewsArticle.tsx 組件
- [x] 在 App.tsx 中註冊 /corporate/news/:slug 路由
- [x] 修改 CorporateNews.tsx 文章連結導向 /corporate/news/:slug
- [x] 確保文章詳情頁使用 CorporateLayout
- [x] 修改 CorporateHome.tsx 首頁新聞區塊整合 API 查詢
- [x] 使用 content.getPublishedPosts API 查詢 publishTarget = 'corporate' 文章
- [x] 顯示最新 3 篇宇聯官網文章
- [x] 新增文章卡片點擊事件導向 /corporate/news/:slug
- [x] 修復欄位名稱不一致問題（imageUrl → coverImage）
- [ ] 測試文章點擊和路由導向
- [ ] 儲存 checkpoint

### 加盟頁面 FAQ 區塊
- [x] 建立 FAQ Accordion 組件（已存在）
- [x] 新增 3 個防禦性 FAQ 問題和答案
- [x] 整合到加盟頁面（/brand/franchise）

### 部落格內容種子
- [x] 確認 posts 表結構（id, title, slug, status, publishedAt, content, excerpt, coverImage, authorId）
- [x] 新增 5 篇草稿文章到 posts 表（2026 加盟殘酷真相、開店成本試算、缺工救星、營收翻倍術、逢甲讀書餐廳）

### GEO 結構化資料
- [x] 在 index.html 中新增 Restaurant Schema（FastFoodRestaurant）
- [x] 強調 OpeningHours: Mo-Su 06:00-02:00
- [x] 新增 alternateName: 台韓混血早午餐
- [x] 新增 servesCuisine: Tai-Korean Fusion, Brunch, 深夜食堂
- [x] 新增 hasMenu 與 knowsAbout 屬性

## Google Maps 重複載入問題修復（2026-01-19）

- [x] 分析 Map.tsx 腳本載入邏輯
- [x] 實作全域腳本載入狀態管理（防止重複載入）
- [x] 新增錯誤處理機制（try-catch）
- [x] 新增 google.maps API 可用性檢查
- [ ] 測試多個頁面切換時的地圖載入行為
- [ ] 儲存 checkpoint

## 文章系統優化（2026-01-19）

### 文章卡片點擊功能
- [x] 為 BrandNews.tsx 文章卡片加入 onClick 事件
- [x] 為 CorporateNews.tsx 文章卡片加入 onClick 事件
- [x] 導向文章詳情頁 `/news/{slug}`

### 文章詳情頁美化
- [x] 新增「返回新聞列表」按鈕（頂部和底部）
- [x] 優化 Typography（標題、內文、間距）
- [x] 優化封面圖片顯示（aspect-ratio, hover 效果）
- [x] 新增發布日期和作者資訊
- [x] 支援 Markdown 渲染（react-markdown + remark-gfm）

### 多目標發布功能
- [x] 重新設計資料結構（publishTarget 改為 publishTargets JSON 陣列）
- [x] 更新資料庫 schema（ALTER TABLE 新增 publishTargets JSON 欄位）
- [x] 修改後台編輯器支援多選（Checkbox 界面）
- [x] 更新 API 查詢邏輯（JSON_CONTAINS 查詢）
- [x] 支援獨立修改/刪除各官網文章（勾選/取消勾選）

### 圖片上傳功能
- [x] 整合 S3 storage helpers
- [x] 在文章編輯器新增「上傳圖片」按鈕
- [x] 實作圖片上傳 API endpoint（storage router）
- [x] 上傳後自動填入圖片 URL
- [x] 新增圖片預覽和移除功能
- [x] 檔案大小驗證（5MB 限制）
- [x] 說明 S3 儲存不佔用伺服器空間

### 測試與交付
- [ ] 測試文章卡片點擊
- [ ] 測試文章詳情頁顯示
- [ ] 測試多目標發布
- [ ] 測試圖片上傳
- [ ] 儲存 checkpoint

## 宇聯官網快捷導航列新增（2026-01-19）

- [x] 在 CorporateHome.tsx Hero Section 下方新增快捷導航列
- [x] 設計 5 個快捷入口卡片（旗下品牌、門市據點、加盟資訊、新聞中心、線上商城）
- [x] 使用 Grid 佈局和 Hover 效果（hover:shadow-lg hover:scale-105）
- [x] 新增對應的圖示（Building2, MapPin, Handshake, Newspaper, ShoppingBag）
- [ ] 測試快捷導航列顯示和點擊功能
- [ ] 儲存 checkpoint

## 宇聯官網文章路由修復（2026-01-19）

- [x] 建立宇聯官網獨立文章詳情頁路由（/corporate/news/:slug）
- [x] 建立 CorporateNewsArticle.tsx 組件
- [x] 在 App.tsx 中註冊 /corporate/news/:slug 路由
- [x] 修改 CorporateNews.tsx 文章連結導向 /corporate/news/:slug
- [x] 確保文章詳情頁使用 CorporateLayout
- [x] 修改 CorporateHome.tsx 首頁新聞區塊整合 API 查詢
- [x] 使用 content.getPublishedPosts API 查詢 publishTarget = 'corporate' 文章
- [x] 顯示最新 3 篇宇聯官網文章
- [x] 新增文章卡片點擊事件導向 /corporate/news/:slug
- [x] 修復欄位名稱不一致問題（imageUrl → coverImage）
- [ ] 測試文章點擊和路由導向
- [ ] 儲存 checkpoint

## 加盟諮詢後台管理系統（2026-01-19）

- [x] 檢查 franchise_inquiries 資料庫表是否存在
- [x] 建立 franchise_inquiries 資料庫表（手動 SQL）
- [x] 在 schema.ts 中新增 franchiseInquiries 表定義
- [x] 建立加盟諮詢 API endpoints（franchise.submitInquiry, franchise.listInquiries, franchise.updateInquiryStatus）
- [x] 在 db.ts 中新增 franchise inquiry 相關函數
- [x] 修改 BrandFranchise.tsx 使用真實 API 提交表單
- [x] 建立後台加盟諮詢管理頁面（/dashboard/franchise-inquiries）
- [x] 新增列表顯示（姓名、電話、Email、預計地點、預算、經驗、狀態、建立時間）
- [x] 新增狀態更新功能（待處理、已聯繫、已安排會議、已完成、已取消）
- [x] 新增 Email 通知功能（發送到 ordersome2020@gmail.com）
- [x] 限制權限：只有 super_admin 和 manager 可以查看（使用 adminProcedure）
- [x] 在 App.tsx 中註冊 /dashboard/franchise-inquiries 路由
- [ ] 測試表單提交和後台顯示
- [ ] 儲存 checkpoint

## 加盟諮詢後台優化（2026-01-21）

- [x] 在 AdminDashboardLayout 側邊欄新增「加盟諮詢」連結（使用 Handshake icon）
- [x] 在 franchise_inquiries 表新增 notes 欄位（TEXT）
- [x] 在 schema.ts 中更新 franchiseInquiries 表定義
- [x] 新增備註更新 API（franchise.updateInquiryNotes）
- [x] 在 db.ts 中新增 updateFranchiseInquiryNotes 函數
- [x] 在後台管理頁面每筆諮詢記錄新增備註文字框
- [x] 新增「儲存備註」按鈕和狀態管理
- [x] 支援備註儲存和更新（使用 tRPC mutation）
- [ ] 測試側邊欄導航和備註功能
- [ ] 儲存 checkpoint

## 加盟諮詢系統問題修複（2026-01-21）

- [x] 診斷前台表單提交的 API 程式（正常）
- [x] 檢查後端 franchise.submitInquiry API 的錯誤日誌（正常）
- [x] 檢查資料庫 franchise_inquiries 表是否正確儲存資料（找到問題）
- [x] 修複 db.ts 中的 createFranchiseInquiry 函數（新增時間戳和 status 欄位）
- [x] 重啟開發伺服務器以清除編譯快取
- [ ] 測試完整的表單提交和後台顯示流程
- [ ] 儲存 checkpoint

## 加盟諮詢表單優化（2026-01-21）

- [x] 修改後端 API email 欄位為可選（optional）
- [x] 修改 schema.ts 中的 franchiseInquiries 表 email 欄位為可選
- [x] 修改 db.ts 中的 createFranchiseInquiry 函數 email 參數為可選
- [x] 修改資料庫表 email 欄位為 NULL
- [x] 前台表單新增 email 格式驗證（如果填寫）
- [x] 新增表單提交成功後的明確提示訊息（頁面內顯示）
- [x] 新增 submitSuccess 狀態管理
- [x] 新增成功提示區塊（綠色邊框、勾選圖示、成功訊息）
- [x] 重啟開發伺服器以清除編譯快取
- [ ] 測試 email 驗證和成功提示
- [ ] 儲存 checkpoint

## 專案恢復（2026-02-21）
- [x] 從 GitHub 恢復完整代碼（ordersome-official123.git）
- [x] 配置 ECPay 正式環境金鑰（ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV）
- [x] 執行完整資料庫 Migration（12 個資料表全部建立）
- [x] 修復 order.test.ts 測試（角色與 items 參數）
- [x] 安裝缺少的 bcryptjs 套件
- [x] 所有 32 個測試通過
- [x] 開發伺服器正常運作
- [x] GitHub remote 已設定（github remote）

## 缺失功能補充（2026-02-21 第二批）
- [ ] 第零階段：12 間門市資料匯入資料庫
- [ ] 第零階段：門市據點頁面升級（互動地圖 + 導航功能）
- [ ] 第零點五階段：辣椒醬系列商品分類匯入
- [ ] 第零點五階段：2 個商品資料匯入（單瓶、兩入組）
- [ ] 第一階段：安裝 Tiptap 依賴套件
- [ ] 第一階段：建立 RichTextEditor 組件
- [ ] 第一階段：ContentEditor 使用 RichTextEditor
- [ ] 第二階段：NewsArticle.tsx 雜誌級閱讀體驗（進度條 + Hero + 閱讀時間）
- [ ] 第二階段：CorporateNewsArticle.tsx 升級
- [ ] 第三階段：SOP 知識庫 5 個資料表建立（sop_categories, sop_documents, sop_read_receipts, equipment_repairs, daily_checklists, daily_checklist_items）
- [ ] 第三階段：SOP 分類初始資料（6 個分類）
- [ ] 第三階段：SOP Router 建立
- [ ] 第三階段：SOP 管理頁面
- [ ] 第三階段：設備報修系統
- [ ] 第三階段：每日檢查表系統
- [ ] 第四階段：智慧中控台分流導向

## 缺失功能補充（2026-02-21 第二批）
- [x] 門市系統升級（12 間門市資料匯入 + 互動地圖 + 導航功能）
- [x] 商品資料匯入（辣椒醬系列分類 + 2 個商品）
- [x] Tiptap 富文本編輯器整合到 ContentEditor
- [x] 雜誌級閱讀體驗（閱讀進度條、Hero Section、閱讀時間）
- [x] SOP 知識庫系統（6 個資料表 + 完整 CMS + 閱讀簽收）
- [x] 設備報修系統（前端頁面 + 後端 API）
- [x] 每日檢查表系統（開店/閉店 + 手機優先設計）
- [x] 智慧中控台分流導向（/dashboard 依角色自動分流）
- [x] SOP 路由整合到 App.tsx（/dashboard/sop、/dashboard/repairs、/dashboard/checklist）
- [x] 修復 StaffDashboard 快捷連結指向新路由

## 智慧中控台與分流導向系統（2026-02-21 第三批）
- [ ] 重建 /dashboard 中控台頁面（6 張角色白名單卡片：營運總部/加盟專區/員工專區/線上商城/我的訂單/個人中心）
- [ ] 實作智慧登入導向（customer→?redirect或/shop、內部人員→/dashboard）
- [ ] 全站導航優化：Admin/Franchise/Staff Sidebar 加入「返回儀表板」按鈕
- [ ] 商城 Header 加入「會員中心」按鈕連結至 /dashboard

## 智慧中控台與分流導向系統（2026-02-21）

- [x] 重建 /dashboard 中控台頁面（6 張角色白名單卡片：營運總部、加盟專區、員工專區、線上商城、我的訂單、個人中心）
- [x] 實作智慧登入導向（customer→/shop、內部人員→/dashboard）
- [x] OAuth callback 加入角色導向邏輯（依 role 跳轉）
- [x] Email/Password 登入成功後依角色智慧導向
- [x] Admin/Franchise/Staff Sidebar 加入「返回儀表板」按鈕
- [x] 商城 CorporateHeader 加入「會員中心」按鈕（連結至 /dashboard）

## SOP 系統完整建置（2026-02-21）

- [ ] 讀取《營運手冊》PDF 並分析 6 大章節結構
- [ ] 資料庫 Schema 擴充：sop_categories、sop_articles（含 is_visible_to_staff）、sop_read_records、equipment_repairs、daily_checklists、checklist_submissions
- [ ] 後端 Router：SOP CRUD（RBAC 權限）、PDF 上傳、閱讀簽收
- [ ] 後端 Router：設備報修 CRUD + Make Webhook 串接
- [ ] 後端 Router：每日檢查表提交與記錄
- [ ] 前端：SOP 知識庫頁面（員工瀏覽 + 管理員 CMS 編輯器 + Tiptap）
- [ ] 前端：設備報修系統（FAB 按鈕 + 手機優先 + Make Webhook）
- [ ] 前端：每日開閉店檢查表（大按鈕 Checkbox + 防呆提交）
- [ ] 整合 SOP 入口卡片到員工專區（/dashboard/staff）
- [ ] 整合 SOP 入口卡片到加盟專區（/dashboard/franchise）
- [ ] 匯入《營運手冊》6 大章節初始資料到資料庫

## SOP 系統完整建置（2026-02-21）

- [x] Schema 擴充：sopDocuments 加入 isVisibleToStaff 欄位，equipmentRepairs 加入 category 欄位
- [x] SOP Router 升級：RBAC 過濾、Make Webhook 串接、PDF 上傳功能
- [x] 匯入《營運手冊》6 大章節分類（Ch01-Ch06）
- [x] SOPKnowledgeBase.tsx 重寫：員工瀏覽 + 管理員 CMS 編輯器 + PDF 上傳 + isVisibleToStaff 開關 + 閱讀簽收
- [x] EquipmentRepairs.tsx 重寫：FAB 按鈕 + Bottom Sheet 表單 + Make Webhook 串接 + 手機優先設計
- [x] DailyChecklist.tsx 重寫：基於《營運手冊》真實開閉店流程 + 防呆提交 + 記錄查詢
- [x] 全部 32/32 測試通過

## 系統導航整合、權限控制與動態路由（2026-02-22）

### Module 1：UI & Routing 整合
- [x] StaffDashboardLayout Sidebar 新增 SOP 知識庫、設備報修、每日檢查表選項（BookOpen、Wrench、ClipboardList）
- [x] FranchiseeDashboardLayout Sidebar 修正 SOP 路由為 /dashboard/sop，新增設備報修和每日檢查表
- [x] StaffDashboard 快捷卡片：新增 SOP 知識庫、設備報修、每日檢查表卡片，使用 Link 取代 a 標籤
- [x] FranchiseDashboard 快捷卡片：新增 SOP 知識庫、設備報修、每日檢查表卡片
- [x] Sidebar isActive 判斷改用 location.startsWith(item.path)，支援子路由高亮

### Module 2：動態返回導航
- [x] 建立 BackButton 元件（client/src/components/BackButton.tsx）
- [x] 使用 useLocation + history.back() 實作動態返回
- [x] 防呆機制：歷史紀錄為空時依角色 fallback（staff→/dashboard/staff，franchisee→/dashboard/franchise，其他→/dashboard）
- [x] 整合 BackButton 到 SOPKnowledgeBase 列表視圖 header
- [x] 整合 BackButton 到 EquipmentRepairs header
- [x] 整合 BackButton 到 DailyChecklist header

### Module 3：角色權限系統
- [x] sop router 新增 getSopPermissions endpoint（管理員用）
- [x] sop router 新增 updateSopPermissions endpoint（批次寫入 sop_permissions 表）
- [x] sop router 新增 getAccessibleCategories endpoint（依用戶角色/權限表過濾分類）
- [x] SOPKnowledgeBase 改用 getAccessibleCategories 取代 getCategories（動態分類渲染）
- [x] 建立 AdminSopPermissions.tsx：Super Admin 可依角色或特定用戶勾選可存取的 SOP 分類
- [x] AdminDashboardLayout Sidebar 新增「SOP 存取權限」入口（BookOpen icon）
- [x] App.tsx 新增 /dashboard/admin/sop-permissions 路由

### Module 4：閱讀簽收強化
- [x] markAsRead onSuccess 加入 refetchReadStatus（確保按鈕狀態即時鎖定）
- [x] 閱讀狀態查詢在 selectedDocId 變更時自動觸發（enabled: !!selectedDocId）
- [x] 已閱讀按鈕呈現 disabled + 打勾狀態，嚴禁重複點擊

### 技術品質
- [x] TypeScript 編譯 0 errors（npx tsc --noEmit）
- [x] 所有 32 個 vitest 測試通過

## 結帳流程專業化升級（2026-02-23）

### Phase 5：發票欄位整合（進行中）
- [x] 資料庫 Migration：orders 表新增 invoiceType、companyTaxId、companyName 欄位
- [x] order.create API input schema 新增發票欄位（invoiceType、companyTaxId、companyName）
- [x] order.create 寫入發票欄位到資料庫
- [x] Checkout.tsx 新增發票欄位到 createOrder 呼叫
- [x] 修復 TypeScript 類型錯誤（z.enum default、z.record 語法）
- [x] 修復 vitest 測試（getStoreSettings mock）
- [x] 所有 32 個測試通過，TypeScript 0 errors
- [x] 完成結帳表單驗證（電話、稅號正則表達式）
- [x] Checkout.tsx 1-2-3 漏斗佈局重構（LINE/Google/一般會員登入按鈕、訪客联絡方式、即時防呆驗證）
- [ ] 測試完整結帳流程（包含發票資料）
- [ ] 測試 ECPay 金流與發票資料同步
- [ ] 儲存 checkpoint

## Phase 4：B2B2C OAuth 整合與 RBAC 防禦（2026-02-23）

- [x] 資料庫 Migration：users 表新增 lineId、googleId 欄位
- [x] 環境變數：LINE_CLIENT_ID、LINE_CLIENT_SECRET、GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET
- [x] server/_core/env.ts 新增 LINE/Google 金鑰變數
- [x] db.ts 新增 getUserByEmail 與 linkOAuthProvider 函式
- [x] oauth.ts RBAC 防禦：既有帳號綁定、新帳號預設 customer
- [x] oauth.ts 新增 LINE/Google 直連 Callback 路由
- [x] const.ts getLoginUrl 支援 returnPath 參數（checkout 回跳）
- [x] Checkout.tsx 登入按鈕加入 redirect=/shop/checkout 參數
- [x] Checkout.tsx useEffect 自動帶入用戶資料（OAuth 回跳後自動填充）
- [x] oauth.rbac.test.ts 新增 10 個測試（RBAC 防禦、智慧路由、Provider 偵測）
- [x] 所有 42 個 vitest 測試通過，TypeScript 0 errors

## 啟用 LINE/Google OAuth 按鈕（2026-02-23）

- [x] 移除 Checkout.tsx LINE/Google 按鈕的 disabled 狀態，接上正確 OAuth URL
- [x] 新增 oauth.ts LINE/Google /start 路由（發起 OAuth 授權流程）
- [x] Login.tsx 新增 LINE 登入按鈕，Google 改用直連路由
- [x] 確認 oauth.ts LINE/Google Callback 路由正確串接
- [x] TypeScript 0 errors + 42 vitest 通過
- [x] 儲存 Checkpoint

## 正式部署與 LINE OAuth 修正（2026-02-23）

- [ ] 更新 VITE_APP_URL 環境變數為 https://ordersome.com.tw
- [ ] 儲存 Checkpoint 並發布到正式環境
- [ ] 在 LINE Developers Console 加入正式網域 Callback URL
- [ ] 在 Google Cloud Console 加入正式網域 Redirect URI
- [ ] 設定自訂網域 ordersome.com.tw 綁定

## OAuth redirect_uri 正式環境修正（2026-02-23）

- [x] 檢查環境變數 VITE_APP_URL 與 NODE_ENV 設定
- [x] 實查 oauth.ts 中 LINE/Google redirect_uri 的生成邏輯
- [x] 修正 redirect_uri 動態拼接（確保使用 VITE_APP_URL）
- [x] 移除所有穷編碼的測試域名
- [x] 輸出實際的 redirect_uri 字串供檢查

## 用戶菜單與訂單頁面（2026-02-23）

- [ ] 建立 UserMenu 下拉選單組件（顯示用戶名稱、頭像、登出按鈕）
- [ ] 在 App.tsx Header 中整合 UserMenu
- [ ] 新增「我的訂單」頁面（/shop/my-orders）
- [ ] 連結 UserMenu 至「我的訂單」頁面
- [ ] TypeScript 0 errors + 42 vitest 通過
- [ ] 儲存 Checkpoint

## 用戶菜單完成狀態（已完成）

- [x] 建立 UserMenu 下拉選單組件（顯示用戶名稱、頭像、登出按鈕）
- [x] 在 BrandHeader 中整合 UserMenu
- [x] 新增「我的訂單」頁面（/shop/my-orders）
- [x] 連結 UserMenu 至「我的訂單」頁面
- [x] TypeScript 0 errors + 42 vitest 通過

## robots.txt 與 Canonical 標籤（2026-03-04）

- [x] 更新 robots.txt 新增 Disallow 規則（/dashboard/, /shop/cart, /shop/checkout, /shop/my-orders, /shop/payment, /shop/order-complete）
- [x] 建立全站動態 Canonical Hook（移除 UTM 與分頁 query string）
- [x] 整合 Canonical Hook 到 App.tsx
- [x] TypeScript 0 errors + 42 vitest 通過
- [x] 儲存 Checkpoint

## BreadcrumbList 與 Article Schema（2026-03-04）

- [x] 建立 useBreadcrumbList Hook（動態生成層級路徑）
- [x] 在 App.tsx 整合 BreadcrumbList Hook（全站自動生效）
- [x] 建立 useArticleSchema Hook（動態抓取資料庫內容）
- [x] 在 NewsArticle.tsx 整合 Article Schema
- [x] 確保無 React hydration error（使用 useEffect 僅客戶端執行）
- [x] TypeScript 0 errors + 42 vitest 通過
- [ ] 儲存 Checkpoint

## Restaurant Schema 與 FAQPage Schema 升級（2026-03-04）

- [x] 讀取門市頁與加盟頁結構，確認資料庫欄位
- [x] 建立 useRestaurantSchema Hook（動態抓取門市資料）
- [x] 在 BrandStores.tsx 整合 Restaurant Schema，移除舊静態 LocalBusiness Schema
- [x] 升級 BrandFranchise.tsx FAQPage Schema（擴充至 8 個問答，含加盟金 36 萬、培訓 14 天等具體數據）
- [x] 確保符合 Google Rich Results 規範（使用 useEffect 僅客戶端執行）
- [x] TypeScript 0 errors + 42 vitest 通過
- [ ] 儲存 Checkpoint

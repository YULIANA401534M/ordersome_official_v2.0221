# SEO / GEO 關鍵字作戰地圖

更新日期：2026-04-23

## 目標

用「可被搜尋引擎與 AI 理解」的內容結構，讓品牌在下列查詢更容易被命中：

- 台中加盟
- 台中早餐加盟
- 早餐加盟
- 早餐加盟推薦
- 早午餐加盟
- 優秀加盟商
- 辣椒醬推薦
- 好吃辣椒醬
- 辣椒醬線上購買

## 關鍵字分群

1. 加盟創業群（TA1）
- 台中加盟
- 台中早餐加盟
- 早餐加盟推薦
- 早午餐加盟
- 優秀加盟商
- 小本創業開店

2. 商品購買群（TA2）
- 辣椒醬推薦
- 好吃辣椒醬
- 早餐店辣椒醬
- 辣椒醬線上購買

## 對應頁面（Landing）

加盟主頁：
- `/brand/franchise`

加盟關鍵字頁：
- `/brand/franchise-taichung`

商城主頁：
- `/shop`

辣椒醬關鍵字頁：
- `/shop/chili-sauce-guide`

## 已做的底層串接

- 路由層動態 Meta：`client/src/hooks/useGeoMeta.ts`
- AI 索引入口：`client/public/llms.txt`, `client/public/llms-full.txt`
- 站點地圖：`client/public/sitemap.xml`
- 私有頁防收錄：`client/public/robots.txt`, `server/_core/index.ts`

## 每週檢查清單

1. Search Console 查詢字詞曝光是否成長
2. 是否有新高意圖詞需要新增對應頁
3. 文章內容是否有連回對應 landing page
4. sitemap 是否包含新頁
5. 私有路徑是否誤收錄

## 實務提醒

搜尋排名無法保證「立刻到前幾名」，但可以保證：

1. 搜尋引擎更容易理解你的網站主題
2. AI 摘要系統更容易把你和目標詞連結
3. 內容累積後，成效會比純發文但無結構更穩定

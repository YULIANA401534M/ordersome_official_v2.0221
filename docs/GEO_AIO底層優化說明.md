# GEO / AIO 底層優化說明

更新日期：2026-04-23

## 這次做了什麼

1. 建立全站路由層 `Meta` 控制：
- 檔案：`client/src/hooks/useGeoMeta.ts`
- 針對高意圖頁（首頁、加盟頁、商城頁）統一輸出 title/description/keywords/OG/Twitter
- 私有頁路徑統一輸出 `robots=noindex`

2. 加入 AI 可讀索引文件：
- `client/public/llms.txt`
- `client/public/llms-full.txt`

3. 更新站點索引：
- `client/public/sitemap.xml`：擴充加盟與商城相關高價值頁
- `client/public/robots.txt`：明確封鎖後台/私有流程頁，保留公開內容可爬取

4. 伺服器層保護私有頁：
- `server/_core/index.ts`
- 對私有路由回傳 `X-Robots-Tag: noindex, nofollow, noarchive`

5. 修正站點入口 `index.html` 基礎 metadata 與 JSON-LD：
- canonical 指向 `https://ordersome.com.tw/`
- Organization/WebSite 結構化資料統一到正式網域

## 後續維運規則

1. 新增高意圖公開頁時，記得同步更新：
- `useGeoMeta.ts` 的路由規則
- `sitemap.xml`
- 必要時補充 `llms-full.txt`

2. 新增私有頁時，記得同步加入 noindex 規則：
- `useGeoMeta.ts` 的 `isNoIndexPath`
- `server/_core/index.ts` 的 `privatePrefixes/privateExact`

3. 每週檢查一次：
- Search Console 的覆蓋率與索引狀態
- AIO / GEO 關鍵字查詢是否命中加盟頁與商城頁

## 商業目標對應

- TA-1（加盟創業族群）：`/brand/franchise` 為核心 landing page
- TA-2（辣椒醬購買族群）：`/shop` 與商品頁為核心 landing page

本次優化目標是讓搜尋引擎與 AI 摘要系統更快理解上述兩條主線內容，減少對外部行銷代操的依賴。

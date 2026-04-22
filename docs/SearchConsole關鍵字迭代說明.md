# Search Console 關鍵字迭代說明

更新日期：2026-04-23

## 你要做的事情

每週從 Google Search Console 匯出「查詢字詞」CSV，然後用專案腳本生成一份可執行的優化報告。

## 指令

```bash
npm run seo:iterate -- <你的CSV路徑> [輸出報告路徑]
```

範例：

```bash
npm run seo:iterate -- reports/gsc_queries_weekly.csv docs/SEO_GSC週報.md
```

## 腳本會做什麼

1. 讀取查詢字詞、點擊、曝光、CTR、排名
2. 自動抓出高曝光但低 CTR 的詞
3. 自動映射到對應 landing page
4. 產出本週行動清單

## 預設映射規則

- 加盟創業詞（台中加盟、早餐加盟、早午餐加盟、優秀加盟商） -> `/brand/franchise-taichung`
- 辣椒醬購買詞（辣椒醬推薦、好吃辣椒醬、辣椒醬線上購買） -> `/shop/chili-sauce-guide`

## 建議節奏

1. 每週固定跑一次腳本
2. 先改 landing page 的標題、首段、FAQ
3. 再從每日文章加內部連結導向 landing page
4. 下一週檢查同一批詞的 CTR 與排名是否上升

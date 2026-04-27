import { router, publicProcedure } from "../../_core/trpc";

const MOA_URL =
  "https://data.moa.gov.tw/Service/OpenData/FromM/PoultryTransBoiledChickenData.aspx";

// 雞蛋(大運輸價) 欄位名稱（農委會 API 原始 key）
const KEY_LARGE_TRANSPORT = "雞蛋(大運輸價)";
const KEY_ORIGIN = "雞蛋(產地價)";

let cache: { price: number | null; origin: number | null; date: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const dyEggPriceRouter = router({
  today: publicProcedure.query(async () => {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return cache;
    }

    try {
      const today = new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "/");
      const url = `${MOA_URL}?StartDate=${today}&EndDate=${today}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`MOA API ${res.status}`);
      const rows: any[] = await res.json();

      // 取最新一筆（可能因假日為空，往前查 7 天）
      let price: number | null = null;
      let origin: number | null = null;
      let date = today;

      if (!rows.length) {
        // 往前查 7 天找最近有資料的一天
        const past = new Date(now + 8 * 60 * 60 * 1000);
        past.setDate(past.getDate() - 7);
        const pastStr = past.toISOString().slice(0, 10).replace(/-/g, "/");
        const url2 = `${MOA_URL}?StartDate=${pastStr}&EndDate=${today}`;
        const res2 = await fetch(url2, { signal: AbortSignal.timeout(8000) });
        const rows2: any[] = await res2.json();
        if (rows2.length) {
          const latest = rows2[0];
          price = latest[KEY_LARGE_TRANSPORT] ? Number(latest[KEY_LARGE_TRANSPORT]) : null;
          origin = latest[KEY_ORIGIN] ? Number(latest[KEY_ORIGIN]) : null;
          date = latest["日期"] ?? today;
        }
      } else {
        const latest = rows[0];
        price = latest[KEY_LARGE_TRANSPORT] ? Number(latest[KEY_LARGE_TRANSPORT]) : null;
        origin = latest[KEY_ORIGIN] ? Number(latest[KEY_ORIGIN]) : null;
        date = latest["日期"] ?? today;
      }

      cache = { price, origin, date, fetchedAt: now };
      return cache;
    } catch {
      // 農委會掛了就回 null，讓前端降級成手動輸入
      return { price: null, origin: null, date: "", fetchedAt: now };
    }
  }),
});

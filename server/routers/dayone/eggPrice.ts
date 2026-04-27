import { router, publicProcedure } from "../../_core/trpc";

const MOA_URL =
  "https://data.moa.gov.tw/Service/OpenData/FromM/PoultryTransBoiledChickenData.aspx";

// 農委會 API 欄位名稱
const KEY_LARGE_TRANSPORT = "雞蛋(大運輸價)";
const KEY_ORIGIN = "雞蛋(產地價)";

// 一箱 = 20 台斤
const JIN_PER_BOX = 20;

type EggPriceCache = {
  pricePerJin: number | null;   // 農委會大運輸價（元/台斤）
  pricePerBox: number | null;   // 換算後箱價（元/箱），= pricePerJin × 20
  origin: number | null;
  date: string;                  // YYYY/MM/DD
  fetchedAt: number;
};

let cache: EggPriceCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 小時

function parseRow(row: any, fallbackDate: string): EggPriceCache {
  const pricePerJin = row[KEY_LARGE_TRANSPORT] ? Number(row[KEY_LARGE_TRANSPORT]) : null;
  return {
    pricePerJin,
    pricePerBox: pricePerJin != null ? Math.round(pricePerJin * JIN_PER_BOX * 10) / 10 : null,
    origin: row[KEY_ORIGIN] ? Number(row[KEY_ORIGIN]) : null,
    date: row["日期"] ?? fallbackDate,
    fetchedAt: Date.now(),
  };
}

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

      if (!rows.length) {
        // 假日往前查 7 天找最近有資料的一天
        const past = new Date(now + 8 * 60 * 60 * 1000);
        past.setDate(past.getDate() - 7);
        const pastStr = past.toISOString().slice(0, 10).replace(/-/g, "/");
        const res2 = await fetch(`${MOA_URL}?StartDate=${pastStr}&EndDate=${today}`, { signal: AbortSignal.timeout(8000) });
        const rows2: any[] = await res2.json();
        cache = rows2.length ? parseRow(rows2[0], today) : { pricePerJin: null, pricePerBox: null, origin: null, date: today, fetchedAt: now };
      } else {
        cache = parseRow(rows[0], today);
      }

      return cache;
    } catch {
      return { pricePerJin: null, pricePerBox: null, origin: null, date: "", fetchedAt: now };
    }
  }),
});

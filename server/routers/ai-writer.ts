import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { posts } from "../../drizzle/schema";

async function fetchNews(topic: string): Promise<string> {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return "無";
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=zh&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return "無";
    const data = (await res.json()) as {
      articles?: { title?: string; description?: string }[];
    };
    const articles = data.articles ?? [];
    if (articles.length === 0) return "無";
    return articles
      .slice(0, 3)
      .map((a, i) => `${i + 1}. ${a.title ?? ""}：${a.description ?? ""}`)
      .join("\n");
  } catch {
    return "無";
  }
}

function buildPrompt(topic: string, style: "brand" | "franchise", news: string): string {
  if (style === "brand") {
    return `你是「來點什麼 OrderSome」的品牌說書人，請寫一篇讓人想讀完、有溫度的繁體中文文章。

【品牌靈魂】
- 品牌名稱：來點什麼 OrderSome
- 創辦故事：2020年，一群東勢山城的年輕人，把長輩經營21年的傳統早餐店翻轉成台韓街頭品牌，疫情中逆勢開店
- 願景：「Every Breakfast, A Bold Beginning. 每份早餐，都是改變人生的起點」
- 口號：「點一份期待，嚐一口未來」
- 定位：台灣唯一台韓混搭早午餐，社區型精緻平價，做社區的好鄰居
- 母公司：宇聯國際文化餐飲有限公司
- 門市：13間（東勢、逢甲、東山、財神、民權、大里、林新、大墩、樂業、永興等）
- 客群：18-35歲學生、上班族、家庭、寵物友善

【招牌產品】
- 韓式飯捲：韓國進口正宗海苔、特製韓式配料、韓式辣醬、鹹香蛋絲
- 搖搖便當：源自韓國南怡島，四種韓式小菜配主食與半熟蛋，使勁搖才好吃
- 粉漿蛋餅：台式改良，外Q裡嫩、口感濕潤，有別於市售蛋餅
- 鐵板炒麵：堅持鐵板現炒，拒絕料理包
- 獨家醬料：珊瑚醬、黑胡椒醬（看得到黑胡椒粒）、蘑菇醬（看得到新鮮蘑菇）
- 榮獲 UberEats 百大餐廳評鑑大賞

【寫作規則】
- 字數：500-700字（讀者沒耐心，要精準有力）
- 第一人稱「我們」代表品牌
- 語氣：像朋友聊天，有溫度、有個性，不裝腔作勢
- 結構：開頭要有鉤子（讓人想繼續讀）、中間有乾貨、結尾有記憶點
- emoji：最多2個，只放標題
- 禁止：不要發明不存在的品牌名稱、門市名稱、產品名稱
- 禁止：不要寫「黃大根」（已下架）
- 禁止：套話、空話、過度誇張

【參考時事新聞】
${news}

【文章主題與角度】
${topic}

請只回傳 JSON，不要有任何其他文字或 markdown：
{"title":"標題（要有吸引力，像新聞標題）","excerpt":"摘要80字內","content":"完整HTML內文，用<p><h2><ul>等標籤，h2小標要簡短有力","category":"餐飲新聞或品牌動態或加盟快報或集團公告擇一"}`;
  } else {
    return `你是「來點什麼 OrderSome」的加盟顧問，請寫一篇讓想創業的人看了會心動、又覺得可信的繁體中文文章。

【品牌加盟資訊】
- 品牌名稱：來點什麼 OrderSome
- 使命：「Made for Makers. 讓敢拚的人，有系統可依、有舞台可站」
- 定位：台灣唯一台韓混搭早午餐，13間門市持續展店
- 核心優勢：
  * 台灣唯一台韓混搭，產品差異化明顯
  * 低投資高毛利：毛利率約55%
  * 商標使用費/權利金：0元（罕見）
  * 全方位培訓輔導，一對三輔導支援
  * 強大行銷設計團隊支援

【加盟數據】
- 裝潢設備：約138-188萬（依坪數）
- 品牌加盟金：16萬（含3年教育訓練、行銷推廣、開幕輔導）
- 履約保證金：2萬（合約結束退還）
- 首批進貨費：10萬
- 預估月營業利益：小店型約9.45萬、大店型約19.14萬
- 加盟流程：意向溝通→實地洽談→選址協助→施工→培訓→開幕

【寫作規則】
- 字數：800-1000字
- 語氣：專業可信，有溫度但不煽情
- 數據要具體呈現，不誇大
- 以「來點什麼」或「我們」說話
- 結尾引導讀者採取行動（詢問加盟）
- 完全不用 emoji
- 禁止：誇大保證獲利、發明不存在的數據

【參考時事新聞】
${news}

【文章主題與角度】
${topic}

請只回傳 JSON，不要有任何其他文字或 markdown：
{"title":"標題（專業有說服力）","excerpt":"摘要80字內","content":"完整HTML內文，用<p><h2><ul>等標籤","category":"餐飲新聞或品牌動態或加盟快報或集團公告擇一"}`;
  }
}

async function callGemini(prompt: string): Promise<{
  title: string;
  excerpt: string;
  content: string;
  category: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "GEMINI_API_KEY 未設定",
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Gemini API 錯誤：${res.status} ${errText}`,
    });
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  // 移除可能的 markdown code block 包裝
  const jsonText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: { title: string; excerpt: string; content: string; category: string };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Gemini 回傳格式無法解析：${rawText.slice(0, 200)}`,
    });
  }

  return parsed;
}

function generateSlug(title: string): string {
  const timestamp = Date.now();
  const safe = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
  return `${safe}-${timestamp}`;
}

export const aiWriterRouter = router({
  generateArticle: adminProcedure
    .input(
      z.object({
        topic: z.string().min(1),
        style: z.enum(["brand", "franchise"]),
        useNews: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const news = input.useNews ? await fetchNews(input.topic) : "無";
      const prompt = buildPrompt(input.topic, input.style, news);
      const result = await callGemini(prompt);
      return result;
    }),

  saveAsDraft: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        excerpt: z.string(),
        content: z.string(),
        category: z.string(),
        publishTargets: z.array(z.string()),
        published: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
      }

      const slug = generateSlug(input.title);
      const status = input.published ? "published" : ("draft" as const);
      const targets = input.publishTargets.length > 0 ? input.publishTargets : ["brand"];

      await database.insert(posts).values({
        tenantId: 1,
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        category: input.category,
        publishTargets: targets,
        authorId: ctx.user.id,
        status,
        publishedAt: status === "published" ? new Date() : null,
      });

      return { success: true };
    }),
});

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { posts } from "../../drizzle/schema";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

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
    return `你是來點什麼早午餐品牌的內容行銷專員，請根據以下資訊寫一篇繁體中文文章。
風格：輕鬆活潑，像朋友推薦，適合IG和官網，多用emoji。
字數：800-1200字。
主題：${topic}
參考新聞：${news}

請只回傳 JSON，不要有任何其他文字：
{"title":"標題","excerpt":"摘要100字內","content":"完整HTML內文，用<p><h2><ul>等標籤","category":"餐飲新聞或品牌動態或加盟快報或集團公告擇一"}`;
  } else {
    return `你是來點什麼早午餐品牌的加盟顧問，請根據以下資訊寫一篇繁體中文文章。
風格：專業正式，重點突出，數據有說服力，適合想創業的人閱讀。
字數：1000-1500字。
主題：${topic}
參考新聞：${news}

請只回傳 JSON，不要有任何其他文字：
{"title":"標題","excerpt":"摘要100字內","content":"完整HTML內文，用<p><h2><ul>等標籤","category":"餐飲新聞或品牌動態或加盟快報或集團公告擇一"}`;
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

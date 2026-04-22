import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { posts } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Content management procedure (super_admin, manager, or users with publish_content permission)
const contentProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.user;
  const hasPermission =
    user.role === "super_admin" ||
    user.role === "manager" ||
    (user.permissions && user.permissions.includes("publish_content"));

  if (!hasPermission) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要內容發布權限" });
  }
  return next({ ctx });
});

// Admin procedure (super_admin or manager only)
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const contentRouter = router({
  /**
   * List all posts (for content management dashboard)
   */
  listPosts: contentProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
      const conditions = [];
      if (input?.category) {
        conditions.push(sql`${posts.category} = ${input.category}`);
      }
      const query = database.select().from(posts).orderBy(desc(posts.createdAt));
      const allPosts = conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;
      return allPosts;
    }),

  /**
   * Get published posts (for public news page)
   * Filter by publishTarget: 'corporate' or 'brand', optional category, with pagination
   */
  getPublishedPosts: publicProcedure
    .input(z.object({
      publishTarget: z.string().optional(),
      category: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(12),
    }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const conditions = [eq(posts.status, "published")];

      if (input.publishTarget) {
        conditions.push(
          sql`JSON_CONTAINS(${posts.publishTargets}, JSON_QUOTE(${input.publishTarget}))`
        );
      }

      if (input.category) {
        conditions.push(sql`${posts.category} = ${input.category}`);
      }

      const [{ count }] = await database
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(...conditions));

      const publishedPosts = await database
        .select()
        .from(posts)
        .where(and(...conditions))
        .orderBy(desc(posts.publishedAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);

      return {
        posts: publishedPosts,
        total: Number(count),
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(Number(count) / input.pageSize),
      };
    }),

  /**
   * Get single post by slug (for public article page)
   */
  getPostBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
    const post = await database.select().from(posts).where(eq(posts.slug, input.slug)).limit(1);
    if (!post || post.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "文章不存在" });
    }
    return post[0];
  }),

  /**
   * Get single post by ID (for editing)
   */
  getPostById: contentProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
    const post = await database.select().from(posts).where(eq(posts.id, input.postId)).limit(1);
    if (!post || post.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "文章不存在" });
    }
    return post[0];
  }),

  /**
   * Create new post
   */
  createPost: contentProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().min(1),
        coverImage: z.string().optional(),
        status: z.enum(["draft", "published"]),
        publishTargets: z.array(z.enum(["corporate", "brand"])).default(["brand"]),
        category: z.string().optional(),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const newPost = {
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.status === "published" ? new Date() : null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      };

      await database.insert(posts).values(newPost);
      return { success: true };
    }),

  /**
   * Update existing post
   */
  updatePost: contentProcedure
    .input(
      z.object({
        postId: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        excerpt: z.string().optional(),
        content: z.string().min(1).optional(),
        coverImage: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        publishTargets: z.array(z.enum(["corporate", "brand"])).optional(),
        category: z.string().optional(),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const { postId, scheduledAt, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest };

      if (scheduledAt !== undefined) {
        updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      }

      // 有排程時間 → 強制 status=draft（等 cron 到時自動發布），publishedAt 不動
      // 無排程時間且 status=published → 設定 publishedAt 為現在
      // 無排程時間且 status=draft → 正常更新
      if (updates.scheduledAt) {
        updates.status = "draft";
        await database.update(posts).set(updates).where(eq(posts.id, postId));
      } else if (updates.status === "published") {
        await database
          .update(posts)
          .set({ ...updates, publishedAt: new Date() })
          .where(eq(posts.id, postId));
      } else {
        await database.update(posts).set(updates).where(eq(posts.id, postId));
      }

      return { success: true };
    }),

  /**
   * Delete post
   */
  deletePost: contentProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
      await database.delete(posts).where(eq(posts.id, input.postId));
      return { success: true };
    }),

  /**
   * Publish all scheduled posts whose scheduledAt <= now
   */
  publishScheduled: adminProcedure
    .mutation(async () => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
      const now = new Date();
      await database
        .update(posts)
        .set({
          status: "published",
          publishedAt: now,
          scheduledAt: null,
        })
        .where(
          and(
            eq(posts.status, "draft"),
            sql`${posts.scheduledAt} IS NOT NULL`,
            sql`${posts.scheduledAt} <= ${now}`,
          )
        );
      return { success: true };
    }),
});

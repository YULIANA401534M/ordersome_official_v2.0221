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

export const contentRouter = router({
  /**
   * List all posts (for content management dashboard)
   */
  listPosts: contentProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
    const allPosts = await database.select().from(posts).orderBy(desc(posts.createdAt));
    return allPosts;
  }),

  /**
   * Get published posts (for public news page)
   * Filter by publishTarget: 'corporate' or 'brand'
   */
  getPublishedPosts: publicProcedure
    .input(z.object({ publishTarget: z.enum(["corporate", "brand"]).optional() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
      
      // Build where conditions
      const conditions = [eq(posts.status, "published")];
      
      // Filter by publishTarget using JSON_CONTAINS
      if (input.publishTarget) {
        conditions.push(
          sql`JSON_CONTAINS(${posts.publishTargets}, JSON_QUOTE(${input.publishTarget}))`
        );
      }
      
      const publishedPosts = await database
        .select()
        .from(posts)
        .where(and(...conditions))
        .orderBy(desc(posts.publishedAt));
      
      return publishedPosts;
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const newPost = {
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.status === "published" ? new Date() : null,
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
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const { postId, ...updates } = input;

      // If changing status to published, set publishedAt
      if (updates.status === "published") {
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
});

import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Content Management System", () => {
  let testUserId: number;
  let testPostId: number;
  let testSlug: string;

  beforeAll(async () => {
    // Create test user with publish_content permission
    const testUser = {
      openId: `test-content-${Date.now()}`,
      name: "Content Manager",
      email: `content-test-${Date.now()}@test.com`,
      role: "manager" as const,
      passwordHash: await bcrypt.hash("testpassword", 10),
      permissions: ["publish_content"],
    };
    await db.upsertUser(testUser);
    const user = await db.getUserByEmailWithPassword(testUser.email!);
    testUserId = user!.id;
  });

  it("should create a new post", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        role: "manager",
        permissions: ["publish_content"],
      },
    } as any);

    testSlug = `test-post-${Date.now()}`;
    const result = await caller.content.createPost({
      title: "測試文章標題",
      slug: testSlug,
      excerpt: "這是測試文章的摘要",
      content: "這是測試文章的完整內容。\n\n# 標題一\n\n這是第一段內容。",
      coverImage: "https://example.com/cover.jpg",
      status: "draft",
    });

    expect(result.success).toBe(true);
  });

  it("should list all posts", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        role: "manager",
        permissions: ["publish_content"],
      },
    } as any);

    const posts = await caller.content.listPosts();
    expect(posts.length).toBeGreaterThan(0);
    const testPost = posts.find((p: any) => p.slug === testSlug);
    expect(testPost).toBeDefined();
    testPostId = testPost!.id;
  });

  it("should get post by slug", async () => {
    const caller = appRouter.createCaller({
      user: null,
    } as any);

    // First publish the post
    const managerCaller = appRouter.createCaller({
      user: {
        id: testUserId,
        role: "manager",
        permissions: ["publish_content"],
      },
    } as any);

    await managerCaller.content.updatePost({
      postId: testPostId,
      status: "published",
    });

    // Now try to get it as public user
    const post = await caller.content.getPostBySlug({ slug: testSlug });
    expect(post.title).toBe("測試文章標題");
    expect(post.status).toBe("published");
  });

  it("should update post", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        role: "manager",
        permissions: ["publish_content"],
      },
    } as any);

    const result = await caller.content.updatePost({
      postId: testPostId,
      title: "更新後的標題",
      content: "更新後的內容",
    });

    expect(result.success).toBe(true);

    const updatedPost = await caller.content.getPostById({ postId: testPostId });
    expect(updatedPost.title).toBe("更新後的標題");
  });

  it("should delete post", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        role: "manager",
        permissions: ["publish_content"],
      },
    } as any);

    const result = await caller.content.deletePost({ postId: testPostId });
    expect(result.success).toBe(true);
  });

  it("should deny access to users without permission", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        role: "customer",
        permissions: [],
      },
    } as any);

    await expect(caller.content.listPosts()).rejects.toThrow("需要內容發布權限");
  });
});

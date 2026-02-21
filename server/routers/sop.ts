import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  sopCategories,
  sopDocuments,
  sopReadReceipts,
  equipmentRepairs,
  dailyChecklists,
  dailyChecklistItems,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// 管理員 Procedure（super_admin 或 manager）
const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

export const sopRouter = router({
  // ===== SOP 分類 =====
  getCategories: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(sopCategories).orderBy(sopCategories.displayOrder);
  }),

  createCategory: managerProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      displayOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(sopCategories).values(input);
      return { success: true };
    }),

  // ===== SOP 文件 =====
  getDocuments: protectedProcedure
    .input(z.object({ categoryId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const query = db.select().from(sopDocuments).orderBy(desc(sopDocuments.createdAt));
      if (input.categoryId) {
        return db
          .select()
          .from(sopDocuments)
          .where(
            and(
              eq(sopDocuments.categoryId, input.categoryId),
              eq(sopDocuments.status, "published")
            )
          )
          .orderBy(desc(sopDocuments.createdAt));
      }
      return db
        .select()
        .from(sopDocuments)
        .where(eq(sopDocuments.status, "published"))
        .orderBy(desc(sopDocuments.createdAt));
    }),

  getAllDocuments: managerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(sopDocuments).orderBy(desc(sopDocuments.createdAt));
  }),

  getDocumentById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const results = await db
        .select()
        .from(sopDocuments)
        .where(eq(sopDocuments.id, input.id))
        .limit(1);
      if (!results[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return results[0];
    }),

  createDocument: managerProcedure
    .input(z.object({
      categoryId: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
      pdfUrl: z.string().optional(),
      version: z.string().default("1.0"),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(sopDocuments).values({ ...input, authorId: ctx.user.id });
      return { success: true };
    }),

  updateDocument: managerProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      pdfUrl: z.string().optional(),
      version: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(sopDocuments).set(data).where(eq(sopDocuments.id, id));
      return { success: true };
    }),

  deleteDocument: managerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(sopDocuments)
        .set({ status: "archived" })
        .where(eq(sopDocuments.id, input.id));
      return { success: true };
    }),

  // ===== 閱讀簽收 =====
  markAsRead: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // 檢查是否已簽收
      const existing = await db
        .select()
        .from(sopReadReceipts)
        .where(
          and(
            eq(sopReadReceipts.documentId, input.documentId),
            eq(sopReadReceipts.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (existing[0]) {
        await db
          .update(sopReadReceipts)
          .set({ acknowledged: true })
          .where(eq(sopReadReceipts.id, existing[0].id));
      } else {
        await db.insert(sopReadReceipts).values({
          documentId: input.documentId,
          userId: ctx.user.id,
          acknowledged: true,
        });
      }
      return { success: true };
    }),

  getReadStatus: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { isRead: false };
      const result = await db
        .select()
        .from(sopReadReceipts)
        .where(
          and(
            eq(sopReadReceipts.documentId, input.documentId),
            eq(sopReadReceipts.userId, ctx.user.id)
          )
        )
        .limit(1);
      return { isRead: !!result[0]?.acknowledged };
    }),

  // ===== 設備報修 =====
  getRepairs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // 管理員看全部，員工看自己的
    if (ctx.user.role === "super_admin" || ctx.user.role === "manager") {
      return db.select().from(equipmentRepairs).orderBy(desc(equipmentRepairs.createdAt));
    }
    return db
      .select()
      .from(equipmentRepairs)
      .where(eq(equipmentRepairs.reportedBy, ctx.user.id))
      .orderBy(desc(equipmentRepairs.createdAt));
  }),

  createRepair: protectedProcedure
    .input(z.object({
      storeId: z.number(),
      equipmentName: z.string().min(1),
      issueDescription: z.string().min(1),
      urgency: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(equipmentRepairs).values({ ...input, reportedBy: ctx.user.id });
      return { success: true };
    }),

  updateRepairStatus: managerProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_progress", "resolved", "cancelled"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "resolved") {
        updateData.resolvedAt = new Date();
      }
      await db.update(equipmentRepairs).set(updateData).where(eq(equipmentRepairs.id, id));
      return { success: true };
    }),

  // ===== 每日檢查表 =====
  getChecklists: protectedProcedure
    .input(z.object({
      storeId: z.number().optional(),
      checklistType: z.enum(["opening", "closing"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(dailyChecklists).orderBy(desc(dailyChecklists.createdAt)).limit(50);
    }),

  createChecklist: protectedProcedure
    .input(z.object({
      storeId: z.number(),
      checklistType: z.enum(["opening", "closing"]),
      checkDate: z.string(), // YYYY-MM-DD
      notes: z.string().optional(),
      items: z.array(z.object({
        itemName: z.string(),
        isChecked: z.boolean().default(false),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(dailyChecklists).values({
        storeId: input.storeId,
        checklistType: input.checklistType,
        checkedBy: ctx.user.id,
        checkDate: new Date(input.checkDate),
        notes: input.notes,
      });
      // 插入 items（MySQL 不支援 returning，需要另外查詢）
      const inserted = await db
        .select()
        .from(dailyChecklists)
        .orderBy(desc(dailyChecklists.id))
        .limit(1);
      if (inserted[0] && input.items.length > 0) {
        await db.insert(dailyChecklistItems).values(
          input.items.map((item) => ({ ...item, checklistId: inserted[0].id }))
        );
      }
      return { success: true };
    }),

  getChecklistItems: protectedProcedure
    .input(z.object({ checklistId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(dailyChecklistItems)
        .where(eq(dailyChecklistItems.checklistId, input.checklistId));
    }),

  updateChecklistItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      isChecked: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(dailyChecklistItems).set(data).where(eq(dailyChecklistItems.id, id));
      return { success: true };
    }),
});

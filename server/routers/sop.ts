import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure as managerProcedure, protectedProcedure, router } from "../_core/trpc";
import { isAdminUser } from "@shared/access-control";
import { getDb } from "../db";
import {
  sopCategories,
  sopDocuments,
  sopReadReceipts,
  sopPermissions,
  equipmentRepairs,
  dailyChecklists,
  dailyChecklistItems,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, asc, or, inArray } from "drizzle-orm";

const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/9lru5kvflpvyglz9dtpe9b02v97wkdd9";

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

  updateCategory: managerProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(sopCategories).set(data).where(eq(sopCategories.id, id));
      return { success: true };
    }),

  // ===== SOP 文件 =====
  // 員工查詢：只看 published + isVisibleToStaff=true
  // 管理員查詢：看全部 published（含隱藏的）
  getDocuments: protectedProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      sortBy: z.enum(["newest", "oldest"]).default("newest"),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const isManager = isAdminUser(ctx.user);

      // 管理員可看所有 published，員工只看 isVisibleToStaff=true
      const baseConditions = isManager
        ? [eq(sopDocuments.status, "published")]
        : [eq(sopDocuments.status, "published"), eq(sopDocuments.isVisibleToStaff, true)];

      const orderClause = input.sortBy === "oldest"
        ? asc(sopDocuments.createdAt)
        : desc(sopDocuments.createdAt);

      if (input.categoryId) {
        return db
          .select()
          .from(sopDocuments)
          .where(and(eq(sopDocuments.categoryId, input.categoryId), ...baseConditions))
          .orderBy(orderClause);
      }
      return db
        .select()
        .from(sopDocuments)
        .where(and(...baseConditions))
        .orderBy(orderClause);
    }),

  // 管理員：查看所有文件（包含 draft/archived）
  getAllDocuments: managerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(sopDocuments).orderBy(desc(sopDocuments.createdAt));
  }),

  getDocumentById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const results = await db
        .select()
        .from(sopDocuments)
        .where(eq(sopDocuments.id, input.id))
        .limit(1);
      if (!results[0]) throw new TRPCError({ code: "NOT_FOUND" });

      // 員工不能看隱藏文件
      const doc = results[0];
      const isManager = isAdminUser(ctx.user);
      if (!isManager && !doc.isVisibleToStaff) {
        throw new TRPCError({ code: "FORBIDDEN", message: "此文件目前不對員工開放" });
      }
      return doc;
    }),

  createDocument: managerProcedure
    .input(z.object({
      categoryId: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
      pdfUrl: z.string().optional(),
      version: z.string().default("1.0"),
      status: z.enum(["draft", "published", "archived"]).default("published"),
      isVisibleToStaff: z.boolean().default(true),
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
      isVisibleToStaff: z.boolean().optional(),
      categoryId: z.number().optional(),
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
      // 先刪除關聯的閱讀簽收記錄，再刪除文件本身
      await db.delete(sopReadReceipts).where(eq(sopReadReceipts.documentId, input.id));
      await db.delete(sopDocuments).where(eq(sopDocuments.id, input.id));
      return { success: true };
    }),

  // 排序：更新文件的 displayOrder
  reorderDocuments: managerProcedure
    .input(z.array(z.object({ id: z.number(), displayOrder: z.number() })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await Promise.all(
        input.map(({ id, displayOrder }) =>
          db.update(sopDocuments)
            .set({ displayOrder })
            .where(eq(sopDocuments.id, id))
        )
      );
      return { success: true };
    }),

  // ===== 閱讀簽收 =====
  markAsRead: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
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

  // 管理員：查看某文件的所有閱讀記錄
  getDocumentReadReceipts: managerProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(sopReadReceipts)
        .where(eq(sopReadReceipts.documentId, input.documentId))
        .orderBy(desc(sopReadReceipts.readAt));
    }),

  // ===== 設備報修 =====
  getRepairs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (isAdminUser(ctx.user)) {
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
      category: z.string().default("其他"),
      issueDescription: z.string().min(1),
      urgency: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      imageUrl: z.string().optional(),
      storeName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { storeName, ...dbInput } = input;

      // 寫入資料庫
      await db.insert(equipmentRepairs).values({ ...dbInput, reportedBy: ctx.user.id });

      // 串接 Make Webhook（非同步，不影響主流程）
      const webhookPayload = {
        event_type: "repair_report",
        store_name: storeName || `門市 #${input.storeId}`,
        reporter_name: ctx.user.name || ctx.user.email || `用戶 #${ctx.user.id}`,
        category: input.category,
        urgency: input.urgency,
        issue_description: input.issueDescription,
        image_url: input.imageUrl || "",
      };

      // 非同步觸發 Webhook，不等待結果
      fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      }).catch((err) => {
        console.error("[Make Webhook] Failed to send repair report:", err);
      });

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
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const isManager = isAdminUser(ctx.user);
      if (isManager) {
        return db.select().from(dailyChecklists).orderBy(desc(dailyChecklists.createdAt)).limit(100);
      }
      return db
        .select()
        .from(dailyChecklists)
        .where(eq(dailyChecklists.checkedBy, ctx.user.id))
        .orderBy(desc(dailyChecklists.createdAt))
        .limit(30);
    }),

  createChecklist: protectedProcedure
    .input(z.object({
      storeId: z.number(),
      checklistType: z.enum(["opening", "closing"]),
      checkDate: z.string(),
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

  // ===== SOP 權限管理 =====
  /** 取得所有權限設定（管理員專用） */
  getSopPermissions: managerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const perms = await db.select().from(sopPermissions);
    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users);
    const cats = await db.select().from(sopCategories).orderBy(sopCategories.displayOrder);
    const docs = await db
      .select({ id: sopDocuments.id, title: sopDocuments.title, categoryId: sopDocuments.categoryId })
      .from(sopDocuments);
    return { permissions: perms, users: allUsers, categories: cats, documents: docs };
  }),

  /** 更新權限：先刪除目標的所有權限，再批次寫入 */
  updateSopPermissions: managerProcedure
    .input(z.object({
      targetType: z.enum(["role", "user"]),
      targetRole: z.string().optional(),
      targetUserId: z.number().optional(),
      grants: z.array(z.object({
        scopeType: z.enum(["category", "document"]),
        categoryId: z.number().optional(),
        documentId: z.number().optional(),
        isGranted: z.boolean(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.targetType === "role" && input.targetRole) {
        await db.delete(sopPermissions).where(
          and(
            eq(sopPermissions.targetType, "role"),
            eq(sopPermissions.targetRole, input.targetRole)
          )
        );
      } else if (input.targetType === "user" && input.targetUserId) {
        await db.delete(sopPermissions).where(
          and(
            eq(sopPermissions.targetType, "user"),
            eq(sopPermissions.targetUserId, input.targetUserId)
          )
        );
      }
      if (input.grants.length > 0) {
        await db.insert(sopPermissions).values(
          input.grants.map((g) => ({
            targetType: input.targetType,
            targetRole: input.targetRole ?? null,
            targetUserId: input.targetUserId ?? null,
            scopeType: g.scopeType,
            categoryId: g.categoryId ?? null,
            documentId: g.documentId ?? null,
            isGranted: g.isGranted,
          }))
        );
      }
      return { success: true };
    }),

  /** 取得當前登入用戶可存取的 SOP 分類（權限控制） */
  getAccessibleCategories: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const isManager = isAdminUser(ctx.user);
    if (isManager) {
      return db.select().from(sopCategories).orderBy(sopCategories.displayOrder);
    }
    // 查詢角色權限 + 用戶權限
    const rolePerms = await db.select().from(sopPermissions).where(
      and(
        eq(sopPermissions.targetType, "role"),
        eq(sopPermissions.targetRole, ctx.user.role),
        eq(sopPermissions.scopeType, "category"),
        eq(sopPermissions.isGranted, true)
      )
    );
    const userPerms = await db.select().from(sopPermissions).where(
      and(
        eq(sopPermissions.targetType, "user"),
        eq(sopPermissions.targetUserId, ctx.user.id),
        eq(sopPermissions.scopeType, "category"),
        eq(sopPermissions.isGranted, true)
      )
    );
    const allPerms = [...rolePerms, ...userPerms];
    // 權限表為空時，預設返回所有分類
    if (allPerms.length === 0) {
      return db.select().from(sopCategories).orderBy(sopCategories.displayOrder);
    }
    const catIds = Array.from(new Set(allPerms.map((p) => p.categoryId).filter(Boolean) as number[]));
    if (catIds.length === 0) return [];
    return db.select().from(sopCategories)
      .where(inArray(sopCategories.id, catIds))
      .orderBy(sopCategories.displayOrder);
  }),
});

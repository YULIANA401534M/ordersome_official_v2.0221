import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { hashPassword, verifyPassword } from "../../lib/password";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../../_core/cookies";
import { sendMail } from "../../mail";

const PORTAL_TENANT_ID = 90004;

/** Portal 客戶 procedure：要求 tenantId=90004 且已綁定 dyCustomerId */
const portalCustomerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (
    ctx.user.tenantId !== PORTAL_TENANT_ID ||
    (ctx.user as any).dyCustomerId == null
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要大永客戶帳號" });
  }
  return next({ ctx });
});

async function createPortalSession(ctx: any, user: { openId: string; id: number; name: string | null; email: string | null; role: string; tenantId: number | null }) {
  const { sdk } = await import("../../_core/sdk");
  const sessionToken = await sdk.createSessionToken(user.openId, {
    expiresInMs: 30 * 24 * 60 * 60 * 1000,
    name: user.name || user.email || "",
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } };
}

export const dyPortalRouter = router({
  // 1. 帳號密碼註冊
  register: publicProcedure
    .input(
      z.object({
        loginEmail: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // a. 檢查 dy_customers 是否已存在
      const [custRows] = await client.execute(
        `SELECT id FROM dy_customers WHERE loginEmail=? AND tenantId=?`,
        [input.loginEmail, PORTAL_TENANT_ID]
      );
      let dyCustomerId: number;

      if ((custRows as any[]).length > 0) {
        dyCustomerId = (custRows as any[])[0].id;
      } else {
        // b. INSERT dy_customers
        const [custResult] = await client.execute(
          `INSERT INTO dy_customers
           (tenantId, name, phone, loginEmail, customerLevel, isPortalActive, status, createdAt, updatedAt)
           VALUES (?,?,?,?,'retail',TRUE,'active',NOW(),NOW())`,
          [PORTAL_TENANT_ID, input.name, input.phone ?? null, input.loginEmail]
        );
        dyCustomerId = (custResult as any).insertId;
      }

      // c. 檢查 users 是否已存在
      const [userRows] = await client.execute(
        `SELECT id, openId, name, email, role, tenantId FROM users WHERE email=?`,
        [input.loginEmail]
      );
      if ((userRows as any[]).length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "此 Email 已註冊" });
      }

      // d. INSERT users
      const openId = `portal_${PORTAL_TENANT_ID}_${Date.now()}`;
      const passwordHash = await hashPassword(input.password);
      await client.execute(
        `INSERT INTO users
         (tenantId, openId, name, email, role, passwordHash, dyCustomerId, loginMethod, createdAt, updatedAt)
         VALUES (?,?,?,?,'customer',?,?,'password',NOW(),NOW())`,
        [PORTAL_TENANT_ID, openId, input.name, input.loginEmail, passwordHash, dyCustomerId]
      );

      // e. 取出剛建立的 user 並建立 session
      const [newUserRows] = await client.execute(
        `SELECT id, openId, name, email, role, tenantId FROM users WHERE openId=?`,
        [openId]
      );
      const newUser = (newUserRows as any[])[0];
      return createPortalSession(ctx, newUser);
    }),

  // 2. LINE 登入 / 自動註冊
  loginWithLine: publicProcedure
    .input(
      z.object({
        lineUserId: z.string(),
        lineName: z.string().optional(),
        lineAvatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // a. 查 dy_customers
      const [custRows] = await client.execute(
        `SELECT id FROM dy_customers WHERE lineUserId=? AND tenantId=?`,
        [input.lineUserId, PORTAL_TENANT_ID]
      );
      let dyCustomerId: number;

      if ((custRows as any[]).length > 0) {
        dyCustomerId = (custRows as any[])[0].id;
      } else {
        // b. INSERT dy_customers
        const [custResult] = await client.execute(
          `INSERT INTO dy_customers
           (tenantId, name, lineUserId, customerLevel, isPortalActive, status, createdAt, updatedAt)
           VALUES (?,?,?,'retail',TRUE,'active',NOW(),NOW())`,
          [PORTAL_TENANT_ID, input.lineName ?? "LINE用戶", input.lineUserId]
        );
        dyCustomerId = (custResult as any).insertId;
      }

      // c. 查 users
      const [userRows] = await client.execute(
        `SELECT id, openId, name, email, role, tenantId FROM users
         WHERE lineId=? AND tenantId=?`,
        [input.lineUserId, PORTAL_TENANT_ID]
      );
      let user: any;

      if ((userRows as any[]).length > 0) {
        user = (userRows as any[])[0];
      } else {
        // d. INSERT users
        const openId = `line_portal_${PORTAL_TENANT_ID}_${input.lineUserId}`;
        await client.execute(
          `INSERT INTO users
           (tenantId, openId, name, lineId, role, dyCustomerId, loginMethod, avatarUrl, createdAt, updatedAt)
           VALUES (?,?,?,?,'customer',?,'line',?,NOW(),NOW())`,
          [PORTAL_TENANT_ID, openId, input.lineName ?? "LINE用戶", input.lineUserId, dyCustomerId, input.lineAvatarUrl ?? null]
        );
        const [newRows] = await client.execute(
          `SELECT id, openId, name, email, role, tenantId FROM users WHERE openId=?`,
          [openId]
        );
        user = (newRows as any[])[0];
      }

      return createPortalSession(ctx, user);
    }),

  // 3. 我的資料
  me: portalCustomerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const client = (db as any).$client;

    const dyCustomerId = (ctx.user as any).dyCustomerId;
    const [custRows] = await client.execute(
      `SELECT * FROM dy_customers WHERE id=? AND tenantId=?`,
      [dyCustomerId, PORTAL_TENANT_ID]
    );
    const customer = (custRows as any[])[0];
    if (!customer) throw new TRPCError({ code: "NOT_FOUND" });

    const [boxRows] = await client.execute(
      `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
      [PORTAL_TENANT_ID, dyCustomerId]
    );
    const boxBalance = (boxRows as any[])[0]?.currentBalance ?? 0;

    return { customer, boxBalance };
  }),

  // 4. 我的訂單
  myOrders: portalCustomerProcedure
    .input(
      z.object({
        page: z.number().default(1),
        month: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const dyCustomerId = (ctx.user as any).dyCustomerId;
      const offset = (input.page - 1) * 20;
      let sql = `SELECT o.* FROM dy_orders o
                 WHERE o.customerId=? AND o.tenantId=?`;
      const params: any[] = [dyCustomerId, PORTAL_TENANT_ID];

      if (input.month) {
        sql += " AND DATE_FORMAT(o.deliveryDate,'%Y-%m') = ?";
        params.push(input.month);
      }
      sql += ` ORDER BY o.createdAt DESC LIMIT 20 OFFSET ${offset}`;

      const [orderRows] = await client.execute(sql, params);
      const orders = orderRows as any[];

      // 取各訂單品項
      for (const order of orders) {
        const [itemRows] = await client.execute(
          `SELECT oi.*, p.name AS productName FROM dy_order_items oi
           JOIN dy_products p ON oi.productId = p.id
           WHERE oi.orderId=?`,
          [order.id]
        );
        order.items = itemRows;
      }

      return orders;
    }),

  // 5. 我的應收帳款
  myReceivables: portalCustomerProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const dyCustomerId = (ctx.user as any).dyCustomerId;
      let sql = `SELECT * FROM dy_ar_records
                 WHERE customerId=? AND tenantId=?`;
      const params: any[] = [dyCustomerId, PORTAL_TENANT_ID];

      if (input.status) { sql += " AND status=?"; params.push(input.status); }
      sql += " ORDER BY dueDate DESC LIMIT 50";

      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 6. 客戶新增備註至 AR
  addCustomerNote: portalCustomerProcedure
    .input(z.object({ arId: z.number(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const dyCustomerId = (ctx.user as any).dyCustomerId;
      await (db as any).$client.execute(
        `UPDATE dy_ar_records SET customerNote=?, updatedAt=NOW()
         WHERE id=? AND customerId=? AND tenantId=?`,
        [input.note, input.arId, dyCustomerId, PORTAL_TENANT_ID]
      );
      return { success: true };
    }),

  // 7. 月結對帳單
  myStatement: portalCustomerProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const dyCustomerId = (ctx.user as any).dyCustomerId;
      const monthStr = String(input.month).padStart(2, "0");
      const startDate = `${input.year}-${monthStr}-01`;
      const endDate = `${input.year}-${monthStr}-31`;

      const [custRows] = await client.execute(
        `SELECT * FROM dy_customers WHERE id=? AND tenantId=?`,
        [dyCustomerId, PORTAL_TENANT_ID]
      );
      const customer = (custRows as any[])[0];
      if (!customer) throw new TRPCError({ code: "NOT_FOUND" });

      const [orderRows] = await client.execute(
        `SELECT * FROM dy_orders
         WHERE tenantId=? AND customerId=? AND deliveryDate BETWEEN ? AND ?
           AND status != 'cancelled'
         ORDER BY deliveryDate ASC`,
        [PORTAL_TENANT_ID, dyCustomerId, startDate, endDate]
      );
      const orders = orderRows as any[];

      const [arRows] = await client.execute(
        `SELECT * FROM dy_ar_records
         WHERE tenantId=? AND customerId=? AND dueDate BETWEEN ? AND ?
         ORDER BY dueDate ASC`,
        [PORTAL_TENANT_ID, dyCustomerId, startDate, endDate]
      );
      const arRecords = arRows as any[];

      const [boxRows] = await client.execute(
        `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
        [PORTAL_TENANT_ID, dyCustomerId]
      );
      const boxBalance = (boxRows as any[])[0]?.currentBalance ?? 0;

      const totalAmount = orders.reduce((s: number, o: any) => s + parseFloat(o.totalAmount ?? 0), 0);
      const paidAmount = arRecords.reduce((s: number, r: any) => s + parseFloat(r.paidAmount ?? 0), 0);

      return {
        customer,
        orders,
        totalAmount,
        paidAmount,
        unpaidAmount: totalAmount - paidAmount,
        boxBalance,
        arRecords,
      };
    }),

  // 8. 我的報價
  myPrices: portalCustomerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const client = (db as any).$client;

    const dyCustomerId = (ctx.user as any).dyCustomerId;

    // 先確認 customerLevel
    const [custRows] = await client.execute(
      `SELECT customerLevel FROM dy_customers WHERE id=? AND tenantId=?`,
      [dyCustomerId, PORTAL_TENANT_ID]
    );
    const customerLevel = (custRows as any[])[0]?.customerLevel ?? "retail";

    if (customerLevel === "retail") {
      // retail 客戶直接回傳產品定價
      const [rows] = await client.execute(
        `SELECT id AS productId, name AS productName, price, unit FROM dy_products
         WHERE tenantId=? AND isActive=1 ORDER BY name`,
        [PORTAL_TENANT_ID]
      );
      return rows as any[];
    }

    // store/supplier 使用客製化報價
    const [rows] = await client.execute(
      `SELECT cp.customerId, cp.productId, cp.price, p.name AS productName, p.unit
       FROM dy_customer_prices cp
       JOIN dy_products p ON cp.productId = p.id
       WHERE cp.customerId=? AND p.tenantId=?
       ORDER BY p.name`,
      [dyCustomerId, PORTAL_TENANT_ID]
    );
    return rows as any[];
  }),

  // 9. 修改密碼
  changePassword: portalCustomerProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [userRows] = await client.execute(
        `SELECT id, passwordHash FROM users WHERE id=?`,
        [ctx.user.id]
      );
      const user = (userRows as any[])[0];
      if (!user?.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "此帳號未設定密碼" });
      }

      const isValid = await verifyPassword(input.oldPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "舊密碼錯誤" });
      }

      const newHash = await hashPassword(input.newPassword);
      await client.execute(
        `UPDATE users SET passwordHash=?, updatedAt=NOW() WHERE id=?`,
        [newHash, ctx.user.id]
      );
      return { success: true };
    }),

  // 10. 忘記密碼 — 發送重設連結
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [custRows] = await client.execute(
        "SELECT id, name FROM dy_customers WHERE loginEmail = ? AND tenantId = ? AND isPortalActive = 1 LIMIT 1",
        [input.email, PORTAL_TENANT_ID]
      );
      const customer = (custRows as any[])[0];
      // 不管有沒有找到都回傳成功，避免 email enumeration
      if (!customer) return { success: true };

      const token = crypto.randomUUID().replace(/-/g, "");
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 分鐘

      await client.execute(
        "UPDATE dy_customers SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?",
        [token, expiry, customer.id]
      );

      const baseUrl = process.env.BASE_URL || "https://ordersome.com.tw";
      const resetUrl = `${baseUrl}/dayone/portal/reset-password?token=${token}`;

      await sendMail({
        to: input.email,
        subject: "大永蛋品客戶入口 — 密碼重設",
        html: `<p>${customer.name} 您好，</p>
               <p>請點擊以下連結重設密碼（30 分鐘內有效）：</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>若非您本人操作，請忽略此信。</p>`,
      });

      return { success: true };
    }),

  // 11. 重設密碼 — 用 token 設定新密碼
  resetPasswordWithToken: publicProcedure
    .input(z.object({ token: z.string(), newPwd: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const [custRows] = await client.execute(
        "SELECT id, loginEmail FROM dy_customers WHERE resetToken = ? AND resetTokenExpiry > NOW() AND tenantId = ? LIMIT 1",
        [input.token, PORTAL_TENANT_ID]
      );
      const customer = (custRows as any[])[0];
      if (!customer) throw new TRPCError({ code: "BAD_REQUEST", message: "連結已失效或不存在" });

      const hash = await hashPassword(input.newPwd);

      // 更新 users 表的 passwordHash（Portal 登入走 auth.loginWithPassword → users 表）
      await client.execute(
        "UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE email = ? AND tenantId = ?",
        [hash, customer.loginEmail, PORTAL_TENANT_ID]
      );

      // 清除 resetToken
      await client.execute(
        "UPDATE dy_customers SET resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?",
        [customer.id]
      );

      return { success: true };
    }),

  // 12. 綁定 LINE
  bindLine: portalCustomerProcedure
    .input(z.object({ lineUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const dyCustomerId = (ctx.user as any).dyCustomerId;
      await client.execute(
        `UPDATE users SET lineId=?, updatedAt=NOW() WHERE id=?`,
        [input.lineUserId, ctx.user.id]
      );
      await client.execute(
        `UPDATE dy_customers SET lineUserId=?, updatedAt=NOW() WHERE id=? AND tenantId=?`,
        [input.lineUserId, dyCustomerId, PORTAL_TENANT_ID]
      );
      return { success: true };
    }),
});

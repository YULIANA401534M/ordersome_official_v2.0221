/**
 * LIFF 客戶下單 API
 * tRPC router: dayone.liff.createOrder
 * 對應舊 REST 路徑概念：POST /api/dayone/liff-order
 *
 * 邏輯：
 * 1. 從 input 取得 lineId、items
 * 2. 用 lineId 查 dy_customers（tenantId=90004）
 * 3. 查 dy_customer_prices 取得客製定價；查不到就 null（後台再確認）
 * 4. 寫入 dy_orders（orderSource='liff'）
 * 5. 寫入 dy_order_items
 * 6. 回傳 { success: true, orderId }
 */
import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";

// 租戶對應表：tenant slug → tenantId
const TENANT_MAP: Record<string, number> = {
  dayone: 90004,
};

const DEFAULT_TENANT_ID = 90004;

function resolveTenantId(tenant?: string): number {
  if (!tenant) return DEFAULT_TENANT_ID;
  return TENANT_MAP[tenant] ?? DEFAULT_TENANT_ID;
}

// 手機號碼 normalize：去掉空白、dash，補 0 開頭（統一比對格式）
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-]/g, "").replace(/^\+886/, "0");
}

export const liffRouter = router({
  // 檢查 lineId 是否已綁定客戶
  checkBinding: publicProcedure
    .input(z.object({ lineId: z.string().min(1), tenant: z.string().optional() }))
    .query(async ({ input }) => {
      const tenantId = resolveTenantId(input.tenant);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        `SELECT id, name FROM dy_customers WHERE tenantId = ? AND lineId = ? AND status = 'active' LIMIT 1`,
        [tenantId, input.lineId]
      );
      const customer = (rows as any[])[0];
      if (!customer) return { bound: false };
      return { bound: true, customerId: customer.id as number, customerName: customer.name as string };
    }),

  // 首次綁定：用手機號找客戶，寫入 lineId
  bindLineId: publicProcedure
    .input(z.object({
      lineId: z.string().min(1),
      phone: z.string().min(1),
      tenant: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const tenantId = resolveTenantId(input.tenant);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      const normalizedInput = normalizePhone(input.phone);

      // 查所有 active 客戶的 phone + lineId，比對 normalize 後的值
      const [rows] = await client.execute(
        `SELECT id, name, phone, lineId FROM dy_customers WHERE tenantId = ? AND status = 'active' AND phone IS NOT NULL`,
        [tenantId]
      );
      const customers = rows as any[];
      const allMatched = customers.filter(
        (c) => normalizePhone(String(c.phone ?? "")) === normalizedInput
      );

      if (allMatched.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到此手機號碼對應的客戶，請聯絡業務確認",
        });
      }

      // 重複電話：無法確定是哪個客戶，請業務處理
      if (allMatched.length > 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "此手機號碼對應多筆客戶資料，請聯絡業務協助綁定",
        });
      }

      const matched = allMatched[0];

      // 確認此客戶尚未被其他 LINE 帳號綁定
      if (matched.lineId && matched.lineId !== input.lineId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "此手機號碼已綁定其他 LINE 帳號，請聯絡業務",
        });
      }

      await client.execute(
        `UPDATE dy_customers SET lineId = ?, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [input.lineId, matched.id, tenantId]
      );

      return { success: true, customerId: matched.id as number, customerName: matched.name as string };
    }),

  // 公開查詢：取得指定租戶所有上架商品（供 LIFF 下單頁使用）
  getProducts: publicProcedure
    .input(z.object({ tenant: z.string().optional() }))
    .query(async ({ input }) => {
    const tenantId = resolveTenantId(input.tenant);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const [rows] = await (db as any).$client.execute(
      `SELECT p.id, p.code, p.name, p.unit, p.defaultPrice, p.imageUrl,
              COALESCE(i.currentQty, -1) AS currentQty
       FROM dy_products p
       LEFT JOIN dy_inventory i ON i.productId = p.id AND i.tenantId = p.tenantId
       WHERE p.tenantId = ? AND p.isActive = 1
       ORDER BY p.code`,
      [tenantId]
    );
    return (rows as any[]).map((r) => ({
      id: r.id as number,
      code: r.code as string,
      name: r.name as string,
      unit: r.unit as string,
      defaultPrice: Number(r.defaultPrice),
      imageUrl: (r.imageUrl as string | null) ?? null,
      currentQty: Number(r.currentQty), // -1 = 未設定庫存（不限制）, 0 = 補貨中
    }));
  }),

  createOrder: publicProcedure
    .input(
      z.object({
        lineId: z.string().min(1),
        tenant: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            qty: z.number().int().positive(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const tenantId = resolveTenantId(input.tenant);
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }
      const client = (db as any).$client;

      // 1. 查客戶（用 lineId）
      const [customerRows] = await client.execute(
        `SELECT id, name, defaultDriverId, deliveryFrequency FROM dy_customers WHERE tenantId = ? AND lineId = ? AND status = 'active' LIMIT 1`,
        [tenantId, input.lineId]
      );
      const customer = (customerRows as any[])[0];
      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `找不到 lineId=${input.lineId} 的客戶，請確認是否已綁定帳號`,
        });
      }
      const customerId: number = customer.id;

      // 2. 查各品項的客製定價（查不到就 null，後台再補）
      const resolvedItems: {
        productId: number;
        qty: number;
        unitPrice: number | null;
        subtotal: number | null;
      }[] = [];

      for (const item of input.items) {
        // 優先用客製定價，查不到就用商品主檔 defaultPrice，再查不到才存 null
        const [priceRows] = await client.execute(
          `SELECT price FROM dy_customer_prices
           WHERE tenantId = ? AND customerId = ? AND productId = ?
           ORDER BY effectiveDate DESC LIMIT 1`,
          [tenantId, customerId, item.productId]
        );
        const priceRow = (priceRows as any[])[0];

        let unitPrice: number | null = priceRow ? Number(priceRow.price) : null;

        if (unitPrice === null) {
          const [productRows] = await client.execute(
            `SELECT defaultPrice FROM dy_products WHERE tenantId = ? AND id = ? LIMIT 1`,
            [tenantId, item.productId]
          );
          const productRow = (productRows as any[])[0];
          if (productRow && Number(productRow.defaultPrice) > 0) {
            unitPrice = Number(productRow.defaultPrice);
          }
        }

        resolvedItems.push({
          productId: item.productId,
          qty: item.qty,
          unitPrice,
          subtotal: unitPrice !== null ? unitPrice * item.qty : null,
        });
      }

      // 3. 計算 totalAmount（無定價的品項暫計 0，後台補正）
      const totalAmount = resolvedItems.reduce(
        (sum, i) => sum + (i.subtotal ?? 0),
        0
      );

      // 4. 推算 deliveryDate：依 deliveryFrequency 找下一個合適的送貨日
      const freq: string = customer.deliveryFrequency ?? "daily";
      const driverId: number | null = customer.defaultDriverId ?? null;

      function nextDeliveryDate(frequency: string): string {
        // Taiwan time = UTC+8
        const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const hourTW = now.getUTCHours(); // UTC 小時即台灣時間（已加 8h）
        const todayTW = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
        // 收單截止 08:00：08:00 前下單配送日從今天開始找，08:00 後從明天開始找
        const startOffset = hourTW < 8 ? 0 : 1;
        for (let i = startOffset; i <= startOffset + 6; i++) {
          const d = new Date(todayTW.getTime() + i * 86400000);
          const dayOfWeek = d.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
          if (frequency === "D1" && [1, 3, 5].includes(dayOfWeek)) return d.toISOString().slice(0, 10);
          if (frequency === "D2" && [2, 4, 6].includes(dayOfWeek)) return d.toISOString().slice(0, 10);
          if (frequency === "daily") return d.toISOString().slice(0, 10);
        }
        // fallback
        return new Date(todayTW.getTime() + (startOffset) * 86400000).toISOString().slice(0, 10);
      }

      const deliveryDate = nextDeliveryDate(freq);
      const orderNo = `LIFF${Date.now()}`;
      const [orderResult] = await client.execute(
        `INSERT INTO dy_orders
           (tenantId, orderNo, customerId, driverId, status, orderSource, totalAmount, paidAmount, paymentStatus,
            prevBoxes, inBoxes, returnBoxes, remainBoxes, deliveryDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'pending', 'liff', ?, 0, 'unpaid', 0, 0, 0, 0, ?, NOW(), NOW())`,
        [tenantId, orderNo, customerId, driverId, totalAmount, deliveryDate]
      );
      const orderId: number = (orderResult as any).insertId;

      // 5. 寫入 dy_order_items
      for (const item of resolvedItems) {
        await client.execute(
          `INSERT INTO dy_order_items
             (tenantId, orderId, productId, qty, unitPrice, subtotal, returnQty)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [
            tenantId,
            orderId,
            item.productId,
            item.qty,
            item.unitPrice ?? 0,
            item.subtotal ?? 0,
          ]
        );
      }

      return { success: true, orderId, orderNo };
    }),
});

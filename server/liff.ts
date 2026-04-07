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

const DAYONE_TENANT_ID = 90004;

export const liffRouter = router({
  // 公開查詢：取得大永蛋品所有上架商品（供 LIFF 下單頁使用）
  getProducts: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const [rows] = await (db as any).$client.execute(
      `SELECT id, code, name, unit, defaultPrice FROM dy_products WHERE tenantId = ? AND isActive = 1 ORDER BY code`,
      [DAYONE_TENANT_ID]
    );
    return (rows as any[]).map((r) => ({
      id: r.id as number,
      code: r.code as string,
      name: r.name as string,
      unit: r.unit as string,
      defaultPrice: Number(r.defaultPrice),
    }));
  }),

  createOrder: publicProcedure
    .input(
      z.object({
        lineId: z.string().min(1),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            qty: z.number().int().positive(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }
      const client = (db as any).$client;

      // 1. 查客戶（用 lineId）
      const [customerRows] = await client.execute(
        `SELECT id, name FROM dy_customers WHERE tenantId = ? AND lineId = ? AND status = 'active' LIMIT 1`,
        [DAYONE_TENANT_ID, input.lineId]
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
        const [priceRows] = await client.execute(
          `SELECT price FROM dy_customer_prices
           WHERE tenantId = ? AND customerId = ? AND productId = ?
           ORDER BY effectiveDate DESC LIMIT 1`,
          [DAYONE_TENANT_ID, customerId, item.productId]
        );
        const priceRow = (priceRows as any[])[0];
        const unitPrice: number | null = priceRow ? Number(priceRow.price) : null;
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

      // 4. 寫入 dy_orders
      const orderNo = `LIFF${Date.now()}`;
      const [orderResult] = await client.execute(
        `INSERT INTO dy_orders
           (tenantId, orderNo, customerId, status, orderSource, totalAmount, paidAmount, paymentStatus,
            prevBoxes, inBoxes, returnBoxes, remainBoxes, createdAt, updatedAt)
         VALUES (?, ?, ?, 'pending', 'liff', ?, 0, 'unpaid', 0, 0, 0, 0, NOW(), NOW())`,
        [DAYONE_TENANT_ID, orderNo, customerId, totalAmount]
      );
      const orderId: number = (orderResult as any).insertId;

      // 5. 寫入 dy_order_items
      for (const item of resolvedItems) {
        await client.execute(
          `INSERT INTO dy_order_items
             (tenantId, orderId, productId, qty, unitPrice, subtotal, returnQty)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          [
            DAYONE_TENANT_ID,
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

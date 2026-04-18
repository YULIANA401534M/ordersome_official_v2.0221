import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export const deliveryRouter = router({

  listDeliveryOrders: adminProcedure
    .input(z.object({
      storeId: z.number().optional(),
      status: z.string().optional(),
      year: z.number(),
      month: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const mm = String(input.month).padStart(2,"0");
      const dateFrom = `${input.year}-${mm}-01`;
      let sql = `SELECT * FROM os_delivery_orders
                 WHERE tenantId=1
                 AND deliveryDate >= ? AND deliveryDate <= LAST_DAY(?)`;
      const params: any[] = [dateFrom, dateFrom];
      if (input.storeId) { sql += " AND toStoreId=?"; params.push(input.storeId); }
      if (input.status) { sql += " AND status=?"; params.push(input.status); }
      sql += " ORDER BY deliveryDate DESC, id DESC";
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  getDeliveryDetail: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const [[orders], [items]] = await Promise.all([
        (db as any).$client.execute("SELECT * FROM os_delivery_orders WHERE id=? AND tenantId=1", [input.id]),
        (db as any).$client.execute("SELECT * FROM os_delivery_items WHERE deliveryOrderId=? ORDER BY sortOrder", [input.id])
      ]);
      const order = (orders as any[])[0];
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "派車單不存在" });
      return { order, items: items as any[] };
    }),

  createDeliveryOrder: adminProcedure
    .input(z.object({
      deliveryDate: z.string(),
      procurementOrderId: z.number().optional(),
      driverName: z.string().optional(),
      toStoreId: z.number(),
      toStoreName: z.string(),
      note: z.string().optional(),
      items: z.array(z.object({
        productId: z.number().optional(),
        productName: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().optional(),
        batchPrice: z.number().optional(),
        note: z.string().optional(),
        sortOrder: z.number().default(0)
      })).min(1, "請至少填寫一個品項")
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const conn = (db as any).$client;

      try {
        const dateStr = input.deliveryDate.replace(/-/g,"");
        const [[seqRows]] = await conn.execute(
          "SELECT COUNT(*)+1 as seq FROM os_delivery_orders WHERE tenantId=1 AND DATE(deliveryDate)=?",
          [input.deliveryDate]
        );
        const seq = String((seqRows as any).seq).padStart(3,"0");
        const deliveryNo = `DO-${dateStr}-${seq}`;

        const [result] = await conn.execute(
          `INSERT INTO os_delivery_orders
            (tenantId,deliveryNo,procurementOrderId,deliveryDate,driverName,
             toStoreId,toStoreName,note,createdBy)
           VALUES (1,?,?,?,?,?,?,?,?)`,
          [deliveryNo, input.procurementOrderId ?? null, input.deliveryDate,
           input.driverName ?? null, input.toStoreId, input.toStoreName,
           input.note ?? null, ctx.user.name]
        );
        const deliveryOrderId = (result as any).insertId;

        if (input.items.length > 0) {
          const placeholders = input.items.map(() => "(?,?,?,?,?,?,?,?)").join(",");
          const flat = input.items.flatMap(item => [
            deliveryOrderId, item.productId ?? null, item.productName,
            item.quantity, item.unit ?? null, item.batchPrice ?? null,
            item.note ?? null, item.sortOrder
          ]);
          await conn.execute(
            `INSERT INTO os_delivery_items
              (deliveryOrderId,productId,productName,quantity,unit,batchPrice,note,sortOrder)
             VALUES ${placeholders}`,
            flat
          );
        }

        return { id: deliveryOrderId, deliveryNo };
      } catch (e) {
        console.error('[delivery] DB error (createDeliveryOrder):', e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "建立派車單失敗，請重試" });
      }
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending","picking","dispatched","delivered","signed"]),
      signedBy: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const [orders] = await (db as any).$client.execute(
        "SELECT * FROM os_delivery_orders WHERE id=? AND tenantId=1", [input.id]
      );
      const order = (orders as any[])[0];
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "派車單不存在" });

      const statusFlow = ["pending","picking","dispatched","delivered","signed"];
      const currentIdx = statusFlow.indexOf(order.status);
      const newIdx = statusFlow.indexOf(input.status);
      if (newIdx !== currentIdx + 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `狀態必須依序推進。目前狀態：「${order.status}」，請先執行上一步驟。` });
      }

      if (input.status === "signed") {
        if (!input.signedBy?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "請填寫簽收人姓名" });
        }
        const [items] = await (db as any).$client.execute(
          "SELECT * FROM os_delivery_items WHERE deliveryOrderId=?", [input.id]
        );
        const itemList = items as any[];
        const missingPrice = itemList.find(i => i.batchPrice === null || i.batchPrice === undefined);
        if (missingPrice) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `品項「${missingPrice.productName}」未設定批價，請先補齊批價再簽收`
          });
        }
        const totalAmount = itemList.reduce((sum, i) => sum + Number(i.quantity) * Number(i.batchPrice), 0);

        const conn = (db as any).$client;
        try {
          await conn.execute(
            "UPDATE os_delivery_orders SET status=?,signedAt=NOW(),signedBy=?,totalAmount=? WHERE id=?",
            [input.status, input.signedBy, totalAmount, input.id]
          );

          const [userRows] = await conn.execute(
            "SELECT id FROM users WHERE storeId=? AND role IN ('franchisee','store_manager') AND tenantId=1 LIMIT 1",
            [order.toStoreId]
          );
          const userId = (userRows as any[])[0]?.id ?? null;

          await conn.execute(
            `INSERT INTO os_franchisee_payments
              (tenantId,userId,paymentDate,amount,direction,category,isAutoGenerated,note,createdBy)
             VALUES (1,?,?,?,'receivable','出貨帳款',1,?,?)`,
            [userId, order.deliveryDate, totalAmount,
             `派車單 ${order.deliveryNo} 自動產生，目的門市：${order.toStoreName}`,
             ctx.user.name]
          );

          if (order.procurementOrderId) {
            await conn.execute(
              "UPDATE os_procurement_orders SET status='received',updatedAt=NOW() WHERE id=? AND tenantId=1",
              [order.procurementOrderId]
            );
          }

          try {
            const [deliveryItems] = await conn.execute(
              'SELECT productName, quantity FROM os_delivery_items WHERE deliveryOrderId=?',
              [input.id]
            );

            for (const item of deliveryItems as any[]) {
              // 查是否有對應的 B類庫存記錄（os_inventory 含 supplierName）
              const [invRows] = await conn.execute(
                `SELECT i.id, i.currentQty, i.supplierName
                 FROM os_inventory i
                 JOIN os_suppliers s ON s.name = i.supplierName AND s.isActive = 1
                 WHERE i.tenantId=? AND i.productName=? AND s.deliveryType='yulian'
                 LIMIT 1`,
                [ctx.tenantId, item.productName]
              );
              if ((invRows as any[]).length === 0) continue;

              const inv = (invRows as any[])[0];
              const qtyBefore = Number(inv.currentQty);
              const qtyAfter = Math.max(0, qtyBefore - Number(item.quantity));

              await conn.execute(
                'UPDATE os_inventory SET currentQty=?, updatedAt=NOW() WHERE id=?',
                [qtyAfter, inv.id]
              );

              await conn.execute(
                `INSERT INTO os_inventory_logs
                 (tenantId, inventoryId, changeType, qty, qtyBefore, qtyAfter, refType, refId, note, createdAt)
                 VALUES (?,?,'out',?,?,?,'delivery',?,'派車單簽收出庫',NOW())`,
                [ctx.tenantId, inv.id, Number(item.quantity), qtyBefore, qtyAfter, input.id]
              );
            }
          } catch(e) {
            console.error('[庫存出庫失敗]', e);
          }

          return { success: true, totalAmount };
        } catch (e) {
          console.error('[delivery] DB error (updateStatus signed):', e);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "簽收失敗，請重試" });
        }
      } else {
        await (db as any).$client.execute(
          "UPDATE os_delivery_orders SET status=?,updatedAt=NOW() WHERE id=?",
          [input.status, input.id]
        );
        return { success: true, totalAmount: null };
      }
    }),

  createFromProcurement: adminProcedure
    .input(z.object({
      procurementOrderId: z.number(),
      deliveryDate: z.string(),
      driverName: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const [orderRows] = await (db as any).$client.execute(
        `SELECT id FROM os_procurement_orders WHERE id=? AND tenantId=? AND status IN ('confirmed','received')`,
        [input.procurementOrderId, ctx.tenantId]
      );
      if (!(orderRows as any[])[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "找不到叫貨單，或狀態需為已確認/已到貨" });

      const [items] = await (db as any).$client.execute(
        `SELECT supplierName, storeName, productName, quantity, unit, unitPrice FROM os_procurement_items WHERE procurementOrderId=?`,
        [input.procurementOrderId]
      );
      if (!(items as any[]).length) throw new TRPCError({ code: "BAD_REQUEST", message: "叫貨單沒有品項" });

      const toStoreName = ((items as any[])[0] as any).storeName || '';

      const dateStr = input.deliveryDate.replace(/-/g, '');
      const [countRows] = await (db as any).$client.execute(
        `SELECT COUNT(*) as cnt FROM os_delivery_orders WHERE tenantId=? AND deliveryNo LIKE ?`,
        [ctx.tenantId, `DO-${dateStr}%`]
      );
      const seq = String(((countRows as any[])[0] as any).cnt + 1).padStart(3, '0');
      const deliveryNo = `DO-${dateStr}-${seq}`;

      const [result] = await (db as any).$client.execute(
        `INSERT INTO os_delivery_orders (tenantId, deliveryNo, deliveryDate, toStoreName, driverName, status, note, procurementOrderId, createdAt, updatedAt) VALUES (?,?,?,?,?,'pending',?,?,NOW(),NOW())`,
        [ctx.tenantId, deliveryNo, input.deliveryDate, toStoreName, input.driverName, input.note || null, input.procurementOrderId]
      );
      const orderId = (result as any).insertId;

      for (const item of items as any[]) {
        await (db as any).$client.execute(
          `INSERT INTO os_delivery_items (deliveryOrderId, productName, quantity, unit, batchPrice, sortOrder) VALUES (?,?,?,?,?,0)`,
          [orderId, item.productName, Number(item.quantity), item.unit, Number(item.unitPrice) || 0]
        );
      }

      return { deliveryNo, orderId, itemCount: (items as any[]).length };
    }),

  getMonthStats: adminProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const mm = String(input.month).padStart(2,"0");
      const dateFrom = `${input.year}-${mm}-01`;
      const [rows] = await (db as any).$client.execute(
        `SELECT toStoreName, toStoreId,
          COUNT(*) as deliveryCount,
          COALESCE(SUM(CASE WHEN status='signed' THEN totalAmount ELSE 0 END),0) as signedAmount,
          COALESCE(SUM(CASE WHEN status!='signed' THEN totalAmount ELSE 0 END),0) as pendingAmount,
          COALESCE(SUM(totalAmount),0) as totalAmount
         FROM os_delivery_orders
         WHERE tenantId=1
         AND deliveryDate >= ? AND deliveryDate <= LAST_DAY(?)
         GROUP BY toStoreId, toStoreName
         ORDER BY totalAmount DESC`,
        [dateFrom, dateFrom]
      );
      return rows as any[];
    }),
});

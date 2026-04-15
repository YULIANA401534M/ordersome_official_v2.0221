import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { storagePut } from "../../storage";

const dyAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

const driverProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user.role;
  if (!["super_admin", "manager", "driver"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員或司機權限" });
  }
  return next({ ctx });
});

export const dyPurchaseReceiptRouter = router({
  // 1. 進貨單列表（管理員）
  list: dyAdminProcedure
    .input(
      z.object({
        tenantId: z.number(),
        status: z.string().optional(),
        supplierId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      let sql = `SELECT pr.*, s.name AS supplierName, d.name AS driverName
                 FROM dy_purchase_receipts pr
                 JOIN dy_suppliers s ON pr.supplierId = s.id
                 JOIN dy_drivers d ON pr.driverId = d.id
                 WHERE pr.tenantId = ?`;
      const params: any[] = [input.tenantId];

      if (input.status) { sql += " AND pr.status = ?"; params.push(input.status); }
      if (input.supplierId) { sql += " AND pr.supplierId = ?"; params.push(input.supplierId); }
      if (input.startDate) { sql += " AND pr.receiptDate >= ?"; params.push(input.startDate); }
      if (input.endDate) { sql += " AND pr.receiptDate <= ?"; params.push(input.endDate); }
      sql += " ORDER BY pr.receiptDate DESC LIMIT 50";

      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  // 2. 取得單一進貨單（管理員）
  getById: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [rows] = await (db as any).$client.execute(
        `SELECT pr.*, s.name AS supplierName, d.name AS driverName
         FROM dy_purchase_receipts pr
         JOIN dy_suppliers s ON pr.supplierId = s.id
         JOIN dy_drivers d ON pr.driverId = d.id
         WHERE pr.id=? AND pr.tenantId=?`,
        [input.id, input.tenantId]
      );
      const record = (rows as any[])[0];
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  // 3. 建立進貨單（司機）
  create: driverProcedure
    .input(
      z.object({
        tenantId: z.number(),
        supplierId: z.number(),
        receiptDate: z.string(),
        licensePlate: z.string(),
        batchNo: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            name: z.string(),
            qty: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ),
        anomalyNote: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const totalQty = input.items.reduce((s, i) => s + i.qty, 0);
      const totalAmount = input.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

      // 取得司機 ID（從 users 表對應）
      const [userRows] = await (db as any).$client.execute(
        `SELECT id FROM dy_drivers WHERE tenantId=? ORDER BY id LIMIT 1`,
        [input.tenantId]
      );
      // 嘗試從 ctx 取 driverId，fallback 查 dy_drivers
      const driverId = (ctx.user as any).driverId ?? (userRows as any[])[0]?.id ?? 0;

      const [result] = await (db as any).$client.execute(
        `INSERT INTO dy_purchase_receipts
         (tenantId, supplierId, driverId, receiptDate, licensePlate, batchNo,
          items, totalQty, totalAmount, anomalyNote, status, createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,'pending',NOW())`,
        [
          input.tenantId,
          input.supplierId,
          driverId,
          input.receiptDate,
          input.licensePlate,
          input.batchNo ?? null,
          JSON.stringify(input.items),
          totalQty,
          totalAmount,
          input.anomalyNote ?? null,
        ]
      );
      return { id: (result as any).insertId, totalQty, totalAmount };
    }),

  // 4. 供應商簽名（司機）— 上傳 base64 圖片到 R2，觸發庫存/AP連動
  sign: driverProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        signatureBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const client = (db as any).$client;

      // 取得進貨單資料
      const [prRows] = await client.execute(
        `SELECT * FROM dy_purchase_receipts WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      const pr = (prRows as any[])[0];
      if (!pr) throw new TRPCError({ code: "NOT_FOUND" });

      // 上傳簽名圖片到 R2
      const base64Data = input.signatureBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const key = `signatures/purchase/${input.tenantId}/${input.id}-${Date.now()}.png`;
      const { url: supplierSignatureUrl } = await storagePut(key, imageBuffer, "image/png");

      // 更新進貨單狀態
      await client.execute(
        `UPDATE dy_purchase_receipts
         SET supplierSignatureUrl=?, signedAt=NOW(), status='signed'
         WHERE id=? AND tenantId=?`,
        [supplierSignatureUrl, input.id, input.tenantId]
      );

      // 連動 a: 更新庫存
      const items = typeof pr.items === "string" ? JSON.parse(pr.items) : pr.items;
      for (const item of items) {
        const [invRows] = await client.execute(
          `SELECT id, currentQty FROM dy_inventory WHERE tenantId=? AND productId=?`,
          [input.tenantId, item.productId]
        );
        if ((invRows as any[]).length > 0) {
          await client.execute(
            `UPDATE dy_inventory SET currentQty = currentQty + ?, updatedAt=NOW()
             WHERE tenantId=? AND productId=?`,
            [item.qty, input.tenantId, item.productId]
          );
        } else {
          await client.execute(
            `INSERT INTO dy_inventory (tenantId, productId, currentQty, updatedAt)
             VALUES (?,?,?,NOW())`,
            [input.tenantId, item.productId, item.qty]
          );
        }

        // 連動 b: 庫存異動記錄
        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, note, createdAt)
           VALUES (?,?,'in',?,?,'purchase_receipt',NULL,NOW())`,
          [input.tenantId, item.productId, item.qty, input.id]
        );
      }

      // 連動 c: 建立 AP 應付帳款（到期日 = 今天 + 30 天）
      await client.execute(
        `INSERT INTO dy_ap_records
         (tenantId, supplierId, purchaseReceiptId, amount, paidAmount, status, dueDate, createdAt, updatedAt)
         VALUES (?,?,?,?,0,'unpaid', DATE_ADD(CURDATE(), INTERVAL 30 DAY), NOW(), NOW())`,
        [input.tenantId, pr.supplierId, input.id, pr.totalAmount]
      );

      return { success: true, supplierSignatureUrl };
    }),

  // 5. 標記異常（管理員）
  markAnomaly: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        anomalyNote: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        `UPDATE dy_purchase_receipts SET status='anomaly', anomalyNote=?
         WHERE id=? AND tenantId=?`,
        [input.anomalyNote, input.id, input.tenantId]
      );
      return { success: true };
    }),
});

import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { storagePut } from "../../storage";
import { dayoneAdminProcedure as dyAdminProcedure, dayoneDriverProcedure as driverProcedure } from "./procedures";



async function ensureDyPurchaseReceiptSchema(client: any) {
  await client.execute(
    `ALTER TABLE dy_purchase_receipts
     MODIFY COLUMN status ENUM('pending','signed','warehoused','anomaly') NOT NULL DEFAULT 'pending'`
  );
}

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
        driverId: z.number().optional(),
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
      const client = (db as any).$client;
      await ensureDyPurchaseReceiptSchema(client);

      const totalQty = input.items.reduce((s, i) => s + i.qty, 0);
      const totalAmount = input.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

      // 取得司機 ID（從 users 表對應）
      const [userRows] = await client.execute(
        `SELECT id FROM dy_drivers WHERE tenantId=? AND userId=? AND status='active' LIMIT 1`,
        [input.tenantId, ctx.user.id]
      );
      // 嘗試從 ctx 取 driverId，fallback 查 dy_drivers
      let driverId = Number(input.driverId ?? (ctx.user as any).driverId ?? (userRows as any[])[0]?.id ?? 0);
      if (!driverId && ctx.user.role === "driver") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Driver account is not linked to Dayone" });
      }
      if (!driverId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active Dayone driver is available for this purchase receipt" });
      }
      if (input.driverId) {
        const [driverCheckRows] = await client.execute(
          `SELECT id FROM dy_drivers WHERE id=? AND tenantId=? AND status='active' LIMIT 1`,
          [driverId, input.tenantId]
        );
        if (!(driverCheckRows as any[])[0]) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Selected Dayone driver is invalid" });
        }
      }

      const [result] = await client.execute(
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
      if (pr.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending purchase receipts can be signed" });
      }

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
      // ????????????????????????
      const [apRows] = await client.execute(
        `SELECT id FROM dy_ap_records WHERE tenantId=? AND purchaseReceiptId=? LIMIT 1`,
        [input.tenantId, input.id]
      );
      const apRecord = (apRows as any[])[0];
      if (apRecord) {
        await client.execute(
          `UPDATE dy_ap_records
           SET supplierId=?, amount=?, updatedAt=NOW()
           WHERE id=? AND tenantId=?`,
          [pr.supplierId, pr.totalAmount, apRecord.id, input.tenantId]
        );
      } else {
        await client.execute(
          `INSERT INTO dy_ap_records
           (tenantId, supplierId, purchaseReceiptId, amount, paidAmount, status, dueDate, createdAt, updatedAt)
           VALUES (?,?,?,?,0,'unpaid', DATE_ADD(DATE(?), INTERVAL 30 DAY), NOW(), NOW())`,
          [input.tenantId, pr.supplierId, input.id, pr.totalAmount, pr.receiptDate]
        );
      }

      return { success: true, supplierSignatureUrl };
    }),

  // 5. 標記異常（管理員）


  receiveToWarehouse: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      }
      const client = (db as any).$client;
      await ensureDyPurchaseReceiptSchema(client);

      const [rows] = await client.execute(
        `SELECT * FROM dy_purchase_receipts WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const receipt = (rows as any[])[0];
      if (!receipt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Purchase receipt not found" });
      }
      if (receipt.status !== "signed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only signed purchase receipts can be received into warehouse" });
      }

      const items = typeof receipt.items === "string" ? JSON.parse(receipt.items) : receipt.items;
      for (const item of items as any[]) {
        const qty = Number(item.qty ?? 0);
        if (qty <= 0) continue;

        await client.execute(
          `INSERT INTO dy_inventory (tenantId, productId, currentQty, safetyQty, unit, updatedAt)
           SELECT ?, ?, ?, 0, p.unit, NOW()
           FROM dy_products p
           WHERE p.id=? AND p.tenantId=?
           ON DUPLICATE KEY UPDATE currentQty = currentQty + VALUES(currentQty), unit = COALESCE(dy_inventory.unit, VALUES(unit)), updatedAt=NOW()`,
          [input.tenantId, item.productId, qty, item.productId, input.tenantId]
        );

        await client.execute(
          `INSERT INTO dy_stock_movements
           (tenantId, productId, type, qty, refId, refType, operatorId, note, createdAt)
           VALUES (?,?,'in',?,?,'purchase_receipt_warehouse',?,?,NOW())`,
          [
            input.tenantId,
            item.productId,
            qty,
            input.id,
            ctx.user.id,
            input.note?.trim() || `Purchase receipt ${input.id} received into warehouse`,
          ]
        );
      }

      await client.execute(
        `UPDATE dy_purchase_receipts
         SET status='warehoused'
         WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );

      return { success: true };
    }),
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
      const client = (db as any).$client;
      await ensureDyPurchaseReceiptSchema(client);
      const [rows] = await client.execute(
        `SELECT status FROM dy_purchase_receipts WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const receipt = (rows as any[])[0];
      if (!receipt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Purchase receipt not found" });
      }
      if (receipt.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending purchase receipts can be marked anomaly" });
      }

      await client.execute(
        `UPDATE dy_purchase_receipts SET status='anomaly', anomalyNote=?
         WHERE id=? AND tenantId=?`,
        [input.anomalyNote, input.id, input.tenantId]
      );
      return { success: true };
    }),

  reconcileAnomaly: dyAdminProcedure
    .input(
      z.object({
        id: z.number(),
        tenantId: z.number(),
        reconcileNote: z.string(),
        items: z.array(
          z.object({
            productId: z.number(),
            name: z.string(),
            qty: z.number().positive(),
            unitPrice: z.number().nonnegative(),
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

      const [rows] = await client.execute(
        `SELECT id, status, anomalyNote FROM dy_purchase_receipts WHERE id=? AND tenantId=? LIMIT 1`,
        [input.id, input.tenantId]
      );
      const receipt = (rows as any[])[0];
      if (!receipt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Purchase receipt not found" });
      }
      if (receipt.status !== "anomaly") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only anomaly purchase receipts can be reconciled" });
      }

      const totalQty = input.items.reduce((sum, item) => sum + Number(item.qty), 0);
      const totalAmount = input.items.reduce(
        (sum, item) => sum + Number(item.qty) * Number(item.unitPrice ?? 0),
        0
      );
      const existingNote = String(receipt.anomalyNote ?? "").trim();
      const mergedNote = [existingNote, `[reconcile] ${input.reconcileNote.trim()}`]
        .filter(Boolean)
        .join("\n");

      await client.execute(
        `UPDATE dy_purchase_receipts
         SET items=?, totalQty=?, totalAmount=?, anomalyNote=?, status='pending',
             supplierSignatureUrl=NULL, signedAt=NULL
         WHERE id=? AND tenantId=?`,
        [
          JSON.stringify(input.items),
          totalQty,
          totalAmount,
          mergedNote,
          input.id,
          input.tenantId,
        ]
      );

      return { success: true, totalQty, totalAmount };
    }),
});

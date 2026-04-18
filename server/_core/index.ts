import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { CronJob } from "cron";

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { parsePaymentResult, verifyCheckMacValue } from "../ecpay";
import * as db from "../db";
import { notifyOwner } from "./notification";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { posts } from "../../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Trust reverse proxy (Railway, Cloudflare) so req.protocol reflects HTTPS
  // and x-forwarded-proto header is honoured correctly.
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ECPay payment callback
  app.post("/api/payment/callback", async (req, res) => {
    try {
      const data = req.body;
      console.log("[ECPay Callback]", data);
      
      // Verify CheckMacValue
      if (!verifyCheckMacValue(data, data.CheckMacValue)) {
        console.error("[ECPay] CheckMacValue verification failed");
        return res.send("0|CheckMacValue Error");
      }
      
      const result = parsePaymentResult(data);
      
      if (result.success) {
        // Update order status
        const order = await db.getOrderByNumber(result.orderNumber);
        if (order) {
          await db.updateOrderPayment(order.orderNumber, 'paid', result.tradeNo);
          await db.updateOrderStatus(order.id, 'paid');

          // Deduct stock for each order item and auto-deactivate when depleted
          const items = await db.getOrderItems(order.id);
          for (const item of items) {
            if (!item.productId) continue;
            const product = await db.getProductById(item.productId);
            if (!product) continue;
            const currentStock = product.stock ?? 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await db.updateProduct(item.productId, {
              stock: newStock,
              ...(newStock <= 0 ? { isActive: false } : {}),
            });
            if (newStock <= 0) {
              console.log(`[Stock] Product ${item.productId} (${product.name}) auto-deactivated (stock depleted)`);
            }
          }

          // Notify owner
          await notifyOwner({
            title: `訂單付款成功 - ${result.orderNumber}`,
            content: `訂單 ${result.orderNumber} 已完成付款\n金額：NT$ ${result.amount}\n付款方式：${result.paymentType}\n綠界交易號：${result.tradeNo}`,
          });
        }
      }
      
      res.send("1|OK");
    } catch (error) {
      console.error("[ECPay Callback Error]", error);
      res.send("0|Error");
    }
  });

  // ─── ECPay 物流：電子地圖選店結果 ───
  app.post("/api/ecpay/map-result", express.urlencoded({ extended: true }), (req, res) => {
    const { CVSStoreID, CVSStoreName, CVSAddress, LogisticsSubType } = req.body;
    console.log("[ECPay Map]", { CVSStoreID, CVSStoreName, CVSAddress, LogisticsSubType });
    const payload = JSON.stringify({
      type: 'ecpay-map-result',
      storeId: CVSStoreID || "",
      storeName: CVSStoreName || "",
      storeAddress: CVSAddress || "",
      subType: LogisticsSubType || "",
    });
    // 雙重機制：
    // 1. postMessage：若 opener 仍存在（同源或舊版瀏覽器）直接傳
    // 2. localStorage：跨源 navigate 後 opener 會被清除，改寫入 localStorage，
    //    父頁面監聽 storage 事件取得結果
    res.send(`<!DOCTYPE html><html><body><script>
      var payload = ${payload};
      var sent = false;
      function tryPost() {
        if (sent) return;
        if (window.opener) {
          try {
            window.opener.postMessage(payload, '*');
            sent = true;
          } catch(e) {}
        }
        if (!sent) {
          try {
            localStorage.setItem('ecpay_map_result', JSON.stringify(payload));
            sent = true;
          } catch(e) {}
        }
        setTimeout(function() { window.close(); }, 300);
      }
      tryPost();
    </script></body></html>`);
  });

  // ─── ECPay 物流：物流狀態通知 ───
  app.post("/api/ecpay/logistics-notify", express.urlencoded({ extended: true }), async (req, res) => {
    try {
      const { verifyLogisticsCheckMacValue } = await import("../ecpay-logistics");
      if (!verifyLogisticsCheckMacValue(req.body)) {
        console.error("[ECPay Logistics] CheckMacValue 驗證失敗");
        return res.status(400).send("Invalid");
      }

      const { AllPayLogisticsID, RtnCode, RtnMsg, MerchantTradeNo } = req.body;
      console.log(`[ECPay Logistics] ID=${AllPayLogisticsID} Code=${RtnCode} Msg=${RtnMsg} TradeNo=${MerchantTradeNo}`);

      // 更新訂單物流狀態
      const database = await db.getDb();
      if (database) {
        const { orders } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        if (AllPayLogisticsID) {
          await database
            .update(orders)
            .set({
              logisticsStatus: RtnCode,
              logisticsStatusMsg: RtnMsg,
            })
            .where(eq(orders.logisticsId, AllPayLogisticsID));
        }
      }

      // 物流狀態碼對照
      // 300 = 訂單處理中
      // 2067 = 消費者已取貨（7-ELEVEN）
      // 3022 = 消費者已取貨（全家/萊爾富）
      if (RtnCode === "2067" || RtnCode === "3022") {
        if (database && AllPayLogisticsID) {
          const { orders } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await database
            .update(orders)
            .set({ status: "delivered", deliveredAt: new Date() })
            .where(eq(orders.logisticsId, AllPayLogisticsID));
        }
      }
    } catch (e) {
      console.error("[ECPay Logistics] Error:", e);
    }
    // 必須回應 1|OK，否則綠界會重試
    res.type("text").send("1|OK");
  });

  // LINE Order from Make webhook
  app.post("/api/dayone/line-order", async (req, res) => {
    try {
      const { tenantId, lineUserId, replyToken, rawMessage, parsedText } = req.body;

      // 1. 基本驗證
      if (tenantId !== 2) {
        return res.status(400).json({ success: false, error: "invalid tenant" });
      }

      // 2. 解析 Gemini 回傳的 parsedText
      const cleaned = parsedText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedOrderObj: any;
      try {
        parsedOrderObj = JSON.parse(cleaned);
      } catch (e) {
        console.error("[LINE Order] parsedText parse failed", cleaned);
        return res.status(400).json({ success: false, error: "invalid parsedText format" });
      }

      // 3. 取得 DB
      const { getDb } = await import("../db");
      const database = await getDb();
      if (!database) {
        return res.status(500).json({ success: false, error: "internal error" });
      }
      const client = (database as any).$client;

      // 4. 查詢客戶
      let customerId: number = 0;
      const [customerRows] = await client.execute(
        `SELECT id, name FROM dy_customers WHERE tenantId = 2 AND name = ? AND status = 'active' LIMIT 1`,
        [parsedOrderObj.customerName]
      );
      const customer = (customerRows as any[])[0];
      if (customer) {
        customerId = customer.id;
      }

      // 5. 查詢品項售價
      const resolvedItems: { productId: number | null; productName: string; qty: number; unitPrice: number }[] = [];
      for (const item of parsedOrderObj.items as { productName: string; quantity: number }[]) {
        const [productRows] = await client.execute(
          `SELECT id, name, price FROM dy_products WHERE tenantId = 2 AND name = ? AND isActive = 1 LIMIT 1`,
          [item.productName]
        );
        const product = (productRows as any[])[0];
        if (product) {
          resolvedItems.push({ productId: product.id, productName: item.productName, qty: item.quantity, unitPrice: product.price });
        } else {
          resolvedItems.push({ productId: null, productName: item.productName, qty: item.quantity, unitPrice: 0 });
        }
      }

      // 6. 生成 orderNo
      const orderNo = `DY${Date.now()}`;

      // 7. 計算 totalAmount
      const totalAmount = resolvedItems.reduce((sum, i) => sum + (i.productId ? i.unitPrice * i.qty : 0), 0);

      // 8. 寫入 dy_orders
      const deliveryDate = parsedOrderObj.deliveryDate || new Date().toISOString().slice(0, 10);
      const [orderResult] = await client.execute(
        `INSERT INTO dy_orders (tenantId, orderNo, customerId, status, orderSource, deliveryDate, note, totalAmount, createdAt, updatedAt)
         VALUES (2, ?, ?, 'pending', 'line', ?, ?, ?, NOW(), NOW())`,
        [orderNo, customerId, deliveryDate, parsedOrderObj.rawText, totalAmount]
      );
      const orderId = (orderResult as any).insertId;

      // 9. 寫入 dy_order_items（只寫有 productId 的品項）
      for (const item of resolvedItems) {
        if (item.productId !== null) {
          await client.execute(
            `INSERT INTO dy_order_items (orderId, productId, qty, unitPrice) VALUES (?, ?, ?, ?)`,
            [orderId, item.productId, item.qty, item.unitPrice]
          );
        }
      }

      // 10. 組裝 replyMessage
      const itemLines = resolvedItems.map(i => `${i.productName} x${i.qty}`).join("\n");
      let replyMessage: string;
      if (customerId !== 0) {
        replyMessage = `✅ 收到 ${parsedOrderObj.customerName} 的訂單！\n${itemLines}\n預計 ${deliveryDate} 配送，謝謝！`;
      } else {
        replyMessage = `✅ 已收到您的訂單！\n${itemLines}\n預計 ${deliveryDate} 配送。\n⚠️ 查無客戶資料，請聯繫業務確認。`;
      }

      // 11. 呼叫 LINE Reply API
      const lineReplyUrl = 'https://api.line.me/v2/bot/message/reply';
      const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (replyToken && lineToken) {
        await fetch(lineReplyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineToken}`
          },
          body: JSON.stringify({
            replyToken,
            messages: [{ type: 'text', text: replyMessage }]
          })
        });
      }

      // 12. 回傳
      return res.json({ success: true, orderNo, customerId, replyMessage });
    } catch (error) {
      console.error("[LINE Order Error]", error);
      console.error("[Gemini Error]", error);
      return res.status(500).json({ success: false, error: "internal error" });
    }
  });

  // Procurement import from Make
  app.post("/api/procurement/import", async (req, res) => {
    try {
      const { secret, orderNo: rawOrderNo, orderDate, itemsCsv } = req.body;

      if (secret !== process.env.SYNC_SECRET) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      if (!orderDate || !itemsCsv || typeof itemsCsv !== 'string') {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const items = (itemsCsv as string)
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const [supplierName, storeName, productName, unit, quantity, temperature] = line.split('|');
          return {
            supplierName: supplierName?.trim() || '',
            storeName: storeName?.trim() || '',
            productName: productName?.trim() || '',
            unit: unit?.trim() || '',
            quantity: parseFloat(quantity?.trim() || '0') || 0,
            temperature: temperature?.trim() || '常溫'
          };
        })
        .filter((item: { supplierName: string; productName: string }) => item.supplierName && item.productName);

      if (items.length === 0) {
        return res.status(400).json({ success: false, error: "No valid items in itemsCsv" });
      }

      const orderNo: string = rawOrderNo ||
        `DM-${orderDate.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

      const database = await db.getDb();
      if (!database) {
        return res.status(500).json({ success: false, error: "DB unavailable" });
      }
      const client = (database as any).$client;

      // 檢查是否已存在（僅在有明確 orderNo 時略過）
      if (rawOrderNo) {
        const [existing] = await client.execute(
          "SELECT id FROM os_procurement_orders WHERE orderNo = ? LIMIT 1",
          [orderNo]
        );
        if ((existing as any[]).length > 0) {
          return res.json({ success: true, message: "訂單已存在，略過" });
        }
      }

      // 插入主表
      const [result] = await client.execute(
        "INSERT INTO os_procurement_orders (orderNo, orderDate, status, sourceType, createdBy, tenantId, createdAt) VALUES (?, ?, 'pending', 'damai_import', 'Make自動匯入', 1, NOW())",
        [orderNo, orderDate]
      );
      const orderId = (result as any).insertId;

      console.log(`[Procurement Import] orderNo=${orderNo}, items=${items.length}`);

      // 批次插入品項
      for (const item of items) {
        const [supRows] = await client.execute(
          "SELECT id FROM os_suppliers WHERE name = ? LIMIT 1",
          [item.supplierName]
        );
        const supplierId = (supRows as any[])[0]?.id || null;

        const [productRows] = await client.execute(
          'SELECT id, unitCost FROM os_products WHERE name = ? LIMIT 1',
          [item.productName]
        );
        const productRow = (productRows as any[])[0];
        const unitPrice = productRow?.unitCost || 0;
        const amount = unitPrice * item.quantity;

        await client.execute(
          "INSERT INTO os_procurement_items (procurementOrderId, supplierId, supplierName, storeName, productName, unit, quantity, unitPrice, amount, temperature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [orderId, supplierId, item.supplierName, item.storeName, item.productName, item.unit || "", item.quantity, unitPrice, amount, item.temperature || "常溫"]
        );
      }

      return res.json({ success: true, orderNo, orderId, itemCount: items.length });
    } catch (error) {
      console.error("[Procurement Import]", error);
      return res.status(500).json({ success: false, error: String(error) });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);

    // ─── 排程發布 cron（每分鐘）─────────────────────────────────────
    new CronJob("* * * * *", async () => {
      try {
        const now = new Date();
        const database = await db.getDb();
        if (!database) return;
        await database
          .update(posts)
          .set({
            status: "published" as const,
            publishedAt: now,
            scheduledAt: null,
          })
          .where(
            and(
              eq(posts.status, "draft"),
              sql`${posts.scheduledAt} IS NOT NULL`,
              sql`${posts.scheduledAt} <= ${now}`,
            )
          );
      } catch (e) {
        console.error("[publishScheduled cron]", e);
      }
    }, null, true);

    // ─── 每天 07:00 台灣時間（UTC 23:00）自動產生大永派車單 ────────
    // 使用 cron 時區「Asia/Taipei」，每天 07:00 觸發
    new CronJob("0 7 * * *", async () => {
      try {
        const now = new Date();
        const database = await db.getDb();
        if (!database) return;
        const client = (database as any).$client;

        // 派車單產生對象：今天（台灣時間）
        const twNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const dispatchDate = twNow.toISOString().slice(0, 10);
        const tenantId = 90004;

        // 查當日訂單
        const [orderRows] = await client.execute(
          `SELECT o.*, c.settlementCycle, c.overdueDays, c.customerLevel,
                  dist.sortOrder, dist.routeCode
           FROM dy_orders o
           JOIN dy_customers c ON o.customerId = c.id
           LEFT JOIN dy_districts dist ON o.districtId = dist.id
           WHERE o.tenantId=? AND o.deliveryDate=? AND o.status != 'cancelled'
           ORDER BY o.driverId, dist.sortOrder`,
          [tenantId, dispatchDate]
        );
        const orders = orderRows as any[];

        if (orders.length === 0) {
          console.log(`[Cron] 07:00 dispatch: 當日無訂單 (${dispatchDate})`);
          return;
        }

        // 依 driverId 分組
        const driverMap = new Map<number, any[]>();
        for (const o of orders) {
          const driverId = o.driverId ?? 0;
          if (!driverMap.has(driverId)) driverMap.set(driverId, []);
          driverMap.get(driverId)!.push(o);
        }

        const generated: number[] = [];
        for (const [driverId, driverOrders] of Array.from(driverMap.entries())) {
          const routeCode = driverOrders[0]?.routeCode ?? "R00";
          const [doResult] = await client.execute(
            `INSERT INTO dy_dispatch_orders
             (tenantId, dispatchDate, driverId, routeCode, status, generatedAt, createdAt, updatedAt)
             VALUES (?,?,?,?,'draft',NOW(),NOW(),NOW())`,
            [tenantId, dispatchDate, driverId, routeCode]
          );
          const dispatchOrderId = (doResult as any).insertId;

          let stopSeq = 1;
          for (const order of driverOrders) {
            const [boxRows] = await client.execute(
              `SELECT currentBalance FROM dy_box_ledger WHERE tenantId=? AND customerId=?`,
              [tenantId, order.customerId]
            );
            const prevBoxes = (boxRows as any[])[0]?.currentBalance ?? 0;
            const settlementCycle = order.settlementCycle ?? "monthly";
            let paymentStatus = "unpaid";
            if (settlementCycle === "monthly") paymentStatus = "monthly";
            else if (settlementCycle === "weekly") paymentStatus = "weekly";

            await client.execute(
              `INSERT INTO dy_dispatch_items
               (dispatchOrderId, tenantId, orderId, customerId, stopSequence,
                prevBoxes, deliverBoxes, returnBoxes, remainBoxes, paymentStatus, cashCollected, createdAt)
               VALUES (?,?,?,?,?,?,0,0,?,?,0,NOW())`,
              [dispatchOrderId, tenantId, order.id, order.customerId, stopSeq++, prevBoxes, prevBoxes, paymentStatus]
            );

            // 建立 AR
            let dueDate = dispatchDate;
            if (settlementCycle === "monthly") {
              const d = new Date(dispatchDate);
              const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
              lastDay.setDate(lastDay.getDate() + (order.overdueDays ?? 5));
              dueDate = lastDay.toISOString().slice(0, 10);
            } else if (settlementCycle === "weekly") {
              const d = new Date(dispatchDate);
              d.setDate(d.getDate() + 7);
              dueDate = d.toISOString().slice(0, 10);
            }

            await client.execute(
              `INSERT INTO dy_ar_records
               (tenantId, orderId, customerId, amount, paidAmount, status, dueDate, createdAt, updatedAt)
               VALUES (?,?,?,?,0,'unpaid',?,NOW(),NOW())`,
              [tenantId, order.id, order.customerId, order.totalAmount, dueDate]
            );
          }
          generated.push(dispatchOrderId);
        }

        console.log(`[Cron] 07:00 dispatch generated for ${dispatchDate}:`, generated);
      } catch (e) {
        console.error("[Cron] 07:00 dispatch error", e);
      }
    }, null, true, "Asia/Taipei");

    // ─── 積欠款 LINE 推播（每小時整點，依設定決定是否推播）────────
    new CronJob("0 * * * *", async () => {
      try {
        const TENANT_ID = 90004;

        const database = await db.getDb();
        if (!database) return;
        const client = (database as any).$client;

        // 讀取推播設定
        const [enabledRows] = await client.execute(
          "SELECT value FROM dy_settings WHERE tenantId = ? AND `key` = 'overdue_push_enabled' LIMIT 1",
          [TENANT_ID]
        );
        if ((enabledRows as any[])[0]?.value !== "true") return;

        const [hourRows] = await client.execute(
          "SELECT value FROM dy_settings WHERE tenantId = ? AND `key` = 'overdue_push_hour' LIMIT 1",
          [TENANT_ID]
        );
        const pushHour = parseInt((hourRows as any[])[0]?.value ?? "9");
        // Railway 是 UTC，換算台灣時間（UTC+8）
        const currentUTCHour = new Date().getUTCHours();
        const targetUTCHour = (pushHour - 8 + 24) % 24;
        if (currentUTCHour !== targetUTCHour) return;

        // 查出所有逾期未付且有 lineUserId 的客戶
        const [overdueRows] = await client.execute(
          `SELECT
             c.id, c.name, c.lineUserId,
             SUM(ar.amount - ar.paidAmount) as unpaidTotal,
             MAX(DATEDIFF(NOW(), ar.dueDate)) as maxOverdueDays
           FROM dy_customers c
           JOIN dy_ar_records ar ON ar.customerId = c.id
           WHERE ar.tenantId = ?
             AND ar.status IN ('unpaid', 'partial', 'overdue')
             AND ar.dueDate < NOW()
             AND c.lineUserId IS NOT NULL
           GROUP BY c.id, c.name, c.lineUserId
           HAVING maxOverdueDays > 0`,
          [TENANT_ID]
        );
        const overdueList = overdueRows as any[];
        if (!overdueList.length) return;

        const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!LINE_TOKEN) return;

        const BASE_URL = process.env.BASE_URL || "https://ordersome.com.tw";
        for (const customer of overdueList) {
          const msg = `【大永蛋品】帳款提醒\n\n${customer.name} 您好，\n\n您目前有逾期未付款項：\n金額：$${Number(customer.unpaidTotal).toLocaleString("zh-TW")}\n逾期：${customer.maxOverdueDays} 天\n\n請登入客戶入口查看明細：\n${BASE_URL}/dayone/portal\n\n如已付款請忽略此訊息。`;
          await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_TOKEN}`,
            },
            body: JSON.stringify({
              to: customer.lineUserId,
              messages: [{ type: "text", text: msg }],
            }),
          }).catch((e) => console.error(`[overdue push] ${customer.name}`, e));
        }

        console.log(`[overdue push] 推播完成，共 ${overdueList.length} 位客戶`);
      } catch (e) {
        console.error("[overdue push cron]", e);
      }
    }, null, true);
  });
}

startServer().catch(console.error);

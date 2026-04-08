import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";

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

    // 排程發布檢查（每分鐘）
    setInterval(async () => {
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
        console.error("[Scheduler] publishScheduled error", e);
      }
    }, 60 * 1000);
  });
}

startServer().catch(console.error);

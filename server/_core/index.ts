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
      const { tenantId, lineUserId, displayName, replyToken, parsedOrder } = req.body;

      // 1. 基本驗證
      if (tenantId !== 2) {
        return res.status(400).json({ success: false, error: "invalid tenant" });
      }

      const { getDb } = await import("../db");
      const database = await getDb();
      if (!database) {
        return res.status(500).json({ success: false, error: "internal error" });
      }
      const client = (database as any).$client;

      // 2. 查詢客戶
      let customerId: number | null = null;
      const [customerRows] = await client.execute(
        `SELECT id, name FROM dy_customers WHERE tenantId = 2 AND name = ? AND status = 'active' LIMIT 1`,
        [parsedOrder.customerName]
      );
      const customer = (customerRows as any[])[0];
      if (customer) {
        customerId = customer.id;
      }

      // 3. 查詢品項售價
      const resolvedItems: { productId: number | null; productName: string; qty: number; unitPrice: number }[] = [];
      for (const item of parsedOrder.items as { productName: string; quantity: number }[]) {
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

      // 4. 生成 orderNo
      const orderNo = `DY${Date.now()}`;

      // 5. 計算 total
      const total = resolvedItems.reduce((sum, i) => sum + (i.productId ? i.unitPrice * i.qty : 0), 0);

      // 6. 寫入 dy_orders
      const [orderResult] = await client.execute(
        `INSERT INTO dy_orders (tenantId, orderNo, customerId, status, orderSource, deliveryDate, note, total, createdAt, updatedAt)
         VALUES (2, ?, ?, 'pending', 'line', ?, ?, ?, NOW(), NOW())`,
        [orderNo, customerId, parsedOrder.deliveryDate, parsedOrder.rawText, total]
      );
      const orderId = (orderResult as any).insertId;

      // 7. 寫入 dy_order_items（只寫有 productId 的品項）
      for (const item of resolvedItems) {
        if (item.productId !== null) {
          await client.execute(
            `INSERT INTO dy_order_items (orderId, productId, qty, unitPrice) VALUES (?, ?, ?, ?)`,
            [orderId, item.productId, item.qty, item.unitPrice]
          );
        }
      }

      // 8. 組裝 replyMessage
      const itemLines = resolvedItems.map(i => `${i.productName} x${i.qty}`).join("\n");
      let replyMessage: string;
      if (customerId !== null) {
        replyMessage = `✅ 收到 ${parsedOrder.customerName} 的訂單！\n${itemLines}\n預計 ${parsedOrder.deliveryDate} 配送，謝謝！`;
      } else {
        replyMessage = `✅ 已收到您的訂單！\n${itemLines}\n預計 ${parsedOrder.deliveryDate} 配送。\n⚠️ 查無客戶資料，請聯繫業務確認。`;
      }

      // 9. 回傳
      return res.json({ success: true, orderNo, customerId, replyMessage });
    } catch (error) {
      console.error("[LINE Order Error]", error);
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
  });
}

startServer().catch(console.error);

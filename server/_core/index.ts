import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
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
  // ─── B2B 本機圖片上傳服務 ────────────────────────────────────────────────────────────────
  const b2bUploadsDir = path.resolve(process.cwd(), "uploads", "b2b");
  if (!fs.existsSync(b2bUploadsDir)) {
    fs.mkdirSync(b2bUploadsDir, { recursive: true });
  }
  // Serve uploaded B2B images as static files under /uploads/b2b/
  app.use("/uploads/b2b", express.static(b2bUploadsDir));

  // B2B image upload endpoint - local storage ONLY, no external cloud
  app.post("/api/upload/b2b-image", async (req, res) => {
    try {
      const { fileName, fileData } = req.body as { fileName: string; fileData: string };
      if (!fileName || !fileData) {
        return res.status(400).json({ error: "缺少必要參數" });
      }
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "圖片大小不可超過 10MB" });
      }
      const ext = (fileName.split(".").pop() || "jpg").toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: "不支援的圖片格式" });
      }
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(b2bUploadsDir, uniqueName);
      fs.writeFileSync(filePath, buffer);
      console.log(`[B2B Upload] Saved locally: ${filePath}`);
      return res.json({ url: `/uploads/b2b/${uniqueName}`, fileName: uniqueName });
    } catch (error) {
      console.error("[B2B Upload] Error:", error);
      return res.status(500).json({ error: "圖片上傳失敗" });
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

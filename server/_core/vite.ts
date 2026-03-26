import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production (Railway), the build output is at dist/public relative to
  // the project root (two levels up from server/_core/).
  // import.meta.dirname resolves to server/_core at runtime.
  const candidates = [
    path.resolve(import.meta.dirname, "public"),           // compiled: server/_core/public
    path.resolve(import.meta.dirname, "..", "public"),     // compiled: server/public
    path.resolve(import.meta.dirname, "../..", "dist", "public"), // dev fallback
    path.resolve(process.cwd(), "dist", "public"),         // Railway CWD fallback
    path.resolve(process.cwd(), "public"),                 // Railway CWD fallback 2
  ];

  const distPath = candidates.find(p => fs.existsSync(p));

  if (!distPath) {
    console.error(
      `[serveStatic] Could not find build directory. Tried:\n${candidates.join("\n")}`
    );
    // Still register a fallback so the server doesn't crash
    app.use("*", (_req, res) => {
      res.status(503).send("Frontend build not found. Run pnpm build first.");
    });
    return;
  }

  console.log(`[serveStatic] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for all unmatched routes
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

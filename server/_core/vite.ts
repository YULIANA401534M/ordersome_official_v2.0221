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
  // In production (Railway), the build output is at dist/public.
  // Use process.cwd() which is reliable across all deployment environments.
  const candidates = [
    path.resolve(process.cwd(), "dist", "public"),         // Railway: CWD/dist/public
    path.resolve(import.meta.dirname, "public"),           // esbuild bundle: dist/public
    path.resolve(import.meta.dirname, "..", "public"),     // alternate bundle path
    path.resolve(import.meta.dirname, "../..", "dist", "public"), // dev fallback
    path.resolve(process.cwd(), "public"),                 // last resort
  ];

  const distPath = candidates.find(p => fs.existsSync(p));

  if (!distPath) {
    console.error(
      `[serveStatic] Could not find build directory. Tried:\n${candidates.join("\n")}`
    );
    // IMPORTANT: Do NOT register a catch-all fallback here.
    // The /api/trpc routes are already registered before serveStatic is called.
    // A catch-all here would shadow API 404s with HTML, causing "Service Unavailable" JSON errors.
    return;
  }

  console.log(`[serveStatic] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for all non-API unmatched routes
  app.use((req, res, next) => {
    // Never intercept /api routes — let Express return its own 404
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

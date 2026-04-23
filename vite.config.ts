import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // mermaid / cytoscape / KaTeX — 只有 AI Writer 用，獨立分包
          if (id.includes("node_modules/mermaid") || id.includes("node_modules/cytoscape") ||
              id.includes("node_modules/katex") || id.includes("node_modules/highlight.js") ||
              id.includes("node_modules/shiki") || id.includes("node_modules/micromark") ||
              id.includes("node_modules/lowlight")) {
            return "vendor-heavy";
          }
          // tiptap 富文字編輯器 — 只有 ContentEditor 用
          if (id.includes("node_modules/@tiptap")) {
            return "vendor-tiptap";
          }
          // recharts 圖表 — 只有後台 OSProfitLoss 用
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // xlsx — 只有叫貨管理用
          if (id.includes("node_modules/xlsx")) {
            return "vendor-xlsx";
          }
          // framer-motion 動畫
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          // Radix UI + shadcn 元件
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/cmdk") || id.includes("node_modules/vaul")) {
            return "vendor-radix";
          }
          // TanStack Query + tRPC
          if (id.includes("node_modules/@tanstack") || id.includes("node_modules/@trpc")) {
            return "vendor-tanstack";
          }
          // 其餘 node_modules
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

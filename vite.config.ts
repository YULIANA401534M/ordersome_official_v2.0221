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
          // 大型 vendor 庫各自獨立
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/cmdk") || id.includes("node_modules/vaul")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/xlsx") || id.includes("node_modules/sheetjs")) {
            return "vendor-xlsx";
          }
          // 其餘 node_modules 合為一包
          if (id.includes("node_modules")) {
            return "vendor";
          }
          // 業務頁面按路徑分組
          if (id.includes("/pages/dayone/") || id.includes("/pages/erp/")) {
            return "chunk-dayone";
          }
          if (id.includes("/pages/dashboard/") || id.includes("/pages/admin/")) {
            return "chunk-dashboard";
          }
          if (id.includes("/pages/shop/") || id.includes("/pages/member/")) {
            return "chunk-shop";
          }
          if (id.includes("/pages/brand/") || id.includes("/pages/corporate/")) {
            return "chunk-brand";
          }
          if (id.includes("/pages/liff/") || id.includes("/pages/dayone/driver/")) {
            return "chunk-liff";
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

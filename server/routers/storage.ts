import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { r2Put } from "../lib/r2";

/**
 * Storage router for file upload operations
 * - uploadImage: uses Cloudflare R2 directly (works on Railway)
 * - uploadPdf: uses Cloudflare R2 directly (sop-pdfs/ folder)
 */
export const storageRouter = router({
  /**
   * Upload image to Cloudflare R2
   * Returns the public URL of the uploaded image
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded image data (data:image/xxx;base64,...)
        contentType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const base64Data = input.fileData.replace(/^data:[\w/]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExtension = input.fileName.split(".").pop()?.toLowerCase() || "jpg";
        // Store under products/ folder in R2
        const folder = input.fileName.startsWith("b2b/") ? "products/b2b" : "products";
        const uniqueKey = `${folder}/${timestamp}-${randomString}.${fileExtension}`;
        const result = await r2Put(
          uniqueKey,
          buffer,
          input.contentType || "image/jpeg"
        );
        if (!result || !result.url) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "圖片上傳失敗" });
        }
        return { url: result.url, key: result.key };
      } catch (error) {
        console.error("[Storage/R2] Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "圖片上傳失敗：" + (error instanceof Error ? error.message : String(error)),
        });
      }
    }),

  /**
   * Upload PDF to Manus Forge storage (for SOP documents)
   */
  uploadPdf: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded PDF data
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only managers can upload PDFs
      if (ctx.user.role !== "super_admin" && ctx.user.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
      }
      try {
        const base64Data = input.fileData.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const uniqueFileName = `sop-pdfs/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
        const result = await r2Put(uniqueFileName, buffer, "application/pdf");
        return { url: result.url, key: result.key };
      } catch (error) {
        console.error("[Storage] PDF upload error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PDF 上傳失敗" });
      }
    }),
});

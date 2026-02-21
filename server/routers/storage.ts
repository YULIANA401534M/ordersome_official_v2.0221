import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

/**
 * Storage router for file upload operations
 */
export const storageRouter = router({
  /**
   * Upload image to S3
   * Returns the public URL of the uploaded image
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded image data
        contentType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const base64Data = input.fileData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExtension = input.fileName.split(".").pop() || "jpg";
        const uniqueFileName = `posts/${timestamp}-${randomString}.${fileExtension}`;
        const result = await storagePut(
          uniqueFileName,
          buffer,
          input.contentType || "image/jpeg"
        );
        if (!result || !result.url) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "圖片上傳失敗" });
        }
        return { url: result.url, key: result.key };
      } catch (error) {
        console.error("[Storage] Upload error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "圖片上傳失敗" });
      }
    }),

  /**
   * Upload PDF to S3 (for SOP documents)
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
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const uniqueFileName = `sop-pdfs/${timestamp}-${randomString}.pdf`;
        const result = await storagePut(uniqueFileName, buffer, "application/pdf");
        if (!result || !result.url) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PDF 上傳失敗" });
        }
        return { url: result.url, key: result.key };
      } catch (error) {
        console.error("[Storage] PDF upload error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PDF 上傳失敗" });
      }
    }),
});

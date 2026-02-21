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
        // Decode base64 data
        const base64Data = input.fileData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique file path
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExtension = input.fileName.split(".").pop() || "jpg";
        const uniqueFileName = `posts/${timestamp}-${randomString}.${fileExtension}`;

        // Upload to S3
        const result = await storagePut(
          uniqueFileName,
          buffer,
          input.contentType || "image/jpeg"
        );

        if (!result || !result.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "圖片上傳失敗",
          });
        }

        return {
          url: result.url,
          key: result.key,
        };
      } catch (error) {
        console.error("[Storage] Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "圖片上傳失敗",
        });
      }
    }),
});

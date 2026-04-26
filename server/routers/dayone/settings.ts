import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";


export const dayoneSettingsRouter = router({
  get: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), key: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [rows] = await (db as any).$client.execute(
        "SELECT value FROM dy_settings WHERE tenantId = ? AND `key` = ? LIMIT 1",
        [input.tenantId, input.key]
      );
      return (rows as any[])[0]?.value ?? null;
    }),

  set: dyAdminProcedure
    .input(z.object({ tenantId: z.number(), key: z.string(), value: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await (db as any).$client.execute(
        "INSERT INTO dy_settings (tenantId, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
        [input.tenantId, input.key, input.value]
      );
      return { success: true };
    }),
});

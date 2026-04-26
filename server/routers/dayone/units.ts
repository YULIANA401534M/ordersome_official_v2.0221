import { z } from "zod";
import { router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { dayoneAdminProcedure as dyAdminProcedure } from "./procedures";


export const dyUnitsRouter = router({
  list: dyAdminProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const [rows] = await (db as any).$client.execute(
        `SELECT * FROM dy_units WHERE tenantId=? ORDER BY sortOrder, name`,
        [input.tenantId]
      );
      return rows as any[];
    }),

  upsert: dyAdminProcedure
    .input(z.object({
      id: z.number().optional(),
      tenantId: z.number(),
      name: z.string().max(20),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const client = (db as any).$client;
      if (input.id) {
        await client.execute(
          `UPDATE dy_units SET name=?, sortOrder=? WHERE id=? AND tenantId=?`,
          [input.name, input.sortOrder, input.id, input.tenantId]
        );
        return { id: input.id };
      } else {
        const [result] = await client.execute(
          `INSERT INTO dy_units (tenantId, name, sortOrder) VALUES (?,?,?)`,
          [input.tenantId, input.name, input.sortOrder]
        );
        return { id: (result as any).insertId };
      }
    }),

  delete: dyAdminProcedure
    .input(z.object({ id: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      await (db as any).$client.execute(
        `DELETE FROM dy_units WHERE id=? AND tenantId=?`,
        [input.id, input.tenantId]
      );
      return { success: true };
    }),
});

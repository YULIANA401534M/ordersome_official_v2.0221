import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

const HQ_STORE_ID = 401534;

export const schedulingRouter = router({

  listTemplates: adminProcedure
    .input(z.object({ storeId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      let sql = "SELECT * FROM os_schedule_templates WHERE tenantId=1 AND isActive=1";
      const params: any[] = [];
      if (input.storeId !== undefined) { sql += " AND storeId=?"; params.push(input.storeId); }
      sql += " ORDER BY scheduleType, employeeName";
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  upsertTemplate: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      storeId: z.number(),
      employeeName: z.string().min(1),
      userId: z.number().optional(),
      scheduleType: z.enum(["early","late","mobile"]),
      defaultStartTime: z.string().optional(),
      defaultEndTime: z.string().optional(),
      fixedRestDays: z.array(z.number().min(0).max(6)).optional(),
      note: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const fixedRestDaysJson = input.fixedRestDays ? JSON.stringify(input.fixedRestDays) : null;
      if (input.id) {
        await (db as any).$client.execute(
          `UPDATE os_schedule_templates SET
            storeId=?, employeeName=?, userId=?, scheduleType=?,
            defaultStartTime=?, defaultEndTime=?, fixedRestDays=?, note=?, updatedAt=NOW()
           WHERE id=? AND tenantId=1`,
          [input.storeId, input.employeeName, input.userId ?? null, input.scheduleType,
           input.defaultStartTime ?? null, input.defaultEndTime ?? null,
           fixedRestDaysJson, input.note ?? null, input.id]
        );
      } else {
        await (db as any).$client.execute(
          `INSERT INTO os_schedule_templates
            (tenantId, storeId, employeeName, userId, scheduleType,
             defaultStartTime, defaultEndTime, fixedRestDays, note)
           VALUES (1,?,?,?,?,?,?,?,?)`,
          [input.storeId, input.employeeName, input.userId ?? null, input.scheduleType,
           input.defaultStartTime ?? null, input.defaultEndTime ?? null,
           fixedRestDaysJson, input.note ?? null]
        );
      }
      return { success: true };
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      await (db as any).$client.execute(
        "UPDATE os_schedule_templates SET isActive=0 WHERE id=? AND tenantId=1",
        [input.id]
      );
      return { success: true };
    }),

  listSchedules: adminProcedure
    .input(z.object({
      storeId: z.number().optional(),
      year: z.number(),
      month: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const mm = String(input.month).padStart(2, "0");
      const dateFrom = `${input.year}-${mm}-01`;
      let sql = `SELECT * FROM os_schedules
                 WHERE tenantId=1
                 AND scheduleDate >= ? AND scheduleDate <= LAST_DAY(?)`;
      const params: any[] = [dateFrom, dateFrom];
      if (input.storeId !== undefined) { sql += " AND storeId=?"; params.push(input.storeId); }
      sql += " ORDER BY employeeName, scheduleDate";
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  upsertSchedule: adminProcedure
    .input(z.object({
      storeId: z.number(),
      employeeName: z.string().min(1),
      userId: z.number().optional(),
      scheduleDate: z.string(),
      status: z.enum(["work","rest","designated","personal_leave","public_leave","absent","overtime"]),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      actualHours: z.number().optional(),
      supportStoreId: z.number().optional(),
      note: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      await (db as any).$client.execute(
        `INSERT INTO os_schedules
          (tenantId, storeId, userId, employeeName, scheduleDate, status,
           startTime, endTime, actualHours, supportStoreId, note, createdBy)
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           status=VALUES(status), startTime=VALUES(startTime),
           endTime=VALUES(endTime), actualHours=VALUES(actualHours),
           supportStoreId=VALUES(supportStoreId), note=VALUES(note)`,
        [input.storeId, input.userId ?? null, input.employeeName, input.scheduleDate,
         input.status, input.startTime ?? null, input.endTime ?? null,
         input.actualHours ?? null, input.supportStoreId ?? null,
         input.note ?? null, ctx.user.name]
      );
      return { success: true };
    }),

  batchUpsertSchedules: adminProcedure
    .input(z.object({
      schedules: z.array(z.object({
        storeId: z.number(),
        employeeName: z.string(),
        userId: z.number().optional(),
        scheduleDate: z.string(),
        status: z.enum(["work","rest","designated","personal_leave","public_leave","absent","overtime"]),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        actualHours: z.number().optional(),
        supportStoreId: z.number().optional(),
        note: z.string().optional()
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      if (input.schedules.length === 0) return { success: true, count: 0 };
      const values = input.schedules.map(s => [
        1, s.storeId, s.userId ?? null, s.employeeName, s.scheduleDate,
        s.status, s.startTime ?? null, s.endTime ?? null,
        s.actualHours ?? null, s.supportStoreId ?? null,
        s.note ?? null, ctx.user.name
      ]);
      const placeholders = values.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
      const flat = values.flat();
      await (db as any).$client.execute(
        `INSERT INTO os_schedules
          (tenantId,storeId,userId,employeeName,scheduleDate,status,
           startTime,endTime,actualHours,supportStoreId,note,createdBy)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE
           status=VALUES(status), startTime=VALUES(startTime),
           endTime=VALUES(endTime), actualHours=VALUES(actualHours),
           supportStoreId=VALUES(supportStoreId), note=VALUES(note)`,
        flat
      );
      return { success: true, count: input.schedules.length };
    }),

  getMonthSummary: adminProcedure
    .input(z.object({
      storeId: z.number().optional(),
      year: z.number(),
      month: z.number()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const mm = String(input.month).padStart(2, "0");
      const dateFrom = `${input.year}-${mm}-01`;
      let sql = `SELECT employeeName,
        SUM(CASE WHEN status IN ('work','designated','overtime') THEN 1 ELSE 0 END) as workDays,
        SUM(CASE WHEN status='rest' THEN 1 ELSE 0 END) as restDays,
        SUM(CASE WHEN status='personal_leave' THEN 1 ELSE 0 END) as personalLeaveDays,
        SUM(CASE WHEN status='public_leave' THEN 1 ELSE 0 END) as publicLeaveDays,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absentDays,
        SUM(CASE WHEN status='overtime' THEN 1 ELSE 0 END) as overtimeDays,
        COALESCE(SUM(actualHours),0) as totalHours
        FROM os_schedules
        WHERE tenantId=1
        AND scheduleDate >= ? AND scheduleDate <= LAST_DAY(?)`;
      const params: any[] = [dateFrom, dateFrom];
      if (input.storeId !== undefined) { sql += " AND storeId=?"; params.push(input.storeId); }
      sql += " GROUP BY employeeName ORDER BY employeeName";
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),
});

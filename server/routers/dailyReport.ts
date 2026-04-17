import { z } from 'zod';
import { router, adminProcedure, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';

const STORES = ['東勢', '東山', '逢甲早', '逢甲晚', '民權', '大里', '永興', '南屯林新', '南屯大墩', '北屯昌平', '瀋陽梅川', '西屯福上'];

export const dailyReportRouter = router({

  checkHoliday: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { isHoliday: false, description: null };
      const [rows] = await (db as any).$client.execute(
        'SELECT isHoliday, description FROM os_tw_holidays WHERE date = ? LIMIT 1',
        [input.date]
      );
      const row = (rows as any[])[0];
      return { isHoliday: row ? !!row.isHoliday : false, description: row?.description || null };
    }),

  submit: protectedProcedure
    .input(z.object({
      tenantId: z.number().default(1),
      reportDate: z.string(),
      storeName: z.string(),
      isHoliday: z.boolean(),
      instoreSales: z.number().default(0),
      uberSales: z.number().default(0),
      pandaSales: z.number().default(0),
      guestInstore: z.number().default(0),
      guestUber: z.number().default(0),
      guestPanda: z.number().default(0),
      phoneOrderCount: z.number().default(0),
      phoneOrderAmount: z.number().default(0),
      deliveryOrderCount: z.number().default(0),
      deliveryOrderAmount: z.number().default(0),
      voidCount: z.number().default(0),
      voidAmount: z.number().default(0),
      cashVoucherCount: z.number().default(0),
      loyaltyCardCount: z.number().default(0),
      staffFull: z.number().default(0),
      staffPart: z.number().default(0),
      laborHours: z.number().default(0),
      dailyCost: z.number().default(0),
      reviewGood: z.number().default(0),
      reviewBad: z.number().default(0),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const submittedBy = (ctx.user as any).name || (ctx.user as any).email || 'unknown';
      await (db as any).$client.execute(`
        INSERT INTO os_daily_reports
          (tenantId, reportDate, storeName, isHoliday,
           instoreSales, uberSales, pandaSales,
           guestInstore, guestUber, guestPanda,
           phoneOrderCount, phoneOrderAmount,
           deliveryOrderCount, deliveryOrderAmount,
           voidCount, voidAmount,
           cashVoucherCount, loyaltyCardCount,
           staffFull, staffPart, laborHours,
           dailyCost, reviewGood, reviewBad, note, submittedBy)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          isHoliday=VALUES(isHoliday),
          instoreSales=VALUES(instoreSales), uberSales=VALUES(uberSales), pandaSales=VALUES(pandaSales),
          guestInstore=VALUES(guestInstore), guestUber=VALUES(guestUber), guestPanda=VALUES(guestPanda),
          phoneOrderCount=VALUES(phoneOrderCount), phoneOrderAmount=VALUES(phoneOrderAmount),
          deliveryOrderCount=VALUES(deliveryOrderCount), deliveryOrderAmount=VALUES(deliveryOrderAmount),
          voidCount=VALUES(voidCount), voidAmount=VALUES(voidAmount),
          cashVoucherCount=VALUES(cashVoucherCount), loyaltyCardCount=VALUES(loyaltyCardCount),
          staffFull=VALUES(staffFull), staffPart=VALUES(staffPart), laborHours=VALUES(laborHours),
          dailyCost=VALUES(dailyCost), reviewGood=VALUES(reviewGood), reviewBad=VALUES(reviewBad),
          note=VALUES(note), submittedBy=VALUES(submittedBy), updatedAt=NOW()
      `, [input.tenantId, input.reportDate, input.storeName, input.isHoliday ? 1 : 0,
          input.instoreSales, input.uberSales, input.pandaSales,
          input.guestInstore, input.guestUber, input.guestPanda,
          input.phoneOrderCount, input.phoneOrderAmount,
          input.deliveryOrderCount, input.deliveryOrderAmount,
          input.voidCount, input.voidAmount,
          input.cashVoucherCount, input.loyaltyCardCount,
          input.staffFull, input.staffPart, input.laborHours,
          input.dailyCost, input.reviewGood, input.reviewBad,
          input.note || null, submittedBy]);
      return { success: true };
    }),

  getByDate: protectedProcedure
    .input(z.object({ storeName: z.string(), reportDate: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [rows] = await (db as any).$client.execute(
        'SELECT * FROM os_daily_reports WHERE storeName = ? AND reportDate = ? LIMIT 1',
        [input.storeName, input.reportDate]
      );
      return (rows as any[])[0] || null;
    }),

  monthlySummary: adminProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { daily: [], monthly: [] };
      const [rows] = await (db as any).$client.execute(`
        SELECT
          storeName,
          COUNT(*) as reportDays,
          SUM(IF(isHoliday=0, 1, 0)) as weekdayDays,
          SUM(IF(isHoliday=1, 1, 0)) as holidayDays,
          SUM(totalSales) as totalSales,
          SUM(instoreSales) as instoreSales,
          SUM(uberSales) as uberSales,
          SUM(pandaSales) as pandaSales,
          SUM(guestTotal) as guestTotal,
          ROUND(AVG(IF(isHoliday=0, totalSales, NULL))) as avgWeekdaySales,
          ROUND(AVG(IF(isHoliday=1, totalSales, NULL))) as avgHolidaySales,
          ROUND(AVG(productivity)) as avgProductivity,
          SUM(dailyCost) as totalDailyCost,
          SUM(phoneOrderAmount) as phoneOrderAmount,
          SUM(reviewGood) as reviewGood,
          SUM(reviewBad) as reviewBad,
          SUM(laborHours) as totalLaborHours
        FROM os_daily_reports
        WHERE tenantId = 1 AND YEAR(reportDate) = ? AND MONTH(reportDate) = ?
        GROUP BY storeName
        ORDER BY totalSales DESC
      `, [input.year, input.month]);

      const [monthly] = await (db as any).$client.execute(`
        SELECT * FROM os_monthly_reports
        WHERE tenantId = 1 AND year = ? AND month = ?
      `, [input.year, input.month]);

      return { daily: rows as any[], monthly: monthly as any[] };
    }),

  list: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      storeName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let sql = `SELECT * FROM os_daily_reports WHERE tenantId = 1 AND reportDate BETWEEN ? AND ?`;
      const params: any[] = [input.startDate, input.endDate];
      if (input.storeName) { sql += ` AND storeName = ?`; params.push(input.storeName); }
      sql += ` ORDER BY reportDate DESC, storeName ASC LIMIT 1000`;
      const [rows] = await (db as any).$client.execute(sql, params);
      return rows as any[];
    }),

  submitMonthly: protectedProcedure
    .input(z.object({
      storeName: z.string(),
      year: z.number(),
      month: z.number(),
      electricityFee: z.number().default(0),
      waterFee: z.number().default(0),
      rentFee: z.number().default(0),
      miscFee: z.number().default(0),
      staffSalaryCost: z.number().default(0),
      performanceReview: z.string().optional(),
      competitorInfo: z.string().optional(),
      monthlyPlan: z.string().optional(),
      staffChanges: z.string().optional(),
      otherNotes: z.string().optional(),
      targetSales: z.number().default(0),
      targetGuest: z.number().default(0),
      targetProductivity: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const submittedBy = (ctx.user as any).name || (ctx.user as any).email || 'unknown';
      await (db as any).$client.execute(`
        INSERT INTO os_monthly_reports
          (tenantId, storeName, year, month,
           electricityFee, waterFee, rentFee, miscFee, staffSalaryCost,
           performanceReview, competitorInfo, monthlyPlan, staffChanges, otherNotes,
           targetSales, targetGuest, targetProductivity, submittedBy)
        VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          electricityFee=VALUES(electricityFee), waterFee=VALUES(waterFee),
          rentFee=VALUES(rentFee), miscFee=VALUES(miscFee),
          staffSalaryCost=VALUES(staffSalaryCost),
          performanceReview=VALUES(performanceReview),
          competitorInfo=VALUES(competitorInfo), monthlyPlan=VALUES(monthlyPlan),
          staffChanges=VALUES(staffChanges), otherNotes=VALUES(otherNotes),
          targetSales=VALUES(targetSales), targetGuest=VALUES(targetGuest),
          targetProductivity=VALUES(targetProductivity),
          submittedBy=VALUES(submittedBy), updatedAt=NOW()
      `, [input.storeName, input.year, input.month,
          input.electricityFee, input.waterFee, input.rentFee, input.miscFee,
          input.staffSalaryCost,
          input.performanceReview || null, input.competitorInfo || null,
          input.monthlyPlan || null, input.staffChanges || null, input.otherNotes || null,
          input.targetSales, input.targetGuest, input.targetProductivity, submittedBy]);
      return { success: true };
    }),

  getStores: protectedProcedure.query(async () => STORES),
});

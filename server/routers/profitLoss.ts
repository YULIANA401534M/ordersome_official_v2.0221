import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';

export const profitLossRouter = router({
  getProfitLoss: adminProcedure
    .input(z.object({
      storeId: z.number().optional(),
      year: z.number(),
      month: z.number().min(1).max(12),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });

      const { year, month, storeId } = input;

      // a. 日報加總（totalSales, guestTotal）
      let dailySql = `
        SELECT
          COALESCE(SUM(total_sales), 0)  AS totalSales,
          COALESCE(SUM(guest_total), 0)  AS guestTotal
        FROM os_daily_reports
        WHERE tenant_id = 1
          AND YEAR(report_date) = ?
          AND MONTH(report_date) = ?
      `;
      const dailyParams: (number | string)[] = [year, month];
      if (storeId) {
        dailySql += ' AND store_id = ?';
        dailyParams.push(storeId);
      }
      const [dailyRows] = await (db as any).$client.execute(dailySql, dailyParams);
      const daily = (dailyRows as any[])[0] ?? {};
      const totalSales = Number(daily.totalSales ?? 0);
      const guestTotal = Number(daily.guestTotal ?? 0);

      // b. 月報費用
      let monthlySql = `
        SELECT
          COALESCE(SUM(electricity_fee), 0) AS electricityFee,
          COALESCE(SUM(water_fee), 0)       AS waterFee,
          COALESCE(SUM(salary_total), 0)    AS salaryTotal,
          GROUP_CONCAT(performance_review SEPARATOR '\n') AS performanceReview,
          GROUP_CONCAT(monthly_plan SEPARATOR '\n')       AS monthlyPlan
        FROM os_monthly_reports
        WHERE tenant_id = 1 AND year = ? AND month = ?
      `;
      const monthlyParams: (number | string)[] = [year, month];
      if (storeId) {
        monthlySql = `
          SELECT
            COALESCE(SUM(electricity_fee), 0) AS electricityFee,
            COALESCE(SUM(water_fee), 0)       AS waterFee,
            COALESCE(SUM(salary_total), 0)    AS salaryTotal,
            performance_review                AS performanceReview,
            monthly_plan                      AS monthlyPlan
          FROM os_monthly_reports
          WHERE tenant_id = 1 AND year = ? AND month = ? AND store_id = ?
          LIMIT 1
        `;
        monthlyParams.push(storeId);
      }
      const [monthlyRows] = await (db as any).$client.execute(monthlySql, monthlyParams);
      const monthly = (monthlyRows as any[])[0] ?? {};
      const electricityFee = Number(monthly.electricityFee ?? 0);
      const waterFee = Number(monthly.waterFee ?? 0);
      const salaryTotal = Number(monthly.salaryTotal ?? 0);
      const performanceReview: string = monthly.performanceReview ?? '';
      const monthlyPlan: string = monthly.monthlyPlan ?? '';

      // c. 退佣收入
      let rebateSql = `
        SELECT COALESCE(SUM(rebate_amount), 0) AS rebateIncome
        FROM os_rebate_records
        WHERE tenant_id = 1
          AND year = ? AND month = ?
          AND status IN ('confirmed', 'received')
      `;
      const rebateParams: (number | string)[] = [year, month];
      if (storeId) {
        rebateSql += ' AND store_id = ?';
        rebateParams.push(storeId);
      }
      const [rebateRows] = await (db as any).$client.execute(rebateSql, rebateParams);
      const rebateIncome = Number((rebateRows as any[])[0]?.rebateIncome ?? 0);

      // d. 食材成本估算（35%）
      const foodCost = Math.round(totalSales * 0.35);

      // e. 損益計算
      const grossProfit = totalSales - foodCost;
      const operatingProfit = grossProfit - electricityFee - waterFee - salaryTotal + rebateIncome;
      const profitRate = totalSales > 0 ? operatingProfit / totalSales : 0;
      const avgTicket = guestTotal > 0 ? Math.round(totalSales / guestTotal) : 0;

      return {
        year,
        month,
        storeId: storeId ?? null,
        // 營收
        totalSales,
        guestTotal,
        avgTicket,
        // 成本
        foodCost,
        electricityFee,
        waterFee,
        salaryTotal,
        // 退佣
        rebateIncome,
        // 損益
        grossProfit,
        operatingProfit,
        profitRate,
        // 備註
        performanceReview,
        monthlyPlan,
      };
    }),
});

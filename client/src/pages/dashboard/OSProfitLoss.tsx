import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { TrendingUp } from "lucide-react";

const now = new Date();
const DEFAULT_YEAR = now.getFullYear();
const DEFAULT_MONTH = now.getMonth() + 1;

function fmt(n: number) {
  return n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function pct(num: number, base: number) {
  if (base <= 0) return "—";
  return ((num / base) * 100).toFixed(1) + "%";
}

export default function OSProfitLoss() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const canSeeCost = isSuperAdmin || (user as any)?.has_procurement_access === 1;

  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [storeId, setStoreId] = useState<number | undefined>(undefined);

  const { data: stores = [] } = trpc.store.listAll.useQuery();

  const { data, isLoading } = trpc.profitLoss.getProfitLoss.useQuery(
    { year, month, storeId },
    { placeholderData: (prev: any) => prev }
  );

  const yearOptions = [DEFAULT_YEAR - 1, DEFAULT_YEAR, DEFAULT_YEAR + 1];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const mask = (n: number) => (canSeeCost ? `$ ${fmt(n)}` : "---");
  const maskPct = (n: number, base: number) => (canSeeCost ? pct(n, base) : "---");

  const profitRate = data ? (data.totalSales > 0 ? data.operatingProfit / data.totalSales : 0) : 0;

  const rows = data
    ? [
        { label: "本月營收",   value: `$ ${fmt(data.totalSales)}`,                  ratio: "100%",                            highlight: false },
        { label: "食材成本",   value: mask(data.foodCost),                           ratio: maskPct(data.foodCost, data.totalSales),           highlight: false },
        { label: "電費",       value: mask(data.electricityFee),                     ratio: maskPct(data.electricityFee, data.totalSales),     highlight: false },
        { label: "水費",       value: mask(data.waterFee),                           ratio: maskPct(data.waterFee, data.totalSales),           highlight: false },
        { label: "薪資",       value: mask(data.salaryTotal),                        ratio: maskPct(data.salaryTotal, data.totalSales),        highlight: false },
        { label: "退佣收入",   value: canSeeCost ? `+ $ ${fmt(data.rebateIncome)}` : "---", ratio: maskPct(data.rebateIncome, data.totalSales), highlight: false },
        { label: "營業利益",   value: mask(data.operatingProfit),                   ratio: maskPct(data.operatingProfit, data.totalSales),    highlight: true  },
      ]
    : [];

  return (
    <AdminDashboardLayout>
      <div className="py-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-7 w-7 text-amber-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">損益儀表板</h1>
            <p className="text-sm text-gray-500">整合日報 · 月報費用 · 退佣收入</p>
          </div>
        </div>

        {/* 篩選列 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m} 月</option>
            ))}
          </select>
          {isSuperAdmin && (
            <select
              value={storeId ?? ""}
              onChange={(e) => setStoreId(e.target.value === "" ? undefined : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">全部門市</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400">載入中...</div>
        ) : data ? (
          <>
            {/* KPI 卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">本月營收</p>
                <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: "jf-kamabit, serif" }}>
                  {fmt(data.totalSales)}
                </p>
                <p className="text-xs text-gray-400 mt-1">來客 {fmt(data.guestTotal)} 人 · 均 {fmt(data.avgTicket)} 元</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">營業利益</p>
                <p
                  className={`text-3xl font-bold ${canSeeCost ? (data.operatingProfit >= 0 ? "text-emerald-700" : "text-red-600") : "text-gray-300"}`}
                  style={{ fontFamily: "jf-kamabit, serif" }}
                >
                  {canSeeCost ? fmt(data.operatingProfit) : "---"}
                </p>
                <p className="text-xs text-gray-400 mt-1">毛利 {mask(data.grossProfit)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">利潤率</p>
                <p
                  className={`text-3xl font-bold ${canSeeCost ? (profitRate >= 0 ? "text-emerald-700" : "text-red-600") : "text-gray-300"}`}
                  style={{ fontFamily: "jf-kamabit, serif" }}
                >
                  {canSeeCost ? (profitRate * 100).toFixed(1) + "%" : "---"}
                </p>
                <p className="text-xs text-gray-400 mt-1">{year} 年 {month} 月</p>
              </div>
            </div>

            {/* 費用明細表 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">項目</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600">金額</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600">佔營收比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr
                      key={r.label}
                      className={r.highlight ? "bg-amber-50 font-semibold" : "hover:bg-gray-50"}
                    >
                      <td className="px-5 py-3 text-gray-800">{r.label}</td>
                      <td className={`px-5 py-3 text-right ${r.highlight ? "text-amber-800 text-base" : "text-gray-700"}`}>
                        {r.value}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">{r.ratio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 備註區 */}
            {(data.performanceReview || data.monthlyPlan) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.performanceReview && (
                  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">業績檢討</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.performanceReview}</p>
                  </div>
                )}
                {data.monthlyPlan && (
                  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">月計畫</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.monthlyPlan}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-gray-400">無資料</div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

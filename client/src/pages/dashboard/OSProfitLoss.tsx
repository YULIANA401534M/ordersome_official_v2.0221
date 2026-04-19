import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
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

const CHANNEL_COLORS = ["#b45309","#0ea5e9","#f97316","#8b5cf6","#10b981"];
const CHANNEL_LABELS: Record<string, string> = {
  instore: "內用", uber: "Uber", panda: "熊貓",
  phone: "電話", delivery: "自送",
};

export default function OSProfitLoss() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const canSeeCost = isSuperAdmin || (user as any)?.has_procurement_access === 1;

  useEffect(() => {
    if (!user) return;
    if (user.role !== "super_admin" && !(user as any).has_procurement_access) {
      setLocation("/dashboard");
    }
  }, [user]);

  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);

  const { data, isLoading } = trpc.profitLoss.getProfitLoss.useQuery(
    { year, month },
    { placeholderData: (prev: any) => prev }
  );

  const mask = (n: number) => canSeeCost ? `$${fmt(n)}` : "---";
  const maskPct = (n: number, base: number) => canSeeCost ? pct(n, base) : "---";

  const pieData = data?.channelSales
    ? Object.entries(data.channelSales)
        .filter(([, v]) => Number(v) > 0)
        .map(([k, v]) => ({ name: CHANNEL_LABELS[k] ?? k, value: Number(v) }))
    : [];

  const costData = data ? [
    { name: "採購成本", value: data.foodCost },
    { name: "薪資",     value: data.salaryTotal },
    { name: "電費",     value: data.electricityFee },
    { name: "水費",     value: data.waterFee },
  ].filter(d => d.value > 0) : [];

  const profitRate = data && data.totalSales > 0
    ? data.operatingProfit / data.totalSales
    : 0;

  const kpiCards = data ? [
    {
      label: "本月營收",
      value: `$${fmt(data.totalSales)}`,
      sub: `來客 ${fmt(data.guestTotal)} 人 · 均消 $${fmt(data.avgTicket)}`,
      color: "text-stone-900",
    },
    {
      label: "營業利益",
      value: canSeeCost ? `$${fmt(data.operatingProfit)}` : "---",
      sub: `毛利 ${mask(data.grossProfit)}`,
      color: canSeeCost
        ? data.operatingProfit >= 0 ? "text-emerald-700" : "text-red-600"
        : "text-stone-300",
    },
    {
      label: "利潤率",
      value: canSeeCost ? (profitRate * 100).toFixed(1) + "%" : "---",
      sub: data.isCostEstimated ? "成本估算35%（無採購資料）" : "採購成本實際數字",
      color: canSeeCost
        ? profitRate >= 0 ? "text-emerald-700" : "text-red-600"
        : "text-stone-300",
    },
    {
      label: "退佣收入",
      value: canSeeCost ? `$${fmt(data.rebateIncome)}` : "---",
      sub: "廣弘÷1.12差額等",
      color: "text-emerald-600",
    },
  ] : [];

  return (
    <AdminDashboardLayout>
      <div className="py-4 max-w-6xl mx-auto px-4 space-y-6">

        {/* 標題 + 篩選 */}
        <div className="flex flex-wrap items-center gap-3">
          <TrendingUp className="h-6 w-6 text-amber-700" />
          <h1 className="text-xl font-bold text-stone-900">損益儀表板</h1>
          <div className="ml-auto flex gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
              {[DEFAULT_YEAR-1, DEFAULT_YEAR, DEFAULT_YEAR+1].map(y =>
                <option key={y} value={y}>{y}年</option>
              )}
            </select>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm bg-white">
              {Array.from({length:12},(_,i)=>i+1).map(m =>
                <option key={m} value={m}>{m}月</option>
              )}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-stone-400">載入中...</div>
        ) : !data || data.totalSales === 0 ? (
          <div className="py-20 text-center text-stone-400">
            本月無日報資料，請確認門市日報已提交
          </div>
        ) : (
          <>
            {/* KPI 卡片列 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpiCards.map(k => (
                <div key={k.label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                  <p className="text-xs text-stone-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`} style={{fontFamily:"jf-kamabit,serif"}}>
                    {k.value}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* 每日趨勢折線圖 */}
            {data.dailyTrend?.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                <p className="text-sm font-medium text-stone-700 mb-3">每日營收趨勢</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.dailyTrend}
                    margin={{top:4, right:16, left:0, bottom:0}}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b45309" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#b45309" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8"/>
                    <XAxis dataKey="day" tick={{fontSize:11}} tickLine={false}/>
                    <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip
                      formatter={(v: number) => [`$${fmt(v)}`, "營收"]}
                      labelStyle={{fontSize:12}} contentStyle={{fontSize:12,borderRadius:8}}/>
                    <Area type="monotone" dataKey="sales" stroke="#b45309"
                      strokeWidth={2} fill="url(#salesGrad)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 通路分拆 + 費用結構 並排 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {pieData.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                  <p className="text-sm font-medium text-stone-700 mb-2">營收通路分拆</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55}
                        outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}/>
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`$${fmt(v)}`, ""]}
                        contentStyle={{fontSize:12,borderRadius:8}}/>
                      <Legend iconType="circle" iconSize={8}
                        formatter={(v: string) => <span style={{fontSize:11}}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {costData.length > 0 && canSeeCost && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                  <p className="text-sm font-medium text-stone-700 mb-2">費用結構</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={costData} layout="vertical"
                      margin={{top:0,right:24,left:8,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:11}} tickLine={false}
                        tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`}/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:11}}
                        tickLine={false} width={60}/>
                      <Tooltip formatter={(v: number) => [`$${fmt(v)}`, ""]}
                        contentStyle={{fontSize:12,borderRadius:8}}/>
                      <Bar dataKey="value" fill="#b45309" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 損益明細表 */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-stone-600">項目</th>
                    <th className="px-5 py-3 text-right font-medium text-stone-600">金額</th>
                    <th className="px-5 py-3 text-right font-medium text-stone-600">佔營收比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {([
                    { label:"本月營收",    val:data.totalSales,      positive:true,  always:true },
                    { label: data.isCostEstimated ? "食材成本（估算35%）" : "採購成本（實際）",
                              val:data.foodCost,        positive:false, always:false },
                    { label:"電費",        val:data.electricityFee,  positive:false, always:false },
                    { label:"水費",        val:data.waterFee,        positive:false, always:false },
                    { label:"薪資",        val:data.salaryTotal,     positive:false, always:false },
                    { label:"退佣收入",    val:data.rebateIncome,    positive:true,  always:false },
                    { label:"出貨應收",    val:data.arIncome ?? 0,   positive:true,  always:false },
                  ] as { label: string; val: number; positive: boolean; always: boolean }[]).map(r => (
                    <tr key={r.label} className="hover:bg-stone-50">
                      <td className="px-5 py-3 text-stone-700">{r.label}</td>
                      <td className={`px-5 py-3 text-right font-medium
                        ${r.always ? "text-stone-900" : r.positive ? "text-emerald-700" : ""}`}>
                        {r.always ? `$${fmt(r.val)}` : mask(r.val)}
                      </td>
                      <td className="px-5 py-3 text-right text-stone-400">
                        {r.always ? "100%" : maskPct(r.val, data.totalSales)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50 font-semibold border-t-2 border-amber-200">
                    <td className="px-5 py-3 text-amber-900">營業利益</td>
                    <td className={`px-5 py-3 text-right text-base
                      ${canSeeCost ? data.operatingProfit>=0?"text-emerald-700":"text-red-600" : "text-stone-300"}`}>
                      {mask(data.operatingProfit)}
                    </td>
                    <td className="px-5 py-3 text-right text-stone-500">
                      {maskPct(data.operatingProfit, data.totalSales)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 業績檢討 + 月計畫 */}
            {(data.performanceReview || data.monthlyPlan) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.performanceReview && (
                  <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">業績檢討</p>
                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{data.performanceReview}</p>
                  </div>
                )}
                {data.monthlyPlan && (
                  <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">月計畫</p>
                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{data.monthlyPlan}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

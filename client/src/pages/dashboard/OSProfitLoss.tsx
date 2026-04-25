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

function fmt(n: number) { return n.toLocaleString("zh-TW", { maximumFractionDigits: 0 }); }
function pct(num: number, base: number) {
  if (base <= 0) return "—";
  return ((num / base) * 100).toFixed(1) + "%";
}

// Recharts can't use CSS vars, so we use fixed OKLCH-aligned hex values
const AMBER_HEX = "#b08030";
const CHANNEL_COLORS = [AMBER_HEX, "#0ea5e9", "#f97316", "#8b5cf6", "#10b981"];
const CHANNEL_LABELS: Record<string, string> = {
  instore: "內用", uber: "Uber", panda: "熊貓", phone: "電話", delivery: "自送",
};

const panelSt: React.CSSProperties = {
  background: 'var(--os-surface)',
  border: '1px solid var(--os-border)',
  borderRadius: 12,
  padding: '16px 20px',
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

  const profitRate = data && data.totalSales > 0 ? data.operatingProfit / data.totalSales : 0;

  const selectSt: React.CSSProperties = {
    padding: '6px 12px',
    border: '1px solid var(--os-border)',
    borderRadius: 8,
    fontSize: 13,
    background: 'var(--os-surface)',
    color: 'var(--os-text-1)',
  };
  const thSt: React.CSSProperties = { color: 'var(--os-text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <AdminDashboardLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }} className="space-y-5">

        {/* Header + filter */}
        <div className="flex flex-wrap items-center gap-3">
          <TrendingUp style={{ height: 20, width: 20, color: 'var(--os-amber-text)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--os-text-1)', margin: 0 }}>損益儀表板</h1>
          <div className="ml-auto flex gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={selectSt}>
              {[DEFAULT_YEAR-1, DEFAULT_YEAR, DEFAULT_YEAR+1].map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selectSt}>
              {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center" style={{ color: 'var(--os-text-3)', fontSize: 14 }}>載入中...</div>
        ) : !data || data.totalSales === 0 ? (
          <div className="py-20 text-center" style={{ color: 'var(--os-text-3)', fontSize: 14 }}>
            本月無日報資料，請確認門市日報已提交
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 py-3" style={{ borderBottom: '1px solid var(--os-border)' }}>
              <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
                本月營收 <strong style={{ color: 'var(--os-text-1)', fontVariantNumeric: 'tabular-nums' }}>${fmt(data.totalSales)}</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
                來客 <strong style={{ color: 'var(--os-text-1)', fontVariantNumeric: 'tabular-nums' }}>{fmt(data.guestTotal)}</strong> 人
              </span>
              <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
                均消 <strong style={{ color: 'var(--os-text-1)', fontVariantNumeric: 'tabular-nums' }}>${fmt(data.avgTicket)}</strong>
              </span>
              {canSeeCost && (
                <>
                  <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
                    營業利益 <strong style={{ color: data.operatingProfit >= 0 ? 'var(--os-success)' : 'var(--os-danger)', fontVariantNumeric: 'tabular-nums' }}>${fmt(data.operatingProfit)}</strong>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
                    利潤率 <strong style={{ color: profitRate >= 0 ? 'var(--os-success)' : 'var(--os-danger)' }}>{(profitRate * 100).toFixed(1)}%</strong>
                    {data.isCostEstimated && <span style={{ fontSize: 11, color: 'var(--os-text-3)', marginLeft: 4 }}>（估算）</span>}
                  </span>
                </>
              )}
            </div>

            {/* Daily trend chart */}
            {data.dailyTrend?.length > 0 && (
              <div style={panelSt}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)', marginBottom: 12 }}>每日營收趨勢</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.dailyTrend} margin={{top:4, right:16, left:0, bottom:0}}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AMBER_HEX} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={AMBER_HEX} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4"/>
                    <XAxis dataKey="day" tick={{fontSize:11}} tickLine={false}/>
                    <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`}/>
                    <Tooltip formatter={(v: number) => [`$${fmt(v)}`, "營收"]}
                      labelStyle={{fontSize:12}} contentStyle={{fontSize:12,borderRadius:8}}/>
                    <Area type="monotone" dataKey="sales" stroke={AMBER_HEX} strokeWidth={2} fill="url(#salesGrad)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Channel pie + cost bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pieData.length > 0 && (
                <div style={panelSt}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)', marginBottom: 8 }}>營收通路分拆</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`$${fmt(v)}`, ""]} contentStyle={{fontSize:12,borderRadius:8}}/>
                      <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{fontSize:11}}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {costData.length > 0 && canSeeCost && (
                <div style={panelSt}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)', marginBottom: 8 }}>費用結構</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={costData} layout="vertical" margin={{top:0,right:24,left:8,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:11}} tickLine={false}
                        tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`}/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:11}} tickLine={false} width={60}/>
                      <Tooltip formatter={(v: number) => [`$${fmt(v)}`, ""]} contentStyle={{fontSize:12,borderRadius:8}}/>
                      <Bar dataKey="value" fill={AMBER_HEX} radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* P&L detail table */}
            <div style={{ ...panelSt, padding: 0, overflow: 'hidden' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
                    <th className="px-5 py-3 text-left" style={thSt}>項目</th>
                    <th className="px-5 py-3 text-right" style={thSt}>金額</th>
                    <th className="px-5 py-3 text-right" style={thSt}>佔營收比</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { label: "本月營收", val: data.totalSales, positive: true, always: true },
                    { label: data.isCostEstimated ? "食材成本（估算35%）" : "採購成本（實際）", val: data.foodCost, positive: false, always: false },
                    { label: "電費", val: data.electricityFee, positive: false, always: false },
                    { label: "水費", val: data.waterFee, positive: false, always: false },
                    { label: "薪資", val: data.salaryTotal, positive: false, always: false },
                    { label: "退佣收入", val: data.rebateIncome, positive: true, always: false },
                    { label: "出貨應收", val: data.arIncome ?? 0, positive: true, always: false },
                  ] as { label: string; val: number; positive: boolean; always: boolean }[]).map(r => (
                    <tr
                      key={r.label}
                      style={{ borderTop: '1px solid var(--os-border-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--os-amber-soft)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-5 py-3" style={{ color: 'var(--os-text-1)' }}>{r.label}</td>
                      <td className="px-5 py-3 text-right font-medium" style={{
                        color: r.always ? 'var(--os-text-1)' : r.positive ? 'var(--os-success)' : 'var(--os-text-2)',
                      }}>
                        {r.always ? `$${fmt(r.val)}` : mask(r.val)}
                      </td>
                      <td className="px-5 py-3 text-right" style={{ color: 'var(--os-text-3)' }}>
                        {r.always ? "100%" : maskPct(r.val, data.totalSales)}
                      </td>
                    </tr>
                  ))}
                  {/* Operating profit summary row */}
                  <tr style={{ background: 'var(--os-amber-soft)', borderTop: '2px solid var(--os-border)' }}>
                    <td className="px-5 py-3 font-semibold" style={{ color: 'var(--os-amber-text)' }}>營業利益</td>
                    <td className="px-5 py-3 text-right text-base font-semibold" style={{
                      color: canSeeCost ? (data.operatingProfit >= 0 ? 'var(--os-success)' : 'var(--os-danger)') : 'var(--os-text-3)',
                    }}>
                      {mask(data.operatingProfit)}
                    </td>
                    <td className="px-5 py-3 text-right" style={{ color: 'var(--os-text-3)' }}>
                      {maskPct(data.operatingProfit, data.totalSales)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Performance review + monthly plan */}
            {(data.performanceReview || data.monthlyPlan) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.performanceReview && (
                  <div style={panelSt}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--os-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>業績檢討</p>
                    <p style={{ fontSize: 13, color: 'var(--os-text-1)', whiteSpace: 'pre-wrap' }}>{data.performanceReview}</p>
                  </div>
                )}
                {data.monthlyPlan && (
                  <div style={panelSt}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--os-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>月計畫</p>
                    <p style={{ fontSize: 13, color: 'var(--os-text-1)', whiteSpace: 'pre-wrap' }}>{data.monthlyPlan}</p>
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

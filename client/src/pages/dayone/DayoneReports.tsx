import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportCSV } from "@/utils/exportCSV";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

function todayStr() { return new Date().toLocaleDateString("sv-SE"); }
function thisYear() { return new Date().getFullYear(); }
function thisMonth() { return new Date().getMonth() + 1; }

const MONTH_NAMES = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const thSt: React.CSSProperties = {
  padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
  color: "#78716c", textTransform: "uppercase", letterSpacing: "0.05em",
  background: "rgba(245,241,232,0.7)", borderBottom: "1px solid rgba(217,119,6,0.10)",
};
const tdSt: React.CSSProperties = {
  padding: "10px 16px", fontSize: 13, color: "#292524",
  borderBottom: "1px solid rgba(217,119,6,0.08)",
};

export default function DayoneReports() {
  const [date, setDate] = useState(todayStr());
  const [month, setMonth] = useState(`${thisYear()}-${String(thisMonth()).padStart(2, "0")}`);
  const [statsYear, setStatsYear] = useState(thisYear());

  const year = Number(month.split("-")[0]);
  const mon = Number(month.split("-")[1]);

  const { data: daily } = trpc.dayone.reports.dailySummary.useQuery({ tenantId: TENANT_ID, date });
  const { data: monthly } = trpc.dayone.reports.monthlyRevenue.useQuery({ tenantId: TENANT_ID, year, month: mon });
  const { data: topCustomers } = trpc.dayone.reports.topCustomers.useQuery({ tenantId: TENANT_ID, limit: 10 });
  const { data: inventoryAlerts } = trpc.dayone.reports.inventoryAlerts.useQuery({ tenantId: TENANT_ID });
  const { data: collectionStats } = trpc.dayone.ar.monthlyCollectionStats.useQuery({ tenantId: TENANT_ID, year: statsYear });

  const chartData = (collectionStats as any[] ?? []).map((r: any) => ({
    name: MONTH_NAMES[Number(r.month)] ?? `${r.month}月`,
    已收: Number(r.paidAmount ?? 0),
    未收: Number(r.unpaidAmount ?? 0),
    總額: Number(r.totalAmount ?? 0),
  }));

  const emptyRow = (msg: string) => (
    <tr><td colSpan={10} style={{ ...tdSt, textAlign: "center", color: "#a8a29e", padding: "32px 0" }}>{msg}</td></tr>
  );

  return (
    <DayoneLayout>
      <div className="dayone-page-header mb-6">
        <div>
          <h1 className="dayone-page-title">報表分析</h1>
          <p className="dayone-page-subtitle">日報、月報、客戶排行、庫存警示與收款統計</p>
        </div>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="mb-5 h-auto gap-1 rounded-2xl p-1" style={{ background: "rgba(245,241,232,0.7)", border: "1px solid rgba(217,119,6,0.12)" }}>
          {["日報", "月報", "客戶排行", "庫存警示", "收款統計"].map((label, i) => {
            const val = ["daily", "monthly", "customers", "inventory", "collection"][i];
            return (
              <TabsTrigger key={val} value={val}
                className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-[linear-gradient(135deg,#f59e0b,#d97706)] data-[state=active]:text-white data-[state=inactive]:text-stone-600">
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── 日報 ── */}
        <TabsContent value="daily" className="space-y-4">
          <div className="dayone-panel rounded-[28px] overflow-hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4" style={{ borderBottom: "1px solid rgba(217,119,6,0.10)" }}>
              <div className="font-semibold text-stone-900" style={{ fontSize: 15 }}>每日配送概況</div>
              <div className="flex items-center gap-2">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40 rounded-xl border-amber-200/60 bg-white/70" />
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-amber-200/80 text-stone-600 hover:bg-amber-50" onClick={() => {
                  const rows = (daily?.byDriver as any[] ?? []).map((r: any) => ({ 日期: date, 司機: r.driverName ?? "未指派", 訂單數: r.orderCount, 金額: Number(r.totalAmount ?? 0) }));
                  exportCSV(rows, `日報_${date}`, [{ key: "日期", label: "日期" }, { key: "司機", label: "司機" }, { key: "訂單數", label: "訂單數" }, { key: "金額", label: "營業額" }]);
                }}><Download className="h-3.5 w-3.5" />CSV</Button>
              </div>
            </div>
            <div className="p-6">
              {daily ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "總訂單", value: (daily.orderSummary as any)?.totalOrders ?? 0 },
                      { label: "已送達", value: (daily.orderSummary as any)?.deliveredCount ?? 0 },
                      { label: "待處理", value: (daily.orderSummary as any)?.pendingCount ?? 0 },
                      { label: "總金額", value: `$${Number((daily.orderSummary as any)?.totalAmount ?? 0).toLocaleString()}` },
                    ].map(item => (
                      <div key={item.label} style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(217,119,6,0.10)", borderRadius: 16, padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#78716c", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {(daily.byDriver as any[])?.length > 0 && (
                    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(217,119,6,0.10)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>{["司機", "訂單數", "金額"].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
                        <tbody>
                          {(daily.byDriver as any[]).map((r: any, i: number) => (
                            <tr key={i} style={{ transition: "background 0.12s" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(254,243,199,0.5)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "")}>
                              <td style={tdSt}>{r.driverName ?? "未指派"}</td>
                              <td style={tdSt}>{r.orderCount}</td>
                              <td style={tdSt}>${Number(r.totalAmount ?? 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : <div className="text-center text-stone-400 py-8 text-sm">載入中...</div>}
            </div>
          </div>
        </TabsContent>

        {/* ── 月報 ── */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="dayone-panel rounded-[28px] overflow-hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4" style={{ borderBottom: "1px solid rgba(217,119,6,0.10)" }}>
              <div className="font-semibold text-stone-900" style={{ fontSize: 15 }}>月度營收</div>
              <div className="flex items-center gap-2">
                <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-36 rounded-xl border-amber-200/60 bg-white/70" />
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-amber-200/80 text-stone-600 hover:bg-amber-50" onClick={() => exportCSV(monthly as any[] ?? [], `月報_${month}`, [{ key: "date", label: "日期" }, { key: "orders", label: "訂單數" }, { key: "revenue", label: "營業額" }])}><Download className="h-3.5 w-3.5" />CSV</Button>
              </div>
            </div>
            <div style={{ borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["日期", "訂單數", "營收"].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
                <tbody>
                  {!(monthly as any[])?.length ? emptyRow("該月無已送達訂單資料") : (monthly as any[]).map((r: any, i: number) => (
                    <tr key={i} onMouseEnter={e => (e.currentTarget.style.background = "rgba(254,243,199,0.5)")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={tdSt}>{r.date}</td>
                      <td style={tdSt}>{r.orders}</td>
                      <td style={tdSt}>${Number(r.revenue ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── 客戶排行 ── */}
        <TabsContent value="customers" className="space-y-4">
          <div className="dayone-panel rounded-[28px] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(217,119,6,0.10)" }}>
              <div className="font-semibold text-stone-900" style={{ fontSize: 15 }}>前 10 大客戶</div>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-amber-200/80 text-stone-600 hover:bg-amber-50" onClick={() => exportCSV(topCustomers as any[] ?? [], "Top客戶", [{ key: "name", label: "客戶名稱" }, { key: "phone", label: "電話" }, { key: "orderCount", label: "訂單數" }, { key: "totalSpending", label: "總金額" }])}><Download className="h-3.5 w-3.5" />CSV</Button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["客戶", "電話", "訂單數", "累計消費"].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
              <tbody>
                {!(topCustomers as any[])?.length ? emptyRow("尚無資料") : (topCustomers as any[]).map((r: any, i: number) => (
                  <tr key={i} onMouseEnter={e => (e.currentTarget.style.background = "rgba(254,243,199,0.5)")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={tdSt}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(251,191,36,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#92400e", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontWeight: 600 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdSt, color: "#78716c" }}>{r.phone ?? "-"}</td>
                    <td style={tdSt}>{r.orderCount}</td>
                    <td style={{ ...tdSt, fontWeight: 600 }}>${Number(r.totalSpending ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── 庫存警示 ── */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="dayone-panel rounded-[28px] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(217,119,6,0.10)" }}>
              <div className="font-semibold text-stone-900" style={{ fontSize: 15 }}>庫存警示（低於安全庫存）</div>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-amber-200/80 text-stone-600 hover:bg-amber-50" onClick={() => exportCSV(inventoryAlerts as any[] ?? [], "庫存警示", [{ key: "productName", label: "品項名稱" }, { key: "currentQty", label: "現有庫存" }, { key: "safetyQty", label: "安全庫存" }])}><Download className="h-3.5 w-3.5" />CSV</Button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["品項名稱", "現有庫存", "安全庫存"].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
              <tbody>
                {!(inventoryAlerts as any[])?.length ? emptyRow("庫存狀況良好，無警示品項") : (inventoryAlerts as any[]).map((r: any, i: number) => (
                  <tr key={i} style={{ background: r.currentQty === 0 ? "rgba(254,226,226,0.4)" : "" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(254,243,199,0.5)")} onMouseLeave={e => (e.currentTarget.style.background = r.currentQty === 0 ? "rgba(254,226,226,0.4)" : "")}>
                    <td style={{ ...tdSt, fontWeight: 600 }}>{r.productName}</td>
                    <td style={{ ...tdSt, fontWeight: 700, color: r.currentQty === 0 ? "#dc2626" : "#d97706" }}>{r.currentQty}</td>
                    <td style={{ ...tdSt, color: "#78716c" }}>{r.safetyQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── 收款統計 ── */}
        <TabsContent value="collection" className="space-y-4">
          <div className="dayone-panel rounded-[28px] overflow-hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap px-6 py-4" style={{ borderBottom: "1px solid rgba(217,119,6,0.10)" }}>
              <div className="font-semibold text-stone-900" style={{ fontSize: 15 }}>收款統計</div>
              <div className="flex items-center gap-2">
                <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))}
                  style={{ borderRadius: 10, border: "1px solid rgba(217,119,6,0.20)", padding: "6px 12px", fontSize: 13, background: "rgba(255,255,255,0.7)", color: "#1c1917", outline: "none" }}>
                  {[thisYear(), thisYear() - 1, thisYear() - 2].map(y => <option key={y} value={y}>{y} 年</option>)}
                </select>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-amber-200/80 text-stone-600 hover:bg-amber-50" onClick={() => exportCSV(collectionStats as any[] ?? [], `收款統計_${statsYear}`, [{ key: "month", label: "月份" }, { key: "totalAmount", label: "應收總額" }, { key: "paidAmount", label: "已收總額" }, { key: "unpaidAmount", label: "未收總額" }])}><Download className="h-3.5 w-3.5" />CSV</Button>
              </div>
            </div>
            {!(collectionStats as any[])?.length ? (
              <div className="text-center text-stone-400 py-10 text-sm">該年度無帳款記錄</div>
            ) : (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["月份", "應收總額", "已收總額", "未收總額", "收款率"].map(h => <th key={h} style={thSt}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(collectionStats as any[]).map((r: any, i: number) => {
                      const total = Number(r.totalAmount ?? 0);
                      const paid = Number(r.paidAmount ?? 0);
                      const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
                      return (
                        <tr key={i} onMouseEnter={e => (e.currentTarget.style.background = "rgba(254,243,199,0.5)")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                          <td style={{ ...tdSt, fontWeight: 600 }}>{MONTH_NAMES[Number(r.month)]}</td>
                          <td style={tdSt}>${total.toLocaleString()}</td>
                          <td style={{ ...tdSt, color: "#15803d", fontWeight: 600 }}>${paid.toLocaleString()}</td>
                          <td style={{ ...tdSt, fontWeight: 600, color: Number(r.unpaidAmount) > 0 ? "#dc2626" : "#a8a29e" }}>${Number(r.unpaidAmount ?? 0).toLocaleString()}</td>
                          <td style={tdSt}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, background: "rgba(214,211,209,0.4)", borderRadius: 99, height: 6, maxWidth: 80 }}>
                                <div style={{ background: rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444", height: 6, borderRadius: 99, width: `${rate}%` }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: rate >= 80 ? "#15803d" : rate >= 50 ? "#d97706" : "#dc2626" }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-6 pb-6 pt-4">
                  <div className="text-stone-500 mb-3" style={{ fontSize: 13 }}>{statsYear} 年已收 / 未收趨勢</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,119,6,0.08)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#78716c" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#78716c" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} contentStyle={{ borderRadius: 12, border: "1px solid rgba(217,119,6,0.15)", background: "rgba(255,253,248,0.96)" }} />
                      <Legend />
                      <Bar dataKey="已收" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="未收" fill="#d97706" opacity={0.4} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DayoneLayout>
  );
}

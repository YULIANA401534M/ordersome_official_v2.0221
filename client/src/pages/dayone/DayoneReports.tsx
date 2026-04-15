import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportCSV } from "@/utils/exportCSV";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function thisYear() { return new Date().getFullYear(); }
function thisMonth() { return new Date().getMonth() + 1; }

const MONTH_NAMES = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

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

  // 收款統計圖表資料
  const chartData = (collectionStats as any[] ?? []).map((r: any) => ({
    name: MONTH_NAMES[Number(r.month)] ?? `${r.month}月`,
    已收: Number(r.paidAmount ?? 0),
    未收: Number(r.unpaidAmount ?? 0),
    總額: Number(r.totalAmount ?? 0),
  }));

  return (
    <DayoneLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">報表</h1>

        <Tabs defaultValue="daily">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">日報</TabsTrigger>
            <TabsTrigger value="monthly">月報</TabsTrigger>
            <TabsTrigger value="customers">客戶排行</TabsTrigger>
            <TabsTrigger value="inventory">庫存警示</TabsTrigger>
            <TabsTrigger value="collection">收款統計</TabsTrigger>
          </TabsList>

          {/* ── 日報 ── */}
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">每日配送概況</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
                    <Button size="sm" variant="outline" onClick={() => {
                      const rows = (daily?.byDriver as any[] ?? []).map((r: any) => ({
                        日期: date,
                        司機: r.driverName ?? "未指派",
                        訂單數: r.orderCount,
                        金額: Number(r.totalAmount ?? 0),
                      }));
                      exportCSV(rows, `日報_${date}`, [
                        { key: "日期", label: "日期" },
                        { key: "司機", label: "司機" },
                        { key: "訂單數", label: "訂單數" },
                        { key: "金額", label: "營業額" },
                      ]);
                    }}>匯出 CSV</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {daily ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "總訂單", value: (daily.summary as any)?.totalOrders ?? 0 },
                        { label: "已送達", value: (daily.summary as any)?.deliveredCount ?? 0 },
                        { label: "待處理", value: (daily.summary as any)?.pendingCount ?? 0 },
                        { label: "總金額", value: `$${Number((daily.summary as any)?.totalAmount ?? 0).toLocaleString()}` },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-xs text-gray-500">{item.label}</div>
                          <div className="text-xl font-bold text-gray-900 mt-1">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {(daily.byDriver as any[])?.length > 0 && (
                      <table className="w-full text-sm mt-2">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["司機", "訂單數", "金額"].map(h => (
                              <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(daily.byDriver as any[]).map((r: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="px-4 py-2">{r.driverName ?? "未指派"}</td>
                              <td className="px-4 py-2">{r.orderCount}</td>
                              <td className="px-4 py-2">${Number(r.totalAmount ?? 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : <div className="text-center text-gray-500 py-4">載入中...</div>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 月報 ── */}
          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">月度營收</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-36" />
                    <Button size="sm" variant="outline" onClick={() => {
                      exportCSV(monthly as any[] ?? [], `月報_${month}`, [
                        { key: "date", label: "日期" },
                        { key: "orders", label: "訂單數" },
                        { key: "revenue", label: "營業額" },
                      ]);
                    }}>匯出 CSV</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!(monthly as any[])?.length
                  ? <div className="text-center text-gray-500 py-4">該月無已送達訂單資料</div>
                  : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {["日期", "訂單數", "營收"].map(h => (
                            <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(monthly as any[]).map((r: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="px-4 py-2">{r.date}</td>
                            <td className="px-4 py-2">{r.orders}</td>
                            <td className="px-4 py-2">${Number(r.revenue ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 客戶排行 ── */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">前 10 大客戶</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => {
                    exportCSV(topCustomers as any[] ?? [], "Top客戶", [
                      { key: "name", label: "客戶名稱" },
                      { key: "phone", label: "電話" },
                      { key: "orderCount", label: "訂單數" },
                      { key: "totalSpending", label: "總金額" },
                    ]);
                  }}>匯出 CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                {!(topCustomers as any[])?.length
                  ? <div className="text-center text-gray-500 py-4">尚無資料</div>
                  : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {["客戶", "電話", "訂單數", "累計消費"].map(h => (
                            <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(topCustomers as any[]).map((r: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="px-4 py-2 font-medium">{r.name}</td>
                            <td className="px-4 py-2 text-gray-500">{r.phone ?? "-"}</td>
                            <td className="px-4 py-2">{r.orderCount}</td>
                            <td className="px-4 py-2">${Number(r.totalSpending ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 庫存警示 ── */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">庫存警示（低於安全庫存）</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => {
                    exportCSV(inventoryAlerts as any[] ?? [], "庫存警示", [
                      { key: "productName", label: "品項名稱" },
                      { key: "currentQty", label: "現有庫存" },
                      { key: "safetyQty", label: "安全庫存" },
                    ]);
                  }}>匯出 CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                {!(inventoryAlerts as any[])?.length
                  ? <div className="text-center text-gray-500 py-4">庫存狀況良好，無警示品項</div>
                  : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {["品項名稱", "現有庫存", "安全庫存"].map(h => (
                            <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(inventoryAlerts as any[]).map((r: any, i: number) => (
                          <tr key={i} className={`border-b ${r.currentQty === 0 ? "bg-red-50" : ""}`}>
                            <td className="px-4 py-2 font-medium">{r.productName}</td>
                            <td className={`px-4 py-2 font-bold ${r.currentQty === 0 ? "text-red-600" : "text-amber-600"}`}>{r.currentQty}</td>
                            <td className="px-4 py-2 text-gray-500">{r.safetyQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 收款統計 ── */}
          <TabsContent value="collection" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">收款統計</CardTitle>
                  <div className="flex items-center gap-2">
                    <select
                      value={statsYear}
                      onChange={e => setStatsYear(Number(e.target.value))}
                      className="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
                    >
                      {[thisYear(), thisYear() - 1, thisYear() - 2].map(y => (
                        <option key={y} value={y}>{y} 年</option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => {
                      exportCSV(collectionStats as any[] ?? [], `收款統計_${statsYear}`, [
                        { key: "month", label: "月份" },
                        { key: "totalAmount", label: "應收總額" },
                        { key: "paidAmount", label: "已收總額" },
                        { key: "unpaidAmount", label: "未收總額" },
                      ]);
                    }}>匯出 CSV</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!(collectionStats as any[])?.length ? (
                  <div className="text-center text-gray-500 py-4">該年度無帳款記錄</div>
                ) : (
                  <>
                    {/* 統計表格 */}
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {["月份", "應收總額", "已收總額", "未收總額", "收款率"].map(h => (
                            <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(collectionStats as any[]).map((r: any, i: number) => {
                          const total = Number(r.totalAmount ?? 0);
                          const paid = Number(r.paidAmount ?? 0);
                          const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
                          return (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">{MONTH_NAMES[Number(r.month)]}</td>
                              <td className="px-4 py-2">${total.toLocaleString()}</td>
                              <td className="px-4 py-2 text-green-700">${paid.toLocaleString()}</td>
                              <td className={`px-4 py-2 font-semibold ${Number(r.unpaidAmount) > 0 ? "text-red-600" : "text-gray-400"}`}>
                                ${Number(r.unpaidAmount ?? 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                                  </div>
                                  <span className={`text-xs font-medium ${rate >= 80 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                                    {rate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Recharts 柱狀圖 */}
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 mb-3">{statsYear} 年已收 / 未收趨勢</p>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                          <Legend />
                          <Bar dataKey="已收" fill="#22c55e" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="未收" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DayoneLayout>
  );
}

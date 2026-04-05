import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function thisYear() { return new Date().getFullYear(); }
function thisMonth() { return new Date().getMonth() + 1; }

export default function DayoneReports() {
  const [date, setDate] = useState(todayStr());
  const [month, setMonth] = useState(`${thisYear()}-${String(thisMonth()).padStart(2, "0")}`);

  const year = Number(month.split("-")[0]);
  const mon = Number(month.split("-")[1]);

  const { data: daily } = trpc.dayone.reports.dailySummary.useQuery({ tenantId: TENANT_ID, date });
  const { data: monthly } = trpc.dayone.reports.monthlyRevenue.useQuery({ tenantId: TENANT_ID, year, month: mon });
  const { data: topCustomers } = trpc.dayone.reports.topCustomers.useQuery({ tenantId: TENANT_ID, limit: 10 });

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">報表</h1>

        {/* Daily Summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">每日配送概況</CardTitle>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
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

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">月度營收</CardTitle>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-36" />
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

        {/* Top Customers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">前 10 大客戶</CardTitle>
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
      </div>
    </DayoneLayout>
  );
}

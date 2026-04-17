import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, AlertTriangle, TrendingUp, Truck, CreditCard, Receipt, AlertOctagon } from "lucide-react";
import { useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DayoneDashboard() {
  const [today] = useState(todayStr);
  const { data: summary } = trpc.dayone.reports.dailySummary.useQuery({ tenantId: TENANT_ID, date: today });
  const { data: alerts } = trpc.dayone.reports.inventoryAlerts.useQuery({ tenantId: TENANT_ID });
  const { data: topCustomers } = trpc.dayone.reports.topCustomers.useQuery({ tenantId: TENANT_ID, limit: 5 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data: monthlyRevenue } = trpc.dayone.reports.monthlyRevenue.useQuery({ tenantId: TENANT_ID, year, month });
  const totalMonthly = monthlyRevenue?.reduce((sum: number, r: any) => sum + Number(r.revenue || 0), 0) ?? 0;

  // Finance KPIs
  const { data: arList = [] } = trpc.dayone.ar.listReceivables.useQuery({ tenantId: TENANT_ID, page: 1, status: "unpaid" });
  const { data: arOverdue = [] } = trpc.dayone.ar.listReceivables.useQuery({ tenantId: TENANT_ID, page: 1, status: "overdue" });
  const { data: cashReports = [] } = trpc.dayone.ar.listDriverCashReports.useQuery({ tenantId: TENANT_ID, reportDate: today });
  const { data: pendingReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery({ tenantId: TENANT_ID, status: "pending" });

  const todayArSum = (arList as any[])
    .filter((r: any) => (r.createdAt ?? "").startsWith(today))
    .reduce((s: number, r: any) => s + Number(r.amount), 0);
  const overdueSum = (arOverdue as any[]).reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount ?? 0), 0);
  const anomalyDrivers = (cashReports as any[]).filter((r: any) => r.hasAnomaly).length;
  const pendingReceiptCount = (pendingReceipts as any[]).length;

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">總覽</h1>
          <p className="text-sm text-gray-500 mt-1">{today} 今日配送概況</p>
        </div>

        {/* Finance KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">${todayArSum.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">今日應收</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">${overdueSum.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">逾期未付</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className={`text-xl font-bold ${anomalyDrivers > 0 ? "text-orange-600" : "text-gray-700"}`}>{anomalyDrivers}</div>
                  <div className="text-xs text-gray-500">今日異常司機</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xl font-bold">{pendingReceiptCount}</div>
                  <div className="text-xs text-gray-500">待簽收進貨</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{(summary as any)?.summary?.totalOrders ?? 0}</div>
                  <div className="text-xs text-gray-500">今日訂單</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{(summary as any)?.summary?.deliveredCount ?? 0}</div>
                  <div className="text-xs text-gray-500">已送達</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    ${Number((summary as any)?.summary?.totalAmount ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">今日金額</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">${totalMonthly.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month} 月營收</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Inventory Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                庫存警示
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!alerts || (alerts as any[]).length === 0 ? (
                <p className="text-sm text-gray-500">目前無庫存警示</p>
              ) : (
                <div className="space-y-2">
                  {(alerts as any[]).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-orange-600 font-bold">剩 {item.currentQty} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                本月前 5 大客戶
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!topCustomers || (topCustomers as any[]).length === 0 ? (
                <p className="text-sm text-gray-500">尚無資料</p>
              ) : (
                <div className="space-y-2">
                  {(topCustomers as any[]).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span>{c.name}</span>
                      </div>
                      <span className="text-gray-700 font-medium">${Number(c.totalSpending).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today by driver */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-500" />
                今日各司機配送狀況
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!(summary as any)?.byDriver || (summary as any).byDriver.length === 0 ? (
                <p className="text-sm text-gray-500">今日尚無配送訂單</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="text-left py-2 font-medium">司機</th>
                        <th className="text-right py-2 font-medium">訂單數</th>
                        <th className="text-right py-2 font-medium">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary as any).byDriver.map((d: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{d.driverName ?? "未指派"}</td>
                          <td className="py-2 text-right">{d.orderCount}</td>
                          <td className="py-2 text-right">${Number(d.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DayoneLayout>
  );
}

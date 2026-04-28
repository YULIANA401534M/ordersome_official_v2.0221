import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, AlertTriangle, TrendingUp, Truck, CreditCard, Receipt, AlertOctagon } from "lucide-react";
import { useState } from "react";

function todayStr() {
  return new Date().toLocaleDateString("sv-SE");
}

function KpiCard({
  icon: Icon,
  value,
  label,
  accent = false,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="dayone-surface-card rounded-[24px] p-4 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80">
        <Icon className="h-5 w-5 text-amber-700" />
      </div>
      <div className="min-w-0">
        <div className={`dayone-kpi-value ${danger ? "text-red-700" : accent ? "text-amber-700" : "text-stone-900"}`}>{value}</div>
        <div className="dayone-stat-label mt-1">{label}</div>
      </div>
    </div>
  );
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
  const totalMonthly = (monthlyRevenue as any[])?.reduce((sum: number, r: any) => sum + Number(r.collected || 0), 0) ?? 0;

  const { data: arList = [] } = trpc.dayone.ar.listReceivables.useQuery({ tenantId: TENANT_ID, page: 1, status: "unpaid" });
  const { data: arOverdue = [] } = trpc.dayone.ar.listReceivables.useQuery({ tenantId: TENANT_ID, page: 1, status: "overdue" });
  const { data: cashReports = [] } = trpc.dayone.ar.listDriverCashReports.useQuery({ tenantId: TENANT_ID, reportDate: today });
  const { data: pendingReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery({ tenantId: TENANT_ID, status: "pending" });
  const { data: signedReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery({ tenantId: TENANT_ID, status: "signed" });
  const { data: pendingReturns = [] } = trpc.dayone.inventory.pendingReturns.useQuery({ tenantId: TENANT_ID });

  const todayArSum = (arList as any[])
    .filter((r: any) => (r.dueDate ?? "").startsWith(today))
    .reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount ?? 0), 0);
  const overdueSum = (arOverdue as any[]).reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount ?? 0), 0);
  const anomalyDrivers = (cashReports as any[]).filter((r: any) => r.status === "anomaly").length;
  const pendingReceiptCount = (pendingReceipts as any[]).length;
  const signedReceiptCount = (signedReceipts as any[]).length;
  const pendingReturnCount = (pendingReturns as any[]).length;

  return (
    <DayoneLayout>
      <div className="space-y-5">
        {/* 頁面標題 */}
        <div className="dayone-page-header">
          <div>
            <h1 className="dayone-page-title">大永蛋品總覽</h1>
            <p className="dayone-page-subtitle">{today} · 配送、進貨、應收與庫存提醒</p>
          </div>
        </div>

        {/* KPI 警示區 */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard icon={CreditCard} value={`$${todayArSum.toLocaleString()}`} label="今日到期應收" accent />
          <KpiCard icon={AlertOctagon} value={`$${overdueSum.toLocaleString()}`} label="逾期未收" danger />
          <KpiCard icon={AlertTriangle} value={anomalyDrivers} label="異常司機" danger={anomalyDrivers > 0} />
          <KpiCard icon={Receipt} value={pendingReceiptCount} label="待簽收進貨" />
        </section>

        {/* KPI 配送區 */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard icon={ShoppingCart} value={Number((summary as any)?.orderSummary?.totalOrders ?? 0)} label="今日訂單數" />
          <KpiCard icon={Truck} value={Number((summary as any)?.orderSummary?.deliveredCount ?? 0)} label="今日已送達" />
          <KpiCard icon={TrendingUp} value={`$${Number((summary as any)?.orderSummary?.orderTotalAmount ?? 0).toLocaleString()}`} label="今日金額" accent />
          <KpiCard icon={TrendingUp} value={`$${totalMonthly.toLocaleString()}`} label={`${month} 月營收`} accent />
        </section>

        {/* 庫存狀態 */}
        <section className="grid grid-cols-2 gap-3">
          <KpiCard icon={Receipt} value={signedReceiptCount} label="待入倉進貨" />
          <KpiCard icon={Truck} value={pendingReturnCount} label="回庫待驗" />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="dayone-surface-card rounded-[30px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                庫存警示
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!alerts || (alerts as any[]).length === 0 ? (
                <p className="text-sm text-stone-500">目前沒有低庫存警示。</p>
              ) : (
                <div className="space-y-2">
                  {(alerts as any[]).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-stone-100/80 bg-white/70 px-4 py-3 text-sm">
                      <span className="font-medium text-stone-800">{item.productName}</span>
                      <span className="font-bold text-orange-600">剩 {item.currentQty} {item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dayone-surface-card rounded-[30px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-blue-500" />
                前五大客戶
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!topCustomers || (topCustomers as any[]).length === 0 ? (
                <p className="text-sm text-stone-500">尚無客戶排行資料。</p>
              ) : (
                <div className="space-y-2">
                  {(topCustomers as any[]).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-[22px] border border-stone-100/80 bg-white/70 px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">{i + 1}</span>
                        <span className="font-medium text-stone-800">{c.name}</span>
                      </div>
                      <span className="font-medium text-stone-700">${Number(c.totalSpending).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dayone-surface-card rounded-[30px] xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-green-500" />
                今日司機配送概況
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!(summary as any)?.byDriver || (summary as any).byDriver.length === 0 ? (
                <p className="text-sm text-stone-500">今天尚未建立任何司機配送資料。</p>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="dayone-table w-full text-sm">
                      <thead>
                        <tr>
                          <th>司機</th>
                          <th className="text-right">訂單數</th>
                          <th className="text-right">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(summary as any).byDriver.map((d: any, i: number) => (
                          <tr key={i}>
                            <td>{d.driverName ?? "未指派"}</td>
                            <td className="text-right">{d.orderCount}</td>
                            <td className="text-right">${Number(d.orderAmount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {(summary as any).byDriver.map((d: any, i: number) => (
                      <div key={i} className="rounded-[24px] border border-stone-100/80 bg-white/70 px-4 py-3">
                        <div className="font-medium text-stone-900">{d.driverName ?? "未指派"}</div>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-stone-400">訂單數</div>
                            <div className="font-semibold text-stone-800">{d.orderCount}</div>
                          </div>
                          <div>
                            <div className="text-stone-400">金額</div>
                            <div className="font-semibold text-stone-800">${Number(d.orderAmount).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DayoneLayout>
  );
}

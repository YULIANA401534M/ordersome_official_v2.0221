import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, AlertTriangle, TrendingUp, Truck, CreditCard, Receipt, AlertOctagon } from "lucide-react";
import { useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function KpiCard({
  icon: Icon,
  iconWrap,
  iconColor,
  value,
  label,
  valueClassName = "text-stone-900",
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconWrap: string;
  iconColor: string;
  value: string | number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <Card className="dayone-surface-card rounded-[28px]">
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrap}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
            <div className="text-xs text-stone-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
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
  const totalMonthly = monthlyRevenue?.reduce((sum: number, r: any) => sum + Number(r.revenue || 0), 0) ?? 0;

  const { data: arList = [] } = trpc.dayone.ar.listReceivables.useQuery({ tenantId: TENANT_ID, page: 1, status: "unpaid" });
  const { data: arOverdue = [] } = trpc.dayone.ar.listReceivables.useQuery({ tenantId: TENANT_ID, page: 1, status: "overdue" });
  const { data: cashReports = [] } = trpc.dayone.ar.listDriverCashReports.useQuery({ tenantId: TENANT_ID, reportDate: today });
  const { data: pendingReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery({ tenantId: TENANT_ID, status: "pending" });
  const { data: signedReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery({ tenantId: TENANT_ID, status: "signed" });
  const { data: pendingReturns = [] } = trpc.dayone.inventory.pendingReturns.useQuery({ tenantId: TENANT_ID });

  const todayArSum = (arList as any[])
    .filter((r: any) => (r.createdAt ?? "").startsWith(today))
    .reduce((s: number, r: any) => s + Number(r.amount), 0);
  const overdueSum = (arOverdue as any[]).reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount ?? 0), 0);
  const anomalyDrivers = (cashReports as any[]).filter((r: any) => r.status === "anomaly").length;
  const pendingReceiptCount = (pendingReceipts as any[]).length;
  const signedReceiptCount = (signedReceipts as any[]).length;
  const pendingReturnCount = (pendingReturns as any[]).length;

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <section className="dayone-panel dayone-hero-panel md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="dayone-hero-eyebrow">Dayone Operations</p>
              <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.6rem)] font-ui font-extrabold tracking-[-0.055em] text-stone-950">大永蛋品總覽</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 md:text-[15px]">
                {today} 的配送、進貨、應收與庫存提醒會集中顯示在這裡，手機版改成單欄資訊流，不再出現標題被擠出畫面的問題。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
              <div className="dayone-stat-card">
                <div className="dayone-stat-label">今日訂單</div>
                <div className="dayone-stat-value">{(summary as any)?.summary?.totalOrders ?? 0}</div>
                <div className="dayone-stat-note">目前已進入配送池的單量</div>
              </div>
              <div className="dayone-stat-card">
                <div className="dayone-stat-label">已送達</div>
                <div className="dayone-stat-value">{(summary as any)?.summary?.deliveredCount ?? 0}</div>
                <div className="dayone-stat-note">今日已完成簽收配送</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={CreditCard} iconWrap="bg-blue-100" iconColor="text-blue-600" value={`$${todayArSum.toLocaleString()}`} label="今日應收" />
          <KpiCard icon={AlertOctagon} iconWrap="bg-red-100" iconColor="text-red-600" value={`$${overdueSum.toLocaleString()}`} label="逾期未收" valueClassName="text-red-600" />
          <KpiCard icon={AlertTriangle} iconWrap="bg-orange-100" iconColor="text-orange-600" value={anomalyDrivers} label="異常司機" valueClassName={anomalyDrivers > 0 ? "text-orange-600" : "text-stone-900"} />
          <KpiCard icon={Receipt} iconWrap="bg-amber-100" iconColor="text-amber-600" value={pendingReceiptCount} label="待簽收進貨" />
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={ShoppingCart} iconWrap="bg-blue-100" iconColor="text-blue-600" value={(summary as any)?.summary?.totalOrders ?? 0} label="今日訂單數" />
          <KpiCard icon={Truck} iconWrap="bg-green-100" iconColor="text-green-600" value={(summary as any)?.summary?.deliveredCount ?? 0} label="今日已送達" />
          <KpiCard icon={TrendingUp} iconWrap="bg-amber-100" iconColor="text-amber-600" value={`$${Number((summary as any)?.summary?.totalAmount ?? 0).toLocaleString()}`} label="今日金額" />
          <KpiCard icon={TrendingUp} iconWrap="bg-fuchsia-100" iconColor="text-fuchsia-600" value={`$${totalMonthly.toLocaleString()}`} label={`${month} 月營收`} />
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <KpiCard icon={Receipt} iconWrap="bg-sky-100" iconColor="text-sky-600" value={signedReceiptCount} label="待入倉進貨" />
          <KpiCard icon={Truck} iconWrap="bg-amber-100" iconColor="text-amber-700" value={pendingReturnCount} label="回庫待驗" />
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
                            <td className="text-right">${Number(d.totalAmount).toLocaleString()}</td>
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
                            <div className="font-semibold text-stone-800">${Number(d.totalAmount).toLocaleString()}</div>
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

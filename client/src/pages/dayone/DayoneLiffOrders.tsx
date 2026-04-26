import { DayoneLayout } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarClock,
  Phone,
  ReceiptText,
  Smartphone,
  TimerReset,
  UserRound,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "待確認", className: "bg-stone-100 text-stone-700" },
  assigned: { label: "已指派", className: "bg-sky-100 text-sky-700" },
  picked: { label: "已撿貨", className: "bg-violet-100 text-violet-700" },
  delivering: { label: "配送中", className: "bg-amber-100 text-amber-700" },
  delivered: { label: "已送達", className: "bg-emerald-100 text-emerald-700" },
  returned: { label: "已回庫", className: "bg-rose-100 text-rose-700" },
  cancelled: { label: "已取消", className: "bg-stone-200 text-stone-600" },
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return amount > 0 ? `NT$ ${amount.toLocaleString("zh-TW")}` : "待補金額";
}

export default function DayoneLiffOrders() {
  const { data: orders, isLoading } = trpc.dayone.orders.getLiffOrders.useQuery();

  const orderList = Array.isArray(orders) ? orders : [];
  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter((item: any) => item.status === "pending").length;
  const payableOrders = orderList.filter((item: any) => Number(item.totalAmount) > 0).length;
  const latestOrderAt = orderList[0]?.createdAt ? formatDate(orderList[0].createdAt) : "目前尚無訂單";

  return (
    <DayoneLayout>
      <div className="space-y-6 md:space-y-7">
        <div className="dayone-page-header">
          <div>
            <h1 className="dayone-page-title">LIFF 訂單總覽</h1>
            <p className="dayone-page-subtitle">LINE LIFF 入口 · 訂單狀態、客戶資訊與金額</p>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="dayone-surface-card rounded-[24px] p-4">
            <p className="dayone-stat-label">目前訂單數</p>
            <p className="dayone-kpi-value mt-1 text-stone-900">{totalOrders}</p>
            <p className="dayone-stat-note mt-1">LIFF 入口累積單量</p>
          </div>
          <div className="dayone-surface-card rounded-[24px] p-4">
            <p className="dayone-stat-label">待確認</p>
            <p className="dayone-kpi-value mt-1 text-amber-700">{pendingOrders}</p>
            <p className="dayone-stat-note mt-1">需要補價或後續派單</p>
          </div>
          <div className="dayone-surface-card rounded-[24px] p-4 col-span-2 sm:col-span-1">
            <p className="dayone-stat-label">最近一筆</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-900">{latestOrderAt}</p>
            <p className="mt-1 dayone-stat-note">已補金額 {payableOrders} 筆</p>
          </div>
        </section>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
          </div>
        )}

        {!isLoading && totalOrders === 0 && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <Card className="dayone-surface-card rounded-[30px]">
              <CardContent className="px-6 py-8 md:px-8 md:py-9">
                <div className="flex max-w-xl items-start gap-4">
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-stone-950">目前還沒有 LIFF 訂單</h2>
                    <p className="mt-3 text-sm leading-7 text-stone-600">
                      頁面本身已可正常承接資料，等 LINE LIFF 建單進來後，這裡會先顯示卡片列表，桌面再同步出現完整表格，不會再只剩一大片空白盒子。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dayone-surface-card rounded-[30px]">
              <CardContent className="space-y-4 px-5 py-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-stone-100 p-2.5 text-stone-600">
                    <TimerReset className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">頁面準備狀態</p>
                    <p className="text-xs text-stone-500">適合先確認 LIFF 串接與建單流程</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-stone-600">
                  <div className="rounded-2xl bg-stone-50 px-4 py-3">手機端會優先使用卡片版型顯示客戶與狀態。</div>
                  <div className="rounded-2xl bg-stone-50 px-4 py-3">桌面端保留表格，方便管理端快速對單。</div>
                  <div className="rounded-2xl bg-stone-50 px-4 py-3">待有真實訂單後，再一起驗證狀態色與金額欄位。</div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {!isLoading && totalOrders > 0 && (
          <>
            <div className="dayone-mobile-list md:hidden">
              {orderList.map((order: any) => {
                const status = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-stone-100 text-stone-700" };
                return (
                  <article key={order.orderId} className="dayone-mobile-card overflow-hidden p-0">
                    <div className="border-b border-stone-100/80 bg-[linear-gradient(180deg,rgba(255,250,240,0.92),rgba(255,255,255,0.96))] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">{order.orderNo}</p>
                          <h2 className="mt-2 text-lg font-semibold text-stone-950">{order.customerName || "未填客戶名稱"}</h2>
                        </div>
                        <Badge className={`${status.className} border-0 text-xs`}>{status.label}</Badge>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 text-sm">
                      <div className="flex items-start gap-3 text-stone-600">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        <span>{order.customerPhone || "未提供電話"}</span>
                      </div>
                      <div className="flex items-start gap-3 text-stone-600">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-stone-100/80 px-4 py-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">訂單金額</p>
                        <p className="mt-2 text-lg font-semibold text-stone-950">{formatMoney(order.totalAmount)}</p>
                      </div>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        LIFF
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <Card className="dayone-table-shell hidden md:block">
              <CardContent className="p-0">
                <div className="dayone-table-header">
                  <div>
                    <h2 className="dayone-table-title">LIFF 訂單清單</h2>
                    <p className="dayone-table-note">共 {totalOrders} 筆，桌面保留快速查閱的表格視圖。</p>
                  </div>
                  <span className="dayone-chip">LIFF</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="dayone-table w-full min-w-[760px] text-sm">
                    <thead>
                      <tr>
                        <th>訂單編號</th>
                        <th>客戶</th>
                        <th>聯絡電話</th>
                        <th>建立時間</th>
                        <th className="text-right">金額</th>
                        <th className="text-center">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderList.map((order: any) => {
                        const status = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-stone-100 text-stone-700" };
                        return (
                          <tr key={order.orderId}>
                            <td className="font-mono text-xs text-stone-600">{order.orderNo}</td>
                            <td className="text-stone-900">
                              <div className="flex items-center gap-2.5">
                                <div className="rounded-full bg-stone-100 p-2 text-stone-500">
                                  <UserRound className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{order.customerName || "未填客戶名稱"}</span>
                              </div>
                            </td>
                            <td className="text-stone-600">{order.customerPhone || "-"}</td>
                            <td className="whitespace-nowrap text-stone-500">{formatDate(order.createdAt)}</td>
                            <td className="text-right font-semibold text-stone-900">{formatMoney(order.totalAmount)}</td>
                            <td className="text-center">
                              <Badge className={`${status.className} border-0`}>{status.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DayoneLayout>
  );
}

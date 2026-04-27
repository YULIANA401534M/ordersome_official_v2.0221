import { useState, useMemo } from "react";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending:   { label: "待確認",  className: "bg-stone-100 text-stone-700" },
  assigned:  { label: "已指派",  className: "bg-sky-100 text-sky-700" },
  picked:    { label: "已撿貨",  className: "bg-violet-100 text-violet-700" },
  delivering:{ label: "配送中",  className: "bg-amber-100 text-amber-700" },
  delivered: { label: "已送達",  className: "bg-emerald-100 text-emerald-700" },
  returned:  { label: "已回庫",  className: "bg-rose-100 text-rose-700" },
  cancelled: { label: "已取消",  className: "bg-stone-200 text-stone-600" },
};

function localDateStr(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fmtDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" });
}

function fmtDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-TW", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function fmtMoney(value: number | null | undefined) {
  const n = Number(value ?? 0);
  if (!n) return <span className="text-amber-600 font-medium">待補金額</span>;
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}

export default function DayoneLiffOrders() {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [dateTo, setDateTo] = useState(localDateStr(now));
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = trpc.dayone.orders.getLiffOrders.useQuery({
    tenantId: TENANT_ID,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // 依日期彙總
  const dailySummary = useMemo(() => {
    const map: Record<string, { date: string; count: number; total: number; pending: number }> = {};
    for (const o of orders as any[]) {
      const day = o.createdAt ? o.createdAt.slice(0, 10) : "unknown";
      if (!map[day]) map[day] = { date: day, count: 0, total: 0, pending: 0 };
      map[day].count += 1;
      map[day].total += Number(o.totalAmount ?? 0);
      if (o.status === "pending") map[day].pending += 1;
    }
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const totalOrders = orders.length;
  const totalAmount = (orders as any[]).reduce((sum: number, o: any) => sum + Number(o.totalAmount ?? 0), 0);
  const pendingCount = (orders as any[]).filter((o: any) => o.status === "pending").length;

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <div className="dayone-page-header">
          <div>
            <h1 className="dayone-page-title">LIFF 訂單</h1>
            <p className="dayone-page-subtitle">LINE LIFF 入口的客戶下單記錄</p>
          </div>
        </div>

        {/* 日期範圍選擇 */}
        <section className="dayone-panel rounded-[28px] p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">開始日期</label>
              <Input
                type="date"
                className="w-[160px] rounded-2xl"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">結束日期</label>
              <Input
                type="date"
                className="w-[160px] rounded-2xl"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                setDateFrom(localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)));
                setDateTo(localDateStr(now));
              }}
            >
              本月
            </Button>
          </div>

          {/* 彙總數字 */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs text-stone-500">區間訂單數</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{totalOrders}</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 px-4 py-4">
              <p className="text-xs text-stone-500">待確認筆數</p>
              <p className="mt-2 dayone-kpi-value text-amber-700">{pendingCount}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs text-stone-500">區間訂單金額</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">
                {totalAmount ? `NT$ ${totalAmount.toLocaleString("zh-TW")}` : "-"}
              </p>
            </div>
          </div>

          {/* 每日彙總 */}
          {dailySummary.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">日期</th>
                    <th className="px-4 py-3 text-right font-medium">訂單數</th>
                    <th className="px-4 py-3 text-right font-medium">待確認</th>
                    <th className="px-4 py-3 text-right font-medium">當日金額</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((row) => (
                    <tr key={row.date} className="border-t border-stone-200">
                      <td className="px-4 py-3 font-medium text-stone-900">{fmtDate(row.date)}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{row.count} 筆</td>
                      <td className="px-4 py-3 text-right">
                        {row.pending > 0 ? (
                          <span className="font-semibold text-amber-600">{row.pending}</span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">
                        {row.total ? `NT$ ${row.total.toLocaleString("zh-TW")}` : (
                          <span className="text-xs text-amber-600">待補</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 訂單清單 */}
        <section className="dayone-panel rounded-[32px] p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-stone-900">LIFF 訂單清單</p>
            <p className="mt-1 text-xs text-stone-500">點擊訂單列可展開查看品項明細</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : !orders.length ? (
            <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-12 text-center text-stone-400">
              此區間沒有 LIFF 訂單。
            </div>
          ) : (
            <div className="space-y-2">
              {(orders as any[]).map((order: any) => {
                const status = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-stone-100 text-stone-700" };
                const isExpanded = expandedId === order.orderId;
                const hasItems = Array.isArray(order.items) && order.items.length > 0;
                const totalAmount = Number(order.totalAmount ?? 0);

                return (
                  <div
                    key={order.orderId}
                    className="overflow-hidden rounded-[20px] border border-stone-200 bg-white"
                  >
                    {/* 主列（可點擊展開） */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-stone-50"
                      onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-stone-900">{order.customerName || "未填客戶名稱"}</span>
                          <Badge className={`border-0 text-xs ${status.className}`}>{status.label}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-stone-400">
                          {order.customerPhone || "無電話"} · {fmtDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-stone-900">
                          {typeof fmtMoney(totalAmount) === "string"
                            ? fmtMoney(totalAmount)
                            : fmtMoney(totalAmount)}
                        </p>
                        {order.deliveryDate && (
                          <p className="mt-0.5 text-xs text-stone-400">送 {fmtDate(order.deliveryDate)}</p>
                        )}
                      </div>
                      <div className="ml-2 shrink-0 text-stone-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {/* 展開明細 */}
                    {isExpanded && (
                      <div className="border-t border-stone-100 bg-stone-50 px-4 py-4">
                        {hasItems ? (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-stone-500">
                                <th className="pb-2 text-left font-medium">品項</th>
                                <th className="pb-2 text-right font-medium">數量</th>
                                <th className="pb-2 text-right font-medium">單價</th>
                                <th className="pb-2 text-right font-medium">小計</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item: any, idx: number) => (
                                <tr key={idx} className="border-t border-stone-200">
                                  <td className="py-2 text-stone-800">{item.productName}</td>
                                  <td className="py-2 text-right text-stone-600">{item.qty}</td>
                                  <td className="py-2 text-right text-stone-600">
                                    {item.unitPrice ? `NT$ ${Number(item.unitPrice).toLocaleString("zh-TW")}` : (
                                      <span className="text-xs text-amber-600">待補</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-right font-semibold text-stone-900">
                                    {item.subtotal ? `NT$ ${Number(item.subtotal).toLocaleString("zh-TW")}` : (
                                      <span className="text-xs text-amber-600">待補</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-stone-400">此訂單沒有品項明細。</p>
                        )}
                        {order.note ? (
                          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">備註：{order.note}</p>
                        ) : null}
                        <p className="mt-3 text-xs text-stone-400">
                          訂單編號：{order.orderNo}｜若金額顯示「待補」，請至
                          <a href="/dayone/orders" className="mx-1 text-amber-600 underline">訂單管理</a>
                          找到此筆後補填品項與金額。
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DayoneLayout>
  );
}

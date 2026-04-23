import { DayoneLayout } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRound, Phone, CalendarClock } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-700" },
  picked: { label: "Picked", color: "bg-purple-100 text-purple-700" },
  delivering: { label: "Delivering", color: "bg-amber-100 text-amber-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  returned: { label: "Returned", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", color: "bg-stone-100 text-stone-500" },
};

function formatDate(val: string | null) {
  if (!val) return "-";
  const d = new Date(val);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function DayoneLiffOrders() {
  const { data: orders, isLoading } = trpc.dayone.orders.getLiffOrders.useQuery();

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <div className="dayone-page-header">
          <div className="min-w-0">
            <h1 className="dayone-page-title">LIFF Orders</h1>
            <p className="dayone-page-subtitle">Review all LINE LIFF orders in a mobile-friendly card layout without losing the desktop table view.</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
          </div>
        )}

        {!isLoading && (!orders || orders.length === 0) && (
          <Card className="border-white/70 bg-white/85 shadow-[0_16px_38px_rgba(148,102,47,0.09)]">
            <CardContent className="py-12 text-center text-stone-500">No LIFF orders yet.</CardContent>
          </Card>
        )}

        {!isLoading && orders && orders.length > 0 && (
          <>
            <div className="dayone-mobile-list md:hidden">
              {orders.map((o: any) => {
                const status = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <article key={o.orderId} className="dayone-mobile-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] text-stone-400">{o.orderNo}</div>
                        <h2 className="mt-1 text-lg font-semibold text-stone-900">{o.customerName}</h2>
                      </div>
                      <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-stone-400" />
                        <span className="text-stone-700">{o.customerPhone ?? "-"}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarClock className="mt-0.5 h-4 w-4 text-stone-400" />
                        <span className="text-stone-700">{formatDate(o.createdAt)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.18em] text-stone-400">LIFF</span>
                      <span className="font-semibold text-stone-900">
                        {Number(o.totalAmount) === 0 ? "Pending price" : `$${Number(o.totalAmount).toLocaleString()}`}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <Card className="hidden border-white/70 bg-white/85 shadow-[0_16px_38px_rgba(148,102,47,0.09)] md:block">
              <CardHeader>
                <CardTitle className="text-base">{orders.length} LIFF orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-stone-50 text-stone-600">
                        <th className="px-4 py-3 text-left font-medium">Order No</th>
                        <th className="px-4 py-3 text-left font-medium">Customer</th>
                        <th className="px-4 py-3 text-left font-medium">Phone</th>
                        <th className="px-4 py-3 text-left font-medium">Created At</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any) => {
                        const status = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                        return (
                          <tr key={o.orderId} className="border-b transition-colors hover:bg-stone-50">
                            <td className="px-4 py-3 font-mono text-xs text-stone-700">{o.orderNo}</td>
                            <td className="px-4 py-3 text-stone-800">
                              <div className="flex items-center gap-2">
                                <UserRound className="h-4 w-4 text-stone-400" />
                                {o.customerName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-stone-600">{o.customerPhone}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-stone-500">{formatDate(o.createdAt)}</td>
                            <td className="px-4 py-3 text-right font-medium text-stone-800">
                              {Number(o.totalAmount) === 0 ? <span className="text-amber-600">Pending price</span> : `$${Number(o.totalAmount).toLocaleString()}`}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={`${status.color} border-0`}>{status.label}</Badge>
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

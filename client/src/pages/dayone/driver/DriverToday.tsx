import { useLocation } from "wouter";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { CheckCircle2, MapPin, Package, Phone, ChevronRight, Truck } from "lucide-react";

const TENANT_ID = 90004;

const STATUS_LABEL: Record<string, string> = {
  pending:    "待處理",
  assigned:   "已派車",
  picked:     "已撿貨",
  delivering: "配送中",
  delivered:  "已送達",
  returned:   "已回單",
};

const STATUS_TONE: Record<string, string> = {
  pending:    "bg-stone-100 text-stone-500",
  assigned:   "bg-sky-100 text-sky-700",
  picked:     "bg-amber-100 text-amber-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  returned:   "bg-rose-100 text-rose-700",
};

export default function DriverToday() {
  const [, navigate] = useLocation();
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const active  = (orders as any[]).filter((o: any) => o.status !== "delivered" && o.status !== "returned");
  const done    = (orders as any[]).filter((o: any) => o.status === "delivered");
  const totalCash = done.reduce((s: number, o: any) => s + Number(o.cashCollected ?? 0), 0);

  return (
    <DriverLayout title="今日路線">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI strip */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-4 text-center shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
              <p className="text-3xl font-bold text-stone-900">{(orders as any[]).length}</p>
              <p className="mt-1 text-xs text-stone-500">今日總站</p>
            </div>
            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4 text-center">
              <p className="text-3xl font-bold text-orange-700">{active.length}</p>
              <p className="mt-1 text-xs text-orange-600">待完成</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{done.length}</p>
              <p className="mt-1 text-xs text-emerald-600">已送達</p>
            </div>
          </section>

          {/* Today's cash summary */}
          {done.length > 0 && (
            <section className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4">
              <p className="text-xs text-amber-600">今日現金收款合計</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">NT$ {totalCash.toLocaleString()}</p>
            </section>
          )}

          {/* Active stops */}
          {active.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-widest text-stone-400">待配送路線</p>
              <div className="space-y-2">
                {active.map((order: any) => (
                  <button
                    key={order.id}
                    type="button"
                    className="w-full text-left rounded-[26px] border border-stone-200/80 bg-white p-4 shadow-[0_8px_20px_rgba(120,53,15,0.05)] active:scale-[0.99] transition-transform"
                    onClick={() => navigate(`/driver/order/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Stop number badge */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                        {order.stopSequence ?? "—"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-semibold text-stone-900">{order.customerName}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[order.status] ?? "bg-stone-100 text-stone-500"}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-stone-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="truncate">{order.customerAddress ?? "未提供地址"}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-base font-bold text-stone-900">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</p>
                        <ChevronRight className="h-4 w-4 text-stone-300" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Completed stops */}
          {done.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-widest text-stone-400">已完成</p>
              <div className="space-y-2">
                {done.map((order: any) => (
                  <button
                    key={order.id}
                    type="button"
                    className="w-full text-left rounded-[26px] border border-emerald-100 bg-emerald-50/60 p-4 active:scale-[0.99] transition-transform"
                    onClick={() => navigate(`/driver/order/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-700">{order.customerName}</p>
                        <p className="text-xs text-stone-400">{order.customerAddress ?? ""}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-emerald-700">
                          NT$ {Number(order.cashCollected ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-400">已收</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {(orders as any[]).length === 0 && (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-stone-400">
              <Truck className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4 text-sm">今天沒有派車任務</p>
            </div>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

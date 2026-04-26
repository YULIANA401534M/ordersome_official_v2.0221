import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { CheckCircle, Clock3, MapPin, Package, Phone, ChevronRight, ChevronDown, Hash } from "lucide-react";

const TENANT_ID = 90004;

const STATUS_LABEL: Record<string, string> = {
  pending: "待處理",
  assigned: "已派車",
  picked: "已撿貨",
  delivering: "配送中",
  delivered: "已送達",
  returned: "已回單",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-stone-100 text-stone-600",
  assigned: "bg-sky-100 text-sky-700",
  picked: "bg-amber-100 text-amber-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
  returned: "bg-rose-100 text-rose-700",
};

function OrderCard({ order }: { order: any }) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[26px] border border-stone-200/80 bg-white shadow-[0_12px_24px_rgba(120,53,15,0.05)] overflow-hidden">
      {/* Always-visible row */}
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => navigate(`/driver/order/${order.id}`)}
        >
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-stone-900 truncate">{order.customerName}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[order.status] ?? "bg-stone-100 text-stone-600"}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{order.customerAddress ?? "未提供地址"}</span>
          </div>
          <p className="mt-2 text-base font-semibold text-stone-900">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</p>
        </button>

        {/* Expand toggle */}
        <button
          type="button"
          className="shrink-0 rounded-full p-2 text-stone-300 hover:bg-stone-50 hover:text-stone-500 active:scale-95 transition-all"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "收合" : "展開"}
        >
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-2 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-stone-300 shrink-0" />
            <span className="font-mono text-xs tracking-wider text-stone-400">{order.orderNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>{order.customerPhone ?? "未提供電話"}</span>
          </div>
          <button
            type="button"
            className="mt-2 w-full rounded-2xl bg-amber-600 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
            onClick={() => navigate(`/driver/order/${order.id}`)}
          >
            前往配送
          </button>
        </div>
      )}
    </div>
  );
}

export default function DriverToday() {
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const pending = orders.filter((o: any) => ["pending", "assigned", "picked"].includes(o.status));
  const inProgress = orders.filter((o: any) => o.status === "delivering");
  const done = orders.filter((o: any) => o.status === "delivered");

  return (
    <DriverLayout title="今日總覽">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-4 text-center shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
              <p className="text-3xl font-semibold text-stone-900">{orders.length}</p>
              <p className="mt-1 text-xs text-stone-500">今日總單</p>
            </div>
            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4 text-center">
              <p className="text-3xl font-semibold text-orange-700">{inProgress.length}</p>
              <p className="mt-1 text-xs text-orange-600">配送中</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-semibold text-emerald-700">{done.length}</p>
              <p className="mt-1 text-xs text-emerald-600">已送達</p>
            </div>
          </section>

          {inProgress.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-sm font-semibold text-orange-700">
                <Clock3 className="h-4 w-4" />
                配送中 {inProgress.length} 筆
              </div>
              <div className="space-y-3">{inProgress.map((o: any) => <OrderCard key={o.id} order={o} />)}</div>
            </section>
          )}

          {pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-sm font-semibold text-stone-700">
                <Package className="h-4 w-4" />
                待處理 {pending.length} 筆
              </div>
              <div className="space-y-3">{pending.map((o: any) => <OrderCard key={o.id} order={o} />)}</div>
            </section>
          )}

          {done.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-sm font-semibold text-emerald-700">
                <CheckCircle className="h-4 w-4" />
                已送達 {done.length} 筆
              </div>
              <div className="space-y-3">{done.map((o: any) => <OrderCard key={o.id} order={o} />)}</div>
            </section>
          )}

          {orders.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-14 text-center text-stone-400">
              <Package className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">今天沒有配送單，先休息一下。</p>
            </div>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

import { useLocation } from "wouter";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { CheckCircle, Clock3, MapPin, Package, Phone, ChevronRight } from "lucide-react";

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

export default function DriverToday() {
  const [, navigate] = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const pending = orders.filter((o: any) => ["pending", "assigned", "picked"].includes(o.status));
  const inProgress = orders.filter((o: any) => o.status === "delivering");
  const done = orders.filter((o: any) => o.status === "delivered");

  function OrderCard({ order }: { order: any }) {
    return (
      <button
        type="button"
        className="w-full rounded-[26px] border border-stone-200/80 bg-white p-4 text-left shadow-[0_12px_24px_rgba(120,53,15,0.05)] transition-transform active:scale-[0.99]"
        onClick={() => navigate(`/driver/order/${order.id}`)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-stone-900">{order.customerName}</p>
            <p className="mt-1 text-xs font-medium tracking-[0.16em] text-stone-400">{order.orderNo}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[order.status] ?? "bg-stone-100 text-stone-600"}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" />
            <span className="truncate">{order.customerAddress ?? "未提供地址"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-amber-500" />
            <span>{order.customerPhone ?? "未提供電話"}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400">訂單金額</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-stone-300" />
        </div>
      </button>
    );
  }

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
              <div className="space-y-3">{inProgress.map((order: any) => <OrderCard key={order.id} order={order} />)}</div>
            </section>
          )}

          {pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-sm font-semibold text-stone-700">
                <Package className="h-4 w-4" />
                待處理 {pending.length} 筆
              </div>
              <div className="space-y-3">{pending.map((order: any) => <OrderCard key={order.id} order={order} />)}</div>
            </section>
          )}

          {done.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1 text-sm font-semibold text-emerald-700">
                <CheckCircle className="h-4 w-4" />
                已送達 {done.length} 筆
              </div>
              <div className="space-y-3">{done.map((order: any) => <OrderCard key={order.id} order={order} />)}</div>
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

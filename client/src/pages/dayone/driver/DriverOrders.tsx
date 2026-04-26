import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ClipboardList, MapPin, Phone, ChevronRight } from "lucide-react";

const TENANT_ID = 90004;

const STATUS_LABEL: Record<string, string> = {
  pending: "待處理",
  assigned: "已派車",
  picked: "已撿貨",
  delivering: "配送中",
  delivered: "已送達",
  returned: "已回單",
};

export default function DriverOrders() {
  const todayDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: todayDate,
  });

  return (
    <DriverLayout title="配送訂單">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-[28px] bg-stone-900 px-5 py-5 text-white shadow-[0_16px_40px_rgba(28,25,23,0.18)]">
            <p className="text-xs tracking-[0.18em] text-white/50">今日配送</p>
            <h2 className="mt-3 font-brand text-[1.75rem] leading-none">配送清單</h2>
            <p className="mt-3 text-sm leading-6 text-white/72">
              共 {orders.length} 站，依路線順序排列，點進去可收款、簽名。
            </p>
          </section>

          {orders.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-14 text-center text-stone-400">
              <ClipboardList className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">今天沒有需要配送的訂單。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/driver/order/${order.id}`}
                  className="block rounded-[26px] border border-stone-200/80 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)] transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {order.stopSequence != null && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                        {order.stopSequence}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-stone-900">{order.customerName}</p>
                      <p className="mt-0.5 text-xs tracking-widest text-stone-400">{order.orderNo}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                      order.status === "delivering" ? "bg-orange-100 text-orange-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
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
                      <p className="text-xs text-stone-400">應收金額</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">
                        NT$ {Number(order.totalAmount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

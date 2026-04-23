import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, MapPin, Wallet } from "lucide-react";

const TENANT_ID = 90004;

export default function DriverDone() {
  const todayDate = new Date().toISOString().slice(0, 10);
  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: todayDate,
  });
  const doneOrders = orders.filter((order: any) => order.status === "delivered");
  const totalCollected = doneOrders.reduce((sum: number, order: any) => sum + Number(order.cashCollected ?? 0), 0);

  return (
    <DriverLayout title="今日完成">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Delivered</p>
              <p className="mt-4 text-3xl font-semibold text-emerald-700">{doneOrders.length}</p>
              <p className="mt-1 text-sm text-emerald-700/75">已送達筆數</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <Wallet className="h-5 w-5 text-amber-600" />
              <p className="mt-4 text-2xl font-semibold text-amber-700">NT$ {totalCollected.toLocaleString()}</p>
              <p className="mt-1 text-sm text-amber-700/75">今日現收</p>
            </div>
          </section>

          {doneOrders.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-14 text-center text-stone-400">
              <CheckCircle2 className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">今天還沒有送達完成的訂單。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doneOrders.map((order: any) => (
                <div key={order.id} className="rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-stone-900">{order.customerName}</p>
                      <p className="mt-1 text-xs font-medium tracking-[0.16em] text-stone-400">{order.orderNo}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                        <MapPin className="h-4 w-4 text-amber-500" />
                        <span className="truncate">{order.customerAddress ?? "未提供地址"}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900">
                        NT$ {Number(order.totalAmount ?? 0).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        現收 NT$ {Number(order.cashCollected ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, Package, Truck } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 90004;

export default function DriverPickup() {
  const utils = trpc.useUtils();
  const todayDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: todayDate,
  });

  const { data: dispatches = [] } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId: TENANT_ID,
    dispatchDate: todayDate,
  });

  const myDispatch = (dispatches as any[])[0];
  const dispatchPrinted = myDispatch && ["printed", "in_progress", "pending_handover", "completed"].includes(myDispatch.status);

  const pendingOrders = orders.filter((order: any) => ["pending", "assigned"].includes(order.status));

  const updateStatus = trpc.dayone.driver.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("已標記為完成撿貨，準備出車");
      utils.dayone.driver.getMyTodayOrders.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <DriverLayout title="撿貨出車">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,#fff8eb_0%,#fffdf8_100%)] px-5 py-5 shadow-[0_16px_40px_rgba(120,53,15,0.08)]">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-600">準備上車</p>
            <h2 className="mt-3 font-brand text-[1.7rem] leading-none text-stone-900">出車前最後確認</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              管理員列印撿貨單後才會扣庫存，請按照撿貨單核對車上貨量，確認無誤後按「完成撿貨」。
            </p>
          </section>

          {myDispatch && (
            <section className={`rounded-[26px] border px-4 py-4 text-sm ${
              dispatchPrinted
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}>
              <div className="flex items-center gap-2">
                {dispatchPrinted
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <Truck className="h-4 w-4 text-amber-600" />
                }
                <span className={`font-semibold ${dispatchPrinted ? "text-emerald-700" : "text-amber-700"}`}>
                  {dispatchPrinted ? "撿貨單已列印，可以開始撿貨出車" : "管理員尚未列印撿貨單，請稍候"}
                </span>
              </div>
              <p className="mt-1 ml-6 text-xs text-stone-500">
                路線 {myDispatch.routeCode}，共 {myDispatch.totalStops ?? orders.length} 站
              </p>
            </section>
          )}

          {!pendingOrders.length ? (
            <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-6 py-14 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-4 text-sm font-medium text-emerald-700">今天待出車訂單都已處理完成。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="rounded-[26px] border border-stone-200/80 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-stone-900">{order.customerName}</p>
                      <p className="mt-1 text-xs font-medium tracking-[0.16em] text-stone-400">{order.orderNo}</p>
                      <p className="mt-2 text-sm text-stone-500">{order.customerAddress ?? "未提供地址"}</p>
                    </div>
                    <Package className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-stone-400">訂單金額</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">
                        NT$ {Number(order.totalAmount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => updateStatus.mutate({ id: order.id, tenantId: TENANT_ID, status: "picked" })}
                      disabled={updateStatus.isPending}
                    >
                      完成撿貨
                      <ChevronRight className="h-4 w-4" />
                    </button>
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

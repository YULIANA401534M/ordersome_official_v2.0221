import { useState } from "react";
import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 90004;

export default function DriverPickup() {
  const utils = trpc.useUtils();
  const todayDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [pickingAll, setPickingAll] = useState(false);

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

  const pendingOrders = (orders as any[]).filter((o: any) => ["pending", "assigned"].includes(o.status));
  const pickedOrders  = (orders as any[]).filter((o: any) => o.status === "picked");

  const updateStatus = trpc.dayone.driver.updateOrderStatus.useMutation({
    onSuccess: () => utils.dayone.driver.getMyTodayOrders.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  async function handlePickAll() {
    if (!pendingOrders.length) return;
    setPickingAll(true);
    try {
      for (const order of pendingOrders) {
        await updateStatus.mutateAsync({ id: order.id, tenantId: TENANT_ID, status: "picked" });
      }
      toast.success(`已標記 ${pendingOrders.length} 筆完成撿貨，可以出車了`);
    } finally {
      setPickingAll(false);
    }
  }

  const allPicked = pendingOrders.length === 0 && (orders as any[]).length > 0;

  return (
    <DriverLayout title="撿貨出車">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <section className="rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,#fff8eb_0%,#fffdf8_100%)] px-5 py-5 shadow-[0_16px_40px_rgba(120,53,15,0.08)]">
            <p className="text-xs tracking-[0.18em] text-amber-600">撿貨出車</p>
            <h2 className="mt-3 font-brand text-[1.7rem] leading-none text-stone-900">出車前最後確認</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              管理員列印撿貨單後才會扣庫存。按照撿貨單核對車上貨量，核對無誤後按「全部完成撿貨」出車。
            </p>
          </section>

          {/* Dispatch status */}
          {myDispatch && (
            <section className={`rounded-[26px] border px-4 py-4 text-sm ${
              dispatchPrinted ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}>
              <div className="flex items-center gap-2">
                {dispatchPrinted
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <Truck className="h-4 w-4 text-amber-600" />
                }
                <span className={`font-semibold ${dispatchPrinted ? "text-emerald-700" : "text-amber-700"}`}>
                  {dispatchPrinted ? "撿貨單已列印，可以開始撿貨" : "管理員尚未列印撿貨單，請稍候"}
                </span>
              </div>
              <p className="mt-1 ml-6 text-xs text-stone-500">
                路線 {myDispatch.routeCode}，共 {myDispatch.totalStops ?? (orders as any[]).length} 站
              </p>
            </section>
          )}

          {/* All picked */}
          {allPicked ? (
            <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-4 text-sm font-semibold text-emerald-700">全部撿貨完成，可以出車了！</p>
              <p className="mt-1 text-xs text-emerald-600">前往「配送清單」開始配送。</p>
            </div>
          ) : (
            <>
              {/* Order list — view only, confirm all at once */}
              <div className="space-y-2">
                {(orders as any[]).map((order: any) => {
                  const isPicked = order.status === "picked";
                  return (
                    <div key={order.id} className={`rounded-[24px] border p-4 ${
                      isPicked
                        ? "border-emerald-100 bg-emerald-50/70"
                        : "border-stone-200/80 bg-white shadow-[0_8px_20px_rgba(120,53,15,0.05)]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isPicked ? "bg-emerald-200 text-emerald-700" : "bg-amber-600 text-white"
                        }`}>
                          {isPicked ? <CheckCircle2 className="h-4 w-4" /> : (order.stopSequence ?? "—")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${isPicked ? "text-emerald-700" : "text-stone-900"}`}>
                            {order.customerName}
                          </p>
                          <p className="text-xs text-stone-400 truncate">{order.customerAddress ?? ""}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-stone-900">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-stone-400">
                            {isPicked ? "已撿" : "待撿"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pick all button */}
              {pendingOrders.length > 0 && (
                <button
                  type="button"
                  className="w-full rounded-2xl bg-amber-600 py-4 text-base font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-50"
                  disabled={pickingAll || !dispatchPrinted}
                  onClick={handlePickAll}
                >
                  {pickingAll
                    ? "標記中…"
                    : !dispatchPrinted
                      ? "等待管理員列印撿貨單"
                      : `全部完成撿貨（${pendingOrders.length} 筆）出車`
                  }
                </button>
              )}

              {pickedOrders.length > 0 && pendingOrders.length > 0 && (
                <p className="text-center text-xs text-stone-400">
                  已撿 {pickedOrders.length} 筆，剩 {pendingOrders.length} 筆未撿
                </p>
              )}
            </>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

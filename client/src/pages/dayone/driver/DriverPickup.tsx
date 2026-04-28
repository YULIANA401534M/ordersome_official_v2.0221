import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import { CheckCircle2, MapPin, Package, Truck } from "lucide-react";

const TENANT_ID = 90004;

export default function DriverPickup() {
  const todayDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: dispatches = [], isLoading } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId: TENANT_ID,
    dispatchDate: todayDate,
  });

  const myDispatch = useMemo(() => {
    const list = [...(dispatches as any[])].reverse();
    return list.find((d: any) => ["printed", "in_progress"].includes(d.status ?? "")) ?? list[0];
  }, [dispatches]);
  const dispatchId = myDispatch?.id ?? 0;
  const dispatchPrinted = myDispatch && ["printed", "in_progress", "pending_handover", "completed"].includes(myDispatch.status ?? "");

  const { data: detail } = trpc.dayone.dispatch.getDispatchDetail.useQuery(
    { id: dispatchId, tenantId: TENANT_ID },
    { enabled: !!dispatchId }
  );

  const items: any[] = (detail as any)?.items ?? [];
  const productsByOrder: any[] = (detail as any)?.productsByOrder ?? [];

  // Group products by orderId for quick lookup
  const prodMap: Record<number, any[]> = {};
  for (const p of productsByOrder) {
    const oid = Number(p.orderId);
    if (!prodMap[oid]) prodMap[oid] = [];
    prodMap[oid].push(p);
  }

  const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
    pending:    { label: "待撿貨", cls: "bg-stone-100 text-stone-500" },
    assigned:   { label: "待撿貨", cls: "bg-stone-100 text-stone-500" },
    picked:     { label: "已撿貨", cls: "bg-emerald-100 text-emerald-700" },
    delivering: { label: "配送中", cls: "bg-orange-100 text-orange-700" },
    delivered:  { label: "已送達", cls: "bg-sky-100 text-sky-700" },
  };

  return (
    <DriverLayout title="今日路線">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <section className="rounded-[28px] bg-stone-900 px-5 py-5 text-white shadow-[0_16px_40px_rgba(28,25,23,0.18)]">
            <p className="text-xs tracking-[0.18em] text-white/50">撿貨出車</p>
            <h2 className="mt-3 font-brand text-[1.7rem] leading-none">今日路線明細</h2>
            <p className="mt-3 text-sm leading-6 text-white/72">
              依序核對每站貨品，確認車上貨量與撿貨單一致後出車。
            </p>
          </section>

          {/* Dispatch status */}
          {myDispatch ? (
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
                路線 {myDispatch.routeCode ?? "—"}，共 {myDispatch.totalStops ?? items.length} 站，備用箱 {detail?.extraBoxes ?? myDispatch.extraBoxes ?? "—"} 箱
              </p>
            </section>
          ) : (
            <div className="rounded-[26px] border border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
              今日尚未建立派車單
            </div>
          )}

          {/* Stops */}
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item: any, idx: number) => {
                const stopProds = prodMap[Number(item.orderId)] ?? [];
                const st = ORDER_STATUS[item.orderStatus] ?? { label: item.orderStatus ?? "—", cls: "bg-stone-100 text-stone-500" };
                const isPicked = ["picked", "delivering", "delivered"].includes(item.orderStatus ?? "");
                return (
                  <div
                    key={item.id}
                    className={`rounded-[26px] border p-4 ${
                      isPicked
                        ? "border-emerald-100 bg-emerald-50/60"
                        : "border-stone-200/70 bg-white shadow-[0_8px_20px_rgba(120,53,15,0.05)]"
                    }`}
                  >
                    {/* Stop header */}
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isPicked ? "bg-emerald-200 text-emerald-700" : "bg-amber-600 text-white"
                      }`}>
                        {isPicked ? <CheckCircle2 className="h-4 w-4" /> : (item.stopSequence ?? idx + 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-stone-900">{item.customerName}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        </div>
                        {item.customerAddress && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-stone-400">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Products */}
                    {stopProds.length > 0 && (
                      <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2.5 space-y-1.5">
                        {stopProds.map((p: any, pi: number) => (
                          <div key={pi} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-stone-600">
                              <Package className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                              <span>{p.productName}</span>
                            </div>
                            <span className="font-semibold tabular-nums text-stone-900">
                              {Math.round(Number(p.shippedQty))} {p.unit || ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Amount */}
                    <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
                      <span>訂單金額</span>
                      <span className="font-semibold text-stone-700">NT$ {Number(item.orderAmount ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

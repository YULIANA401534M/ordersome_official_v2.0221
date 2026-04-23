import { useMemo, useState } from "react";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { ClipboardCheck, Clock, CheckCircle, RotateCcw, Package } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 90004;

export default function DriverWorkLog() {
  const today = new Date().toISOString().slice(0, 10);
  const utils = trpc.useUtils();
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [returnQtyByProduct, setReturnQtyByProduct] = useState<Record<number, number>>({});

  const { data: workLog } = trpc.dayone.driver.getMyWorkLog.useQuery({
    tenantId: TENANT_ID,
    workDate: today,
  });

  const { data: orders = [] } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const { data: dispatches = [] } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId: TENANT_ID,
    dispatchDate: today,
  });

  const latestDispatchId = Number(dispatches[0]?.id ?? 0);
  const { data: dispatchDetail } = trpc.dayone.dispatch.getDispatchDetail.useQuery(
    { id: latestDispatchId, tenantId: TENANT_ID },
    { enabled: !!latestDispatchId }
  );

  const submitLog = trpc.dayone.driver.submitWorkLog.useMutation({
    onSuccess: () => {
      toast.success("今日日結已送出");
      utils.dayone.driver.getMyWorkLog.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const returnInventory = trpc.dayone.dispatch.returnInventory.useMutation({
    onSuccess: () => {
      toast.success("剩貨已回庫");
      setReturnQtyByProduct({});
      utils.dayone.dispatch.getDispatchDetail.invalidate();
      utils.dayone.dispatch.listDispatch.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deliveredOrders = orders.filter((order: any) => order.status === "delivered");
  const totalCollected = deliveredOrders.reduce((sum: number, order: any) => sum + Number(order.cashCollected ?? 0), 0);
  const returnItems = useMemo(
    () =>
      (dispatchDetail?.products ?? [])
        .map((product: any) => ({
          productId: Number(product.productId),
          productName: product.productName,
          unit: product.unit,
          shippedQty: Number(product.shippedQty ?? 0),
          qty: Number(returnQtyByProduct[Number(product.productId)] ?? 0),
        }))
        .filter((item: any) => item.shippedQty > 0),
    [dispatchDetail?.products, returnQtyByProduct]
  );

  const hasSubmitted = Boolean(workLog);

  return (
    <DriverLayout title="剩貨回庫 / 日結">
      <div className="space-y-4">
        <section className="rounded-[28px] bg-stone-900 px-5 py-5 text-white shadow-[0_16px_40px_rgba(28,25,23,0.18)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">Closing</p>
          <h2 className="mt-3 font-brand text-[1.7rem] leading-none">收尾不要漏掉</h2>
          <p className="mt-3 text-sm leading-6 text-white/72">
            先處理剩貨回庫，再提交今天的工作日誌與現金結果。
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
            <p className="text-xs text-stone-400">已送達</p>
            <p className="mt-3 text-3xl font-semibold text-stone-900">{deliveredOrders.length}</p>
            <p className="mt-1 text-sm text-stone-500">今日完成筆數</p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs text-amber-600">現金回收</p>
            <p className="mt-3 text-2xl font-semibold text-amber-700">NT$ {totalCollected.toLocaleString()}</p>
            <p className="mt-1 text-sm text-amber-700/70">依已送達訂單加總</p>
          </div>
        </section>

        {dispatchDetail?.products?.length ? (
          <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900">司機剩貨回庫</h3>
                <p className="mt-1 text-xs text-stone-500">只回報車上剩餘品項，送出後會回補庫存。</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {returnItems.map((item: any) => (
                <div key={item.productId} className="rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{item.productName}</p>
                      <p className="mt-1 text-xs text-stone-500">今日派出 {item.shippedQty} {item.unit || "單位"}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={item.shippedQty}
                      value={item.qty || ""}
                      onChange={(event) =>
                        setReturnQtyByProduct((prev) => ({
                          ...prev,
                          [item.productId]: Math.max(0, Math.min(item.shippedQty, Number(event.target.value || 0))),
                        }))
                      }
                      className="w-24 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-2xl bg-amber-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
              disabled={
                returnInventory.isPending ||
                !latestDispatchId ||
                !returnItems.some((item: any) => item.qty > 0)
              }
              onClick={() =>
                returnInventory.mutate({
                  dispatchOrderId: latestDispatchId,
                  tenantId: TENANT_ID,
                  note: "Driver return from worklog",
                  items: returnItems
                    .filter((item: any) => item.qty > 0)
                    .map((item: any) => ({ productId: item.productId, qty: item.qty })),
                })
              }
            >
              {returnInventory.isPending ? "回庫中..." : "確認剩貨回庫"}
            </button>
          </section>
        ) : (
          <section className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-8 text-center text-stone-400">
            <Package className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">今天沒有可回庫的派車品項。</p>
          </section>
        )}

        <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-stone-900">工作日誌</h3>
          </div>

          {hasSubmitted ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-emerald-700">今天日結已送出</p>
              <p className="mt-1 text-xs text-emerald-700/75">
                完成 {Number((workLog as any)?.totalOrders ?? deliveredOrders.length)} 筆，現收 NT${" "}
                {Number((workLog as any)?.totalCollected ?? totalCollected).toLocaleString()}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-stone-500">出勤時間</label>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-stone-500">收工時間</label>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-xs text-stone-500">備註</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="例如：客戶臨時加單、剩貨狀況、現金差異說明"
                  rows={4}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-2xl bg-stone-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
                disabled={submitLog.isPending}
                onClick={() =>
                  submitLog.mutate({
                    tenantId: TENANT_ID,
                    workDate: today,
                    startTime: startTime || undefined,
                    endTime: endTime || undefined,
                    note: note || undefined,
                  })
                }
              >
                {submitLog.isPending ? "送出中..." : "送出今日日結"}
              </button>
            </>
          )}
        </section>
      </div>
    </DriverLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { ClipboardCheck, Clock, CheckCircle, RotateCcw, Package } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TENANT_ID = 90004;

export default function DriverWorkLog() {
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const utils = trpc.useUtils();
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [cashHandedOver, setCashHandedOver] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [returnQtyByProduct, setReturnQtyByProduct] = useState<Record<number, number>>({});
  const [selectedDispatchId, setSelectedDispatchId] = useState<string>("");

  const { data: orders = [] } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const { data: dispatches = [] } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId: TENANT_ID,
    dispatchDate: today,
  });

  // dispatches 已按 id ASC 排序（舊到新）；找最新的非完成派車單（從尾端找）
  const defaultDispatchId = useMemo(() => {
    const list = [...(dispatches as any[])].reverse();
    const active = list.find((d: any) => !["pending_handover", "completed"].includes(d.status ?? ""));
    return active?.id ?? list[0]?.id ?? 0;
  }, [dispatches]);
  const dispatchIds = new Set((dispatches as any[]).map((d: any) => String(d.id)));
  const resolvedSelectedId = dispatchIds.has(selectedDispatchId) ? selectedDispatchId : "";
  const activeDispatchId = Number(resolvedSelectedId || defaultDispatchId);

  const { data: dispatchDetail } = trpc.dayone.dispatch.getDispatchDetail.useQuery(
    { id: activeDispatchId, tenantId: TENANT_ID },
    { enabled: !!activeDispatchId }
  );

  // 每張派車單各自的日結狀態
  const { data: workLog } = trpc.dayone.driver.getMyWorkLog.useQuery(
    { tenantId: TENANT_ID, workDate: today, dispatchOrderId: activeDispatchId },
    { enabled: !!activeDispatchId }
  );

  const submitLog = trpc.dayone.driver.submitWorkLog.useMutation({
    onSuccess: () => {
      toast.success("派車單日結已送出");
      utils.dayone.driver.getMyWorkLog.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const returnInventory = trpc.dayone.dispatch.returnInventory.useMutation({
    onSuccess: (data) => {
      const discrepancies = (data as any).discrepancies ?? [];
      if (discrepancies.length > 0) {
        toast.success("剩貨已送出待驗");
        for (const d of discrepancies) {
          toast.warning(
            `⚠️ 備用箱差異：${d.productName} 帶出 ${d.totalOut} 箱，補單動用 ${d.supplementUsed} 箱，回庫 ${d.returned} 箱，差 ${Math.abs(d.diff)} 箱`,
            { duration: 12000 }
          );
        }
      } else {
        toast.success("剩貨已送出待驗，等管理員確認入庫");
      }
      setReturnQtyByProduct({});
      utils.dayone.dispatch.getDispatchDetail.invalidate();
      utils.dayone.dispatch.listDispatch.invalidate();
      utils.dayone.inventory.pendingReturns.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  // 只計算當前派車單的訂單
  const dispatchOrderIds = useMemo(() => {
    const items: any[] = (dispatchDetail as any)?.items ?? [];
    return new Set(items.map((i: any) => Number(i.orderId)).filter(Boolean));
  }, [dispatchDetail]);
  const deliveredOrders = (orders as any[]).filter(
    (order: any) => order.status === "delivered" && dispatchOrderIds.has(Number(order.id))
  );
  const totalCollected = deliveredOrders.reduce((sum: number, order: any) => sum + Number(order.cashCollected ?? 0), 0);
  const pendingReturnsByProduct: Record<number, number> = (dispatchDetail as any)?.pendingReturnsByProduct ?? {};

  // 備用箱清單（加入回庫列表）
  const { data: extraItems = [] } = trpc.dayone.dispatch.getExtraItemsForReturn.useQuery(
    { dispatchOrderId: activeDispatchId, tenantId: TENANT_ID },
    { enabled: !!activeDispatchId }
  );

  const returnItems = useMemo(() => {
    const orderItems = (dispatchDetail?.products ?? []).map((product: any) => {
      const pid = Number(product.productId);
      return {
        productId: pid,
        productName: product.productName,
        unit: product.unit,
        shippedQty: Math.round(Number(product.shippedQty ?? 0)),
        extraQty: 0,
        qty: returnQtyByProduct[pid] !== undefined ? Number(returnQtyByProduct[pid]) : 0,
        reportedQty: Math.round(Number(pendingReturnsByProduct[pid] ?? 0)),
        isExtra: false,
      };
    }).filter((item: any) => item.shippedQty > 0);

    // 合入備用箱（只列出訂單品項裡沒出現的備用箱品項）
    const existingPids = new Set(orderItems.map((i: any) => i.productId));
    const extraOnly = (extraItems as any[])
      .filter((e: any) => !existingPids.has(Number(e.productId)))
      .map((e: any) => {
        const pid = Number(e.productId);
        return {
          productId: pid,
          productName: e.productName,
          unit: e.unit,
          shippedQty: 0,
          extraQty: Number(e.qty),
          qty: returnQtyByProduct[pid] !== undefined ? Number(returnQtyByProduct[pid]) : 0,
          reportedQty: Math.round(Number(pendingReturnsByProduct[pid] ?? 0)),
          isExtra: true,
        };
      });

    // 訂單品項也要加入備用箱數量（同商品）
    const withExtra = orderItems.map((item: any) => {
      const ex = (extraItems as any[]).find((e: any) => Number(e.productId) === item.productId);
      return { ...item, extraQty: ex ? Number(ex.qty) : 0 };
    });

    return [...withExtra, ...extraOnly];
  }, [dispatchDetail?.products, returnQtyByProduct, pendingReturnsByProduct, extraItems]);

  useEffect(() => {
    setReturnQtyByProduct({});
  }, [activeDispatchId]);

  const hasSubmitted = Boolean(workLog);

  // 派車單已進入「待點收」或「已完成」 → 剩貨已回報，鎖定不可再送
  const activeDispatch = (dispatches as any[]).find((d: any) => d.id === activeDispatchId);
  const returnLocked =
    hasSubmitted ||
    ["pending_handover", "completed"].includes(activeDispatch?.status ?? "");

  return (
    <DriverLayout title="剩貨回庫 / 日結">
      <div className="space-y-4">
        <section className="rounded-[28px] bg-stone-900 px-5 py-5 text-white shadow-[0_16px_40px_rgba(28,25,23,0.18)]">
          <p className="text-xs tracking-[0.18em] text-white/50">回倉結算</p>
          <h2 className="mt-3 font-brand text-[1.7rem] leading-none">收尾不要漏掉</h2>
          <p className="mt-3 text-sm leading-6 text-white/72">
            先回報車上剩貨待驗，再提交今天的工作日誌與現金結果。
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
              <RotateCcw className={`h-5 w-5 ${returnLocked ? "text-emerald-600" : "text-amber-600"}`} />
              <div>
                <h3 className="text-sm font-semibold text-stone-900">司機剩貨回庫</h3>
                <p className="mt-1 text-xs text-stone-500">只回報車上剩餘品項，送出後會進入回庫待驗，等待管理端確認。</p>
              </div>
            </div>

            {dispatches.length > 1 && !returnLocked ? (
              <div className="mt-4">
                <label className="mb-1 block text-xs text-stone-500">選擇派車單</label>
                <Select value={activeDispatchId ? String(activeDispatchId) : ""} onValueChange={setSelectedDispatchId}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="選擇今天要回報的派車單" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dispatches as any[]).map((dispatch: any) => {
                      const statusLabel: Record<string, string> = {
                        draft: "草稿", printed: "已列印", in_progress: "配送中",
                        pending_handover: "待點收", completed: "已完成",
                      };
                      return (
                        <SelectItem key={dispatch.id} value={String(dispatch.id)}>
                          {`路線 ${dispatch.routeCode || "—"}　${statusLabel[dispatch.status] ?? dispatch.status}　共 ${dispatch.totalStops ?? "?"} 站`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {returnLocked ? (
              /* 已送出 → 唯讀確認畫面 */
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700">剩貨已回報，等待管理員確認入庫</p>
                </div>
                <div className="mt-3 space-y-2">
                  {returnItems.map((item: any) => (
                    <div key={item.productId} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-sm">
                      <span className="text-stone-700">{item.productName}</span>
                      <span className="font-semibold text-stone-900">
                        帶出 {item.shippedQty}　回庫 {item.reportedQty} {item.unit || "箱"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 尚未送出 → 可填寫 */
              <>
                <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700 leading-5">
                  全部送完填 <strong>0</strong>，車上有剩貨才填剩幾箱（桶）。送出後等管理員確認入庫。
                </div>

                <div className="mt-3 space-y-3">
                  {returnItems.map((item: any) => (
                    <div key={item.productId} className="rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            {item.productName}
                            {item.isExtra && <span className="ml-1.5 text-xs rounded-full bg-sky-100 text-sky-700 px-1.5 py-0.5">備用</span>}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {item.isExtra
                              ? `備用帶出 ${item.extraQty} ${item.unit || "箱"}　回庫幾箱？`
                              : item.extraQty > 0
                                ? `訂單 ${item.shippedQty} + 備用 ${item.extraQty} = ${item.shippedQty + item.extraQty} ${item.unit || "箱"}　回庫幾箱？`
                                : `今日帶出 ${item.shippedQty} ${item.unit || "箱"}　回庫幾箱？`}
                          </p>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={item.shippedQty}
                          value={item.qty}
                          onChange={(event) =>
                            setReturnQtyByProduct((prev) => ({
                              ...prev,
                              [item.productId]: Math.max(0, Math.min(item.shippedQty, Number(event.target.value ?? 0))),
                            }))
                          }
                          className="w-24 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-2xl bg-amber-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={returnInventory.isPending || !activeDispatchId}
                  onClick={() =>
                    returnInventory.mutate({
                      dispatchOrderId: activeDispatchId,
                      tenantId: TENANT_ID,
                      note: "司機回庫回報",
                      items: returnItems
                        .filter((item: any) => item.qty > 0)
                        .map((item: any) => ({ productId: item.productId, qty: item.qty })),
                    })
                  }
                >
                  {returnInventory.isPending ? "送出中..." : "送出回庫待驗"}
                </button>
              </>
            )}
          </section>
        ) : (
          <section className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-8 text-center text-stone-400">
            <Package className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">今天沒有可回庫的派車品項。</p>
          </section>
        )}

        <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-stone-900">工作日誌</h3>
            </div>
            {(dispatches as any[]).length > 1 && (
              <span className="text-xs text-stone-400">
                路線 {(dispatches as any[]).find((d: any) => d.id === activeDispatchId)?.routeCode ?? "—"}
              </span>
            )}
          </div>

          {(dispatches as any[]).length > 1 && (
            <div className="mt-3">
              <Select value={activeDispatchId ? String(activeDispatchId) : ""} onValueChange={setSelectedDispatchId}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="選擇要日結的派車單" />
                </SelectTrigger>
                <SelectContent>
                  {(dispatches as any[]).map((dispatch: any) => {
                    const statusLabel: Record<string, string> = {
                      draft: "草稿", printed: "已列印", in_progress: "配送中",
                      pending_handover: "待點收", completed: "已完成",
                    };
                    return (
                      <SelectItem key={dispatch.id} value={String(dispatch.id)}>
                        {`路線 ${dispatch.routeCode || "—"}　${statusLabel[dispatch.status] ?? dispatch.status}　共 ${dispatch.totalStops ?? "?"} 站`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {hasSubmitted ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-emerald-700">本次派車單日結已送出</p>
              <p className="mt-1 text-xs text-emerald-700/75">
                完成 {Number((workLog as any)?.totalOrders ?? deliveredOrders.length)} 筆，現收 NT${" "}
                {Number((workLog as any)?.totalCollected ?? totalCollected).toLocaleString()}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <Clock className="h-3.5 w-3.5" />
                    出勤時間
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <Clock className="h-3.5 w-3.5" />
                    收工時間
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 space-y-3">
                <p className="text-xs font-semibold text-amber-800">現金繳回</p>
                <div>
                  <label className="mb-1 block text-xs text-stone-500">實際繳回現金（NT$）</label>
                  <input
                    type="number"
                    min={0}
                    value={cashHandedOver}
                    onChange={(event) => setCashHandedOver(event.target.value)}
                    placeholder={`系統應收 NT$ ${totalCollected.toLocaleString()}，填入實際繳回金額`}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {cashHandedOver && Number(cashHandedOver) !== totalCollected && (
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">
                      差額 NT$ {Math.abs(Number(cashHandedOver) - totalCollected).toLocaleString()}
                      {Number(cashHandedOver) < totalCollected ? "（少收）" : "（多收）"}　說明原因
                    </label>
                    <input
                      type="text"
                      value={handoverNote}
                      onChange={(event) => setHandoverNote(event.target.value)}
                      placeholder="例如：A客戶少付100，說下次補"
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-xs text-stone-500">其他備註</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="例如：客戶臨時加單、剩貨狀況"
                  rows={3}
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
                    cashHandedOver: cashHandedOver ? Number(cashHandedOver) : undefined,
                    handoverNote: handoverNote || undefined,
                    dispatchOrderId: activeDispatchId,
                  })
                }
              >
                {submitLog.isPending ? "送出中..." : "送出今日日結，通知管理員點收"}
              </button>
            </>
          )}
        </section>
      </div>
    </DriverLayout>
  );
}

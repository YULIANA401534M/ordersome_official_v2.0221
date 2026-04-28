import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import SignatureCanvas from "react-signature-canvas";
import { MapPin, Phone, ChevronLeft, Truck, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 90004;

const STATUS_LABEL: Record<string, string> = {
  pending:    "待處理",
  assigned:   "已派車",
  picked:     "已撿貨",
  delivering: "配送中",
  delivered:  "已送達",
  returned:   "已回單",
  cancelled:  "已取消",
};

const STATUS_TONE: Record<string, string> = {
  pending:    "bg-stone-100 text-stone-600",
  assigned:   "bg-sky-100 text-sky-700",
  picked:     "bg-amber-100 text-amber-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  returned:   "bg-rose-100 text-rose-700",
  cancelled:  "bg-stone-100 text-stone-400",
};

const PAY_LABEL: Record<string, string> = {
  monthly: "月結",
  weekly:  "週結",
  unpaid:  "現收－未收",
  partial: "現收－部分",
  paid:    "現收－已收",
};

export default function DriverOrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id ?? "0");
  const [, navigate] = useLocation();

  // Delivery confirmation state
  const [cashInput, setCashInput] = useState("");
  const [inBoxes, setInBoxes] = useState("");
  const [returnBoxes, setReturnBoxes] = useState("");
  const [driverNote, setDriverNote] = useState("");
  const [showSig, setShowSig] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);
  // 本地快取簽名 URL（invalidate 完成前仍能 unlock 送出按鈕）
  const [localSignatureUrl, setLocalSignatureUrl] = useState<string | null>(null);
  // 拒收流程
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const today = new Date().toLocaleDateString("sv-SE");
  const utils = trpc.useUtils();

  const { data: orders = [] } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });
  const order = (orders as any[]).find((o: any) => o.id === orderId);

  const { data: orderDetail } = trpc.dayone.orders.getWithItems.useQuery(
    { id: orderId, tenantId: TENANT_ID },
    { enabled: !!orderId }
  );

  const updateStatus = trpc.dayone.driver.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("狀態已更新");
      utils.dayone.driver.getMyTodayOrders.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadSignature = trpc.dayone.driver.uploadSignature.useMutation({
    onSuccess: (data) => {
      toast.success("簽名已記錄");
      setShowSig(false);
      setLocalSignatureUrl(data.signatureUrl);
      utils.dayone.driver.getMyTodayOrders.setData(
        { tenantId: TENANT_ID, deliveryDate: today },
        (prev: any) =>
          Array.isArray(prev)
            ? prev.map((o: any) => o.id === orderId ? { ...o, signatureUrl: data.signatureUrl } : o)
            : prev
      );
      utils.dayone.driver.getMyTodayOrders.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleConfirmDelivery() {
    const cash = cashInput !== "" ? Number(cashInput) : undefined;
    const ib = inBoxes !== "" ? Number(inBoxes) : undefined;
    const rb = returnBoxes !== "" ? Number(returnBoxes) : undefined;
    await updateStatus.mutateAsync({
      id: orderId,
      tenantId: TENANT_ID,
      status: "delivered",
      cashCollected: cash,
      inBoxes: ib,
      returnBoxes: rb,
      driverNote: driverNote || undefined,
    });
  }

  async function handleSaveSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("請先讓客戶簽名");
      return;
    }
    const dataUrl = sigRef.current.toDataURL("image/png");
    await uploadSignature.mutateAsync({ orderId, tenantId: TENANT_ID, imageBase64: dataUrl });
  }

  if (!order) {
    return (
      <DriverLayout title="訂單明細">
        <div className="flex h-64 flex-col items-center justify-center text-stone-400">
          <Truck className="h-12 w-12 opacity-40" />
          <p className="mt-4 text-sm">找不到這筆今日訂單</p>
          <button type="button" onClick={() => navigate("/driver/orders")} className="mt-4 text-sm font-semibold text-amber-600">
            返回列表
          </button>
        </div>
      </DriverLayout>
    );
  }

  const isDelivered = order.status === "delivered";
  const isCash = !["monthly", "weekly"].includes(order.settlementCycle ?? "");
  const unpaid = Number(order.customerUnpaidAmount ?? 0);
  const totalAmt = Number(order.totalAmount ?? 0);
  const items = (orderDetail as any)?.items ?? [];

  return (
    <DriverLayout title="訂單明細">
      <div className="space-y-4 pb-8">
        <button type="button" onClick={() => navigate("/driver/orders")}
          className="inline-flex items-center gap-1 px-1 text-sm text-stone-500">
          <ChevronLeft className="h-4 w-4" />返回列表
        </button>

        {/* ── 客戶與訂單資訊 ── */}
        <section className="rounded-[28px] border border-stone-200/70 bg-white p-5 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl font-bold text-stone-900 leading-tight">{order.customerName}</p>
              <p className="mt-1 text-xs tracking-widest text-stone-400">{order.orderNo}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[order.status] ?? "bg-stone-100 text-stone-600"}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
              <span>{order.customerAddress ?? "未提供地址"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-amber-500" />
              <a href={`tel:${order.customerPhone}`} className="text-amber-700 underline-offset-2 hover:underline">
                {order.customerPhone ?? "未提供電話"}
              </a>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
            <div>
              <p className="text-xs text-stone-400">結帳方式</p>
              <p className="mt-0.5 text-sm font-semibold text-stone-700">{PAY_LABEL[order.settlementCycle ?? "unpaid"] ?? "現收"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">訂單金額</p>
              <p className="mt-0.5 text-2xl font-bold text-stone-900">NT$ {totalAmt.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* ── 歷史欠款提醒 ── */}
        {unpaid > 0 && (
          <section className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-700">此客戶尚有舊帳未收</p>
              <p className="mt-0.5 text-sm text-rose-600">累計 NT$ {unpaid.toLocaleString()}，送達後可一併提醒。</p>
            </div>
          </section>
        )}

        {/* ── 商品明細 ── */}
        {items.length > 0 && (
          <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-stone-900">本次出貨明細</p>
            </div>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{item.productName}</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {item.qty} {item.unit ?? ""} × NT$ {Number(item.unitPrice ?? 0).toLocaleString()}
                    <span className="ml-2 text-stone-400">= {(Number(item.qty) * Number(item.unitPrice ?? 0)).toLocaleString()}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end border-t border-stone-100 pt-3">
              <p className="text-base font-bold text-stone-900">合計 NT$ {totalAmt.toLocaleString()}</p>
            </div>
          </section>
        )}

        {/* ── 狀態前進按鈕（非送達前） ── */}
        {order.status === "picked" && (
          <button type="button"
            className="w-full rounded-2xl bg-amber-600 py-4 text-base font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-50"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: orderId, tenantId: TENANT_ID, status: "delivering" })}>
            {updateStatus.isPending ? "更新中…" : "出發配送"}
          </button>
        )}

        {/* ── 拒收按鈕（picked 或 delivering 都可以用） ── */}
        {(order.status === "picked" || order.status === "delivering") && !showReject && (
          <button type="button"
            className="w-full rounded-2xl border-2 border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 active:scale-[0.98] transition-transform"
            onClick={() => setShowReject(true)}>
            客戶拒收
          </button>
        )}

        {/* ── 拒收確認區塊 ── */}
        {showReject && (order.status === "picked" || order.status === "delivering") && (
          <section className="rounded-[28px] border-2 border-rose-200 bg-rose-50 p-5 space-y-4">
            <p className="text-sm font-semibold text-rose-700">確認客戶拒收</p>
            <p className="text-xs text-rose-600">此筆訂單將標記為「已回單」，不產生應收帳款。貨物請帶回倉庫，在「剩貨回庫」頁面回報。</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">拒收原因（必填）</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                placeholder="例如：客戶臨時取消、無人在家、地址錯誤…"
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div className="flex gap-3">
              <button type="button"
                className="flex-1 rounded-2xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600"
                onClick={() => { setShowReject(false); setRejectNote(""); }}>
                取消
              </button>
              <button type="button"
                className="flex-1 rounded-2xl bg-rose-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                disabled={!rejectNote.trim() || updateStatus.isPending}
                onClick={() => updateStatus.mutate({
                  id: orderId, tenantId: TENANT_ID, status: "returned",
                  rejectNote: rejectNote.trim(),
                })}>
                {updateStatus.isPending ? "送出中…" : "確認拒收，帶貨回倉"}
              </button>
            </div>
          </section>
        )}

        {/* ── 送達確認區塊 ── */}
        {order.status === "delivering" && !showReject && (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 space-y-4">
            <p className="text-sm font-semibold text-amber-800">到達客戶端 — 填完再按確認送達</p>

            {/* 現收欄位（月結/週結不顯示） */}
            {isCash && (
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">現場收款金額（NT$）</label>
                <input
                  type="number" inputMode="numeric" min={0}
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  placeholder={`應收 NT$ ${totalAmt.toLocaleString()}`}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {cashInput !== "" && Number(cashInput) !== totalAmt && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    差額 NT$ {Math.abs(Number(cashInput) - totalAmt).toLocaleString()}
                    {Number(cashInput) < totalAmt ? "（少收）" : "（多收）"}
                  </p>
                )}
              </div>
            )}

            {/* 箱數 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">收前箱（客戶還回空箱）</label>
                <input
                  type="number" inputMode="numeric" min={0}
                  value={inBoxes}
                  onChange={(e) => setInBoxes(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">退回箱（退貨/未送出）</label>
                <input
                  type="number" inputMode="numeric" min={0}
                  value={returnBoxes}
                  onChange={(e) => setReturnBoxes(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* 備註 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">備註（臨時加量、退貨說明等）</label>
              <textarea
                value={driverNote}
                onChange={(e) => setDriverNote(e.target.value)}
                rows={2}
                placeholder="選填"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* 客戶簽名（必填） */}
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <p className="text-xs font-medium text-stone-600">客戶簽名</p>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">必填</span>
              </div>
              {(localSignatureUrl || order.signatureUrl) ? (
                <div className="rounded-2xl border border-emerald-200 bg-white p-2">
                  <img src={localSignatureUrl || order.signatureUrl!} alt="客戶簽名" className="max-h-28 w-full object-contain" />
                  <p className="mt-1 text-center text-xs font-semibold text-emerald-600">✓ 已簽名</p>
                </div>
              ) : showSig ? (
                <div>
                  <div className="overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-white">
                    <SignatureCanvas ref={sigRef} canvasProps={{ className: "h-32 w-full", style: { background: "#fff" } }} />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => sigRef.current?.clear()}
                      className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600">
                      清除
                    </button>
                    <button type="button" onClick={handleSaveSignature} disabled={uploadSignature.isPending}
                      className="flex-1 rounded-2xl bg-amber-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                      {uploadSignature.isPending ? "上傳中…" : "儲存簽名"}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSig(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 py-5 text-sm font-medium text-rose-700">
                  ✎ 點這裡讓客戶簽名（必填）
                </button>
              )}
            </div>

            {/* 確認送達 */}
            {(() => {
              const missingCash = isCash && cashInput === "";
              const missingSig = !localSignatureUrl && !order.signatureUrl;
              const canSubmit = !missingCash && !missingSig && !updateStatus.isPending;
              return (
                <>
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-stone-900 py-4 text-base font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canSubmit}
                    onClick={handleConfirmDelivery}
                  >
                    {updateStatus.isPending ? "送出中…" : "確認送達"}
                  </button>
                  {(missingCash || missingSig) && (
                    <div className="space-y-1">
                      {missingCash && <p className="text-center text-xs text-rose-500">請先填入收款金額</p>}
                      {missingSig && <p className="text-center text-xs text-rose-500">請先取得客戶簽名</p>}
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        )}

        {/* ── 已送達狀態 ── */}
        {isDelivered && (
          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">已確認送達</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white px-3 py-2.5">
                <p className="text-xs text-stone-400">收款金額</p>
                <p className="mt-1 font-semibold text-stone-900">
                  {isCash ? `NT$ ${Number(order.cashCollected ?? 0).toLocaleString()}` : PAY_LABEL[order.settlementCycle ?? ""] ?? "月結"}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2.5">
                <p className="text-xs text-stone-400">收前箱 / 退回箱</p>
                <p className="mt-1 font-semibold text-stone-900">
                  {order.inBoxes ?? "—"} / {order.returnBoxes ?? "—"}
                </p>
              </div>
            </div>
            {order.signatureUrl && (
              <div className="rounded-2xl border border-emerald-200 bg-white p-2">
                <img src={order.signatureUrl} alt="客戶簽名" className="max-h-24 w-full object-contain" />
              </div>
            )}
            {order.driverNote && (
              <p className="text-xs text-stone-500">備註：{order.driverNote}</p>
            )}
            <p className="text-xs text-emerald-700/70 text-center">回倉後在「剩貨回庫 / 日結」頁面完成今日結算</p>
          </section>
        )}

        {/* ── 已回單（拒收）狀態 ── */}
        {order.status === "returned" && (
          <section className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-5 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-rose-500" />
              <p className="text-sm font-semibold text-rose-700">已回單（客戶拒收）</p>
            </div>
            {order.driverNote && (
              <p className="text-xs text-rose-600">{order.driverNote}</p>
            )}
            <p className="text-xs text-rose-500/80">此筆貨物請在「剩貨回庫 / 日結」頁面回報回庫數量</p>
          </section>
        )}
      </div>
    </DriverLayout>
  );
}

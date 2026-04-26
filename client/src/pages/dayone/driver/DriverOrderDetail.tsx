import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import SignatureCanvas from "react-signature-canvas";
import { MapPin, Phone, DollarSign, PenLine, CheckCircle, ChevronLeft, Truck } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 90004;

const STATUS_FLOW: Record<string, { next: "picked" | "delivering" | "delivered"; label: string }> = {
  assigned: { next: "picked", label: "確認已撿貨" },
  pending: { next: "picked", label: "確認已撿貨" },
  picked: { next: "delivering", label: "開始配送" },
  delivering: { next: "delivered", label: "確認送達" },
};

export default function DriverOrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id ?? "0");
  const [, navigate] = useLocation();
  const [cashInput, setCashInput] = useState("");
  const [showSignature, setShowSignature] = useState(false);
  const [note, setNote] = useState("");
  const sigRef = useRef<SignatureCanvas>(null);

  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const utils = trpc.useUtils();
  const { data: orders = [] } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });
  const order = (orders as any[]).find((item: any) => item.id === orderId);

  const updateStatus = trpc.dayone.driver.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("訂單狀態已更新");
      utils.dayone.driver.getMyTodayOrders.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const recordCash = trpc.dayone.driver.recordCashPayment.useMutation({
    onSuccess: () => {
      toast.success("收款已更新");
      setCashInput("");
      utils.dayone.driver.getMyTodayOrders.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const uploadSignature = trpc.dayone.driver.uploadSignature.useMutation({
    onSuccess: () => {
      toast.success("簽名已上傳");
      setShowSignature(false);
      utils.dayone.driver.getMyTodayOrders.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  async function handleSaveSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("請先簽名");
      return;
    }
    const dataUrl = sigRef.current.toDataURL("image/png");
    await uploadSignature.mutateAsync({
      orderId,
      tenantId: TENANT_ID,
      imageBase64: dataUrl,
    });
  }

  if (!order) {
    return (
      <DriverLayout title="訂單明細">
        <div className="flex h-64 flex-col items-center justify-center text-stone-400">
          <Truck className="h-12 w-12 opacity-40" />
          <p className="mt-4 text-sm">找不到這筆今日訂單。</p>
          <button type="button" onClick={() => navigate("/driver/orders")} className="mt-4 text-sm font-medium text-amber-600">
            返回訂單列表
          </button>
        </div>
      </DriverLayout>
    );
  }

  const flow = STATUS_FLOW[order.status];
  const unpaidAmt = Number(order.customerUnpaidAmount ?? 0);

  return (
    <DriverLayout title="訂單明細">
      <div className="space-y-4">
        <button type="button" onClick={() => navigate("/driver/orders")} className="inline-flex items-center gap-1 px-1 text-sm text-stone-500">
          <ChevronLeft className="h-4 w-4" />
          返回列表
        </button>

        {unpaidAmt > 0 && (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4">
            <p className="text-sm font-semibold text-rose-700">此客戶尚有未收款</p>
            <p className="mt-1 text-sm text-rose-600">累計待收 NT$ {unpaidAmt.toLocaleString()}</p>
          </section>
        )}

        <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-stone-900">{order.customerName}</p>
              <p className="mt-1 text-xs font-medium tracking-[0.16em] text-stone-400">{order.orderNo}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{order.status}</span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              <span>{order.customerAddress ?? "未提供地址"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-500" />
              <span>{order.customerPhone ?? "未提供電話"}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600">訂單總額</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-600">已收現金</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">NT$ {Number(order.cashCollected ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </section>

        {order.status !== "delivered" && (
          <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-stone-900">現場收款</h3>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                value={cashInput}
                onChange={(event) => setCashInput(event.target.value)}
                placeholder="輸入實收金額"
                className="flex-1 rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() =>
                  recordCash.mutate({
                    orderId,
                    tenantId: TENANT_ID,
                    cashCollected: Number(cashInput || 0),
                  })
                }
                disabled={!cashInput || recordCash.isPending}
                className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                登記收款
              </button>
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-stone-900">客戶簽名</h3>
          </div>

          {order.signatureUrl ? (
            <div className="mt-4">
              <img src={order.signatureUrl} alt="簽名" className="max-h-36 w-full rounded-2xl border border-stone-200 bg-stone-50 object-contain" />
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                已完成簽名
              </p>
            </div>
          ) : showSignature ? (
            <div className="mt-4">
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50">
                <SignatureCanvas ref={sigRef} canvasProps={{ className: "h-36 w-full", style: { background: "#fafaf9" } }} />
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => sigRef.current?.clear()} className="flex-1 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600">
                  清除
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignature}
                  disabled={uploadSignature.isPending}
                  className="flex-1 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {uploadSignature.isPending ? "上傳中..." : "儲存簽名"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignature(true)}
              className="mt-4 w-full rounded-2xl border-2 border-dashed border-stone-300 px-4 py-6 text-sm font-medium text-stone-500"
            >
              點這裡讓客戶簽名
            </button>
          )}
        </section>

        <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
          <label className="mb-2 block text-sm font-semibold text-stone-900">配送備註</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="例如：客戶臨時加量、放置位置、退回空箱等"
            rows={3}
            className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </section>

        {flow && (
          <button
            type="button"
            onClick={() =>
              updateStatus.mutate({
                id: orderId,
                tenantId: TENANT_ID,
                status: flow.next,
                driverNote: note || undefined,
              })
            }
            disabled={updateStatus.isPending}
            className="w-full rounded-2xl bg-stone-900 py-4 text-base font-semibold text-white disabled:opacity-50"
          >
            {updateStatus.isPending ? "更新中..." : flow.label}
          </button>
        )}

        {order.status === "delivered" && (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
            <p className="text-sm font-semibold text-emerald-700">這筆訂單已完成送達</p>
            <p className="mt-1 text-xs text-emerald-700/75">接下來可以前往日結處理剩貨回庫。</p>
          </div>
        )}
      </div>
    </DriverLayout>
  );
}

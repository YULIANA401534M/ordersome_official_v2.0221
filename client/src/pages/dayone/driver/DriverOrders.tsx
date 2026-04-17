import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { MapPin, Phone, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TENANT_ID = 90004;

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  pending:    { label: "待配送", color: "bg-blue-100 text-blue-700", next: "delivering", nextLabel: "開始配送" },
  delivering: { label: "配送中", color: "bg-orange-100 text-orange-700", next: "delivered", nextLabel: "完成配送" },
  delivered:  { label: "已送達", color: "bg-green-100 text-green-700" },
  failed:     { label: "配送失敗", color: "bg-red-100 text-red-700" },
};

interface ConfirmState {
  orderId: number;
  dispatchItemId: number | null;
  isMonthly: boolean;
  deliverBoxes: number;
  returnBoxes: number;
  cashCollected: number;
  note: string;
}

export default function DriverOrders() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const todayDate = new Date().toISOString().slice(0, 10);
  const utils = trpc.useUtils();

  const { data: orders, isLoading } = trpc.dayone.drivers.myOrders.useQuery({ tenantId: TENANT_ID, deliveryDate: todayDate });

  const updateStatus = trpc.dayone.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); utils.dayone.drivers.myOrders.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const updateDispatchItem = trpc.dayone.dispatch.updateDispatchItem.useMutation({
    onSuccess: () => { toast.success("配送完成，資料已更新"); utils.dayone.drivers.myOrders.invalidate(); setConfirmState(null); },
    onError: (e) => toast.error(e.message),
  });

  function openConfirm(order: any) {
    const isMonthly = ["monthly", "weekly"].includes(order.settlementCycle ?? order.paymentType ?? "");
    setConfirmState({
      orderId: order.id,
      dispatchItemId: order.dispatchItemId ?? null,
      isMonthly,
      deliverBoxes: order.items?.reduce((s: number, i: any) => s + (i.qty ?? 0), 0) ?? 0,
      returnBoxes: 0,
      cashCollected: isMonthly ? 0 : Number(order.totalAmount ?? 0),
      note: "",
    });
  }

  async function handleConfirmDelivery() {
    if (!confirmState) return;
    if (confirmState.dispatchItemId) {
      await updateDispatchItem.mutateAsync({
        itemId: confirmState.dispatchItemId,
        tenantId: TENANT_ID,
        returnBoxes: confirmState.returnBoxes,
        cashCollected: confirmState.isMonthly ? 0 : confirmState.cashCollected,
        paymentStatus: confirmState.isMonthly ? "monthly" : "cash",
        driverNote: confirmState.note,
      });
    } else {
      // fallback: just update order status
      await updateStatus.mutateAsync({ id: confirmState.orderId, tenantId: TENANT_ID, status: "delivered" });
      setConfirmState(null);
    }
  }

  if (isLoading) return (
    <DriverLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DriverLayout>
  );

  return (
    <DriverLayout>
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-bold text-gray-900">今日配送單</h2>
        <p className="text-sm text-gray-500">{todayDate} · 共 {(orders as any[])?.length ?? 0} 筆</p>

        {!(orders as any[])?.length ? (
          <div className="text-center py-16 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>今日無配送任務</p>
          </div>
        ) : (
          (orders as any[]).map((order: any) => {
            const st = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-start gap-3" onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      <span className="text-xs text-gray-400 font-mono">{order.orderNo}</span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{order.customerName ?? "客戶"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{order.address ?? "-"}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />}
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                    {order.phone && (
                      <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                        <Phone className="w-4 h-4" /> {order.phone}
                      </a>
                    )}
                    {order.items?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">配送品項</p>
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm py-0.5">
                            <span className="text-gray-700">{item.productName}</span>
                            <span className="font-medium">{item.qty} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {order.note && <p className="text-xs text-gray-500 bg-yellow-50 rounded p-2">備註：{order.note}</p>}
                    {order.status === "pending" && (
                      <button
                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                        onClick={() => updateStatus.mutate({ id: order.id, tenantId: TENANT_ID, status: "delivering" })}
                        disabled={updateStatus.isPending}
                      >
                        開始配送
                      </button>
                    )}
                    {order.status === "delivering" && (
                      <button
                        className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                        onClick={() => openConfirm(order)}
                      >
                        完成配送
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirm Delivery Modal */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-900">完成配送確認</h3>

            <div className="space-y-3">
              {/* Deliver Boxes */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">送出箱數</p>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    onClick={() => setConfirmState(s => s ? { ...s, deliverBoxes: Math.max(0, s.deliverBoxes - 1) } : s)}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{confirmState.deliverBoxes}</span>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    onClick={() => setConfirmState(s => s ? { ...s, deliverBoxes: s.deliverBoxes + 1 } : s)}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Return Boxes */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">收回空箱數</p>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    onClick={() => setConfirmState(s => s ? { ...s, returnBoxes: Math.max(0, s.returnBoxes - 1) } : s)}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{confirmState.returnBoxes}</span>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    onClick={() => setConfirmState(s => s ? { ...s, returnBoxes: s.returnBoxes + 1 } : s)}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cash (only for non-monthly) */}
              {!confirmState.isMonthly && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">收款金額（現付）</p>
                  <Input type="number" value={confirmState.cashCollected}
                    onChange={e => setConfirmState(s => s ? { ...s, cashCollected: Number(e.target.value) } : s)} />
                </div>
              )}
              {confirmState.isMonthly && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">月結客戶 — 無需現場收款</div>
              )}

              {/* Note */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">備註（選填）</p>
                <textarea className="w-full border rounded p-2 text-sm h-16 resize-none"
                  value={confirmState.note}
                  onChange={e => setConfirmState(s => s ? { ...s, note: e.target.value } : s)}
                  placeholder="異常、缺貨等備註..." />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmState(null)}>取消</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleConfirmDelivery}
                disabled={updateDispatchItem.isPending || updateStatus.isPending}>
                {(updateDispatchItem.isPending || updateStatus.isPending) ? "更新中..." : "確認完成"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DriverLayout>
  );
}

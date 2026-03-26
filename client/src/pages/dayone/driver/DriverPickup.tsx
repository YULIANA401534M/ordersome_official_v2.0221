import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 2;

export default function DriverPickup() {
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const todayDate = new Date().toISOString().slice(0, 10);
  const utils = trpc.useUtils();

  const { data: orders, isLoading } = trpc.dayone.drivers.myOrders.useQuery({ tenantId: TENANT_ID, deliveryDate: todayDate });
  const pendingOrders = (orders as any[] ?? []).filter((o: any) => o.status === "pending");

  const updateStatus = trpc.dayone.orders.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      setConfirmed(prev => { const next = new Set(prev); next.add(vars.id); return next; });
      toast.success("已確認取貨");
      utils.dayone.drivers.myOrders.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">取貨確認</h2>
        <p className="text-sm text-gray-500">請確認已取得以下訂單的貨品</p>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !pendingOrders.length ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-green-600">所有訂單已取貨完畢</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order: any) => {
              const isDone = confirmed.has(order.id);
              return (
                <div key={order.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${isDone ? "border-green-200 bg-green-50" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{order.customerName ?? "客戶"}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{order.orderNo}</p>
                      {order.items?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Package className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span className="text-gray-700">{item.productName}</span>
                              <span className="ml-auto font-bold text-gray-900">{item.qty} {item.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isDone ? (
                      <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <button
                        className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0"
                        onClick={() => updateStatus.mutate({ id: order.id, tenantId: TENANT_ID, status: "delivering" })}
                        disabled={updateStatus.isPending}
                      >
                        確認取貨
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}

import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { MapPin, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const TENANT_ID = 2;

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  pending:    { label: "待配送", color: "bg-blue-100 text-blue-700", next: "delivering", nextLabel: "開始配送" },
  delivering: { label: "配送中", color: "bg-orange-100 text-orange-700", next: "delivered", nextLabel: "完成配送" },
  delivered:  { label: "已送達", color: "bg-green-100 text-green-700" },
  failed:     { label: "配送失敗", color: "bg-red-100 text-red-700" },
};

export default function DriverOrders() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const todayDate = new Date().toISOString().slice(0, 10);
  const utils = trpc.useUtils();

  const { data: orders, isLoading } = trpc.dayone.drivers.myOrders.useQuery({ tenantId: TENANT_ID, deliveryDate: todayDate });

  const updateStatus = trpc.dayone.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); utils.dayone.drivers.myOrders.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

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
                    {st.next && (
                      <button
                        className="w-full bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                        onClick={() => updateStatus.mutate({ id: order.id, tenantId: TENANT_ID, status: st.next as any })}
                        disabled={updateStatus.isPending}
                      >
                        {updateStatus.isPending ? "更新中..." : st.nextLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </DriverLayout>
  );
}

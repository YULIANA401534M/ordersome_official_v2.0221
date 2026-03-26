import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, MapPin } from "lucide-react";

const TENANT_ID = 2;

export default function DriverDone() {
  const todayDate = new Date().toISOString().slice(0, 10);
  const { data: orders, isLoading } = trpc.dayone.drivers.myOrders.useQuery({ tenantId: TENANT_ID, deliveryDate: todayDate });
  const doneOrders = (orders as any[] ?? []).filter((o: any) => o.status === "delivered");

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">今日完成</h2>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            {doneOrders.length} 筆
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !doneOrders.length ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>今日尚無完成的配送</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doneOrders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-green-100 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{order.customerName ?? "客戶"}</p>
                    <p className="text-xs text-gray-400 font-mono">{order.orderNo}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{order.address ?? "-"}
                    </p>
                    {order.items?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {order.items.map((item: any, i: number) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {item.productName} ×{item.qty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">${Number(order.totalAmount ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">今日配送總金額</span>
                <span className="font-bold text-amber-700">
                  ${doneOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount ?? 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  );
}

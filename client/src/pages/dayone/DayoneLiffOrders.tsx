import { DayoneLayout } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "待處理", color: "bg-gray-100 text-gray-700" },
  assigned:   { label: "已指派", color: "bg-blue-100 text-blue-700" },
  picked:     { label: "已取貨", color: "bg-purple-100 text-purple-700" },
  delivering: { label: "配送中", color: "bg-amber-100 text-amber-700" },
  delivered:  { label: "已送達", color: "bg-green-100 text-green-700" },
  returned:   { label: "退回", color: "bg-red-100 text-red-700" },
  cancelled:  { label: "取消", color: "bg-gray-100 text-gray-500" },
};

function formatDate(val: string | null) {
  if (!val) return "-";
  const d = new Date(val);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function DayoneLiffOrders() {
  const { data: orders, isLoading } = trpc.dayone.orders.getLiffOrders.useQuery();

  return (
    <DayoneLayout>
      <div className="p-4 md:p-6 space-y-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">LIFF 訂單</h1>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!isLoading && (!orders || orders.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">尚無 LIFF 訂單</CardContent>
          </Card>
        )}

        {/* Desktop table */}
        {!isLoading && orders && orders.length > 0 && (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {orders.map((o: any) => {
                const status = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <Card key={o.orderId}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800">{o.orderNo}</span>
                        <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
                      </div>
                      <div className="text-sm text-gray-700">{o.customerName}</div>
                      <div className="text-sm text-gray-500">{o.customerPhone}</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatDate(o.createdAt)}</span>
                        <span className="font-medium text-gray-800">
                          {Number(o.totalAmount) === 0 ? "待確認" : `$${Number(o.totalAmount).toLocaleString()}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="text-base">共 {orders.length} 筆</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600">
                        <th className="text-left px-4 py-3 font-medium">訂單編號</th>
                        <th className="text-left px-4 py-3 font-medium">客戶名稱</th>
                        <th className="text-left px-4 py-3 font-medium">電話</th>
                        <th className="text-left px-4 py-3 font-medium">下單時間</th>
                        <th className="text-right px-4 py-3 font-medium">金額</th>
                        <th className="text-center px-4 py-3 font-medium">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any) => {
                        const status = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                        return (
                          <tr key={o.orderId} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-700">{o.orderNo}</td>
                            <td className="px-4 py-3 text-gray-800">{o.customerName}</td>
                            <td className="px-4 py-3 text-gray-600">{o.customerPhone}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-800">
                              {Number(o.totalAmount) === 0 ? (
                                <span className="text-amber-600">待確認</span>
                              ) : (
                                `$${Number(o.totalAmount).toLocaleString()}`
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={`${status.color} border-0`}>{status.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DayoneLayout>
  );
}

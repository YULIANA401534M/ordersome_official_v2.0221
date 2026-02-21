import { useParams, Link } from "wouter";
import { ArrowLeft, Package, CheckCircle, Clock, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "待付款", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "已付款", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "處理中", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "已出貨", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "已送達", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-800", icon: Clock },
  refunded: { label: "已退款", color: "bg-gray-100 text-gray-800", icon: Clock },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = trpc.order.getById.useQuery({ id: parseInt(id || "0") });

  if (isLoading) return <CorporateLayout><div className="container py-20 text-center">載入中...</div></CorporateLayout>;
  if (!order) return <CorporateLayout><div className="container py-20 text-center">找不到訂單</div></CorporateLayout>;

  const status = statusMap[order.status] || statusMap.pending;
  const StatusIcon = status.icon;

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-3xl font-bold">訂單詳情</h1>
          <p className="text-gray-300 mt-2">訂單編號：{order.orderNumber}</p>
        </div>
      </section>
      <section className="py-12 bg-gray-50">
        <div className="container">
          <Link href="/member/orders"><Button variant="ghost" className="gap-2 mb-6"><ArrowLeft className="h-4 w-4" />返回訂單列表</Button></Link>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">訂單狀態</h2>
                    <Badge className={status.color}><StatusIcon className="h-4 w-4 mr-1" />{status.label}</Badge>
                  </div>
                  <p className="text-gray-600">訂單建立時間：{order.createdAt ? new Date(order.createdAt).toLocaleString("zh-TW") : "-"}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">訂單商品</h2>
                  <div className="space-y-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{item.productName}</h3>
                          <p className="text-gray-600">NT$ {item.price} x {item.quantity}</p>
                        </div>
                        <p className="font-bold">NT$ {item.subtotal}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="border-0 shadow-lg sticky top-4">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">訂單摘要</h2>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex justify-between"><span>商品小計</span><span>NT$ {order.subtotal}</span></div>
                    <div className="flex justify-between"><span>運費</span><span>NT$ {order.shippingFee}</span></div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t"><span>總計</span><span>NT$ {order.total}</span></div>
                  </div>
                  {order.status === "pending" && (
                    <Link href={`/shop/payment/${order.orderNumber}`}>
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-4 gap-2">
                        <CreditCard className="h-4 w-4" />
                        前往付款
                      </Button>
                    </Link>
                  )}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-bold mb-2">收件資訊</h3>
                    <p className="text-gray-600">{order.recipientName}</p>
                    <p className="text-gray-600">{order.recipientPhone}</p>
                    <p className="text-gray-600">{order.shippingAddress}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}

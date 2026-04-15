import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import BrandLayout from "@/components/layout/BrandLayout";

export default function MyOrders() {
  useEffect(() => {
    document.querySelector('meta[name="robots"]')?.setAttribute(
      "content",
      "noindex, nofollow"
    );
  }, []);

  const { user, isAuthenticated } = useAuth();
  const { data: orders, isLoading } = trpc.order.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <BrandLayout>
        <div className="container py-12">
          <div className="text-center">
            <p className="text-gray-600 mb-4">請先登入以查看訂單</p>
            <Link href="/login">
              <Button>返回登入</Button>
            </Link>
          </div>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/shop">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">我的訂單</h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">載入中...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!orders || orders.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">您還沒有任何訂單</p>
              <Link href="/shop">
                <Button>開始購物</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!isLoading && orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/shop/order/${order.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          訂單編號：{order.orderNumber}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.createdAt).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          NT${Number(order.total).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {getStatusLabel(order.status)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      收件人：{order.recipientName}
                    </p>
                    {(order as any).shippingMethod && (order as any).shippingMethod !== "home_delivery" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600">
                          取貨門市：
                          {(order as any).shippingMethod === "cvs_fami" && "全家 "}
                          {(order as any).shippingMethod === "cvs_unimart" && "7-11 "}
                          {(order as any).shippingMethod === "cvs_hilife" && "萊爾富 "}
                          {(order as any).cvsStoreName || ""}
                        </span>
                        {(order as any).logisticsId && getLogisticsStatusBadge(
                          (order as any).logisticsStatus,
                          (order as any).logisticsStatusMsg
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </BrandLayout>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "待處理",
    paid: "已付款",
    processing: "處理中",
    shipped: "已出貨",
    delivered: "已送達",
    cancelled: "已取消",
    refunded: "已退款",
  };
  return labels[status] || status;
}

function getLogisticsStatusBadge(status: string | null | undefined, msg: string | null | undefined) {
  if (!status) return null;
  const arrivedCodes = ["2067", "3022", "3018"];
  const pickedCodes = ["3024", "3025"];

  let variant: string;
  let label: string;

  if (pickedCodes.includes(status)) {
    variant = "bg-blue-100 text-blue-700 border-blue-300";
    label = msg || "已取貨";
  } else if (arrivedCodes.includes(status)) {
    variant = "bg-green-100 text-green-700 border-green-300";
    label = status === "2067" ? "已到店可取貨（7-11）" : "包裹已到店";
  } else if (status === "300") {
    variant = "bg-yellow-100 text-yellow-700 border-yellow-300";
    label = "物流處理中";
  } else {
    variant = "bg-gray-100 text-gray-600 border-gray-300";
    label = msg || `狀態 ${status}`;
  }

  return <Badge variant="outline" className={`text-xs ${variant}`}>{label}</Badge>;
}

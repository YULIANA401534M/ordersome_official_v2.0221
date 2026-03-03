import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

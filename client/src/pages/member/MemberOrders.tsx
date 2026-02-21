import { Link, useLocation } from "wouter";
import { Package, Eye, User, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "已付款", color: "bg-blue-100 text-blue-800" },
  processing: { label: "處理中", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "已出貨", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "已送達", color: "bg-green-100 text-green-800" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-800" },
  refunded: { label: "已退款", color: "bg-gray-100 text-gray-800" },
};

export default function MemberOrders() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: orders, isLoading } = trpc.order.list.useQuery(undefined, { enabled: isAuthenticated });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("已登出");
      navigate("/");
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logout.mutate();
  };

  if (loading) {
    return (
      <CorporateLayout>
        <div className="container py-20 text-center">載入中...</div>
      </CorporateLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CorporateLayout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">請先登入</h1>
          <a href={getLoginUrl()}>
            <Button className="bg-amber-600 hover:bg-amber-700">登入 / 註冊</Button>
          </a>
        </div>
      </CorporateLayout>
    );
  }

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-3xl font-bold">會員中心</h1>
          <p className="text-gray-300 mt-2">歡迎回來，{user?.name || "會員"}</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50 min-h-[60vh]">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <Link href="/member/profile">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="h-4 w-4" />
                        個人資料
                      </Button>
                    </Link>
                    <Link href="/member/orders">
                      <Button variant="ghost" className="w-full justify-start gap-2 bg-amber-50 text-amber-700">
                        <Package className="h-4 w-4" />
                        我的訂單
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      登出
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <h2 className="text-xl font-bold text-gray-900 mb-4">我的訂單</h2>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse h-24" />
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = statusMap[order.status] || statusMap.pending;
                    return (
                      <Card key={order.id} className="border-0 shadow-md">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-gray-900">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleString("zh-TW")
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={status.color}>{status.label}</Badge>
                              <p className="font-bold text-amber-600">NT$ {order.total}</p>
                              <div className="flex gap-2">
                                {order.status === "pending" && (
                                  <Link href={`/shop/payment/${order.orderNumber}`}>
                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 gap-1">
                                      <CreditCard className="h-4 w-4" />
                                      付款
                                    </Button>
                                  </Link>
                                )}
                                <Link href={"/shop/order/" + order.id}>
                                  <Button size="sm" variant="outline" className="gap-1">
                                    <Eye className="h-4 w-4" />
                                    查看
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">還沒有訂單</p>
                  <Link href="/shop">
                    <Button className="bg-amber-600 hover:bg-amber-700">前往購物</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}

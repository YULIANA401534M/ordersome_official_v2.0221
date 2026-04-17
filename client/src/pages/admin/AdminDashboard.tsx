import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, ArrowRight, Settings, Layers, Clock, CreditCard, Truck } from "lucide-react";
import { useLocation } from "wouter";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: products } = trpc.product.listAll.useQuery();
  const { data: orders } = trpc.order.listAll.useQuery();
  const { data: categories } = trpc.category.listAll.useQuery();

  const stats = [
    { title: "商品數量", value: products?.length ?? 0, icon: Package, color: "bg-blue-500", link: "/dashboard/admin/products" },
    { title: "總訂單數", value: orders?.length ?? 0, icon: ShoppingCart, color: "bg-green-500", link: "/dashboard/admin/orders" },
    { title: "商品分類", value: categories?.length ?? 0, icon: Layers, color: "bg-purple-500", link: "/dashboard/admin/categories" },
    { title: "待處理訂單", value: orders?.filter(o => o.status === "pending").length ?? 0, icon: Clock, color: "bg-amber-500", link: "/dashboard/admin/orders" },
    { title: "付款/處理中", value: orders?.filter(o => o.status === "paid" || o.status === "processing").length ?? 0, icon: CreditCard, color: "bg-blue-400", link: "/dashboard/admin/orders" },
    { title: "已出貨/送達", value: orders?.filter(o => o.status === "shipped" || o.status === "delivered").length ?? 0, icon: Truck, color: "bg-green-400", link: "/dashboard/admin/orders" },
  ];

  const quickLinks = [
    { title: "商品管理", desc: "新增、編輯、刪除商品", icon: Package, link: "/dashboard/admin/products" },
    { title: "訂單管理", desc: "查看訂單、更新狀態", icon: ShoppingCart, link: "/dashboard/admin/orders" },
    { title: "分類管理", desc: "管理商品分類", icon: Layers, link: "/dashboard/admin/categories" },
  ];

  if (!isAuthenticated || (user?.role !== "super_admin" && user?.role !== "manager")) {
    return (
      <AdminDashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">需要管理員權限</h2>
            <p className="text-gray-500 mb-4">請使用管理員帳號登入</p>
            <Button variant="outline" onClick={() => setLocation("/")}>返回首頁</Button>
          </CardContent></Card>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">商城總覽</h1>
          <p className="text-gray-600 mt-2">管理商品、訂單與分類</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ border: '1px solid #e7e5e4', background: '#ffffff' }}
              onClick={() => setLocation(stat.link)}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="kpi-label">{stat.title}</p>
                    <p className="kpi-value">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-bold mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((item, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer h-full" onClick={() => setLocation(item.link)}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                      <item.icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </CardContent>
                </Card>
            ))}
          </div>
        </div>

        {/* Pending Orders Alert */}
        {orders && orders.filter(o => o.status === "pending").length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader><CardTitle className="text-amber-800">待處理訂單提醒</CardTitle></CardHeader>
            <CardContent>
              <p className="text-amber-700">您有 {orders.filter(o => o.status === "pending").length} 筆待處理的訂單，請盡快處理。</p>
              <Button className="mt-4 bg-amber-600 hover:bg-amber-700" onClick={() => setLocation("/dashboard/admin/orders")}>前往處理</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

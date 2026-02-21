import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, TrendingUp, ArrowRight, Settings, Layers } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: products } = trpc.product.listAll.useQuery();
  const { data: orders } = trpc.order.listAll.useQuery();
  const { data: categories } = trpc.category.listAll.useQuery();

  const stats = [
    { title: "商品數量", value: products?.length || 0, icon: Package, color: "bg-blue-500", link: "/admin/products" },
    { title: "訂單數量", value: orders?.length || 0, icon: ShoppingCart, color: "bg-green-500", link: "/admin/orders" },
    { title: "商品分類", value: categories?.length || 0, icon: Layers, color: "bg-purple-500", link: "/admin/categories" },
    { title: "待處理訂單", value: orders?.filter(o => o.status === "pending").length || 0, icon: TrendingUp, color: "bg-amber-500", link: "/admin/orders" },
  ];

  const quickLinks = [
    { title: "商品管理", desc: "新增、編輯、刪除商品", icon: Package, link: "/admin/products" },
    { title: "訂單管理", desc: "查看訂單、更新狀態", icon: ShoppingCart, link: "/admin/orders" },
    { title: "分類管理", desc: "管理商品分類", icon: Layers, link: "/admin/categories" },
  ];

  if (!isAuthenticated || user?.role !== "super_admin" && user?.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
          <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">需要管理員權限</h2>
          <p className="text-gray-500 mb-4">請使用管理員帳號登入</p>
          <Link href="/"><Button variant="outline">返回首頁</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white py-6">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">後台管理系統</h1>
              <p className="text-gray-400 mt-1">宇聯國際文化餐飲有限公司</p>
            </div>
            <Link href="/corporate"><Button variant="outline" className="text-white border-white hover:bg-white/10">返回官網</Button></Link>
          </div>
        </div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <h2 className="text-xl font-bold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLinks.map((item, i) => (
            <Link key={i} href={item.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
            </Link>
          ))}
        </div>
        {orders && orders.filter(o => o.status === "pending").length > 0 && (
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardHeader><CardTitle className="text-amber-800">待處理訂單提醒</CardTitle></CardHeader>
            <CardContent>
              <p className="text-amber-700">您有 {orders.filter(o => o.status === "pending").length} 筆待處理的訂單，請盡快處理。</p>
              <Link href="/admin/orders"><Button className="mt-4 bg-amber-600 hover:bg-amber-700">前往處理</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

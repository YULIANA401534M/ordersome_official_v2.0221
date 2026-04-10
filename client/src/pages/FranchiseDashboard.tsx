import { trpc } from "../lib/trpc";
import { Store, Package, DollarSign, TrendingUp, ArrowLeft } from "lucide-react";

export default function FranchiseDashboard() {
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.franchise.dashboard.useQuery();

  if (userLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">請先登入</p>
          <a href="/login" className="text-amber-600 hover:underline">
            前往登入
          </a>
        </div>
      </div>
    );
  }

  if (user.role !== "franchisee" && user.role !== "super_admin" && user?.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">403 - 禁止訪問</h1>
          <p className="text-gray-600 mb-4">您沒有權限訪問此頁面</p>
          <a href="/" className="text-amber-600 hover:underline">
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">門市夥伴專區</h1>
                <p className="text-gray-600">歡迎回來，{user.name || user.email}</p>
              </div>
            </div>
            <a
              href="/profile"
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              個人資料
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">總訂單數</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">總營收</h3>
            <p className="text-3xl font-bold text-gray-900">
              NT$ {stats.totalRevenue.toLocaleString()}
            </p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">待處理訂單</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">快速操作</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/franchise/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:shadow-md transition-all"
            >
              <Package className="h-8 w-8 text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900">訂單管理</h3>
              <p className="text-sm text-gray-600">查看和處理訂單</p>
            </a>
            <a
              href="/franchise/inventory"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:shadow-md transition-all"
            >
              <Store className="h-8 w-8 text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900">庫存管理</h3>
              <p className="text-sm text-gray-600">查看庫存狀態</p>
            </a>
            <a
              href="/franchise/reports"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:shadow-md transition-all"
            >
              <TrendingUp className="h-8 w-8 text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900">營運報表</h3>
              <p className="text-sm text-gray-600">查看營運數據</p>
            </a>
            <a
              href="/shop"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:shadow-md transition-all"
            >
              <DollarSign className="h-8 w-8 text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900">訂貨系統</h3>
              <p className="text-sm text-gray-600">前往線上商城訂貨</p>
            </a>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-2">🚀 功能開發中</h3>
          <p className="text-amber-800">
            門市夥伴專區的完整功能（訂單管理、庫存查詢、營運報表等）正在開發中，敬請期待！
          </p>
        </div>
      </div>
    </div>
  );
}

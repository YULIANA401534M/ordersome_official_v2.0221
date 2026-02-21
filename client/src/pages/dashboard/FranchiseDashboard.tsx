import FranchiseeDashboardLayout from "@/components/FranchiseeDashboardLayout";
import { Store, FileText, BarChart3, Package } from "lucide-react";

export default function FranchiseDashboard() {
  return (
    <FranchiseeDashboardLayout>
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">歡迎回到加盟主專區</h1>
            <p className="text-green-100">管理您的門市、查看營運報表、下載 SOP 文件</p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
              href="/dashboard/franchise/stores"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">門市管理</h3>
              </div>
              <p className="text-sm text-gray-600">查看門市資訊、營業時間、聯絡方式</p>
            </a>

            <a
              href="/dashboard/franchise/sop"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">SOP 文件</h3>
              </div>
              <p className="text-sm text-gray-600">下載標準作業流程文件、訓練手冊</p>
            </a>

            <a
              href="/dashboard/franchise/reports"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">營運報表</h3>
              </div>
              <p className="text-sm text-gray-600">查看營收、成本、利潤等營運數據</p>
            </a>

            <a
              href="/dashboard/franchise/inventory"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">庫存管理</h3>
              </div>
              <p className="text-sm text-gray-600">查看庫存狀況、進貨記錄、盤點表單</p>
            </a>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">最新公告</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">新版 SOP 文件已上線</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    請至 SOP 文件區下載最新版本的標準作業流程文件
                  </p>
                  <p className="text-xs text-gray-400 mt-2">2026-01-15</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">12 月營運報表已產生</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    請至營運報表區查看上個月的營運數據分析
                  </p>
                  <p className="text-xs text-gray-400 mt-2">2026-01-01</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FranchiseeDashboardLayout>
  );
}

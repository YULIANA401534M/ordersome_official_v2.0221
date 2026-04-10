import { Link } from "wouter";
import FranchiseeDashboardLayout from "@/components/FranchiseeDashboardLayout";
import { Store, BarChart3, Package, BookOpen, Wrench, ClipboardList, FileText } from "lucide-react";

export default function FranchiseDashboard() {
  return (
    <FranchiseeDashboardLayout>
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">歡迎回到門市夥伴專區</h1>
            <p className="text-green-100">管理您的門市、查看營運報表、下載 SOP 文件</p>
          </div>

          {/* Quick Access Cards - Core Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Link
              to="/dashboard/sop"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">SOP 知識庫</h3>
              </div>
              <p className="text-sm text-gray-600">查閱標準作業流程、訓練手冊與操作指引</p>
            </Link>
            <Link
              to="/dashboard/repairs"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">設備報修</h3>
              </div>
              <p className="text-sm text-gray-600">提交設備維修申請、查看維修進度</p>
            </Link>
            <Link
              to="/dashboard/checklist"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">每日檢查表</h3>
              </div>
              <p className="text-sm text-gray-600">填寫開店/閉店檢查表、查看歷史記錄</p>
            </Link>
          </div>
          {/* Secondary Cards - Franchise Management */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/dashboard/franchise/stores"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-gray-300 block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Store className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">門市管理</h3>
              </div>
              <p className="text-sm text-gray-600">查看門市資訊、營業時間、聯絡方式</p>
            </Link>
            <div
              className="bg-white rounded-xl p-6 shadow-md border-2 border-transparent opacity-50 cursor-not-allowed pointer-events-none"
              title="尚未開放"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-500">營運報表</h3>
              </div>
              <p className="text-sm text-gray-400">查看營收、成本、利潤等營運數據</p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-2 inline-block">即將推出</span>
            </div>
            <div
              className="bg-white rounded-xl p-6 shadow-md border-2 border-transparent opacity-50 cursor-not-allowed pointer-events-none"
              title="尚未開放"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-500">庫存管理</h3>
              </div>
              <p className="text-sm text-gray-400">查看庫存狀況、進貨記錄、盤點表單</p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-2 inline-block">即將推出</span>
            </div>
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

import StaffDashboardLayout from "@/components/StaffDashboardLayout";
import { Wrench, ClipboardList, Calendar, Bell } from "lucide-react";

export default function StaffDashboard() {
  return (
    <StaffDashboardLayout>
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
            <h1 className="text-3xl font-bold mb-2">歡迎回到員工專區</h1>
            <p className="text-purple-100">查看工作表單、提交維修申請、查看排班資訊</p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
              href="/dashboard/repairs"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">設備維修</h3>
              </div>
              <p className="text-sm text-gray-600">提交設備維修申請、查看維修進度</p>
            </a>

            <a
              href="/dashboard/checklist"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">工作表單</h3>
              </div>
              <p className="text-sm text-gray-600">填寫日常工作表單、查看歷史記錄</p>
            </a>

            <a
              href="/dashboard/sop"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">排班系統</h3>
              </div>
              <p className="text-sm text-gray-600">查看本週排班、申請調班、請假</p>
            </a>

            <a
              href="/dashboard/sop"
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Bell className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">公告事項</h3>
              </div>
              <p className="text-sm text-gray-600">查看最新公告、重要通知、活動資訊</p>
            </a>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">最新公告</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">本週排班已公告</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    請至排班系統查看本週的工作班表
                  </p>
                  <p className="text-xs text-gray-400 mt-2">2026-01-19</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">請記得填寫每日工作表單</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    每日下班前請至工作表單區填寫當日工作內容
                  </p>
                  <p className="text-xs text-gray-400 mt-2">2026-01-15</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wrench className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">設備維修進度更新</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    您提交的冰箱維修申請已完成，請確認設備狀況
                  </p>
                  <p className="text-xs text-gray-400 mt-2">2026-01-18</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}

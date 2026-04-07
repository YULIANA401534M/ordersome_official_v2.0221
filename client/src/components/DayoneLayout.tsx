import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  BarChart3,
  MapPin,
  Building2,
  LogOut,
  ChevronLeft,
  Smartphone,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "主控台", path: "/dayone" },
  { icon: ShoppingCart, label: "訂單管理", path: "/dayone/orders" },
  { icon: Users, label: "客戶管理", path: "/dayone/customers" },
  { icon: Package, label: "品項管理", path: "/dayone/products" },
  { icon: LayoutDashboard, label: "庫存管理", path: "/dayone/inventory" },
  { icon: Truck, label: "採購管理", path: "/dayone/purchase" },
  { icon: Truck, label: "司機管理", path: "/dayone/drivers" },
  { icon: MapPin, label: "行政區管理", path: "/dayone/districts" },
  { icon: Building2, label: "供應商管理", path: "/dayone/suppliers" },
  { icon: BarChart3, label: "報表", path: "/dayone/reports" },
  { icon: Smartphone, label: "LIFF訂單", path: "/dayone/liff-orders" },
];

export default function DayoneLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [location, navigate] = useLocation();

  const isSuperAdmin = user?.role === "super_admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const hasAccess = user.role === "super_admin" || user.role === "manager";
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">權限不足</p>
          <p className="text-gray-500 text-sm">需要管理員權限才能進入大永後台</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <span className="font-bold text-gray-900 text-sm">🥚 大永蛋品 ERP</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path || (item.path !== "/dayone" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 space-y-1">
          {/* 返回宇聯後台 - 僅 super_admin 顯示 */}
          {isSuperAdmin && (
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              返回宇聯後台
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
          <div className="px-3 py-1">
            <p className="text-xs text-gray-400 truncate">{user.name}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

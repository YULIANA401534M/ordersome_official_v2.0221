import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useModules } from "@/hooks/useModules";
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
  CreditCard,
  Menu,
  X,
  UserCog,
  ClipboardCheck,
} from "lucide-react";
import { useLocation } from "wouter";

const NAV_ITEM_DEFS = [
  { icon: LayoutDashboard, label: "總覽", path: "/dayone", moduleKey: null },
  { icon: ShoppingCart, label: "訂單管理", path: "/dayone/orders", moduleKey: "delivery" },
  { icon: Users, label: "客戶管理", path: "/dayone/customers", moduleKey: "crm_customers" },
  { icon: Package, label: "商品管理", path: "/dayone/products", moduleKey: "products" },
  { icon: LayoutDashboard, label: "庫存管理", path: "/dayone/inventory", moduleKey: "inventory" },
  { icon: Truck, label: "採購管理", path: "/dayone/purchase", moduleKey: "purchasing" },
  { icon: Truck, label: "司機管理", path: "/dayone/drivers", moduleKey: "driver_mgmt" },
  { icon: MapPin, label: "區域管理", path: "/dayone/districts", moduleKey: "districts" },
  { icon: Building2, label: "供應商", path: "/dayone/suppliers", moduleKey: null },
  { icon: BarChart3, label: "報表分析", path: "/dayone/reports", moduleKey: null },
  { icon: UserCog, label: "用戶管理", path: "/dayone/users", moduleKey: null },
  { icon: Smartphone, label: "LIFF 訂單", path: "/dayone/liff-orders", moduleKey: "liff_orders" },
  { icon: CreditCard, label: "應收帳款", path: "/dayone/ar", moduleKey: "ar_management" },
  { icon: ClipboardCheck, label: "派車管理", path: "/dayone/dispatch", moduleKey: "dispatch" },
  { icon: Package, label: "進貨簽收", path: "/dayone/purchase-receipts", moduleKey: "purchase_receipts" },
] as const;

export default function DayoneLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { has } = useModules();

  const isSuperAdmin = user?.role === "super_admin";

  const navItems = NAV_ITEM_DEFS.filter((item) => {
    if (isSuperAdmin) return true;
    if (!item.moduleKey) return true;
    return has(item.moduleKey);
  });

  if (loading) {
    return (
      <div className="dayone-shell min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
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
      <div className="dayone-shell min-h-screen flex items-center justify-center p-6">
        <div className="dayone-panel rounded-[28px] px-8 py-10 text-center">
          <p className="mb-2 font-semibold text-red-500">沒有權限查看大永後台</p>
          <p className="text-sm text-stone-500">目前僅開放管理員與超級管理員進入。</p>
        </div>
      </div>
    );
  }

  const activeItem = navItems.find((item) => location === item.path || (item.path !== "/dayone" && location.startsWith(item.path)));

  function handleNavClick(path: string) {
    navigate(path);
    setSidebarOpen(false);
  }

  return (
    <div className="dayone-shell min-h-screen flex text-stone-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 shrink-0 border-r border-amber-100/80
          transform flex-col transition-transform duration-200 md:static md:flex
          ${sidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden md:translate-x-0"}
        `}
        style={{ background: "rgba(255,252,245,0.94)", backdropFilter: "blur(14px)" }}
      >
        <div className="flex h-16 items-center justify-between border-b border-amber-100/80 px-5">
          <div>
            <span className="block font-brand text-lg leading-none text-amber-700">大永蛋品 ERP</span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.14em] text-stone-500">Dayone Control</span>
          </div>
          <button
            className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-700 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/dayone" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition-all ${
                  isActive
                    ? "bg-amber-500 font-medium text-white shadow-[0_10px_24px_rgba(180,83,9,0.22)]"
                    : "text-stone-600 hover:bg-white hover:text-stone-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-amber-100/80 p-3">
          {isSuperAdmin && (
            <button
              onClick={() => {
                navigate("/dashboard");
                setSidebarOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-white hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
              返回總控台
            </button>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
          <div className="px-3 py-1">
            <p className="truncate text-xs text-gray-400">{user.name}</p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-amber-100/80 bg-[rgba(255,252,245,0.94)] px-4 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-gray-600 hover:bg-white hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <span className="block font-brand text-lg leading-none text-stone-900">
              {activeItem?.label ?? "大永蛋品 ERP"}
            </span>
            <span className="mt-1 block text-[11px] text-stone-500">手機管理模式</span>
          </div>
        </div>

        <div className="dayone-page px-4 py-5 md:px-6 md:py-7 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

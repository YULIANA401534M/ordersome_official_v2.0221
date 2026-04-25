import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/dayone/login");
    }
  }, [loading, navigate, user]);

  if (loading) {
    return (
      <div className="dayone-shell min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!user) {
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
          fixed inset-y-0 left-0 z-30 w-[272px] shrink-0 border-r border-amber-100/80
          transform flex-col transition-transform duration-200 md:static md:flex
          ${sidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden md:translate-x-0"}
        `}
        style={{
          background: "linear-gradient(180deg, rgba(255,253,248,0.96), rgba(250,245,236,0.94))",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="border-b border-amber-100/80 px-5 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">Dayone Control</span>
              <span className="mt-2 block font-ui text-[1.4rem] font-extrabold leading-none tracking-[-0.05em] text-stone-950">大永蛋品 ERP</span>
              <span className="mt-2 block text-xs leading-5 text-stone-500">配送、進貨、帳務與營運資訊整合在同一個管理介面。</span>
            </div>
            <button
              className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-700 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-3 py-3 shadow-[0_10px_22px_rgba(120,53,15,0.06)]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">{user.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-stone-400">{isSuperAdmin ? "Super Admin" : "Manager"}</p>
            </div>
            <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Online</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/dayone" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full rounded-[22px] px-4 py-3.5 text-left text-sm transition-all ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#f59e0b,#d97706)] font-semibold text-white shadow-[0_14px_26px_rgba(180,83,9,0.24)]"
                    : "text-stone-600 hover:bg-white/85 hover:text-stone-900 hover:shadow-[0_10px_18px_rgba(120,53,15,0.05)]"
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
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-white hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
              返回總控台
            </button>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
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
            <span className="block font-ui text-lg font-extrabold leading-none tracking-[-0.04em] text-stone-900">
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

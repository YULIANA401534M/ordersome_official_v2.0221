import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  UtensilsCrossed,
  LogOut,
  Menu,
  Shield,
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  FileText,
  Sparkles,
  Users,
  BookLock,
  Store,
  Package2,
  Truck,
  Car,
  Egg,
  Warehouse,
  ShoppingBag,
  Map,
  Smartphone,
  CreditCard,
  Building,
  Puzzle,
  BookOpen,
  Home,
  Wrench,
  ClipboardCheck,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── 側邊欄滾動記憶 ──
  useEffect(() => {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;
    const saved = sessionStorage.getItem("sidebar-scroll");
    if (saved) nav.scrollTop = parseInt(saved);
    const handler = () => sessionStorage.setItem("sidebar-scroll", String(nav.scrollTop));
    nav.addEventListener("scroll", handler);
    return () => nav.removeEventListener("scroll", handler);
  }, [location]);

  // ── 所有 hooks 必須在任何 early return 之前 ──
  const isSuperAdmin = user?.role === "super_admin";
  const isManager = user?.role === "manager";
  const hasAdminAccess = user?.role === "super_admin" || user?.role === "manager";

  // ── 來點什麼模組開關查詢（tenantId=1）──
  const { data: orderSomeModules } = trpc.dayone.modules.list.useQuery(
    { tenantId: 1 },
    { enabled: !loading && hasAdminAccess }
  );

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              請登入以繼續
            </h1>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              訪問此後台需要身份驗證。請點擊下方按鈕登入。
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            登入
          </Button>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <Shield className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            權限不足
          </h1>
          <p className="text-sm text-gray-500 text-center">
            您沒有權限訪問此頁面。請聯絡管理員。
          </p>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            返回首頁
          </Button>
        </div>
      </div>
    );
  }

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (!user.permissions) return false;
    const permissions =
      typeof user.permissions === "string"
        ? JSON.parse(user.permissions)
        : user.permissions;
    return Array.isArray(permissions) && permissions.includes(permission);
  };
  const hasOSModule = (key: string) =>
    isSuperAdmin || (orderSomeModules?.some((m: any) => m.moduleKey === key && m.isEnabled) ?? false);

  // ── 宇聯總部分組 ──
  const ecommerceItems = hasPermission("manage_products")
    ? [
        { icon: LayoutDashboard, label: "商城總覽", path: "/dashboard/admin/ecommerce" },
        { icon: Package, label: "商品管理", path: "/dashboard/admin/products" },
        { icon: Tag, label: "分類管理", path: "/dashboard/admin/categories" },
        { icon: ShoppingCart, label: "訂單管理", path: "/dashboard/admin/orders" },
      ]
    : [];

  const contentItems = hasPermission("publish_content")
    ? [
        { icon: FileText, label: "內容管理", path: "/dashboard/content" },
        { icon: Sparkles, label: "AI 文章助手", path: "/dashboard/ai-writer" },
      ]
    : [];

  const userItems = hasPermission("manage_users")
    ? [
        { icon: Users, label: "用戶管理", path: "/dashboard/admin/users" },
        { icon: Shield, label: "權限管理", path: "/dashboard/admin/permissions" },
        { icon: BookLock, label: "SOP 存取權限", path: "/dashboard/admin/sop-permissions" },
      ]
    : [];

  const franchiseItems = hasPermission("manage_franchise")
    ? [{ icon: Store, label: "加盟詢問", path: "/dashboard/franchise-inquiries" }]
    : [];

  // ── 來點什麼分組（門市管理）──
  const storeOperationItems =
    isSuperAdmin || isManager
      ? [
          { icon: BookOpen, label: "SOP 知識庫", path: "/dashboard/sop" },
          { icon: Wrench, label: "設備報修", path: "/dashboard/repairs" },
          { icon: ClipboardCheck, label: "每日檢查表", path: "/dashboard/checklist" },
        ]
      : [];

  // ── 來點什麼 ERP 模組開關項目 ──
  // 每個模組：有開 → 可點連結，沒開 → 灰色「即將推出」
  type OsErpItem = { icon: React.ComponentType<{ className?: string }>; label: string; path?: string };
  const osErpEnabled: OsErpItem[] = [];
  const osErpComingSoon: { icon: React.ComponentType<{ className?: string }>; label: string }[] = [];

  if (isSuperAdmin || isManager) {
    const osModuleDefs: { key: string; icon: React.ComponentType<{ className?: string }>; label: string; path: string }[] = [
      { key: "inventory",       icon: Warehouse,      label: "庫存管理", path: "/dashboard/inventory" },
      { key: "scheduling",      icon: CalendarDays,   label: "排班管理", path: "/dashboard/scheduling" },
      { key: "equipment_repair",icon: Wrench,         label: "設備報修", path: "/dashboard/repairs" },
      { key: "daily_report",    icon: ClipboardList,  label: "門市日報", path: "/dashboard/daily-report" },
    ];
    for (const def of osModuleDefs) {
      if (hasOSModule(def.key)) {
        osErpEnabled.push({ icon: def.icon, label: def.label, path: def.path });
      } else {
        osErpComingSoon.push({ icon: def.icon, label: def.label });
      }
    }
  }

  // ── 大永蛋品 ERP ──
  const erpItems =
    isSuperAdmin || isManager
      ? [
          { icon: Package2, label: "ERP 總覽", path: "/dayone" },
          { icon: Truck, label: "配送訂單", path: "/dayone/orders" },
          { icon: Users, label: "客戶管理", path: "/dayone/customers" },
          { icon: Car, label: "司機管理", path: "/dayone/drivers" },
          { icon: Egg, label: "品項管理", path: "/dayone/products" },
          { icon: Warehouse, label: "庫存管理", path: "/dayone/inventory" },
          { icon: ShoppingBag, label: "進貨管理", path: "/dayone/purchase" },
          { icon: Map, label: "行政區管理", path: "/dayone/districts" },
          { icon: Smartphone, label: "LIFF 訂單", path: "/dayone/liff-orders" },
          { icon: CreditCard, label: "應收帳款", path: "/dayone/ar" },
        ]
      : [];

  // ── 系統管理（super_admin 限定）──
  const systemItems = isSuperAdmin
    ? [
        { icon: Building, label: "租戶管理", path: "/super-admin/tenants" },
        { icon: Puzzle, label: "模組管理", path: "/super-admin/modules" },
      ]
    : [];

  const bottomItems = [{ icon: Home, label: "返回首頁", path: "/" }];

  const allItems = [
    ...ecommerceItems,
    ...contentItems,
    ...userItems,
    ...franchiseItems,
    ...storeOperationItems,
    ...osErpEnabled,
    ...erpItems,
    ...systemItems,
    ...bottomItems,
  ];

  const activeMenuItem = allItems.find((item) => {
    if (item.path === "/") return location === "/";
    return location === item.path || location.startsWith(item.path + "/");
  });

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location === path || location.startsWith(path + "/");
  };

  const menuItemClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer ${
      isActive(path)
        ? "bg-amber-50 text-amber-700 font-medium border-r-2 border-amber-500"
        : "text-gray-700 hover:bg-amber-50 hover:text-amber-700"
    }`;

  const groupLabelClass =
    "text-xs font-semibold text-amber-600 uppercase tracking-wider px-4 py-2";

  const renderGroup = (
    label: string,
    items: { icon: React.ComponentType<{ className?: string }>; label: string; path: string }[]
  ) => {
    if (items.length === 0) return null;
    return (
      <div>
        <p className={groupLabelClass}>{label}</p>
        {items.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={menuItemClass(item.path)}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    );
  };

  const renderComingSoonItems = (
    items: { icon: React.ComponentType<{ className?: string }>; label: string }[]
  ) => {
    return items.map((item) => (
      <div
        key={item.label}
        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
        title="即將推出"
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 rounded px-1">即將推出</span>
      </div>
    ));
  };

  const showOsErpSection = (isSuperAdmin || isManager) && (osErpEnabled.length > 0 || osErpComingSoon.length > 0);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="h-4 w-4 text-white" />
        </div>
        <div className="ml-3 min-w-0">
          <p className="font-bold text-sm leading-tight truncate">來點什麼</p>
          <p className="text-[10px] text-gray-400 leading-tight truncate">
            OrderSome 管理後台
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav id="sidebar-nav" className="flex-1 overflow-y-auto py-2 space-y-1">
        {/* 宇聯總部 */}
        {(ecommerceItems.length > 0 || contentItems.length > 0 || userItems.length > 0 || franchiseItems.length > 0) && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">宇聯總部</p>
          </div>
        )}
        {renderGroup("商城管理", ecommerceItems)}
        {renderGroup("內容管理", contentItems)}
        {renderGroup("人員管理", userItems)}
        {renderGroup("加盟管理", franchiseItems)}

        {/* 來點什麼 */}
        {(storeOperationItems.length > 0 || showOsErpSection) && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">來點什麼</p>
          </div>
        )}
        {renderGroup("門市管理", storeOperationItems)}
        {showOsErpSection && (
          <div>
            <p className={groupLabelClass}>來點什麼 ERP</p>
            {osErpEnabled.map((item) => (
              <Link key={item.path} href={item.path!}>
                <a
                  className={menuItemClass(item.path!)}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            {renderComingSoonItems(osErpComingSoon)}
          </div>
        )}

        {/* 大永蛋品 */}
        {erpItems.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">大永蛋品</p>
          </div>
        )}
        {renderGroup("大永蛋品 ERP", erpItems)}

        {/* 系統 */}
        {renderGroup("系統管理", systemItems)}
        {renderGroup("其他", bottomItems)}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 p-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-amber-700">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-none">
              {user.name || "-"}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {user.email || "-"}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
            title="登出"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-white border-r border-gray-200 w-64 shrink-0
          lg:relative lg:translate-x-0
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="開啟選單"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {activeMenuItem?.label ?? "管理後台"}
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

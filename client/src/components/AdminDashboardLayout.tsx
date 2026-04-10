import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  UtensilsCrossed,
  LogOut,
  PanelLeft,
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
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

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
            <p className="text-sm text-muted-foreground text-center max-w-sm">
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

  const hasAdminAccess = user.role === "super_admin" || user.role === "manager";
  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <Shield className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            權限不足
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            您沒有權限訪問此頁面。請聯絡管理員。
          </p>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            返回首頁
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <AdminDashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminDashboardLayoutContent>
    </SidebarProvider>
  );
}

type AdminDashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AdminDashboardLayoutContent({
  children,
  setSidebarWidth,
}: AdminDashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === "super_admin") return true;
    if (!user.permissions) return false;
    const permissions =
      typeof user.permissions === "string"
        ? JSON.parse(user.permissions)
        : user.permissions;
    return Array.isArray(permissions) && permissions.includes(permission);
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isManager = user?.role === "manager";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // ── 選單資料 ──────────────────────────────────────────
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

  const systemItems = isSuperAdmin
    ? [
        { icon: Building, label: "租戶管理", path: "/super-admin/tenants" },
        { icon: Puzzle, label: "模組管理", path: "/super-admin/modules" },
      ]
    : [];

  const bottomItems = [
    { icon: BookOpen, label: "SOP 知識庫", path: "/dashboard/sop" },
    { icon: Home, label: "返回首頁", path: "/" },
  ];

  // label for mobile topbar
  const allItems = [
    ...ecommerceItems,
    ...contentItems,
    ...userItems,
    ...franchiseItems,
    ...erpItems,
    ...systemItems,
    ...bottomItems,
  ];
  const activeMenuItem = allItems.find((item) => item.path === location);

  const groupLabelClass =
    "text-xs font-semibold tracking-wider uppercase text-amber-600 px-2 pb-1";

  const renderItems = (
    items: { icon: React.ComponentType<{ className?: string }>; label: string; path: string }[]
  ) =>
    items.map((item) => {
      const isActive =
        item.path === "/"
          ? location === "/"
          : location === item.path || location.startsWith(item.path + "/");
      return (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => setLocation(item.path)}
            tooltip={item.label}
            className={`h-9 transition-all rounded-lg ${
              isActive
                ? "bg-amber-50 font-medium"
                : "font-normal hover:bg-amber-50"
            }`}
          >
            <item.icon
              className={`h-4 w-4 ${isActive ? "text-amber-500" : "text-muted-foreground"}`}
            />
            <span className={isActive ? "text-amber-700" : ""}>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          {/* ── Header ── */}
          <SidebarHeader className="h-16 justify-center border-b border-border/40">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-amber-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight tracking-tight truncate">
                      來點什麼
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">
                      OrderSome 管理後台
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ── Content ── */}
          <SidebarContent className="gap-0 overflow-y-auto py-2">
            {/* 商城管理 */}
            {ecommerceItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={groupLabelClass}>
                  商城管理
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">{renderItems(ecommerceItems)}</SidebarMenu>
              </SidebarGroup>
            )}

            {/* 內容管理 */}
            {contentItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={groupLabelClass}>
                  內容管理
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">{renderItems(contentItems)}</SidebarMenu>
              </SidebarGroup>
            )}

            {/* 人員管理 */}
            {userItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={groupLabelClass}>
                  人員管理
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">{renderItems(userItems)}</SidebarMenu>
              </SidebarGroup>
            )}

            {/* 加盟管理 */}
            {franchiseItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={groupLabelClass}>
                  加盟管理
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">{renderItems(franchiseItems)}</SidebarMenu>
              </SidebarGroup>
            )}

            {/* 大永蛋品 ERP */}
            {erpItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={groupLabelClass}>
                  大永蛋品 ERP
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">{renderItems(erpItems)}</SidebarMenu>
              </SidebarGroup>
            )}

            {/* 系統管理 */}
            {systemItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={groupLabelClass}>
                  系統管理
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">{renderItems(systemItems)}</SidebarMenu>
              </SidebarGroup>
            )}

            {/* 底部固定項目 */}
            <SidebarGroup>
              <SidebarGroupLabel className={groupLabelClass}>
                其他
              </SidebarGroupLabel>
              <SidebarMenu className="px-2">{renderItems(bottomItems)}</SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          {/* ── Footer ── */}
          <SidebarFooter className="p-3 border-t border-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-amber-50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-amber-100 text-amber-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-200 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground text-sm">
                {activeMenuItem?.label ?? "管理後台"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}

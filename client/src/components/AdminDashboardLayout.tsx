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
  Receipt,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  GripVertical,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── 子群組標題（不可點擊）──
function SubGroupLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-0.5">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--os-amber-text)', opacity: 0.7 }}>{label}</p>
    </div>
  );
}

// 判斷某個 key 屬於哪個子群組
const OS_SUBGROUPS: { label: string; keys: string[] }[] = [
  {
    label: "採購與庫存",
    keys: [
      "/dashboard/purchasing",
      "/dashboard/inventory",
      "/dashboard/products",
      "/dashboard/ca-menu",
      "/dashboard/delivery",
    ],
  },
  {
    label: "帳務與財務",
    keys: [
      "/dashboard/accounting",
      "/dashboard/franchisee-payments",
      "/dashboard/rebate",
      "/dashboard/profit-loss",
    ],
  },
  {
    label: "門市作業",
    keys: [
      "/dashboard/daily-report",
      "/dashboard/scheduling",
      "/dashboard/sop",
      "/dashboard/repairs",
      "/dashboard/checklist",
    ],
  },
];

function getSubGroupLabel(key: string): string | null {
  for (const sg of OS_SUBGROUPS) {
    if (sg.keys.includes(key)) return sg.label;
  }
  return null;
}

function SortableErpItem({
  id,
  item,
  menuItemClass,
  inventoryAlertCount,
  needsReviewCount,
  accountingBadge,
  setMobileOpen,
}: {
  id: string;
  item: { icon: React.ComponentType<{ className?: string }>; label: string; path?: string };
  menuItemClass: (path: string) => string;
  inventoryAlertCount: number;
  needsReviewCount: number;
  accountingBadge: number;
  setMobileOpen: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const badge =
    item.path === "/dashboard/inventory" && inventoryAlertCount > 0 ? inventoryAlertCount :
    item.path === "/dashboard/purchasing" && needsReviewCount > 0 ? needsReviewCount :
    item.path === "/dashboard/accounting" && accountingBadge > 0 ? accountingBadge :
    0;
  const badgeBg = item.path === "/dashboard/purchasing"
    ? 'var(--os-warning)'
    : 'var(--os-danger)';

  return (
    <div ref={setNodeRef} style={style} className="flex items-center mx-2 rounded-lg cursor-default select-none">
      <span
        {...attributes}
        {...listeners}
        className="os-drag-handle px-1 py-2 cursor-grab active:cursor-grabbing transition-colors"
        style={{ color: 'var(--os-sidebar-muted)' }}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-3 flex-1 px-2 py-2 text-sm" style={{ color: 'var(--os-sidebar-muted)' }}>
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {badge > 0 && (
          <span
            className="min-w-[20px] h-5 px-1.5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ background: badgeBg }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "商城管理": true,
    "內容管理": true,
    "人員管理": true,
    "加盟管理": true,
    "Super Admin": true,
    "來點什麼": true,
    "大永蛋品 ERP": true,
    "其他": true,
  });
  const toggleGroup = (label: string) =>
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  const [isDragMode, setIsDragMode] = useState(false);
  const [erpOrder, setErpOrder] = useState<string[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);

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
  const isStoreManager = user?.role === "store_manager";
  const isFranchisee = user?.role === "franchisee";
  const isStaff = user?.role === "staff";
  const hasAdminAccess = isSuperAdmin || isManager || isStoreManager || isFranchisee || isStaff;
  const isOSTenant = isSuperAdmin || (user as any)?.tenantId === 1;
  const isDYTenant = isSuperAdmin || (user as any)?.tenantId === 90004;
  const canSeeCostModules = isSuperAdmin || user?.has_procurement_access === true;

  const { data: orderSomeModules } = trpc.dayone.modules.list.useQuery(
    { tenantId: 1 },
    {
      enabled: !!user && isOSTenant,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );
  const { data: dayoneModules } = trpc.dayone.modules.list.useQuery(
    { tenantId: 90004 },
    {
      enabled: !!user && isDYTenant,
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );

  const { data: overdueAR = [] } = trpc.dayone.ar.listReceivables.useQuery(
    { tenantId: 90004, page: 1, status: "overdue" },
    { enabled: !!user && isDYTenant, refetchInterval: 60000 }
  );
  const { data: todayDispatch = [] } = trpc.dayone.dispatch.listDispatch.useQuery(
    { tenantId: 90004 },
    { enabled: !!user && isDYTenant, refetchInterval: 60000 }
  );
  const { data: pendingReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery(
    { tenantId: 90004, status: "pending" },
    { enabled: !!user && isDYTenant, refetchInterval: 60000 }
  );
  const overdueARCount = (overdueAR as any[]).length;
  const activeDispatchCount = (todayDispatch as any[]).filter((d: any) => d.status === "in_progress").length;
  const pendingReceiptCount = (pendingReceipts as any[]).length;

  const { data: inventoryAlertCount = 0 } = trpc.inventory.alertCount.useQuery(
    undefined,
    { enabled: !!user && isOSTenant, refetchInterval: 60000 }
  );

  const { data: needsReviewItems = [] } = trpc.procurement.listNeedsReview.useQuery(
    undefined,
    { enabled: !!user && isOSTenant, refetchInterval: 120000 }
  );
  const needsReviewCount = (needsReviewItems as any[]).length;

  const nowMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; })();
  const { data: pendingPayables = [] } = trpc.accounting.listPayables.useQuery(
    { month: nowMonth, status: "pending" },
    { enabled: !!user && isOSTenant, refetchInterval: 120000 }
  );
  const { data: partialPayables = [] } = trpc.accounting.listPayables.useQuery(
    { month: nowMonth, status: "partial" },
    { enabled: !!user && isOSTenant, refetchInterval: 120000 }
  );
  const accountingBadge = (pendingPayables as any[]).length + (partialPayables as any[]).length;

  const { data: sidebarOrderData } = trpc.admin.getSidebarOrder.useQuery(
    undefined,
    { enabled: !!user && isSuperAdmin }
  );
  const saveSidebarOrder = trpc.admin.saveSidebarOrder.useMutation();

  type OsErpItem = { icon: React.ComponentType<{ className?: string }>; label: string; path?: string };
  type DyErpItem = { icon: React.ComponentType<{ className?: string }>; label: string; path: string };
  const [osErpEnabled, setOsErpEnabled] = useState<OsErpItem[]>([]);
  const [osErpComingSoon, setOsErpComingSoon] = useState<{ icon: React.ComponentType<{ className?: string }>; label: string }[]>([]);
  const [dyErpEnabled, setDyErpEnabled] = useState<DyErpItem[]>([]);
  const [dyErpComingSoon, setDyErpComingSoon] = useState<{ icon: React.ComponentType<{ className?: string }>; label: string }[]>([]);

  useEffect(() => {
    if (!orderSomeModules) return;
    const enabled: OsErpItem[] = [];
    const comingSoon: { icon: React.ComponentType<{ className?: string }>; label: string }[] = [];
    if (isOSTenant && (isSuperAdmin || isManager)) {
      const osModuleDefs: { key: string; icon: React.ComponentType<{ className?: string }>; label: string; path: string; costOnly: boolean; managerAllowed: boolean }[] = [
        { key: "purchasing_os",       icon: ShoppingCart,    label: "叫貨管理",    path: "/dashboard/purchasing",          costOnly: false, managerAllowed: true  },
        { key: "inventory",           icon: Warehouse,       label: "庫存管理",    path: "/dashboard/inventory",           costOnly: false, managerAllowed: false },
        { key: "products_os",         icon: Package,         label: "品項成本",    path: "/dashboard/products",            costOnly: true,  managerAllowed: false },
        { key: "products_os",         icon: UtensilsCrossed, label: "菜單成本管理", path: "/dashboard/ca-menu",            costOnly: true,  managerAllowed: false },
        { key: "delivery",            icon: Truck,           label: "配送管理",    path: "/dashboard/delivery",            costOnly: false, managerAllowed: true  },
        { key: "accounting",          icon: Receipt,         label: "帳務管理",    path: "/dashboard/accounting",          costOnly: false, managerAllowed: false },
        { key: "franchisee_payments", icon: CreditCard,      label: "加盟主帳款",  path: "/dashboard/franchisee-payments", costOnly: false, managerAllowed: false },
        { key: "rebate_os",           icon: CreditCard,      label: "退佣帳款",    path: "/dashboard/rebate",              costOnly: true,  managerAllowed: false },
        { key: "profit_loss",         icon: TrendingUp,      label: "損益儀表板",  path: "/dashboard/profit-loss",         costOnly: true,  managerAllowed: false },
        { key: "daily_report_os",     icon: ClipboardList,   label: "門市日報",    path: "/dashboard/daily-report",        costOnly: false, managerAllowed: true  },
        { key: "scheduling",          icon: CalendarDays,    label: "排班管理",    path: "/dashboard/scheduling",          costOnly: false, managerAllowed: false },
        { key: "sop",                 icon: BookOpen,        label: "SOP知識庫",   path: "/dashboard/sop",                 costOnly: false, managerAllowed: true  },
        { key: "equipment_repair",    icon: Wrench,          label: "設備報修",    path: "/dashboard/repairs",             costOnly: false, managerAllowed: true  },
        { key: "checklist",           icon: ClipboardCheck,  label: "每日檢查表",  path: "/dashboard/checklist",           costOnly: false, managerAllowed: true  },
      ];
      for (const def of osModuleDefs) {
        if (def.costOnly && !canSeeCostModules) continue;
        if (!isSuperAdmin && isManager && !def.managerAllowed) continue;
        const isEnabled = isSuperAdmin || (orderSomeModules?.some((m: any) => m.moduleKey === def.key && !!m.isEnabled) ?? false);
        if (isEnabled) {
          enabled.push({ icon: def.icon, label: def.label, path: def.path });
        } else {
          comingSoon.push({ icon: def.icon, label: def.label });
        }
      }
    }
    setOsErpEnabled(enabled);
    setOsErpComingSoon(comingSoon);
  }, [orderSomeModules, isOSTenant, isSuperAdmin, isManager, canSeeCostModules]);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!dayoneModules) return;
    const enabled: DyErpItem[] = [];
    const comingSoon: { icon: React.ComponentType<{ className?: string }>; label: string }[] = [];
    if (isDYTenant && (isSuperAdmin || isManager)) {
      const dyModuleDefs = [
        { key: "erp_dashboard", icon: Package2,    label: "ERP 總覽",   path: "/dayone" },
        { key: "delivery",      icon: Truck,       label: "配送訂單",   path: "/dayone/orders" },
        { key: "crm_customers", icon: Users,       label: "客戶管理",   path: "/dayone/customers" },
        { key: "driver_mgmt",   icon: Car,         label: "司機管理",   path: "/dayone/drivers" },
        { key: "products",      icon: Egg,         label: "品項管理",   path: "/dayone/products" },
        { key: "inventory",     icon: Warehouse,   label: "庫存管理",   path: "/dayone/inventory" },
        { key: "purchasing",    icon: ShoppingBag, label: "進貨管理",   path: "/dayone/purchase" },
        { key: "districts",     icon: Map,         label: "行政區管理", path: "/dayone/districts" },
        { key: "liff_orders",        icon: Smartphone,  label: "LIFF 訂單",  path: "/dayone/liff-orders" },
        { key: "accounting",         icon: CreditCard,  label: "帳務管理",   path: "/dayone/ar" },
        { key: "dispatch",           icon: Truck,       label: "派車管理",   path: "/dayone/dispatch" },
        { key: "purchase_receipts",  icon: Receipt,     label: "進貨簽收",   path: "/dayone/purchase-receipts" },
      ];
      for (const def of dyModuleDefs) {
        const isEnabled = isSuperAdmin || (dayoneModules?.some((m: any) => m.moduleKey === def.key && !!m.isEnabled) ?? false);
        if (isEnabled) {
          enabled.push({ icon: def.icon, label: def.label, path: def.path });
        } else {
          comingSoon.push({ icon: def.icon, label: def.label });
        }
      }
    }
    setDyErpEnabled(enabled);
    setDyErpComingSoon(comingSoon);
  }, [dayoneModules, isDYTenant, isSuperAdmin, isManager]);

  // 初始化 erpOrder（從 DB 排序或預設順序）
  useEffect(() => {
    if (osErpEnabled.length === 0) return;
    const keys = osErpEnabled.map(item => item.path ?? item.label);
    if (sidebarOrderData && sidebarOrderData.length > 0) {
      const ordered = [...sidebarOrderData].sort((a, b) => a.sortOrder - b.sortOrder).map(o => o.menuKey);
      const merged = [...ordered.filter(k => keys.includes(k)), ...keys.filter(k => !ordered.includes(k))];
      setErpOrder(merged);
    } else {
      setErpOrder(keys);
    }
  }, [osErpEnabled, sidebarOrderData]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--os-bg)' }}>
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center" style={{ color: 'var(--os-text-1)' }}>
              請登入以繼續
            </h1>
            <p className="text-sm text-center max-w-sm" style={{ color: 'var(--os-text-2)' }}>
              訪問此後台需要身份驗證。請點擊下方按鈕登入。
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full text-white transition-colors"
            style={{ background: 'var(--os-amber)' }}
          >
            登入
          </Button>
        </div>
      </div>
    );
  }

  // ── 大永 manager 訪問非 /dayone 路由時攔截 ──
  if (isManager && (user as any)?.tenantId === 90004 && !location.startsWith("/dayone")) {
    window.location.replace("/dayone");
    return null;
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--os-bg)' }}>
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <Shield className="w-16 h-16" style={{ color: 'var(--os-danger)' }} />
          <h1 className="text-2xl font-semibold tracking-tight text-center" style={{ color: 'var(--os-text-1)' }}>
            權限不足
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--os-text-2)' }}>
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
    if (isManager && isOSTenant) return true;
    if (!user.permissions) return false;
    const permissions =
      typeof user.permissions === "string"
        ? JSON.parse(user.permissions)
        : user.permissions;
    return Array.isArray(permissions) && permissions.includes(permission);
  };
  const hasOSModule = (key: string) => {
    if (isSuperAdmin) return true;
    if ((user as any)?.tenantId !== 1) return false;
    return orderSomeModules?.some((m: any) => m.moduleKey === key && !!m.isEnabled) ?? false;
  };

  const hasDYModule = (key: string) => {
    if (isSuperAdmin) return true;
    if ((user as any)?.tenantId !== 90004) return false;
    return dayoneModules?.some((m: any) => m.moduleKey === key && !!m.isEnabled) ?? false;
  };

  // ── 宇聯集團分組 ──
  const ecommerceItems = isOSTenant && hasPermission("manage_products")
    ? [
        { icon: LayoutDashboard, label: "商城總覽", path: "/dashboard/admin/ecommerce" },
        { icon: Package, label: "商品管理", path: "/dashboard/admin/products" },
        { icon: Tag, label: "分類管理", path: "/dashboard/admin/categories" },
        { icon: ShoppingCart, label: "訂單管理", path: "/dashboard/admin/orders" },
      ]
    : [];

  const contentItems = isOSTenant && hasPermission("publish_content")
    ? [
        { icon: FileText, label: "內容管理", path: "/dashboard/content" },
        { icon: Sparkles, label: "AI 文章助手", path: "/dashboard/ai-writer" },
      ]
    : [];

  const userItems = isOSTenant && hasPermission("manage_users")
    ? [
        { icon: Users, label: "用戶管理", path: "/dashboard/admin/users" },
        { icon: Shield, label: "權限管理", path: "/dashboard/admin/permissions" },
        { icon: BookLock, label: "SOP 存取權限", path: "/dashboard/admin/sop-permissions" },
      ]
    : [];

  const franchiseItems = isOSTenant && hasPermission("manage_franchise")
    ? [
        { icon: Store, label: "加盟詢問", path: "/dashboard/franchise-inquiries" },
        { icon: Users, label: "加盟主管理", path: "/dashboard/franchisees" },
        ...(isSuperAdmin || isManager
          ? [{ icon: CreditCard, label: "加盟主帳款", path: "/dashboard/franchisee-payments" }]
          : []),
      ]
    : [];

  const systemItems = isSuperAdmin
    ? [
        { icon: Building, label: "租戶管理", path: "/super-admin/tenants" },
        { icon: Puzzle, label: "模組管理", path: "/super-admin/modules" },
      ]
    : [];

  const showDyErpSection = (isSuperAdmin || isManager) && (dyErpEnabled.length > 0 || dyErpComingSoon.length > 0);
  const showOsSection = isOSTenant && (isSuperAdmin || isManager) && (osErpEnabled.length > 0 || osErpComingSoon.length > 0);

  const bottomItems = [{ icon: Home, label: "返回首頁", path: "/" }];

  const allItems = [
    ...ecommerceItems,
    ...contentItems,
    ...userItems,
    ...franchiseItems,
    ...osErpEnabled,
    ...dyErpEnabled,
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
    isActive(path)
      ? "os-nav-item flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer rounded-lg mx-2 font-medium sidebar-item-active"
      : "os-nav-item flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer rounded-lg mx-2";

  const menuItemStyle = (path: string): React.CSSProperties =>
    isActive(path)
      ? { background: 'var(--os-sidebar-active)', color: 'var(--os-sidebar-text)', fontWeight: 500 }
      : { color: 'var(--os-sidebar-text)' };

  const groupLabelClass =
    "os-group-label text-[13px] font-medium px-4 py-2 flex items-center justify-between cursor-pointer select-none transition-colors";

  const groupLabelStyle: React.CSSProperties = { color: 'var(--os-sidebar-text)' };

  const renderGroup = (
    label: string,
    items: { icon: React.ComponentType<{ className?: string }>; label: string; path: string }[]
  ) => {
    if (items.length === 0) return null;
    const isCollapsed = !!collapsedGroups[label];
    return (
      <div>
        <div className={groupLabelClass} style={groupLabelStyle} onClick={() => toggleGroup(label)}>
          <span>{label}</span>
          {isCollapsed
            ? <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            : <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          }
        </div>
        {!isCollapsed && items.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={menuItemClass(item.path)}
              style={menuItemStyle(item.path)}
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
        className="flex items-center gap-3 px-4 py-2 text-sm cursor-not-allowed rounded-lg mx-2 opacity-40"
        style={{ color: 'var(--os-sidebar-muted)' }}
        title="即將推出"
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        <span
          className="ml-auto text-[10px] rounded px-1.5 py-0.5"
          style={{ background: 'var(--os-surface-2)', color: 'var(--os-text-3)' }}
        >即將推出</span>
      </div>
    ));
  };

  // ── 渲染「來點什麼」群組內的項目（含子群組標題）──
  // orderedKeys: 實際顯示順序（可能是 erpOrder 或 osErpEnabled 預設順序）
  const renderOsItemsWithSubGroups = (orderedKeys: string[]) => {
    const nodes: React.ReactNode[] = [];
    let lastSubGroup: string | null = null;
    for (const key of orderedKeys) {
      const item = osErpEnabled.find(i => (i.path ?? i.label) === key);
      if (!item || !item.path) continue;
      const sg = getSubGroupLabel(item.path);
      if (sg !== lastSubGroup) {
        if (sg) nodes.push(<SubGroupLabel key={`sg-${sg}`} label={sg} />);
        lastSubGroup = sg;
      }
      const badge =
        item.path === "/dashboard/inventory" && (inventoryAlertCount as number) > 0 ? (inventoryAlertCount as number) :
        item.path === "/dashboard/purchasing" && needsReviewCount > 0 ? needsReviewCount :
        item.path === "/dashboard/accounting" && accountingBadge > 0 ? accountingBadge :
        0;
      const badgeBg = item.path === "/dashboard/purchasing"
        ? 'var(--os-warning)'
        : 'var(--os-danger)';
      nodes.push(
        <Link key={item.path} href={item.path}>
          <a className={menuItemClass(item.path)} style={menuItemStyle(item.path)} onClick={() => setMobileOpen(false)}>
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span
                className="ml-auto min-w-[20px] h-5 px-1.5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                style={{ background: badgeBg }}
              >
                {badge}
              </span>
            )}
          </a>
        </Link>
      );
    }
    return nodes;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 shrink-0" style={{ borderBottom: '1px solid var(--os-sidebar-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--os-amber)' }}>
          <UtensilsCrossed className="h-4 w-4 text-white" />
        </div>
        <div className="ml-3 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ fontFamily: 'var(--font-brand)', color: 'var(--os-sidebar-text)' }}>來點什麼</p>
          <p className="text-[10px] leading-tight truncate" style={{ color: 'var(--os-sidebar-muted)' }}>
            管理後台
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav id="sidebar-nav" className="flex-1 overflow-y-auto py-2 space-y-1">

        {/* ── 群組一：宇聯集團 ── */}
        {(ecommerceItems.length > 0 || contentItems.length > 0 || userItems.length > 0 || franchiseItems.length > 0 || systemItems.length > 0) && (
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--os-sidebar-text)' }}>宇聯集團</p>
          </div>
        )}
        {renderGroup("商城管理", ecommerceItems)}
        {renderGroup("內容管理", contentItems)}
        {renderGroup("人員管理", userItems)}
        {renderGroup("加盟管理", franchiseItems)}
        {isSuperAdmin && systemItems.length > 0 && renderGroup("Super Admin", systemItems)}

        {/* ── 群組二：來點什麼 ── */}
        {showOsSection && (
          <>
            <div className="px-4 pt-4 pb-1">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--os-sidebar-text)' }}>來點什麼 ERP</p>
            </div>
            <div>
              <div className={groupLabelClass} style={groupLabelStyle} onClick={() => !isDragMode && toggleGroup("來點什麼")}>
                <span>來點什麼 ERP</span>
                <div className="flex items-center gap-2">
                  {isSuperAdmin && !isDragMode && (
                    <button
                      className="text-[11px] px-2 py-0.5 rounded transition-colors"
                      style={{ background: 'var(--os-amber-soft)', color: 'var(--os-amber-text)' }}
                      onClick={e => {
                        e.stopPropagation();
                        setIsDragMode(true);
                        setCollapsedGroups(prev => ({ ...prev, "來點什麼": false }));
                      }}
                    >
                      排列
                    </button>
                  )}
                  {!isDragMode && (!!collapsedGroups["來點什麼"]
                    ? <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                    : <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                  )}
                </div>
              </div>
              {!collapsedGroups["來點什麼"] && (
                <>
                  {isDragMode ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (over && active.id !== over.id) {
                          setErpOrder(prev => {
                            const oldIdx = prev.indexOf(active.id as string);
                            const newIdx = prev.indexOf(over.id as string);
                            return arrayMove(prev, oldIdx, newIdx);
                          });
                          setHasUnsaved(true);
                        }
                      }}
                    >
                      <SortableContext items={erpOrder} strategy={verticalListSortingStrategy}>
                        {erpOrder.map(key => {
                          const item = osErpEnabled.find(i => (i.path ?? i.label) === key);
                          if (!item) return null;
                          return (
                            <SortableErpItem
                              key={key}
                              id={key}
                              item={item}
                              menuItemClass={menuItemClass}
                              inventoryAlertCount={inventoryAlertCount as number}
                              needsReviewCount={needsReviewCount}
                              accountingBadge={accountingBadge}
                              setMobileOpen={setMobileOpen}
                            />
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    renderOsItemsWithSubGroups(erpOrder)
                  )}
                  {isDragMode && (
                    <div className="mx-2 mt-2 mb-1 flex gap-1">
                      <Button
                        size="sm"
                        className="h-8 text-xs flex-1 text-white"
                        style={{ background: 'var(--os-amber)' }}
                        onClick={async () => {
                          await saveSidebarOrder.mutateAsync({
                            items: erpOrder.map((key, idx) => ({ menuKey: key, sortOrder: idx })),
                          });
                          setIsDragMode(false);
                          setHasUnsaved(false);
                        }}
                        disabled={saveSidebarOrder.isPending}
                      >
                        {saveSidebarOrder.isPending ? "儲存中..." : "確認排列"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        style={{ color: 'var(--os-sidebar-muted)' }}
                        onClick={() => { setIsDragMode(false); setHasUnsaved(false); }}
                      >
                        取消
                      </Button>
                    </div>
                  )}
                  {!isDragMode && renderComingSoonItems(osErpComingSoon)}
                </>
              )}
            </div>
          </>
        )}

        {/* ── 群組三：大永蛋品 ERP ── */}
        {showDyErpSection && (
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--os-sidebar-text)' }}>大永蛋品 ERP</p>
          </div>
        )}
        {showDyErpSection && (
          <div>
            <div className={groupLabelClass} style={groupLabelStyle} onClick={() => toggleGroup("大永蛋品 ERP")}>
              <span>大永蛋品 ERP</span>
              {!!collapsedGroups["大永蛋品 ERP"]
                ? <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
                : <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
              }
            </div>
            {!collapsedGroups["大永蛋品 ERP"] && (
              <>
                {dyErpEnabled.map((item) => {
                  const badge =
                    item.path === "/dayone/ar" && overdueARCount > 0 ? overdueARCount :
                    item.path === "/dayone/dispatch" && activeDispatchCount > 0 ? activeDispatchCount :
                    item.path === "/dayone/purchase-receipts" && pendingReceiptCount > 0 ? pendingReceiptCount :
                    0;
                  return (
                    <Link key={item.path} href={item.path}>
                      <a
                        className={menuItemClass(item.path)}
                        style={menuItemStyle(item.path)}
                        onClick={() => setMobileOpen(false)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span
                            className="ml-auto min-w-[20px] h-5 px-1.5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                            style={{ background: 'var(--os-danger)' }}
                          >
                            {badge}
                          </span>
                        )}
                      </a>
                    </Link>
                  );
                })}
                {renderComingSoonItems(dyErpComingSoon)}
              </>
            )}
          </div>
        )}

        {renderGroup("其他", bottomItems)}
      </nav>

      {/* User footer */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--os-sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--os-amber-soft)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--os-amber-text)' }}>
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-none" style={{ color: 'var(--os-sidebar-text)' }}>
              {user.name || "-"}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--os-sidebar-muted)' }}>
              {user.email || "-"}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--os-sidebar-muted)' }}
            title="登出"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--os-bg)' }}>
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
          flex flex-col w-64 shrink-0
          lg:relative lg:translate-x-0
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ background: 'var(--os-sidebar-bg)', borderRight: '1px solid var(--os-sidebar-border)' }}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 shrink-0" style={{ background: 'var(--os-surface)', borderBottom: '1px solid var(--os-border)' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--os-text-2)' }}
            aria-label="開啟選單"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-brand)', color: 'var(--os-text-1)' }}>
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

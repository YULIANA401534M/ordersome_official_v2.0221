import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Loader2,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Sparkles,
  Users,
  Store,
  BookOpen,
  Package,
  ShoppingBag,
  User,
  ClipboardList,
  Briefcase,
  LogOut,
  ChevronRight,
  Wrench,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── 時段問候 ───────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "早安";
  if (h < 18) return "午安";
  return "晚安";
}

// ─── 角色設定 ───────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  super_admin: "超級管理員",
  manager: "管理員",
  franchisee: "門市夥伴",
  staff: "員工",
  customer: "一般會員",
  driver: "司機",
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
  franchisee: "bg-orange-100 text-orange-700 border-orange-200",
  staff: "bg-cyan-100 text-cyan-700 border-cyan-200",
  customer: "bg-gray-100 text-gray-600 border-gray-200",
  driver: "bg-green-100 text-green-700 border-green-200",
};

// ─── 大卡片（佔 2 欄） ──────────────────────────────────
type HeroCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const HERO_CARDS_ADMIN: HeroCard[] = [
  {
    id: "ecommerce-admin",
    title: "商城後台管理",
    subtitle: "E-Commerce",
    description: "管理商品、訂單與分類",
    href: "/dashboard/admin/ecommerce",
    gradient: "from-[#1e3a5f] to-[#2d5a9e]",
    Icon: LayoutDashboard,
  },
  {
    id: "dayone-erp",
    title: "大永蛋品 ERP",
    subtitle: "DaYone ERP",
    description: "配送、庫存、客戶管理",
    href: "/dayone",
    gradient: "from-[#1a4731] to-[#2d7a4f]",
    Icon: Package,
  },
];

// ─── 小卡片型別 ─────────────────────────────────────────
type SmallCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  Icon: React.ComponentType<{ className?: string }>;
  roles: string[];
};

const ALL_SMALL_CARDS: SmallCard[] = [
  // super_admin / manager
  {
    id: "orders-admin",
    title: "訂單管理",
    description: "查看與處理所有訂單",
    href: "/dashboard/admin/orders",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    borderColor: "border-l-blue-500",
    Icon: ShoppingCart,
    roles: ["super_admin", "manager"],
  },
  {
    id: "content",
    title: "內容管理",
    description: "管理網站文章與公告",
    href: "/dashboard/content",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    borderColor: "border-l-violet-500",
    Icon: FileText,
    roles: ["super_admin", "manager"],
  },
  {
    id: "ai-writer",
    title: "AI 文章助手",
    description: "AI 輔助撰寫與排程發布",
    href: "/dashboard/ai-writer",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    borderColor: "border-l-purple-600",
    Icon: Sparkles,
    roles: ["super_admin", "manager"],
  },
  {
    id: "users",
    title: "用戶管理",
    description: "管理帳號與權限設定",
    href: "/dashboard/admin/users",
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
    borderColor: "border-l-slate-500",
    Icon: Users,
    roles: ["super_admin", "manager"],
  },
  {
    id: "franchise-inquiries",
    title: "加盟詢問",
    description: "查看加盟申請與詢問",
    href: "/dashboard/franchise-inquiries",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    borderColor: "border-l-orange-500",
    Icon: Store,
    roles: ["super_admin", "manager"],
  },
  {
    id: "sop-admin",
    title: "SOP 知識庫",
    description: "查閱與管理作業手冊",
    href: "/dashboard/sop",
    iconColor: "text-teal-600",
    iconBg: "bg-teal-100",
    borderColor: "border-l-teal-600",
    Icon: BookOpen,
    roles: ["super_admin", "manager"],
  },
  {
    id: "repairs-admin",
    title: "設備報修",
    description: "查看與處理報修申請",
    href: "/dashboard/repairs",
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    borderColor: "border-l-red-500",
    Icon: Wrench,
    roles: ["super_admin", "manager"],
  },
  {
    id: "checklist-admin",
    title: "每日檢查表",
    description: "查看門市每日檢查記錄",
    href: "/dashboard/checklist",
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    borderColor: "border-l-green-500",
    Icon: ClipboardCheck,
    roles: ["super_admin", "manager"],
  },
  {
    id: "profile-admin",
    title: "個人中心",
    description: "編輯個人資料與設定",
    href: "/member/profile",
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
    borderColor: "border-l-gray-400",
    Icon: User,
    roles: ["super_admin", "manager"],
  },
  // franchisee（門市夥伴）小卡片
  {
    id: "sop-franchisee",
    title: "SOP 知識庫",
    description: "查閱作業手冊與規範",
    href: "/dashboard/sop",
    iconColor: "text-teal-600",
    iconBg: "bg-teal-100",
    borderColor: "border-l-teal-600",
    Icon: BookOpen,
    roles: ["franchisee"],
  },
  {
    id: "repairs-franchisee",
    title: "設備報修",
    description: "提交設備維修申請",
    href: "/dashboard/repairs",
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    borderColor: "border-l-red-500",
    Icon: Wrench,
    roles: ["franchisee"],
  },
  {
    id: "checklist-franchisee",
    title: "每日檢查表",
    description: "填寫開店/閉店檢查表",
    href: "/dashboard/checklist",
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    borderColor: "border-l-green-500",
    Icon: ClipboardCheck,
    roles: ["franchisee"],
  },
  {
    id: "shop-franchisee",
    title: "線上商城",
    description: "前往商城購物",
    href: "/shop",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    borderColor: "border-l-amber-500",
    Icon: ShoppingBag,
    roles: ["franchisee"],
  },
  {
    id: "profile-franchisee",
    title: "個人中心",
    description: "編輯個人資料與設定",
    href: "/member/profile",
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
    borderColor: "border-l-gray-400",
    Icon: User,
    roles: ["franchisee"],
  },
  // staff 小卡片
  {
    id: "sop-staff",
    title: "SOP 知識庫",
    description: "查閱作業手冊與規範",
    href: "/dashboard/sop",
    iconColor: "text-teal-600",
    iconBg: "bg-teal-100",
    borderColor: "border-l-teal-600",
    Icon: BookOpen,
    roles: ["staff"],
  },
  {
    id: "shop-staff",
    title: "線上商城",
    description: "前往商城購物",
    href: "/shop",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    borderColor: "border-l-amber-500",
    Icon: ShoppingBag,
    roles: ["staff"],
  },
  {
    id: "profile-staff",
    title: "個人中心",
    description: "編輯個人資料與設定",
    href: "/member/profile",
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
    borderColor: "border-l-gray-400",
    Icon: User,
    roles: ["staff"],
  },
  // customer / driver 小卡片
  {
    id: "shop-customer",
    title: "線上商城",
    description: "前往商城購物",
    href: "/shop",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    borderColor: "border-l-amber-500",
    Icon: ShoppingBag,
    roles: ["customer", "driver"],
  },
  {
    id: "my-orders",
    title: "我的訂單",
    description: "查看訂單歷史與狀態",
    href: "/member/orders",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    borderColor: "border-l-blue-500",
    Icon: ClipboardList,
    roles: ["customer", "driver"],
  },
  {
    id: "profile-customer",
    title: "個人中心",
    description: "編輯個人資料與設定",
    href: "/member/profile",
    iconColor: "text-gray-600",
    iconBg: "bg-gray-100",
    borderColor: "border-l-gray-400",
    Icon: User,
    roles: ["customer", "driver"],
  },
];

// ─── 元件：大卡片 ───────────────────────────────────────
function HeroCardItem({ card }: { card: HeroCard }) {
  return (
    <a
      href={card.href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 flex flex-col justify-between min-h-[140px] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
    >
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-2 -bottom-10 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <card.Icon className="h-6 w-6 text-white" />
        </div>
        <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
          {card.subtitle}
        </span>
      </div>
      <div className="mt-4">
        <h2 className="text-white font-bold text-lg leading-tight">{card.title}</h2>
        <p className="text-white/70 text-sm mt-0.5">{card.description}</p>
      </div>
      <div className="mt-3 flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
        進入 <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </a>
  );
}

// ─── 元件：小卡片 ───────────────────────────────────────
function SmallCardItem({ card }: { card: SmallCard }) {
  return (
    <a
      href={card.href}
      className={`group flex items-center gap-3 bg-white rounded-xl border border-gray-100 border-l-4 ${card.borderColor} px-4 py-3.5 shadow-sm hover:shadow-md hover:-translate-x-1 transition-all duration-150`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-full ${card.iconBg} flex items-center justify-center`}>
        <card.Icon className={`h-4 w-4 ${card.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{card.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{card.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
}

// ─── 主元件 ─────────────────────────────────────────────
export default function Dashboard() {
  useEffect(() => {
    document.querySelector('meta[name="robots"]')?.setAttribute("content", "noindex, nofollow");
  }, []);

  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9E6]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // 大永 manager 直接進 ERP，不停留在 /dashboard
  if (user?.role === "manager" && (user as any)?.tenantId === 90004) {
    window.location.replace("/dayone");
    return null;
  }

  const userRole = user?.role ?? "customer";
  const roleLabel = ROLE_LABELS[userRole] ?? "會員";
  const roleBadge = ROLE_BADGE[userRole] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const isAdmin = userRole === "super_admin" || userRole === "manager";
  const isDayoneManager = userRole === "manager" && user?.tenantId === 90004;
  const greeting = getGreeting();

  const visibleSmallCards = ALL_SMALL_CARDS.filter((c) => {
    if (!c.roles.includes(userRole)) return false;
    // 大永 manager 只顯示個人中心
    if (isDayoneManager) return c.id === "profile-admin";
    return true;
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-b from-[#FFF9E6] to-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-black tracking-tight text-amber-600">來點什麼</span>
            <span className="hidden sm:inline text-xs text-gray-400 font-medium">OrderSome</span>
          </div>

          <div className="flex-1 text-center min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">
              {user?.name ?? "用戶"} 👋 {greeting}
            </p>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${roleBadge}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-gray-500 hover:text-red-600 px-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">登出</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-12">

        {/* Admin: 大卡片區 */}
        {isAdmin && !isDayoneManager && (
          <section className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HERO_CARDS_ADMIN.map((card) => (
                <HeroCardItem key={card.id} card={card} />
              ))}
            </div>
          </section>
        )}

        {/* 大永 Manager: 只顯示大永 ERP 卡片 */}
        {isDayoneManager && (
          <section className="mb-6">
            <a
              href="/dayone"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4731] to-[#2d7a4f] p-6 flex flex-col justify-between min-h-[140px] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 block"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="text-white/50 text-xs font-medium tracking-widest uppercase">DaYone ERP</span>
              </div>
              <div className="mt-4">
                <h2 className="text-white font-bold text-lg">大永蛋品 ERP</h2>
                <p className="text-white/70 text-sm mt-0.5">配送、庫存、客戶管理</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
                進入 <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          </section>
        )}

        {/* franchisee: 大卡片（門市夥伴專區） */}
        {userRole === "franchisee" && (
          <section className="mb-6">
            <a
              href="/dashboard/franchise"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-6 flex flex-col justify-between min-h-[140px] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 block"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Franchise</span>
              </div>
              <div className="mt-4">
                <h2 className="text-white font-bold text-lg">門市夥伴專區</h2>
                <p className="text-white/70 text-sm mt-0.5">SOP 文件、設備報修、每日檢查表</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
                進入 <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </a>
          </section>
        )}

        {/* staff: 大卡片（員工專區） */}
        {userRole === "staff" && (
          <section className="mb-6">
            <a
              href="/dashboard/staff"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 flex flex-col justify-between min-h-[140px] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 block"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Staff</span>
              </div>
              <div className="mt-4">
                <h2 className="text-white font-bold text-lg">員工專區</h2>
                <p className="text-white/70 text-sm mt-0.5">設備報修與班表查詢</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
                進入 <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </a>
          </section>
        )}

        {/* customer / driver: 大卡片（線上商城） */}
        {(userRole === "customer" || userRole === "driver") && (
          <section className="mb-6">
            <a
              href="/shop"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-6 flex flex-col justify-between min-h-[140px] shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 block"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Shop</span>
              </div>
              <div className="mt-4">
                <h2 className="text-white font-bold text-lg">線上商城</h2>
                <p className="text-white/70 text-sm mt-0.5">前往商城購物</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
                進入 <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </a>
          </section>
        )}

        {/* 小卡片區 */}
        {visibleSmallCards.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              快速入口
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleSmallCards.map((card) => (
                <SmallCardItem key={card.id} card={card} />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            © 2026 宇聯國際文化餐飲有限公司
          </p>
          <p className="text-[10px] text-gray-300 mt-0.5">v2.0 · OrderSome</p>
        </footer>
      </main>
    </div>
  );
}

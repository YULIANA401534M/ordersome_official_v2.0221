import React from "react";
import { useEffect } from "react";
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
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string; // Tailwind bg color class for icon bg
  roles: string[]; // empty = all authenticated users
};

const ALL_CARDS: DashboardCard[] = [
  {
    id: "ecommerce-admin",
    title: "商城後台",
    description: "管理商品、訂單與分類",
    icon: <LayoutDashboard className="h-5 w-5 text-indigo-600" />,
    href: "/dashboard/admin/ecommerce",
    color: "bg-indigo-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "orders-admin",
    title: "訂單管理",
    description: "查看與處理所有訂單",
    icon: <ShoppingCart className="h-5 w-5 text-blue-600" />,
    href: "/dashboard/admin/orders",
    color: "bg-blue-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "content",
    title: "內容管理",
    description: "管理網站文章與公告",
    icon: <FileText className="h-5 w-5 text-violet-600" />,
    href: "/dashboard/content",
    color: "bg-violet-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "ai-writer",
    title: "AI 文章助手",
    description: "AI 輔助撰寫與排程發布",
    icon: <Sparkles className="h-5 w-5 text-purple-600" />,
    href: "/dashboard/ai-writer",
    color: "bg-purple-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "users",
    title: "用戶管理",
    description: "管理帳號與權限設定",
    icon: <Users className="h-5 w-5 text-slate-600" />,
    href: "/dashboard/admin/users",
    color: "bg-slate-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "franchise-inquiries",
    title: "加盟詢問",
    description: "查看加盟申請與詢問",
    icon: <Store className="h-5 w-5 text-orange-600" />,
    href: "/dashboard/franchise-inquiries",
    color: "bg-orange-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "sop-admin",
    title: "SOP 知識庫",
    description: "查閱與管理作業手冊",
    icon: <BookOpen className="h-5 w-5 text-teal-600" />,
    href: "/dashboard/sop",
    color: "bg-teal-100",
    roles: ["super_admin", "manager"],
  },
  {
    id: "dayone-erp",
    title: "大永 ERP",
    description: "大永蛋品配送管理系統",
    icon: <Package className="h-5 w-5 text-green-600" />,
    href: "/dayone",
    color: "bg-green-100",
    roles: ["super_admin", "manager"],
  },
  // franchisee
  {
    id: "franchise-zone",
    title: "加盟專區",
    description: "營收報表與原物料訂貨",
    icon: <Store className="h-5 w-5 text-orange-600" />,
    href: "/dashboard/franchise",
    color: "bg-orange-100",
    roles: ["franchisee"],
  },
  // staff
  {
    id: "staff-zone",
    title: "員工專區",
    description: "設備報修與班表查詢",
    icon: <Briefcase className="h-5 w-5 text-cyan-600" />,
    href: "/dashboard/staff",
    color: "bg-cyan-100",
    roles: ["staff"],
  },
  {
    id: "sop-staff",
    title: "SOP 知識庫",
    description: "查閱作業手冊與規範",
    icon: <BookOpen className="h-5 w-5 text-teal-600" />,
    href: "/dashboard/sop",
    color: "bg-teal-100",
    roles: ["staff"],
  },
  // all authenticated users
  {
    id: "shop",
    title: "線上商城",
    description: "前往商城購物",
    icon: <ShoppingBag className="h-5 w-5 text-amber-600" />,
    href: "/shop",
    color: "bg-amber-100",
    roles: [],
  },
  {
    id: "my-orders",
    title: "我的訂單",
    description: "查看訂單歷史與狀態",
    icon: <ClipboardList className="h-5 w-5 text-blue-600" />,
    href: "/member/orders",
    color: "bg-blue-100",
    roles: ["franchisee", "customer", "driver"],
  },
  {
    id: "profile",
    title: "個人中心",
    description: "編輯個人資料與設定",
    icon: <User className="h-5 w-5 text-gray-600" />,
    href: "/member/profile",
    color: "bg-gray-100",
    roles: [],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "超級管理員",
  manager: "管理員",
  franchisee: "加盟主",
  staff: "員工",
  customer: "一般會員",
  driver: "司機",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  manager: "bg-indigo-100 text-indigo-700",
  franchisee: "bg-orange-100 text-orange-700",
  staff: "bg-cyan-100 text-cyan-700",
  customer: "bg-gray-100 text-gray-600",
  driver: "bg-green-100 text-green-700",
};

export default function Dashboard() {
  useEffect(() => {
    document.querySelector('meta[name="robots"]')?.setAttribute(
      "content",
      "noindex, nofollow"
    );
  }, []);

  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const userRole = user?.role ?? "customer";
  const roleLabel = ROLE_LABELS[userRole] ?? "會員";
  const roleBadge = ROLE_BADGE_COLOR[userRole] ?? "bg-gray-100 text-gray-600";

  // Filter: show card if roles is empty (all users) OR role matches
  const visibleCards = ALL_CARDS.filter(
    (card) => card.roles.length === 0 || card.roles.includes(userRole)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                歡迎回來，{user?.name ?? "用戶"}
              </h1>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${roleBadge}`}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1.5 text-sm"
            >
              <Home className="h-4 w-4" />
              返回首頁
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-sm text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map((card) => (
            <a
              key={card.id}
              href={card.href}
              className="group flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-150"
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-full ${card.color} flex items-center justify-center`}
              >
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">
                    {card.title}
                  </p>
                  <span className="text-gray-400 group-hover:text-gray-600 text-xs transition-colors">
                    進入 →
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">帳號資訊</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">姓名</p>
              <p className="font-medium text-gray-900">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="font-medium text-gray-900 truncate">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">角色</p>
              <p className="font-medium text-gray-900">{roleLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">電話</p>
              <p className="font-medium text-gray-900">
                {(user as any)?.phone ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

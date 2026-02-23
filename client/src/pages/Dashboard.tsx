import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Shield, Store, Wrench, ShoppingCart, Package, User, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  iconBg: string;
  roles: string[]; // empty = all authenticated users
};

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    id: "admin",
    title: "營運總部",
    description: "管理用戶、查看全站數據",
    icon: <Shield className="h-8 w-8 text-white" />,
    href: "/dashboard/admin/users",
    gradient: "from-purple-600 to-purple-800",
    iconBg: "bg-white/20",
    roles: ["super_admin", "manager"],
  },
  {
    id: "ecommerce-admin",
    title: "商城後台管理",
    description: "管理商品、訂單、分類",
    icon: <Package className="h-8 w-8 text-white" />,
    href: "/dashboard/admin/ecommerce",
    gradient: "from-amber-500 to-amber-700",
    iconBg: "bg-white/20",
    roles: ["super_admin", "manager"],
  },
  {
    id: "franchise",
    title: "加盟專區",
    description: "營收報表、原物料訂貨",
    icon: <Store className="h-8 w-8 text-white" />,
    href: "/dashboard/franchise",
    gradient: "from-orange-500 to-orange-700",
    iconBg: "bg-white/20",
    roles: ["super_admin", "manager", "franchisee"],
  },
  {
    id: "staff",
    title: "員工專區",
    description: "SOP 手冊、設備報修系統",
    icon: <Wrench className="h-8 w-8 text-white" />,
    href: "/dashboard/staff",
    gradient: "from-blue-500 to-blue-700",
    iconBg: "bg-white/20",
    roles: ["super_admin", "manager", "staff"],
  },
  {
    id: "shop",
    title: "線上商城",
    description: "前往商城購物",
    icon: <ShoppingCart className="h-8 w-8 text-white" />,
    href: "/shop",
    gradient: "from-green-500 to-green-700",
    iconBg: "bg-white/20",
    roles: [], // all authenticated users
  },
  {
    id: "orders",
    title: "我的訂單",
    description: "查看訂單歷史與狀態",
    icon: <Package className="h-8 w-8 text-white" />,
    href: "/member/orders",
    gradient: "from-indigo-500 to-indigo-700",
    iconBg: "bg-white/20",
    roles: [], // all authenticated users
  },
  {
    id: "profile",
    title: "個人中心",
    description: "編輯個人資料與設定",
    icon: <User className="h-8 w-8 text-white" />,
    href: "/member/profile",
    gradient: "from-slate-500 to-slate-700",
    iconBg: "bg-white/20",
    roles: [], // all authenticated users
  },
];

function getRoleLabel(role: string | null | undefined): string {
  const labels: Record<string, string> = {
    super_admin: "超級管理員",
    manager: "管理員",
    franchisee: "加盟主",
    staff: "員工",
    customer: "一般會員",
  };
  return labels[role ?? ""] ?? "會員";
}

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const userRole = user?.role ?? "customer";

  // Filter cards based on user role (empty roles array = all authenticated users)
  const visibleCards = DASHBOARD_CARDS.filter(
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
          <div>
            <h1 className="text-xl font-bold text-gray-900">會員中心</h1>
            <p className="text-sm text-gray-500">歡迎回來，{user?.name ?? "用戶"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              返回首頁
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {visibleCards.map((card) => (
            <a
              key={card.id}
              href={card.href}
              className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Card Top - Gradient with Icon */}
              <div className={`bg-gradient-to-br ${card.gradient} p-6`}>
                <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                  {card.icon}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{card.title}</h2>
                <p className="text-white/80 text-sm">{card.description}</p>
              </div>
              {/* Card Bottom - Link */}
              <div className="bg-white px-6 py-4">
                <span className="text-amber-600 font-medium text-sm group-hover:text-amber-700">
                  進入 →
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">帳號資訊</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">姓名</p>
              <p className="font-semibold text-gray-900">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-900">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">角色</p>
              <p className="font-semibold text-gray-900">{getRoleLabel(userRole)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">電話</p>
              <p className="font-semibold text-gray-900">
                {(user as any)?.phone ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

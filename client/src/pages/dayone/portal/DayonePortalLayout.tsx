import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Home, ClipboardList, Wallet, User, LogOut } from "lucide-react";
import { useCallback } from "react";

const NAV = [
  { icon: Home,          label: "首頁",   path: "/dayone/portal" },
  { icon: ClipboardList, label: "我的訂單", path: "/dayone/portal/orders" },
  { icon: Wallet,        label: "對帳",   path: "/dayone/portal/statement" },
  { icon: User,          label: "帳戶",   path: "/dayone/portal/account" },
];

export default function DayonePortalLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/dayone/portal/login");
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-600">🥚 大永蛋品</span>
            <span className="text-xs text-gray-400 hidden sm:inline">客戶入口</span>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>}
            <button onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-2xl mx-auto w-full">
        {/* Desktop sidebar */}
        <nav className="hidden sm:flex flex-col w-48 bg-white border-r border-gray-200 pt-4 shrink-0">
          {NAV.map((item) => {
            const active = location === item.path || (item.path !== "/dayone/portal" && location.startsWith(item.path));
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  active ? "bg-amber-50 text-amber-700 font-medium border-r-2 border-amber-500" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Main */}
        <main className="flex-1 overflow-auto pb-20 sm:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="grid grid-cols-4">
          {NAV.map((item) => {
            const active = location === item.path || (item.path !== "/dayone/portal" && location.startsWith(item.path));
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2.5 gap-0.5 text-xs transition-colors ${
                  active ? "text-amber-600 bg-amber-50" : "text-gray-500"
                }`}>
                <item.icon className={`w-5 h-5 ${active ? "text-amber-600" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

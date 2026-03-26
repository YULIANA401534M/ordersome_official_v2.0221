import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { ClipboardList, Package, CheckCircle, User, Home, BookOpen } from "lucide-react";

const NAV = [
  { href: "/driver", icon: Home, label: "首頁" },
  { href: "/driver/today", icon: ClipboardList, label: "今日" },
  { href: "/driver/orders", icon: Package, label: "配送單" },
  { href: "/driver/worklog", icon: BookOpen, label: "日誌" },
  { href: "/driver/profile", icon: User, label: "我的" },
];

export default function DriverLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
      <Package className="w-16 h-16 text-amber-500" />
      <h1 className="text-xl font-bold text-gray-900">大永蛋品配送系統</h1>
      <p className="text-gray-500 text-sm text-center">請先登入以使用配送功能</p>
      <a href="/login" className="w-full max-w-xs bg-amber-600 text-white text-center py-3 rounded-xl font-semibold">
        前往登入
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Top bar */}
      <div className="bg-amber-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Package className="w-5 h-5" />
        <span className="font-bold text-sm">{title ?? '大永蛋品配送'}</span>
        <span className="ml-auto text-xs opacity-80">{user.name}</span>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex z-10">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = location === href || (href !== "/driver" && location.startsWith(href));
          return (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${active ? "text-amber-600" : "text-gray-500"}`}>
              <Icon className={`w-5 h-5 ${active ? "text-amber-600" : "text-gray-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

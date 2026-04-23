import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { ClipboardList, Package, User, Home, BookOpen } from "lucide-react";

const NAV = [
  { href: "/driver", icon: Home, label: "首頁" },
  { href: "/driver/today", icon: ClipboardList, label: "今日" },
  { href: "/driver/orders", icon: Package, label: "訂單" },
  { href: "/driver/worklog", icon: BookOpen, label: "日結" },
  { href: "/driver/profile", icon: User, label: "我的" },
];

export default function DriverLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="dayone-shell flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dayone-shell flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Package className="h-16 w-16 text-amber-500" />
        <h1 className="font-brand text-xl text-stone-900">大永蛋品司機端</h1>
        <p className="max-w-xs text-center text-sm text-stone-500">
          請先登入後再查看今日配送、簽收與日結資料。
        </p>
        <a
          href="/login"
          className="w-full max-w-xs rounded-2xl bg-amber-600 py-3 text-center font-semibold text-white shadow-[0_12px_24px_rgba(180,83,9,0.18)]"
        >
          前往登入
        </a>
      </div>
    );
  }

  return (
    <div className="dayone-shell flex min-h-screen justify-center">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-[rgba(255,253,248,0.9)] shadow-[0_18px_48px_rgba(120,53,15,0.12)] backdrop-blur-xl">
        <header className="sticky top-0 z-20 border-b border-amber-100/80 bg-[rgba(255,252,245,0.96)] px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_12px_24px_rgba(180,83,9,0.22)]">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-brand text-[1.35rem] leading-none text-stone-900">{title ?? "配送主控台"}</h1>
              <p className="mt-1 truncate text-xs text-stone-500">{user.name}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-amber-100/80 bg-[rgba(255,252,245,0.96)] backdrop-blur-xl">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/driver" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  active ? "text-amber-700" : "text-stone-500"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-amber-600" : "text-stone-400"}`} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

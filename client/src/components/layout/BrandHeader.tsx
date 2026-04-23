import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Menu, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import UserMenu from "@/components/UserMenu";

const navItems = [
  { href: "/brand", label: "首頁" },
  { href: "/brand/story", label: "品牌故事" },
  { href: "/brand/menu", label: "餐點菜單" },
  { href: "/brand/stores", label: "門市據點" },
  { href: "/brand/news", label: "最新消息" },
  { href: "/brand/contact", label: "聯絡我們" },
  { href: "/brand/franchise", label: "加盟合作" },
];

export default function BrandHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: cartItems } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const getDashboardUrl = () => {
    if (!user) return null;
    if (user.role === "super_admin" || user.role === "manager") return "/dashboard/admin/users";
    if (user.role === "franchisee") return "/dashboard/franchise";
    if (user.role === "staff") return "/dashboard/staff";
    return null;
  };

  const dashboardUrl = getDashboardUrl();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 w-[min(96vw,1380px)] rounded-[1.75rem] border border-white/70 bg-white/82 px-4 shadow-[0_24px_80px_rgba(82,60,10,0.12)] backdrop-blur-xl md:px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/brand" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff3bf_0%,#f7c948_100%)] shadow-[0_12px_24px_rgba(244,180,0,0.24)]">
              <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-8 w-auto" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#9f7a00]">
                Order Some
              </p>
              <p className="text-sm font-medium text-[#5d5649]">
                台韓混血的年輕早午餐品牌
              </p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-2 rounded-full border border-[#eadfb8] bg-[#fff8e7] px-3 py-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#1f1a14] text-white shadow-[0_10px_24px_rgba(31,26,20,0.18)]"
                      : "text-[#6b6356] hover:bg-white hover:text-[#1f1a14]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {dashboardUrl && (
              <Link href={dashboardUrl}>
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden lg:flex gap-2 rounded-full border-[#dbc88c] bg-white/80 text-[#584d36]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  後台
                </Button>
              </Link>
            )}
            <Link href="/shop">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex rounded-full border-[#dbc88c] bg-[#fff8e4] text-[#584d36] hover:bg-[#fff1bb]"
              >
                線上商城
              </Button>
            </Link>
            <Link href="/shop/cart" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-[#fff4cf] text-[#5f4e16] hover:bg-[#ffe58d]"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1f1a14] text-[0.65rem] text-white">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-[#5d5649]">
                  登入
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden rounded-full bg-[#fff4cf] text-[#5f4e16] hover:bg-[#ffe58d]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="border-t border-[#efe4bf] py-4 xl:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#1f1a14] text-white"
                        : "bg-[#fff9ea] text-[#5f584a] hover:bg-[#fff1bf]"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/shop"
                className="rounded-2xl bg-[#fff9ea] px-4 py-3 text-sm font-semibold text-[#5f584a] hover:bg-[#fff1bf]"
                onClick={() => setIsMenuOpen(false)}
              >
                線上商城
              </Link>
              {dashboardUrl && (
                <Link
                  href={dashboardUrl}
                  className="flex items-center gap-2 rounded-2xl bg-[#fff9ea] px-4 py-3 text-sm font-semibold text-[#5f584a] hover:bg-[#fff1bf]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  後台
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

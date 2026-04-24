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
  { href: "/brand/menu", label: "菜單" },
  { href: "/brand/stores", label: "門市" },
  { href: "/brand/news", label: "消息" },
  { href: "/brand/contact", label: "聯絡" },
  { href: "/brand/franchise", label: "加盟" },
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
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between rounded-[1.75rem] border border-[#efe4c6] bg-white/88 px-4 py-3 shadow-[0_20px_60px_-40px_rgba(91,66,18,0.35)] backdrop-blur md:px-6">
        <Link href="/brand" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[#fff4ca]">
            <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-8 w-auto" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#a17800]">ORDER SOME</p>
            <p className="text-sm text-[#655c4d]">台韓兩味，混搭就對</p>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1 rounded-full bg-[#fff8e8] px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-[#1c1813] text-white" : "text-[#655c4d] hover:bg-white"
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
              <Button size="sm" variant="outline" className="hidden lg:flex rounded-full border-[#ddc87f] bg-white">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                後台
              </Button>
            </Link>
          )}
          <Link href="/shop">
            <Button size="sm" variant="outline" className="hidden md:flex rounded-full border-[#ddc87f] bg-[#fff7dd] text-[#5c4d26] hover:bg-[#ffefb4]">
              商店
            </Button>
          </Link>
          <Link href="/shop/cart" className="relative">
            <Button variant="ghost" size="icon" className="rounded-full bg-[#fff4cf] text-[#5c4d26] hover:bg-[#ffe497]">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1c1813] text-[0.65rem] text-white">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full text-[#655c4d]">
                登入
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden rounded-full bg-[#fff4cf] text-[#5c4d26] hover:bg-[#ffe497]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="mx-auto mt-3 w-full max-w-[1360px] rounded-[1.5rem] border border-[#efe4c6] bg-white/96 p-3 shadow-[0_18px_50px_-40px_rgba(91,66,18,0.35)] backdrop-blur xl:hidden">
          <nav className="grid gap-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-semibold ${
                    isActive ? "bg-[#1c1813] text-white" : "bg-[#fff9eb] text-[#655c4d]"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

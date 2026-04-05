import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingCart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import UserMenu from "@/components/UserMenu";

const navItems = [
  { href: "/brand", label: "首頁" },
  { href: "/brand/story", label: "品牌故事" },
  { href: "/brand/menu", label: "菜單介紹" },
  { href: "/brand/stores", label: "門市據點" },
  { href: "/brand/news", label: "最新消息" },
  { href: "/brand/contact", label: "聯絡我們" },
  { href: "/brand/franchise", label: "加盟諮詢" },
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
    if (user.role === "super_admin" || user.role === "manager") {
      return "/dashboard/admin/users";
    } else if (user.role === "franchisee") {
      return "/dashboard/franchise";
    } else if (user.role === "staff") {
      return "/dashboard/staff";
    }
    return null;
  };

  const dashboardUrl = getDashboardUrl();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/brand" className="flex items-center">
            <img
              src="/logos/brand-logo-yellow.png"
              alt="來點什麼"
              className="h-12 md:h-14 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href
                    ? "text-primary"
                    : "text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {dashboardUrl && (
              <Link href={dashboardUrl}>
                <Button size="sm" variant="outline" className="hidden sm:flex gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  後台
                </Button>
              </Link>
            )}
            <Link href="/shop">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                線上商城
              </Button>
            </Link>
            <Link href="/shop/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  登入
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/shop"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                線上商城
              </Link>
              {dashboardUrl && (
                <Link
                  href={dashboardUrl}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
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

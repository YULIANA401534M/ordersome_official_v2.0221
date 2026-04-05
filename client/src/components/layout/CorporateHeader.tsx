import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShoppingCart, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

const navItems = [
  { href: "/corporate", label: "首頁" },
  { href: "/corporate/about", label: "企業介紹" },
  { href: "/corporate/brands", label: "旗下品牌" },
  { href: "/corporate/culture", label: "企業文化" },
  { href: "/corporate/news", label: "新聞中心" },
  { href: "/corporate/franchise", label: "加盟資訊" },
  { href: "/corporate/contact", label: "聯絡我們" },
];

export default function CorporateHeader() {
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
          <Link href="/corporate" className="flex items-center gap-3">
            <img
              src="/logos/yulian-logo-horizontal.png"
              alt="宇聯國際"
              className="h-10 md:h-12 w-auto"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900">宇聯國際文化餐飲有限公司</p>
              <p className="text-xs text-gray-500">YULIAN International Cultural Catering Co., Ltd.</p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                  location === item.href || (item.href !== "/corporate" && location.startsWith(item.href))
                    ? "text-amber-600"
                    : "text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="hidden sm:flex gap-2">
                  <User className="h-4 w-4" />
                  後台
                </Button>
              </Link>
            )}
            <Link href="/shop">
              <Button size="sm" className="hidden sm:flex bg-amber-600 hover:bg-amber-700">
                線上商城
              </Button>
            </Link>
            <Link href="/shop/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/member/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
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
              className="xl:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="xl:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location === item.href
                      ? "bg-amber-50 text-amber-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/shop"
                className="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg"
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

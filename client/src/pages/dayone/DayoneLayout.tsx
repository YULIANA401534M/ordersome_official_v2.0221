import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Users, Truck, Warehouse, ShoppingCart,
  MapPin, Settings, BarChart3, ChevronLeft, Menu, X, LogOut
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const TENANT_ID = 90004; // 大永蛋品 tenantId

const navItems = [
  { icon: LayoutDashboard, label: "總覽", path: "/dayone" },
  { icon: ShoppingCart,    label: "配送訂單", path: "/dayone/orders" },
  { icon: Users,           label: "客戶管理", path: "/dayone/customers" },
  { icon: Truck,           label: "司機管理", path: "/dayone/drivers" },
  { icon: Package,         label: "品項管理", path: "/dayone/products" },
  { icon: Warehouse,       label: "庫存管理", path: "/dayone/inventory" },
  { icon: ShoppingCart,    label: "進貨管理", path: "/dayone/purchase" },
  { icon: MapPin,          label: "行政區管理", path: "/dayone/districts" },
  { icon: BarChart3,       label: "報表", path: "/dayone/reports" },
];

export function DayoneLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/login"; }
  });

  const Sidebar = () => (
    <nav className="flex flex-col h-full bg-amber-950 text-amber-50 w-64 min-w-[16rem]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-amber-800">
        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-950 font-bold text-sm">蛋</div>
        <div>
          <div className="font-bold text-sm leading-tight">大永蛋品</div>
          <div className="text-xs text-amber-400">ERP 管理系統</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const active = location === item.path || (item.path !== "/dayone" && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                  active
                    ? "bg-amber-400 text-amber-950"
                    : "text-amber-200 hover:bg-amber-800 hover:text-amber-50"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </a>
            </Link>
          );
        })}
      </div>
      <div className="p-3 border-t border-amber-800">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.name ?? "用戶"}</div>
            <div className="text-xs text-amber-400 truncate">{user?.email ?? ""}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-amber-300 hover:text-amber-50 hover:bg-amber-800 gap-2"
          onClick={() => logout.mutate()}
        >
          <LogOut className="w-4 h-4" />
          登出
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex">
            <Sidebar />
            <button className="absolute top-3 right-[-2.5rem] text-white" onClick={() => setMobileOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-amber-950 text-amber-50">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm">大永蛋品 ERP</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { TENANT_ID };

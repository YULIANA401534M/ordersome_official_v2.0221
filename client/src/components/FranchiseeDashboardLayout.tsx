import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import {
  Home,
  Store,
  FileText,
  BarChart3,
  Package,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface FranchiseeDashboardLayoutProps {
  children: ReactNode;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default function FranchiseeDashboardLayout({ children }: FranchiseeDashboardLayoutProps) {
  const [location] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const menuItems = [
    { icon: Home, label: "返回首頁", path: "/brand/ordersome" },
    { icon: Store, label: "門市管理", path: "/dashboard/franchise/stores" },
    { icon: FileText, label: "SOP 文件", path: "/dashboard/franchise/sop" },
    { icon: BarChart3, label: "營運報表", path: "/dashboard/franchise/reports" },
    { icon: Package, label: "庫存管理", path: "/dashboard/franchise/inventory" },
  ];

  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`bg-gradient-to-br from-green-600 to-green-700 text-white flex flex-col transition-all duration-300 relative ${
          isMobile ? "fixed inset-y-0 left-0 z-50" : ""
        } ${isCollapsed ? "w-16" : ""}`}
        style={{ width: isCollapsed ? "64px" : `${sidebarWidth}px` }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-green-500/30">
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-bold">加盟主專區</h2>
              <p className="text-sm text-green-100">{user?.name || "加盟主"}</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === location;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-white text-green-700 shadow-lg"
                    : "hover:bg-green-500/20 text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Resize Handle */}
        {!isCollapsed && !isMobile && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-green-400/50 transition-colors"
            onMouseDown={() => setIsResizing(true)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeMenuItem?.label || "加盟主專區"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === "franchisee" && user?.storeId && `門市編號：${user.storeId}`}
            </p>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">個人中心</span>
          </Link>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

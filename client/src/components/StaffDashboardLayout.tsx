import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import {
  Home,
  Wrench,
  ClipboardList,
  Calendar,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  User,
} from "lucide-react";

interface StaffDashboardLayoutProps {
  children: ReactNode;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

export default function StaffDashboardLayout({ children }: StaffDashboardLayoutProps) {
  const [location] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const menuItems = [
    { icon: LayoutDashboard, label: "返回儀表板", path: "/dashboard", isDashboardLink: true },
    { icon: Home, label: "返回首頁", path: "/brand/ordersome" },
    { icon: BookOpen, label: "SOP 知識庫", path: "/dashboard/sop" },
    { icon: Wrench, label: "設備報修", path: "/dashboard/repairs" },
    { icon: ClipboardList, label: "每日檢查表", path: "/dashboard/checklist" },
    { icon: Calendar, label: "排班系統", path: "/dashboard/staff/schedule" },
    { icon: Bell, label: "公告事項", path: "/dashboard/staff/announcements" },
  ];

  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
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
        className={`bg-gradient-to-br from-purple-600 to-purple-700 text-white flex flex-col transition-all duration-300 relative ${
          isMobile ? "fixed inset-y-0 left-0 z-50" : ""
        } ${isCollapsed ? "w-16" : ""}`}
        style={{ width: isCollapsed ? "64px" : `${sidebarWidth}px` }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-purple-500/30">
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-bold">員工專區</h2>
              <p className="text-sm text-purple-100">{user?.name || "員工"}</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isDashboard = (item as any).isDashboardLink;
            const isActive = item.path === location || (!isDashboard && item.path !== "/brand/ordersome" && location.startsWith(item.path + "/"));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isDashboard
                    ? "bg-white/20 hover:bg-white/30 text-white font-semibold border border-white/30"
                    : isActive
                    ? "bg-white text-purple-700 shadow-lg"
                    : "hover:bg-purple-500/20 text-white"
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
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-400/50 transition-colors"
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
              {activeMenuItem?.label || "員工專區"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === "staff" && (user as any)?.storeId && `門市編號：${(user as any).storeId}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              返回管理後台
            </Link>
            <Link
              to="/member/profile"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">個人中心</span>
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

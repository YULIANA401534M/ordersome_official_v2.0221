import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * 智慧中控台入口 - 依角色自動分流
 * super_admin / manager → /admin
 * franchisee → /dashboard/franchise
 * staff → /dashboard/staff
 * user (一般會員) → /member/profile
 * 未登入 → /login
 */
export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const role = user?.role;
    if (role === "super_admin" || role === "manager") {
      navigate("/admin");
    } else if (role === "franchisee") {
      navigate("/dashboard/franchise");
    } else if (role === "staff") {
      navigate("/dashboard/staff");
    } else {
      // 一般會員
      navigate("/member/profile");
    }
  }, [user, loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">正在載入您的專屬後台...</p>
      </div>
    </div>
  );
}

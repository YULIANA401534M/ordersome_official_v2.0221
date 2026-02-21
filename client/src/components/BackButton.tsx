import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface BackButtonProps {
  /** 自訂 fallback 路由（若未提供，則依角色自動判斷） */
  fallbackPath?: string;
  /** 按鈕顯示文字，預設「返回」 */
  label?: string;
  className?: string;
}

/**
 * 動態返回按鈕元件
 * - 優先使用 window.history.back() 返回上一頁
 * - 若歷史紀錄堆疊為空（直接輸入網址進入），則 fallback 至所屬儀表板
 */
export default function BackButton({
  fallbackPath,
  label = "返回",
  className = "",
}: BackButtonProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const getFallback = (): string => {
    if (fallbackPath) return fallbackPath;
    const role = user?.role;
    if (role === "super_admin" || role === "manager") return "/dashboard/admin/users";
    if (role === "franchisee") return "/dashboard/franchise";
    if (role === "staff") return "/dashboard/staff";
    return "/dashboard";
  };

  const handleBack = () => {
    // 若 history.length <= 2，表示使用者是直接輸入網址進入（無法返回）
    if (window.history.length <= 2) {
      navigate(getFallback());
    } else {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      aria-label={label}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

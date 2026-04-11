import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Egg } from "lucide-react";

export default function DayoneLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [, navigate]            = useLocation();

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: (data) => {
      if ((data.user as any).tenantId !== 90004 && data.user.role !== "super_admin") {
        toast.error("此帳號無法登入大永後台");
        return;
      }
      navigate("/dayone");
    },
    onError: (err) => {
      toast.error(err.message || "登入失敗，請確認帳號密碼");
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("請輸入帳號和密碼");
      return;
    }
    loginMutation.mutate({ email, pwd: password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 區塊 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg mb-4">
            <Egg className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">大永蛋品</h1>
          <p className="text-sm text-gray-500 mt-1">ERP 管理後台</p>
        </div>

        {/* 登入卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-gray-800">歡迎回來</h2>
            <p className="text-sm text-gray-400">請輸入您的帳號密碼登入</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">電子郵件</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">密碼</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-11"
              />
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loginMutation.isPending}
            className="h-11 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg w-full"
          >
            {loginMutation.isPending ? "登入中..." : "登入"}
          </Button>

          <p className="text-center text-xs text-gray-400">
            如有帳號問題請聯繫系統管理員
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} 宇聯國際文化餐飲有限公司
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DayoneLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [, navigate]            = useLocation();

  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: (data) => {
      if (data.user.tenantId !== 90004 && data.user.role !== "super_admin") {
        toast.error("此帳號無法登入大永後台");
        return;
      }
      navigate("/dayone");
    },
    onError: (err) => {
      toast.error(err.message || "登入失敗");
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col gap-6 p-8 bg-white rounded-xl shadow w-full max-w-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">大永蛋品</h1>
          <p className="text-sm text-gray-500">ERP 管理後台</p>
        </div>
        <div className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            onClick={() => loginMutation.mutate({ email, pwd: password })}
            disabled={loginMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {loginMutation.isPending ? "登入中..." : "登入"}
          </Button>
        </div>
      </div>
    </div>
  );
}

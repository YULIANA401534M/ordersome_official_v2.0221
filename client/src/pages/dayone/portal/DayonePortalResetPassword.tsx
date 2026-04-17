import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DayonePortalResetPassword() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const mutation = trpc.dayone.portal.resetPasswordWithToken.useMutation({
    onSuccess: () => {
      toast.success("密碼重設成功，請使用新密碼登入");
      navigate("/dayone/portal/login");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("連結無效，請重新申請"); return; }
    if (!newPwd) { toast.error("請輸入新密碼"); return; }
    if (newPwd.length < 6) { toast.error("密碼至少 6 個字元"); return; }
    if (newPwd !== confirmPwd) { toast.error("兩次密碼不一致"); return; }
    mutation.mutate({ token, newPwd });
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <p className="text-red-600 font-medium">連結無效或已過期</p>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => navigate("/dayone/portal/forgot-password")}
          >
            重新申請
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-4xl font-black text-amber-500">🥚</p>
          <h1 className="text-2xl font-bold text-amber-600">大永蛋品</h1>
          <p className="text-sm text-gray-500">設定新密碼</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="新密碼（至少 6 個字元）"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="確認新密碼"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "重設中..." : "確認重設密碼"}
          </Button>
        </form>
      </div>
    </div>
  );
}

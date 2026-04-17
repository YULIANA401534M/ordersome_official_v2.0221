import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DayonePortalForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = trpc.dayone.portal.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("請輸入 Email"); return; }
    mutation.mutate({ email });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-4xl font-black text-amber-500">🥚</p>
          <h1 className="text-2xl font-bold text-amber-600">大永蛋品</h1>
          <p className="text-sm text-gray-500">忘記密碼</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium text-sm">
                若此 Email 已註冊，您將收到密碼重設連結。
              </p>
              <p className="text-green-600 text-xs mt-1">請查收信箱（含垃圾郵件）</p>
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => navigate("/dayone/portal/login")}
            >
              返回登入
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm text-gray-600">
                請輸入您的 Email，我們將寄送重設密碼連結。
              </p>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "傳送中..." : "傳送重設連結"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              <button
                type="button"
                onClick={() => navigate("/dayone/portal/login")}
                className="text-amber-600 font-medium hover:underline"
              >
                返回登入
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

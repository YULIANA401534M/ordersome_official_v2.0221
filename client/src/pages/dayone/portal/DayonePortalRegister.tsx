import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DayonePortalRegister() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  const reg = trpc.dayone.portal.register.useMutation({
    onSuccess: () => {
      toast.success("註冊成功，已自動登入");
      navigate("/dayone/portal");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !pwd) { toast.error("請填寫所有欄位"); return; }
    if (pwd !== confirm) { toast.error("兩次密碼不一致"); return; }
    if (pwd.length < 6) { toast.error("密碼至少 6 碼"); return; }
    reg.mutate({ name, loginEmail: email, password: pwd });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-4xl font-black text-amber-500">🥚</p>
          <h1 className="text-2xl font-bold text-amber-600">大永蛋品</h1>
          <p className="text-sm text-gray-500">客戶註冊</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="姓名 *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input type="password" placeholder="密碼（至少 6 碼）*" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <Input type="password" placeholder="確認密碼 *" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            disabled={reg.isPending}>
            {reg.isPending ? "註冊中..." : "立即註冊"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          已有帳號？{" "}
          <a href="/dayone/portal/login" className="text-amber-600 font-medium hover:underline">立即登入</a>
        </p>
      </div>
    </div>
  );
}

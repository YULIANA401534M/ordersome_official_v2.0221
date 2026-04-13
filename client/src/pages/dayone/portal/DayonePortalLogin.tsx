import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const LIFF_ID = "2009700774-rWyJ27md";

export default function DayonePortalLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [liffLoading, setLiffLoading] = useState(false);

  const loginMut = trpc.dayone.portal.loginWithLine.useMutation({
    onSuccess: () => navigate("/dayone/portal"),
    onError: (e) => toast.error(e.message),
  });

  // Email/password login via existing auth
  const pwdLogin = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => navigate("/dayone/portal"),
    onError: (e) => toast.error(e.message),
  });

  async function handleLineLogin() {
    setLiffLoading(true);
    try {
      const liff = (window as any).liff;
      if (!liff) { toast.error("LIFF SDK 未載入"); return; }
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      const profile = await liff.getProfile();
      loginMut.mutate({
        lineUserId: profile.userId,
        lineName: profile.displayName,
        lineAvatarUrl: profile.pictureUrl,
      });
    } catch (e: any) {
      toast.error(e.message ?? "LINE 登入失敗");
    } finally {
      setLiffLoading(false);
    }
  }

  function handlePwdLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pwd) { toast.error("請填寫 Email 和密碼"); return; }
    pwdLogin.mutate({ email, pwd });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <p className="text-4xl font-black text-amber-500">🥚</p>
          <h1 className="text-2xl font-bold text-amber-600">大永蛋品</h1>
          <p className="text-sm text-gray-500">客戶登入</p>
        </div>

        <Tabs defaultValue="line">
          <TabsList className="w-full bg-amber-50 border border-amber-100">
            <TabsTrigger value="line" className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              LINE 登入
            </TabsTrigger>
            <TabsTrigger value="pwd" className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              帳號密碼
            </TabsTrigger>
          </TabsList>

          <TabsContent value="line" className="mt-4">
            <Button
              className="w-full h-12 bg-[#06C755] hover:bg-[#05a847] text-white font-semibold text-base gap-2"
              disabled={liffLoading || loginMut.isPending}
              onClick={handleLineLogin}>
              {liffLoading || loginMut.isPending
                ? "登入中..."
                : <><span className="text-xl">LINE</span> 使用 LINE 登入</>}
            </Button>
          </TabsContent>

          <TabsContent value="pwd" className="mt-4">
            <form onSubmit={handlePwdLogin} className="space-y-3">
              <Input type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <Input type="password" placeholder="密碼" value={pwd}
                onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" />
              <Button type="submit" className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                disabled={pwdLogin.isPending}>
                {pwdLogin.isPending ? "登入中..." : "登入"}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-3">
              還沒有帳號？{" "}
              <a href="/dayone/portal/register" className="text-amber-600 font-medium hover:underline">立即註冊</a>
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

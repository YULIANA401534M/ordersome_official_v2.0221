import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Users, Building2, Mail, Lock, ArrowLeft, Chrome } from "lucide-react";
import { getLoginUrl } from "../const";
import { trackEvent } from "../components/Analytics";

export default function Login() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.loginWithPassword.useMutation();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      // Track login event in GA4
      if (result?.user) {
        trackEvent('login', {
          method: 'email',
          user_role: result.user.role || 'unknown',
          permissions: (result.user as any).permissions?.join(',') || 'none',
        });
      }
      
      // Smart redirect: customer → /shop, internal roles → /dashboard
      const role = result?.user?.role ?? "customer";
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get("redirect");
      if (redirectParam) {
        window.location.href = redirectParam;
      } else if (role === "customer") {
        window.location.href = "/shop";
      } else {
        // super_admin, manager, franchisee, staff → dashboard
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "登入失敗，請檢查帳號密碼");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Back to Home */}
        <a
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          返回首頁
        </a>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Google OAuth for Customers */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-blue-50 to-white border-r border-gray-200">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  一般會員登入
                </h2>
                <p className="text-gray-600 mb-8">
                  適用於一般顧客、線上商城購物、會員專區
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8 flex-grow">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">快速註冊</p>
                      <p className="text-sm text-gray-600">使用 Google 帳號一鍵登入</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">線上購物</p>
                      <p className="text-sm text-gray-600">瀏覽商品、下單、查詢訂單</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">會員專屬</p>
                      <p className="text-sm text-gray-600">享受會員優惠和專屬服務</p>
                    </div>
                  </div>
                </div>

                {/* Google Login Button */}
                <a
                  href="/api/oauth/google/start?redirect=/shop"
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-xl border-2 border-gray-300 transition-all hover:border-blue-500 hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <Chrome className="h-6 w-6 text-blue-600" />
                  使用 Google 帳號登入
                </a>
                {/* LINE Login Button */}
                <a
                  href="/api/oauth/line/start?redirect=/shop"
                  className="w-full mt-3 bg-[#06C755] hover:bg-[#05a847] text-white font-semibold py-4 px-6 rounded-xl border-2 border-[#06C755] transition-all hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  使用 LINE 帳號登入
                </a>
                <p className="text-xs text-gray-500 text-center mt-4">
                  首次登入將自動建立會員帳號
                </p>
              </div>
            </div>

            {/* Right Side - Email/Password for Franchisees */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-amber-50 to-white">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="h-8 w-8 text-amber-600" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  加盟主 / 員工登入
                </h2>
                <p className="text-gray-600 mb-8">
                  適用於加盟主、管理員、內部員工專用
                </p>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">加盟主專區</p>
                      <p className="text-sm text-gray-600">訂單管理、庫存查詢、營運報表</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">訂貨系統</p>
                      <p className="text-sm text-gray-600">快速訂購商品和原物料</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">管理後台</p>
                      <p className="text-sm text-gray-600">管理員可訪問完整後台功能</p>
                    </div>
                  </div>
                </div>

                {/* Email/Password Form */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4 flex-grow flex flex-col justify-end">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      電子郵件
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        <Lock className="inline h-4 w-4 mr-2" />
                        密碼
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        忘記密碼？
                      </a>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                  >
                    {isLoading ? "登入中..." : "登入"}
                  </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  帳號由管理員建立，如有問題請聯絡總部
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            <strong>提示：</strong>一般顧客請使用左側 Google 或 LINE 登入，加盟主和員工請使用右側帳號密碼登入
          </p>
        </div>
      </div>
    </div>
  );
}

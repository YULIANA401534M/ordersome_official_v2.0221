import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await requestResetMutation.mutateAsync({ email });
      setIsSubmitted(true);
      // In development, show the reset link
      if (result.resetLink) {
        setResetLink(result.resetLink);
      }
    } catch (err: any) {
      setError(err.message || "發生錯誤，請稍後再試");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <a
            href="/login"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回登入
          </a>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                已發送重設密碼連結
              </h2>
              <p className="text-gray-600 mb-8">
                如果該電子郵件存在於我們的系統中，您將收到一封包含密碼重設連結的郵件。請檢查您的信箱（包含垃圾郵件資料夾）。
              </p>

              {resetLink && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    開發模式：重設連結
                  </p>
                  <a
                    href={resetLink}
                    className="text-sm text-amber-700 hover:text-amber-900 break-all underline"
                  >
                    {resetLink}
                  </a>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>沒有收到郵件？</p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-amber-600 hover:text-amber-700 font-medium mt-2"
                >
                  重新發送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a
          href="/login"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          返回登入
        </a>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-amber-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            忘記密碼？
          </h2>
          <p className="text-gray-600 mb-8">
            請輸入您的電子郵件地址，我們將發送密碼重設連結給您。
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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

            <button
              type="submit"
              disabled={requestResetMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            >
              {requestResetMutation.isPending ? "發送中..." : "發送重設連結"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              記得密碼了？
              <a href="/login" className="text-amber-600 hover:text-amber-700 font-medium ml-1">
                返回登入
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

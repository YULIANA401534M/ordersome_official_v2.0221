import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Mail, CheckCircle, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

export default function CompleteProfile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Parse ?next= and ?welcome= from URL
  const params = new URLSearchParams(window.location.search);
  const nextPath = params.get("next") || "/shop";
  const isWelcome = params.get("welcome") === "1";

  const utils = trpc.useUtils();
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("資料已儲存！歡迎加入來點什麼 🎉", { duration: 3000 });
      setTimeout(() => setLocation(nextPath), 500);
    },
    onError: (err) => {
      setError(err.message || "儲存失敗，請稍後再試");
      setIsSubmitting(false);
    },
  });

  // Pre-fill name from LINE profile if available
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) {
      // Already has email, redirect directly
      setLocation(nextPath);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("請輸入 Email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("請輸入有效的 Email 格式"); return; }
    setIsSubmitting(true);
    updateProfile.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
    });
  };

  const handleSkip = () => {
    setLocation(nextPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4A017] to-[#E8B84B] px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isWelcome ? "🎉 歡迎加入！" : "補充帳號資料"}
            </h1>
            <p className="text-amber-100 mt-2 text-sm">
              請填寫您的 Email，以便接收訂單通知與會員優惠
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {isWelcome && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium text-sm">LINE 帳號登入成功</p>
                  <p className="text-green-600 text-xs mt-0.5">帳號已建立，請補充 Email 以完善資料</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <User className="inline w-4 h-4 mr-1 text-gray-400" />
                  姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="您的姓名（選填）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Mail className="inline w-4 h-4 mr-1 text-gray-400" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#D4A017] to-[#E8B84B] hover:from-[#C49010] hover:to-[#D4A017] text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    儲存中...
                  </span>
                ) : (
                  <>
                    儲存並繼續
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Skip */}
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition underline underline-offset-2"
              >
                稍後再填
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          您的個人資料受到保護，不會對外公開
        </p>
      </div>
    </div>
  );
}

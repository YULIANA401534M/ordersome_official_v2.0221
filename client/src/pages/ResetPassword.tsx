import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "../lib/trpc";
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");

  const verifyTokenQuery = trpc.auth.verifyResetToken.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false }
  );

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    if (verifyTokenQuery.error) {
      setTokenError(verifyTokenQuery.error.message);
    }
  }, [verifyTokenQuery.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    if (newPassword.length < 6) {
      setError("密碼至少需要 6 個字元");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token: token || "",
        newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "密碼重設失敗，請稍後再試");
    }
  };

  // Token is invalid or expired
  if (tokenError) {
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
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                重設連結無效或已過期
              </h2>
              <p className="text-gray-600 mb-8">
                {tokenError}
              </p>

              <a
                href="/forgot-password"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg text-center"
              >
                重新申請密碼重設
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password reset successful
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                密碼重設成功！
              </h2>
              <p className="text-gray-600 mb-8">
                您的密碼已成功更新，現在可以使用新密碼登入。
              </p>

              <a
                href="/login"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg text-center"
              >
                前往登入
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (verifyTokenQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">驗證重設連結...</p>
        </div>
      </div>
    );
  }

  // Reset password form
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
            <Lock className="h-8 w-8 text-amber-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            設定新密碼
          </h2>
          <p className="text-gray-600 mb-8">
            {verifyTokenQuery.data?.email && (
              <span className="font-medium">{verifyTokenQuery.data.email}</span>
            )}
            <br />
            請輸入您的新密碼
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                新密碼
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="至少 6 個字元"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                確認新密碼
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="再次輸入新密碼"
              />
            </div>

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            >
              {resetPasswordMutation.isPending ? "重設中..." : "重設密碼"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

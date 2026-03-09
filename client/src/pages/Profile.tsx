import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { User, Mail, Phone, MapPin, Save, ArrowLeft, Settings, Briefcase, UserCog, KeyRound } from "lucide-react";
import { trackEvent } from "../components/Analytics";
import ChangePasswordDialog from "../components/ChangePasswordDialog";

// Helper function to safely check if user has a specific permission
const hasPermission = (user: any, permission: string): boolean => {
  if (!user || !user.permissions) return false;
  
  // Handle both string (JSON) and array formats
  let permissions: string[] = [];
  if (typeof user.permissions === 'string') {
    try {
      permissions = JSON.parse(user.permissions);
    } catch (e) {
      console.error('[Profile] Failed to parse permissions:', e);
      return false;
    }
  } else if (Array.isArray(user.permissions)) {
    permissions = user.permissions;
  }
  
  return permissions.includes(permission);
};

export default function Profile() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    phone: "",
    address: "",
    shippingAddress: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('[Profile] User data loaded:', user);
      console.log('[Profile] User role:', user.role);
      console.log('[Profile] User permissions:', user.permissions);
      setFormData({
        name: user.name || "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        shippingAddress: user.shippingAddress || "",
      });
    }
  }, [user]);

  // Track login event for OAuth users (when user data is first loaded)
  useEffect(() => {
    if (user && !sessionStorage.getItem('login_tracked')) {
      trackEvent('login', {
        method: 'oauth',
        user_role: user.role || 'unknown',
        permissions: (user as any).permissions?.join(',') || 'none',
      });
      sessionStorage.setItem('login_tracked', 'true');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    try {
      await updateProfileMutation.mutateAsync(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "更新失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">請先登入</p>
          <a href="/login" className="text-amber-600 hover:underline">
            前往登入
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <a
          href="/"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          返回首頁
        </a>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">個人資料</h1>
              <p className="text-gray-600">
                角色：
                {user.role === "super_admin" || user?.role === "manager" && "管理員"}
                {user.role === "franchisee" && "加盟主"}
                {user.role === "customer" && "一般會員"}
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              個人資料更新成功！
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Backend Access Buttons */}
          {user && (user.role === "super_admin" || user.role === "manager" || user.role === "franchisee" || user.role === "staff") && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                後台管理入口
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Admin Dashboard */}
                {(user.role === "super_admin" || user.role === "manager") && (
                  <a
                    href="/dashboard/admin/users"
                    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition border border-blue-200 hover:border-blue-400"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCog className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">管理員後台</h3>
                      <p className="text-sm text-gray-600">用戶管理、內容管理</p>
                    </div>
                  </a>
                )}

                {/* Franchise Dashboard */}
                {user.role === "franchisee" && (
                  <a
                    href="/dashboard/franchise"
                    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition border border-green-200 hover:border-green-400"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">加盟主專區</h3>
                      <p className="text-sm text-gray-600">門市管理、SOP 文件</p>
                    </div>
                  </a>
                )}

                {/* Staff Dashboard */}
                {user.role === "staff" && (
                  <a
                    href="/dashboard/staff"
                    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition border border-purple-200 hover:border-purple-400"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">員工專區</h3>
                      <p className="text-sm text-gray-600">設備維修、工作表單</p>
                    </div>
                  </a>
                )}

                {/* Content Management (if has permission) */}
                {hasPermission(user, "publish_content") && (
                  <a
                    href="/dashboard/content"
                    className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition border border-amber-200 hover:border-amber-400"
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Settings className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">內容管理</h3>
                      <p className="text-sm text-gray-600">新聞文章、部落格</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                電子郵件
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">電子郵件無法修改</p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                顯示名稱
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="您的名稱"
              />
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                真實姓名
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="用於訂單和收據"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                聯絡電話
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0912-345-678"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                聯絡地址
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="您的聯絡地址"
              />
            </div>

            {/* Shipping Address */}
            <div>
              <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                預設收件地址
              </label>
              <textarea
                id="shippingAddress"
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="用於線上商城訂單配送"
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                {updateProfileMutation.isPending ? "儲存中..." : "儲存變更"}
              </button>
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="flex-1 sm:flex-none border border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="h-5 w-5" />
                修改密碼
              </button>
            </div>
          </form>

          {/* Logout Button */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <a
              href="/api/auth/logout"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              登出帳號
            </a>
          </div>
        </div>
      </div>
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  );
}

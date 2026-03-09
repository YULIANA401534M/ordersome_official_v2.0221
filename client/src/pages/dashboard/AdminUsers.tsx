import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Users, Shield, Mail, Phone, Building2, Edit2, RefreshCw, Search, Filter, BarChart3, TrendingUp, UserPlus, Trash2, X } from "lucide-react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";

type UserRole = "super_admin" | "manager" | "franchisee" | "staff" | "customer";
type UserStatus = "active" | "suspended";

const PERMISSIONS = [
  { key: "view_finance", label: "查看財務報表" },
  { key: "manage_users", label: "管理用戶" },
  { key: "manage_franchise", label: "管理加盟主" },
  { key: "publish_content", label: "發布內容" },
  { key: "manage_sop", label: "管理 SOP" },
  { key: "manage_products", label: "管理商城商品" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "超級管理員",
  manager: "經理",
  franchisee: "加盟主",
  staff: "員工",
  customer: "顧客",
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  manager: "bg-blue-100 text-blue-800",
  franchisee: "bg-orange-100 text-orange-800",
  staff: "bg-green-100 text-green-800",
  customer: "bg-gray-100 text-gray-800",
};

/** 只有當前登入者為 super_admin 時才顯示操作按鈕 */
function canShowActions(currentUserRole: string | undefined) {
  return currentUserRole === "super_admin";
}

/** 渲染權限標籤（橫向排列） */
function PermissionBadges({ permissions }: { permissions: string[] }) {
  if (!permissions || permissions.length === 0) {
    return <span className="text-xs text-gray-400">無特殊權限</span>;
  }
  return (
    <div className="flex flex-row flex-wrap gap-1 items-start">
      {permissions.map((perm) => (
        <span
          key={perm}
          className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded whitespace-nowrap"
        >
          {PERMISSIONS.find((p) => p.key === perm)?.label || perm}
        </span>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    name: "",
    password: "",
    role: "customer" as UserRole,
    phone: "",
    storeId: "",
  });

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      refetch();
      utils.auth.me.invalidate();
      setEditingUser(null);
    },
  });
  const resetPasswordMutation = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      alert("密碼已重設為 YuLian888!");
    },
  });
  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      refetch();
      setCreatingUser(false);
      setNewUserData({ email: "", name: "", password: "", role: "customer", phone: "", storeId: "" });
      alert("用戶建立成功！");
    },
    onError: (error) => alert(error.message || "建立失敗"),
  });
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { refetch(); alert("用戶已刪除！"); },
    onError: (error) => alert(error.message || "刪除失敗"),
  });

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUpdateUser = (userId: number, updates: any) => {
    updateUserMutation.mutate({ userId, ...updates });
  };

  const handleResetPassword = (userId: number) => {
    if (confirm("確定要重設此用戶的密碼為 YuLian888! 嗎？")) {
      resetPasswordMutation.mutate({ userId });
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.email || !newUserData.name || !newUserData.password) {
      alert("請填寫 Email、姓名和密碼");
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`確定要刪除用戶「${userName}」嗎？此操作無法復原！`)) {
      deleteUserMutation.mutate({ userId });
    }
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">載入中...</div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                  用戶管理
                </h1>
                <p className="mt-1 text-sm sm:text-base text-gray-600">管理所有用戶的角色、權限和帳號狀態</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCreatingUser(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  新增用戶
                </button>
                <a
                  href="/dashboard/admin/permissions"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Shield className="w-4 h-4" />
                  權限管理
                </a>
              </div>
            </div>
          </div>

          {/* Traffic & Marketing Intelligence */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm p-6 mb-6 border border-purple-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              流量與行銷情報
            </h2>
            <p className="text-gray-600 mb-6">快速訪問專業分析工具，掌握網站流量和 SEO 表現</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-5 bg-white rounded-lg shadow-sm border border-gray-200 opacity-50 cursor-not-allowed pointer-events-none" title="尚未開放">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-500 text-lg">📊 即時流量分析 (GA4)</h3>
                  <p className="text-sm text-gray-400">查看即時訪客、頁面瀏覽量、轉換率</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">即將推出</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-white rounded-lg shadow-sm border border-gray-200 opacity-50 cursor-not-allowed pointer-events-none" title="尚未開放">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-500 text-lg">🔍 SEO 表現分析</h3>
                  <p className="text-sm text-gray-400">監控搜尋排名、點擊率、索引狀態</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">即將推出</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋姓名或 Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">所有角色</option>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── 桌面版 Table（md 以上顯示） ── */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">用戶</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[240px]">權限</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 align-top">
                    {/* 用戶 */}
                    <td className="px-6 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(user.name || user.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name || "未設定"}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {user.email || "無 Email"}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* 角色 */}
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${ROLE_BADGE_COLORS[user.role as UserRole] || "bg-gray-100 text-gray-800"}`}>
                        {ROLE_LABELS[user.role as UserRole] || user.role}
                      </span>
                    </td>
                    {/* 狀態 */}
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.status === "active" ? "啟用" : "停用"}
                      </span>
                    </td>
                    {/* 權限 — min-w 確保橫向排列 */}
                    <td className="px-6 py-3 min-w-[240px]">
                      <PermissionBadges permissions={user.permissions || []} />
                    </td>
                    {/* 操作 — 僅登入者為 super_admin 才顯示 */}
                    <td className="px-6 py-3 text-sm font-medium">
                      {isSuperAdmin ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                            <Edit2 className="w-4 h-4" />編輯
                          </button>
                          {user.passwordHash && (
                            <button onClick={() => handleResetPassword(user.id)} className="text-orange-600 hover:text-orange-900 inline-flex items-center gap-1">
                              <RefreshCw className="w-4 h-4" />重設密碼
                            </button>
                          )}
                          <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                            <Trash2 className="w-4 h-4" />刪除
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 手機版 Cards（md 以下顯示） ── */}
          <div className="md:hidden space-y-3">
            {filteredUsers?.map((user: any) => (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                {/* 用戶資訊 */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {(user.name || user.email || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user.name || "未設定"}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {user.email || "無 Email"}
                    </div>
                    {user.phone && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* 角色 + 狀態 */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${ROLE_BADGE_COLORS[user.role as UserRole] || "bg-gray-100 text-gray-800"}`}>
                    {ROLE_LABELS[user.role as UserRole] || user.role}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.status === "active" ? "啟用" : "停用"}
                  </span>
                </div>

                {/* 權限 */}
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1 font-medium">權限</div>
                  <PermissionBadges permissions={user.permissions || []} />
                </div>

                {/* 操作 — 僅登入者為 super_admin 才顯示 */}
                {isSuperAdmin && (
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100 flex-wrap">
                    <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-900 text-sm inline-flex items-center gap-1">
                      <Edit2 className="w-4 h-4" />編輯
                    </button>
                    {user.passwordHash && (
                      <button onClick={() => handleResetPassword(user.id)} className="text-orange-600 hover:text-orange-900 text-sm inline-flex items-center gap-1">
                        <RefreshCw className="w-4 h-4" />重設密碼
                      </button>
                    )}
                    <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-red-600 hover:text-red-900 text-sm inline-flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />刪除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  編輯用戶：{editingUser.name || editingUser.email}
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                  <input type="text" value={editingUser.name || ""} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />Email</label>
                  <input type="email" value={editingUser.email || ""} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Phone className="w-4 h-4" />電話</label>
                  <input type="tel" value={editingUser.phone || ""} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} placeholder="0912-345-678" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">帳號狀態</label>
                  <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="active">啟用</option>
                    <option value="suspended">停用</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">細緻權限</label>
                  <div className="space-y-2">
                    {PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingUser.permissions?.includes(perm.key) || false}
                          onChange={(e) => {
                            const currentPerms = editingUser.permissions || [];
                            const newPerms = e.target.checked ? [...currentPerms, perm.key] : currentPerms.filter((p: string) => p !== perm.key);
                            setEditingUser({ ...editingUser, permissions: newPerms });
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {(editingUser.role === "franchisee" || editingUser.role === "staff") && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4" />門市編號</label>
                    <input type="text" value={editingUser.storeId || ""} onChange={(e) => setEditingUser({ ...editingUser, storeId: e.target.value })} placeholder="例如：TC001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button onClick={() => setEditingUser(null)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">取消</button>
                  <button
                    onClick={() => handleUpdateUser(editingUser.id, { name: editingUser.name, email: editingUser.email, phone: editingUser.phone, role: editingUser.role, status: editingUser.status, permissions: editingUser.permissions || [], storeId: editingUser.storeId })}
                    disabled={updateUserMutation.isPending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updateUserMutation.isPending ? "儲存中..." : "儲存變更"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {creatingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-green-600" />新增用戶
                  </h2>
                  <button onClick={() => setCreatingUser(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />Email *</label>
                    <input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} placeholder="user@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
                    <input type="text" value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })} placeholder="請輸入姓名" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">密碼 *</label>
                    <input type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} placeholder="至少 6 個字元" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                    <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Phone className="w-4 h-4" />電話</label>
                    <input type="tel" value={newUserData.phone} onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })} placeholder="0912-345-678" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  {(newUserData.role === "franchisee" || newUserData.role === "staff") && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4" />門市編號</label>
                      <input type="text" value={newUserData.storeId} onChange={(e) => setNewUserData({ ...newUserData, storeId: e.target.value })} placeholder="例如：TC001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                    </div>
                  )}
                  <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => setCreatingUser(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">取消</button>
                    <button onClick={handleCreateUser} disabled={createUserMutation.isPending} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                      {createUserMutation.isPending ? "建立中..." : "建立用戶"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminDashboardLayout>
  );
}

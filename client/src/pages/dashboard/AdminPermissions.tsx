import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Shield, Search, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { useAuth } from "../../_core/hooks/useAuth";

// Available system permissions
const AVAILABLE_PERMISSIONS = [
  { id: "view_finance",      label: "查看財務報表",   description: "可查看營收、成本等財務數據" },
  { id: "manage_users",      label: "管理用戶",       description: "可編輯用戶資料、角色、權限" },
  { id: "manage_franchise",  label: "管理加盟主",     description: "可管理加盟門市資料" },
  { id: "publish_content",   label: "發布內容",       description: "可建立和發布新聞文章" },
  { id: "manage_products",   label: "管理商品與訂單", description: "可新增、編輯、下架商品，及查看訂單" },
  { id: "manage_sop",        label: "管理 SOP",       description: "負責員工專區 SOP 的編輯與刪除" },
];

const FRANCHISEE_FEATURES = [
  { key: "daily_report_readonly", label: "門市日報（唯讀）" },
  { key: "purchasing_readonly",   label: "叫貨紀錄（唯讀）" },
  { key: "product_pricing",       label: "品項批價" },
  { key: "profit_overview",       label: "損益概況" },
  { key: "ar_summary",            label: "帳款往來" },
  { key: "contract_documents",    label: "合約文件" },
] as const;

function FlagToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none cursor-pointer ${checked ? "bg-amber-600" : "bg-gray-200"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

export default function AdminPermissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  // Track pending flag changes: userId → featureKey → isEnabled
  const [pendingFlags, setPendingFlags] = useState<Record<number, Record<string, boolean>>>({});

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const utils = trpc.useUtils();
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      refetch();
      utils.auth.me.invalidate();
      setEditingUser(null);
    },
  });
  const setFlagMutation = trpc.admin.setFranchiseeFlag.useMutation({
    onSuccess: () => { allFlagsQuery.refetch(); },
  });

  // Load all franchisee flags for the quick-edit section
  const allFlagsQuery = trpc.admin.getAllFranchiseeFlags.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditPermissions = (user: any) => {
    setEditingUser(user);
    let permissions: string[] = [];
    if (typeof user.permissions === "string") {
      try { permissions = JSON.parse(user.permissions); } catch { permissions = []; }
    } else if (Array.isArray(user.permissions)) {
      permissions = user.permissions;
    }
    setSelectedPermissions(permissions);
  };

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    try {
      await updateUserMutation.mutateAsync({ userId: editingUser.id, permissions: selectedPermissions });
      await refetch();
      setEditingUser(null);
      setSelectedPermissions([]);
    } catch (error: any) {
      alert(error.message || "更新權限失敗");
    }
  };

  const handleFlagToggle = async (userId: number, featureKey: string, newVal: boolean) => {
    await setFlagMutation.mutateAsync({ userId, featureKey: featureKey as any, isEnabled: newVal });
  };

  const getFlagValue = (userId: number, featureKey: string, serverFlags: Record<string, boolean>) => {
    // Pending local state takes priority
    return pendingFlags[userId]?.[featureKey] ?? serverFlags[featureKey] ?? false;
  };

  const getPermissionBadges = (permissions: any) => {
    let permissionList: string[] = [];
    if (typeof permissions === "string") {
      try { permissionList = JSON.parse(permissions); } catch { permissionList = []; }
    } else if (Array.isArray(permissions)) {
      permissionList = permissions;
    }
    if (permissionList.length === 0) {
      return <span className="text-gray-400 text-sm">無特殊權限</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {permissionList.map((perm) => {
          const permInfo = AVAILABLE_PERMISSIONS.find((p) => p.id === perm);
          return (
            <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {permInfo?.label || perm}
            </span>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">載入中...</div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="py-4">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">權限管理</h1>
            </div>
            <p className="text-gray-600">管理所有用戶的細緻權限設定</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋姓名或 Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有角色</option>
                <option value="super_admin">超級管理員</option>
                <option value="manager">管理者</option>
                <option value="franchisee">加盟主</option>
                <option value="store_manager">門市店長</option>
                <option value="staff">員工</option>
                <option value="customer">一般會員</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">系統權限</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.name || "未設定"}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {user.role === "super_admin"   && "超級管理員"}
                          {user.role === "manager"       && "管理者"}
                          {user.role === "franchisee"    && "加盟主"}
                          {user.role === "store_manager" && "門市店長"}
                          {user.role === "staff"         && "員工"}
                          {user.role === "customer"      && "一般會員"}
                          {user.role === "driver"        && "司機"}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getPermissionBadges(user.permissions)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleEditPermissions(user)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                          編輯權限
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 加盟主個別功能設定（super_admin only） ── */}
          {isSuperAdmin && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                <div className="flex items-center gap-2">
                  <ToggleRight className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">加盟主個別功能設定</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">直接控制每位加盟主可存取的功能模組，變更即時生效</p>
              </div>

              {allFlagsQuery.isLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
              ) : allFlagsQuery.data?.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">目前沒有加盟主帳號</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {allFlagsQuery.data?.map(({ user, flags }) => (
                    <div key={user.id} className="px-6 py-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-700 font-semibold text-sm">
                            {(user.name || user.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{user.name || "未設定"}</div>
                          <div className="text-xs text-gray-500">{user.email}{user.storeId ? ` · ${user.storeId}` : ""}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {FRANCHISEE_FEATURES.map((feat) => {
                          const enabled = getFlagValue(user.id, feat.key, flags);
                          const isSaving = setFlagMutation.isPending;
                          return (
                            <div
                              key={feat.key}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition ${enabled ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}
                            >
                              <span className="text-xs text-gray-600 leading-tight">{feat.label}</span>
                              <FlagToggle
                                checked={enabled}
                                onChange={(v) => handleFlagToggle(user.id, feat.key, v)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Permissions Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">編輯系統權限</h2>
                    <p className="text-sm text-gray-600 mt-1">{editingUser.name} ({editingUser.email})</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTogglePermission(permission.id)}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedPermissions.includes(permission.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                            {selectedPermissions.includes(permission.id) && <Check className="h-4 w-4 text-white" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{permission.label}</div>
                          <div className="text-sm text-gray-600">{permission.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                  <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">取消</button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={updateUserMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updateUserMutation.isPending ? "儲存中..." : "儲存"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminDashboardLayout>
  );
}

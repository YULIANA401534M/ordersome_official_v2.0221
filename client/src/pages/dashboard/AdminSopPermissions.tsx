import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Users, BookOpen, ChevronRight, Check, X,
  Loader2, RefreshCw, User, Tag
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  staff: "員工 (Staff)",
  franchisee: "門市夥伴 (Franchisee)",
  manager: "區域主管 (Manager)",
};

type TargetMode = "role" | "user";

export default function AdminSopPermissions() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "manager";

  const [targetMode, setTargetMode] = useState<TargetMode>("role");
  const [selectedRole, setSelectedRole] = useState<string>("staff");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 暫存當前編輯的分類勾選狀態
  const [checkedCategoryIds, setCheckedCategoryIds] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading, refetch } = trpc.sop.getSopPermissions.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  // 當 data 載入完成或目標變更時，重新載入權限
  useEffect(() => {
    if (data) loadPermissionsForTarget(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, targetMode, selectedRole, selectedUserId]);

  const updatePermissions = trpc.sop.updateSopPermissions.useMutation({
    onSuccess: () => {
      toast.success("權限已儲存！");
      setIsDirty(false);
      refetch();
    },
    onError: (err) => toast.error("儲存失敗：" + err.message),
  });

  // 載入目標的現有權限到 checkedCategoryIds
  const loadPermissionsForTarget = (d: typeof data) => {
    if (!d) return;
    const { permissions } = d;
    let targetPerms = permissions.filter(
      (p) => p.scopeType === "category" && p.isGranted
    );
    if (targetMode === "role") {
      targetPerms = targetPerms.filter(
        (p) => p.targetType === "role" && p.targetRole === selectedRole
      );
    } else {
      targetPerms = targetPerms.filter(
        (p) => p.targetType === "user" && p.targetUserId === selectedUserId
      );
    }
    const ids = new Set(targetPerms.map((p) => p.categoryId).filter(Boolean) as number[]);
    setCheckedCategoryIds(ids);
    setIsDirty(false);
  };

  const handleTargetChange = (mode: TargetMode, role?: string, userId?: number) => {
    setTargetMode(mode);
    if (mode === "role" && role) setSelectedRole(role);
    if (mode === "user" && userId) setSelectedUserId(userId);
    setIsDirty(false);
    // 重新載入對應目標的權限
    if (!data) return;
    const { permissions } = data;
    let targetPerms = permissions.filter(
      (p) => p.scopeType === "category" && p.isGranted
    );
    if (mode === "role" && role) {
      targetPerms = targetPerms.filter(
        (p) => p.targetType === "role" && p.targetRole === role
      );
    } else if (mode === "user" && userId) {
      targetPerms = targetPerms.filter(
        (p) => p.targetType === "user" && p.targetUserId === userId
      );
    }
    const ids = new Set(targetPerms.map((p) => p.categoryId).filter(Boolean) as number[]);
    setCheckedCategoryIds(ids);
  };

  const toggleCategory = (catId: number) => {
    setCheckedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
    setIsDirty(true);
  };

  const handleSelectAll = () => {
    if (!data) return;
    setCheckedCategoryIds(new Set(data.categories.map((c) => c.id)));
    setIsDirty(true);
  };

  const handleClearAll = () => {
    setCheckedCategoryIds(new Set());
    setIsDirty(true);
  };

  const handleSave = () => {
    const grants = Array.from(checkedCategoryIds).map((catId) => ({
      scopeType: "category" as const,
      categoryId: catId,
      isGranted: true,
    }));
    updatePermissions.mutate({
      targetType: targetMode,
      targetRole: targetMode === "role" ? selectedRole : undefined,
      targetUserId: targetMode === "user" ? (selectedUserId ?? undefined) : undefined,
      grants,
    });
  };

  if (!isSuperAdmin) {
    return (
      <AdminDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Shield className="w-16 h-16 text-red-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">無存取權限</h2>
          <p className="text-gray-500 mt-2">此頁面僅限超級管理員使用</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton className="-ml-2" />
          <Shield className="w-6 h-6 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SOP 知識庫 — 存取權限管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">設定不同角色或特定用戶可存取的 SOP 分類</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：目標選擇 */}
            <div className="lg:col-span-1 space-y-4">
              {/* 角色選擇 */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">依角色設定</h3>
                </div>
                <div className="space-y-2">
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <button
                      key={role}
                      onClick={() => handleTargetChange("role", role)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                        targetMode === "role" && selectedRole === role
                          ? "bg-indigo-50 border-2 border-indigo-400 text-indigo-700 font-semibold"
                          : "bg-gray-50 border-2 border-transparent text-gray-700 hover:border-gray-200"
                      }`}
                    >
                      <span>{label}</span>
                      {targetMode === "role" && selectedRole === role && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 用戶選擇 */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">依用戶設定</h3>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(data?.users ?? [])
                    .filter((u) => u.role !== "super_admin")
                    .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleTargetChange("user", undefined, u.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                          targetMode === "user" && selectedUserId === u.id
                            ? "bg-purple-50 border-2 border-purple-400 text-purple-700 font-semibold"
                            : "bg-gray-50 border-2 border-transparent text-gray-700 hover:border-gray-200"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="truncate font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-gray-400 truncate">{u.role}</p>
                        </div>
                      </button>
                    ))}
                  {(data?.users ?? []).filter((u) => u.role !== "super_admin").length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">尚無用戶</p>
                  )}
                </div>
              </div>
            </div>

            {/* 右側：分類勾選 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      可存取的 SOP 分類
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      目前設定對象：
                      {targetMode === "role" ? (
                        <Badge variant="outline" className="ml-1 text-indigo-600 border-indigo-300">
                          {ROLE_LABELS[selectedRole] ?? selectedRole}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-1 text-purple-600 border-purple-300">
                          {data?.users.find((u) => u.id === selectedUserId)?.name ?? `用戶 #${selectedUserId}`}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleSelectAll} className="text-xs">
                      全選
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClearAll} className="text-xs">
                      全清
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { refetch(); loadPermissionsForTarget(data); }}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* 分類清單 */}
                <div className="space-y-2 mb-5">
                  {(data?.categories ?? []).length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">尚未建立任何 SOP 分類</p>
                    </div>
                  ) : (
                    (data?.categories ?? []).map((cat) => {
                      const isChecked = checkedCategoryIds.has(cat.id);
                      const docCount = (data?.documents ?? []).filter(
                        (d) => d.categoryId === cat.id
                      ).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                            isChecked
                              ? "bg-green-50 border-green-400"
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isChecked ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            {isChecked ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isChecked ? "text-green-800" : "text-gray-700"}`}>
                              {cat.icon && <span className="mr-1">{cat.icon}</span>}
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{cat.description}</p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs flex-shrink-0 ${isChecked ? "border-green-300 text-green-700" : "border-gray-300 text-gray-500"}`}
                          >
                            {docCount} 份文件
                          </Badge>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* 說明 */}
                <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
                  <strong>注意：</strong>若未設定任何權限（空白），系統預設允許存取所有分類。若勾選特定分類，則僅允許存取已勾選的分類。
                </div>

                {/* 儲存按鈕 */}
                <Button
                  onClick={handleSave}
                  disabled={updatePermissions.isPending || !isDirty}
                  className={`w-full py-3 font-semibold rounded-xl ${
                    isDirty
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {updatePermissions.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Shield className="w-5 h-5 mr-2" />
                  )}
                  {isDirty ? "儲存權限設定" : "尚未修改"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

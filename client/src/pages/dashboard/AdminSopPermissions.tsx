import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, Users, BookOpen, ChevronRight, Check, X,
  Loader2, RefreshCw, User, Tag
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  staff:      "員工 (Staff)",
  franchisee: "門市夥伴 (Franchisee)",
  manager:    "區域主管 (Manager)",
};

type TargetMode = "role" | "user";

export default function AdminSopPermissions() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "manager";

  const [targetMode, setTargetMode] = useState<TargetMode>("role");
  const [selectedRole, setSelectedRole] = useState<string>("staff");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [checkedCategoryIds, setCheckedCategoryIds] = useState<Set<number>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading, refetch } = trpc.sop.getSopPermissions.useQuery(undefined, { enabled: isSuperAdmin });

  useEffect(() => {
    if (data) loadPermissionsForTarget(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, targetMode, selectedRole, selectedUserId]);

  const updatePermissions = trpc.sop.updateSopPermissions.useMutation({
    onSuccess: () => { toast.success("權限已儲存！"); setIsDirty(false); refetch(); },
    onError: (err) => toast.error("儲存失敗：" + err.message),
  });

  const loadPermissionsForTarget = (d: typeof data) => {
    if (!d) return;
    const { permissions } = d;
    let targetPerms = permissions.filter((p) => p.scopeType === "category" && p.isGranted);
    if (targetMode === "role") {
      targetPerms = targetPerms.filter((p) => p.targetType === "role" && p.targetRole === selectedRole);
    } else {
      targetPerms = targetPerms.filter((p) => p.targetType === "user" && p.targetUserId === selectedUserId);
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
    if (!data) return;
    const { permissions } = data;
    let targetPerms = permissions.filter((p) => p.scopeType === "category" && p.isGranted);
    if (mode === "role" && role) {
      targetPerms = targetPerms.filter((p) => p.targetType === "role" && p.targetRole === role);
    } else if (mode === "user" && userId) {
      targetPerms = targetPerms.filter((p) => p.targetType === "user" && p.targetUserId === userId);
    }
    const ids = new Set(targetPerms.map((p) => p.categoryId).filter(Boolean) as number[]);
    setCheckedCategoryIds(ids);
  };

  const toggleCategory = (catId: number) => {
    setCheckedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
    setIsDirty(true);
  };

  const handleSelectAll = () => { if (!data) return; setCheckedCategoryIds(new Set(data.categories.map((c) => c.id))); setIsDirty(true); };
  const handleClearAll = () => { setCheckedCategoryIds(new Set()); setIsDirty(true); };

  const handleSave = () => {
    const grants = Array.from(checkedCategoryIds).map((catId) => ({ scopeType: "category" as const, categoryId: catId, isGranted: true }));
    updatePermissions.mutate({
      targetType: targetMode,
      targetRole: targetMode === "role" ? selectedRole : undefined,
      targetUserId: targetMode === "user" ? (selectedUserId ?? undefined) : undefined,
      grants,
    });
  };

  const currentTarget = targetMode === "role"
    ? (ROLE_LABELS[selectedRole] ?? selectedRole)
    : (data?.users.find((u) => u.id === selectedUserId)?.name ?? `用戶 #${selectedUserId}`);

  if (!isSuperAdmin) {
    return (
      <AdminDashboardLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--os-text-3)" }}>
          <Shield style={{ width: 56, height: 56, color: "var(--os-danger)", marginBottom: 16, opacity: 0.4 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)" }}>無存取權限</h2>
          <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 6 }}>此頁面僅限超級管理員使用</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <BackButton className="-ml-2" />
            <Shield style={{ width: 20, height: 20, color: "var(--os-amber)" }} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>SOP 知識庫 — 存取權限管理</h1>
              <p style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 2 }}>設定不同角色或特定用戶可存取的 SOP 分類</p>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <Loader2 style={{ width: 32, height: 32, color: "var(--os-amber)" }} className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left: Target Selection */}
              <div className="lg:col-span-1 space-y-4">

                {/* By Role */}
                <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <Tag style={{ width: 15, height: 15, color: "var(--os-amber)" }} />
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>依角色設定</h3>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(ROLE_LABELS).map(([role, label]) => {
                      const active = targetMode === "role" && selectedRole === role;
                      return (
                        <button key={role} onClick={() => handleTargetChange("role", role)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                            border: `2px solid ${active ? "var(--os-amber)" : "transparent"}`,
                            background: active ? "var(--os-amber-soft)" : "var(--os-surface-2)",
                            color: active ? "var(--os-amber-text)" : "var(--os-text-2)", fontWeight: active ? 700 : 400,
                            transition: "all 0.15s",
                          }}>
                          <span>{label}</span>
                          {active && <ChevronRight style={{ width: 15, height: 15 }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* By User */}
                <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <User style={{ width: 15, height: 15, color: "var(--os-info)" }} />
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>依用戶設定</h3>
                  </div>
                  <div style={{ maxHeight: 192, overflowY: "auto" }} className="space-y-1">
                    {(data?.users ?? []).filter((u) => u.role !== "super_admin").map((u) => {
                      const active = targetMode === "user" && selectedUserId === u.id;
                      return (
                        <button key={u.id} onClick={() => handleTargetChange("user", undefined, u.id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                            border: `2px solid ${active ? "var(--os-info)" : "transparent"}`,
                            background: active ? "var(--os-info-bg)" : "var(--os-surface-2)",
                            color: active ? "var(--os-info)" : "var(--os-text-2)", fontWeight: active ? 700 : 400,
                            transition: "all 0.15s", textAlign: "left",
                          }}>
                          <Users style={{ width: 13, height: 13, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--os-text-3)" }}>{u.role}</p>
                          </div>
                        </button>
                      );
                    })}
                    {(data?.users ?? []).filter((u) => u.role !== "super_admin").length === 0 && (
                      <p style={{ fontSize: 12, color: "var(--os-text-3)", textAlign: "center", padding: "16px 0" }}>尚無用戶</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Category Selection */}
              <div className="lg:col-span-2">
                <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--os-text-1)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <BookOpen style={{ width: 16, height: 16, color: "var(--os-amber)" }} />可存取的 SOP 分類
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 4 }}>
                        目前設定對象：
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, marginLeft: 4, color: "var(--os-amber-text)", background: "var(--os-amber-soft)" }}>
                          {currentTarget}
                        </span>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="outline" onClick={handleSelectAll} className="text-xs">全選</Button>
                      <Button size="sm" variant="outline" onClick={handleClearAll} className="text-xs">全清</Button>
                      <Button size="sm" variant="outline" onClick={() => { refetch(); loadPermissionsForTarget(data); }} className="text-xs">
                        <RefreshCw style={{ width: 12, height: 12 }} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2" style={{ marginBottom: 20 }}>
                    {(data?.categories ?? []).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--os-text-3)" }}>
                        <BookOpen style={{ width: 36, height: 36, margin: "0 auto 8px", opacity: 0.3 }} />
                        <p style={{ fontSize: 13 }}>尚未建立任何 SOP 分類</p>
                      </div>
                    ) : (
                      (data?.categories ?? []).map((cat) => {
                        const isChecked = checkedCategoryIds.has(cat.id);
                        const docCount = (data?.documents ?? []).filter((d) => d.categoryId === cat.id).length;
                        return (
                          <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                              borderRadius: 8, border: `2px solid ${isChecked ? "var(--os-success)" : "var(--os-border)"}`,
                              background: isChecked ? "var(--os-success-bg)" : "var(--os-surface-2)",
                              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                            }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isChecked ? "var(--os-success)" : "var(--os-border)" }}>
                              {isChecked
                                ? <Check style={{ width: 13, height: 13, color: "#fff" }} />
                                : <X style={{ width: 13, height: 13, color: "#fff" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isChecked ? "var(--os-success)" : "var(--os-text-1)" }}>
                                {cat.icon && <span style={{ marginRight: 4 }}>{cat.icon}</span>}{cat.name}
                              </p>
                              {cat.description && (
                                <p style={{ margin: 0, fontSize: 11, color: "var(--os-text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.description}</p>
                              )}
                            </div>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, flexShrink: 0, color: isChecked ? "var(--os-success)" : "var(--os-text-3)", background: isChecked ? "var(--os-surface)" : "var(--os-bg)", border: "1px solid", borderColor: isChecked ? "var(--os-success)" : "var(--os-border)" }}>
                              {docCount} 份文件
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div style={{ background: "var(--os-amber-soft)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "var(--os-amber-text)" }}>
                    <strong>注意：</strong>若未設定任何權限（空白），系統預設允許存取所有分類。若勾選特定分類，則僅允許存取已勾選的分類。
                  </div>

                  <button onClick={handleSave} disabled={updatePermissions.isPending || !isDirty}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: isDirty ? "pointer" : "not-allowed",
                      background: isDirty ? "var(--os-amber)" : "var(--os-surface-2)", color: isDirty ? "#fff" : "var(--os-text-3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.15s",
                      opacity: (updatePermissions.isPending || !isDirty) ? 0.7 : 1,
                    }}>
                    {updatePermissions.isPending
                      ? <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />儲存中...</>
                      : <><Shield style={{ width: 18, height: 18 }} />{isDirty ? "儲存權限設定" : "尚未修改"}</>}
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

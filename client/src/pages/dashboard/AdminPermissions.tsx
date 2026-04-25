import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Shield, Search, Check, ToggleRight } from "lucide-react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../_core/hooks/useAuth";

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

const thSt: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--os-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" };
const inputSt: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid var(--os-border)", borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };

function FlagToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      style={{
        position: "relative", display: "inline-flex", width: 36, height: 20, flexShrink: 0,
        borderRadius: 10, border: "none", cursor: "pointer",
        background: checked ? "var(--os-amber)" : "var(--os-surface-2)",
        transition: "background 0.2s",
      }}>
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
      }} />
    </button>
  );
}

const ROLE_DISPLAY: Record<string, string> = {
  super_admin: "超級管理員", manager: "管理者", franchisee: "加盟主",
  store_manager: "門市店長", staff: "員工", customer: "一般會員", driver: "司機",
};

export default function AdminPermissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [pendingFlags, setPendingFlags] = useState<Record<number, Record<string, boolean>>>({});

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const utils = trpc.useUtils();
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => { refetch(); utils.auth.me.invalidate(); setEditingUser(null); },
  });
  const setFlagMutation = trpc.admin.setFranchiseeFlag.useMutation({
    onSuccess: () => { allFlagsQuery.refetch(); },
  });

  const allFlagsQuery = trpc.admin.getAllFranchiseeFlags.useQuery(undefined, { enabled: isSuperAdmin });

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

  const getFlagValue = (userId: number, featureKey: string, serverFlags: Record<string, boolean>) =>
    pendingFlags[userId]?.[featureKey] ?? serverFlags[featureKey] ?? false;

  const getPermissionBadges = (permissions: any) => {
    let permissionList: string[] = [];
    if (typeof permissions === "string") {
      try { permissionList = JSON.parse(permissions); } catch { permissionList = []; }
    } else if (Array.isArray(permissions)) {
      permissionList = permissions;
    }
    if (permissionList.length === 0) {
      return <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>無特殊權限</span>;
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {permissionList.map((perm) => {
          const permInfo = AVAILABLE_PERMISSIONS.find((p) => p.id === perm);
          return (
            <span key={perm} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--os-info-bg)", color: "var(--os-info)" }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "var(--os-text-3)", fontSize: 14 }}>
          載入中...
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield style={{ width: 20, height: 20, color: "var(--os-amber)" }} />權限管理
          </h1>
          <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>管理所有用戶的細緻權限設定</p>
        </div>

        {/* Filters */}
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: "14px 16px" }}>
          <div className="grid md:grid-cols-2 gap-3">
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--os-text-3)" }} />
              <input type="text" placeholder="搜尋姓名或 Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputSt, paddingLeft: 34 }} />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inputSt, appearance: "none" }}>
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
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["用戶", "角色", "系統權限", "操作"].map(h => <th key={h} style={thSt}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                  style={{ borderBottom: "1px solid var(--os-border-2)", transition: "background 0.12s" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>{user.name || "未設定"}</div>
                    <div style={{ fontSize: 12, color: "var(--os-text-3)" }}>{user.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--os-surface-2)", color: "var(--os-text-2)", fontWeight: 600 }}>
                      {ROLE_DISPLAY[user.role] ?? user.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>{getPermissionBadges(user.permissions)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => handleEditPermissions(user)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--os-info)" }}>
                      編輯權限
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Franchisee feature flags (super_admin only) */}
        {isSuperAdmin && (
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--os-border)", background: "var(--os-amber-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ToggleRight style={{ width: 18, height: 18, color: "var(--os-amber-text)" }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>加盟主個別功能設定</h2>
              </div>
              <p style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 4 }}>直接控制每位加盟主可存取的功能模組，變更即時生效</p>
            </div>

            {allFlagsQuery.isLoading ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>載入中...</div>
            ) : allFlagsQuery.data?.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>目前沒有加盟主帳號</div>
            ) : (
              <div>
                {allFlagsQuery.data?.map(({ user, flags }: { user: any; flags: any }) => (
                  <div key={user.id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--os-border-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--os-amber-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "var(--os-amber-text)", fontWeight: 700, fontSize: 13 }}>
                          {(user.name || user.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>{user.name || "未設定"}</div>
                        <div style={{ fontSize: 11, color: "var(--os-text-3)" }}>{user.email}{user.storeId ? ` · ${user.storeId}` : ""}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {FRANCHISEE_FEATURES.map((feat) => {
                        const enabled = getFlagValue(user.id, feat.key, flags);
                        return (
                          <div key={feat.key} style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                            padding: "8px 10px", borderRadius: 8, border: "1px solid",
                            borderColor: enabled ? "var(--os-amber-soft)" : "var(--os-border)",
                            background: enabled ? "var(--os-amber-soft)" : "var(--os-surface-2)",
                            textAlign: "center", transition: "all 0.15s",
                          }}>
                            <span style={{ fontSize: 11, color: "var(--os-text-2)", lineHeight: 1.3 }}>{feat.label}</span>
                            <FlagToggle checked={enabled} onChange={(v) => handleFlagToggle(user.id, feat.key, v)} />
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
      </div>

      {/* Edit Permissions Modal */}
      <Dialog open={!!editingUser} onOpenChange={v => { if (!v) setEditingUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--os-text-1)" }}>編輯系統權限</DialogTitle>
            {editingUser && <p style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 2 }}>{editingUser.name} ({editingUser.email})</p>}
          </DialogHeader>
          <div className="space-y-3 py-2">
            {AVAILABLE_PERMISSIONS.map((permission) => {
              const active = selectedPermissions.includes(permission.id);
              return (
                <div key={permission.id}
                  onClick={() => handleTogglePermission(permission.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                    border: "1px solid", borderColor: active ? "var(--os-amber)" : "var(--os-border)",
                    borderRadius: 8, cursor: "pointer", background: active ? "var(--os-amber-soft)" : "var(--os-surface-2)",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: "2px solid", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", borderColor: active ? "var(--os-amber)" : "var(--os-border)", background: active ? "var(--os-amber)" : "transparent" }}>
                    {active && <Check style={{ width: 13, height: 13, color: "#fff" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>{permission.label}</div>
                    <div style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 2 }}>{permission.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
            <Button style={{ background: "var(--os-amber)", color: "#fff" }} onClick={handleSavePermissions} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import {
  Users, Shield, Mail, Phone, Building2, Edit2, RefreshCw,
  Search, Filter, BarChart3, TrendingUp, UserPlus, Trash2, X, ShoppingCart, Clock,
} from "lucide-react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { useAuth } from "../../_core/hooks/useAuth";

type UserRole = "super_admin" | "manager" | "franchisee" | "staff" | "store_manager" | "customer" | "driver" | "portal_customer";
type UserStatus = "active" | "suspended";

const PERMISSIONS = [
  { key: "view_finance", label: "查看財務報表" },
  { key: "manage_users", label: "管理用戶" },
  { key: "manage_franchise", label: "管理加盟主" },
  { key: "publish_content", label: "發布內容" },
  { key: "manage_sop", label: "管理 SOP" },
  { key: "manage_products", label: "管理商城商品" },
];

const FRANCHISEE_FEATURES = [
  { key: "daily_report_readonly", label: "門市日報（唯讀）" },
  { key: "purchasing_readonly",   label: "叫貨紀錄（唯讀）" },
  { key: "product_pricing",       label: "品項批價" },
  { key: "profit_overview",       label: "損益概況" },
  { key: "ar_summary",            label: "帳款往來" },
  { key: "contract_documents",    label: "合約文件" },
] as const;

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:     "超級管理員",
  manager:         "管理者",
  franchisee:      "加盟主",
  staff:           "員工",
  store_manager:   "門市店長",
  customer:        "顧客",
  driver:          "司機",
  portal_customer: "客戶 Portal",
};

const ROLE_BADGE: Record<UserRole, { color: string; bg: string }> = {
  super_admin:     { color: "var(--os-danger)",   bg: "var(--os-danger-bg)" },
  manager:         { color: "var(--os-info)",      bg: "var(--os-info-bg)" },
  franchisee:      { color: "var(--os-amber-text)",bg: "var(--os-amber-soft)" },
  staff:           { color: "var(--os-success)",   bg: "var(--os-success-bg)" },
  store_manager:   { color: "var(--os-success)",   bg: "var(--os-success-bg)" },
  customer:        { color: "var(--os-text-3)",    bg: "var(--os-surface-2)" },
  driver:          { color: "var(--os-warning)",   bg: "var(--os-warning-bg)" },
  portal_customer: { color: "var(--os-text-3)",    bg: "var(--os-surface-2)" },
};

const EDITABLE_ROLES: UserRole[] = ["super_admin", "manager", "franchisee", "store_manager", "staff"];

const thSt: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--os-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" };
const inputSt: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid var(--os-border)", borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };
const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--os-text-2)", display: "block", marginBottom: 6 };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_BADGE[role] ?? { color: "var(--os-text-3)", bg: "var(--os-surface-2)" };
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: "nowrap" }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function PermissionBadges({ permissions }: { permissions: string[] }) {
  if (!permissions || permissions.length === 0) {
    return <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>無特殊權限</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {permissions.map((perm) => (
        <span key={perm} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--os-info-bg)", color: "var(--os-info)", whiteSpace: "nowrap" }}>
          {PERMISSIONS.find((p) => p.key === perm)?.label || perm}
        </span>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative", display: "inline-flex", width: 36, height: 20, flexShrink: 0,
        borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "var(--os-amber)" : "var(--os-surface-2)",
        opacity: disabled ? 0.4 : 1, transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
      }} />
    </button>
  );
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "", name: "", pwd: "", role: "customer" as UserRole, phone: "", storeId: "",
  });
  const [franchiseeFlags, setFranchiseeFlags] = useState<Record<string, boolean>>({});

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const utils = trpc.useUtils();

  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => { refetch(); utils.auth.me.invalidate(); setEditingUser(null); },
  });
  const resetPasswordMutation = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => { alert("密碼已重設為 YuLian888!"); },
  });
  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      refetch();
      setCreatingUser(false);
      setNewUserData({ email: "", name: "", pwd: "", role: "customer", phone: "", storeId: "" });
      alert("用戶建立成功！");
    },
    onError: (error) => alert(error.message || "建立失敗"),
  });
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { refetch(); alert("用戶已刪除！"); },
    onError: (error) => alert(error.message || "刪除失敗"),
  });
  const setFlagMutation = trpc.admin.setFranchiseeFlag.useMutation();

  const { data: loadedFlags } = trpc.admin.getFranchiseeFlags.useQuery(
    { userId: editingUser?.id ?? 0 },
    { enabled: !!editingUser && editingUser.role === "franchisee" }
  );

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenEdit = (user: any) => { setEditingUser(user); setFranchiseeFlags({}); };

  const handleUpdateUser = async () => {
    const updates: any = {
      name: editingUser.name, email: editingUser.email, role: editingUser.role,
      status: editingUser.status, permissions: editingUser.permissions || [],
      has_procurement_access: !!editingUser.has_procurement_access,
    };
    if (editingUser.phone) updates.phone = editingUser.phone;
    if (editingUser.storeId) updates.storeId = editingUser.storeId;
    updateUserMutation.mutate({ userId: editingUser.id, ...updates });
    if (editingUser.role === "franchisee") {
      for (const [featureKey, isEnabled] of Object.entries(franchiseeFlags)) {
        await setFlagMutation.mutateAsync({ userId: editingUser.id, featureKey: featureKey as any, isEnabled: !!isEnabled });
      }
    }
  };

  const handleResetPassword = (userId: number) => {
    if (confirm("確定要重設此用戶的密碼為 YuLian888! 嗎？")) resetPasswordMutation.mutate({ userId });
  };

  const handleCreateUser = () => {
    if (!newUserData.email || !newUserData.name || !newUserData.pwd) { alert("請填寫 Email、姓名和密碼"); return; }
    createUserMutation.mutate(newUserData);
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`確定要刪除用戶「${userName}」嗎？此操作無法復原！`)) deleteUserMutation.mutate({ userId });
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Users style={{ width: 20, height: 20, color: "var(--os-amber)" }} />用戶管理
            </h1>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>管理所有用戶的角色、權限和帳號狀態</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && (
              <button onClick={() => setCreatingUser(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, ...amberBtn }}>
                <UserPlus style={{ width: 15, height: 15 }} />新增用戶
              </button>
            )}
            <a href="/dashboard/admin/permissions"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--os-info-bg)", color: "var(--os-info)", textDecoration: "none" }}>
              <Shield style={{ width: 15, height: 15 }} />權限管理
            </a>
          </div>
        </div>

        {/* Traffic & Marketing Intelligence */}
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: "20px 24px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 style={{ width: 18, height: 18, color: "var(--os-amber)" }} />流量與行銷情報
          </h2>
          <p style={{ fontSize: 13, color: "var(--os-text-3)", marginBottom: 16 }}>快速訪問專業分析工具，掌握網站流量和 SEO 表現</p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: <TrendingUp style={{ width: 22, height: 22, color: "var(--os-text-3)" }} />, title: "即時流量分析 (GA4)", desc: "查看即時訪客、頁面瀏覽量、轉換率" },
              { icon: <BarChart3   style={{ width: 22, height: 22, color: "var(--os-text-3)" }} />, title: "SEO 表現分析",       desc: "監控搜尋排名、點擊率、索引狀態" },
            ].map(c => (
              <div key={c.title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--os-surface-2)", borderRadius: 10, border: "1px solid var(--os-border)", opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--os-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-2)" }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 2 }}>{c.desc}</div>
                  <span style={{ fontSize: 11, color: "var(--os-text-3)", background: "var(--os-bg)", padding: "2px 8px", borderRadius: 10, marginTop: 6, display: "inline-block" }}>即將推出</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: "14px 16px" }}>
          <div className="grid md:grid-cols-2 gap-3">
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--os-text-3)" }} />
              <input type="text" placeholder="搜尋姓名或 Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputSt, paddingLeft: 34 }} />
            </div>
            <div style={{ position: "relative" }}>
              <Filter style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--os-text-3)", pointerEvents: "none" }} />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
                style={{ ...inputSt, paddingLeft: 34, appearance: "none" }}>
                <option value="all">所有角色</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block" style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["用戶", "角色", "狀態", "所屬門市", "最後登入", "採購權限", "系統權限", "操作"].map(h => (
                  <th key={h} style={thSt}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user: any) => (
                <tr key={user.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                  style={{ borderBottom: "1px solid var(--os-border-2)", verticalAlign: "top", transition: "background 0.12s" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--os-amber-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "var(--os-amber-text)", fontWeight: 700, fontSize: 13 }}>
                          {(user.name || user.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>{user.name || "未設定"}</div>
                        <div style={{ fontSize: 12, color: "var(--os-text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Mail style={{ width: 11, height: 11 }} />{user.email || "無 Email"}
                        </div>
                        {user.phone && <div style={{ fontSize: 12, color: "var(--os-text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone style={{ width: 11, height: 11 }} />{user.phone}
                        </div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><RoleBadge role={user.role as UserRole} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: user.status === "active" ? "var(--os-success)" : "var(--os-danger)", background: user.status === "active" ? "var(--os-success-bg)" : "var(--os-danger-bg)" }}>
                      {user.status === "active" ? "啟用" : "停用"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--os-text-2)" }}>
                    {user.storeId
                      ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 style={{ width: 12, height: 12 }} />{user.storeId}</span>
                      : <span style={{ color: "var(--os-text-3)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--os-text-3)" }}>
                    {user.last_login_at
                      ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock style={{ width: 12, height: 12 }} />{new Date(user.last_login_at).toLocaleDateString("zh-TW")}</span>
                      : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {user.has_procurement_access
                      ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--os-amber-text)", background: "var(--os-amber-soft)", padding: "2px 8px", borderRadius: 4 }}>
                          <ShoppingCart style={{ width: 11, height: 11 }} />開啟
                        </span>
                      : <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}><PermissionBadges permissions={user.permissions || []} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    {isSuperAdmin ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => handleOpenEdit(user)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-info)" }}>
                          <Edit2 style={{ width: 14, height: 14 }} />編輯
                        </button>
                        {user.passwordHash && (
                          <button onClick={() => handleResetPassword(user.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-warning)" }}>
                            <RefreshCw style={{ width: 14, height: 14 }} />重設密碼
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(user.id, user.name)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-danger)" }}>
                          <Trash2 style={{ width: 14, height: 14 }} />刪除
                        </button>
                      </div>
                    ) : <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredUsers?.map((user: any) => (
            <div key={user.id} style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--os-amber-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "var(--os-amber-text)", fontWeight: 700, fontSize: 13 }}>{(user.name || user.email || "?")[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>{user.name || "未設定"}</div>
                  <div style={{ fontSize: 12, color: "var(--os-text-3)", display: "flex", alignItems: "center", gap: 4 }}><Mail style={{ width: 11, height: 11 }} />{user.email || "無 Email"}</div>
                  {user.phone && <div style={{ fontSize: 12, color: "var(--os-text-3)", display: "flex", alignItems: "center", gap: 4 }}><Phone style={{ width: 11, height: 11 }} />{user.phone}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <RoleBadge role={user.role as UserRole} />
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: user.status === "active" ? "var(--os-success)" : "var(--os-danger)", background: user.status === "active" ? "var(--os-success-bg)" : "var(--os-danger-bg)" }}>
                  {user.status === "active" ? "啟用" : "停用"}
                </span>
                {user.has_procurement_access && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--os-amber-text)", background: "var(--os-amber-soft)", padding: "2px 8px", borderRadius: 4 }}>
                    <ShoppingCart style={{ width: 11, height: 11 }} />採購
                  </span>
                )}
              </div>
              <div style={{ marginBottom: 8 }}><PermissionBadges permissions={user.permissions || []} /></div>
              {isSuperAdmin && (
                <div style={{ display: "flex", gap: 12, paddingTop: 8, borderTop: "1px solid var(--os-border-2)", flexWrap: "wrap" }}>
                  <button onClick={() => handleOpenEdit(user)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-info)" }}><Edit2 style={{ width: 14, height: 14 }} />編輯</button>
                  {user.passwordHash && (
                    <button onClick={() => handleResetPassword(user.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-warning)" }}><RefreshCw style={{ width: 14, height: 14 }} />重設密碼</button>
                  )}
                  <button onClick={() => handleDeleteUser(user.id, user.name)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-danger)" }}><Trash2 style={{ width: 14, height: 14 }} />刪除</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "var(--os-surface)", borderRadius: 12, padding: 28, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <Shield style={{ width: 18, height: 18, color: "var(--os-amber)" }} />編輯用戶：{editingUser.name || editingUser.email}
              </h2>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-3)" }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div className="space-y-4">
              {[
                { label: "姓名", key: "name", type: "text" },
                { label: "Email", key: "email", type: "email", readOnly: true },
                { label: "電話", key: "phone", type: "tel", placeholder: "0912-345-678" },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelSt}>{f.label}</label>
                  <input type={f.type} value={(editingUser as any)[f.key] || ""} readOnly={f.readOnly}
                    placeholder={(f as any).placeholder}
                    onChange={!f.readOnly ? (e) => setEditingUser({ ...editingUser, [f.key]: e.target.value }) : undefined}
                    style={{ ...inputSt, background: f.readOnly ? "var(--os-surface-2)" : "var(--os-surface)", color: f.readOnly ? "var(--os-text-3)" : "var(--os-text-1)", cursor: f.readOnly ? "not-allowed" : "text" }} />
                </div>
              ))}

              <div>
                <label style={labelSt}>角色</label>
                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })} style={inputSt}>
                  {EDITABLE_ROLES.map((key) => <option key={key} value={key}>{ROLE_LABELS[key]}</option>)}
                </select>
              </div>

              {(editingUser.role === "franchisee" || editingUser.role === "staff" || editingUser.role === "store_manager") && (
                <div>
                  <label style={labelSt}><Building2 style={{ width: 13, height: 13, display: "inline", marginRight: 4 }} />所屬門市編號</label>
                  <input type="text" value={editingUser.storeId || ""} onChange={(e) => setEditingUser({ ...editingUser, storeId: e.target.value })} placeholder="例如：TC001（留空表示不指定）" style={inputSt} />
                </div>
              )}

              {(editingUser.role === "manager" || editingUser.role === "super_admin") && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--os-amber-soft)", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)", display: "flex", alignItems: "center", gap: 6 }}>
                      <ShoppingCart style={{ width: 14, height: 14, color: "var(--os-amber-text)" }} />採購存取權
                    </div>
                    <div style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 2 }}>開啟後可進入叫貨管理模組</div>
                  </div>
                  <Toggle checked={!!editingUser.has_procurement_access} onChange={(v) => setEditingUser({ ...editingUser, has_procurement_access: v })} />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--os-surface-2)", borderRadius: 8, border: "1px solid var(--os-border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>帳號狀態</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>{editingUser.status === "active" ? "啟用中" : "已停用"}</span>
                  <Toggle checked={editingUser.status === "active"} onChange={(v) => setEditingUser({ ...editingUser, status: v ? "active" : "suspended" })} />
                </div>
              </div>

              {editingUser.passwordHash && (
                <button type="button" onClick={() => handleResetPassword(editingUser.id)} disabled={resetPasswordMutation.isPending}
                  style={{ width: "100%", padding: "8px 0", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-warning)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <RefreshCw style={{ width: 14, height: 14 }} />重設密碼（重設為 YuLian888!）
                </button>
              )}

              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)", marginBottom: 10 }}>系統細粒權限</p>
                <div className="space-y-2">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox"
                        checked={editingUser.permissions?.includes(perm.key) || false}
                        onChange={(e) => {
                          const cur = editingUser.permissions || [];
                          const next = e.target.checked ? [...cur, perm.key] : cur.filter((p: string) => p !== perm.key);
                          setEditingUser({ ...editingUser, permissions: next });
                        }}
                        style={{ width: 15, height: 15, accentColor: "var(--os-amber)" }} />
                      <span style={{ fontSize: 13, color: "var(--os-text-1)" }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingUser.role === "franchisee" && (
                <div style={{ border: "1px solid var(--os-amber-soft)", borderRadius: 8, padding: "14px 16px", background: "var(--os-amber-soft)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--os-amber-text)", marginBottom: 12 }}>加盟主功能開關</p>
                  <div className="space-y-3">
                    {FRANCHISEE_FEATURES.map((feat) => (
                      <div key={feat.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "var(--os-text-1)" }}>{feat.label}</span>
                        <Toggle
                          checked={!!(loadedFlags ? (loadedFlags as any)[feat.key] : franchiseeFlags[feat.key])}
                          onChange={(v) => setFranchiseeFlags((prev) => ({ ...prev, [feat.key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button onClick={() => setEditingUser(null)} style={{ padding: "8px 20px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>取消</button>
                <button onClick={handleUpdateUser} disabled={updateUserMutation.isPending || setFlagMutation.isPending}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (updateUserMutation.isPending || setFlagMutation.isPending) ? 0.6 : 1, ...amberBtn }}>
                  {updateUserMutation.isPending ? "儲存中..." : "儲存變更"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {creatingUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "var(--os-surface)", borderRadius: 12, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--os-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus style={{ width: 18, height: 18, color: "var(--os-amber)" }} />新增用戶
              </h2>
              <button onClick={() => setCreatingUser(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-3)" }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 24 }} className="space-y-4">
              {[
                { label: "Email *", key: "email", type: "email", placeholder: "user@example.com" },
                { label: "姓名 *",  key: "name",  type: "text",  placeholder: "請輸入姓名" },
                { label: "密碼 *",  key: "pwd",   type: "password", placeholder: "至少 6 個字元" },
                { label: "電話",    key: "phone", type: "tel",  placeholder: "0912-345-678" },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelSt}>{f.label}</label>
                  <input type={f.type} value={(newUserData as any)[f.key]} placeholder={f.placeholder}
                    onChange={(e) => setNewUserData({ ...newUserData, [f.key]: e.target.value })} style={inputSt} />
                </div>
              ))}
              <div>
                <label style={labelSt}>角色</label>
                <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })} style={inputSt}>
                  {EDITABLE_ROLES.map((key) => <option key={key} value={key}>{ROLE_LABELS[key]}</option>)}
                </select>
              </div>
              {(newUserData.role === "franchisee" || newUserData.role === "staff" || newUserData.role === "store_manager") && (
                <div>
                  <label style={labelSt}><Building2 style={{ width: 13, height: 13, display: "inline", marginRight: 4 }} />所屬門市編號</label>
                  <input type="text" value={newUserData.storeId} onChange={(e) => setNewUserData({ ...newUserData, storeId: e.target.value })} placeholder="例如：TC001" style={inputSt} />
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button onClick={() => setCreatingUser(false)} style={{ padding: "8px 20px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>取消</button>
                <button onClick={handleCreateUser} disabled={createUserMutation.isPending}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: createUserMutation.isPending ? 0.6 : 1, ...amberBtn }}>
                  {createUserMutation.isPending ? "建立中..." : "建立用戶"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}

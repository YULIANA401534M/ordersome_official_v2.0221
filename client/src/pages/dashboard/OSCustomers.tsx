import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { User, FileText, CreditCard, Settings2, ChevronDown, ChevronUp, Phone, Mail } from "lucide-react";

const FEATURE_KEY_LABELS: Record<string, string> = {
  daily_report_readonly: "日報查閱",
  purchasing_readonly:   "叫貨查閱",
  product_pricing:       "品項售價",
  profit_overview:       "損益概覽",
  ar_summary:            "帳款摘要",
  contract_documents:    "合約文件",
};

const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };

export default function OSCustomers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [, navigate] = useLocation();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", pwd: "" });

  const { data: allUsers = [], refetch: refetchUsers } = trpc.admin.listUsers.useQuery();
  const franchisees = allUsers.filter((u: any) => u.role === "franchisee");

  const { data: allFlags = [] } = trpc.admin.getAllFranchiseeFlags.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  const setFlag = trpc.admin.setFranchiseeFlag.useMutation({
    onSuccess: () => toast.success("功能開關已更新"),
    onError: (e) => toast.error(e.message),
  });

  const toggleProcurement = trpc.admin.toggleProcurementAccess.useMutation({
    onSuccess: () => { toast.success("採購存取權已更新"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });

  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("加盟主帳號已建立");
      setShowCreateDialog(false);
      setCreateForm({ name: "", email: "", phone: "", pwd: "" });
      refetchUsers();
    },
    onError: (e) => toast.error(e.message),
  });

  const getFlagsForUser = (userId: number): Record<string, boolean> => {
    const entry = (allFlags as any[]).find((f: any) => f.user?.id === userId);
    return entry?.flags ?? {};
  };

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>加盟主管理</h1>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>共 {franchisees.length} 位加盟主</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => setShowCreateDialog(true)} className="text-white" style={amberBtn}>
              + 新增加盟主
            </Button>
          )}
        </div>

        {/* Franchisee Cards */}
        {franchisees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--os-text-3)", fontSize: 13 }}>
            尚無加盟主帳號
          </div>
        ) : (
          <div className="space-y-3">
            {franchisees.map((f: any) => {
              const isExpanded = expandedId === f.id;
              const flags = getFlagsForUser(f.id);
              return (
                <div key={f.id} style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}>
                  {/* Card Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer"
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--os-amber-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User style={{ width: 16, height: 16, color: "var(--os-amber-text)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--os-text-1)" }}>{f.name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {f.email && <span className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--os-text-3)" }}><Mail style={{ width: 12, height: 12 }} />{f.email}</span>}
                          {f.phone && <span className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--os-text-3)" }}><Phone style={{ width: 12, height: 12 }} />{f.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{
                        fontSize: 12, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
                        color: f.status === "active" ? "var(--os-success)" : "var(--os-text-3)",
                        background: f.status === "active" ? "var(--os-success-bg)" : "var(--os-surface-2)",
                      }}>
                        {f.status === "active" ? "正常" : "停用"}
                      </span>
                      {isExpanded
                        ? <ChevronUp style={{ width: 16, height: 16, color: "var(--os-text-3)" }} />
                        : <ChevronDown style={{ width: 16, height: 16, color: "var(--os-text-3)" }} />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--os-border)", padding: "16px 20px", background: "var(--os-surface-2)" }} className="space-y-5">

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="text-xs gap-1.5"
                          onClick={() => navigate(`/dashboard/franchisee-payments?userId=${f.id}`)}>
                          <CreditCard className="w-3.5 h-3.5" />
                          查看帳款往來
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs gap-1.5"
                          onClick={() => navigate(`/dashboard/contracts?userId=${f.id}`)}>
                          <FileText className="w-3.5 h-3.5" />
                          合約文件
                        </Button>
                      </div>

                      {/* Feature Flags */}
                      {isSuperAdmin && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-3" style={{ fontSize: 11, fontWeight: 700, color: "var(--os-text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            <Settings2 style={{ width: 14, height: 14 }} />
                            功能開關
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(FEATURE_KEY_LABELS).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between px-3 py-2" style={{ background: "var(--os-surface)", borderRadius: 8, border: "1px solid var(--os-border)" }}>
                                <span style={{ fontSize: 13, color: "var(--os-text-1)" }}>{label}</span>
                                <Switch
                                  checked={!!flags[key]}
                                  onCheckedChange={val => setFlag.mutate({ userId: f.id, featureKey: key as any, isEnabled: val })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Procurement Access */}
                      {isSuperAdmin && (
                        <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "var(--os-surface)", borderRadius: 8, border: "1px solid var(--os-border)" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-1)" }}>採購存取權（canSeeCostModules）</div>
                            <div style={{ fontSize: 11, color: "var(--os-text-3)" }}>啟用後可見退佣/品項成本/損益</div>
                          </div>
                          <Switch
                            checked={!!f.has_procurement_access}
                            onCheckedChange={val => toggleProcurement.mutate({ userId: f.id, enabled: val })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>新增加盟主帳號</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>姓名</Label>
              <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="門市名稱或負責人" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="登入用 Email" />
            </div>
            <div>
              <Label>電話（選填）</Label>
              <Input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912345678" />
            </div>
            <div>
              <Label>初始密碼</Label>
              <Input type="password" value={createForm.pwd} onChange={e => setCreateForm(f => ({ ...f, pwd: e.target.value }))} placeholder="至少 6 字元" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button style={amberBtn} disabled={createUser.isPending}
              onClick={() => createUser.mutate({
                name: createForm.name,
                email: createForm.email,
                phone: createForm.phone || undefined,
                pwd: createForm.pwd,
                role: "franchisee",
              })}>
              {createUser.isPending ? "建立中…" : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

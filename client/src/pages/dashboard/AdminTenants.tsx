import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const inputSt: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid var(--os-border)", borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };
const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--os-text-2)", display: "block", marginBottom: 6 };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" };

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  trial: { label: "試用版", color: "var(--os-text-3)",    bg: "var(--os-surface-2)" },
  basic: { label: "基本版", color: "var(--os-info)",      bg: "var(--os-info-bg)" },
  pro:   { label: "專業版", color: "var(--os-amber-text)", bg: "var(--os-amber-soft)" },
};

export default function AdminTenants() {
  const [, navigate] = useLocation();
  const { data: tenants, isLoading, refetch } = trpc.tenant.list.useQuery();

  const getErpPath = (slug: string): string => {
    if (slug === "ordersome") return "/dashboard";
    if (slug.includes("dayone")) return "/dayone";
    return "/dayone";
  };

  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: () => { toast.success("租戶建立成功"); refetch(); setCreateOpen(false); resetCreateForm(); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMutation = trpc.tenant.update.useMutation({
    onSuccess: () => { toast.success("租戶更新成功"); refetch(); setEditOpen(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", slug: "", plan: "trial" as const });
  const [editForm, setEditForm] = useState<{
    id: number; name: string; slug: string; plan: "trial" | "basic" | "pro"; isActive: boolean;
  } | null>(null);

  const resetCreateForm = () => setCreateForm({ name: "", slug: "", plan: "trial" });

  const handleCreate = () => {
    if (!createForm.name || !createForm.slug) { toast.error("名稱和代碼為必填"); return; }
    createMutation.mutate(createForm);
  };

  const handleEdit = (tenant: any) => {
    setEditForm({ id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, isActive: tenant.isActive });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editForm) return;
    updateMutation.mutate(editForm);
  };

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>租戶管理</h1>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>管理多租戶架構中的所有品牌租戶</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 text-white" style={{ background: "var(--os-amber)", color: "#fff" }}>
            <Plus style={{ width: 16, height: 16 }} />新增租戶
          </Button>
        </div>

        {/* Tenant List */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <Loader2 style={{ width: 32, height: 32, color: "var(--os-amber)" }} className="animate-spin" />
          </div>
        ) : !tenants || tenants.length === 0 ? (
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: "64px 0", textAlign: "center" }}>
            <Building2 style={{ width: 40, height: 40, color: "var(--os-text-3)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "var(--os-text-3)" }}>尚未建立任何租戶</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant: any) => {
              const plan = PLAN_BADGE[tenant.plan] ?? PLAN_BADGE.trial;
              return (
                <div key={tenant.id}
                  style={{
                    background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20,
                    opacity: !tenant.isActive ? 0.6 : 1, transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-amber)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px oklch(0.75 0.18 70 / 0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Building2 style={{ width: 18, height: 18, color: "var(--os-amber)" }} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)" }}>{tenant.name}</span>
                      </div>
                      <code style={{ fontSize: 11, color: "var(--os-text-3)", background: "var(--os-surface-2)", padding: "2px 8px", borderRadius: 4 }}>/{tenant.slug}</code>
                    </div>
                    <button onClick={() => handleEdit(tenant)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-3)", padding: 4, borderRadius: 6 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--os-surface-2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <Pencil style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: plan.color, background: plan.bg }}>
                      {plan.label}
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: tenant.isActive ? "var(--os-success)" : "var(--os-text-3)", background: tenant.isActive ? "var(--os-success-bg)" : "var(--os-surface-2)" }}>
                      {tenant.isActive ? "啟用中" : "已停用"}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--os-text-3)", marginBottom: 14 }}>
                    ID: {tenant.id} · 建立於 {new Date(tenant.createdAt).toLocaleDateString("zh-TW")}
                  </p>
                  <button onClick={() => navigate(getErpPath(tenant.slug))}
                    style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "1px solid var(--os-border)", background: "var(--os-surface-2)", color: "var(--os-text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--os-surface-2)")}>
                    進入後台
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>新增租戶</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label style={labelSt}>租戶名稱</label>
              <input placeholder="例如：來點什麼" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>代碼（URL 識別碼）</label>
              <input placeholder="例如：ordersome" value={createForm.slug}
                onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                style={inputSt} />
              <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>只能包含小寫字母、數字和連字號</p>
            </div>
            <div>
              <label style={labelSt}>方案</label>
              <Select value={createForm.plan} onValueChange={(v) => setCreateForm({ ...createForm, plan: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">試用版</SelectItem>
                  <SelectItem value="basic">基本版</SelectItem>
                  <SelectItem value="pro">專業版</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="gap-1.5 text-white" style={{ background: "var(--os-amber)" }}>
              {createMutation.isPending && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}建立
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>編輯租戶</DialogTitle></DialogHeader>
          {editForm && (
            <div className="space-y-4 py-2">
              <div>
                <label style={labelSt}>租戶名稱</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>代碼</label>
                <input value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>方案</label>
                <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">試用版</SelectItem>
                    <SelectItem value="basic">基本版</SelectItem>
                    <SelectItem value="pro">專業版</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--os-surface-2)", borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-1)" }}>啟用狀態</span>
                <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="gap-1.5 text-white" style={{ background: "var(--os-amber)" }}>
              {updateMutation.isPending && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

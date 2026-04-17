import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const now = new Date();

  return (
    <AdminDashboardLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "jf-kamabit, sans-serif" }}>
              加盟主管理
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">共 {franchisees.length} 位加盟主</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => setShowCreateDialog(true)} className="bg-amber-700 hover:bg-amber-800 text-white">
              + 新增加盟主
            </Button>
          )}
        </div>

        {/* Franchisee Cards */}
        {franchisees.length === 0 ? (
          <div className="text-center py-20 text-stone-400">尚無加盟主帳號</div>
        ) : (
          <div className="space-y-3">
            {franchisees.map((f: any) => {
              const isExpanded = expandedId === f.id;
              const flags = getFlagsForUser(f.id);
              return (
                <div key={f.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800">{f.name}</div>
                        <div className="text-xs text-stone-500 flex items-center gap-3 mt-0.5">
                          {f.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{f.email}</span>}
                          {f.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{f.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={f.status === "active" ? "default" : "secondary"} className={f.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                        {f.status === "active" ? "正常" : "停用"}
                      </Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-stone-100 px-5 py-4 space-y-5 bg-stone-50/40">

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5"
                          onClick={() => navigate(`/dashboard/franchisee-payments?userId=${f.id}`)}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          查看帳款往來
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5"
                          onClick={() => navigate(`/dashboard/contracts?userId=${f.id}`)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          合約文件
                        </Button>
                      </div>

                      {/* Feature Flags */}
                      {isSuperAdmin && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                            <Settings2 className="w-3.5 h-3.5" />
                            功能開關
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(FEATURE_KEY_LABELS).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between bg-white rounded-lg border border-stone-200 px-3 py-2">
                                <span className="text-sm text-stone-700">{label}</span>
                                <Switch
                                  checked={!!flags[key]}
                                  onCheckedChange={(val) =>
                                    setFlag.mutate({ userId: f.id, featureKey: key as any, isEnabled: val })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Procurement Access */}
                      {isSuperAdmin && (
                        <div className="flex items-center justify-between bg-white rounded-lg border border-stone-200 px-3 py-2.5">
                          <div>
                            <div className="text-sm font-medium text-stone-700">採購存取權（canSeeCostModules）</div>
                            <div className="text-xs text-stone-400">啟用後可見退佣/品項成本/損益</div>
                          </div>
                          <Switch
                            checked={!!f.has_procurement_access}
                            onCheckedChange={(val) =>
                              toggleProcurement.mutate({ userId: f.id, enabled: val })
                            }
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
          <DialogHeader>
            <DialogTitle>新增加盟主帳號</DialogTitle>
          </DialogHeader>
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
            <Button
              className="bg-amber-700 hover:bg-amber-800 text-white"
              disabled={createUser.isPending}
              onClick={() => createUser.mutate({
                name: createForm.name,
                email: createForm.email,
                phone: createForm.phone || undefined,
                pwd: createForm.pwd,
                role: "franchisee",
              })}
            >
              {createUser.isPending ? "建立中…" : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

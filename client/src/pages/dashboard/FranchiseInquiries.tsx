import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Phone, Mail, MapPin, DollarSign, Briefcase, Save, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: "待處理",   color: "var(--os-warning)", bg: "var(--os-warning-bg)" },
  contacted:        { label: "已聯繫",   color: "var(--os-info)",    bg: "var(--os-info-bg)" },
  meeting_scheduled:{ label: "已安排會議", color: "var(--os-amber-text)", bg: "var(--os-amber-soft)" },
  completed:        { label: "已完成",   color: "var(--os-success)", bg: "var(--os-success-bg)" },
  cancelled:        { label: "已取消",   color: "var(--os-text-3)",  bg: "var(--os-surface-2)" },
};

const inputSt: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid var(--os-border)", borderRadius: 6, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };
const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--os-text-2)" };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };

function ConvertDialog({ inquiry, onClose, onSuccess }: { inquiry: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: inquiry.email ?? "", name: inquiry.name ?? "", phone: inquiry.phone ?? "", password: "" });

  const convert = trpc.franchisee.convertToFranchisee.useMutation({
    onSuccess: () => { toast.success("已建立加盟主帳號"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    convert.mutate({ inquiryId: inquiry.id, email: form.email, name: form.name, phone: form.phone || undefined, password: form.password || undefined });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>轉為正式加盟主</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {[
            { label: "姓名 *", key: "name", type: "text", required: true },
            { label: "Email *", key: "email", type: "email", required: true },
            { label: "電話", key: "phone", type: "text", required: false },
            { label: "初始密碼", key: "password", type: "password", required: false, placeholder: "留空則帳號無密碼登入" },
          ].map(f => (
            <div key={f.key}>
              <label style={labelSt}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} required={f.required}
                placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ ...inputSt, marginTop: 4 }} />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" style={amberBtn} disabled={convert.isPending}>
              {convert.isPending ? "建立中..." : "建立帳號"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FranchiseInquiries() {
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const [convertTarget, setConvertTarget] = useState<any | null>(null);

  const { data: inquiries, isLoading, refetch } = trpc.franchise.listInquiries.useQuery();

  const updateStatus = trpc.franchise.updateInquiryStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); refetch(); },
    onError: (e) => toast.error(e.message || "更新失敗"),
  });

  const updateNotes = trpc.franchise.updateInquiryNotes.useMutation({
    onSuccess: () => { toast.success("備註已儲存"); refetch(); setEditingNotes({}); },
    onError: (e) => toast.error(e.message || "儲存失敗"),
  });

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 style={{ width: 32, height: 32, color: "var(--os-amber)" }} className="animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>加盟諮詢管理</h1>
          <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>查看和管理所有加盟諮詢</p>
        </div>

        <div className="space-y-4">
          {!inquiries || inquiries.length === 0 ? (
            <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: "48px 0", textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>
              目前沒有加盟諮詢
            </div>
          ) : inquiries.map((inquiry) => {
            const sc = STATUS_CFG[inquiry.status] ?? STATUS_CFG.pending;
            return (
              <div key={inquiry.id} style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}>
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-4"
                  style={{ borderBottom: "1px solid var(--os-border-2)" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)" }}>{inquiry.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, fontWeight: 500, color: sc.color, background: sc.bg }}>
                      {sc.label}
                    </span>
                    {inquiry.status !== "completed" && inquiry.status !== "cancelled" && (
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                        style={{ color: "var(--os-success)", borderColor: "var(--os-success-bg)" }}
                        onClick={() => setConvertTarget(inquiry)}>
                        <UserPlus className="w-3.5 h-3.5" /> 轉為正式加盟主
                      </Button>
                    )}
                    <Select value={inquiry.status} onValueChange={v => updateStatus.mutate({ id: inquiry.id, status: v as any })}>
                      <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--os-text-2)" }}>
                      <Phone style={{ width: 14, height: 14 }} />{inquiry.phone}
                    </div>
                    <div className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--os-text-2)" }}>
                      <Mail style={{ width: 14, height: 14 }} />{inquiry.email}
                    </div>
                    {inquiry.location && (
                      <div className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--os-text-2)" }}>
                        <MapPin style={{ width: 14, height: 14 }} />{inquiry.location}
                      </div>
                    )}
                    {inquiry.budget && (
                      <div className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--os-text-2)" }}>
                        <DollarSign style={{ width: 14, height: 14 }} />{inquiry.budget}
                      </div>
                    )}
                  </div>
                  {inquiry.experience && (
                    <div>
                      <div className="flex items-center gap-2 mb-1" style={{ fontSize: 13, color: "var(--os-text-2)" }}>
                        <Briefcase style={{ width: 14, height: 14 }} /><span style={{ fontWeight: 600 }}>餐飲經驗：</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--os-text-2)", marginLeft: 22 }}>{inquiry.experience}</p>
                    </div>
                  )}
                  {inquiry.message && (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-2)", marginBottom: 4 }}>其他想了解的事項：</p>
                      <p style={{ fontSize: 13, color: "var(--os-text-2)" }}>{inquiry.message}</p>
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: "var(--os-text-3)" }}>提交時間：{new Date(inquiry.createdAt).toLocaleString("zh-TW")}</p>

                  {/* Notes */}
                  <div style={{ borderTop: "1px solid var(--os-border-2)", paddingTop: 16 }}>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>管理員備註：</p>
                      <Button size="sm" variant="outline" className="gap-1"
                        onClick={() => { const notes = editingNotes[inquiry.id]; if (notes !== undefined) updateNotes.mutate({ id: inquiry.id, notes }); }}
                        disabled={editingNotes[inquiry.id] === undefined}>
                        <Save className="w-4 h-4" /> 儲存備註
                      </Button>
                    </div>
                    <textarea
                      style={{ width: "100%", minHeight: 90, padding: "8px 10px", border: "1px solid var(--os-border)", borderRadius: 6, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none", resize: "none" }}
                      placeholder="新增備註..."
                      value={editingNotes[inquiry.id] !== undefined ? editingNotes[inquiry.id] : (inquiry.notes || "")}
                      onChange={e => setEditingNotes(prev => ({ ...prev, [inquiry.id]: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {convertTarget && (
        <ConvertDialog
          inquiry={convertTarget}
          onClose={() => setConvertTarget(null)}
          onSuccess={() => refetch()}
        />
      )}
    </AdminDashboardLayout>
  );
}

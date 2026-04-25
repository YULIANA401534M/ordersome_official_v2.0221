import { useState, useRef } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}
function fmtAmount(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const thSt: React.CSSProperties = { color: "var(--os-text-3)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const panelSt: React.CSSProperties = { background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };
const inputSt: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid var(--os-border)", borderRadius: 6, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };
const formAreaSt: React.CSSProperties = { background: "var(--os-surface-2)", border: "1px solid var(--os-border)", borderRadius: 8, padding: "12px 14px" };

const TABS = [
  { key: "basic",     label: "基本資料" },
  { key: "contracts", label: "合約管理" },
  { key: "payments",  label: "帳款往來" },
] as const;

function FranchiseeDetailDialog({ userId, onClose }: { userId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const detail = trpc.franchisee.franchiseeDetail.useQuery({ userId });
  const stores = trpc.store.listAll.useQuery();

  const [innerTab, setInnerTab] = useState<"basic" | "contracts" | "payments">("basic");
  const [basicForm, setBasicForm] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ paymentDate: new Date().toISOString().slice(0, 10), amount: "", direction: "receivable" as "receivable" | "paid", category: "週結帳款", note: "" });
  const [contractForm, setContractForm] = useState({ contractType: "加盟合約", signedAt: "", expiresAt: "", note: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFranchisee = trpc.franchisee.franchiseeUpdate.useMutation({
    onSuccess: () => { toast.success("已儲存"); utils.franchisee.franchiseeList.invalidate(); utils.franchisee.franchiseeDetail.invalidate({ userId }); },
    onError: (e) => toast.error(e.message),
  });

  const contractUpload = trpc.franchisee.contractUpload.useMutation({
    onSuccess: () => { toast.success("合約已上傳"); utils.franchisee.franchiseeDetail.invalidate({ userId }); setContractForm({ contractType: "加盟合約", signedAt: "", expiresAt: "", note: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const uploadPdf = trpc.storage.uploadPdf.useMutation();
  const uploadImage = trpc.storage.uploadImage.useMutation();

  const paymentUpsert = trpc.franchisee.paymentUpsert.useMutation({
    onSuccess: () => { toast.success("帳款已新增"); utils.franchisee.franchiseeDetail.invalidate({ userId }); setPaymentForm({ paymentDate: new Date().toISOString().slice(0, 10), amount: "", direction: "receivable", category: "週結帳款", note: "" }); },
    onError: (e) => toast.error(e.message),
  });

  if (detail.isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div style={{ padding: 32, textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>載入中...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const data = detail.data;
  if (!data) return null;
  const { user, contracts, payments } = data;
  const form = basicForm ?? { storeId: user.storeId ?? "", status: user.status ?? "active", has_procurement_access: !!user.has_procurement_access, internalContact: user.internalContact ?? "" };

  function saveBasic() {
    updateFranchisee.mutate({ userId, storeId: form.storeId || undefined, status: form.status, has_procurement_access: form.has_procurement_access, internalContact: form.internalContact || undefined });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const fileData = ev.target?.result as string;
      try {
        let fileUrl: string;
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const res = await uploadPdf.mutateAsync({ fileName: file.name, fileData });
          fileUrl = res.url;
        } else {
          const res = await uploadImage.mutateAsync({ fileName: file.name, fileData, contentType: file.type });
          fileUrl = res.url;
        }
        contractUpload.mutate({ userId, fileUrl, fileName: file.name, contractType: contractForm.contractType, signedAt: contractForm.signedAt || undefined, expiresAt: contractForm.expiresAt || undefined, note: contractForm.note || undefined });
      } catch (err: any) {
        toast.error(err.message || "上傳失敗");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentForm.amount) { toast.error("請填金額"); return; }
    paymentUpsert.mutate({ userId, paymentDate: paymentForm.paymentDate, amount: Number(paymentForm.amount), direction: paymentForm.direction, category: paymentForm.category, note: paymentForm.note || undefined });
  }

  const isUploading = uploadPdf.isPending || uploadImage.isPending || contractUpload.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{user.name} — 加盟主管理</DialogTitle></DialogHeader>

        {/* Inner tab switcher */}
        <div style={{ display: "flex", overflow: "hidden", borderRadius: 8, border: "1px solid var(--os-border)", background: "var(--os-surface)", width: "fit-content", marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setInnerTab(t.key)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: innerTab === t.key ? 600 : 400, background: innerTab === t.key ? "var(--os-amber)" : "transparent", color: innerTab === t.key ? "#fff" : "var(--os-text-2)", border: "none", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 基本資料 */}
        {innerTab === "basic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 pb-3" style={{ borderBottom: "1px solid var(--os-border-2)", fontSize: 13, color: "var(--os-text-2)" }}>
              <div>Email：{user.email ?? "-"}</div>
              <div>電話：{user.phone ?? "-"}</div>
              <div>建立：{fmtDate(user.createdAt)}</div>
              <div>最後登入：{fmtDate(user.last_login_at)}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-2)" }}>綁定門市</label>
                <Select value={form.storeId || "__none"} onValueChange={v => setBasicForm({ ...form, storeId: v === "__none" ? "" : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="未綁定" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">未綁定</SelectItem>
                    {(stores.data ?? []).map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-2)" }}>帳號狀態</label>
                <Select value={form.status} onValueChange={v => setBasicForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">啟用</SelectItem>
                    <SelectItem value="suspended">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-2)" }}>內部聯絡備註</label>
                <Input value={form.internalContact} onChange={e => setBasicForm({ ...form, internalContact: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="procAccess" checked={form.has_procurement_access} onChange={e => setBasicForm({ ...form, has_procurement_access: e.target.checked })} />
                <label htmlFor="procAccess" style={{ fontSize: 13, color: "var(--os-text-2)" }}>開放採購成本存取</label>
              </div>
              <div className="flex justify-end">
                <Button style={amberBtn} onClick={saveBasic} disabled={updateFranchisee.isPending}>
                  {updateFranchisee.isPending ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 合約管理 */}
        {innerTab === "contracts" && (
          <div className="space-y-4">
            <div style={formAreaSt} className="space-y-3">
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>上傳合約</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "合約類型", key: "contractType", type: "text" },
                  { label: "簽約日期", key: "signedAt",     type: "date" },
                  { label: "到期日",   key: "expiresAt",    type: "date" },
                  { label: "備註",     key: "note",         type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: "var(--os-text-3)" }}>{f.label}</label>
                    <input type={f.type} value={(contractForm as any)[f.key]}
                      onChange={e => setContractForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ ...inputSt, marginTop: 4, height: 32 }} />
                  </div>
                ))}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
              <Button size="sm" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                {isUploading ? "上傳中..." : "選擇檔案並上傳"}
              </Button>
            </div>

            {(contracts as any[]).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--os-text-3)", textAlign: "center", padding: "16px 0" }}>尚無合約記錄</p>
            ) : (
              <div style={panelSt}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                      {["合約類型","簽約日","到期日","備註","上傳者",""].map(h => <th key={h} className="px-3 py-2 text-left" style={thSt}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(contracts as any[]).map((c: any) => (
                      <tr key={c.id} style={{ borderTop: "1px solid var(--os-border-2)" }}>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-1)" }}>{c.contractType}</td>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-2)" }}>{fmtDate(c.signedAt)}</td>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-2)" }}>{fmtDate(c.expiresAt)}</td>
                        <td className="px-3 py-2 text-xs max-w-[120px] truncate" style={{ color: "var(--os-text-3)" }}>{c.note ?? "-"}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--os-text-3)" }}>{c.uploadedBy}</td>
                        <td className="px-3 py-2">
                          <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--os-info)" }}>檢視</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 帳款往來 */}
        {innerTab === "payments" && (
          <div className="space-y-4">
            <form onSubmit={addPayment} style={formAreaSt} className="space-y-3">
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>新增帳款</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 12, color: "var(--os-text-3)" }}>日期</label>
                  <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))} style={{ ...inputSt, marginTop: 4, height: 32 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--os-text-3)" }}>金額</label>
                  <input type="number" step="0.01" value={paymentForm.amount} placeholder="0" onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} style={{ ...inputSt, marginTop: 4, height: 32 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--os-text-3)" }}>類型</label>
                  <Select value={paymentForm.direction} onValueChange={v => setPaymentForm(p => ({ ...p, direction: v as any }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receivable">應收</SelectItem>
                      <SelectItem value="paid">已付</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--os-text-3)" }}>類別</label>
                  <input value={paymentForm.category} onChange={e => setPaymentForm(p => ({ ...p, category: e.target.value }))} style={{ ...inputSt, marginTop: 4, height: 32 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--os-text-3)" }}>備註</label>
                <input value={paymentForm.note} onChange={e => setPaymentForm(p => ({ ...p, note: e.target.value }))} style={{ ...inputSt, marginTop: 4, height: 32 }} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" style={amberBtn} disabled={paymentUpsert.isPending}>
                  {paymentUpsert.isPending ? "新增中..." : "新增"}
                </Button>
              </div>
            </form>

            {(payments as any[]).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--os-text-3)", textAlign: "center", padding: "16px 0" }}>尚無帳款紀錄</p>
            ) : (
              <div style={panelSt}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                      {["日期","金額","類型","類別","備註"].map(h => <th key={h} className="px-3 py-2 text-left" style={thSt}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(payments as any[]).map((p: any) => (
                      <tr key={p.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-2)" }}>{fmtDate(p.paymentDate)}</td>
                        <td className="px-3 py-2 font-semibold" style={{ color: "var(--os-text-1)" }}>{fmtAmount(p.amount)}</td>
                        <td className="px-3 py-2">
                          <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, fontWeight: 500, color: p.direction === "receivable" ? "var(--os-info)" : "var(--os-success)", background: p.direction === "receivable" ? "var(--os-info-bg)" : "var(--os-success-bg)" }}>
                            {p.direction === "receivable" ? "應收" : "已付"}
                          </span>
                        </td>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-2)" }}>{p.category}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--os-text-3)" }}>{p.note ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Franchisees() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const franchisees = trpc.franchisee.franchiseeList.useQuery();
  const list = franchisees.data ?? [];

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>加盟主管理</h1>

        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ borderBottom: "1px solid var(--os-border)", padding: "12px 16px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)" }}>加盟主清單</p>
          </div>
          {franchisees.isLoading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>載入中...</div>
          ) : list.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>
              尚無加盟主資料。請至「加盟詢問」頁點擊「轉為正式加盟主」建立帳號。
            </div>
          ) : (
            <>
              {/* 桌面版 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                      {["姓名","門市","電話","Email","狀態","最後登入",""].map(h => <th key={h} className="px-4 py-2.5 text-left" style={thSt}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((u: any) => (
                      <tr key={u.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: "var(--os-text-1)" }}>{u.name}</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--os-text-2)" }}>{u.storeName ?? "-"}</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--os-text-2)" }}>{u.phone ?? "-"}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--os-text-3)" }}>{u.email ?? "-"}</td>
                        <td className="px-4 py-2.5">
                          <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, fontWeight: 500, color: u.status === "active" ? "var(--os-success)" : "var(--os-text-3)", background: u.status === "active" ? "var(--os-success-bg)" : "var(--os-surface-2)" }}>
                            {u.status === "active" ? "啟用" : "停用"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--os-text-3)" }}>{fmtDate(u.last_login_at)}</td>
                        <td className="px-4 py-2.5">
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setSelectedUserId(u.id)}>管理</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 手機版 */}
              <div className="md:hidden">
                {list.map((u: any) => (
                  <div key={u.id} style={{ borderTop: "1px solid var(--os-border-2)", padding: "12px 16px" }} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span style={{ fontWeight: 600, color: "var(--os-text-1)" }}>{u.name}</span>
                        {u.storeName && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--os-text-3)" }}>{u.storeName}</span>}
                      </div>
                      <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, fontWeight: 500, color: u.status === "active" ? "var(--os-success)" : "var(--os-text-3)", background: u.status === "active" ? "var(--os-success-bg)" : "var(--os-surface-2)" }}>
                        {u.status === "active" ? "啟用" : "停用"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--os-text-3)" }}>
                      {u.phone && <span>{u.phone} · </span>}
                      {u.email && <span>{u.email}</span>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setSelectedUserId(u.id)}>管理</Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedUserId !== null && (
        <FranchiseeDetailDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </AdminDashboardLayout>
  );
}

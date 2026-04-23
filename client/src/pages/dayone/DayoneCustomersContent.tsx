import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  districtId: undefined as number | undefined,
  paymentType: "monthly" as "monthly" | "weekly" | "cash",
  creditLimit: 0,
  status: "active" as "active" | "suspended",
  customerLevel: "retail",
  settlementCycle: "monthly",
  overdueDays: 30,
  loginEmail: "",
  isPortalActive: false,
  portalNote: "",
};

const paymentTypeLabel: Record<string, string> = {
  monthly: "月結",
  weekly: "週結",
  cash: "現金",
};

export default function DayoneCustomersContent({ tenantId }: { tenantId: number }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.dayone.customers.list.useQuery({ tenantId });
  const { data: districts } = trpc.dayone.districts.list.useQuery({ tenantId });

  const upsert = trpc.dayone.customers.upsert.useMutation({
    onSuccess: () => {
      toast.success(editId ? "客戶資料已更新" : "客戶資料已建立");
      setOpen(false);
      utils.dayone.customers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.dayone.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("客戶已刪除");
      utils.dayone.customers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setEditId(undefined);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      name: c.name ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      districtId: c.districtId ?? undefined,
      paymentType: c.paymentType ?? "monthly",
      creditLimit: Number(c.creditLimit ?? 0),
      status: c.status ?? "active",
      customerLevel: c.customerLevel ?? "retail",
      settlementCycle: c.settlementCycle ?? "monthly",
      overdueDays: Number(c.overdueDays ?? 30),
      loginEmail: c.loginEmail ?? "",
      isPortalActive: !!c.isPortalActive,
      portalNote: c.portalNote ?? "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("請輸入客戶名稱");
      return;
    }

    upsert.mutate({
      id: editId,
      tenantId,
      name: form.name,
      phone: form.phone || undefined,
      address: form.address || undefined,
      districtId: form.districtId,
      paymentType: form.paymentType,
      creditLimit: form.creditLimit,
      status: form.status,
      customerLevel: form.customerLevel || undefined,
      settlementCycle: form.settlementCycle || undefined,
      overdueDays: form.overdueDays,
      loginEmail: form.loginEmail || undefined,
      isPortalActive: form.isPortalActive,
      portalNote: form.portalNote || undefined,
    });
  }

  const filtered = (customers as any[] ?? []).filter((c: any) => !search || c.name?.includes(search) || c.phone?.includes(search));

  return (
    <div className="space-y-6">
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">客戶管理</h1>
          <p className="dayone-page-subtitle">管理下游商家、付款條件、信用額度與 Portal 權限，手機上改為卡片排版避免左右滑動。</p>
        </div>
        <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openNew}>
          <Plus className="w-4 h-4" />
          新增客戶
        </Button>
      </div>

      <Card className="dayone-surface-card rounded-[30px]">
        <CardContent className="p-4 md:p-5">
          <Input
            placeholder="用名稱或電話搜尋"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <div className="dayone-table-shell">
        {isLoading ? (
          <div className="dayone-empty-state min-h-[260px]">載入中...</div>
        ) : !filtered.length ? (
          <div className="dayone-empty-state min-h-[260px]">目前沒有客戶資料。</div>
        ) : (
          <>
            <div className="dayone-table-header">
              <div>
                <h2 className="dayone-table-title">客戶清單</h2>
                <p className="dayone-table-note">下游商家、付款條件與 Portal 權限集中管理，保持清楚可讀的桌面與手機視圖。</p>
              </div>
              <span className="dayone-chip">共 {filtered.length} 位</span>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="dayone-table w-full text-sm">
                <thead>
                  <tr>
                    {["名稱", "電話", "區域", "付款", "等級", "Portal", "狀態", "操作"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.name}</td>
                      <td className="text-stone-600">{c.phone ?? "-"}</td>
                      <td className="text-stone-600">{c.districtName ?? "-"}</td>
                      <td className="text-stone-600">{paymentTypeLabel[c.paymentType] ?? c.paymentType}</td>
                      <td className="text-stone-600">{c.customerLevel === "store" ? "門市" : c.customerLevel === "supplier" ? "供應商" : "零售"}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isPortalActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                          {c.isPortalActive ? "已啟用" : "未啟用"}
                        </span>
                      </td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                          {c.status === "active" ? "啟用中" : "停用"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`確定要刪除客戶「${c.name}」嗎？`)) del.mutate({ id: c.id, tenantId });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dayone-mobile-list p-4 md:hidden">
              {filtered.map((c: any) => (
                <article key={c.id} className="dayone-mobile-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-stone-900">{c.name}</h2>
                      <p className="mt-1 text-sm text-stone-500">
                        {paymentTypeLabel[c.paymentType] ?? c.paymentType} / {c.customerLevel === "store" ? "門市" : c.customerLevel === "supplier" ? "供應商" : "零售"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                      {c.status === "active" ? "啟用中" : "停用"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{c.phone ?? "-"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{c.districtName ?? "未分配區域"}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{c.isPortalActive ? `Portal 已啟用${c.loginEmail ? ` / ${c.loginEmail}` : ""}` : "Portal 未啟用"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={() => openEdit(c)}>編輯</Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`確定要刪除客戶「${c.name}」嗎？`)) del.mutate({ id: c.id, tenantId });
                      }}
                    >
                      刪除
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯客戶" : "新增客戶"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>名稱 *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>電話</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>地址</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>區域</Label>
              <Select value={form.districtId ? String(form.districtId) : "none"} onValueChange={(v) => setForm((p) => ({ ...p, districtId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="選擇區域" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分配區域</SelectItem>
                  {(districts as any[] ?? []).map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>付款方式</Label>
                <Select value={form.paymentType} onValueChange={(v) => setForm((p) => ({ ...p, paymentType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月結</SelectItem>
                    <SelectItem value="weekly">週結</SelectItem>
                    <SelectItem value="cash">現金</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>結帳週期</Label>
                <Select value={form.settlementCycle} onValueChange={(v) => setForm((p) => ({ ...p, settlementCycle: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月結</SelectItem>
                    <SelectItem value="weekly">週結</SelectItem>
                    <SelectItem value="daily">日結</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>客戶等級</Label>
                <Select value={form.customerLevel} onValueChange={(v) => setForm((p) => ({ ...p, customerLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">零售</SelectItem>
                    <SelectItem value="store">門市</SelectItem>
                    <SelectItem value="supplier">供應商</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>逾期天數</Label>
                <Input type="number" value={form.overdueDays} onChange={(e) => setForm((p) => ({ ...p, overdueDays: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>信用額度</Label>
                <Input type="number" value={form.creditLimit} onChange={(e) => setForm((p) => ({ ...p, creditLimit: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">啟用中</SelectItem>
                    <SelectItem value="suspended">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Portal 帳號 Email</Label>
              <Input value={form.loginEmail} onChange={(e) => setForm((p) => ({ ...p, loginEmail: e.target.value }))} placeholder="客戶 Portal 登入信箱" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-stone-800">Portal 權限</p>
                <p className="text-xs text-stone-500">控制這個客戶是否可以登入下單 Portal</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isPortalActive: !p.isPortalActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPortalActive ? "bg-amber-600" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isPortalActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div>
              <Label>Portal 備註</Label>
              <Input value={form.portalNote} onChange={(e) => setForm((p) => ({ ...p, portalNote: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? "儲存中..." : editId ? "更新客戶" : "建立客戶"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

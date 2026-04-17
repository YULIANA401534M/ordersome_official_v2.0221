import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
      toast.success(editId ? "客戶已更新" : "客戶已新增");
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
      creditLimit: c.creditLimit ?? 0,
      status: c.status ?? "active",
      customerLevel: c.customerLevel ?? "retail",
      settlementCycle: c.settlementCycle ?? "monthly",
      overdueDays: c.overdueDays ?? 30,
      loginEmail: c.loginEmail ?? "",
      isPortalActive: !!c.isPortalActive,
      portalNote: c.portalNote ?? "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("請輸入客戶名稱"); return; }
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

  const filtered = (customers as any[] ?? []).filter((c: any) =>
    !search || c.name?.includes(search) || c.phone?.includes(search)
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> 新增客戶
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="搜尋姓名或電話..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">客戶列表（共 {filtered.length} 筆）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">載入中...</div>
          ) : !filtered.length ? (
            <div className="p-6 text-center text-gray-500">無客戶資料</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["名稱", "電話", "行政區", "付款", "客戶等級", "Portal", "狀態", "操作"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium">{c.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.phone ?? "-"}</td>
                      <td className="px-4 py-2.5 text-gray-600">{c.districtName ?? "-"}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                          {c.paymentType === "monthly" ? "月結" : c.paymentType === "weekly" ? "週結" : "現金"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{c.customerLevel ?? "retail"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${c.isPortalActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {c.isPortalActive ? "啟用" : "停用"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${c.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {c.status === "active" ? "正常" : "停用"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1 text-gray-400 hover:text-blue-600 transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`確定要刪除客戶「${c.name}」？`)) del.mutate({ id: c.id, tenantId }); }}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增 / 編輯 Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯客戶" : "新增客戶"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>客戶名稱 *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>電話</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>地址</Label><Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>

            <div>
              <Label>行政區</Label>
              <Select value={form.districtId ? String(form.districtId) : ""} onValueChange={(v) => setForm((p) => ({ ...p, districtId: v ? Number(v) : undefined }))}>
                <SelectTrigger><SelectValue placeholder="選擇行政區" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不指定</SelectItem>
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
                <Label>結算週期</Label>
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
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="suspended">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div><Label>Portal 登入 Email</Label><Input value={form.loginEmail} onChange={(e) => setForm((p) => ({ ...p, loginEmail: e.target.value }))} placeholder="客戶 Portal 帳號" /></div>

            <div className="flex items-center gap-3">
              <Label>Portal 啟用</Label>
              <button
                onClick={() => setForm((p) => ({ ...p, isPortalActive: !p.isPortalActive }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isPortalActive ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.isPortalActive ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div><Label>Portal 備註</Label><Input value={form.portalNote} onChange={(e) => setForm((p) => ({ ...p, portalNote: e.target.value }))} /></div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? "儲存中..." : editId ? "更新客戶" : "新增客戶"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

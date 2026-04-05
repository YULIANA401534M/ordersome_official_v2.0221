import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", phone: "", address: "", districtId: "", paymentType: "monthly" as const, creditLimit: 0, status: "active" as const };

export default function DayoneCustomers() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.dayone.customers.list.useQuery({ tenantId: TENANT_ID });
  const { data: districts } = trpc.dayone.districts.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.customers.upsert.useMutation({
    onSuccess: () => { toast.success(editing ? "客戶已更新" : "客戶已新增"); setOpen(false); utils.dayone.customers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c: any) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", address: c.address ?? "", districtId: c.districtId ? String(c.districtId) : "", paymentType: c.paymentType, creditLimit: c.creditLimit, status: c.status });
    setOpen(true);
  }

  const filtered = (customers as any[] ?? []).filter((c: any) =>
    !search || c.name?.includes(search) || c.phone?.includes(search)
  );

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
          <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> 新增客戶
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="搜尋客戶名稱或電話" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-gray-500">載入中...</div> :
              filtered.length === 0 ? <div className="p-8 text-center text-gray-500">無客戶資料</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["客戶名稱", "電話", "地址", "區域", "付款方式", "狀態", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.phone ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{c.address ?? "-"}</td>
                        <td className="px-4 py-3">{c.districtName ?? "-"}</td>
                        <td className="px-4 py-3">{c.paymentType === "monthly" ? "月結" : c.paymentType === "weekly" ? "週結" : "現金"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {c.status === "active" ? "正常" : "停用"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "編輯客戶" : "新增客戶"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>客戶名稱 *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>電話</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>地址</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div>
                <Label>配送區域</Label>
                <Select value={form.districtId} onValueChange={v => setForm(p => ({ ...p, districtId: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇區域" /></SelectTrigger>
                  <SelectContent>
                    {(districts as any[] ?? []).map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>付款方式</Label>
                <Select value={form.paymentType} onValueChange={v => setForm(p => ({ ...p, paymentType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月結</SelectItem>
                    <SelectItem value="weekly">週結</SelectItem>
                    <SelectItem value="cash">現金</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="suspended">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={() => {
              if (!form.name) { toast.error("請填寫客戶名稱"); return; }
              upsert.mutate({ ...form, tenantId: TENANT_ID, id: editing?.id, districtId: form.districtId ? Number(form.districtId) : undefined, creditLimit: Number(form.creditLimit) });
            }} disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

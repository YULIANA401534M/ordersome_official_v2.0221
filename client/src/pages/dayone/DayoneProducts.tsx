import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", code: "", unit: "箱", defaultPrice: 0, isActive: true };

export default function DayoneProducts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.products.upsert.useMutation({
    onSuccess: () => { toast.success(editing ? "品項已更新" : "品項已新增"); setOpen(false); utils.dayone.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p: any) {
    setEditing(p);
    setForm({ name: p.name, code: p.code ?? "", unit: p.unit, defaultPrice: p.defaultPrice, isActive: p.isActive !== false });
    setOpen(true);
  }

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">品項管理</h1>
          <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> 新增品項
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-gray-500">載入中...</div> :
              !(products as any[])?.length ? <div className="p-8 text-center text-gray-500">無品項資料</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["品項名稱", "代碼", "單位", "預設單價", "狀態", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(products as any[]).map((p: any) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.code ?? "-"}</td>
                        <td className="px-4 py-3">{p.unit}</td>
                        <td className="px-4 py-3">${Number(p.defaultPrice).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {p.isActive !== false ? "上架" : "下架"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
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
            <DialogHeader><DialogTitle>{editing ? "編輯品項" : "新增品項"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>品項名稱 *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>品項代碼</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
              <div><Label>單位</Label><Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} /></div>             <div>
                <Label>狀態</Label>
                <Select value={form.isActive ? "active" : "inactive"} onValueChange={v => setForm(p => ({ ...p, isActive: v === "active" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">上架</SelectItem>
                    <SelectItem value="inactive">下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={() => {
              if (!form.name) { toast.error("請填寫品項名稱"); return; }
              upsert.mutate({ tenantId: TENANT_ID, id: editing?.id, name: form.name, code: form.code, unit: form.unit, defaultPrice: form.defaultPrice, isActive: form.isActive });
            }} disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", code: "", unit: "箱", defaultPrice: 0, isActive: true };

export default function DayoneProducts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: "", sortOrder: 0 });
  const [editingUnit, setEditingUnit] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });
  const { data: units } = trpc.dayone.units.list.useQuery({ tenantId: TENANT_ID });
  const upsertUnit = trpc.dayone.units.upsert.useMutation({
    onSuccess: () => { toast.success(editingUnit ? "單位已更新" : "單位已新增"); setUnitOpen(false); setUnitForm({ name: "", sortOrder: 0 }); setEditingUnit(null); utils.dayone.units.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteUnit = trpc.dayone.units.delete.useMutation({
    onSuccess: () => { toast.success("單位已刪除"); utils.dayone.units.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const upsert = trpc.dayone.products.upsert.useMutation({
    onSuccess: () => { toast.success(editing ? "品項已更新" : "品項已新增"); setOpen(false); utils.dayone.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = trpc.dayone.products.delete.useMutation({
    onSuccess: () => { toast.success("品項已刪除"); setDeleteTarget(null); utils.dayone.products.list.invalidate(); },
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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => { setEditingUnit(null); setUnitForm({ name: "", sortOrder: 0 }); setUnitOpen(true); }}>
              管理單位
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> 新增品項
            </Button>
          </div>
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
                        <td className="px-4 py-3 flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(p)}><Trash2 className="w-4 h-4" /></Button>
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
              <div>
                <Label>單位</Label>
                <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(units as any[] ?? [{ name: "箱" }]).map((u: any) => (
                      <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>預設單價</Label><Input type="number" min={0} value={form.defaultPrice} onChange={e => setForm(p => ({ ...p, defaultPrice: Number(e.target.value) }))} /></div>
              <div>
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
        {/* 刪除確認 Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>確認刪除品項</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-600">確定要刪除「<strong>{deleteTarget?.name}</strong>」？此操作無法復原。</p>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteProduct.isPending}
                onClick={() => deleteProduct.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}>
                {deleteProduct.isPending ? "刪除中..." : "確認刪除"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 單位管理 Dialog */}
        <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>管理單位</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">單位名稱</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">排序</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(units as any[] ?? []).map((u: any) => (
                      <tr key={u.id} className="border-b">
                        {editingUnit?.id === u.id ? (
                          <>
                            <td className="px-3 py-1"><Input className="h-7" value={editingUnit.name} onChange={e => setEditingUnit((p: any) => ({ ...p, name: e.target.value }))} /></td>
                            <td className="px-3 py-1"><Input className="h-7 w-16" type="number" value={editingUnit.sortOrder} onChange={e => setEditingUnit((p: any) => ({ ...p, sortOrder: Number(e.target.value) }))} /></td>
                            <td className="px-3 py-1 flex gap-1">
                              <button className="text-xs text-amber-600 font-medium" onClick={() => upsertUnit.mutate({ id: u.id, tenantId: TENANT_ID, name: editingUnit.name, sortOrder: editingUnit.sortOrder })}>存</button>
                              <button className="text-xs text-gray-400" onClick={() => setEditingUnit(null)}>✕</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2">{u.name}</td>
                            <td className="px-3 py-2 text-gray-500">{u.sortOrder}</td>
                            <td className="px-3 py-2 flex gap-2">
                              <button className="text-xs text-amber-600" onClick={() => setEditingUnit({ id: u.id, name: u.name, sortOrder: u.sortOrder })}>編輯</button>
                              <button className="text-xs text-red-500" onClick={() => deleteUnit.mutate({ id: u.id, tenantId: TENANT_ID })}>刪除</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Input placeholder="新單位名稱" value={unitForm.name} onChange={e => setUnitForm(p => ({ ...p, name: e.target.value }))} />
                <Button className="bg-amber-600 hover:bg-amber-700 shrink-0" onClick={() => {
                  if (!unitForm.name) return;
                  upsertUnit.mutate({ tenantId: TENANT_ID, name: unitForm.name, sortOrder: unitForm.sortOrder });
                }}>新增</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

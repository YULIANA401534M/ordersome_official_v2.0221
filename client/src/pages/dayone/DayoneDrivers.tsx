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

const emptyForm = { name: "", phone: "", lineId: "", vehicleNo: "", status: "active" as const };

export default function DayoneDrivers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: drivers, isLoading } = trpc.dayone.drivers.list.useQuery({ tenantId: TENANT_ID });
  const { data: districts } = trpc.dayone.districts.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.drivers.upsert.useMutation({
    onSuccess: () => { toast.success(editing ? "司機已更新" : "司機已新增"); setOpen(false); utils.dayone.drivers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteDriver = trpc.dayone.drivers.delete.useMutation({
    onSuccess: () => { toast.success("司機已刪除"); setDeleteTarget(null); utils.dayone.drivers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(d: any) {
    setEditing(d);
    setForm({ name: d.name, phone: d.phone ?? "", lineId: d.lineId ?? "", vehicleNo: d.vehicleNo ?? "", status: d.status });
    setOpen(true);
  }

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">司機管理</h1>
          <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> 新增司機
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-gray-500">載入中...</div> :
              !(drivers as any[])?.length ? <div className="p-8 text-center text-gray-500">無司機資料</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["姓名", "電話", "LINE ID", "車牌", "狀態", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(drivers as any[]).map((d: any) => (
                      <tr key={d.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-gray-600">{d.phone ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{d.lineId ?? "-"}</td>
                        <td className="px-4 py-3">{d.vehicleNo ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {d.status === "active" ? "在職" : "離職"}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(d)}><Trash2 className="w-4 h-4" /></Button>
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
            <DialogHeader><DialogTitle>{editing ? "編輯司機" : "新增司機"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>姓名 *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>電話</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>LINE ID</Label><Input value={form.lineId} onChange={e => setForm(p => ({ ...p, lineId: e.target.value }))} /></div>
              <div><Label>車牌號碼</Label><Input value={form.vehicleNo} onChange={e => setForm(p => ({ ...p, vehicleNo: e.target.value }))} /></div>
              <div>
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在職</SelectItem>
                    <SelectItem value="inactive">離職</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={() => {
              if (!form.name) { toast.error("請填寫姓名"); return; }
              upsert.mutate({ ...form, tenantId: TENANT_ID, id: editing?.id });
            }} disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* 刪除確認 Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>確認刪除司機</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">確定要刪除司機「<strong>{deleteTarget?.name}</strong>」？此操作無法復原。</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteDriver.isPending}
              onClick={() => deleteDriver.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}>
              {deleteDriver.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DayoneLayout>
  );
}

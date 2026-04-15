import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const emptyForm = { name: "", deliveryDays: [] as number[], sortOrder: 0 };

export default function DayoneDistricts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: districts, isLoading } = trpc.dayone.districts.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.districts.upsert.useMutation({
    onSuccess: () => { toast.success(editing ? "區域已更新" : "區域已新增"); setOpen(false); utils.dayone.districts.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteDistrict = trpc.dayone.districts.delete.useMutation({
    onSuccess: () => { toast.success("區域已刪除"); setDeleteTarget(null); utils.dayone.districts.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(d: any) {
    setEditing(d);
    let days: number[] = [];
    try { days = typeof d.deliveryDays === "string" ? JSON.parse(d.deliveryDays) : (d.deliveryDays ?? []); } catch {}
    setForm({ name: d.name, deliveryDays: days, sortOrder: d.sortOrder ?? 0 });
    setOpen(true);
  }

  function toggleDay(day: number) {
    setForm(p => ({
      ...p,
      deliveryDays: p.deliveryDays.includes(day)
        ? p.deliveryDays.filter(d => d !== day)
        : [...p.deliveryDays, day].sort()
    }));
  }

  function formatDays(days: any): string {
    try {
      const arr: number[] = typeof days === "string" ? JSON.parse(days) : (days ?? []);
      return arr.map(d => `週${WEEKDAYS[d]}`).join("、") || "-";
    } catch { return "-"; }
  }

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">行政區管理</h1>
          <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> 新增區域
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-gray-500">載入中...</div> :
              !(districts as any[])?.length ? <div className="p-8 text-center text-gray-500">無區域資料</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["區域名稱", "配送日", "排序", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(districts as any[]).map((d: any) => (
                      <tr key={d.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDays(d.deliveryDays)}</td>
                        <td className="px-4 py-3">{d.sortOrder ?? 0}</td>
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
            <DialogHeader><DialogTitle>{editing ? "編輯區域" : "新增區域"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>區域名稱 *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div>
                <Label>配送日</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {WEEKDAYS.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${form.deliveryDays.includes(idx) ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700 border-gray-300 hover:border-amber-400"}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label>排序權重</Label><Input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={() => {
              if (!form.name) { toast.error("請填寫區域名稱"); return; }
              upsert.mutate({ tenantId: TENANT_ID, id: editing?.id, name: form.name, deliveryDays: form.deliveryDays, sortOrder: form.sortOrder });
            }} disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* 刪除確認 Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>確認刪除區域</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">確定要刪除區域「<strong>{deleteTarget?.name}</strong>」？此操作無法復原。</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteDistrict.isPending}
              onClick={() => deleteDistrict.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}>
              {deleteDistrict.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DayoneLayout>
  );
}

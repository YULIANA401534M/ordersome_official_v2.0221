import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
const emptyForm = { name: "", deliveryDays: [] as number[], sortOrder: 0 };

export default function DayoneDistricts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: districts, isLoading } = trpc.dayone.districts.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.districts.upsert.useMutation({
    onSuccess: () => {
      toast.success(editing ? "區域已更新" : "區域已建立");
      setOpen(false);
      utils.dayone.districts.list.invalidate();
    },
    onError: () => toast.error("操作失敗，請重試"),
  });

  const deleteDistrict = trpc.dayone.districts.delete.useMutation({
    onSuccess: () => {
      toast.success("區域已刪除");
      setDeleteTarget(null);
      utils.dayone.districts.list.invalidate();
    },
    onError: () => toast.error("操作失敗，請重試"),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(d: any) {
    setEditing(d);
    let days: number[] = [];
    try {
      days = typeof d.deliveryDays === "string" ? JSON.parse(d.deliveryDays) : (d.deliveryDays ?? []);
    } catch {}
    setForm({ name: d.name, deliveryDays: days, sortOrder: d.sortOrder ?? 0 });
    setOpen(true);
  }

  function toggleDay(day: number) {
    setForm((p) => ({
      ...p,
      deliveryDays: p.deliveryDays.includes(day) ? p.deliveryDays.filter((d) => d !== day) : [...p.deliveryDays, day].sort(),
    }));
  }

  function formatDays(days: any): string {
    try {
      const arr: number[] = typeof days === "string" ? JSON.parse(days) : (days ?? []);
      return arr.length ? arr.map((d) => WEEKDAYS[d]).join(", ") : "-";
    } catch {
      return "-";
    }
  }

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <div className="dayone-page-header">
          <div className="min-w-0">
            <h1 className="dayone-page-title">區域管理</h1>
            <p className="dayone-page-subtitle">管理配送區域、送貨星期與排序優先權，讓派車規劃更清楚。</p>
          </div>
          <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            新增區域
          </Button>
        </div>

        <div className="dayone-table-shell">
          {isLoading ? (
            <div className="dayone-empty-state min-h-[260px]">載入中...</div>
          ) : !(districts as any[])?.length ? (
            <div className="dayone-empty-state min-h-[260px]">目前還沒有區域資料。</div>
          ) : (
            <>
              <div className="dayone-table-header">
                <div>
                  <h2 className="dayone-table-title">區域清單</h2>
                  <p className="dayone-table-note">配送星期與排序優先權集中整理，方便後續派車規劃。</p>
                </div>
                <span className="dayone-chip">共 {(districts as any[]).length} 區</span>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="dayone-table w-full text-sm">
                  <thead>
                    <tr>
                      {["區域名稱", "配送星期", "排序", "操作"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(districts as any[]).map((d: any) => (
                      <tr key={d.id}>
                        <td className="font-medium">{d.name}</td>
                        <td className="text-stone-600">{formatDays(d.deliveryDays)}</td>
                        <td className="text-stone-700">{d.sortOrder ?? 0}</td>
                        <td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(d)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dayone-mobile-list p-4 md:hidden">
                {(districts as any[]).map((d: any) => (
                  <article key={d.id} className="dayone-mobile-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-stone-900">{d.name}</h2>
                        <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>{formatDays(d.deliveryDays)}</span>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">排序 {d.sortOrder ?? 0}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-2xl" onClick={() => openEdit(d)}>編輯</Button>
                      <Button variant="outline" className="rounded-2xl text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(d)}>刪除</Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "編輯區域" : "新增區域"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>區域名稱 *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>配送星期</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEKDAYS.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`h-10 w-10 rounded-full border text-xs font-medium transition-colors ${form.deliveryDays.includes(idx) ? "border-amber-600 bg-amber-600 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-amber-400"}`}
                    >
                      {day.replace("週", "")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>排序順序</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))} />
              </div>
            </div>
            <Button
              className="mt-2 w-full bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (!form.name) {
                  toast.error("請輸入區域名稱");
                  return;
                }
                upsert.mutate({ tenantId: TENANT_ID, id: editing?.id, name: form.name, deliveryDays: form.deliveryDays, sortOrder: form.sortOrder });
              }}
              disabled={upsert.isPending}
            >
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>刪除區域</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">確定要刪除 <strong>{deleteTarget?.name}</strong> 嗎？此操作無法復原。</p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" disabled={deleteDistrict.isPending} onClick={() => deleteDistrict.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}>
              {deleteDistrict.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DayoneLayout>
  );
}

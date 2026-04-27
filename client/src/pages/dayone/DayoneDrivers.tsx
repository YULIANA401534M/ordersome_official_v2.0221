import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Truck, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", phone: "", lineId: "", vehicleNo: "", routeCode: "", status: "active" as const };

export default function DayoneDrivers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: drivers, isLoading } = trpc.dayone.drivers.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.drivers.upsert.useMutation({
    onSuccess: () => {
      toast.success(editing ? "司機資料已更新" : "司機新增成功");
      setOpen(false);
      utils.dayone.drivers.list.invalidate();
    },
    onError: () => toast.error("操作失敗，請重試"),
  });

  const deleteDriver = trpc.dayone.drivers.delete.useMutation({
    onSuccess: () => {
      toast.success("司機已刪除");
      setDeleteTarget(null);
      utils.dayone.drivers.list.invalidate();
    },
    onError: () => toast.error("操作失敗，請重試"),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(driver: any) {
    setEditing(driver);
    setForm({
      name: driver.name,
      phone: driver.phone ?? "",
      lineId: driver.lineId ?? "",
      vehicleNo: driver.vehicleNo ?? "",
      routeCode: driver.routeCode ?? "",
      status: driver.status,
    });
    setOpen(true);
  }

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <div className="dayone-page-header">
          <div className="min-w-0">
            <h1 className="dayone-page-title">司機管理</h1>
            <p className="dayone-page-subtitle">保留原本功能，但把手機視圖改成卡片式清單，避免資料表在手機上橫向滑動。</p>
          </div>
          <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            新增司機
          </Button>
        </div>

        <div className="dayone-table-shell">
          {isLoading ? (
            <div className="dayone-empty-state min-h-[260px]">載入中...</div>
          ) : !(drivers as any[])?.length ? (
            <div className="dayone-empty-state min-h-[260px]">目前沒有司機資料。</div>
          ) : (
            <>
              <div className="dayone-table-header">
                <div>
                  <h2 className="dayone-table-title">司機清單</h2>
                  <p className="dayone-table-note">聯絡方式、車牌與在職狀態統一管理，手機版改為卡片避免擁擠。</p>
                </div>
                <span className="dayone-chip">共 {(drivers as any[]).length} 位</span>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="dayone-table w-full text-sm">
                  <thead>
                    <tr>
                      {["姓名", "路線代碼", "電話", "LINE ID", "車牌", "狀態", "操作"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(drivers as any[]).map((driver: any) => (
                      <tr key={driver.id}>
                        <td className="font-medium">{driver.name}</td>
                        <td>
                          {driver.routeCode
                            ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{driver.routeCode}</span>
                            : <span className="text-stone-400">未設定</span>}
                        </td>
                        <td className="text-stone-600">{driver.phone ?? "-"}</td>
                        <td className="text-stone-600">{driver.lineId ?? "-"}</td>
                        <td className="text-stone-700">{driver.vehicleNo ?? "-"}</td>
                        <td>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${driver.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                            {driver.status === "active" ? "在職" : "停用"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(driver)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteTarget(driver)}
                            >
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
                {(drivers as any[]).map((driver: any) => (
                  <article key={driver.id} className="dayone-mobile-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-stone-900">{driver.name}</h2>
                        <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
                          <Truck className="h-3.5 w-3.5" />
                          <span>{driver.vehicleNo ?? "尚未設定車牌"}</span>
                          {driver.routeCode && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 font-semibold">{driver.routeCode}</span>
                          )}
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${driver.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                        {driver.status === "active" ? "在職" : "停用"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <Phone className="mt-0.5 h-4 w-4 text-stone-400" />
                        <span className="text-stone-700">{driver.phone ?? "-"}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <MessageSquare className="mt-0.5 h-4 w-4 text-stone-400" />
                        <span className="break-all text-stone-700">{driver.lineId ?? "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-2xl" onClick={() => openEdit(driver)}>
                        編輯
                      </Button>
                      <Button variant="outline" className="rounded-2xl text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(driver)}>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "編輯司機" : "新增司機"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>姓名 *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>電話</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>LINE ID</Label>
                <Input value={form.lineId} onChange={(e) => setForm((p) => ({ ...p, lineId: e.target.value }))} />
              </div>
              <div>
                <Label>車牌</Label>
                <Input value={form.vehicleNo} onChange={(e) => setForm((p) => ({ ...p, vehicleNo: e.target.value }))} />
              </div>
              <div>
                <Label>路線代碼</Label>
                <Input
                  placeholder="例如 R01、台中北區"
                  value={form.routeCode}
                  onChange={(e) => setForm((p) => ({ ...p, routeCode: e.target.value }))}
                />
                <p className="mt-1 text-xs text-stone-400">用於派車單識別，設定後新派車單自動帶入</p>
              </div>
              <div>
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在職</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-2 w-full bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                if (!form.name) {
                  toast.error("請先輸入司機姓名");
                  return;
                }
                upsert.mutate({ ...form, tenantId: TENANT_ID, id: editing?.id, routeCode: form.routeCode || undefined });
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
            <DialogTitle>確認刪除司機</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">
            確定要刪除 <strong>{deleteTarget?.name}</strong> 嗎？此動作無法復原。
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteDriver.isPending}
              onClick={() => deleteDriver.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}
            >
              {deleteDriver.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DayoneLayout>
  );
}

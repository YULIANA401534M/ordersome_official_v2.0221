import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";

const MOVEMENT_TYPES = [
  { value: "in", label: "入庫" },
  { value: "out", label: "出庫" },
  { value: "adjust", label: "調整" },
  { value: "return", label: "退貨" },
];

export default function DayoneInventory() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", movementType: "in" as string, qty: 0, note: "" });

  const utils = trpc.useUtils();
  const { data: inventory, isLoading } = trpc.dayone.inventory.list.useQuery({ tenantId: TENANT_ID });
  const { data: alerts } = trpc.dayone.reports.inventoryAlerts.useQuery({ tenantId: TENANT_ID });
  const { data: products } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });
  const { data: movements } = trpc.dayone.inventory.movements.useQuery({ tenantId: TENANT_ID, limit: 20 });

  const adjust = trpc.dayone.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success("庫存已調整");
      setAdjustOpen(false);
      utils.dayone.inventory.list.invalidate();
      utils.dayone.inventory.movements.invalidate();
      utils.dayone.reports.inventoryAlerts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">庫存管理</h1>
          <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={() => setAdjustOpen(true)}>
            <Plus className="w-4 h-4" /> 調整庫存
          </Button>
        </div>

        {/* Alerts */}
        {(alerts as any[])?.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 庫存警示
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {(alerts as any[]).map((a: any) => (
                  <span key={a.id} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                    {a.productName}：剩 {a.currentQty} {a.unit}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Current Inventory */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">目前庫存</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <div className="p-6 text-center text-gray-500">載入中...</div> :
                !(inventory as any[])?.length ? <div className="p-6 text-center text-gray-500">無庫存資料</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["品項", "庫存量", "單位"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(inventory as any[]).map((inv: any) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium">{inv.productName}</td>
                        <td className={`px-4 py-2.5 font-bold ${inv.currentQty <= (inv.minStockAlert ?? 0) ? "text-orange-600" : "text-gray-900"}`}>
                          {inv.currentQty}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{inv.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">最近異動</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!(movements as any[])?.length ? <div className="p-6 text-center text-gray-500">無異動記錄</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["品項", "類型", "數量", "時間"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(movements as any[]).map((m: any) => {
                      const mt = MOVEMENT_TYPES.find(t => t.value === m.movementType);
                      return (
                        <tr key={m.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2.5">{m.productName}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${m.movementType === "in" || m.movementType === "return" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {mt?.label ?? m.movementType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium">{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">
                            {new Date(m.createdAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Adjust Dialog */}
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>調整庫存</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>品項 *</Label>
                <Select value={form.productId} onValueChange={v => setForm(p => ({ ...p, productId: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇品項" /></SelectTrigger>
                  <SelectContent>
                    {(products as any[] ?? []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>異動類型</Label>
                <Select value={form.movementType} onValueChange={v => setForm(p => ({ ...p, movementType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>數量 *</Label><Input type="number" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: Number(e.target.value) }))} /></div>
              <div><Label>備註</Label><Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} /></div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={() => {
              if (!form.productId || !form.qty) { toast.error("請填寫品項和數量"); return; }
              adjust.mutate({ tenantId: TENANT_ID, productId: Number(form.productId), type: form.movementType as any, qty: form.qty, note: form.note || undefined });
            }} disabled={adjust.isPending}>
              {adjust.isPending ? "調整中..." : "確認調整"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: "草稿", color: "bg-gray-100 text-gray-700" },
  ordered:   { label: "已訂購", color: "bg-blue-100 text-blue-700" },
  received:  { label: "已收貨", color: "bg-green-100 text-green-700" },
  cancelled: { label: "取消", color: "bg-red-100 text-red-700" },
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function DayonePurchase() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ supplierId: "", expectedDate: todayStr(), note: "" });
  const [items, setItems] = useState([{ productId: "", qty: 0, unitCost: 0 }]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", phone: "", contact: "" });
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.dayone.purchase.list.useQuery({ tenantId: TENANT_ID });
  const { data: suppliers } = trpc.dayone.purchase.suppliers.useQuery({ tenantId: TENANT_ID });
  const { data: products } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const createOrder = trpc.dayone.purchase.create.useMutation({
    onSuccess: () => { toast.success("進貨單已建立"); setCreateOpen(false); utils.dayone.purchase.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const addSupplier = trpc.dayone.purchase.upsertSupplier.useMutation({
    onSuccess: () => { toast.success(editingSupplier ? "供應商已更新" : "供應商已新增"); setSupplierOpen(false); setSupplierForm({ name: "", phone: "", contact: "" }); setEditingSupplier(null); utils.dayone.purchase.suppliers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });



  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">進貨管理</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => { setEditingSupplier(null); setSupplierForm({ name: "", phone: "", contact: "" }); setSupplierOpen(true); }}>
              <Plus className="w-4 h-4" /> 管理供應商
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> 新增進貨單
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-gray-500">載入中...</div> :
              !(orders as any[])?.length ? <div className="p-8 text-center text-gray-500">無進貨單資料</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["進貨單號", "供應商", "預計到貨", "總金額", "狀態", "操作"].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(orders as any[]).map((o: any) => {
                      const st = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                      return (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{o.poNo}</td>
                          <td className="px-4 py-3 font-medium">{o.supplierName ?? "-"}</td>
                          <td className="px-4 py-3">{o.expectedDate ?? "-"}</td>
                          <td className="px-4 py-3">${Number(o.totalAmount ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[o.status]?.color ?? "bg-gray-100 text-gray-700"}`}>
                              {STATUS_MAP[o.status]?.label ?? o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>新增進貨單</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <Label>供應商</Label>
                <div className="flex gap-2">
                  <Select value={form.supplierId} onValueChange={v => setForm(p => ({ ...p, supplierId: v }))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="選擇供應商" /></SelectTrigger>
                    <SelectContent>
                      {(suppliers as any[] ?? []).map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>預計到貨日</Label>
                <Input type="date" value={form.expectedDate} onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} />
              </div>
              <div>
                <Label>品項</Label>
                <div className="flex gap-2 mt-1 text-xs text-gray-500 px-1">
                  <span className="flex-1">品項名稱</span>
                  <span className="w-16 text-center">數量</span>
                  <span className="w-20 text-center">金額</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mt-1">
                    <Select value={item.productId} onValueChange={(v) => {
                      setItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: v } : it));
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="品項" /></SelectTrigger>
                      <SelectContent>
                        {(products as any[] ?? []).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-16 text-center" placeholder="數量" value={item.qty}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it))} />
                    <Input type="number" className="w-20 text-center" placeholder="金額" value={item.unitCost}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, unitCost: Number(e.target.value) } : it))} />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setItems(prev => [...prev, { productId: "", qty: 0, unitCost: 0 }])}>
                  + 加品項
                </Button>
              </div>
              <div><Label>備註</Label><Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} /></div>
            </div>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={() => {
              const validItems = items.filter(i => i.productId && i.qty > 0);
              if (!validItems.length) { toast.error("請至少填寫一個品項"); return; }
              createOrder.mutate({
                tenantId: TENANT_ID,
                supplierId: Number(form.supplierId) || 0,
                deliveryDate: form.expectedDate || "",
                note: form.note || undefined,
                items: validItems.map(i => ({ productId: Number(i.productId), expectedQty: i.qty, unitPrice: i.unitCost })),
              });
            }} disabled={createOrder.isPending}>
              {createOrder.isPending ? "建立中..." : "建立進貨單"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* 管理供應商 Dialog */}
        <Dialog open={supplierOpen} onOpenChange={(v) => { setSupplierOpen(v); if (!v) { setEditingSupplier(null); setSupplierForm({ name: "", phone: "", contact: "" }); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>管理供應商</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {/* 現有供應商列表 */}
              {(suppliers as any[] ?? []).length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">供應商名稱</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">電話</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(suppliers as any[]).map((s: any) => (
                        <tr key={s.id} className="border-b">
                          {editingSupplier?.id === s.id ? (
                            <>
                              <td className="px-3 py-1"><Input className="h-7" value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} /></td>
                              <td className="px-3 py-1"><Input className="h-7" value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} /></td>
                              <td className="px-3 py-1 flex gap-1">
                                <button className="text-xs text-amber-600 font-medium" onClick={() => {
                                  if (!supplierForm.name) { toast.error("請填寫供應商名稱"); return; }
                                  addSupplier.mutate({ tenantId: TENANT_ID, id: s.id, name: supplierForm.name, contact: supplierForm.contact || undefined, phone: supplierForm.phone || undefined });
                                }}>存</button>
                                <button className="text-xs text-gray-400" onClick={() => { setEditingSupplier(null); setSupplierForm({ name: "", phone: "", contact: "" }); }}>✕</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2">{s.name}</td>
                              <td className="px-3 py-2 text-gray-500">{s.phone ?? "-"}</td>
                              <td className="px-3 py-2">
                                <button className="text-xs text-amber-600" onClick={() => { setEditingSupplier(s); setSupplierForm({ name: s.name, phone: s.phone ?? "", contact: s.contact ?? "" }); }}>編輯</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* 新增供應商 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">新增供應商</div>
                <div><Label>名稱 *</Label><Input value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} disabled={!!editingSupplier} /></div>
                <div><Label>聯絡人</Label><Input value={supplierForm.contact} onChange={e => setSupplierForm(p => ({ ...p, contact: e.target.value }))} disabled={!!editingSupplier} /></div>
                <div><Label>電話</Label><Input value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} disabled={!!editingSupplier} /></div>
                {!editingSupplier && (
                  <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => {
                    if (!supplierForm.name) { toast.error("請填寫供應商名稱"); return; }
                    addSupplier.mutate({ tenantId: TENANT_ID, name: supplierForm.name, contact: supplierForm.contact || undefined, phone: supplierForm.phone || undefined });
                  }} disabled={addSupplier.isPending}>
                    {addSupplier.isPending ? "新增中..." : "新增供應商"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

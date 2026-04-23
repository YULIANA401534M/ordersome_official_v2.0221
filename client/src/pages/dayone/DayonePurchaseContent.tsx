import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-stone-100 text-stone-600" },
  ordered: { label: "已下單", className: "bg-sky-100 text-sky-700" },
  received: { label: "已收貨", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "已取消", className: "bg-rose-100 text-rose-700" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DayonePurchaseContent({ tenantId }: { tenantId: number }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ supplierId: "", expectedDate: todayStr(), note: "" });
  const [items, setItems] = useState([{ productId: "", qty: 0, unitCost: 0 }]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", phone: "", contact: "" });
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.dayone.purchase.list.useQuery({ tenantId });
  const { data: suppliers = [] } = trpc.dayone.purchase.suppliers.useQuery({ tenantId });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId });

  const createOrder = trpc.dayone.purchase.create.useMutation({
    onSuccess: () => {
      toast.success("採購單已建立");
      setCreateOpen(false);
      utils.dayone.purchase.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const upsertSupplier = trpc.dayone.purchase.upsertSupplier.useMutation({
    onSuccess: () => {
      toast.success(editingSupplier ? "供應商已更新" : "供應商已新增");
      setSupplierOpen(false);
      setSupplierForm({ name: "", phone: "", contact: "" });
      setEditingSupplier(null);
      utils.dayone.purchase.suppliers.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="dayone-page">
      <section className="rounded-[32px] bg-[linear-gradient(135deg,#ede9fe_0%,#fffdf7_55%,#ffffff_100%)] px-6 py-6 shadow-[0_16px_38px_rgba(120,53,15,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-violet-600">Purchase</p>
            <h1 className="mt-3 font-brand text-[2rem] leading-none text-stone-900">採購與供應商</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-500">
              建立進貨採購單、維護供應商聯絡資料，後續進貨簽收會沿用這裡的採購基礎。
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => { setEditingSupplier(null); setSupplierForm({ name: "", phone: "", contact: "" }); setSupplierOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              管理供應商
            </Button>
            <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增採購單
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-stone-200/70 bg-white shadow-[0_14px_28px_rgba(120,53,15,0.05)]">
        {isLoading ? (
          <div className="p-10 text-center text-stone-400">讀取中...</div>
        ) : orders.length === 0 ? (
          <div className="p-14 text-center text-stone-400">目前還沒有採購單。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-stone-50">
                <tr>
                  {["採購單號", "供應商", "預計到貨", "總金額", "狀態"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left font-medium text-stone-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => {
                  const status = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-stone-100 text-stone-600" };
                  return (
                    <tr key={order.id} className="border-b transition-colors hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">{order.poNo}</td>
                      <td className="px-4 py-3 font-medium text-stone-900">{order.supplierName ?? "-"}</td>
                      <td className="px-4 py-3 text-stone-600">{order.expectedDate ?? "-"}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge className={status.className}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>新增採購單</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            <div>
              <Label>供應商</Label>
              <Select value={form.supplierId} onValueChange={(value) => setForm((prev) => ({ ...prev, supplierId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇供應商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>預計到貨日</Label>
              <Input type="date" value={form.expectedDate} onChange={(event) => setForm((prev) => ({ ...prev, expectedDate: event.target.value }))} />
            </div>

            <div>
              <Label>採購品項</Label>
              <div className="mt-2 space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_88px_110px] gap-2">
                    <Select value={item.productId} onValueChange={(value) => setItems((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, productId: value } : row))}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇品項" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: any) => (
                          <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="數量" value={item.qty} onChange={(event) => setItems((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, qty: Number(event.target.value) } : row))} />
                    <Input type="number" placeholder="單價" value={item.unitCost} onChange={(event) => setItems((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, unitCost: Number(event.target.value) } : row))} />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 rounded-2xl" onClick={() => setItems((prev) => [...prev, { productId: "", qty: 0, unitCost: 0 }])}>
                再加一列
              </Button>
            </div>

            <div>
              <Label>備註</Label>
              <Input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
            </div>
          </div>
          <Button
            className="mt-2 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
            disabled={createOrder.isPending}
            onClick={() => {
              const validItems = items.filter((item) => item.productId && item.qty > 0);
              if (!form.supplierId) {
                toast.error("請先選擇供應商");
                return;
              }
              if (!validItems.length) {
                toast.error("請至少填一筆有效採購品項");
                return;
              }
              createOrder.mutate({
                tenantId,
                supplierId: Number(form.supplierId),
                deliveryDate: form.expectedDate || "",
                note: form.note || undefined,
                items: validItems.map((item) => ({
                  productId: Number(item.productId),
                  expectedQty: item.qty,
                  unitPrice: item.unitCost,
                })),
              });
            }}
          >
            {createOrder.isPending ? "建立中..." : "確認建立採購單"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={supplierOpen} onOpenChange={(value) => { setSupplierOpen(value); if (!value) { setEditingSupplier(null); setSupplierForm({ name: "", phone: "", contact: "" }); } }}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>供應商設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {suppliers.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-stone-200">
                <table className="w-full text-sm">
                  <thead className="border-b bg-stone-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-stone-500">供應商</th>
                      <th className="px-3 py-2 text-left font-medium text-stone-500">電話</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier: any) => (
                      <tr key={supplier.id} className="border-b last:border-b-0">
                        {editingSupplier?.id === supplier.id ? (
                          <>
                            <td className="px-3 py-2"><Input className="h-8" value={supplierForm.name} onChange={(event) => setSupplierForm((prev) => ({ ...prev, name: event.target.value }))} /></td>
                            <td className="px-3 py-2"><Input className="h-8" value={supplierForm.phone} onChange={(event) => setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))} /></td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2 text-xs">
                                <button
                                  type="button"
                                  className="text-amber-600"
                                  onClick={() => upsertSupplier.mutate({ tenantId, id: supplier.id, name: supplierForm.name, contact: supplierForm.contact || undefined, phone: supplierForm.phone || undefined })}
                                >
                                  儲存
                                </button>
                                <button type="button" className="text-stone-400" onClick={() => { setEditingSupplier(null); setSupplierForm({ name: "", phone: "", contact: "" }); }}>
                                  取消
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-stone-900">{supplier.name}</td>
                            <td className="px-3 py-2 text-stone-500">{supplier.phone ?? "-"}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                className="text-xs text-amber-600"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setSupplierForm({ name: supplier.name, phone: supplier.phone ?? "", contact: supplier.contact ?? "" });
                                }}
                              >
                                編輯
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-stone-200/70 bg-stone-50 px-4 py-4">
              <p className="text-sm font-medium text-stone-700">新增供應商</p>
              <div>
                <Label>名稱</Label>
                <Input value={supplierForm.name} onChange={(event) => setSupplierForm((prev) => ({ ...prev, name: event.target.value }))} disabled={!!editingSupplier} />
              </div>
              <div>
                <Label>聯絡人</Label>
                <Input value={supplierForm.contact} onChange={(event) => setSupplierForm((prev) => ({ ...prev, contact: event.target.value }))} disabled={!!editingSupplier} />
              </div>
              <div>
                <Label>電話</Label>
                <Input value={supplierForm.phone} onChange={(event) => setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))} disabled={!!editingSupplier} />
              </div>
              {!editingSupplier && (
                <Button
                  className="w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                  disabled={upsertSupplier.isPending}
                  onClick={() => {
                    if (!supplierForm.name.trim()) {
                      toast.error("請先填寫供應商名稱");
                      return;
                    }
                    upsertSupplier.mutate({ tenantId, name: supplierForm.name, contact: supplierForm.contact || undefined, phone: supplierForm.phone || undefined });
                  }}
                >
                  {upsertSupplier.isPending ? "新增中..." : "確認新增供應商"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

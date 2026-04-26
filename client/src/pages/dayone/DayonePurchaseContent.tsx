import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ShoppingCart, Building2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-stone-100 text-stone-600" },
  ordered: { label: "已下單", className: "bg-sky-100 text-sky-700" },
  received: { label: "已收貨", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "已取消", className: "bg-rose-100 text-rose-700" },
};

const EMPTY_SUPPLIER_FORM = { name: "", contact: "", phone: "", address: "", bankAccount: "", status: "active" as "active" | "inactive" };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type Tab = "orders" | "suppliers";

export default function DayonePurchaseContent({ tenantId }: { tenantId: number }) {
  const [tab, setTab] = useState<Tab>("orders");

  // ── 採購單 state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ supplierId: "", expectedDate: todayStr(), note: "" });
  const [items, setItems] = useState([{ productId: "", qty: 0, unitCost: 0 }]);

  // ── 供應商 state ──
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({ ...EMPTY_SUPPLIER_FORM });

  const utils = trpc.useUtils();
  const { data: orders = [], isLoading: ordersLoading } = trpc.dayone.purchase.list.useQuery({ tenantId });
  const { data: purchaseSuppliers = [] } = trpc.dayone.purchase.suppliers.useQuery({ tenantId });
  const { data: suppliers = [], isLoading: suppliersLoading } = trpc.dayone.suppliers.list.useQuery({ tenantId });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId });

  const createOrder = trpc.dayone.purchase.create.useMutation({
    onSuccess: () => {
      toast.success("採購單已建立");
      setCreateOpen(false);
      setForm({ supplierId: "", expectedDate: todayStr(), note: "" });
      setItems([{ productId: "", qty: 0, unitCost: 0 }]);
      utils.dayone.purchase.list.invalidate();
    },
    onError: () => toast.error("採購單建立失敗，請重試"),
  });

  const upsertSupplier = trpc.dayone.suppliers.upsert.useMutation({
    onSuccess: () => {
      toast.success(editingSupplier ? "供應商已更新" : "供應商已新增");
      setSupplierDialogOpen(false);
      setEditingSupplier(null);
      setSupplierForm({ ...EMPTY_SUPPLIER_FORM });
      utils.dayone.suppliers.list.invalidate();
      utils.dayone.purchase.suppliers.invalidate();
    },
    onError: () => toast.error("供應商操作失敗，請重試"),
  });

  const toggleSupplier = trpc.dayone.suppliers.toggleStatus.useMutation({
    onSuccess: () => {
      utils.dayone.suppliers.list.invalidate();
    },
    onError: () => toast.error("狀態更新失敗"),
  });

  const deleteSupplier = trpc.dayone.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("供應商已刪除");
      utils.dayone.suppliers.list.invalidate();
      utils.dayone.purchase.suppliers.invalidate();
    },
    onError: () => toast.error("刪除失敗，請重試"),
  });

  function openNewSupplier() {
    setEditingSupplier(null);
    setSupplierForm({ ...EMPTY_SUPPLIER_FORM });
    setSupplierDialogOpen(true);
  }

  function openEditSupplier(s: any) {
    setEditingSupplier(s);
    setSupplierForm({ name: s.name ?? "", contact: s.contact ?? "", phone: s.phone ?? "", address: s.address ?? "", bankAccount: s.bankAccount ?? "", status: s.status ?? "active" });
    setSupplierDialogOpen(true);
  }

  function handleSaveSupplier() {
    if (!supplierForm.name.trim()) { toast.error("請填寫供應商名稱"); return; }
    upsertSupplier.mutate({ tenantId, id: editingSupplier?.id, ...supplierForm });
  }

  const activeSuppliers = (suppliers as any[]).filter((s: any) => s.status === "active");
  const inactiveSuppliers = (suppliers as any[]).filter((s: any) => s.status !== "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">採購管理</h1>
          <p className="dayone-page-subtitle">採購單建立與供應商資料集中管理。</p>
        </div>
        {tab === "orders" ? (
          <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            新增採購單
          </Button>
        ) : (
          <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openNewSupplier}>
            <Plus className="h-4 w-4" />
            新增供應商
          </Button>
        )}
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-1 w-fit">
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === "orders" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
        >
          <ShoppingCart className="h-4 w-4" />
          採購單
          <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === "orders" ? "bg-amber-100 text-amber-700" : "bg-stone-200 text-stone-500"}`}>{(orders as any[]).length}</span>
        </button>
        <button
          onClick={() => setTab("suppliers")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === "suppliers" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
        >
          <Building2 className="h-4 w-4" />
          供應商
          <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === "suppliers" ? "bg-amber-100 text-amber-700" : "bg-stone-200 text-stone-500"}`}>{activeSuppliers.length}</span>
        </button>
      </div>

      {/* ── 採購單 Tab ── */}
      {tab === "orders" && (
        <div className="dayone-table-shell">
          {ordersLoading ? (
            <div className="dayone-empty-state min-h-[260px]">載入中...</div>
          ) : (orders as any[]).length === 0 ? (
            <div className="dayone-empty-state min-h-[260px]">目前還沒有採購單。</div>
          ) : (
            <>
              <div className="dayone-table-header">
                <div>
                  <h2 className="dayone-table-title">採購單列表</h2>
                  <p className="dayone-table-note">記錄每次向供應商叫貨的採購明細。</p>
                </div>
                <span className="dayone-chip">共 {(orders as any[]).length} 筆</span>
              </div>
              <div className="overflow-x-auto">
                <table className="dayone-table w-full text-sm">
                  <thead>
                    <tr>
                      {["採購單號", "供應商", "預計到貨", "總金額", "狀態"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(orders as any[]).map((order: any) => {
                      const status = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-stone-100 text-stone-600" };
                      return (
                        <tr key={order.id}>
                          <td className="font-mono text-xs text-stone-500">{order.poNo}</td>
                          <td className="font-medium">{order.supplierName ?? "-"}</td>
                          <td className="text-stone-600">{order.expectedDate ?? "-"}</td>
                          <td className="font-semibold">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</td>
                          <td><Badge className={status.className}>{status.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 供應商 Tab ── */}
      {tab === "suppliers" && (
        <div className="dayone-table-shell">
          {suppliersLoading ? (
            <div className="dayone-empty-state min-h-[260px]">載入中...</div>
          ) : (suppliers as any[]).length === 0 ? (
            <div className="dayone-empty-state min-h-[260px]">尚無供應商資料。</div>
          ) : (
            <>
              <div className="dayone-table-header">
                <div>
                  <h2 className="dayone-table-title">供應商清單</h2>
                  <p className="dayone-table-note">維護供應商聯絡資訊、銀行帳戶與合作狀態。</p>
                </div>
                <span className="dayone-chip">啟用 {activeSuppliers.length} 家</span>
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="dayone-table w-full text-sm">
                  <thead>
                    <tr>
                      {["供應商名稱", "聯絡人", "電話", "地址", "銀行帳戶", "狀態", "操作"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...activeSuppliers, ...inactiveSuppliers].map((s: any) => (
                      <tr key={s.id} className={s.status !== "active" ? "opacity-50" : ""}>
                        <td className="font-medium">{s.name}</td>
                        <td className="text-stone-600">{s.contact ?? "-"}</td>
                        <td className="text-stone-600">{s.phone ?? "-"}</td>
                        <td className="max-w-[180px] truncate text-stone-600">{s.address ?? "-"}</td>
                        <td className="text-stone-600">{s.bankAccount ?? "-"}</td>
                        <td>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"}`}>
                            {s.status === "active" ? "合作中" : "停用"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" title={s.status === "active" ? "停用" : "啟用"}
                              onClick={() => toggleSupplier.mutate({ id: s.id, tenantId, status: s.status === "active" ? "inactive" : "active" })}>
                              {s.status === "active" ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-stone-400" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditSupplier(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-700"
                              onClick={() => { if (confirm(`確定刪除供應商「${s.name}」？`)) deleteSupplier.mutate({ id: s.id, tenantId }); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="dayone-mobile-list p-4 md:hidden">
                {[...activeSuppliers, ...inactiveSuppliers].map((s: any) => (
                  <article key={s.id} className={`dayone-mobile-card p-4 ${s.status !== "active" ? "opacity-50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-stone-900">{s.name}</h2>
                        {s.contact && <p className="mt-0.5 text-sm text-stone-500">聯絡人：{s.contact}</p>}
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"}`}>
                        {s.status === "active" ? "合作中" : "停用"}
                      </span>
                    </div>
                    {(s.phone || s.address) && (
                      <div className="mt-3 space-y-1 text-sm text-stone-600">
                        {s.phone && <p>電話：{s.phone}</p>}
                        {s.address && <p>地址：{s.address}</p>}
                        {s.bankAccount && <p>銀行：{s.bankAccount}</p>}
                      </div>
                    )}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Button variant="outline" className="rounded-2xl text-xs"
                        onClick={() => toggleSupplier.mutate({ id: s.id, tenantId, status: s.status === "active" ? "inactive" : "active" })}>
                        {s.status === "active" ? "停用" : "啟用"}
                      </Button>
                      <Button variant="outline" className="rounded-2xl text-xs" onClick={() => openEditSupplier(s)}>編輯</Button>
                      <Button variant="outline" className="rounded-2xl text-xs text-red-600 hover:text-red-700"
                        onClick={() => { if (confirm(`確定刪除供應商「${s.name}」？`)) deleteSupplier.mutate({ id: s.id, tenantId }); }}>
                        刪除
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 新增採購單 Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增採購單</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label>供應商 *</Label>
              <Select value={form.supplierId} onValueChange={(v) => setForm((p) => ({ ...p, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="選擇供應商" /></SelectTrigger>
                <SelectContent>
                  {(purchaseSuppliers as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>預計到貨日</Label>
              <Input type="date" value={form.expectedDate} onChange={(e) => setForm((p) => ({ ...p, expectedDate: e.target.value }))} />
            </div>
            <div>
              <Label>採購品項</Label>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-[1fr_80px_100px_28px] gap-1.5 text-xs text-stone-400 px-1">
                  <span>商品</span><span>數量</span><span>單價</span><span />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_100px_28px] gap-1.5 items-center">
                    <Select value={item.productId} onValueChange={(v) => setItems((p) => p.map((r, i) => i === idx ? { ...r, productId: v } : r))}>
                      <SelectTrigger><SelectValue placeholder="選擇品項" /></SelectTrigger>
                      <SelectContent>
                        {(products as any[]).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="數量" value={item.qty || ""} onChange={(e) => setItems((p) => p.map((r, i) => i === idx ? { ...r, qty: Number(e.target.value) } : r))} />
                    <Input type="number" placeholder="單價" value={item.unitCost || ""} onChange={(e) => setItems((p) => p.map((r, i) => i === idx ? { ...r, unitCost: Number(e.target.value) } : r))} />
                    <button type="button" className="text-stone-300 hover:text-red-400 text-lg leading-none"
                      onClick={() => setItems((p) => p.length > 1 ? p.filter((_, i) => i !== idx) : p)}>×</button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2 rounded-2xl text-xs"
                onClick={() => setItems((p) => [...p, { productId: "", qty: 0, unitCost: 0 }])}>
                + 新增一列
              </Button>
            </div>
            <div>
              <Label>備註</Label>
              <Input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            {items.some((i) => i.productId && i.qty > 0 && i.unitCost > 0) && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm">
                <span className="text-stone-500">小計：</span>
                <span className="font-semibold text-stone-900">
                  NT$ {items.filter(i => i.productId && i.qty > 0).reduce((s, i) => s + i.qty * i.unitCost, 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={createOrder.isPending}
            onClick={() => {
              const validItems = items.filter((i) => i.productId && i.qty > 0);
              if (!form.supplierId) { toast.error("請先選擇供應商"); return; }
              if (!validItems.length) { toast.error("請至少填一筆有效採購品項"); return; }
              createOrder.mutate({
                tenantId,
                supplierId: Number(form.supplierId),
                deliveryDate: form.expectedDate || "",
                note: form.note || undefined,
                items: validItems.map((i) => ({ productId: Number(i.productId), expectedQty: i.qty, unitPrice: i.unitCost })),
              });
            }}
          >
            {createOrder.isPending ? "建立中..." : "確認建立採購單"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── 供應商新增/編輯 Dialog ── */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "編輯供應商" : "新增供應商"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label>供應商名稱 *</Label>
              <Input value={supplierForm.name} onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如：廣弘食品" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>聯絡人</Label>
                <Input value={supplierForm.contact} onChange={(e) => setSupplierForm((p) => ({ ...p, contact: e.target.value }))} />
              </div>
              <div>
                <Label>電話</Label>
                <Input value={supplierForm.phone} onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>地址</Label>
              <Input value={supplierForm.address} onChange={(e) => setSupplierForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <Label>銀行帳戶</Label>
              <Input value={supplierForm.bankAccount} onChange={(e) => setSupplierForm((p) => ({ ...p, bankAccount: e.target.value }))} placeholder="銀行代碼 + 帳號" />
            </div>
            <div>
              <Label>狀態</Label>
              <Select value={supplierForm.status} onValueChange={(v) => setSupplierForm((p) => ({ ...p, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">合作中</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-amber-600 hover:bg-amber-700" disabled={upsertSupplier.isPending} onClick={handleSaveSupplier}>
            {upsertSupplier.isPending ? "儲存中..." : editingSupplier ? "更新供應商" : "建立供應商"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

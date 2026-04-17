import { useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── helpers ─────────────────────────────────────────────────────────────────

function fmtCost(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function calcMargin(unitCost: number, batchPrice: number) {
  if (!batchPrice || batchPrice <= 0) return null;
  return (((batchPrice - unitCost) / batchPrice) * 100).toFixed(1);
}

// ── SupplierDialog ───────────────────────────────────────────────────────────

function SupplierDialog({
  supplier,
  onClose,
  onSuccess,
}: {
  supplier: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    phone: supplier?.phone ?? "",
    contact: supplier?.contact ?? "",
    paymentType: supplier?.paymentType ?? "現付",
    rebateRate: String(supplier?.rebateRate ?? 0),
    rebateCondition: String(supplier?.rebateCondition ?? 0),
    note: supplier?.note ?? "",
    isActive: supplier?.isActive !== 0,
  });

  const upsert = trpc.osProducts.supplierUpsert.useMutation({
    onSuccess: () => { toast.success("儲存成功"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    upsert.mutate({
      id: supplier?.id,
      name: form.name,
      phone: form.phone || undefined,
      contact: form.contact || undefined,
      paymentType: form.paymentType,
      rebateRate: Number(form.rebateRate),
      rebateCondition: Number(form.rebateCondition),
      isActive: form.isActive,
      note: form.note || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "編輯供應商" : "新增供應商"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">廠商名稱 *</label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">電話</label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">聯絡人</label>
              <Input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">付款方式</label>
              <Select value={form.paymentType} onValueChange={v => setForm(p => ({ ...p, paymentType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["現付", "週結", "月結"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">退佣 %</label>
              <Input type="number" step="0.01" value={form.rebateRate} onChange={e => setForm(p => ({ ...p, rebateRate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">退佣門檻</label>
              <Input type="number" value={form.rebateCondition} onChange={e => setForm(p => ({ ...p, rebateCondition: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">備註</label>
            <Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="isActive" className="text-sm text-gray-700">啟用</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CostDialog ───────────────────────────────────────────────────────────────

function CostDialog({
  product,
  updatedBy,
  onClose,
  onSuccess,
}: {
  product: any;
  updatedBy: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [unitCost, setUnitCost] = useState(String(product.unitCost ?? 0));
  const [batchPrice, setBatchPrice] = useState(String(product.batchPrice ?? 0));

  const mut = trpc.osProducts.updateCost.useMutation({
    onSuccess: () => { toast.success("成本已更新"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mut.mutate({
      id: product.id,
      unitCost: Number(unitCost),
      batchPrice: Number(batchPrice),
      updatedBy,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>更新成本 — {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">進貨成本（元/{product.unit || "件"}）</label>
            <Input type="number" step="0.0001" value={unitCost} onChange={e => setUnitCost(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">批價</label>
            <Input type="number" step="0.0001" value={batchPrice} onChange={e => setBatchPrice(e.target.value)} className="mt-1" />
          </div>
          {Number(batchPrice) > 0 && (
            <p className="text-sm text-gray-500">
              毛利率：{calcMargin(Number(unitCost), Number(batchPrice))}%
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "更新中..." : "更新"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── ProductDialog ────────────────────────────────────────────────────────────

function ProductDialog({
  product,
  suppliers,
  onClose,
  onSuccess,
}: {
  product: any | null;
  suppliers: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    supplierId: product?.supplierId ? String(product.supplierId) : "",
    category: product?.category ?? "",
    name: product?.name ?? "",
    unit: product?.unit ?? "",
    unitSize: String(product?.unitSize ?? 1),
    unitCost: String(product?.unitCost ?? 0),
    batchPrice: String(product?.batchPrice ?? 0),
    batchSize: String(product?.batchSize ?? 1),
    note: product?.note ?? "",
    isActive: product?.isActive !== 0,
  });

  const upsert = trpc.osProducts.productUpsert.useMutation({
    onSuccess: () => { toast.success("儲存成功"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    upsert.mutate({
      id: product?.id,
      supplierId: form.supplierId ? Number(form.supplierId) : undefined,
      category: form.category,
      name: form.name,
      unit: form.unit,
      unitSize: Number(form.unitSize),
      unitCost: Number(form.unitCost),
      batchPrice: Number(form.batchPrice),
      batchSize: Number(form.batchSize),
      note: form.note || undefined,
      isActive: form.isActive,
    });
  }

  const CATEGORIES = ["冷凍", "韓國食材", "乾貨", "冷藏", "茶包", "醬粉", "包材", "OEM", "其他"];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "編輯品項" : "新增品項"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">品名 *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">品類</label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="選擇品類" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">供應商</label>
              <Select value={form.supplierId || "__none"} onValueChange={v => setForm(p => ({ ...p, supplierId: v === "__none" ? "" : v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="未指定" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">未指定</SelectItem>
                  {suppliers.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">單位</label>
              <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="mt-1" placeholder="箱/包/kg" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">單位容量</label>
              <Input type="number" step="0.01" value={form.unitSize} onChange={e => setForm(p => ({ ...p, unitSize: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">進貨成本</label>
              <Input type="number" step="0.0001" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">批價</label>
              <Input type="number" step="0.0001" value={form.batchPrice} onChange={e => setForm(p => ({ ...p, batchPrice: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">批量</label>
              <Input type="number" step="0.01" value={form.batchSize} onChange={e => setForm(p => ({ ...p, batchSize: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">備註</label>
            <Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pIsActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="pIsActive" className="text-sm text-gray-700">啟用</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function OSProducts() {
  const { user } = useAuth();
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any | null>(null);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [editCostProduct, setEditCostProduct] = useState<any | null>(null);

  const utils = trpc.useUtils();

  const suppliers = trpc.osProducts.supplierList.useQuery();
  const products = trpc.osProducts.productList.useQuery({
    supplierId: filterSupplier ? Number(filterSupplier) : undefined,
    category: filterCategory || undefined,
  });

  const deleteProduct = trpc.osProducts.productDelete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.osProducts.productList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteSupplier = trpc.osProducts.supplierDelete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.osProducts.supplierList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const supplierList = suppliers.data ?? [];
  const productList = products.data ?? [];

  const categories = Array.from(new Set(productList.map((p: any) => p.category).filter(Boolean))).sort();

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">品項成本管理</h1>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">品項成本</TabsTrigger>
            <TabsTrigger value="suppliers">供應商管理</TabsTrigger>
          </TabsList>

          {/* ── 品項成本 Tab ── */}
          <TabsContent value="products" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-semibold">品項清單</CardTitle>
                  <div className="ml-auto flex flex-wrap gap-2 items-center">
                    <Select value={filterSupplier || "__all"} onValueChange={v => setFilterSupplier(v === "__all" ? "" : v)}>
                      <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="全部廠商" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">全部廠商</SelectItem>
                        {supplierList.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterCategory || "__all"} onValueChange={v => setFilterCategory(v === "__all" ? "" : v)}>
                      <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="全部品類" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">全部品類</SelectItem>
                        {categories.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8" onClick={() => { setEditProduct(null); setShowProductDialog(true); }}>
                      + 新增品項
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {products.isLoading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">載入中...</div>
                ) : productList.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">尚無品項資料</div>
                ) : (
                  <>
                    {/* 桌面版 */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["品名", "品類", "供應商", "單位", "進貨成本", "批價", "毛利率", "最後更新", ""].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {productList.map((p: any) => {
                            const margin = calcMargin(Number(p.unitCost), Number(p.batchPrice));
                            return (
                              <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? "opacity-50" : ""}`}>
                                <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                                <td className="px-4 py-2.5">
                                  {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">{p.supplierName ?? "-"}</td>
                                <td className="px-4 py-2.5 text-gray-600">{p.unit}</td>
                                <td className="px-4 py-2.5 text-blue-700 font-semibold">{fmtCost(p.unitCost)}</td>
                                <td className="px-4 py-2.5 text-gray-700">{fmtCost(p.batchPrice)}</td>
                                <td className="px-4 py-2.5">
                                  {margin !== null && (
                                    <Badge className={Number(margin) >= 30 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                                      {margin}%
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-gray-500 text-xs">
                                  {p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString("zh-TW") : "-"}
                                  {p.updatedBy && <span className="ml-1 text-gray-400">{p.updatedBy}</span>}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                      onClick={() => setEditCostProduct(p)}>更新成本</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                      onClick={() => { setEditProduct(p); setShowProductDialog(true); }}>編輯</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500 hover:text-red-700"
                                      onClick={() => { if (confirm(`刪除「${p.name}」？`)) deleteProduct.mutate({ id: p.id }); }}>刪除</Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* 手機版 */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {productList.map((p: any) => {
                        const margin = calcMargin(Number(p.unitCost), Number(p.batchPrice));
                        return (
                          <div key={p.id} className={`p-4 space-y-2 ${!p.isActive ? "opacity-50" : ""}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-900">{p.name}</span>
                                {p.category && <Badge variant="secondary" className="ml-2 text-xs">{p.category}</Badge>}
                              </div>
                              <span className="text-blue-700 font-bold">{fmtCost(p.unitCost)}</span>
                            </div>
                            <div className="flex gap-1 text-xs text-gray-500">
                              <span>{p.supplierName ?? "-"}</span>
                              <span>·</span>
                              <span>{p.unit}</span>
                              {margin && <><span>·</span><span>毛利 {margin}%</span></>}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                onClick={() => setEditCostProduct(p)}>更新成本</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                onClick={() => { setEditProduct(p); setShowProductDialog(true); }}>編輯</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500"
                                onClick={() => { if (confirm(`刪除「${p.name}」？`)) deleteProduct.mutate({ id: p.id }); }}>刪除</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── 供應商 Tab ── */}
          <TabsContent value="suppliers" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base font-semibold">供應商清單</CardTitle>
                  <Button size="sm" className="h-8 ml-auto" onClick={() => { setEditSupplier(null); setShowSupplierDialog(true); }}>
                    + 新增供應商
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {suppliers.isLoading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">載入中...</div>
                ) : supplierList.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">尚無供應商資料</div>
                ) : (
                  <>
                    {/* 桌面版 */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {["廠商名稱", "聯絡人", "電話", "付款方式", "退佣", "備註", "狀態", ""].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {supplierList.map((s: any) => (
                            <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.isActive ? "opacity-50" : ""}`}>
                              <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                              <td className="px-4 py-2.5 text-gray-600">{s.contact ?? "-"}</td>
                              <td className="px-4 py-2.5 text-gray-600">{s.phone ?? "-"}</td>
                              <td className="px-4 py-2.5">
                                <Badge variant="secondary">{s.paymentType}</Badge>
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {Number(s.rebateRate) > 0 ? `${s.rebateRate}%` : "-"}
                                {Number(s.rebateCondition) > 0 && <span className="text-xs text-gray-400 ml-1">(≥${Number(s.rebateCondition).toLocaleString()})</span>}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[150px] truncate">{s.note ?? "-"}</td>
                              <td className="px-4 py-2.5">
                                <Badge className={s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                                  {s.isActive ? "啟用" : "停用"}
                                </Badge>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                    onClick={() => { setEditSupplier(s); setShowSupplierDialog(true); }}>編輯</Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500 hover:text-red-700"
                                    onClick={() => { if (confirm(`刪除「${s.name}」？`)) deleteSupplier.mutate({ id: s.id }); }}>刪除</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* 手機版 */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {supplierList.map((s: any) => (
                        <div key={s.id} className={`p-4 space-y-2 ${!s.isActive ? "opacity-50" : ""}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{s.name}</span>
                            <Badge variant="secondary">{s.paymentType}</Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {s.contact && <span>{s.contact} · </span>}
                            {s.phone && <span>{s.phone}</span>}
                            {Number(s.rebateRate) > 0 && <span> · 退佣 {s.rebateRate}%</span>}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                              onClick={() => { setEditSupplier(s); setShowSupplierDialog(true); }}>編輯</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500"
                              onClick={() => { if (confirm(`刪除「${s.name}」？`)) deleteSupplier.mutate({ id: s.id }); }}>刪除</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {showProductDialog && (
        <ProductDialog
          product={editProduct}
          suppliers={supplierList}
          onClose={() => setShowProductDialog(false)}
          onSuccess={() => utils.osProducts.productList.invalidate()}
        />
      )}
      {editCostProduct && (
        <CostDialog
          product={editCostProduct}
          updatedBy={user?.name || user?.email || "admin"}
          onClose={() => setEditCostProduct(null)}
          onSuccess={() => utils.osProducts.productList.invalidate()}
        />
      )}
      {showSupplierDialog && (
        <SupplierDialog
          supplier={editSupplier}
          onClose={() => setShowSupplierDialog(false)}
          onSuccess={() => utils.osProducts.supplierList.invalidate()}
        />
      )}
    </AdminDashboardLayout>
  );
}

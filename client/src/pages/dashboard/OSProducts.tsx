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

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return null;
  return (v * 100).toFixed(1) + "%";
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

// ── IngredientRow ─────────────────────────────────────────────────────────────

type IngRow = {
  productId?: number;
  ingredientName: string;
  quantity: string;
  unit: string;
  costOverride: string;
  ingredientType: "ingredient" | "packaging";
  note: string;
  sortOrder: number;
};

function emptyIngRow(sortOrder = 0): IngRow {
  return { ingredientName: "", quantity: "0", unit: "", costOverride: "", ingredientType: "ingredient", note: "", sortOrder };
}

// ── MenuItemDialog ────────────────────────────────────────────────────────────

function MenuItemDialog({
  item,
  products,
  onClose,
  onSuccess,
}: {
  item: any | null;
  products: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    category: item?.category ?? "",
    name: item?.name ?? "",
    mainIngredient: item?.mainIngredient ?? "",
    servingType: (item?.servingType ?? "both") as "both" | "dine_in_only" | "takeout_only",
    basePrice: String(item?.basePrice ?? ""),
    currentPrice: String(item?.currentPrice ?? ""),
    platformPrice: String(item?.platformPrice ?? ""),
    note: item?.note ?? "",
    isActive: item?.isActive !== 0,
  });

  const [rows, setRows] = useState<IngRow[]>(() => {
    if (item?.ingredients?.length) {
      return item.ingredients.map((ing: any, i: number) => ({
        productId: ing.productId ?? undefined,
        ingredientName: ing.ingredientName ?? "",
        quantity: String(ing.quantity ?? 0),
        unit: ing.unit ?? "",
        costOverride: ing.costOverride !== null && ing.costOverride !== undefined ? String(ing.costOverride) : "",
        ingredientType: (ing.ingredientType ?? "ingredient") as "ingredient" | "packaging",
        note: ing.note ?? "",
        sortOrder: i,
      }));
    }
    return [emptyIngRow(0)];
  });

  const upsert = trpc.osProducts.menuItemUpsert.useMutation();
  const saveIng = trpc.osProducts.menuIngredientSave.useMutation();
  const utils = trpc.useUtils();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await upsert.mutateAsync({
        id: item?.id,
        category: form.category,
        name: form.name,
        mainIngredient: form.mainIngredient || undefined,
        servingType: form.servingType,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        currentPrice: form.currentPrice ? Number(form.currentPrice) : undefined,
        platformPrice: form.platformPrice ? Number(form.platformPrice) : undefined,
        note: form.note || undefined,
        isActive: form.isActive,
      });

      const menuItemId = res.id;
      const validRows = rows.filter(r => r.ingredientName.trim());
      await saveIng.mutateAsync({
        menuItemId,
        ingredients: validRows.map((r, i) => ({
          productId: r.productId,
          ingredientName: r.ingredientName,
          quantity: Number(r.quantity),
          unit: r.unit || undefined,
          costOverride: r.costOverride !== "" ? Number(r.costOverride) : undefined,
          ingredientType: r.ingredientType,
          note: r.note || undefined,
          sortOrder: i,
        })),
      });

      toast.success("儲存成功");
      utils.osProducts.menuItemList.invalidate();
      utils.osProducts.menuCategoryList.invalidate();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function setRow(i: number, patch: Partial<IngRow>) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  function pickProduct(i: number, productId: string) {
    if (productId === "__manual") {
      setRow(i, { productId: undefined });
      return;
    }
    const p = products.find((p: any) => String(p.id) === productId);
    if (p) {
      setRow(i, { productId: p.id, ingredientName: p.name, unit: p.unit ?? "" });
    }
  }

  const isPending = upsert.isPending || saveIng.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "編輯菜單品項" : "新增菜單品項"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">品項名稱 *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">分類 *</label>
              <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required className="mt-1" placeholder="來點什麼 / 來點蛋餅 / ..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">主食描述</label>
              <Input value={form.mainIngredient} onChange={e => setForm(p => ({ ...p, mainIngredient: e.target.value }))} className="mt-1" placeholder="黃金薯餅(3個)" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">供餐方式</label>
              <Select value={form.servingType} onValueChange={v => setForm(p => ({ ...p, servingType: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">內用＋外帶</SelectItem>
                  <SelectItem value="dine_in_only">僅內用</SelectItem>
                  <SelectItem value="takeout_only">僅外帶</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">原始售價</label>
              <Input type="number" step="0.01" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">最新售價</label>
              <Input type="number" step="0.01" value={form.currentPrice} onChange={e => setForm(p => ({ ...p, currentPrice: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">平台售價</label>
              <Input type="number" step="0.01" value={form.platformPrice} onChange={e => setForm(p => ({ ...p, platformPrice: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">備註</label>
            <Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="miIsActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="miIsActive" className="text-sm text-gray-700">啟用</label>
          </div>

          {/* 食材清單 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">食材清單</span>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => setRows(prev => [...prev, emptyIngRow(prev.length)])}>
                + 新增食材
              </Button>
            </div>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_80px_28px] gap-1.5 items-center">
                  <Select
                    value={row.productId ? String(row.productId) : "__manual"}
                    onValueChange={v => pickProduct(i, v)}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選原物料" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual">手動輸入</SelectItem>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-xs"
                    placeholder="食材名稱"
                    value={row.ingredientName}
                    onChange={e => setRow(i, { ingredientName: e.target.value })}
                  />
                  <Input
                    className="h-8 text-xs"
                    type="number"
                    step="0.0001"
                    placeholder="用量"
                    value={row.quantity}
                    onChange={e => setRow(i, { quantity: e.target.value })}
                  />
                  <Input
                    className="h-8 text-xs"
                    placeholder="單位"
                    value={row.unit}
                    onChange={e => setRow(i, { unit: e.target.value })}
                  />
                  <Select value={row.ingredientType} onValueChange={v => setRow(i, { ingredientType: v as any })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingredient">食材</SelectItem>
                      <SelectItem value="packaging">包材</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                    onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}>
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── MenuIngredientDrawer ──────────────────────────────────────────────────────

function MenuIngredientDrawer({
  item,
  hasCostAccess,
  onClose,
}: {
  item: any;
  hasCostAccess: boolean;
  onClose: () => void;
}) {
  const ings: any[] = item.ingredients ?? [];
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.name} — 食材明細</DialogTitle>
        </DialogHeader>
        {ings.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">尚無食材資料</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">食材</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">用量</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">類型</th>
                {hasCostAccess && <th className="px-3 py-2 text-left font-medium text-gray-600">單位成本</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ings.map((ing: any, i: number) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-900">{ing.ingredientName}</td>
                  <td className="px-3 py-2 text-gray-600">{ing.quantity} {ing.unit}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="text-xs">
                      {ing.ingredientType === "packaging" ? "包材" : "食材"}
                    </Badge>
                  </td>
                  {hasCostAccess && (
                    <td className="px-3 py-2 text-blue-700">
                      {ing.resolvedUnitCost !== null && ing.resolvedUnitCost !== undefined
                        ? fmtCost(ing.resolvedUnitCost)
                        : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── OemProductDialog ──────────────────────────────────────────────────────────

type OemIngRow = {
  productId?: number;
  ingredientName: string;
  quantity: string;
  unit: string;
  costOverride: string;
  sortOrder: number;
};

function emptyOemRow(sortOrder = 0): OemIngRow {
  return { ingredientName: "", quantity: "0", unit: "", costOverride: "", sortOrder };
}

function OemProductDialog({
  item,
  products,
  onClose,
  onSuccess,
}: {
  item: any | null;
  products: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    unit: item?.unit ?? "公斤",
    processingFee: String(item?.processingFee ?? 0),
    packagingCost: String(item?.packagingCost ?? 0),
    batchPrice: String(item?.batchPrice ?? ""),
    note: item?.note ?? "",
    isActive: item?.isActive !== 0,
  });

  const [rows, setRows] = useState<OemIngRow[]>(() => {
    if (item?.ingredients?.length) {
      return item.ingredients.map((ing: any, i: number) => ({
        productId: ing.productId ?? undefined,
        ingredientName: ing.ingredientName ?? "",
        quantity: String(ing.quantity ?? 0),
        unit: ing.unit ?? "",
        costOverride: ing.costOverride !== null && ing.costOverride !== undefined ? String(ing.costOverride) : "",
        sortOrder: i,
      }));
    }
    return [emptyOemRow(0)];
  });

  const upsert = trpc.osProducts.oemProductUpsert.useMutation();
  const saveIng = trpc.osProducts.oemIngredientSave.useMutation();
  const utils = trpc.useUtils();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await upsert.mutateAsync({
        id: item?.id,
        name: form.name,
        unit: form.unit,
        processingFee: Number(form.processingFee),
        packagingCost: Number(form.packagingCost),
        batchPrice: form.batchPrice ? Number(form.batchPrice) : undefined,
        note: form.note || undefined,
        isActive: form.isActive,
      });

      const oemProductId = res.id;
      const validRows = rows.filter(r => r.ingredientName.trim());
      await saveIng.mutateAsync({
        oemProductId,
        ingredients: validRows.map((r, i) => ({
          productId: r.productId,
          ingredientName: r.ingredientName,
          quantity: Number(r.quantity),
          unit: r.unit || undefined,
          costOverride: r.costOverride !== "" ? Number(r.costOverride) : undefined,
          sortOrder: i,
        })),
      });

      toast.success("儲存成功");
      utils.osProducts.oemProductList.invalidate();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function setRow(i: number, patch: Partial<OemIngRow>) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  function pickProduct(i: number, productId: string) {
    if (productId === "__manual") { setRow(i, { productId: undefined }); return; }
    const p = products.find((p: any) => String(p.id) === productId);
    if (p) setRow(i, { productId: p.id, ingredientName: p.name, unit: p.unit ?? "" });
  }

  const isPending = upsert.isPending || saveIng.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "編輯 OEM 品項" : "新增 OEM 品項"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">品項名稱 *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">單位</label>
              <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">代工費/單位</label>
              <Input type="number" step="0.0001" value={form.processingFee} onChange={e => setForm(p => ({ ...p, processingFee: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">包材費</label>
              <Input type="number" step="0.0001" value={form.packagingCost} onChange={e => setForm(p => ({ ...p, packagingCost: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">批價</label>
              <Input type="number" step="0.0001" value={form.batchPrice} onChange={e => setForm(p => ({ ...p, batchPrice: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">備註</label>
            <Input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="oemIsActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="oemIsActive" className="text-sm text-gray-700">啟用</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">原料清單</span>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => setRows(prev => [...prev, emptyOemRow(prev.length)])}>
                + 新增原料
              </Button>
            </div>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_28px] gap-1.5 items-center">
                  <Select
                    value={row.productId ? String(row.productId) : "__manual"}
                    onValueChange={v => pickProduct(i, v)}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選原物料" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual">手動輸入</SelectItem>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input className="h-8 text-xs" placeholder="原料名稱" value={row.ingredientName} onChange={e => setRow(i, { ingredientName: e.target.value })} />
                  <Input className="h-8 text-xs" type="number" step="0.0001" placeholder="用量" value={row.quantity} onChange={e => setRow(i, { quantity: e.target.value })} />
                  <Input className="h-8 text-xs" placeholder="單位" value={row.unit} onChange={e => setRow(i, { unit: e.target.value })} />
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                    onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}>
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "儲存中..." : "儲存"}
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

  // Menu tab state
  const [menuCategory, setMenuCategory] = useState<string>("");
  const [editMenuItem, setEditMenuItem] = useState<any | null>(null);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [viewMenuItem, setViewMenuItem] = useState<any | null>(null);

  // OEM tab state
  const [editOemItem, setEditOemItem] = useState<any | null>(null);
  const [showOemDialog, setShowOemDialog] = useState(false);

  const utils = trpc.useUtils();

  const hasCostAccess =
    user?.role === "super_admin" || (user as any)?.has_procurement_access === true;

  const suppliers = trpc.osProducts.supplierList.useQuery();
  const products = trpc.osProducts.productList.useQuery({
    supplierId: filterSupplier ? Number(filterSupplier) : undefined,
    category: filterCategory || undefined,
  });
  const allProducts = trpc.osProducts.productList.useQuery({});

  const menuCategories = trpc.osProducts.menuCategoryList.useQuery();
  const menuItems = trpc.osProducts.menuItemList.useQuery({ category: menuCategory || undefined });

  const oemItems = trpc.osProducts.oemProductList.useQuery(undefined, { enabled: hasCostAccess });

  const deleteProduct = trpc.osProducts.productDelete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.osProducts.productList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteSupplier = trpc.osProducts.supplierDelete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.osProducts.supplierList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMenuItem = trpc.osProducts.menuItemDelete.useMutation({
    onSuccess: () => { toast.success("已刪除"); utils.osProducts.menuItemList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const supplierList = suppliers.data ?? [];
  const productList = products.data ?? [];
  const allProductList = allProducts.data ?? [];
  const menuItemList = menuItems.data ?? [];
  const oemItemList = oemItems.data ?? [];

  const categories = Array.from(new Set(productList.map((p: any) => p.category).filter(Boolean))).sort();

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">品項成本管理</h1>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">品項成本</TabsTrigger>
            <TabsTrigger value="suppliers">供應商管理</TabsTrigger>
            <TabsTrigger value="menu">菜單品項成本</TabsTrigger>
            {hasCostAccess && <TabsTrigger value="oem">OEM 品項</TabsTrigger>}
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

          {/* ── 菜單品項成本 Tab ── */}
          <TabsContent value="menu" className="space-y-3 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-semibold">菜單品項</CardTitle>
                  <div className="ml-auto flex flex-wrap gap-2 items-center">
                    <Select value={menuCategory || "__all"} onValueChange={v => setMenuCategory(v === "__all" ? "" : v)}>
                      <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="全部分類" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all">全部分類</SelectItem>
                        {(menuCategories.data ?? []).map((c: string) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasCostAccess && (
                      <Button size="sm" className="h-8" onClick={() => { setEditMenuItem(null); setShowMenuDialog(true); }}>
                        + 新增品項
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {menuItems.isLoading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">載入中...</div>
                ) : menuItemList.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">尚無菜單品項資料</div>
                ) : (
                  <>
                    {/* 桌面版 */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-600">品項名稱</th>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-600">分類</th>
                            <th className="px-4 py-2.5 text-left font-medium text-gray-600">批價</th>
                            {hasCostAccess && <>
                              <th className="px-4 py-2.5 text-left font-medium text-gray-600">食材成本</th>
                              <th className="px-4 py-2.5 text-left font-medium text-gray-600">包材成本</th>
                              <th className="px-4 py-2.5 text-left font-medium text-gray-600">內用毛利%</th>
                              <th className="px-4 py-2.5 text-left font-medium text-gray-600">外帶毛利%</th>
                            </>}
                            <th className="px-4 py-2.5 text-left font-medium text-gray-600"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {menuItemList.map((item: any) => (
                            <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.isActive ? "opacity-50" : ""}`}>
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                {item.mainIngredient && <div className="text-xs text-gray-400">{item.mainIngredient}</div>}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                              </td>
                              <td className="px-4 py-2.5 text-gray-700">{item.currentPrice ? fmtCost(item.currentPrice) : "-"}</td>
                              {hasCostAccess && <>
                                <td className="px-4 py-2.5 text-blue-700">{item.totalIngredientCost !== null ? fmtCost(item.totalIngredientCost) : "-"}</td>
                                <td className="px-4 py-2.5 text-purple-700">{item.totalPackagingCost !== null ? fmtCost(item.totalPackagingCost) : "-"}</td>
                                <td className="px-4 py-2.5">
                                  {item.dineInMargin !== null && (
                                    <Badge className={Number(item.dineInMargin) >= 0.3 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                                      {fmtPct(item.dineInMargin)}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  {item.takeoutMargin !== null && (
                                    <Badge className={Number(item.takeoutMargin) >= 0.3 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                                      {fmtPct(item.takeoutMargin)}
                                    </Badge>
                                  )}
                                </td>
                              </>}
                              <td className="px-4 py-2.5">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                    onClick={() => setViewMenuItem(item)}>食材</Button>
                                  {hasCostAccess && <>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                      onClick={() => { setEditMenuItem(item); setShowMenuDialog(true); }}>編輯</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500 hover:text-red-700"
                                      onClick={() => { if (confirm(`刪除「${item.name}」？`)) deleteMenuItem.mutate({ id: item.id }); }}>刪除</Button>
                                  </>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* 手機版 */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {menuItemList.map((item: any) => (
                        <div key={item.id} className={`p-4 space-y-2 ${!item.isActive ? "opacity-50" : ""}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">{item.category}</Badge>
                            </div>
                            {item.currentPrice && <span className="text-gray-700 font-semibold">{fmtCost(item.currentPrice)}</span>}
                          </div>
                          {hasCostAccess && item.dineInMargin !== null && (
                            <div className="flex gap-2 text-xs">
                              <span className="text-gray-500">食材 {fmtCost(item.totalIngredientCost)}</span>
                              <span>·</span>
                              <span className="text-gray-500">內用毛利 {fmtPct(item.dineInMargin)}</span>
                            </div>
                          )}
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                              onClick={() => setViewMenuItem(item)}>食材</Button>
                            {hasCostAccess && <>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                onClick={() => { setEditMenuItem(item); setShowMenuDialog(true); }}>編輯</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500"
                                onClick={() => { if (confirm(`刪除「${item.name}」？`)) deleteMenuItem.mutate({ id: item.id }); }}>刪除</Button>
                            </>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── OEM 品項 Tab（hasCostAccess only）── */}
          {hasCostAccess && (
            <TabsContent value="oem" className="space-y-3 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">OEM 品項</CardTitle>
                    <Button size="sm" className="h-8 ml-auto"
                      onClick={() => { setEditOemItem(null); setShowOemDialog(true); }}>
                      + 新增 OEM 品項
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {oemItems.isLoading ? (
                    <div className="p-6 text-center text-gray-400 text-sm">載入中...</div>
                  ) : oemItemList.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">尚無 OEM 品項資料</div>
                  ) : (
                    <>
                      {/* 桌面版 */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              {["品項名稱", "單位", "代工費", "包材費", "批價", "原料數", ""].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {oemItemList.map((item: any) => (
                              <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.isActive ? "opacity-50" : ""}`}>
                                <td className="px-4 py-2.5 font-medium text-gray-900">{item.name}</td>
                                <td className="px-4 py-2.5 text-gray-600">{item.unit}</td>
                                <td className="px-4 py-2.5 text-blue-700">{fmtCost(item.processingFee)}</td>
                                <td className="px-4 py-2.5 text-purple-700">{fmtCost(item.packagingCost)}</td>
                                <td className="px-4 py-2.5 text-gray-700">{item.batchPrice ? fmtCost(item.batchPrice) : "-"}</td>
                                <td className="px-4 py-2.5 text-gray-500">{(item.ingredients ?? []).length} 項</td>
                                <td className="px-4 py-2.5">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                                    onClick={() => { setEditOemItem(item); setShowOemDialog(true); }}>編輯</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* 手機版 */}
                      <div className="md:hidden divide-y divide-gray-100">
                        {oemItemList.map((item: any) => (
                          <div key={item.id} className={`p-4 space-y-2 ${!item.isActive ? "opacity-50" : ""}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-sm text-gray-500">{item.unit}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span>代工費 {fmtCost(item.processingFee)}</span>
                              <span>·</span>
                              <span>包材 {fmtCost(item.packagingCost)}</span>
                              {item.batchPrice && <><span>·</span><span>批價 {fmtCost(item.batchPrice)}</span></>}
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                              onClick={() => { setEditOemItem(item); setShowOemDialog(true); }}>編輯</Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
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
      {showMenuDialog && (
        <MenuItemDialog
          item={editMenuItem}
          products={allProductList}
          onClose={() => setShowMenuDialog(false)}
          onSuccess={() => {
            utils.osProducts.menuItemList.invalidate();
            utils.osProducts.menuCategoryList.invalidate();
          }}
        />
      )}
      {viewMenuItem && (
        <MenuIngredientDrawer
          item={viewMenuItem}
          hasCostAccess={hasCostAccess}
          onClose={() => setViewMenuItem(null)}
        />
      )}
      {showOemDialog && hasCostAccess && (
        <OemProductDialog
          item={editOemItem}
          products={allProductList}
          onClose={() => setShowOemDialog(false)}
          onSuccess={() => utils.osProducts.oemProductList.invalidate()}
        />
      )}
    </AdminDashboardLayout>
  );
}

import { useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Pencil, Plus, Trash2 } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | string | null | undefined, digits = 0) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return "---";
  return (v * 100).toFixed(1) + "%";
}

// ── Tab 1 — MenuItem Drawer ──────────────────────────────────────────────────

type Ingredient = {
  id?: number;
  productId?: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  costOverride?: number;
  ingredientType: "ingredient" | "packaging";
  sortOrder: number;
  resolvedUnitCost?: number | null;
};

function MenuItemDrawer({
  item,
  canSeeCostModules,
  onClose,
  onSuccess,
}: {
  item: any | null;
  canSeeCostModules: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    category: item?.category ?? "",
    name: item?.name ?? "",
    mainIngredient: item?.mainIngredient ?? "",
    servingType: item?.servingType ?? "both",
    basePrice: String(item?.basePrice ?? ""),
    currentPrice: String(item?.currentPrice ?? ""),
    platformPrice: String(item?.platformPrice ?? ""),
    note: item?.note ?? "",
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    (item?.ingredients ?? []).map((ing: any) => ({
      id: ing.id,
      productId: ing.productId ?? undefined,
      ingredientName: ing.ingredientName,
      quantity: Number(ing.quantity),
      unit: ing.unit ?? "",
      costOverride: ing.costOverride !== null && ing.costOverride !== undefined ? Number(ing.costOverride) : undefined,
      ingredientType: ing.ingredientType ?? "ingredient",
      sortOrder: ing.sortOrder ?? 0,
      resolvedUnitCost: ing.resolvedUnitCost ?? null,
    }))
  );

  const upsertItem = trpc.osProducts.menuItemUpsert.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const saveIngredients = trpc.osProducts.menuIngredientSave.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const { data: products = [] } = trpc.osProducts.productList.useQuery(
    {},
    { enabled: canSeeCostModules }
  );

  const totalIngredientCost = ingredients.reduce((sum, ing) => {
    const unitCost = ing.costOverride !== undefined
      ? ing.costOverride
      : (ing.resolvedUnitCost ?? 0);
    return sum + unitCost * ing.quantity;
  }, 0);

  const cp = Number(form.currentPrice) || 0;
  const pp = Number(form.platformPrice) || 0;
  const dineInMargin = cp > 0 ? ((cp / 1.05 - totalIngredientCost) / cp) : null;
  const platformMargin = pp > 0 ? ((pp * 0.6024 - totalIngredientCost) / pp) : null;

  async function submit() {
    const result = await upsertItem.mutateAsync({
      id: item?.id,
      category: form.category,
      name: form.name,
      mainIngredient: form.mainIngredient || undefined,
      servingType: form.servingType as any,
      basePrice: form.basePrice ? Number(form.basePrice) : undefined,
      currentPrice: form.currentPrice ? Number(form.currentPrice) : undefined,
      platformPrice: form.platformPrice ? Number(form.platformPrice) : undefined,
      note: form.note || undefined,
    });
    if (canSeeCostModules) {
      await saveIngredients.mutateAsync({
        menuItemId: result.id,
        ingredients: ingredients.map((ing, i) => ({
          productId: ing.productId,
          ingredientName: ing.ingredientName,
          quantity: ing.quantity,
          unit: ing.unit || undefined,
          costOverride: ing.costOverride,
          ingredientType: ing.ingredientType,
          sortOrder: i,
        })),
      });
    }
    toast.success("儲存成功");
    onSuccess();
    onClose();
  }

  function addIngredient() {
    setIngredients(prev => [...prev, {
      ingredientName: "",
      quantity: 1,
      unit: "份",
      ingredientType: "ingredient",
      sortOrder: prev.length,
    }]);
  }

  function removeIngredient(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  }

  function updateIngredient(idx: number, patch: Partial<Ingredient>) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ...patch } : ing));
  }

  function handleProductSelect(idx: number, productId: string) {
    const pid = Number(productId);
    const product = (products as any[]).find((p: any) => p.id === pid);
    setIngredients(prev => prev.map((ing, i) => i === idx ? {
      ...ing,
      productId: pid,
      ingredientName: product?.name ?? ing.ingredientName,
      unit: product?.unit ?? ing.unit,
      resolvedUnitCost: product?.unitCost != null ? Number(product.unitCost) : null,
      costOverride: undefined,
    } : ing));
  }

  const isPending = upsertItem.isPending || saveIngredients.isPending;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" style={{ background: "#f7f6f3" }}>
        <SheetHeader>
          <SheetTitle className="text-amber-800" style={{ fontFamily: "var(--font-brand)" }}>
            {item ? "編輯品項" : "新增品項"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 基本資料 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-500">分類</label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="分類" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">品項名稱</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="品項名稱" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">主食描述</label>
              <Input value={form.mainIngredient} onChange={e => setForm(f => ({ ...f, mainIngredient: e.target.value }))} placeholder="主食描述" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">供應類型</label>
              <Select value={form.servingType} onValueChange={v => setForm(f => ({ ...f, servingType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">內用＋外帶</SelectItem>
                  <SelectItem value="dine_in_only">僅內用</SelectItem>
                  <SelectItem value="takeout_only">僅外帶</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">售價</label>
              <Input type="number" value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} placeholder="售價" />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">平台價</label>
              <Input type="number" value={form.platformPrice} onChange={e => setForm(f => ({ ...f, platformPrice: e.target.value }))} placeholder="平台價" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-stone-500">備註</label>
              <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="備註" />
            </div>
          </div>

          {/* 食材明細（canSeeCostModules） */}
          {canSeeCostModules && (
            <div className="border-t border-stone-200 pt-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">食材明細</p>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => {
                  const lineCost = (ing.costOverride !== undefined ? ing.costOverride : (ing.resolvedUnitCost ?? 0)) * ing.quantity;
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-1 items-center text-xs">
                      <div className="col-span-3">
                        <Select value={ing.productId ? String(ing.productId) : ""} onValueChange={v => handleProductSelect(idx, v)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="選品項" /></SelectTrigger>
                          <SelectContent>
                            {(products as any[]).map((p: any) => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input className="h-7 text-xs" value={ing.ingredientName} onChange={e => updateIngredient(idx, { ingredientName: e.target.value })} placeholder="食材名" />
                      </div>
                      <div className="col-span-1">
                        <Input className="h-7 text-xs" type="number" value={ing.quantity} onChange={e => updateIngredient(idx, { quantity: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-1">
                        <Input className="h-7 text-xs" value={ing.unit} onChange={e => updateIngredient(idx, { unit: e.target.value })} placeholder="單位" />
                      </div>
                      <div className="col-span-2">
                        <Input className="h-7 text-xs" type="number" value={ing.costOverride ?? ""} onChange={e => updateIngredient(idx, { costOverride: e.target.value ? Number(e.target.value) : undefined })} placeholder={`計算 $${lineCost.toFixed(2)}`} />
                      </div>
                      <div className="col-span-2">
                        <Select value={ing.ingredientType} onValueChange={v => updateIngredient(idx, { ingredientType: v as any })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ingredient">食材</SelectItem>
                            <SelectItem value="packaging">包材</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" onClick={addIngredient} className="mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1" /> 加一行
                </Button>
              </div>

              {/* 統計區塊 */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm space-y-1 border border-amber-200">
                <div className="flex justify-between">
                  <span className="text-stone-600">食材總成本</span>
                  <span className="font-mono font-semibold text-amber-800">{fmt(totalIngredientCost, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">售價毛利率（內用）</span>
                  <span className="font-mono">{fmtPct(dineInMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">平台毛利率</span>
                  <span className="font-mono">{fmtPct(platformMargin)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={submit} disabled={isPending} className="bg-amber-700 hover:bg-amber-800 text-white">
              {isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Tab 2 — OEM Dialog ───────────────────────────────────────────────────────

function OemDialog({
  item,
  onClose,
  onSuccess,
}: {
  item: any | null;
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
  });

  const upsert = trpc.osProducts.oemProductUpsert.useMutation({
    onSuccess: () => { toast.success("儲存成功"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    upsert.mutate({
      id: item?.id,
      name: form.name,
      unit: form.unit,
      processingFee: Number(form.processingFee),
      packagingCost: Number(form.packagingCost),
      batchPrice: form.batchPrice ? Number(form.batchPrice) : undefined,
      note: form.note || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent style={{ background: "#f7f6f3" }}>
        <DialogHeader>
          <DialogTitle className="text-amber-800">{item ? "編輯 OEM 品項" : "新增 OEM 品項"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-stone-500">名稱</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-500">單位</label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">批價</label>
              <Input type="number" value={form.batchPrice} onChange={e => setForm(f => ({ ...f, batchPrice: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">代工費</label>
              <Input type="number" value={form.processingFee} onChange={e => setForm(f => ({ ...f, processingFee: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">包材費</label>
              <Input type="number" value={form.packagingCost} onChange={e => setForm(f => ({ ...f, packagingCost: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">備註</label>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={upsert.isPending} className="bg-amber-700 hover:bg-amber-800 text-white">
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab 1 — MenuItemsTab ─────────────────────────────────────────────────────

function MenuItemsTab({ canSeeCostModules }: { canSeeCostModules: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any | null>(undefined); // undefined = closed

  const { data: allItems = [], refetch } = trpc.osProducts.menuItemList.useQuery(
    { category: selectedCategory ?? undefined },
    { staleTime: 0 }
  );

  const categories = Array.from(new Set((allItems as any[]).map((i: any) => i.category))).sort();

  const servingLabel: Record<string, string> = {
    both: "內用＋外帶",
    dine_in_only: "僅內用",
    takeout_only: "僅外帶",
  };

  return (
    <div className="flex gap-4 h-full min-h-[500px]">
      {/* Sidebar */}
      <aside className="w-44 shrink-0 space-y-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedCategory === null ? "bg-amber-700 text-white font-medium" : "text-stone-600 hover:bg-stone-200"}`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedCategory === cat ? "bg-amber-700 text-white font-medium" : "text-stone-600 hover:bg-stone-200"}`}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-end mb-2">
          <Button size="sm" onClick={() => setEditItem(null)} className="bg-amber-700 hover:bg-amber-800 text-white">
            <Plus className="h-4 w-4 mr-1" /> 新增品項
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs text-stone-400 uppercase">
              <th className="text-left pb-2 font-medium">品項名稱</th>
              <th className="text-left pb-2 font-medium">主食描述</th>
              <th className="text-left pb-2 font-medium">供應</th>
              <th className="text-right pb-2 font-medium">售價</th>
              <th className="text-right pb-2 font-medium">平台價</th>
              {canSeeCostModules && <>
                <th className="text-right pb-2 font-medium">食材成本</th>
                <th className="text-right pb-2 font-medium">毛利率</th>
              </>}
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {(allItems as any[]).map((item: any) => (
              <tr key={item.id} className="border-b border-stone-100 hover:bg-amber-50/40 transition-colors">
                <td className="py-2 font-medium text-stone-800">{item.name}</td>
                <td className="py-2 text-stone-500">{item.mainIngredient ?? "—"}</td>
                <td className="py-2">
                  <Badge variant="outline" className="text-[10px]">{servingLabel[item.servingType] ?? item.servingType}</Badge>
                </td>
                <td className="py-2 text-right font-mono">{item.currentPrice ? fmt(item.currentPrice) : "—"}</td>
                <td className="py-2 text-right font-mono">{item.platformPrice ? fmt(item.platformPrice) : "—"}</td>
                {canSeeCostModules && <>
                  <td className="py-2 text-right font-mono text-amber-700">{item.dineInCost !== null ? fmt(item.dineInCost, 2) : "---"}</td>
                  <td className="py-2 text-right font-mono">{item.dineInMargin !== null ? fmtPct(item.dineInMargin) : "---"}</td>
                </>}
                <td className="py-2">
                  <button onClick={() => setEditItem(item)} className="text-stone-400 hover:text-amber-700 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(allItems as any[]).length === 0 && (
              <tr>
                <td colSpan={canSeeCostModules ? 8 : 6} className="py-8 text-center text-stone-400">尚無品項</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editItem !== undefined && (
        <MenuItemDrawer
          item={editItem}
          canSeeCostModules={canSeeCostModules}
          onClose={() => setEditItem(undefined)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// ── Tab 2 — OemTab ───────────────────────────────────────────────────────────

function OemTab({ canSeeCostModules }: { canSeeCostModules: boolean }) {
  const [editItem, setEditItem] = useState<any | null>(undefined);

  const { data: items = [], refetch } = trpc.osProducts.oemProductList.useQuery(undefined, { staleTime: 0 });

  return (
    <div>
      {canSeeCostModules && (
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={() => setEditItem(null)} className="bg-amber-700 hover:bg-amber-800 text-white">
            <Plus className="h-4 w-4 mr-1" /> 新增 OEM 品項
          </Button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs text-stone-400 uppercase">
            <th className="text-left pb-2 font-medium">名稱</th>
            <th className="text-left pb-2 font-medium">單位</th>
            <th className="text-right pb-2 font-medium">代工費</th>
            <th className="text-right pb-2 font-medium">包材費</th>
            <th className="text-right pb-2 font-medium">批價</th>
            <th className="text-left pb-2 font-medium">備註</th>
            {canSeeCostModules && <th className="pb-2" />}
          </tr>
        </thead>
        <tbody>
          {(items as any[]).map((item: any) => (
            <tr key={item.id} className="border-b border-stone-100 hover:bg-amber-50/40 transition-colors">
              <td className="py-2 font-medium text-stone-800">{item.name}</td>
              <td className="py-2 text-stone-500">{item.unit}</td>
              <td className="py-2 text-right font-mono">{fmt(item.processingFee, 2)}</td>
              <td className="py-2 text-right font-mono">{fmt(item.packagingCost, 2)}</td>
              <td className="py-2 text-right font-mono">{item.batchPrice ? fmt(item.batchPrice, 2) : "—"}</td>
              <td className="py-2 text-stone-400">{item.note ?? "—"}</td>
              {canSeeCostModules && (
                <td className="py-2">
                  <button onClick={() => setEditItem(item)} className="text-stone-400 hover:text-amber-700 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {(items as any[]).length === 0 && (
            <tr>
              <td colSpan={canSeeCostModules ? 7 : 6} className="py-8 text-center text-stone-400">尚無 OEM 品項</td>
            </tr>
          )}
        </tbody>
      </table>

      {editItem !== undefined && (
        <OemDialog
          item={editItem}
          onClose={() => setEditItem(undefined)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// ── Tab 3 — AuditLogTab ──────────────────────────────────────────────────────

function AuditLogTab() {
  const [tableTarget, setTableTarget] = useState<"os_products" | "os_menu_items" | "os_oem_products">("os_menu_items");
  const [recordId, setRecordId] = useState("");
  const [queryKey, setQueryKey] = useState<{ tableTarget: any; recordId: number } | null>(null);

  const { data: logs = [] } = trpc.osProducts.costAuditLog.useQuery(
    queryKey!,
    { enabled: !!queryKey }
  );

  function search() {
    if (!recordId || isNaN(Number(recordId))) return;
    setQueryKey({ tableTarget, recordId: Number(recordId) });
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 items-end">
        <div>
          <label className="text-xs font-medium text-stone-500 block mb-1">資料表</label>
          <Select value={tableTarget} onValueChange={v => setTableTarget(v as any)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="os_menu_items">菜單品項</SelectItem>
              <SelectItem value="os_products">食材品項</SelectItem>
              <SelectItem value="os_oem_products">OEM 品項</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500 block mb-1">品項 ID</label>
          <Input value={recordId} onChange={e => setRecordId(e.target.value)} placeholder="輸入 ID" className="w-32" />
        </div>
        <Button onClick={search} className="bg-amber-700 hover:bg-amber-800 text-white">查詢</Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs text-stone-400 uppercase">
            <th className="text-left pb-2 font-medium">時間</th>
            <th className="text-left pb-2 font-medium">修改人</th>
            <th className="text-left pb-2 font-medium">欄位</th>
            <th className="text-left pb-2 font-medium">改前</th>
            <th className="text-left pb-2 font-medium">改後</th>
          </tr>
        </thead>
        <tbody>
          {(logs as any[]).map((log: any) => (
            <tr key={log.id} className="border-b border-stone-100">
              <td className="py-2 font-mono text-xs text-stone-400">{new Date(log.changedAt).toLocaleString("zh-TW")}</td>
              <td className="py-2 text-stone-700">{log.changedBy}</td>
              <td className="py-2 text-stone-500">{log.fieldName}</td>
              <td className="py-2 font-mono text-red-500">{log.oldValue ?? "—"}</td>
              <td className="py-2 font-mono text-green-600">{log.newValue ?? "—"}</td>
            </tr>
          ))}
          {!queryKey && (
            <tr><td colSpan={5} className="py-8 text-center text-stone-400">請輸入品項 ID 後查詢</td></tr>
          )}
          {queryKey && (logs as any[]).length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-stone-400">無修改記錄</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OSCaMenu() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const canSeeCostModules = isSuperAdmin || (user as any)?.has_procurement_access === true;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-800" style={{ fontFamily: "var(--font-brand)" }}>
            菜單成本管理
          </h1>
          <p className="text-sm text-stone-400 mt-1">CA 表單數位化 — 菜單品項、OEM 品項與成本歷史</p>
        </div>

        <Tabs defaultValue="menu" className="space-y-4">
          <TabsList className="bg-stone-200/60">
            <TabsTrigger value="menu">菜單品項成本</TabsTrigger>
            <TabsTrigger value="oem">OEM 品項</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="audit">成本修改歷史</TabsTrigger>}
          </TabsList>

          <TabsContent value="menu">
            <MenuItemsTab canSeeCostModules={canSeeCostModules} />
          </TabsContent>

          <TabsContent value="oem">
            <OemTab canSeeCostModules={canSeeCostModules} />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="audit">
              <AuditLogTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}

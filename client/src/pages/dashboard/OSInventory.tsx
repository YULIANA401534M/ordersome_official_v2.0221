import { useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";


type InventoryItem = {
  id: number;
  supplierName: string;
  productName: string;
  category: string;
  unit: string;
  currentQty: number;
  safetyQty: number;
  lastCountDate: string | null;
};

function StatusBadge({ item }: { item: InventoryItem }) {
  const cur = Number(item.currentQty);
  const safe = Number(item.safetyQty);
  if (cur === 0) return <Badge className="bg-red-500 text-white">缺貨</Badge>;
  if (safe > 0 && cur < safe) return <Badge className="bg-orange-500 text-white">低庫存</Badge>;
  if (safe === 0) return <Badge className="bg-gray-400 text-white">未設警戒</Badge>;
  return <Badge className="bg-green-500 text-white">正常</Badge>;
}

export default function OSInventory() {
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [belowSafety, setBelowSafety] = useState(false);

  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item?: InventoryItem }>({ open: false });
  const [safetyDialog, setSafetyDialog] = useState<{ open: boolean; item?: InventoryItem }>({ open: false });
  const [addDialog, setAddDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; item?: InventoryItem }>({ open: false });

  // 批次盤點
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchQtys, setBatchQtys] = useState<Record<number, string>>({});
  const [batchNote, setBatchNote] = useState("");
  const [batchDone, setBatchDone] = useState<number | null>(null);

  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [safetyQtyInput, setSafetyQtyInput] = useState("");

  const { data: yulianSuppliers = [] } = trpc.inventory.listYulianSuppliers.useQuery();
  const [newSupplier, setNewSupplier] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newUnit, setNewUnit] = useState("包");
  const [newCategory, setNewCategory] = useState("未分類");
  const [newUnitCost, setNewUnitCost] = useState("");
  const [newSafetyQty, setNewSafetyQty] = useState("");

  const { data: items = [], refetch } = trpc.inventory.list.useQuery({
    supplierName: filterSupplier === "all" ? undefined : filterSupplier,
    category: filterCategory === "all" ? undefined : filterCategory,
    belowSafety: belowSafety || undefined,
  });

  const adjustMut = trpc.inventory.adjust.useMutation({ onSuccess: () => { refetch(); setAdjustDialog({ open: false }); } });
  const safetyMut = trpc.inventory.setSafety.useMutation({ onSuccess: () => { refetch(); setSafetyDialog({ open: false }); } });
  const countMut = trpc.inventory.count.useMutation();
  const addMut = trpc.inventory.addProduct.useMutation({ onSuccess: () => { refetch(); setAddDialog(false); resetAddForm(); } });

  const { data: historyRows = [] } = trpc.inventory.getHistory.useQuery(
    { inventoryId: historyDialog.item?.id ?? 0 },
    { enabled: historyDialog.open && !!historyDialog.item }
  );

  const categories = Array.from(new Set((items as InventoryItem[]).map(i => i.category).filter(Boolean)));

  const outOfStock = (items as InventoryItem[]).filter(i => Number(i.currentQty) === 0).length;
  const lowStock = (items as InventoryItem[]).filter(i => Number(i.safetyQty) > 0 && Number(i.currentQty) > 0 && Number(i.currentQty) < Number(i.safetyQty)).length;

  function resetAddForm() {
    setNewSupplier(yulianSuppliers[0]?.name ?? "");
    setNewProduct("");
    setNewUnit("包");
    setNewCategory("未分類");
    setNewUnitCost("");
    setNewSafetyQty("");
  }

  function openAdjust(item: InventoryItem) {
    setAdjustQty(String(Number(item.currentQty)));
    setAdjustNote("");
    setAdjustDialog({ open: true, item });
  }

  function openSafety(item: InventoryItem) {
    setSafetyQtyInput(String(Number(item.safetyQty)));
    setSafetyDialog({ open: true, item });
  }

  return (
    <AdminDashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <h1 className="text-2xl font-bold text-[#1c1917]">庫存管理</h1>
          <div className="flex gap-2">
            {batchMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const selected = (items as InventoryItem[]).filter(i => selectedIds.has(i.id));
                    const initQtys: Record<number, string> = {};
                    selected.forEach(i => { initQtys[i.id] = String(Number(i.currentQty)); });
                    setBatchQtys(initQtys);
                    setBatchNote("");
                    setBatchDone(null);
                    setBatchDialog(true);
                  }}
                  disabled={selectedIds.size === 0}
                  className="bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-50"
                >
                  盤點已選取（{selectedIds.size}筆）
                </Button>
                <Button variant="outline" onClick={() => { setBatchMode(false); setSelectedIds(new Set()); }}>
                  取消選取
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setBatchMode(true); setSelectedIds(new Set()); }}>
                  批次盤點
                </Button>
                <Button onClick={() => setAddDialog(true)} className="bg-amber-700 hover:bg-amber-800 text-white">
                  新增品項
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Label className="text-sm">廠商</Label>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部廠商</SelectItem>
                {yulianSuppliers.map(s => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">分類</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分類</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="below-safety"
              checked={belowSafety}
              onCheckedChange={v => setBelowSafety(!!v)}
            />
            <Label htmlFor="below-safety" className="text-sm cursor-pointer">只看低於警戒</Label>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b">
              <tr>
                {batchMode && (
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={(items as InventoryItem[]).length > 0 && selectedIds.size === (items as InventoryItem[]).length}
                      onCheckedChange={v => {
                        if (v) setSelectedIds(new Set((items as InventoryItem[]).map(i => i.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                )}
                {["廠商", "品項名稱", "分類", "單位", "目前庫存", "安全庫存", "狀態", "最後盤點", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-stone-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(items as InventoryItem[]).length === 0 ? (
                <tr>
                  <td colSpan={batchMode ? 10 : 9} className="px-4 py-12 text-center text-stone-400">
                    尚無庫存品項，請點「新增品項」開始建立
                  </td>
                </tr>
              ) : (
                (items as InventoryItem[]).map(item => (
                  <tr key={item.id} className={`border-b hover:bg-stone-50 transition-colors ${batchMode && selectedIds.has(item.id) ? "bg-amber-50" : ""}`}>
                    {batchMode && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={v => {
                            const next = new Set(selectedIds);
                            if (v) next.add(item.id); else next.delete(item.id);
                            setSelectedIds(next);
                          }}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">{item.supplierName}</td>
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3 text-stone-500">{item.category || "-"}</td>
                    <td className="px-4 py-3 text-stone-500">{item.unit}</td>
                    <td className="px-4 py-3 font-medium">{Number(item.currentQty).toFixed(2)}</td>
                    <td className="px-4 py-3 text-stone-500">{Number(item.safetyQty).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge item={item} /></td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{item.lastCountDate ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openAdjust(item)}>調整</Button>
                        <Button size="sm" variant="outline" onClick={() => openSafety(item)}>設警戒值</Button>
                        <Button size="sm" variant="outline" onClick={() => setHistoryDialog({ open: true, item })}>歷史</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-sm text-stone-500">總品項數</p>
            <p className="text-3xl font-bold text-[#1c1917] mt-1" style={{ fontFamily: 'jf-kamabit' }}>
              {(items as InventoryItem[]).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-sm text-stone-500">缺貨品項數</p>
            <p className="text-3xl font-bold text-red-600 mt-1" style={{ fontFamily: 'jf-kamabit' }}>
              {outOfStock}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-sm text-stone-500">低庫存品項數</p>
            <p className="text-3xl font-bold text-orange-500 mt-1" style={{ fontFamily: 'jf-kamabit' }}>
              {lowStock}
            </p>
          </div>
        </div>
      </div>

      {/* Adjust Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={o => setAdjustDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>調整庫存 — {adjustDialog.item?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>新的庫存數量</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>調整原因（必填）</Label>
              <textarea
                className="w-full border rounded-md p-2 text-sm mt-1 min-h-[72px] resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                placeholder="請說明調整原因"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false })}>取消</Button>
            <Button
              onClick={() => {
                if (!adjustDialog.item) return;
                adjustMut.mutate({ id: adjustDialog.item.id, newQty: Number(adjustQty), note: adjustNote || "" });
              }}
              disabled={adjustMut.isPending || !adjustNote.trim()}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              {adjustMut.isPending ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Qty Dialog */}
      <Dialog open={safetyDialog.open} onOpenChange={o => setSafetyDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>設定安全庫存 — {safetyDialog.item?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>安全庫存量（警戒值）</Label>
              <Input
                type="number"
                value={safetyQtyInput}
                onChange={e => setSafetyQtyInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSafetyDialog({ open: false })}>取消</Button>
            <Button
              onClick={() => {
                if (!safetyDialog.item) return;
                safetyMut.mutate({ id: safetyDialog.item.id, safetyQty: Number(safetyQtyInput) });
              }}
              disabled={safetyMut.isPending}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              {safetyMut.isPending ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增庫存品項</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>廠商</Label>
              <Select value={newSupplier} onValueChange={setNewSupplier}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yulianSuppliers.map(s => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>品項名稱</Label>
              <Input value={newProduct} onChange={e => setNewProduct(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>單位</Label>
                <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>分類</Label>
                <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>單位成本（選填）</Label>
                <Input type="number" value={newUnitCost} onChange={e => setNewUnitCost(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>安全庫存量（選填）</Label>
                <Input type="number" value={newSafetyQty} onChange={e => setNewSafetyQty(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>取消</Button>
            <Button
              onClick={() => {
                if (!newProduct.trim()) return;
                addMut.mutate({
                  supplierName: newSupplier,
                  productName: newProduct.trim(),
                  unit: newUnit || "包",
                  category: newCategory || "未分類",
                  unitCost: newUnitCost ? Number(newUnitCost) : undefined,
                  safetyQty: newSafetyQty ? Number(newSafetyQty) : undefined,
                });
              }}
              disabled={addMut.isPending || !newProduct.trim()}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              {addMut.isPending ? "新增中…" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Count Dialog */}
      <Dialog open={batchDialog} onOpenChange={o => { if (!o) setBatchDialog(false); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批次盤點</DialogTitle>
          </DialogHeader>
          {batchDone !== null ? (
            <div className="py-8 text-center text-green-600 font-semibold text-lg">
              已完成 {batchDone} 筆盤點
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-3">
                {(items as InventoryItem[]).filter(i => selectedIds.has(i.id)).map(item => (
                  <div key={item.id} className="flex items-center gap-3 border rounded-md p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-stone-400">目前庫存：{Number(item.currentQty).toFixed(2)} {item.unit}</p>
                    </div>
                    <Input
                      type="number"
                      className="w-28 text-right"
                      value={batchQtys[item.id] ?? ""}
                      onChange={e => setBatchQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="盤點數量"
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>備註（選填，所有品項共用）</Label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm mt-1 min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={batchNote}
                  onChange={e => setBatchNote(e.target.value)}
                  placeholder="例：2026-03-31 盤點"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialog(false)}>
              {batchDone !== null ? "關閉" : "取消"}
            </Button>
            {batchDone === null && (
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                disabled={countMut.isPending}
                onClick={async () => {
                  const selected = (items as InventoryItem[]).filter(i => selectedIds.has(i.id));
                  let doneCount = 0;
                  for (const item of selected) {
                    const qtyStr = batchQtys[item.id];
                    if (qtyStr === undefined || qtyStr === "") continue;
                    try {
                      await countMut.mutateAsync({
                        id: item.id,
                        countQty: Number(qtyStr),
                        note: batchNote.trim() || undefined,
                      });
                      doneCount++;
                    } catch {
                      // 繼續下一筆
                    }
                  }
                  setBatchDone(doneCount);
                  refetch();
                  setBatchMode(false);
                  setSelectedIds(new Set());
                }}
              >
                {countMut.isPending ? "盤點中…" : "確認盤點"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 歷史異動 Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={o => setHistoryDialog({ open: o })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>庫存異動記錄 — {historyDialog.item?.productName}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b">
                <tr>
                  {["時間", "類型", "變動數量", "變動前", "變動後", "來源", "備註"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-stone-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(historyRows as any[]).length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-stone-400">尚無異動記錄</td></tr>
                ) : (historyRows as any[]).map((r: any, i: number) => {
                  const typeMap: Record<string, string> = { in: "入庫", out: "出庫", adjust: "手動調整", count: "盤點" };
                  return (
                    <tr key={i} className="border-b hover:bg-stone-50">
                      <td className="px-3 py-2 text-xs text-stone-500 whitespace-nowrap">{String(r.createdAt).slice(0, 16)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{typeMap[r.changeType] ?? r.changeType}</td>
                      <td className="px-3 py-2 text-right font-medium">{Number(r.qty) > 0 ? `+${Number(r.qty).toFixed(2)}` : Number(r.qty).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-stone-500">{Number(r.qtyBefore).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-stone-500">{Number(r.qtyAfter).toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-stone-400">{r.refType ?? "-"}{r.refId ? ` #${r.refId}` : ""}</td>
                      <td className="px-3 py-2 text-xs text-stone-400 max-w-[160px] truncate">{r.note ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialog({ open: false })}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

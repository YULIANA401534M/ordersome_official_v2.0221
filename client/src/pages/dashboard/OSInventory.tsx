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

const YULIAN_SUPPLIERS = ["宇聯", "宇聯_配合", "立墩", "三柳", "凱蒂"];

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

  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [safetyQtyInput, setSafetyQtyInput] = useState("");

  const [newSupplier, setNewSupplier] = useState(YULIAN_SUPPLIERS[0]);
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
  const addMut = trpc.inventory.addProduct.useMutation({ onSuccess: () => { refetch(); setAddDialog(false); resetAddForm(); } });

  const categories = Array.from(new Set((items as InventoryItem[]).map(i => i.category).filter(Boolean)));

  const outOfStock = (items as InventoryItem[]).filter(i => Number(i.currentQty) === 0).length;
  const lowStock = (items as InventoryItem[]).filter(i => Number(i.safetyQty) > 0 && Number(i.currentQty) > 0 && Number(i.currentQty) < Number(i.safetyQty)).length;

  function resetAddForm() {
    setNewSupplier(YULIAN_SUPPLIERS[0]);
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
            <Button variant="outline" disabled>批次盤點</Button>
            <Button onClick={() => setAddDialog(true)} className="bg-amber-700 hover:bg-amber-800 text-white">
              新增品項
            </Button>
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
                {YULIAN_SUPPLIERS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
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
                {["廠商", "品項名稱", "分類", "單位", "目前庫存", "安全庫存", "狀態", "最後盤點", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-stone-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(items as InventoryItem[]).length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-stone-400">
                    尚無庫存品項，請點「新增品項」開始建立
                  </td>
                </tr>
              ) : (
                (items as InventoryItem[]).map(item => (
                  <tr key={item.id} className="border-b hover:bg-stone-50 transition-colors">
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
              <Label>備註（選填）</Label>
              <Input
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false })}>取消</Button>
            <Button
              onClick={() => {
                if (!adjustDialog.item) return;
                adjustMut.mutate({ id: adjustDialog.item.id, newQty: Number(adjustQty), note: adjustNote || undefined });
              }}
              disabled={adjustMut.isPending}
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
                  {YULIAN_SUPPLIERS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
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
    </AdminDashboardLayout>
  );
}

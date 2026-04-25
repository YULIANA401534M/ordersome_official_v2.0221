import { useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

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

const thSt: React.CSSProperties = {
  color: 'var(--os-text-3)',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

function StatusBadge({ item }: { item: InventoryItem }) {
  const cur = Number(item.currentQty);
  const safe = Number(item.safetyQty);
  let style: React.CSSProperties;
  let label: string;
  if (cur === 0) {
    style = { background: 'var(--os-danger-bg)', color: 'var(--os-danger)' };
    label = '缺貨';
  } else if (safe > 0 && cur < safe) {
    style = { background: 'var(--os-warning-bg)', color: 'var(--os-warning)' };
    label = '低庫存';
  } else if (safe === 0) {
    style = { background: 'var(--os-surface-2)', color: 'var(--os-text-3)' };
    label = '未設警戒';
  } else {
    style = { background: 'var(--os-success-bg)', color: 'var(--os-success)' };
    label = '正常';
  }
  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'center', padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
      {label}
    </span>
  );
}

const amberBtn: React.CSSProperties = { background: 'var(--os-amber)', color: '#fff' };

export default function OSInventory() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [belowSafety, setBelowSafety] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 30;

  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item?: InventoryItem }>({ open: false });
  const [safetyDialog, setSafetyDialog] = useState<{ open: boolean; item?: InventoryItem }>({ open: false });
  const [addDialog, setAddDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; item?: InventoryItem }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

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

  const { data: valueStats } = trpc.inventory.getTotalValue.useQuery();

  const { data: items = [], refetch } = trpc.inventory.list.useQuery({
    supplierName: filterSupplier === "all" ? undefined : filterSupplier,
    category: filterCategory === "all" ? undefined : filterCategory,
    belowSafety: belowSafety || undefined,
  });

  const adjustMut = trpc.inventory.adjust.useMutation({ onSuccess: () => { refetch(); setAdjustDialog({ open: false }); } });
  const safetyMut = trpc.inventory.setSafety.useMutation({ onSuccess: () => { refetch(); setSafetyDialog({ open: false }); } });
  const countMut = trpc.inventory.count.useMutation();
  const addMut = trpc.inventory.addProduct.useMutation({ onSuccess: () => { refetch(); setAddDialog(false); resetAddForm(); } });
  const deleteMut = trpc.inventory.deleteItem.useMutation({
    onSuccess: () => {
      toast.success("品項已刪除");
      setDeleteTarget(null);
      setDeleteReason("");
      refetch();
    },
  });

  const { data: historyRows = [] } = trpc.inventory.getHistory.useQuery(
    { inventoryId: historyDialog.item?.id ?? 0 },
    { enabled: historyDialog.open && !!historyDialog.item }
  );

  const categories = Array.from(new Set((items as InventoryItem[]).map(i => i.category).filter(Boolean)));
  const totalPages = Math.ceil((items as InventoryItem[]).length / PAGE_SIZE);
  const pagedItems = (items as InventoryItem[]).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
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
    setAdjustQty(String(Math.round(Number(item.currentQty))));
    setAdjustNote("");
    setAdjustDialog({ open: true, item });
  }

  function openSafety(item: InventoryItem) {
    setSafetyQtyInput(String(Math.round(Number(item.safetyQty))));
    setSafetyDialog({ open: true, item });
  }

  return (
    <AdminDashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--os-text-1)', margin: 0 }}>庫存管理</h1>
            <p style={{ fontSize: 13, color: 'var(--os-text-3)', marginTop: 4 }}>庫存查詢、盤點調整、品項管理</p>
          </div>
          <div className="flex gap-2">
            {batchMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const selected = (items as InventoryItem[]).filter(i => selectedIds.has(i.id));
                    const initQtys: Record<number, string> = {};
                    selected.forEach(i => { initQtys[i.id] = String(Math.round(Number(i.currentQty))); });
                    setBatchQtys(initQtys);
                    setBatchNote("");
                    setBatchDone(null);
                    setBatchDialog(true);
                  }}
                  disabled={selectedIds.size === 0}
                  className="text-white disabled:opacity-50"
                  style={amberBtn}
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
                <Button className="text-white" style={amberBtn} onClick={() => setAddDialog(true)}>
                  新增品項
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap gap-3 items-center"
          style={{
            background: 'var(--os-surface)',
            border: '1px solid var(--os-border)',
            borderRadius: 8,
            padding: '12px 16px',
          }}
        >
          <div className="flex items-center gap-2">
            <Label style={{ fontSize: 13, color: 'var(--os-text-2)' }}>廠商</Label>
            <Select value={filterSupplier} onValueChange={v => { setFilterSupplier(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部廠商</SelectItem>
                {yulianSuppliers.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label style={{ fontSize: 13, color: 'var(--os-text-2)' }}>分類</Label>
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分類</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="below-safety" checked={belowSafety} onCheckedChange={v => { setBelowSafety(!!v); setCurrentPage(1); }} />
            <Label htmlFor="below-safety" style={{ fontSize: 13, color: 'var(--os-text-2)', cursor: 'pointer' }}>只看低於警戒</Label>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-5 px-1">
          <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
            共 <strong style={{ color: 'var(--os-text-1)' }}>{(items as InventoryItem[]).length}</strong> 筆
          </span>
          <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
            缺貨 <strong style={{ color: 'var(--os-danger)' }}>{outOfStock}</strong> 筆
          </span>
          <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
            低庫存 <strong style={{ color: 'var(--os-warning)' }}>{lowStock}</strong> 筆
          </span>
          {valueStats && (
            <>
              <span style={{ color: 'var(--os-border)' }}>|</span>
              <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
                庫存總資產 <strong style={{ color: 'var(--os-text-1)' }}>${Math.round(valueStats.totalValue).toLocaleString()}</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
                B類自配 <strong style={{ color: 'var(--os-amber-text)' }}>${Math.round(valueStats.bValue).toLocaleString()}</strong>（{valueStats.bCount} 品項）
              </span>
            </>
          )}
        </div>

        {/* Summary strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 py-2" style={{ borderBottom: '1px solid var(--os-border-2)' }}>
          <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
            共 <strong style={{ color: 'var(--os-text-1)', fontVariantNumeric: 'tabular-nums' }}>{(items as InventoryItem[]).length}</strong> 品項
          </span>
          <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
            缺貨 <strong style={{ color: 'var(--os-danger)', fontVariantNumeric: 'tabular-nums' }}>{outOfStock}</strong> 筆
          </span>
          <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
            低庫存 <strong style={{ color: 'var(--os-amber-text)', fontVariantNumeric: 'tabular-nums' }}>{lowStock}</strong> 筆
          </span>
          {valueStats && (
            <>
              <span style={{ color: 'var(--os-border)', alignSelf: 'center' }}>|</span>
              <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
                庫存資產 <strong style={{ color: 'var(--os-text-1)', fontVariantNumeric: 'tabular-nums' }}>${Math.round(valueStats.totalValue).toLocaleString()}</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--os-text-3)' }}>
                B類 <strong style={{ color: 'var(--os-amber-text)', fontVariantNumeric: 'tabular-nums' }}>${Math.round(valueStats.bValue).toLocaleString()}</strong>
                <span style={{ fontSize: 11, marginLeft: 4 }}>({valueStats.bCount} 項)</span>
              </span>
            </>
          )}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--os-surface)', border: '1px solid var(--os-border)', borderRadius: 10, overflow: 'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
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
                {["廠商", "品項名稱", "分類", "目前庫存", "庫存金額", "安全庫存", "狀態", "最後修改", "操作"].map(h => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap" style={thSt}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(items as InventoryItem[]).length === 0 ? (
                <tr>
                  <td colSpan={batchMode ? 10 : 9} className="px-4 py-12 text-center" style={{ color: 'var(--os-text-3)' }}>
                    尚無庫存品項，請點「新增品項」開始建立
                  </td>
                </tr>
              ) : (
                pagedItems.map(item => (
                  <tr
                    key={item.id}
                    style={{
                      borderTop: '1px solid var(--os-border-2)',
                      background: batchMode && selectedIds.has(item.id) ? 'var(--os-amber-soft)' : '',
                    }}
                    onMouseEnter={e => {
                      if (!(batchMode && selectedIds.has(item.id)))
                        e.currentTarget.style.background = 'var(--os-amber-soft)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = batchMode && selectedIds.has(item.id) ? 'var(--os-amber-soft)' : '';
                    }}
                  >
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
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--os-text-2)' }}>{item.supplierName}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--os-text-1)', fontWeight: 500 }}>{item.productName}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--os-text-3)' }}>{item.category || "未分類"}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--os-text-1)' }}>
                      {Math.round(Number(item.currentQty)).toLocaleString()} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--os-amber-text)', fontSize: 13 }}>
                      {(item as any).itemValue > 0 ? `$${Math.round((item as any).itemValue).toLocaleString()}` : "-"}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--os-text-3)' }}>
                      {Number(item.safetyQty) === 0 ? "-" : `${Math.round(Number(item.safetyQty)).toLocaleString()} ${item.unit}`}
                    </td>
                    <td className="px-4 py-3"><StatusBadge item={item} /></td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--os-text-3)', fontSize: 12 }}>
                      {(item as any).updatedAt
                        ? new Date((item as any).updatedAt).toLocaleString("zh-TW", {
                            year: "numeric", month: "2-digit", day: "2-digit",
                            hour: "2-digit", minute: "2-digit", hour12: false,
                          }).replace(/\//g, "-")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAdjust(item)}>調整庫存</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSafety(item)}>設警戒值</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setHistoryDialog({ open: true, item })}>異動歷史</DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                style={{ color: 'var(--os-danger)' }}
                                onClick={() => setDeleteTarget(item)}
                              >
                                刪除品項
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: '1px solid var(--os-border)' }}
            >
              <span style={{ fontSize: 12, color: 'var(--os-text-3)' }}>
                第 {currentPage} / {totalPages} 頁，共 {(items as InventoryItem[]).length} 筆
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}>上一頁</Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}>下一頁</Button>
              </div>
            </div>
          )}
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
              <Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>調整原因（必填）</Label>
              <textarea
                className="w-full border rounded-md p-2 text-sm mt-1 min-h-[72px] resize-none focus:outline-none focus:ring-1"
                style={{ borderColor: 'var(--os-border)' }}
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                placeholder="請說明調整原因"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false })}>取消</Button>
            <Button
              className="text-white"
              style={amberBtn}
              onClick={() => {
                if (!adjustDialog.item) return;
                adjustMut.mutate({ id: adjustDialog.item.id, newQty: Number(adjustQty), note: adjustNote });
              }}
              disabled={adjustMut.isPending || !adjustNote.trim()}
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
                min="0"
                value={safetyQtyInput}
                onChange={e => setSafetyQtyInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSafetyDialog({ open: false })}>取消</Button>
            <Button
              className="text-white"
              style={amberBtn}
              onClick={() => {
                if (!safetyDialog.item) return;
                safetyMut.mutate({ id: safetyDialog.item.id, safetyQty: Number(safetyQtyInput) });
              }}
              disabled={safetyMut.isPending || Number(safetyQtyInput) < 0}
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
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yulianSuppliers.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
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
              className="text-white"
              style={amberBtn}
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
            >
              {addMut.isPending ? "新增中…" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Count Dialog */}
      <Dialog open={batchDialog} onOpenChange={o => { if (!o) setBatchDialog(false); }}>
        <DialogContent className="!max-w-lg p-0 gap-0 max-h-[90vh]">
          <div className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--os-border)' }}>
              <DialogTitle style={{ color: 'var(--os-text-1)' }}>批次盤點</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 min-h-0 w-full">
              <div className="px-6 py-4">
                {batchDone !== null ? (
                  <div className="py-8 text-center font-semibold text-lg" style={{ color: 'var(--os-success)' }}>
                    已完成 {batchDone} 筆盤點
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {(items as InventoryItem[]).filter(i => selectedIds.has(i.id)).map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                          style={{ border: '1px solid var(--os-border)', borderRadius: 8, padding: 12 }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: 'var(--os-text-1)' }}>{item.productName}</p>
                            <p style={{ fontSize: 12, color: 'var(--os-text-3)' }}>
                              目前庫存：{Math.round(Number(item.currentQty)).toLocaleString()} {item.unit}
                            </p>
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
                        className="w-full rounded-md p-2 text-sm mt-1 min-h-[60px] resize-none focus:outline-none"
                        style={{ border: '1px solid var(--os-border)' }}
                        value={batchNote}
                        onChange={e => setBatchNote(e.target.value)}
                        placeholder="例：2026-03-31 盤點"
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--os-border)' }}>
              <Button variant="outline" onClick={() => setBatchDialog(false)}>
                {batchDone !== null ? "關閉" : "取消"}
              </Button>
              {batchDone === null && (
                <Button
                  className="text-white"
                  style={amberBtn}
                  disabled={countMut.isPending}
                  onClick={async () => {
                    const selected = (items as InventoryItem[]).filter(i => selectedIds.has(i.id));
                    let doneCount = 0;
                    for (const item of selected) {
                      const qtyStr = batchQtys[item.id];
                      if (qtyStr === undefined || qtyStr === "") continue;
                      try {
                        await countMut.mutateAsync({ id: item.id, countQty: Number(qtyStr), note: batchNote.trim() || undefined });
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
          </div>
        </DialogContent>
      </Dialog>

      {/* 歷史異動 Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={o => setHistoryDialog({ open: o })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>庫存異動記錄 — {historyDialog.item?.productName}</DialogTitle>
            <DialogDescription>近 10 筆異動記錄</DialogDescription>
          </DialogHeader>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
                  {["時間", "類型", "變動數量", "變動前", "變動後", "來源", "備註"].map(h => (
                    <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={thSt}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(historyRows as any[]).length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center" style={{ color: 'var(--os-text-3)' }}>尚無異動記錄</td></tr>
                ) : (historyRows as any[]).map((r: any, i: number) => {
                  const typeMap: Record<string, string> = { in: "入庫", out: "出庫", adjust: "手動調整", count: "盤點" };
                  const qty = Math.round(Number(r.qty));
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--os-border-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--os-amber-soft)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--os-text-3)', fontSize: 12 }}>
                        {new Date(r.createdAt).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--os-text-1)' }}>{typeMap[r.changeType] ?? r.changeType}</td>
                      <td className="px-3 py-2 text-right font-medium" style={{ color: qty > 0 ? 'var(--os-success)' : 'var(--os-danger)' }}>
                        {qty > 0 ? `+${qty.toLocaleString()}` : qty.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--os-text-3)' }}>{Math.round(Number(r.qtyBefore)).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--os-text-2)' }}>{Math.round(Number(r.qtyAfter)).toLocaleString()}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--os-text-3)', fontSize: 12 }}>{r.refType ?? "-"}{r.refId ? ` #${r.refId}` : ""}</td>
                      <td className="px-3 py-2 max-w-[160px] truncate" style={{ color: 'var(--os-text-3)', fontSize: 12 }}>{r.note ?? "-"}</td>
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

      {/* 刪除確認 Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>刪除庫存品項</DialogTitle></DialogHeader>
          <p style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
            確定刪除「{deleteTarget?.productName}」？此操作會寫入稽核記錄，無法復原。
          </p>
          <Label>刪除原因（必填）</Label>
          <Textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="請說明刪除原因" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button
              variant="destructive"
              disabled={!deleteReason.trim() || deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id, reason: deleteReason })}
            >
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

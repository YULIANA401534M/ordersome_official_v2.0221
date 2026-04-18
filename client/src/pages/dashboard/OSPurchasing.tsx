import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp,
  ShoppingCart, Send, CheckCircle, XCircle, Trash2, Upload, Pencil
} from "lucide-react";
import * as XLSX from "xlsx";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "待處理", color: "#9ca3af", bg: "#f3f4f6" },
  sent:      { label: "已傳送", color: "#0369a1", bg: "#eff6ff" },
  confirmed: { label: "已確認", color: "#b45309", bg: "#fef3c7" },
  received:  { label: "已到貨", color: "#15803d", bg: "#f0fdf4" },
  cancelled: { label: "已取消", color: "#dc2626", bg: "#fef2f2" },
};

const STATUS_FLOW: Record<string, { status: string; label: string; color: string }> = {
  pending:   { status: "sent",      label: "標記傳送",   color: "#0369a1" },
  sent:      { status: "confirmed", label: "確認收單",   color: "#b45309" },
  confirmed: { status: "received",  label: "確認到貨",   color: "#15803d" },
};

interface NewItem {
  supplierName: string;
  storeName: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  temperature: "常溫" | "冷藏" | "冷凍";
}

const emptyItem = (): NewItem => ({
  supplierName: "", storeName: "", productName: "",
  unit: "箱", quantity: 1, unitPrice: 0, temperature: "常溫",
});

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

export default function OSPurchasing() {
  const { user } = useAuth();
  const canEdit = user?.role === "super_admin" || user?.role === "manager";
  const isSuperAdmin = user?.role === "super_admin";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filterStatus, setFilterStatus] = useState("");

  // 新篩選器
  const [filterStartDate, setFilterStartDate] = useState(getMonday(now));
  const [filterEndDate, setFilterEndDate] = useState(now.toISOString().slice(0, 10));
  const [filterStore, setFilterStore] = useState("all");
  const [filterSupplierSel, setFilterSupplierSel] = useState("all");

  // 月份計算（給 startDate/endDate 月份切換模式）
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = (() => {
    const last = new Date(year, month, 0);
    return `${year}-${String(month).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
  })();

  // 以日期範圍篩選器的值為主（月份切換只影響 KPI 計算和顯示，list 以 dateRange 為主）
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 批量刪除
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);

  // 建立叫貨單 dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newDate, setNewDate] = useState(now.toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState("");
  const [newItems, setNewItems] = useState<NewItem[]>([emptyItem()]);

  // 手動匯入 dialog
  const [showImport, setShowImport] = useState(false);
  const [importDate, setImportDate] = useState(now.toISOString().slice(0, 10));
  const [importOrderNo, setImportOrderNo] = useState("");
  const [importItems, setImportItems] = useState<NewItem[]>([emptyItem()]);

  // 廠商 LINE dialog
  const [showLineDialog, setShowLineDialog] = useState(false);
  const [lineOrderId, setLineOrderId] = useState<number | null>(null);
  const [lineOrderDate, setLineOrderDate] = useState("");

  // 廠商 LINE 設定 dialog
  const [showLineConfig, setShowLineConfig] = useState(false);
  const [lineConfigName, setLineConfigName] = useState("");
  const [lineConfigGroupId, setLineConfigGroupId] = useState("");

  // 刪除確認 dialog（僅 super_admin）
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // 批量刪除 reason
  const [batchDeleteReason, setBatchDeleteReason] = useState("");

  // 作廢 dialog（manager + super_admin）
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // 備註 dialog
  const [noteTargetId, setNoteTargetId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  // 品項編輯 dialog
  const [editItemTarget, setEditItemTarget] = useState<any | null>(null);
  const [editItemField, setEditItemField] = useState({ productName: "", quantity: 1, unit: "", temperature: "常溫" });

  // 新增品項 dialog
  const [addItemOrderId, setAddItemOrderId] = useState<number | null>(null);
  const [addItemField, setAddItemField] = useState({ productName: "", quantity: 1, unit: "箱", temperature: "常溫" as "常溫"|"冷藏"|"冷凍" });

  // 主列表查詢使用 filterStartDate/filterEndDate + 狀態/店別/廠商
  const { data: orders = [], refetch } = trpc.procurement.list.useQuery({
    startDate: filterStartDate,
    endDate: filterEndDate,
    status: filterStatus || undefined,
    supplierName: filterSupplierSel !== "all" ? filterSupplierSel : undefined,
    storeName: filterStore !== "all" ? filterStore : undefined,
  });

  // KPI 用月份範圍
  const { data: monthOrders = [] } = trpc.procurement.list.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const { data: detail, refetch: refetchDetail } = trpc.procurement.getDetail.useQuery(
    { orderId: expandedId! }, { enabled: expandedId !== null }
  );

  const { data: supplierGroups = [] } = trpc.procurement.groupBySupplier.useQuery(
    { orderId: lineOrderId! }, { enabled: lineOrderId !== null }
  );

  const { data: supplierLines = [], refetch: refetchLines } = trpc.procurement.supplierLineList.useQuery();
  const { data: suppliers = [] } = trpc.procurement.getSuppliers.useQuery();

  // 篩選器用下拉資料
  const { data: storeNames = [] } = trpc.procurement.listStoreNames.useQuery({
    startDate: monthStart, endDate: monthEnd,
  });
  const { data: supplierNames = [] } = trpc.procurement.listSupplierNames.useQuery();

  const createMutation = trpc.procurement.create.useMutation({
    onSuccess: () => {
      toast.success("叫貨單已建立");
      setShowCreate(false);
      setNewItems([emptyItem()]);
      setNewNote("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.procurement.updateStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const pushToLine = trpc.procurement.pushToLine.useMutation({
    onSuccess: (data) => {
      const ok = data.results.filter(r => r.success).length;
      const fail = data.results.filter(r => !r.success).length;
      toast.success(`LINE 推播完成：${ok} 家成功${fail > 0 ? `、${fail} 家失敗` : ""}`);
      setShowLineDialog(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const importMutation = trpc.procurement.importFromDamai.useMutation({
    onSuccess: (data) => {
      if ('message' in data && data.message) {
        toast.info(data.message as string);
      } else {
        toast.success(`手動補單成功，共 ${(data as any).itemCount} 項`);
      }
      setShowImport(false);
      setImportItems([emptyItem()]);
      setImportOrderNo("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const lineUpsert = trpc.procurement.supplierLineUpsert.useMutation({
    onSuccess: () => { toast.success("廠商 LINE 已更新"); refetchLines(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteOrder = trpc.procurement.deleteOrder.useMutation({
    onSuccess: () => {
      toast.success("叫貨單已刪除");
      setDeleteTargetId(null);
      setDeleteReason("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelOrder = trpc.procurement.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("叫貨單已作廢");
      setCancelTargetId(null);
      setCancelReason("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const batchDelete = trpc.procurement.batchDeleteOrders.useMutation({
    onSuccess: () => {
      toast.success(`已刪除 ${selectedIds.size} 張叫貨單`);
      setSelectedIds(new Set());
      setShowBatchDelete(false);
      setBatchDeleteReason("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateNote = trpc.procurement.updateNote.useMutation({
    onSuccess: () => {
      toast.success("備註已儲存");
      setNoteTargetId(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateItem = trpc.procurement.updateItem.useMutation({
    onSuccess: () => {
      toast.success("品項已更新");
      setEditItemTarget(null);
      refetchDetail();
    },
    onError: (e) => toast.error(e.message),
  });

  const addItem = trpc.procurement.addItem.useMutation({
    onSuccess: () => {
      toast.success("品項已新增");
      setAddItemOrderId(null);
      setAddItemField({ productName: "", quantity: 1, unit: "箱", temperature: "常溫" });
      refetchDetail();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // KPI 用月份資料
  const kpi = useMemo(() => {
    const list = monthOrders as any[];
    return {
      total: list.length,
      pending: list.filter(o => o.status === "pending").length,
      sent: list.filter(o => o.status === "sent").length,
      received: list.filter(o => o.status === "received").length,
    };
  }, [monthOrders]);

  function handleAddItem() {
    setNewItems(items => [...items, emptyItem()]);
  }
  function handleRemoveItem(idx: number) {
    setNewItems(items => items.filter((_, i) => i !== idx));
  }
  function handleItemChange(idx: number, field: keyof NewItem, value: any) {
    setNewItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function genImportOrderNo() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `MAN-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Date.now().toString().slice(-3)}`;
  }

  function handleImport() {
    if (!importOrderNo) { toast.error("請輸入單號"); return; }
    if (importItems.some(it => !it.supplierName || !it.productName)) {
      toast.error("廠商名稱和品項名稱為必填");
      return;
    }
    importMutation.mutate({
      secret: "ordersome-sync-2026",
      orderNo: importOrderNo,
      orderDate: importDate,
      items: importItems.map(it => ({
        supplierName: it.supplierName,
        storeName: it.storeName,
        productName: it.productName,
        unit: it.unit || undefined,
        quantity: Number(it.quantity),
        temperature: it.temperature,
      })),
    });
  }

  function handleCreate() {
    if (newItems.some(it => !it.supplierName || !it.productName)) {
      toast.error("廠商名稱和品項名稱為必填");
      return;
    }
    createMutation.mutate({
      orderDate: newDate,
      note: newNote || undefined,
      items: newItems.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    });
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exportExcel() {
    const rows = (orders as any[]).map((o: any) => ({
      "叫貨單號": o.orderNo,
      "日期": o.orderDate,
      "狀態": STATUS_CONFIG[o.status]?.label ?? o.status,
      "來源": o.sourceType === "damai_import" ? "大麥匯入" : "手動建立",
      "廠商": o.suppliers,
      "門市": o.stores,
      "品項數": o.itemCount,
      "合計金額": o.totalAmt,
      "建立人": o.createdBy,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "叫貨管理");
    XLSX.writeFile(wb, `叫貨管理_${year}${String(month).padStart(2, "0")}.xlsx`);
  }

  return (
    <AdminDashboardLayout>
      <div className="p-4 space-y-4" style={{ background: "#f7f6f3", minHeight: "100vh" }}>

        {/* 頂部月份切換 + 篩選列 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 月份切換 */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-base font-semibold w-20 text-center">{year}/{String(month).padStart(2, "0")}</span>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          {/* 狀態篩選 */}
          <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue placeholder="全部狀態" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 日期範圍 */}
          <Input
            type="date"
            value={filterStartDate}
            onChange={e => setFilterStartDate(e.target.value)}
            className="h-8 text-sm w-36"
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="date"
            value={filterEndDate}
            onChange={e => setFilterEndDate(e.target.value)}
            className="h-8 text-sm w-36"
          />

          {/* 店別篩選 */}
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="全部門市" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              {(storeNames as string[]).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 廠商篩選 */}
          <Select value={filterSupplierSel} onValueChange={setFilterSupplierSel}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="全部廠商" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部廠商</SelectItem>
              {(supplierNames as string[]).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 右側按鈕 */}
          <div className="ml-auto flex gap-2">
            {isSuperAdmin && selectedIds.size > 0 && (
              <Button
                size="sm" variant="outline"
                className="h-8 text-xs text-red-600 border-red-400 hover:bg-red-50"
                onClick={() => { setBatchDeleteReason(""); setShowBatchDelete(true); }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> 批量刪除 ({selectedIds.size}張)
              </Button>
            )}
            {isSuperAdmin && selectedIds.size === 0 && (
              <Button size="sm" variant="outline" disabled className="h-8 text-xs opacity-40">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> 批量刪除
              </Button>
            )}
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setShowLineConfig(true)} className="h-8 text-xs">
                廠商 LINE 設定
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={exportExcel} className="h-8 text-xs">
              匯出 Excel
            </Button>
            {canEdit && (
              <Button
                size="sm" variant="outline"
                onClick={() => {
                  setImportOrderNo(genImportOrderNo());
                  setImportDate(new Date().toISOString().slice(0, 10));
                  setImportItems([emptyItem()]);
                  setShowImport(true);
                }}
                className="h-8 text-xs gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> 手動補單
              </Button>
            )}
            {canEdit && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1" style={{ background: "#b45309" }}>
                <Plus className="w-4 h-4" /> 新增叫貨單
              </Button>
            )}
          </div>
        </div>

        {/* KPI 卡片（月份範圍） */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "本月叫貨", value: kpi.total, icon: ShoppingCart, color: "#b45309" },
            { label: "待處理", value: kpi.pending, icon: ShoppingCart, color: "#9ca3af" },
            { label: "已傳送", value: kpi.sent, icon: Send, color: "#0369a1" },
            { label: "已到貨", value: kpi.received, icon: CheckCircle, color: "#15803d" },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="font-kamabit text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* 叫貨單列表 */}
        <div className="space-y-3">
          {(orders as any[]).length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">無符合條件的叫貨紀錄</div>
          ) : (
            (orders as any[]).map((order: any) => {
              const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const next = STATUS_FLOW[order.status];
              const isExpanded = expandedId === order.id;
              const isPending = order.status === "pending";
              const totalAmt = Number(order.totalAmt ?? 0);
              const amtDisplay = totalAmt > 0
                ? `$${totalAmt.toLocaleString()}`
                : "金額待填";

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    {/* Checkbox for pending orders — 僅 super_admin 可批量刪除 */}
                    {isSuperAdmin && isPending && (
                      <div
                        onClick={e => { e.stopPropagation(); toggleSelect(order.id); }}
                        className="flex-shrink-0"
                      >
                        <Checkbox
                          checked={selectedIds.has(order.id)}
                          onCheckedChange={() => toggleSelect(order.id)}
                        />
                      </div>
                    )}
                    {isSuperAdmin && !isPending && <div className="w-4 flex-shrink-0" />}
                    {!isSuperAdmin && canEdit && <div className="w-4 flex-shrink-0" />}

                    <span className="text-sm font-mono text-gray-500 w-36 truncate">{order.orderNo}</span>
                    <span className="text-sm text-gray-700 w-24">{order.orderDate?.slice(0, 10)}</span>
                    <Badge style={{ color: sc.color, background: sc.bg, border: "none" }} className="text-xs">{sc.label}</Badge>
                    <span className="text-xs text-gray-400 flex-1 truncate">
                      {order.suppliers?.split(",").slice(0, 3).join("、")}
                      {order.stores && <span className="ml-2 text-gray-300">｜{order.stores?.split(",").slice(0, 2).join("、")}</span>}
                    </span>
                    <span className="text-xs text-gray-400">{order.itemCount} 項</span>
                    <span className={`text-xs ${totalAmt > 0 ? "text-amber-700 font-medium" : "text-gray-300"}`}>
                      {amtDisplay}
                    </span>
                    <span className="text-xs text-gray-300">{order.sourceType === "damai_import" ? "大麥" : "手動"}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-3">
                      {/* 品項明細 */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 border-b">
                              <th className="text-left py-1 pr-3">廠商</th>
                              <th className="text-left py-1 pr-3">門市</th>
                              <th className="text-left py-1 pr-3">品項</th>
                              <th className="text-right py-1 pr-3">數量</th>
                              <th className="text-left py-1 pr-3">單位</th>
                              <th className="text-left py-1 pr-3">溫層</th>
                              <th className="text-right py-1 pr-3">單價</th>
                              <th className="text-right py-1 pr-3">金額</th>
                              {canEdit && <th className="py-1 w-8"></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {(detail?.items ?? []).map((item: any, i: number) => (
                              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-1 pr-3 text-gray-600">{item.supplierName}</td>
                                <td className="py-1 pr-3 text-gray-600">{item.storeName}</td>
                                <td className="py-1 pr-3 font-medium">{item.productName}</td>
                                <td className="py-1 pr-3 text-right">{item.quantity}</td>
                                <td className="py-1 pr-3 text-gray-400">{item.unit}</td>
                                <td className="py-1 pr-3 text-gray-400">{item.temperature}</td>
                                <td className="py-1 pr-3 text-right text-gray-400">
                                  {Number(item.unitPrice) > 0 ? `$${Number(item.unitPrice).toLocaleString()}` : "—"}
                                </td>
                                <td className="py-1 pr-3 text-right text-gray-400">
                                  {Number(item.amount) > 0 ? `$${Number(item.amount).toLocaleString()}` : "—"}
                                </td>
                                {canEdit && (
                                  <td className="py-1">
                                    <Button
                                      size="sm" variant="ghost"
                                      className="h-6 w-6 p-0 text-gray-400 hover:text-amber-700"
                                      onClick={() => {
                                        setEditItemTarget(item);
                                        setEditItemField({
                                          productName: item.productName,
                                          quantity: Number(item.quantity),
                                          unit: item.unit,
                                          temperature: item.temperature || "常溫",
                                        });
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                            {(!detail?.items || detail.items.length === 0) && detail !== undefined && (
                              <tr><td colSpan={canEdit ? 9 : 8}>
                                <div className="text-sm text-muted-foreground py-4 text-center">尚無品項記錄</div>
                              </td></tr>
                            )}
                            {detail === undefined && (
                              <tr><td colSpan={canEdit ? 9 : 8} className="py-3 text-center text-gray-300">載入中…</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* 新增品項按鈕 */}
                      {canEdit && (
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setAddItemOrderId(order.id);
                            setAddItemField({ productName: "", quantity: 1, unit: "箱", temperature: "常溫" });
                          }}
                        >
                          <Plus className="w-3 h-3" /> 新增品項
                        </Button>
                      )}

                      {order.note && (
                        <p className="text-xs text-gray-400">備註：{order.note}</p>
                      )}

                      {/* 操作按鈕 */}
                      {canEdit && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {next && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              style={{ background: next.color, color: "#fff" }}
                              onClick={() => updateStatus.mutate({ orderId: order.id, status: next.status as any })}
                              disabled={updateStatus.isPending}
                            >
                              {next.label}
                            </Button>
                          )}
                          {order.status === "sent" && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setLineOrderId(order.id);
                                setLineOrderDate(order.orderDate);
                                setShowLineDialog(true);
                              }}
                            >
                              <Send className="w-3 h-3 mr-1" /> LINE 推播
                            </Button>
                          )}
                          {isPending && canEdit && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => { setCancelReason(""); setCancelTargetId(order.id); }}
                              disabled={cancelOrder.isPending}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> 作廢
                            </Button>
                          )}
                          {isPending && isSuperAdmin && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs text-red-600 border-red-400 hover:bg-red-50"
                              onClick={() => { setDeleteReason(""); setDeleteTargetId(order.id); }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> 刪除
                            </Button>
                          )}
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setNoteTargetId(order.id);
                              setNoteText(order.note || "");
                            }}
                          >
                            備註
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 批量刪除確認 Dialog（僅 super_admin） */}
      <Dialog open={showBatchDelete} onOpenChange={setShowBatchDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>批量刪除確認</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            確定要刪除選取的 {selectedIds.size} 張叫貨單（僅限待處理）？此操作無法復原。
          </p>
          <div>
            <Label className="text-sm">刪除原因（必填，永久保存）</Label>
            <textarea
              className="w-full border rounded-md p-2 text-sm mt-1 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
              value={batchDeleteReason}
              onChange={e => setBatchDeleteReason(e.target.value)}
              placeholder="請說明刪除原因，此記錄將永久保存"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDelete(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => batchDelete.mutate({ ids: Array.from(selectedIds), reason: batchDeleteReason })}
              disabled={batchDelete.isPending || !batchDeleteReason.trim()}
            >
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 Dialog（僅 super_admin） */}
      <Dialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) { setDeleteTargetId(null); setDeleteReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">確定要永久刪除此叫貨單？此操作無法復原。</p>
          <div>
            <Label className="text-sm">刪除原因（必填，永久保存）</Label>
            <textarea
              className="w-full border rounded-md p-2 text-sm mt-1 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="請說明刪除原因，此記錄將永久保存"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTargetId(null); setDeleteReason(""); }}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTargetId !== null && deleteOrder.mutate({ orderId: deleteTargetId, reason: deleteReason })}
              disabled={deleteOrder.isPending || !deleteReason.trim()}
            >
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 作廢 Dialog（manager + super_admin） */}
      <Dialog open={cancelTargetId !== null} onOpenChange={(open) => { if (!open) { setCancelTargetId(null); setCancelReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>作廢叫貨單</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">作廢後狀態改為「已取消」，記錄保留不刪除。</p>
          <div>
            <Label className="text-sm">作廢原因（必填，永久保存）</Label>
            <textarea
              className="w-full border rounded-md p-2 text-sm mt-1 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="請說明作廢原因，此記錄將永久保存"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelTargetId(null); setCancelReason(""); }}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => cancelTargetId !== null && cancelOrder.mutate({ orderId: cancelTargetId, status: "cancelled", reason: cancelReason })}
              disabled={cancelOrder.isPending || !cancelReason.trim()}
            >
              確認作廢
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 備註 Dialog */}
      <Dialog open={noteTargetId !== null} onOpenChange={(open) => { if (!open) setNoteTargetId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>編輯備註</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded-md p-2 text-sm mt-2 min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="輸入備註..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTargetId(null)}>取消</Button>
            <Button
              onClick={() => noteTargetId !== null && updateNote.mutate({ orderId: noteTargetId, note: noteText })}
              disabled={updateNote.isPending}
              style={{ background: "#b45309" }}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 品項編輯 Dialog */}
      <Dialog open={editItemTarget !== null} onOpenChange={(open) => { if (!open) setEditItemTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>編輯品項</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">商品名稱</Label>
              <Input
                value={editItemField.productName}
                onChange={e => setEditItemField(f => ({ ...f, productName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">數量</Label>
                <Input
                  type="number"
                  value={editItemField.quantity}
                  onChange={e => setEditItemField(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">單位</Label>
                <Input
                  value={editItemField.unit}
                  onChange={e => setEditItemField(f => ({ ...f, unit: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">溫層</Label>
              <Select value={editItemField.temperature} onValueChange={v => setEditItemField(f => ({ ...f, temperature: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="常溫">常溫</SelectItem>
                  <SelectItem value="冷藏">冷藏</SelectItem>
                  <SelectItem value="冷凍">冷凍</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemTarget(null)}>取消</Button>
            <Button
              onClick={() => editItemTarget && updateItem.mutate({
                itemId: editItemTarget.id,
                productName: editItemField.productName,
                quantity: editItemField.quantity,
                unit: editItemField.unit,
                temperature: editItemField.temperature,
              })}
              disabled={updateItem.isPending}
              style={{ background: "#b45309" }}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增品項 Dialog */}
      <Dialog open={addItemOrderId !== null} onOpenChange={(open) => { if (!open) setAddItemOrderId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新增品項</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">商品名稱 *</Label>
              <Input
                value={addItemField.productName}
                onChange={e => setAddItemField(f => ({ ...f, productName: e.target.value }))}
                className="mt-1"
                placeholder="品項名稱"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">數量 *</Label>
                <Input
                  type="number"
                  value={addItemField.quantity}
                  onChange={e => setAddItemField(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">單位 *</Label>
                <Input
                  value={addItemField.unit}
                  onChange={e => setAddItemField(f => ({ ...f, unit: e.target.value }))}
                  className="mt-1"
                  placeholder="箱"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">溫層</Label>
              <Select value={addItemField.temperature} onValueChange={v => setAddItemField(f => ({ ...f, temperature: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="常溫">常溫</SelectItem>
                  <SelectItem value="冷藏">冷藏</SelectItem>
                  <SelectItem value="冷凍">冷凍</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOrderId(null)}>取消</Button>
            <Button
              onClick={() => {
                if (!addItemField.productName) { toast.error("商品名稱必填"); return; }
                if (!addItemField.unit) { toast.error("單位必填"); return; }
                addItem.mutate({
                  orderId: addItemOrderId!,
                  productName: addItemField.productName,
                  unit: addItemField.unit,
                  quantity: addItemField.quantity,
                  temperature: addItemField.temperature,
                });
              }}
              disabled={addItem.isPending}
              style={{ background: "#b45309" }}
            >
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增叫貨單 Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增叫貨單</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-xs">叫貨日期</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-1" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">備註</Label>
                <Input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="選填" className="mt-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">品項明細</Label>
                <Button size="sm" variant="outline" onClick={handleAddItem} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> 新增一列
                </Button>
              </div>
              <div className="space-y-2">
                {newItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-1 items-end bg-gray-50 p-2 rounded-lg">
                    <div className="col-span-2">
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">廠商 *</p>}
                      <Input value={item.supplierName} onChange={e => handleItemChange(idx, "supplierName", e.target.value)} placeholder="廠商名稱" className="h-8 text-xs" />
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">門市</p>}
                      <Input value={item.storeName} onChange={e => handleItemChange(idx, "storeName", e.target.value)} placeholder="門市" className="h-8 text-xs" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">品項 *</p>}
                      <Input value={item.productName} onChange={e => handleItemChange(idx, "productName", e.target.value)} placeholder="品項名稱" className="h-8 text-xs" />
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">數量</p>}
                      <Input type="number" value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="flex-1">
                        {idx === 0 && <p className="text-xs text-gray-400 mb-1">單位</p>}
                        <Input value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} placeholder="箱" className="h-8 text-xs" />
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={newItems.length === 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} style={{ background: "#b45309" }}>
              {createMutation.isPending ? "建立中…" : "建立叫貨單"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINE 推播 Dialog */}
      <Dialog open={showLineDialog} onOpenChange={setShowLineDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>LINE 推播給廠商</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500">以下廠商將收到此叫貨單的 LINE 推播：</p>
            {(supplierGroups as any[]).map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">{g.supplierName}</p>
                  <p className="text-xs text-gray-400">{g.itemCount} 項品項</p>
                </div>
                {g.lineGroupId ? (
                  <Badge style={{ color: "#15803d", background: "#f0fdf4", border: "none" }} className="text-xs">
                    LINE 已設定
                  </Badge>
                ) : (
                  <Badge style={{ color: "#dc2626", background: "#fef2f2", border: "none" }} className="text-xs">
                    未設定 LINE
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineDialog(false)}>取消</Button>
            <Button
              onClick={() => {
                const groups = (supplierGroups as any[])
                  .filter((g: any) => g.lineGroupId)
                  .map((g: any) => ({
                    supplierName: g.supplierName,
                    lineGroupId: g.lineGroupId,
                    itemList: g.itemList,
                  }));
                if (groups.length === 0) { toast.error("沒有已設定 LINE 的廠商"); return; }
                pushToLine.mutate({ orderId: lineOrderId!, orderDate: lineOrderDate, supplierGroups: groups });
              }}
              disabled={pushToLine.isPending}
              style={{ background: "#06c755", color: "#fff" }}
            >
              {pushToLine.isPending ? "傳送中…" : "確認推播"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手動補單 Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>手動補單</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-400">用於補登大麥系統遺漏的叫貨紀錄，單號不可與現有訂單重複。</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-xs">叫貨日期</Label>
                <Input type="date" value={importDate} onChange={e => setImportDate(e.target.value)} className="mt-1" />
              </div>
              <div className="flex-1">
                <Label className="text-xs">單號（自動產生可修改）</Label>
                <Input value={importOrderNo} onChange={e => setImportOrderNo(e.target.value)} placeholder="MAN-YYYYMMDD-001" className="mt-1 font-mono text-sm" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">品項明細</Label>
                <Button size="sm" variant="outline" onClick={() => setImportItems(items => [...items, emptyItem()])} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> 新增一列
                </Button>
              </div>
              <div className="space-y-2">
                {importItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-8 gap-1 items-end bg-gray-50 p-2 rounded-lg">
                    <div className="col-span-2">
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">廠商 *</p>}
                      <Select value={item.supplierName} onValueChange={v => setImportItems(items => items.map((it, i) => i === idx ? { ...it, supplierName: v } : it))}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="選廠商" />
                        </SelectTrigger>
                        <SelectContent>
                          {(suppliers as any[]).map((s: any) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">門市</p>}
                      <Input value={item.storeName} onChange={e => setImportItems(items => items.map((it, i) => i === idx ? { ...it, storeName: e.target.value } : it))} placeholder="門市" className="h-8 text-xs" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">品項 *</p>}
                      <Input value={item.productName} onChange={e => setImportItems(items => items.map((it, i) => i === idx ? { ...it, productName: e.target.value } : it))} placeholder="品項名稱" className="h-8 text-xs" />
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">數量</p>}
                      <Input type="number" value={item.quantity} onChange={e => setImportItems(items => items.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it))} className="h-8 text-xs" />
                    </div>
                    <div>
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1">溫層</p>}
                      <Select value={item.temperature} onValueChange={v => setImportItems(items => items.map((it, i) => i === idx ? { ...it, temperature: v as any } : it))}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="常溫">常溫</SelectItem>
                          <SelectItem value="冷藏">冷藏</SelectItem>
                          <SelectItem value="冷凍">冷凍</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      {idx === 0 && <p className="text-xs text-gray-400 mb-1 invisible">刪</p>}
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setImportItems(items => items.filter((_, i) => i !== idx))}
                        disabled={importItems.length === 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>取消</Button>
            <Button onClick={handleImport} disabled={importMutation.isPending} style={{ background: "#b45309" }}>
              {importMutation.isPending ? "匯入中…" : "確認補單"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 廠商 LINE 設定 Dialog */}
      <Dialog open={showLineConfig} onOpenChange={setShowLineConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>廠商 LINE 設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(supplierLines as any[]).map((sl: any) => (
                <div key={sl.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                  <div>
                    <p className="font-medium">{sl.supplierName}</p>
                    <p className="text-xs text-gray-400 font-mono truncate w-40">{sl.lineGroupId || "—"}</p>
                  </div>
                  <Badge style={{ color: sl.isActive ? "#15803d" : "#9ca3af", background: sl.isActive ? "#f0fdf4" : "#f3f4f6", border: "none" }} className="text-xs">
                    {sl.isActive ? "啟用" : "停用"}
                  </Badge>
                </div>
              ))}
              {(supplierLines as any[]).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-3">尚無廠商 LINE 設定</p>
              )}
            </div>
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs text-gray-500 font-medium">新增 / 更新廠商</p>
              <Input value={lineConfigName} onChange={e => setLineConfigName(e.target.value)} placeholder="廠商名稱" className="h-8 text-sm" />
              <Input value={lineConfigGroupId} onChange={e => setLineConfigGroupId(e.target.value)} placeholder="LINE Group ID" className="h-8 text-sm font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineConfig(false)}>關閉</Button>
            <Button
              onClick={() => {
                if (!lineConfigName) { toast.error("廠商名稱必填"); return; }
                lineUpsert.mutate({ supplierName: lineConfigName, lineGroupId: lineConfigGroupId || undefined, isActive: true });
                setLineConfigName(""); setLineConfigGroupId("");
              }}
              disabled={lineUpsert.isPending}
              style={{ background: "#b45309" }}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

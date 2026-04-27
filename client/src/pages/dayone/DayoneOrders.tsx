import React, { useState } from "react";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, CalendarDays, Calendar, ChevronDown, ChevronUp, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" });
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待處理", color: "bg-gray-100 text-gray-700" },
  assigned: { label: "已指派", color: "bg-blue-100 text-blue-700" },
  picked: { label: "已揀貨", color: "bg-purple-100 text-purple-700" },
  delivering: { label: "配送中", color: "bg-amber-100 text-amber-700" },
  delivered: { label: "已送達", color: "bg-green-100 text-green-700" },
  returned: { label: "已退回", color: "bg-red-100 text-red-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type DateMode = "single" | "range";

export default function DayoneOrders() {
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [date, setDate] = useState(todayStr);
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { user } = useAuth();
  const canDelete = user?.role === "manager" || user?.role === "super_admin";

  const [newOrder, setNewOrder] = useState({ customerId: "", driverId: "", deliveryDate: todayStr(), note: "" });
  const [orderItems, setOrderItems] = useState([{ productId: "", qty: 1, unitPrice: 0 }]);

  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.dayone.orders.list.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: dateMode === "single" ? (date || undefined) : undefined,
    dateFrom: dateMode === "range" ? (dateFrom || undefined) : undefined,
    dateTo: dateMode === "range" ? (dateTo || undefined) : undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: customers } = trpc.dayone.customers.list.useQuery({ tenantId: TENANT_ID });
  const { data: drivers } = trpc.dayone.drivers.list.useQuery({ tenantId: TENANT_ID });
  const { data: products } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const createOrder = trpc.dayone.orders.create.useMutation({
    onSuccess: (data) => {
      if (data.overCredit) {
        toast.warning(
          `訂單已建立，但此客戶信用額度不足！信用額度 NT$ ${data.creditLimit.toLocaleString()}，建單後未結金額已達 NT$ ${data.unpaidTotal.toLocaleString()}`,
          { duration: 8000 }
        );
      } else {
        toast.success("訂單建立成功");
      }
      if (data.lowStockWarnings && data.lowStockWarnings.length > 0) {
        for (const w of data.lowStockWarnings) {
          toast.warning(
            `⚠️ 庫存不足：${w.productName} 下單 ${w.ordered} 箱，目前庫存僅 ${w.currentQty} 箱，請儘速補貨`,
            { duration: 10000 }
          );
        }
      }
      setCreateOpen(false);
      utils.dayone.orders.list.invalidate();
    },
    onError: () => toast.error("建立訂單失敗，請確認填寫資料後再試"),
  });

  const updateStatus = trpc.dayone.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("訂單狀態已更新");
      utils.dayone.orders.list.invalidate();
    },
    onError: () => toast.error("狀態更新失敗，請重試"),
  });

  const deleteOrder = trpc.dayone.orders.deleteOrder.useMutation({
    onSuccess: () => {
      toast.success("訂單已刪除");
      setDeleteTarget(null);
      utils.dayone.orders.list.invalidate();
    },
    onError: () => toast.error("刪除失敗，請重試"),
  });

  const reassignDriver = trpc.dayone.orders.reassignDriver.useMutation({
    onSuccess: () => {
      toast.success("司機已更新");
      utils.dayone.orders.list.invalidate();
    },
    onError: () => toast.error("換司機失敗，請重試"),
  });

  const filtered = (orders as any[] ?? []).filter((o: any) => !search || o.customerName?.includes(search) || o.orderNo?.includes(search));

  function EditableOrderItems({ orderId, colSpan = 7, mobile = false }: { orderId: number; colSpan?: number; mobile?: boolean }) {
    const utils = trpc.useUtils();
    const { data, isLoading } = trpc.dayone.orders.getWithItems.useQuery({ id: orderId, tenantId: TENANT_ID });
    const [editing, setEditing] = useState(false);
    const [editValues, setEditValues] = useState<Record<number, { qty: number; unitPrice: number }>>({});

    const updateItems = trpc.dayone.orders.updateItems.useMutation({
      onSuccess: (result) => {
        toast.success(`品項已更新，訂單金額 NT$ ${result.totalAmount.toLocaleString("zh-TW")}`);
        setEditing(false);
        utils.dayone.orders.getWithItems.invalidate({ id: orderId, tenantId: TENANT_ID });
        utils.dayone.orders.list.invalidate();
      },
      onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
      const inner = <div className="py-2 text-xs text-stone-400">載入中...</div>;
      return mobile ? inner : <tr><td colSpan={colSpan} className="px-8 py-2">{inner}</td></tr>;
    }

    const items: any[] = data?.items ?? [];

    function startEdit() {
      const map: Record<number, { qty: number; unitPrice: number }> = {};
      for (const item of items) {
        map[item.id] = { qty: Number(item.qty), unitPrice: Number(item.unitPrice) };
      }
      setEditValues(map);
      setEditing(true);
    }

    function saveEdit() {
      updateItems.mutate({
        id: orderId,
        tenantId: TENANT_ID,
        items: Object.entries(editValues).map(([id, v]) => ({
          id: Number(id),
          qty: v.qty,
          unitPrice: v.unitPrice,
        })),
      });
    }

    const inner = (
      <div className={mobile ? "mt-2 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2" : ""}>
        {!mobile && (
          <div className="grid grid-cols-[1fr_64px_80px_80px] gap-x-3 mb-1.5">
            {["商品名稱", "數量", "單價", "小計"].map((h) => (
              <span key={h} className="text-[11px] font-medium text-stone-400">{h}</span>
            ))}
          </div>
        )}
        <div className="space-y-1">
          {items.map((item: any) => {
            const ev = editValues[item.id];
            const displayQty = editing ? ev?.qty : Number(item.qty);
            const displayPrice = editing ? ev?.unitPrice : Number(item.unitPrice);
            const subtotal = displayQty * displayPrice;

            if (mobile) {
              return (
                <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                  <span className="text-stone-700">{item.productName} × {editing
                    ? <input type="number" min={1} className="w-12 rounded border border-amber-300 px-1 text-center text-xs" value={ev?.qty ?? item.qty}
                        onChange={(e) => setEditValues((p) => ({ ...p, [item.id]: { ...p[item.id], qty: Number(e.target.value) || 1 } }))} />
                    : `${item.qty}${item.unit || ""}`}
                  </span>
                  {editing ? (
                    <input type="number" min={0} className="w-20 rounded border border-amber-300 px-1 text-right text-xs"
                      value={ev?.unitPrice ?? item.unitPrice}
                      onChange={(e) => setEditValues((p) => ({ ...p, [item.id]: { ...p[item.id], unitPrice: Number(e.target.value) || 0 } }))} />
                  ) : (
                    <span className={`tabular-nums font-medium ${!Number(item.unitPrice) ? "text-amber-600" : "text-stone-800"}`}>
                      {Number(item.unitPrice) ? `$${Number(item.subtotal).toLocaleString()}` : "待補"}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div key={item.id} className="grid grid-cols-[1fr_64px_80px_80px] gap-x-3 py-1 border-b border-amber-100 last:border-0 items-center">
                <span className="text-xs text-stone-700">{item.productName}</span>
                {editing ? (
                  <input type="number" min={1} className="h-6 w-full rounded border border-amber-300 px-1 text-center text-xs tabular-nums"
                    value={ev?.qty ?? item.qty}
                    onChange={(e) => setEditValues((p) => ({ ...p, [item.id]: { ...p[item.id], qty: Number(e.target.value) || 1 } }))} />
                ) : (
                  <span className="text-xs text-stone-600 tabular-nums">{item.qty} {item.unit || ""}</span>
                )}
                {editing ? (
                  <input type="number" min={0} className="h-6 w-full rounded border border-amber-300 px-1 text-right text-xs tabular-nums"
                    value={ev?.unitPrice ?? item.unitPrice}
                    onChange={(e) => setEditValues((p) => ({ ...p, [item.id]: { ...p[item.id], unitPrice: Number(e.target.value) || 0 } }))} />
                ) : (
                  <span className={`text-xs tabular-nums text-right ${!Number(item.unitPrice) ? "font-semibold text-amber-600" : "text-stone-600"}`}>
                    {Number(item.unitPrice) ? `$${Number(item.unitPrice).toLocaleString()}` : "待補"}
                  </span>
                )}
                <span className={`text-xs font-medium tabular-nums text-right ${editing ? "text-amber-700" : !Number(item.unitPrice) ? "text-amber-600" : "text-stone-800"}`}>
                  {subtotal ? `$${subtotal.toLocaleString()}` : "待補"}
                </span>
              </div>
            );
          })}
        </div>

        {data?.note && <p className={`${mobile ? "pt-1 border-t border-amber-100" : "mt-2"} text-xs text-stone-500`}>備註：{data.note}</p>}

        <div className={`${mobile ? "mt-2" : "mt-3"} flex gap-2`}>
          {editing ? (
            <>
              <Button size="sm" className="h-7 rounded-xl bg-amber-600 text-white hover:bg-amber-700 gap-1 text-xs"
                disabled={updateItems.isPending} onClick={saveEdit}>
                <Check className="h-3 w-3" />
                {updateItems.isPending ? "儲存中..." : "儲存"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 rounded-xl text-xs" onClick={() => setEditing(false)}>
                取消
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-7 rounded-xl gap-1 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={startEdit}>
              <Pencil className="h-3 w-3" />
              補填金額 / 修改數量
            </Button>
          )}
        </div>
      </div>
    );

    if (mobile) return inner;
    return <tr><td colSpan={colSpan} className="bg-amber-50/40 px-8 py-3">{inner}</td></tr>;
  }

  function MobileOrderItems({ orderId }: { orderId: number }) {
    return <EditableOrderItems orderId={orderId} mobile />;
  }

  function OrderItems({ orderId }: { orderId: number }) {
    return <EditableOrderItems orderId={orderId} colSpan={7} />;
  }

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="dayone-page-header">
          <div className="min-w-0">
            <h1 className="dayone-page-title">訂單管理</h1>
            <p className="dayone-page-subtitle">訂單資料保留原邏輯，視覺上改成更清楚的篩選節奏與表格層次，手機版維持卡片閱讀效率。</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4" />
                新增訂單
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>新增訂單</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                <div>
                  <Label>客戶</Label>
                  <Select value={newOrder.customerId} onValueChange={(v) => setNewOrder((p) => ({ ...p, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="選擇客戶" /></SelectTrigger>
                    <SelectContent>
                      {(customers as any[] ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>司機</Label>
                  <Select value={newOrder.driverId} onValueChange={(v) => setNewOrder((p) => ({ ...p, driverId: v }))}>
                    <SelectTrigger><SelectValue placeholder="可先不指定司機" /></SelectTrigger>
                    <SelectContent>
                      {(drivers as any[] ?? []).map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>送貨日期</Label>
                  <Input type="date" value={newOrder.deliveryDate} onChange={(e) => setNewOrder((p) => ({ ...p, deliveryDate: e.target.value }))} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label>商品明細</Label>
                    <span className="text-xs text-stone-400">
                      合計：NT$ {orderItems.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_60px_72px_60px_auto] gap-x-1 mb-1">
                    {["商品", "數量", "單價", "小計", ""].map((h) => (
                      <span key={h} className="text-[11px] text-stone-400 px-1">{h}</span>
                    ))}
                  </div>
                  {orderItems.map((item, idx) => {
                    const subtotal = item.qty * item.unitPrice;
                    return (
                      <div key={idx} className="mt-1 grid grid-cols-[1fr_60px_72px_60px_auto] items-center gap-x-1">
                        <Select
                          value={item.productId}
                          onValueChange={(v) => {
                            const prod = (products as any[] ?? []).find((p: any) => String(p.id) === v);
                            setOrderItems((prev) => prev.map((it, i) => i === idx ? { ...it, productId: v, unitPrice: Number(prod?.defaultPrice ?? 0) } : it));
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="選商品" /></SelectTrigger>
                          <SelectContent>
                            {(products as any[] ?? []).map((p: any) => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="h-8 text-xs text-center"
                          min={1}
                          value={item.qty}
                          onChange={(e) => setOrderItems((prev) => prev.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it))}
                        />
                        <Input
                          type="number"
                          className="h-8 text-xs text-right"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => setOrderItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))}
                        />
                        <span className="text-xs text-stone-600 text-right tabular-nums px-1">
                          {subtotal > 0 ? subtotal.toLocaleString() : "—"}
                        </span>
                        <button
                          type="button"
                          className="text-stone-300 hover:text-red-400 px-1"
                          onClick={() => setOrderItems((prev) => prev.length === 1 ? [{ productId: "", qty: 1, unitPrice: 0 }] : prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setOrderItems((prev) => [...prev, { productId: "", qty: 1, unitPrice: 0 }])}>
                    + 新增一項
                  </Button>
                </div>
                <div>
                  <Label>備註</Label>
                  <Input value={newOrder.note} onChange={(e) => setNewOrder((p) => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => {
                  if (!newOrder.customerId) {
                    toast.error("請先選擇客戶");
                    return;
                  }
                  const validItems = orderItems.filter((i) => i.productId && i.qty > 0 && i.unitPrice > 0);
                  if (!validItems.length) {
                    toast.error("請至少填一筆有效商品");
                    return;
                  }
                  createOrder.mutate({
                    tenantId: TENANT_ID,
                    customerId: Number(newOrder.customerId),
                    driverId: newOrder.driverId ? Number(newOrder.driverId) : undefined,
                    deliveryDate: newOrder.deliveryDate,
                    note: newOrder.note || undefined,
                    items: validItems.map((i) => ({ productId: Number(i.productId), qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
                  });
                }}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "建立中..." : "建立訂單"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="dayone-surface-card rounded-[30px]">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-stone-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setDateMode("single")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${dateMode === "single" ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"}`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  單日
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("range")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${dateMode === "range" ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"}`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  區間
                </button>
              </div>

              {dateMode === "single" ? (
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
              ) : (
                <div className="flex items-center gap-2">
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-38" />
                  <span className="text-xs text-stone-400">至</span>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-38" />
                </div>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input className="pl-9" placeholder="搜尋客戶名稱或訂單編號" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dayone-table-shell">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="dayone-empty-state min-h-[260px]">載入中...</div>
            ) : filtered.length === 0 ? (
              <div className="dayone-empty-state min-h-[260px]">查無符合條件的訂單。</div>
            ) : (
              <>
                <div className="dayone-table-header">
                  <div>
                    <h2 className="dayone-table-title">訂單清單</h2>
                    <p className="dayone-table-note">依日期、狀態與關鍵字快速篩選，桌面維持清楚的管理視圖。</p>
                  </div>
                  <span className="dayone-chip">共 {filtered.length} 筆</span>
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="dayone-table w-full text-sm">
                    <thead>
                      <tr>
                        {["", "訂單編號", "客戶", "司機", "送貨日期", "金額", "狀態", "操作"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o: any) => {
                        const st = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                        const isExpanded = expandedId === o.id;
                        return (
                          <React.Fragment key={o.id}>
                            <tr className={isExpanded ? "bg-amber-50/40" : ""}>
                              <td className="w-8">
                                <button
                                  type="button"
                                  className="flex items-center justify-center text-stone-400 hover:text-amber-600 transition-colors"
                                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                                  title="展開明細"
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </td>
                              <td className="font-mono text-xs">{o.orderNo}</td>
                              <td className="font-medium">{o.customerName}</td>
                              <td>
                                {["pending", "assigned"].includes(o.status) ? (
                                  <Select
                                    value={o.driverId ? String(o.driverId) : "none"}
                                    onValueChange={(v) => {
                                      if (v === "none") return;
                                      reassignDriver.mutate({ id: o.id, tenantId: TENANT_ID, driverId: Number(v) });
                                    }}
                                  >
                                    <SelectTrigger className={`h-7 w-28 text-xs border-dashed ${!o.driverName ? "border-amber-400 text-amber-600" : "border-stone-200 text-stone-600"}`}>
                                      <SelectValue placeholder="⚠ 未指派" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none" disabled>{o.driverName ?? "⚠ 未指派"}</SelectItem>
                                      {(drivers as any[] ?? []).filter((d: any) => d.status === "active").map((d: any) => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-stone-600 text-xs">{o.driverName ?? "-"}</span>
                                )}
                              </td>
                              <td>{fmtDate(o.deliveryDate)}</td>
                              <td className="font-medium">${Number(o.totalAmount).toLocaleString()}</td>
                              <td>
                                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, tenantId: TENANT_ID, status: v as any })}>
                                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => setDeleteTarget(o)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && <OrderItems orderId={o.id} />}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="dayone-mobile-list p-4 md:hidden">
                  {filtered.map((o: any) => {
                    const st = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                    const isExpanded = expandedId === o.id;
                    return (
                      <article key={o.id} className="dayone-mobile-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] text-stone-400">{o.orderNo}</div>
                            <h2 className="mt-1 text-lg font-semibold text-stone-900">{o.customerName}</h2>
                            {["pending", "assigned"].includes(o.status) ? (
                              <Select
                                value={o.driverId ? String(o.driverId) : "none"}
                                onValueChange={(v) => {
                                  if (v === "none") return;
                                  reassignDriver.mutate({ id: o.id, tenantId: TENANT_ID, driverId: Number(v) });
                                }}
                              >
                                <SelectTrigger className={`mt-1 h-7 w-36 text-xs border-dashed ${!o.driverName ? "border-amber-400 text-amber-600" : "border-stone-200 text-stone-500"}`}>
                                  <SelectValue placeholder="⚠ 未指派" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" disabled>{o.driverName ?? "⚠ 未指派"}</SelectItem>
                                  {(drivers as any[] ?? []).filter((d: any) => d.status === "active").map((d: any) => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="mt-1 text-sm text-stone-500">{o.driverName ?? "-"}</p>
                            )}
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-stone-400">送貨日期</div>
                            <div className="font-medium text-stone-800">{fmtDate(o.deliveryDate)}</div>
                          </div>
                          <div>
                            <div className="text-stone-400">訂單金額</div>
                            <div className="font-medium text-stone-800">${Number(o.totalAmount).toLocaleString()}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mt-3 flex w-full items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                        >
                          <span>商品明細</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>

                        {isExpanded && (
                          <MobileOrderItems orderId={o.id} />
                        )}

                        <div className="mt-4 space-y-2">
                          <Label className="text-xs text-stone-500">更新狀態</Label>
                          <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, tenantId: TENANT_ID, status: v as any })}>
                            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_MAP).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {canDelete && (
                          <Button
                            variant="outline"
                            className="mt-4 w-full rounded-2xl text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(o)}
                          >
                            刪除此訂單
                          </Button>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>確認刪除訂單</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            確定要刪除 <strong>#{deleteTarget?.orderNo}</strong>（{deleteTarget?.customerName}）嗎？刪除後無法復原。
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteOrder.isPending}
              onClick={() => deleteOrder.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}
            >
              {deleteOrder.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DayoneLayout>
  );
}

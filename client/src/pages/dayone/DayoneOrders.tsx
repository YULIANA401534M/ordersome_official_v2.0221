import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, CalendarDays, Calendar } from "lucide-react";
import { toast } from "sonner";

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
    onSuccess: () => {
      toast.success("訂單建立成功");
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

  const filtered = (orders as any[] ?? []).filter((o: any) => !search || o.customerName?.includes(search) || o.orderNo?.includes(search));

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
                  <Label>商品明細</Label>
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="mt-1 flex gap-2">
                      <Select
                        value={item.productId}
                        onValueChange={(v) => {
                          const prod = (products as any[] ?? []).find((p: any) => String(p.id) === v);
                          setOrderItems((prev) => prev.map((it, i) => i === idx ? { ...it, productId: v, unitPrice: Number(prod?.defaultPrice ?? 0) } : it));
                        }}
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="商品" /></SelectTrigger>
                        <SelectContent>
                          {(products as any[] ?? []).map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20"
                        placeholder="數量"
                        value={item.qty}
                        onChange={(e) => setOrderItems((prev) => prev.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it))}
                      />
                      <Input
                        type="number"
                        className="w-24"
                        placeholder="單價"
                        value={item.unitPrice}
                        onChange={(e) => setOrderItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setOrderItems((prev) => [...prev, { productId: "", qty: 1, unitPrice: 0 }])}>
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
                        {["訂單編號", "客戶", "司機", "送貨日期", "金額", "狀態", "操作"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((o: any) => {
                        const st = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                        return (
                          <tr key={o.id}>
                            <td className="font-mono text-xs">{o.orderNo}</td>
                            <td className="font-medium">{o.customerName}</td>
                            <td className="text-stone-600">{o.driverName ?? "未指派"}</td>
                            <td>{o.deliveryDate}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="dayone-mobile-list p-4 md:hidden">
                  {filtered.map((o: any) => {
                    const st = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                    return (
                      <article key={o.id} className="dayone-mobile-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] text-stone-400">{o.orderNo}</div>
                            <h2 className="mt-1 text-lg font-semibold text-stone-900">{o.customerName}</h2>
                            <p className="mt-1 text-sm text-stone-500">{o.driverName ?? "未指派司機"}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>{st.label}</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-stone-400">送貨日期</div>
                            <div className="font-medium text-stone-800">{o.deliveryDate}</div>
                          </div>
                          <div>
                            <div className="text-stone-400">訂單金額</div>
                            <div className="font-medium text-stone-800">${Number(o.totalAmount).toLocaleString()}</div>
                          </div>
                        </div>

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

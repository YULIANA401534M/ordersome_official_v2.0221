import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Truck, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  pending:    { label: "待備貨", color: "var(--os-text-3)",    bg: "var(--os-surface-2)" },
  picking:    { label: "撿貨中", color: "var(--os-info)",      bg: "var(--os-info-bg)" },
  dispatched: { label: "已出車", color: "var(--os-amber-text)", bg: "var(--os-amber-soft)" },
  delivered:  { label: "已送達", color: "var(--os-success)",   bg: "var(--os-success-bg)" },
  signed:     { label: "已簽收", color: "var(--os-success)",   bg: "var(--os-success-bg)" },
} as const;

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  pending:    { status: "picking",    label: "開始撿貨" },
  picking:    { status: "dispatched", label: "已出車" },
  dispatched: { status: "delivered",  label: "貨已送達" },
  delivered:  { status: "signed",     label: "確認簽收" },
};

const thSt: React.CSSProperties = { color: "var(--os-text-3)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };
const cardSt: React.CSSProperties = { background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10 };

export default function OSDelivery() {
  const { user } = useAuth();
  const search = useSearch();
  const isSuperAdmin = user?.role === "super_admin";
  const isManager = user?.role === "manager";
  const canEdit = isSuperAdmin || isManager;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filterStoreId, setFilterStoreId] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateFrom, setShowCreateFrom] = useState(false);
  const [preselectedProcurementId, setPreselectedProcurementId] = useState<number | undefined>();
  const [signDialog, setSignDialog] = useState<{ id: number; deliveryNo: string } | null>(null);
  const [signedBy, setSignedBy] = useState("");

  useEffect(() => {
    const fromId = new URLSearchParams(search).get("from");
    if (fromId) {
      setPreselectedProcurementId(Number(fromId));
      setShowCreateFrom(true);
    }
  }, [search]);

  const { data: stores = [] } = trpc.store.list.useQuery();
  const { data: orders = [], refetch } = trpc.delivery.listDeliveryOrders.useQuery({
    storeId: filterStoreId, status: filterStatus || undefined, year, month,
  });
  const { data: detail } = trpc.delivery.getDeliveryDetail.useQuery(
    { id: expandedId! }, { enabled: expandedId !== null }
  );
  const { data: stats = [] } = trpc.delivery.getMonthStats.useQuery({ year, month });

  const updateStatus = trpc.delivery.updateStatus.useMutation({
    onSuccess: (data) => {
      refetch();
      setSignDialog(null);
      setSignedBy("");
      if (data.totalAmount) {
        toast.success(`簽收完成，已自動產生應收帳款 $${Number(data.totalAmount).toLocaleString()}`);
      } else {
        toast.success("狀態已更新");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const storesForDelivery = (stores as any[]).filter((s: any) => s.id !== 401534);

  const totalSignedAmount = useMemo(() =>
    (stats as any[]).reduce((sum: number, s: any) => sum + Number(s.signedAmount), 0), [stats]);

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 16 }} className="space-y-4">

        {/* 頂部工具列 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", padding: "0 4px" }}>
              {year}年{String(month).padStart(2, "0")}月
            </span>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Select value={filterStoreId?.toString() ?? "all"} onValueChange={v => setFilterStoreId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="全部門市" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              {storesForDelivery.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace("來點什麼 ", "")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="全部狀態" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {canEdit && (
            <div className="ml-auto flex gap-2">
              <Button style={amberBtn} onClick={() => setShowCreateFrom(true)}>從叫貨單建立</Button>
              <Button variant="outline" onClick={() => setShowCreate(true)}>手動新增</Button>
            </div>
          )}
        </div>

        {/* 月統計摘要 */}
        {(stats as any[]).length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 py-2" style={{ borderBottom: '1px solid var(--os-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
              本月總單 <strong style={{ color: 'var(--os-amber-text)', fontVariantNumeric: 'tabular-nums' }}>
                {(stats as any[]).reduce((s: number, r: any) => s + Number(r.deliveryCount), 0)}
              </strong> 張
            </span>
            <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
              門市 <strong style={{ color: 'var(--os-text-1)', fontVariantNumeric: 'tabular-nums' }}>{(stats as any[]).length}</strong> 間
            </span>
            <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
              已簽收 <strong style={{ color: 'var(--os-success)', fontVariantNumeric: 'tabular-nums' }}>${totalSignedAmount.toLocaleString()}</strong>
            </span>
            <span style={{ fontSize: 13, color: 'var(--os-text-2)' }}>
              待簽收 <strong style={{ color: 'var(--os-danger)', fontVariantNumeric: 'tabular-nums' }}>
                ${(stats as any[]).reduce((s: number, r: any) => s + Number(r.pendingAmount), 0).toLocaleString()}
              </strong>
            </span>
          </div>
        )}

        {/* 訂單列表 */}
        <div className="space-y-2">
          {(orders as any[]).length === 0 ? (
            <div style={{ ...cardSt, padding: 32, textAlign: "center", color: "var(--os-text-3)", fontSize: 13 }}>
              本月尚無派車單
            </div>
          ) : (orders as any[]).map((order: any) => {
            const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
            const nextAction = NEXT_STATUS[order.status];
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} style={cardSt}>
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--os-amber-soft)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <Truck style={{ width: 16, height: 16, color: "var(--os-text-3)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--os-text-1)" }}>{order.deliveryNo}</span>
                      <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>{order.deliveryDate}</span>
                      <span style={{ fontSize: 12, color: "var(--os-text-2)" }}>{order.toStoreName}</span>
                      {order.driverName && <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>· {order.driverName}</span>}
                    </div>
                    {order.totalAmount && (
                      <p style={{ fontSize: 12, marginTop: 2, color: "var(--os-amber-text)", fontWeight: 600 }}>
                        ${Number(order.totalAmount).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, fontWeight: 500, color: cfg?.color, background: cfg?.bg }}>
                      {cfg?.label}
                    </span>
                    {isExpanded
                      ? <ChevronUp style={{ width: 16, height: 16, color: "var(--os-text-3)" }} />
                      : <ChevronDown style={{ width: 16, height: 16, color: "var(--os-text-3)" }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--os-border)", padding: "12px 16px 16px" }} className="space-y-3">
                    {/* 品項明細 */}
                    {detail?.order?.id === order.id ? (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--os-text-3)", marginBottom: 8 }}>品項明細</p>
                        {((detail?.items ?? []) as any[]).length === 0 ? (
                          <p style={{ fontSize: 12, color: "var(--os-text-3)" }}>無品項記錄</p>
                        ) : (
                          <div>
                            {((detail?.items ?? []) as any[]).map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs py-1"
                                style={{ borderBottom: "1px solid var(--os-border-2)" }}>
                                <span style={{ color: "var(--os-text-1)" }}>{item.productName}</span>
                                <div className="flex items-center gap-3">
                                  <span style={{ color: "var(--os-text-2)" }}>{item.quantity} {item.unit || ""}</span>
                                  {item.batchPrice != null && Number(item.batchPrice) > 0
                                    ? <span style={{ color: "var(--os-amber-text)" }}>${Number(item.batchPrice).toLocaleString()}/份</span>
                                    : <span className="flex items-center gap-0.5" style={{ color: "var(--os-danger)" }}>
                                        <AlertCircle style={{ width: 12, height: 12 }} />未設批價
                                      </span>
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: "var(--os-text-3)" }}>載入品項中...</p>
                    )}

                    {order.note && <p style={{ fontSize: 12, color: "var(--os-text-3)" }}>備註：{order.note}</p>}
                    {order.signedBy && <p style={{ fontSize: 12, color: "var(--os-text-2)" }}>簽收人：{order.signedBy}</p>}

                    {/* 狀態推進按鈕 */}
                    {canEdit && nextAction && order.status !== "signed" && (
                      <div className="flex gap-2 pt-1">
                        {nextAction.status === "signed" ? (
                          <Button size="sm" style={amberBtn}
                            onClick={() => setSignDialog({ id: order.id, deliveryNo: order.deliveryNo })}>
                            {nextAction.label}
                          </Button>
                        ) : (
                          <Button size="sm" style={amberBtn}
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: order.id, status: nextAction.status as any })}>
                            {nextAction.label}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 簽收確認 Dialog */}
        <Dialog open={!!signDialog} onOpenChange={() => { setSignDialog(null); setSignedBy(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認簽收 — {signDialog?.deliveryNo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p style={{ fontSize: 13, color: "var(--os-text-2)" }}>簽收後將自動計算批價金額並產生應收帳款。</p>
              <div>
                <Label>簽收人姓名</Label>
                <Input placeholder="請輸入簽收人姓名" value={signedBy} onChange={e => setSignedBy(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSignDialog(null); setSignedBy(""); }}>取消</Button>
              <Button style={amberBtn} disabled={!signedBy.trim() || updateStatus.isPending}
                onClick={() => signDialog && updateStatus.mutate({ id: signDialog.id, status: "signed", signedBy })}>
                {updateStatus.isPending ? "簽收中..." : "確認簽收"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 從叫貨單建立 Dialog */}
        {showCreateFrom && (
          <CreateFromProcurementDialog
            preselectedId={preselectedProcurementId}
            onClose={() => { setShowCreateFrom(false); setPreselectedProcurementId(undefined); }}
            onSuccess={() => { setShowCreateFrom(false); setPreselectedProcurementId(undefined); refetch(); }}
          />
        )}

        {/* 手動新增派車單 Dialog */}
        {showCreate && (
          <CreateDeliveryDialog
            stores={storesForDelivery}
            onClose={() => setShowCreate(false)}
            onSuccess={() => { setShowCreate(false); refetch(); }}
          />
        )}
      </div>
    </AdminDashboardLayout>
  );
}

function CreateFromProcurementDialog({
  preselectedId, onClose, onSuccess,
}: {
  preselectedId?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(preselectedId);
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [driverName, setDriverName] = useState("江沛儒");
  const [note, setNote] = useState("");

  const { data: yulianOrders = [] } = trpc.procurement.list.useQuery({ sourceType: "damai_yulian" });
  const availableOrders = (yulianOrders as any[]).filter((o: any) => o.status === "confirmed" || o.status === "received");

  const { data: detail } = trpc.procurement.getDetail.useQuery(
    { orderId: selectedOrderId! }, { enabled: !!selectedOrderId }
  );

  const createFromProcurement = trpc.delivery.createFromProcurement.useMutation({
    onSuccess: (data) => { toast.success(`派車單 ${data.deliveryNo} 已建立，共 ${data.itemCount} 項`); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!selectedOrderId) return toast.error("請選擇叫貨單");
    if (!driverName.trim()) return toast.error("請輸入司機姓名");
    createFromProcurement.mutate({ procurementOrderId: selectedOrderId, deliveryDate, driverName: driverName.trim(), note: note.trim() || undefined });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-lg p-0 gap-0 max-h-[88vh]">
        <div className="flex flex-col h-full max-h-[88vh]">
          <DialogHeader className="shrink-0 px-6 py-4" style={{ borderBottom: '1px solid var(--os-border)' }}>
            <DialogTitle>從叫貨單建立派車單</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="space-y-4 px-6 py-4">
          <div>
            <Label>選擇叫貨單（B類・已確認/已到貨）</Label>
            <Select value={selectedOrderId?.toString() ?? "none"} onValueChange={v => setSelectedOrderId(v === "none" ? undefined : Number(v))}>
              <SelectTrigger><SelectValue placeholder="選擇叫貨單" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">請選擇...</SelectItem>
                {availableOrders.map((o: any) => (
                  <SelectItem key={o.id} value={o.id.toString()}>
                    {o.orderNo} | {o.suppliers} | {o.stores} | {o.itemCount}項
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableOrders.length === 0 && (
              <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>目前無 B 類（自配）且狀態為已確認/已到貨的叫貨單</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>出車日期</Label>
              <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
            <div><Label>司機姓名</Label>
              <Input placeholder="必填" value={driverName} onChange={e => setDriverName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>備註（選填）</Label>
            <Input placeholder="選填" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {selectedOrderId && detail && (
            <div>
              <Label>品項預覽（唯讀，共 {detail.items?.length ?? 0} 項）</Label>
              <div style={{ marginTop: 4, border: "1px solid var(--os-border)", borderRadius: 8, overflow: "hidden" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--os-surface-2)" }}>
                      <th className="text-left px-3 py-2" style={{ color: "var(--os-text-3)", fontWeight: 600 }}>品名</th>
                      <th className="text-right px-3 py-2" style={{ color: "var(--os-text-3)", fontWeight: 600 }}>數量</th>
                      <th className="text-left px-3 py-2" style={{ color: "var(--os-text-3)", fontWeight: 600 }}>單位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.items as any[]).map((item: any, i: number) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--os-border-2)" }}>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-1)" }}>{item.productName}</td>
                        <td className="px-3 py-2 text-right" style={{ color: "var(--os-text-2)" }}>{item.quantity}</td>
                        <td className="px-3 py-2" style={{ color: "var(--os-text-3)" }}>{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 px-6 py-3" style={{ borderTop: '1px solid var(--os-border)' }}>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button style={{ background: "var(--os-amber)", color: "#fff" }}
              disabled={!selectedOrderId || !driverName.trim() || createFromProcurement.isPending}
              onClick={handleSubmit}>
              {createFromProcurement.isPending ? "建立中..." : "建立派車單"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateDeliveryDialog({ stores, onClose, onSuccess }: { stores: any[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    deliveryDate: new Date().toISOString().slice(0, 10),
    toStoreId: "",
    driverName: "江沛儒",
    note: "",
  });
  const [items, setItems] = useState([{ productName: "", quantity: 1, unit: "", batchPrice: "", note: "", sortOrder: 0 }]);
  const [selectedProcurementId, setSelectedProcurementId] = useState<number | undefined>();

  const { data: confirmedOrders = [] } = trpc.procurement.list.useQuery({ status: "confirmed" });
  const { data: orderDetail } = trpc.procurement.getDetail.useQuery(
    { orderId: selectedProcurementId! }, { enabled: !!selectedProcurementId }
  );

  useEffect(() => {
    if (!orderDetail?.items || orderDetail.items.length === 0) return;
    setItems(orderDetail.items.map((item: any, idx: number) => ({
      productName: item.productName ?? "",
      quantity: item.quantity?.toString() ?? "",
      unit: item.unit ?? "",
      batchPrice: item.batchPrice?.toString() ?? "",
      note: "",
      sortOrder: idx,
    })));
  }, [orderDetail]);

  const createOrder = trpc.delivery.createDeliveryOrder.useMutation({
    onSuccess: (data) => { toast.success(`派車單 ${data.deliveryNo} 建立成功`); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const addItem = () => setItems(prev => [...prev, { productName: "", quantity: 1, unit: "", batchPrice: "", note: "", sortOrder: prev.length }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: string, val: any) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const handleSubmit = () => {
    if (!form.toStoreId) return toast.error("請選擇目的門市");
    const validItems = items.filter(it => it.productName.trim());
    if (validItems.length === 0) return toast.error("請至少填寫一個品項");
    const toStore = stores.find(s => s.id === Number(form.toStoreId));
    createOrder.mutate({
      deliveryDate: form.deliveryDate,
      toStoreId: Number(form.toStoreId),
      toStoreName: toStore?.name ?? "",
      driverName: form.driverName || undefined,
      note: form.note || undefined,
      procurementOrderId: selectedProcurementId,
      items: validItems.map((it, i) => ({
        productName: it.productName,
        quantity: Number(it.quantity),
        unit: it.unit || undefined,
        batchPrice: it.batchPrice ? Number(it.batchPrice) : undefined,
        note: it.note || undefined,
        sortOrder: i,
      })),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-lg p-0 gap-0 max-h-[88vh]">
        <div className="flex flex-col h-full max-h-[88vh]">
          <DialogHeader className="shrink-0 px-6 py-4" style={{ borderBottom: '1px solid var(--os-border)' }}>
            <DialogTitle>手動新增派車單</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="space-y-3 px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>出車日期</Label>
                  <Input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} />
                </div>
                <div><Label>司機</Label>
                  <Input placeholder="選填" value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>目的門市</Label>
                <Select value={form.toStoreId} onValueChange={v => setForm(f => ({ ...f, toStoreId: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇門市" /></SelectTrigger>
                  <SelectContent>
                    {stores.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace("來點什麼 ", "")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>關聯叫貨單（選填）</Label>
                <Select value={selectedProcurementId?.toString() ?? "none"} onValueChange={v => setSelectedProcurementId(v === "none" ? undefined : Number(v))}>
                  <SelectTrigger><SelectValue placeholder="不關聯叫貨單" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不關聯</SelectItem>
                    {(confirmedOrders as any[]).map((o: any) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.orderNo} · {o.stores ?? ""}（{o.orderDate}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>品項明細</Label>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addItem}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> 新增
                  </Button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1 items-center">
                      <Input className="col-span-4 h-7 text-xs" placeholder="品名*" value={item.productName} onChange={e => updateItem(idx, "productName", e.target.value)} />
                      <Input className="col-span-3 h-7 text-xs" placeholder="數量" type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} />
                      <Input className="col-span-2 h-7 text-xs" placeholder="單位" value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)} />
                      <Input className="col-span-2 h-7 text-xs" placeholder="批價" value={item.batchPrice} onChange={e => updateItem(idx, "batchPrice", e.target.value)} />
                      <Button variant="ghost" size="sm" className="col-span-1 h-7 w-7 p-0" style={{ color: "var(--os-danger)" }} onClick={() => removeItem(idx)}>✕</Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>備註</Label>
                <Input placeholder="選填" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 px-6 py-3" style={{ borderTop: '1px solid var(--os-border)' }}>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button style={{ background: "var(--os-amber)", color: "#fff" }} disabled={createOrder.isPending} onClick={handleSubmit}>
              {createOrder.isPending ? "建立中..." : "建立派車單"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

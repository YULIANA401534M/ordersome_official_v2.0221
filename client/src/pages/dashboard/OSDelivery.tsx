import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, Truck, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  pending:    { label:"待備貨", color:"#9ca3af", bg:"#f3f4f6" },
  picking:    { label:"撿貨中", color:"#0369a1", bg:"#eff6ff" },
  dispatched: { label:"已出車", color:"#b45309", bg:"#fef3c7" },
  delivered:  { label:"已送達", color:"#15803d", bg:"#f0fdf4" },
  signed:     { label:"已簽收", color:"#14532d", bg:"#dcfce7" },
} as const;

const NEXT_STATUS: Record<string,{status:string,label:string,color:string}> = {
  pending:    { status:"picking",    label:"開始撿貨", color:"#0369a1" },
  picking:    { status:"dispatched", label:"確認出車", color:"#b45309" },
  dispatched: { status:"delivered",  label:"確認送達", color:"#15803d" },
  delivered:  { status:"signed",     label:"確認簽收", color:"#14532d" },
};

export default function OSDelivery() {
  const { user } = useAuth();
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
  const [signDialog, setSignDialog] = useState<{id:number,deliveryNo:string}|null>(null);
  const [signedBy, setSignedBy] = useState("");

  const { data: stores = [] } = trpc.store.list.useQuery();
  const { data: orders = [], refetch } = trpc.delivery.listDeliveryOrders.useQuery({
    storeId: filterStoreId, status: filterStatus || undefined, year, month
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
      }
    },
    onError: (e) => toast.error(e.message)
  });

  const prevMonth = () => { if (month===1){setYear(y=>y-1);setMonth(12);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setYear(y=>y+1);setMonth(1);}else setMonth(m=>m+1); };

  const storesForDelivery = (stores as any[]).filter((s:any) => s.id !== 401534);

  const totalSignedAmount = useMemo(() =>
    (stats as any[]).reduce((sum:number, s:any) => sum + Number(s.signedAmount), 0), [stats]);

  return (
    <AdminDashboardLayout>
      <div className="p-4 space-y-4" style={{ background:"#f7f6f3", minHeight:"100vh" }}>
        {/* 頂部 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4"/></Button>
            <span className="text-sm font-medium px-2">{year}年{String(month).padStart(2,"0")}月</span>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4"/></Button>
          </div>
          <Select value={filterStoreId?.toString() ?? "all"}
            onValueChange={v => setFilterStoreId(v==="all"?undefined:Number(v))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="全部門市"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              {storesForDelivery.map((s:any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace("來點什麼 ","")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="全部狀態"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            {canEdit && (
              <Button className="bg-amber-700 hover:bg-amber-800 text-white" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1"/>新增派車單
              </Button>
            )}
          </div>
        </div>

        {/* 月統計卡片 */}
        {(stats as any[]).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">本月總單數</p>
              <p className="text-2xl font-bold" style={{ fontFamily:"'jf-kamabit',sans-serif", color:"#b45309" }}>
                {(stats as any[]).reduce((s:number,r:any)=>s+Number(r.deliveryCount),0)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">已簽收金額</p>
              <p className="text-2xl font-bold" style={{ fontFamily:"'jf-kamabit',sans-serif", color:"#15803d" }}>
                ${totalSignedAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">門市數</p>
              <p className="text-2xl font-bold" style={{ fontFamily:"'jf-kamabit',sans-serif", color:"#0369a1" }}>
                {(stats as any[]).length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">待簽收金額</p>
              <p className="text-2xl font-bold" style={{ fontFamily:"'jf-kamabit',sans-serif", color:"#dc2626" }}>
                ${(stats as any[]).reduce((s:number,r:any)=>s+Number(r.pendingAmount),0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* 訂單列表 */}
        <div className="space-y-2">
          {(orders as any[]).length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-sm">
              本月尚無派車單
            </div>
          ) : (
            (orders as any[]).map((order: any) => {
              const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
              const nextAction = NEXT_STATUS[order.status];
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className="bg-white rounded-xl border border-stone-200">
                  <div className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-stone-800">{order.deliveryNo}</span>
                        <span className="text-xs text-stone-400">{order.deliveryDate}</span>
                        <span className="text-xs text-stone-500">{order.toStoreName?.replace("來點什麼 ","")}</span>
                        {order.driverName && <span className="text-xs text-stone-400">· {order.driverName}</span>}
                      </div>
                      {order.totalAmount && (
                        <p className="text-xs mt-0.5" style={{ color:"#b45309", fontFamily:"'jf-kamabit',sans-serif" }}>
                          ${Number(order.totalAmount).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: cfg?.color, background: cfg?.bg }}>
                        {cfg?.label}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-stone-100 p-4 space-y-3">
                      {/* 品項明細 */}
                      {detail?.order?.id === order.id ? (
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-2">品項明細</p>
                          <div className="space-y-1">
                            {((detail?.items ?? []) as any[]).map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-stone-50">
                                <span className="text-stone-700">{item.productName}</span>
                                <div className="flex items-center gap-3 text-stone-500">
                                  <span>{item.quantity} {item.unit || "份"}</span>
                                  {item.batchPrice != null
                                    ? <span style={{ color:"#b45309" }}>${Number(item.batchPrice).toLocaleString()}/份</span>
                                    : <span className="text-red-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />未設批價</span>
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400">載入品項中...</p>
                      )}

                      {order.note && (
                        <p className="text-xs text-stone-400">備註：{order.note}</p>
                      )}
                      {order.signedBy && (
                        <p className="text-xs text-stone-500">簽收人：{order.signedBy}</p>
                      )}

                      {/* 狀態推進按鈕 */}
                      {canEdit && nextAction && (
                        <div className="flex gap-2 pt-1">
                          {nextAction.status === "signed" ? (
                            <Button size="sm"
                              style={{ background: nextAction.color, color: "white" }}
                              onClick={() => setSignDialog({ id: order.id, deliveryNo: order.deliveryNo })}>
                              {nextAction.label}
                            </Button>
                          ) : (
                            <Button size="sm"
                              style={{ background: nextAction.color, color: "white" }}
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
            })
          )}
        </div>

        {/* 簽收確認 Dialog */}
        <Dialog open={!!signDialog} onOpenChange={() => { setSignDialog(null); setSignedBy(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認簽收 — {signDialog?.deliveryNo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-stone-500">簽收後將自動計算批價金額並產生應收帳款。</p>
              <div>
                <Label>簽收人姓名</Label>
                <Input placeholder="請輸入簽收人姓名" value={signedBy}
                  onChange={e => setSignedBy(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSignDialog(null); setSignedBy(""); }}>取消</Button>
              <Button
                style={{ background:"#14532d", color:"white" }}
                disabled={!signedBy.trim() || updateStatus.isPending}
                onClick={() => signDialog && updateStatus.mutate({ id: signDialog.id, status: "signed", signedBy })}>
                {updateStatus.isPending ? "簽收中..." : "確認簽收"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 新增派車單 Dialog */}
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

function CreateDeliveryDialog({ stores, onClose, onSuccess }: { stores: any[], onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState({
    deliveryDate: new Date().toISOString().slice(0,10),
    toStoreId: "",
    driverName: "",
    note: "",
  });
  const [items, setItems] = useState([{ productName: "", quantity: 1, unit: "", batchPrice: "", note: "", sortOrder: 0 }]);

  const createOrder = trpc.delivery.createDeliveryOrder.useMutation({
    onSuccess: (data) => {
      toast.success(`派車單 ${data.deliveryNo} 建立成功`);
      onSuccess();
    },
    onError: (e) => toast.error(e.message)
  });

  const addItem = () => setItems(prev => [...prev, { productName: "", quantity: 1, unit: "", batchPrice: "", note: "", sortOrder: prev.length }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_,idx) => idx !== i));
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
      items: validItems.map((it, i) => ({
        productName: it.productName,
        quantity: Number(it.quantity),
        unit: it.unit || undefined,
        batchPrice: it.batchPrice ? Number(it.batchPrice) : undefined,
        note: it.note || undefined,
        sortOrder: i
      }))
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增派車單</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>出車日期</Label>
              <Input type="date" value={form.deliveryDate}
                onChange={e => setForm(f => ({...f, deliveryDate: e.target.value}))} />
            </div>
            <div>
              <Label>司機</Label>
              <Input placeholder="選填" value={form.driverName}
                onChange={e => setForm(f => ({...f, driverName: e.target.value}))} />
            </div>
          </div>
          <div>
            <Label>目的門市</Label>
            <Select value={form.toStoreId} onValueChange={v => setForm(f => ({...f, toStoreId: v}))}>
              <SelectTrigger><SelectValue placeholder="選擇門市" /></SelectTrigger>
              <SelectContent>
                {stores.map((s:any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace("來點什麼 ","")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>品項明細</Label>
              <Button size="sm" variant="outline" onClick={addItem}>+新增</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center">
                  <Input className="col-span-4 h-7 text-xs" placeholder="品名*"
                    value={item.productName} onChange={e => updateItem(i, "productName", e.target.value)} />
                  <Input className="col-span-2 h-7 text-xs" placeholder="數量" type="number"
                    value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} />
                  <Input className="col-span-2 h-7 text-xs" placeholder="單位"
                    value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} />
                  <Input className="col-span-2 h-7 text-xs" placeholder="批價"
                    value={item.batchPrice} onChange={e => updateItem(i, "batchPrice", e.target.value)} />
                  <button className="col-span-1 text-red-400 text-xs hover:text-red-600"
                    onClick={() => removeItem(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>備註</Label>
            <Input placeholder="選填" value={form.note}
              onChange={e => setForm(f => ({...f, note: e.target.value}))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button className="bg-amber-700 hover:bg-amber-800 text-white"
            disabled={createOrder.isPending} onClick={handleSubmit}>
            {createOrder.isPending ? "建立中..." : "建立派車單"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useMemo, useState } from "react";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Package, Printer, Plus, RotateCcw, Route, Truck, Wallet } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtMoney(value: number | string | null | undefined) {
  return `NT$ ${Number(value ?? 0).toLocaleString("zh-TW")}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-TW");
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.toLocaleDateString("zh-TW")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const DISPATCH_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-stone-100 text-stone-600" },
  printed: { label: "已列印", className: "bg-sky-100 text-sky-700" },
  in_progress: { label: "配送中", className: "bg-orange-100 text-orange-700" },
  pending_handover: { label: "待點收", className: "bg-rose-100 text-rose-700" },
  completed: { label: "已完成", className: "bg-emerald-100 text-emerald-700" },
};

function GenerateDialog({ date, onClose, onSuccess }: { date: string; onClose: () => void; onSuccess: () => void }) {
  const generateDispatch = trpc.dayone.dispatch.generateDispatch.useMutation({
    onSuccess: (data) => {
      if (!data.dispatchOrders.length) {
        toast.warning((data as any).message ?? "這一天沒有可派車訂單");
      } else {
        toast.success(`已建立 ${data.dispatchOrders.length} 張派車單`);
      }
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>建立派車單</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-stone-600">
          <p>
            系統會將 <span className="font-semibold text-amber-700">{fmtDate(date)}</span> 的可配送訂單，依司機與路線建立派車單。
          </p>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
            建立派車單只做派車分配，不會提早建立應收。真正列印時才會扣庫存。
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button
              onClick={() => generateDispatch.mutate({ tenantId: TENANT_ID, dispatchDate: date })}
              disabled={generateDispatch.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {generateDispatch.isPending ? "建立中..." : "確認建立"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManualAddStopDialog({
  dispatchOrderId,
  onClose,
  onSuccess,
}: {
  dispatchOrderId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [deliverBoxes, setDeliverBoxes] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [note, setNote] = useState("");
  const [orderItems, setOrderItems] = useState([{ productId: "", qty: 1, unitPrice: 0 }]);
  const { data: customers = [] } = trpc.dayone.customers.list.useQuery({ tenantId: TENANT_ID });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const manualAddStop = trpc.dayone.dispatch.manualAddStop.useMutation({
    onSuccess: () => {
      toast.success("\u5df2\u65b0\u589e\u81e8\u6642\u505c\u9760\u9ede");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const hasSupplementItems = orderItems.some((item) => Number(item.qty) > 0 && item.productId);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{"\u65b0\u589e\u81e8\u6642\u505c\u9760\u9ede"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">{"\u5ba2\u6236"}</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder={"\u8acb\u9078\u64c7\u5ba2\u6236"} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">{"\u914d\u9001\u7bb1\u6578"}</label>
            <Input
              type="number"
              min={1}
              value={deliverBoxes}
              onChange={(event) => setDeliverBoxes(Math.max(1, Number(event.target.value || 1)))}
              className="rounded-2xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">{"\u4ed8\u6b3e\u72c0\u614b"}</label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">{"\u672a\u6536\u6b3e"}</SelectItem>
                <SelectItem value="weekly">{"\u9031\u7d50"}</SelectItem>
                <SelectItem value="monthly">{"\u6708\u7d50"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">{"\u5099\u8a3b"}</label>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={"\u4f8b\u5982\uff1a\u81e8\u6642\u52a0\u8ca8\u3001\u88dc\u55ae\u8aaa\u660e"}
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-800">{"\u88dc\u55ae\u54c1\u9805"}</p>
                <p className="text-xs text-stone-500">{"\u6709\u586b\u54c1\u9805\u6642\u6703\u540c\u6b65\u5efa\u7acb\u88dc\u55ae\u8a02\u55ae\uff1b\u7559\u7a7a\u5247\u53ea\u65b0\u589e\u505c\u9760\u9ede\u3002"}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOrderItems((current) => [...current, { productId: "", qty: 1, unitPrice: 0 }])}
              >
                <Plus className="mr-1 h-4 w-4" />
                {"\u65b0\u589e\u54c1\u9805"}
              </Button>
            </div>

            {orderItems.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1.4fr_0.7fr_0.9fr_auto]">
                <Select
                  value={item.productId}
                  onValueChange={(value) =>
                    setOrderItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, productId: value } : row
                      )
                    )
                  }
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder={"\u5546\u54c1"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(event) =>
                    setOrderItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, qty: Math.max(1, Number(event.target.value || 1)) } : row
                      )
                    )
                  }
                  className="rounded-2xl"
                  placeholder={"\u6578\u91cf"}
                />

                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={item.unitPrice}
                  onChange={(event) =>
                    setOrderItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, unitPrice: Math.max(0, Number(event.target.value || 0)) } : row
                      )
                    )
                  }
                  className="rounded-2xl"
                  placeholder={"\u55ae\u50f9"}
                />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setOrderItems((current) =>
                      current.length === 1
                        ? [{ productId: "", qty: 1, unitPrice: 0 }]
                        : current.filter((_, rowIndex) => rowIndex !== index)
                    )
                  }
                >
                  {"\u522a\u9664"}
                </Button>
              </div>
            ))}

            {hasSupplementItems ? (
              <div className="text-xs text-amber-700">
                {"\u9019\u7b46\u8cc7\u6599\u6703\u540c\u6642\u5efa\u7acb dispatch_supplement \u88dc\u55ae\uff0c\u4f9b\u5f8c\u7e8c\u5c0d\u5e33\u8207\u914d\u9001\u8ffd\u8e64\u4f7f\u7528\u3002"}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{"\u53d6\u6d88"}</Button>
            <Button
              onClick={() =>
                manualAddStop.mutate({
                  dispatchOrderId,
                  tenantId: TENANT_ID,
                  customerId: Number(customerId),
                  deliverBoxes,
                  paymentStatus,
                  note: note.trim() || undefined,
                  items: orderItems
                    .filter((item) => item.productId)
                    .map((item) => ({
                      productId: Number(item.productId),
                      qty: Number(item.qty),
                      unitPrice: Number(item.unitPrice),
                    })),
                })
              }
              disabled={!customerId || manualAddStop.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {manualAddStop.isPending ? "\u65b0\u589e\u4e2d..." : "\u78ba\u8a8d\u65b0\u589e"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const thStyle: React.CSSProperties = { padding: "6px 8px", textAlign: "left", fontWeight: 600, fontSize: "11px", color: "#374151", borderRight: "1px solid #e5e7eb" };
const tdStyle: React.CSSProperties = { padding: "4px 8px", borderRight: "1px solid #e5e7eb", verticalAlign: "top", fontSize: "12px" };

function DispatchDetailSheet({ dispatchId, onClose }: { dispatchId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [showAddStop, setShowAddStop] = useState(false);
  const [returnQtyByProduct, setReturnQtyByProduct] = useState<Record<number, number>>({});
  const [handoverCash, setHandoverCash] = useState("");
  const [handoverAdminNote, setHandoverAdminNote] = useState("");

  const { data: detail, isLoading } = trpc.dayone.dispatch.getDispatchDetail.useQuery(
    { id: dispatchId, tenantId: TENANT_ID },
    { enabled: !!dispatchId }
  );

  const markPrinted = trpc.dayone.dispatch.markPrinted.useMutation({
    onSuccess: () => {
      toast.success("派車單已列印，庫存已同步扣減");
      utils.dayone.dispatch.getDispatchDetail.invalidate();
      utils.dayone.dispatch.listDispatch.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const returnInventory = trpc.dayone.dispatch.returnInventory.useMutation({
    onSuccess: () => {
      toast.success("剩貨已送出待驗");
      setReturnQtyByProduct({});
      utils.dayone.dispatch.getDispatchDetail.invalidate();
      utils.dayone.dispatch.listDispatch.invalidate();
      utils.dayone.inventory.pendingReturns.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const confirmHandover = trpc.dayone.dispatch.confirmHandover.useMutation({
    onSuccess: (data) => {
      const diffText = data.diff !== 0
        ? `，差額 NT$ ${Math.abs(data.diff).toLocaleString()}${data.diff < 0 ? "（少收）" : "（多收）"}`
        : "，金額吻合";
      toast.success(`點收完成${diffText}。回庫 ${data.pendingReturnCount} 項，應收結清 ${data.cashArSettled} 筆`);
      setHandoverCash("");
      setHandoverAdminNote("");
      utils.dayone.dispatch.getDispatchDetail.invalidate();
      utils.dayone.dispatch.listDispatch.invalidate();
      utils.dayone.inventory.pendingReturns.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const items = detail?.items ?? [];
  const products = detail?.products ?? [];
  const productsByOrder: any[] = detail?.productsByOrder ?? [];
  const totals = useMemo(() => {
    return {
      deliverBoxes: items.reduce((sum: number, item: any) => sum + Number(item.deliverBoxes ?? 0), 0),
      returnBoxes: items.reduce((sum: number, item: any) => sum + Number(item.returnBoxes ?? 0), 0),
      cashCollected: items.reduce((sum: number, item: any) => sum + Number(item.cashCollected ?? 0), 0),
    };
  }, [items]);

  const returnRows = products.map((product: any) => ({
    productId: Number(product.productId),
    productName: product.productName,
    unit: product.unit,
    shippedQty: Number(product.shippedQty ?? 0),
    qty: Number(returnQtyByProduct[Number(product.productId)] ?? 0),
  }));

  function handlePrint() {
    const target = document.querySelector(".print-target") as HTMLElement | null;
    if (!target) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const styles = Array.from(document.styleSheets)
      .flatMap((s) => { try { return Array.from(s.cssRules).map((r) => r.cssText); } catch { return []; } })
      .join("\n");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${styles}
body { margin: 0; padding: 16px; background: white; font-family: 'Noto Sans TC', Arial, sans-serif; }
@media print {
  body { margin: 0; padding: 8px; }
  @page { size: A4 portrait; margin: 10mm 8mm; }
}
</style></head><body>${target.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  }

  return (
    <Sheet open={!!dispatchId} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
        {isLoading || !detail ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <div className="flex min-h-full flex-col">
            <style>{`
              @media print {
                .no-print { display: none !important; }
                .print-dispatch-sheet { display: block !important; }
              }
              @media screen {
                .print-dispatch-sheet { display: block; }
              }
            `}</style>
            <div className="no-print sticky top-0 z-20 flex items-center gap-2 border-b bg-white px-5 py-3">
              <Button variant="outline" onClick={onClose}>返回</Button>
              <div className="ml-auto flex items-center gap-2">
                {detail.status !== "draft" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    撿貨單已列印
                  </span>
                )}
                {detail.status === "draft" && (
                  <Button
                    variant="outline"
                    onClick={() => markPrinted.mutate({ id: dispatchId, tenantId: TENANT_ID })}
                    disabled={markPrinted.isPending}
                  >
                    {markPrinted.isPending ? "處理中..." : "撿貨完畢並扣庫存"}
                  </Button>
                )}
                <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  列印撿貨單
                </Button>
              </div>
            </div>

            <div className="print-target space-y-4 px-5 py-5">
              {/* Screen header — hidden in print */}
              <section className="no-print rounded-[30px] bg-[linear-gradient(135deg,#1f2937_0%,#374151_45%,#b45309_100%)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(120,53,15,0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">出貨單</p>
                    <h2 className="mt-3 dayone-page-title text-white">派車工作台</h2>
                    <p className="mt-3 text-sm text-white/72">{fmtDate(detail.dispatchDate)} 配送日</p>
                  </div>
                  <Badge className={`${DISPATCH_STATUS[detail.status]?.className ?? "bg-stone-100 text-stone-600"} border-0`}>
                    {DISPATCH_STATUS[detail.status]?.label ?? detail.status}
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs text-white/60">司機</p>
                    <p className="mt-1 text-base font-semibold">{detail.driverName}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs text-white/60">路線代碼</p>
                    <p className="mt-1 text-base font-semibold">{detail.routeCode}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs text-white/60">預設備用箱</p>
                    <p className="mt-1 text-base font-semibold">{detail.extraBoxes ?? 20}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-xs text-white/60">建立時間</p>
                    <p className="mt-1 text-sm font-medium">{fmtDateTime(detail.generatedAt)}</p>
                  </div>
                </div>
              </section>

              <section className="no-print grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
                  <p className="text-xs text-stone-400">派出箱數</p>
                  <p className="mt-3 dayone-kpi-value text-stone-900">{totals.deliverBoxes}</p>
                </div>
                <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
                  <p className="text-xs text-stone-400">回收空箱</p>
                  <p className="mt-3 dayone-kpi-value text-stone-900">{totals.returnBoxes}</p>
                </div>
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs text-amber-600">現場收款</p>
                  <p className="mt-3 dayone-kpi-value text-amber-700">{fmtMoney(totals.cashCollected)}</p>
                </div>
              </section>

              {/* ─── PRINT LAYOUT ────────────────────────────────────── */}
              <section className="print-dispatch-sheet">
                <div style={{fontFamily:"'Noto Sans TC', Arial, sans-serif", fontSize:"12px", color:"#111"}}>

                  {/* ══ PAGE 1: 出貨彙總表（司機工作表） ══ */}
                  <div style={{marginBottom:"20px"}}>
                    {/* Header */}
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderBottom:"2.5px solid #111", paddingBottom:"6px", marginBottom:"10px"}}>
                      <div>
                        <div style={{fontSize:"18px", fontWeight:"800", letterSpacing:"0.05em"}}>大永蛋行　出貨彙總表</div>
                        <div style={{fontSize:"11px", color:"#555", marginTop:"3px"}}>
                          {fmtDate(detail.dispatchDate)}　司機：{detail.driverName}　路線：{detail.routeCode}　共 {items.length} 站　備用箱 {detail.extraBoxes ?? 20} 箱
                        </div>
                      </div>
                      <div style={{fontSize:"11px", color:"#888", textAlign:"right"}}>
                        列印時間：{new Date().toLocaleString("zh-TW")}
                      </div>
                    </div>

                    {/* Summary table — modelled after original pages 23-24 */}
                    <table style={{width:"100%", borderCollapse:"collapse", fontSize:"11.5px", tableLayout:"fixed"}}>
                      <colgroup>
                        <col style={{width:"22px"}} />
                        <col style={{width:"100px"}} />
                        <col style={{width:"130px"}} />
                        <col />
                        <col style={{width:"70px"}} />
                        <col style={{width:"60px"}} />
                        <col style={{width:"60px"}} />
                        <col style={{width:"44px"}} />
                        <col style={{width:"44px"}} />
                        <col style={{width:"80px"}} />
                      </colgroup>
                      <thead>
                        <tr style={{background:"#f3f4f6", borderTop:"1px solid #aaa", borderBottom:"1.5px solid #aaa"}}>
                          <th style={{...thStyle, textAlign:"center"}}>#</th>
                          <th style={{...thStyle}}>客戶／電話</th>
                          <th style={{...thStyle}}>地址</th>
                          <th style={{...thStyle}}>貨種</th>
                          <th style={{...thStyle, textAlign:"right"}}>銷售額</th>
                          <th style={{...thStyle, textAlign:"right"}}>已收</th>
                          <th style={{...thStyle, textAlign:"right"}}>未收</th>
                          <th style={{...thStyle, textAlign:"center"}}>收前箱</th>
                          <th style={{...thStyle, textAlign:"center"}}>收後箱</th>
                          <th style={{...thStyle}}>備註</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any) => {
                          const stopProducts = productsByOrder.filter((p: any) => Number(p.orderId) === Number(item.orderId));
                          const amt = Number(item.orderAmount ?? 0);
                          const isSettled = item.paymentStatus === "monthly" || item.paymentStatus === "weekly";
                          const payLabel: Record<string, string> = { monthly: "月結", weekly: "週結" };
                          return (
                            <tr key={item.id} style={{borderBottom:"1px solid #ddd", verticalAlign:"top"}}>
                              <td style={{...tdStyle, textAlign:"center", fontWeight:"700", paddingTop:"7px"}}>{item.stopSequence}</td>
                              <td style={{...tdStyle, fontWeight:"600", paddingTop:"7px"}}>
                                {item.customerName}
                                {item.customerPhone && <div style={{fontSize:"10px", color:"#666", fontWeight:"400"}}>{item.customerPhone}</div>}
                              </td>
                              <td style={{...tdStyle, fontSize:"10px", color:"#555", paddingTop:"7px"}}>{item.customerAddress ?? "—"}</td>
                              <td style={{...tdStyle, paddingTop:"5px", paddingBottom:"5px", fontSize:"11px"}}>
                                {stopProducts.length > 0 ? (
                                  <div style={{display:"flex", flexWrap:"wrap", gap:"2px 8px"}}>
                                    {stopProducts.map((p: any, pi: number) => (
                                      <span key={pi} style={{whiteSpace:"nowrap"}}>
                                        {p.productName} <strong>{Math.round(Number(p.shippedQty))}</strong>{p.unit || ""}
                                      </span>
                                    ))}
                                  </div>
                                ) : <span style={{color:"#aaa"}}>—</span>}
                              </td>
                              <td style={{...tdStyle, textAlign:"right", fontWeight:"700", paddingTop:"7px"}}>
                                {isSettled ? <span style={{color:"#2563eb"}}>{payLabel[item.paymentStatus]}</span> : amt.toLocaleString()}
                              </td>
                              <td style={{...tdStyle, textAlign:"right", paddingTop:"7px", color:"#16a34a"}}>
                                {isSettled ? "" : "＿＿＿＿"}
                              </td>
                              <td style={{...tdStyle, textAlign:"right", paddingTop:"7px", color:"#dc2626"}}>
                                {isSettled ? "" : "＿＿＿＿"}
                              </td>
                              <td style={{...tdStyle, textAlign:"center", paddingTop:"7px", color:"#666"}}>{item.prevBoxes ?? "＿"}</td>
                              <td style={{...tdStyle, textAlign:"center", paddingTop:"7px", color:"#aaa"}}>＿</td>
                              <td style={{...tdStyle, paddingTop:"7px", fontSize:"10px", color:"#aaa"}}>
                                {item.note || ""}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid #111", background:"#f9fafb"}}>
                          <td colSpan={4} style={{...tdStyle, fontWeight:"700", textAlign:"right", paddingTop:"7px", paddingBottom:"7px"}}>合計</td>
                          <td style={{...tdStyle, fontWeight:"700", textAlign:"right", paddingTop:"7px"}}>
                            {items.filter((i: any) => i.paymentStatus !== "monthly" && i.paymentStatus !== "weekly")
                              .reduce((s: number, i: any) => s + Number(i.orderAmount ?? 0), 0).toLocaleString()}
                          </td>
                          <td style={{...tdStyle, textAlign:"right", paddingTop:"7px", color:"#16a34a", fontWeight:"700"}}>＿＿＿＿＿</td>
                          <td style={{...tdStyle, textAlign:"right", paddingTop:"7px", color:"#dc2626", fontWeight:"700"}}>＿＿＿＿＿</td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Signature / note area */}
                    <div style={{marginTop:"12px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", fontSize:"11px"}}>
                      {[
                        {label:"司機出發簽名", sub:""},
                        {label:"司機回倉現收金額", sub:"NT$＿＿＿＿＿＿"},
                        {label:"管理員點收確認", sub:""},
                      ].map(({label, sub}) => (
                        <div key={label} style={{border:"1px solid #ccc", borderRadius:"3px", padding:"7px 10px"}}>
                          <div style={{fontWeight:"700", marginBottom:"4px"}}>{label}</div>
                          {sub && <div style={{color:"#dc2626", fontWeight:"600", marginBottom:"4px"}}>{sub}</div>}
                          <div style={{height:"32px"}}></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ══ PAGE 2+: 個別出貨單（每頁兩站，cut line 分隔） ══ */}
                  <div style={{pageBreakBefore:"always"}}>
                    <div style={{fontSize:"11px", color:"#888", marginBottom:"8px", textAlign:"center", letterSpacing:"0.06em"}}>
                      ── 以下為各站個別出貨單，請沿虛線裁切交給客戶 ──
                    </div>
                    {items.map((item: any, idx: number) => {
                      const stopProducts = productsByOrder.filter((p: any) => Number(p.orderId) === Number(item.orderId));
                      const isMonthly = item.paymentStatus === "monthly";
                      const isWeekly = item.paymentStatus === "weekly";
                      const isCash = !isMonthly && !isWeekly;
                      const totalAmt = Number(item.orderAmount ?? 0);
                      const slipTotal = stopProducts.reduce((s: number, p: any) =>
                        s + (p.unitPrice ? Number(p.shippedQty) * Number(p.unitPrice) : 0), 0);

                      return (
                        <div key={item.id} style={{pageBreakInside:"avoid"}}>
                          {/* Cut line between slips */}
                          {idx > 0 && (
                            <div style={{
                              borderTop:"1.5px dashed #aaa",
                              margin:"6px 0",
                              position:"relative",
                            }}>
                              <span style={{
                                position:"absolute",
                                top:"-8px",
                                left:"50%",
                                transform:"translateX(-50%)",
                                background:"white",
                                padding:"0 8px",
                                fontSize:"10px",
                                color:"#aaa",
                              }}>✂</span>
                            </div>
                          )}

                          {/* Slip */}
                          <div style={{
                            border:"1.5px solid #aaa",
                            borderRadius:"4px",
                            padding:"10px 14px",
                            marginBottom:"6px",
                          }}>
                            {/* Slip header row */}
                            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"2px solid #111", paddingBottom:"6px", marginBottom:"8px"}}>
                              <div>
                                <div style={{fontSize:"15px", fontWeight:"800", letterSpacing:"0.05em"}}>大永蛋行　出貨單</div>
                                <div style={{fontSize:"10px", color:"#666", marginTop:"1px"}}>
                                  第一聯（白）存根　第二聯（粉）客戶　第三聯（黃）收款
                                </div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:"11px", color:"#888"}}>路線 {detail.routeCode}　{fmtDate(detail.dispatchDate)}</div>
                                <div style={{fontSize:"16px", fontWeight:"700", letterSpacing:"0.12em", color:"#111"}}>No. {String((detail.routeCode ?? "") + String(item.stopSequence).padStart(3, "0"))}</div>
                              </div>
                            </div>

                            {/* Customer row */}
                            <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:"4px 12px", marginBottom:"8px", fontSize:"12px"}}>
                              <span style={{color:"#666", whiteSpace:"nowrap"}}>訂購人</span>
                              <span style={{fontWeight:"700", fontSize:"14px"}}>{item.customerName}</span>
                              {item.customerPhone && <>
                                <span style={{color:"#666"}}>電話</span>
                                <span>{item.customerPhone}</span>
                              </>}
                              {item.customerAddress && <>
                                <span style={{color:"#666", whiteSpace:"nowrap"}}>地址</span>
                                <span style={{fontSize:"11px", color:"#444"}}>{item.customerAddress}</span>
                              </>}
                            </div>

                            {/* Products table */}
                            <table style={{width:"100%", borderCollapse:"collapse", fontSize:"12px", marginBottom:"8px"}}>
                              <thead>
                                <tr style={{borderBottom:"1.5px solid #aaa", background:"#f9fafb"}}>
                                  <th style={{textAlign:"left", padding:"4px 6px", fontWeight:"600", color:"#444"}}>產品</th>
                                  <th style={{textAlign:"right", padding:"4px 6px", fontWeight:"600", color:"#444", width:"52px"}}>數量</th>
                                  <th style={{textAlign:"right", padding:"4px 6px", fontWeight:"600", color:"#444", width:"64px"}}>價格</th>
                                  <th style={{textAlign:"right", padding:"4px 6px", fontWeight:"600", color:"#444", width:"72px"}}>金額</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stopProducts.length > 0 ? stopProducts.map((p: any, pi: number) => {
                                  const lineAmt = p.unitPrice ? Number(p.shippedQty) * Number(p.unitPrice) : null;
                                  return (
                                    <tr key={pi} style={{borderBottom:"1px solid #eee"}}>
                                      <td style={{padding:"5px 6px"}}>{p.productName}</td>
                                      <td style={{padding:"5px 6px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{Math.round(Number(p.shippedQty))} {p.unit || ""}</td>
                                      <td style={{padding:"5px 6px", textAlign:"right", color:"#555", fontVariantNumeric:"tabular-nums"}}>
                                        {p.unitPrice ? Number(p.unitPrice).toLocaleString() : "—"}
                                      </td>
                                      <td style={{padding:"5px 6px", textAlign:"right", fontWeight:"600", fontVariantNumeric:"tabular-nums"}}>
                                        {lineAmt !== null ? lineAmt.toLocaleString() : "—"}
                                      </td>
                                    </tr>
                                  );
                                }) : (
                                  <tr><td colSpan={4} style={{padding:"6px", textAlign:"center", color:"#aaa"}}>—</td></tr>
                                )}
                              </tbody>
                            </table>

                            {/* Bottom section: boxes + payment + total */}
                            <div style={{borderTop:"1.5px solid #aaa", paddingTop:"7px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:"0 16px", alignItems:"center"}}>
                              {/* Box grid */}
                              <div style={{display:"grid", gridTemplateColumns:"repeat(4,52px)", gap:"4px", textAlign:"center"}}>
                                {([
                                  {label:"前　箱", value: item.prevBoxes != null ? String(item.prevBoxes) : ""},
                                  {label:"入　箱", value: item.deliverBoxes != null ? String(item.deliverBoxes) : ""},
                                  {label:"回　箱", value: ""},
                                  {label:"餘　箱", value: ""},
                                ] as {label: string; value: string}[]).map(({label, value}) => (
                                  <div key={label} style={{border:"1px solid #ccc", borderRadius:"2px", padding:"3px 2px"}}>
                                    <div style={{fontSize:"9px", color:"#777", lineHeight:"1.2"}}>{label}</div>
                                    <div style={{fontSize:"13px", fontWeight:"700", minHeight:"18px", borderBottom:"1px solid #aaa", marginTop:"1px", paddingBottom:"1px"}}>
                                      {value}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Payment checkboxes + note */}
                              <div style={{fontSize:"11px"}}>
                                <div style={{display:"flex", gap:"12px", marginBottom:"4px"}}>
                                  <span>□ 已收款</span>
                                  <span>□ 未收款</span>
                                  {!isCash && <span style={{color:"#2563eb", fontWeight:"700"}}>{isMonthly ? "月結" : "週結"}</span>}
                                </div>
                                <div style={{color:"#888", fontSize:"10px"}}>備註：＿＿＿＿＿＿＿＿＿</div>
                              </div>

                              {/* Total */}
                              <div style={{textAlign:"right", borderLeft:"1px solid #ddd", paddingLeft:"12px"}}>
                                <div style={{fontSize:"10px", color:"#666", marginBottom:"2px"}}>總金額</div>
                                <div style={{fontSize:"20px", fontWeight:"800", fontVariantNumeric:"tabular-nums", letterSpacing:"0.02em"}}>
                                  {(slipTotal || totalAmt).toLocaleString()}
                                </div>
                                <div style={{fontSize:"10px", color:"#888", marginTop:"4px"}}>
                                  客戶簽收：＿＿＿＿＿
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </section>

              {/* Screen-only station cards (no-print) */}
              <section className="no-print space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">配送站點</p>
                    <p className="mt-1 text-xs text-stone-500">兼顧派車、撿貨、簽收與收款回傳。</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowAddStop(true)} disabled={detail.status === "completed"}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增加站
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item: any) => {
                    const stopProducts = productsByOrder.filter((p: any) => Number(p.orderId) === Number(item.orderId));
                    const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
                      pending: { label: "待處理", cls: "bg-stone-100 text-stone-600" },
                      assigned: { label: "已指派", cls: "bg-sky-100 text-sky-700" },
                      picked: { label: "已撿貨", cls: "bg-amber-100 text-amber-700" },
                      delivering: { label: "配送中", cls: "bg-orange-100 text-orange-700" },
                      delivered: { label: "已送達", cls: "bg-emerald-100 text-emerald-700" },
                      returned: { label: "已回單", cls: "bg-rose-100 text-rose-700" },
                    };
                    const orderSt = ORDER_STATUS[item.orderStatus] ?? { label: item.orderStatus ?? "—", cls: "bg-stone-100 text-stone-600" };
                    const PAY_LABEL: Record<string, string> = { monthly: "月結", weekly: "週結", unpaid: "現收", paid: "已收", partial: "部份收" };
                    return (
                      <div key={item.id} className="rounded-[26px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-stone-900">
                              {item.stopSequence}. {item.customerName}
                            </p>
                            <p className="mt-1 text-sm text-stone-500">{item.customerAddress ?? "未提供地址"}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderSt.cls}`}>{orderSt.label}</span>
                            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">{PAY_LABEL[item.paymentStatus] ?? item.paymentStatus}</span>
                          </div>
                        </div>

                        {stopProducts.length > 0 && (
                          <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2.5 space-y-1">
                            {stopProducts.map((p: any, pi: number) => (
                              <div key={pi} className="flex items-center justify-between text-sm">
                                <span className="text-stone-700">{p.productName}</span>
                                <span className="font-semibold text-stone-900">{Math.round(Number(p.shippedQty))} {p.unit || ""}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div>
                            <p className="text-xs text-stone-400">訂單金額</p>
                            <p className="mt-1 font-semibold text-stone-900">{fmtMoney(item.orderAmount ?? 0)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-stone-400">已收現金</p>
                            <p className="mt-1 font-semibold text-amber-700">{fmtMoney(item.orderCashCollected ?? item.cashCollected ?? 0)}</p>
                          </div>
                        </div>
                        {(() => {
                          const amt = Number(item.orderAmount ?? 0);
                          const collected = Number(item.orderCashCollected ?? item.cashCollected ?? 0);
                          const diff = amt - collected;
                          const note = item.orderDriverNote;
                          if (diff <= 0 && !note) return null;
                          return (
                            <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2.5 space-y-1">
                              {diff > 0 && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                  差額 NT$ {diff.toLocaleString()}（少收）
                                </div>
                              )}
                              {note && (
                                <p className="text-xs text-rose-600 leading-4">備註：{note}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </section>

              {detail.status === "pending_handover" && (
                <section className="rounded-[28px] border-2 border-rose-300 bg-rose-50 p-5 shadow-[0_12px_24px_rgba(190,18,60,0.08)]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-sm font-semibold text-rose-800">司機已回倉，待管理員點收</p>
                  </div>

                  {(() => {
                    const systemExpected = items.reduce((s: number, i: any) => {
                      const amt = Number(i.orderAmount ?? 0);
                      const pay = i.paymentStatus;
                      return (pay === "unpaid" || pay === "partial") ? s + amt : s;
                    }, 0);
                    const driverCollected = items.reduce((s: number, i: any) => s + Number(i.orderCashCollected ?? i.cashCollected ?? 0), 0);
                    const handoverNum = handoverCash !== "" ? Number(handoverCash) : driverCollected;
                    const diff = handoverNum - driverCollected;
                    return (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="rounded-2xl bg-white px-3 py-3 border border-rose-100">
                            <p className="text-xs text-stone-400">現收應收</p>
                            <p className="mt-1 font-semibold text-stone-900">NT$ {systemExpected.toLocaleString()}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-3 border border-rose-100">
                            <p className="text-xs text-stone-400">司機實收</p>
                            <p className="mt-1 font-semibold text-amber-700">NT$ {driverCollected.toLocaleString()}</p>
                          </div>
                          <div className={`rounded-2xl px-3 py-3 border ${diff !== 0 ? "bg-rose-100 border-rose-300" : "bg-emerald-50 border-emerald-100"}`}>
                            <p className="text-xs text-stone-400">管理員確認繳回</p>
                            <p className={`mt-1 font-semibold ${diff !== 0 ? "text-rose-700" : "text-emerald-700"}`}>
                              {handoverCash !== "" ? `NT$ ${handoverNum.toLocaleString()}` : "待填入"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs text-stone-500">實際點收現金（NT$）</label>
                          <input
                            type="number"
                            min={0}
                            value={handoverCash}
                            onChange={(e) => setHandoverCash(e.target.value)}
                            placeholder={`司機帶回 NT$ ${driverCollected.toLocaleString()}`}
                            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                          />
                        </div>

                        {diff !== 0 && handoverCash !== "" && (
                          <div className="rounded-2xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">
                            差額 NT$ {Math.abs(diff).toLocaleString()}
                            {diff < 0 ? "（少收）" : "（多收）"}
                          </div>
                        )}

                        <div>
                          <label className="mb-1 block text-xs text-stone-500">備註（差額說明等）</label>
                          <input
                            type="text"
                            value={handoverAdminNote}
                            onChange={(e) => setHandoverAdminNote(e.target.value)}
                            placeholder="例如：A客戶少付100下次補"
                            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                          />
                        </div>

                        <Button
                          className="w-full bg-rose-600 text-white hover:bg-rose-700"
                          disabled={confirmHandover.isPending || handoverCash === ""}
                          onClick={() => confirmHandover.mutate({
                            dispatchOrderId: dispatchId,
                            tenantId: TENANT_ID,
                            cashConfirmed: Number(handoverCash),
                            adminNote: handoverAdminNote || undefined,
                          })}
                        >
                          {confirmHandover.isPending ? "確認中..." : "確認點收，完成今日派車"}
                        </Button>
                      </div>
                    );
                  })()}
                </section>
              )}

            </div>
          </div>
        )}

        {showAddStop && (
          <ManualAddStopDialog dispatchOrderId={dispatchId} onClose={() => setShowAddStop(false)} onSuccess={() => utils.dayone.dispatch.getDispatchDetail.invalidate()} />
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function DayoneDispatch() {
  const [date, setDate] = useState(todayStr());
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assignDriverId, setAssignDriverId] = useState("");

  const utils = trpc.useUtils();
  const { data: dispatches = [], isLoading, refetch } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId: TENANT_ID,
    dispatchDate: date,
  });

  const { data: unassignedOrders = [] } = trpc.dayone.orders.list.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: date,
    status: "pending",
  });
  const { data: drivers = [] } = trpc.dayone.drivers.list.useQuery({ tenantId: TENANT_ID });
  const unassigned = (unassignedOrders as any[]).filter((o: any) => !o.driverId);

  const setOrderDriver = trpc.dayone.orders.setDriver.useMutation({
    onSuccess: () => {
      toast.success("司機已指派");
      setAssigningId(null);
      setAssignDriverId("");
      utils.dayone.orders.list.invalidate();
    },
    onError: () => toast.error("指派失敗，請重試"),
  });

  function refresh() {
    refetch();
    utils.dayone.dispatch.listDispatch.invalidate();
  }

  return (
    <>
      <DayoneLayout>
        <div className="dayone-page">
          <section className="rounded-[34px] bg-[radial-gradient(circle_at_top_left,_rgba(255,247,224,0.7),_transparent_30%),linear-gradient(135deg,#111827_0%,#374151_44%,#b45309_100%)] px-6 py-6 text-white shadow-[0_20px_48px_rgba(120,53,15,0.18)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.18em] text-white/50">派車工作台</p>
                <h1 className="mt-3 dayone-page-title text-white">派車與回庫工作台</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72">
                  從當日訂單自動整併派車，到列印扣庫存、司機配送、回來剩貨回庫，都在同一條主流程完成。
                </p>
              </div>

              <div className="grid min-w-[220px] gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-white/55">配送日期</p>
                  <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 border-white/15 bg-white/10 text-white" />
                </div>
                <Button className="bg-white text-stone-900 hover:bg-white/90" onClick={() => setShowGenerateDialog(true)}>
                  <Route className="mr-2 h-4 w-4" />
                  建立當日派車
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
              <Truck className="h-5 w-5 text-amber-600" />
              <p className="mt-5 dayone-kpi-value text-stone-900">{dispatches.length}</p>
              <p className="mt-1 text-sm text-stone-500">當日派車單</p>
            </div>
            <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
              <Package className="h-5 w-5 text-amber-600" />
              <p className="mt-5 dayone-kpi-value text-stone-900">
                {dispatches.reduce((sum: number, dispatch: any) => sum + Number(dispatch.extraBoxes ?? 20), 0)}
              </p>
              <p className="mt-1 text-sm text-stone-500">預設備用箱</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <Wallet className="h-5 w-5 text-amber-600" />
              <p className="mt-5 dayone-kpi-value text-amber-700">
                {dispatches.filter((dispatch: any) => dispatch.status === "completed").length}
              </p>
              <p className="mt-1 text-sm text-amber-700/75">已完成車次</p>
            </div>
          </section>

          {unassigned.length > 0 && (
            <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-sm font-semibold text-amber-800">未指派司機訂單（{unassigned.length} 筆）</p>
                <p className="text-xs text-amber-600 ml-auto">指派後才能加入派車單</p>
              </div>
              <div className="space-y-2">
                {unassigned.map((o: any) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-stone-900">{o.customerName}</span>
                      <span className="ml-2 text-xs text-stone-400">{o.orderNo}</span>
                      <span className="ml-2 font-semibold text-stone-700">${Number(o.totalAmount).toLocaleString()}</span>
                    </div>
                    {assigningId === o.id ? (
                      <div className="flex items-center gap-2">
                        <Select value={assignDriverId} onValueChange={setAssignDriverId}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="選司機" /></SelectTrigger>
                          <SelectContent>
                            {(drivers as any[]).map((d: any) => (
                              <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 bg-amber-600 text-white hover:bg-amber-700"
                          disabled={!assignDriverId || setOrderDriver.isPending}
                          onClick={() => setOrderDriver.mutate({ id: o.id, tenantId: TENANT_ID, driverId: Number(assignDriverId) })}
                        >
                          確認
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAssigningId(null); setAssignDriverId(""); }}>取消</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAssigningId(o.id)}>
                        指派司機
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : dispatches.length === 0 ? (
            <section className="rounded-[30px] border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-stone-400">
              <Truck className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">{fmtDate(date)} 還沒有派車單。</p>
              <Button className="mt-5 bg-amber-600 text-white hover:bg-amber-700" onClick={() => setShowGenerateDialog(true)}>
                立即建立派車
              </Button>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dispatches.map((dispatch: any) => {
                const status = DISPATCH_STATUS[dispatch.status] ?? DISPATCH_STATUS.draft;
                return (
                  <article
                    key={dispatch.id}
                    className={`rounded-[30px] border p-5 shadow-[0_14px_28px_rgba(120,53,15,0.05)] ${
                      dispatch.status === "pending_handover"
                        ? "border-rose-300 bg-rose-50 shadow-[0_14px_28px_rgba(190,18,60,0.08)]"
                        : "border-stone-200/70 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-stone-900">{dispatch.driverName}</p>
                        <p className="mt-1 text-xs font-medium tracking-[0.16em] text-stone-400">{dispatch.routeCode}</p>
                      </div>
                      <Badge className={`${status.className} border-0`}>{status.label}</Badge>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-stone-500">
                      <div className="flex items-center justify-between">
                        <span>配送日期</span>
                        <span className="font-medium text-stone-900">{fmtDate(dispatch.dispatchDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>建立時間</span>
                        <span className="font-medium text-stone-900">{fmtDateTime(dispatch.generatedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>列印時間</span>
                        <span className="font-medium text-stone-900">{fmtDateTime(dispatch.printedAt)}</span>
                      </div>
                      {Number(dispatch.totalStops) > 0 && (
                        <div className="flex items-center justify-between">
                          <span>送達進度</span>
                          <span className="font-medium text-stone-900">
                            {dispatch.deliveredStops} / {dispatch.totalStops} 站
                          </span>
                        </div>
                      )}
                      {Number(dispatch.shortfallStops) > 0 && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {dispatch.shortfallStops} 站有差額，請查明細
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setDetailId(dispatch.id)}>
                        查看明細
                      </Button>
                      {dispatch.status === "draft" && (
                        <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => setDetailId(dispatch.id)}>
                          列印撿貨單
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </DayoneLayout>

      {showGenerateDialog && (
        <GenerateDialog date={date} onClose={() => setShowGenerateDialog(false)} onSuccess={refresh} />
      )}

      {detailId !== null && <DispatchDetailSheet dispatchId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

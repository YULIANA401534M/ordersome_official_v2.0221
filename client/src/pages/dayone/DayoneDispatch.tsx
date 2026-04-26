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
import { AlertTriangle, Package, Printer, Plus, RotateCcw, Route, Truck, Wallet } from "lucide-react";

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
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${styles} body{margin:0;padding:20px;background:white;} @media print{body{margin:0;padding:0;}}</style></head><body>${target.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
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
              <div className="ml-auto flex gap-2">
                {detail.status === "draft" && (
                  <Button
                    variant="outline"
                    onClick={() => markPrinted.mutate({ id: dispatchId, tenantId: TENANT_ID })}
                    disabled={markPrinted.isPending}
                  >
                    先列印並扣庫存
                  </Button>
                )}
                <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  列印派車單
                </Button>
              </div>
            </div>

            <div className="print-target space-y-4 px-5 py-5">
              {/* Screen header — hidden in print */}
              <section className="no-print rounded-[30px] bg-[linear-gradient(135deg,#1f2937_0%,#374151_45%,#b45309_100%)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(120,53,15,0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">Dispatch order</p>
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
                {/* Header bar */}
                <div style={{borderBottom:"2px solid #1f2937", paddingBottom:"8px", marginBottom:"10px"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
                    <div>
                      <div style={{fontSize:"18px", fontWeight:"700", letterSpacing:"0.04em"}}>大永蛋行 派車單</div>
                      <div style={{fontSize:"12px", color:"#555", marginTop:"2px"}}>
                        配送日期：{fmtDate(detail.dispatchDate)}　司機：{detail.driverName}　路線：{detail.routeCode}
                      </div>
                    </div>
                    <div style={{textAlign:"right", fontSize:"12px", color:"#777"}}>
                      <div>建立：{fmtDateTime(detail.generatedAt)}</div>
                      <div>共 {items.length} 站　預備箱 {detail.extraBoxes ?? 20} 箱</div>
                    </div>
                  </div>
                </div>

                {/* Stops table */}
                <table style={{width:"100%", borderCollapse:"collapse", fontSize:"12px"}}>
                  <thead>
                    <tr style={{background:"#f3f4f6"}}>
                      <th style={{...thStyle, width:"22px"}}>#</th>
                      <th style={{...thStyle, width:"120px"}}>客戶</th>
                      <th style={{...thStyle, width:"160px"}}>地址</th>
                      <th style={{...thStyle}}>商品明細</th>
                      <th style={{...thStyle, width:"58px", textAlign:"right"}}>金額</th>
                      <th style={{...thStyle, width:"48px", textAlign:"center"}}>結帳</th>
                      <th style={{...thStyle, width:"52px", textAlign:"center"}}>原箱</th>
                      <th style={{...thStyle, width:"52px", textAlign:"center"}}>送箱</th>
                      <th style={{...thStyle, width:"52px", textAlign:"center"}}>回箱</th>
                      <th style={{...thStyle, width:"58px", textAlign:"right"}}>實收</th>
                      <th style={{...thStyle, width:"60px"}}>簽名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => {
                      const stopProducts = productsByOrder.filter((p: any) => Number(p.orderId) === Number(item.orderId));
                      const payLabel: Record<string, string> = { monthly: "月結", weekly: "週結", unpaid: "現收", paid: "已收", partial: "部份" };
                      return (
                        <tr key={item.id} style={{borderBottom:"1px solid #e5e7eb", verticalAlign:"top"}}>
                          <td style={{...tdStyle, fontWeight:"600", paddingTop:"8px"}}>{item.stopSequence}</td>
                          <td style={{...tdStyle, fontWeight:"600", paddingTop:"8px"}}>{item.customerName}</td>
                          <td style={{...tdStyle, fontSize:"11px", color:"#555", paddingTop:"8px"}}>{item.customerAddress ?? "—"}</td>
                          <td style={{...tdStyle, paddingTop:"6px", paddingBottom:"6px"}}>
                            {stopProducts.length > 0 ? (
                              <div style={{color:"#374151"}}>
                                {stopProducts.map((p: any, pi: number) => (
                                  <div key={pi} style={{display:"flex", gap:"4px"}}>
                                    <span style={{flex:1}}>{p.productName}</span>
                                    <span style={{minWidth:"40px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{p.shippedQty} {p.unit || ""}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{color:"#9ca3af", fontSize:"11px"}}>—</span>
                            )}
                          </td>
                          <td style={{...tdStyle, textAlign:"right", fontWeight:"600", paddingTop:"8px"}}>{Number(item.orderAmount ?? 0).toLocaleString()}</td>
                          <td style={{...tdStyle, textAlign:"center", paddingTop:"8px"}}>{payLabel[item.paymentStatus] ?? item.paymentStatus}</td>
                          <td style={{...tdStyle, textAlign:"center", paddingTop:"8px"}}>{item.prevBoxes}</td>
                          <td style={{...tdStyle, textAlign:"center", paddingTop:"8px"}}>{item.deliverBoxes}</td>
                          <td style={{...tdStyle, textAlign:"center", paddingTop:"8px"}}>____</td>
                          <td style={{...tdStyle, textAlign:"right", paddingTop:"8px"}}>________</td>
                          <td style={{...tdStyle, paddingTop:"8px"}}>________</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:"#f9fafb", borderTop:"2px solid #1f2937"}}>
                      <td colSpan={4} style={{...tdStyle, fontWeight:"700", textAlign:"right", paddingTop:"6px", paddingBottom:"6px"}}>合計</td>
                      <td style={{...tdStyle, fontWeight:"700", textAlign:"right", paddingTop:"6px"}}>{items.reduce((s: number, i: any) => s + Number(i.orderAmount ?? 0), 0).toLocaleString()}</td>
                      <td colSpan={3} style={{...tdStyle, paddingTop:"6px"}}></td>
                      <td style={{...tdStyle, textAlign:"center", paddingTop:"6px"}}>____</td>
                      <td style={{...tdStyle, textAlign:"right", paddingTop:"6px"}}>________</td>
                      <td style={{...tdStyle, paddingTop:"6px"}}></td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{marginTop:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", fontSize:"11px", color:"#555"}}>
                  <div style={{border:"1px solid #e5e7eb", borderRadius:"6px", padding:"8px"}}>
                    <div style={{fontWeight:"600", marginBottom:"4px", color:"#1f2937"}}>司機備註</div>
                    <div style={{height:"40px"}}></div>
                  </div>
                  <div style={{border:"1px solid #e5e7eb", borderRadius:"6px", padding:"8px"}}>
                    <div style={{fontWeight:"600", marginBottom:"4px", color:"#1f2937"}}>管理員確認</div>
                    <div style={{height:"40px"}}></div>
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
                                <span className="font-semibold text-stone-900">{p.shippedQty} {p.unit || ""}</span>
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

              <section className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">剩貨回庫</p>
                    <p className="mt-1 text-xs text-stone-500">司機回來後先送出回庫待驗，管理端確認後才會正式加回可賣庫存。</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {returnRows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400">
                      這張派車單沒有可回庫的品項資料。
                    </div>
                  ) : (
                    returnRows.map((product) => (
                      <div key={product.productId} className="rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{product.productName}</p>
                            <p className="mt-1 text-xs text-stone-500">
                              今日派出 {product.shippedQty} {product.unit || "單位"}
                            </p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={product.shippedQty}
                            value={product.qty || ""}
                            onChange={(event) =>
                              setReturnQtyByProduct((prev) => ({
                                ...prev,
                                [product.productId]: Math.max(0, Math.min(product.shippedQty, Number(event.target.value || 0))),
                              }))
                            }
                            className="w-28 rounded-2xl bg-white text-right"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  className="mt-4 w-full bg-stone-900 text-white hover:bg-stone-800"
                  disabled={
                    returnInventory.isPending ||
                    !returnRows.some((row) => row.qty > 0)
                  }
                  onClick={() =>
                    returnInventory.mutate({
                      dispatchOrderId: dispatchId,
                      tenantId: TENANT_ID,
                      note: "管理員確認剩貨回庫",
                      items: returnRows.filter((row) => row.qty > 0).map((row) => ({ productId: row.productId, qty: row.qty })),
                    })
                  }
                >
                  {returnInventory.isPending ? "送出中..." : "送出回庫待驗"}
                </Button>
              </section>
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
                <p className="text-xs uppercase tracking-[0.28em] text-white/50">Dispatch center</p>
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
                    className="rounded-[30px] border border-stone-200/70 bg-white p-5 shadow-[0_14px_28px_rgba(120,53,15,0.05)]"
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
                          列印 / 扣庫存
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

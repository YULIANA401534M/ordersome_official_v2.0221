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
import { AlertTriangle, CheckCircle2, GitMerge, Package, Printer, Plus, RotateCcw, Route, Truck, Wallet } from "lucide-react";

function todayStr() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

function SyncDialog({ date, onClose, onSuccess }: { date: string; onClose: () => void; onSuccess: () => void }) {
  const firedRef = React.useRef(false);
  const generateDispatch = trpc.dayone.dispatch.generateDispatch.useMutation({
    onSuccess: (data) => {
      const added = (data as any).newOrdersAdded ?? 0;
      const removed = (data as any).cancelledStopsRemoved ?? 0;
      const parts: string[] = [];
      if (added > 0) parts.push(`新增 ${added} 筆訂單`);
      if (removed > 0) parts.push(`移除 ${removed} 個已取消站點`);
      if (parts.length === 0) parts.push("已是最新，無需變更");
      toast.success(`同步完成：${parts.join("、")}`);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      firedRef.current = false;
      toast.error(error.message);
    },
  });

  function handleConfirm() {
    if (firedRef.current || generateDispatch.isPending) return;
    firedRef.current = true;
    generateDispatch.mutate({ tenantId: TENANT_ID, dispatchDate: date });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>同步今日派車單</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-stone-600">
          <p>
            系統將對 <span className="font-semibold text-amber-700">{fmtDate(date)}</span> 的草稿派車單執行以下動作：
          </p>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-100 text-center text-[10px] font-bold leading-4 text-emerald-700">+</span>
              <span>將尚未排入派車的新訂單補入對應司機的派車單</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-rose-100 text-center text-[10px] font-bold leading-4 text-rose-700">−</span>
              <span>移除已取消訂單的對應站點（手動加站不受影響）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-stone-100 text-center text-[10px] font-bold leading-4 text-stone-500">×</span>
              <span>清除因取消而變成空站的草稿派車單</span>
            </li>
          </ul>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
            已列印或配送中的派車單不會被異動。同步只操作「草稿」狀態的派車單。
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button
              onClick={handleConfirm}
              disabled={generateDispatch.isPending || firedRef.current}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {generateDispatch.isPending ? "同步中..." : "確認同步"}
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
  const [pendingAmountWarning, setPendingAmountWarning] = useState<{ orderNo: string; customerName: string }[]>([]);
  // 備用箱登記
  const [extraRows, setExtraRows] = useState<{ productId: string; qty: string; note: string }[]>([{ productId: "", qty: "", note: "" }]);

  const { data: detail, isLoading } = trpc.dayone.dispatch.getDispatchDetail.useQuery(
    { id: dispatchId, tenantId: TENANT_ID },
    { enabled: !!dispatchId }
  );

  const { data: allProducts = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const { data: existingExtraItems = [] } = trpc.dayone.dispatch.getExtraItems.useQuery(
    { dispatchOrderId: dispatchId, tenantId: TENANT_ID },
    { enabled: !!dispatchId }
  );

  // 當 existingExtraItems 載入後同步到 extraRows
  React.useEffect(() => {
    if ((existingExtraItems as any[]).length > 0) {
      setExtraRows((existingExtraItems as any[]).map((r: any) => ({
        productId: String(r.productId),
        qty: String(r.qty),
        note: r.note ?? "",
      })));
    }
  }, [existingExtraItems]);

  const upsertExtraItems = trpc.dayone.dispatch.upsertExtraItems.useMutation({
    onSuccess: (data) => {
      toast.success(`備用箱已儲存，共 ${data.count} 筆`);
      utils.dayone.dispatch.getExtraItems.invalidate({ dispatchOrderId: dispatchId, tenantId: TENANT_ID });
    },
    onError: (e) => toast.error(e.message),
  });

  const markPrinted = trpc.dayone.dispatch.markPrinted.useMutation({
    onSuccess: (data) => {
      if (!data.success && data.pendingAmountOrders && data.pendingAmountOrders.length > 0) {
        // 後端攔截：有待補金額，彈確認 Dialog
        setPendingAmountWarning(data.pendingAmountOrders);
        return;
      }
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
                    onClick={() => markPrinted.mutate({ id: dispatchId, tenantId: TENANT_ID, forceOverride: false })}
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
                    <p className="mt-1 text-base font-semibold">{detail.extraBoxes ?? 0}</p>
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

              {/* 備用箱登記（草稿狀態才能編輯） */}
              {detail.status === "draft" && (
                <section className="no-print rounded-[26px] border border-sky-200 bg-sky-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-sky-900">備用箱登記</p>
                      <p className="text-xs text-sky-600 mt-0.5">倉管點完貨後填，列印時一起扣庫存</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-sky-300 text-sky-700 hover:bg-sky-100"
                      onClick={() => setExtraRows((r) => [...r, { productId: "", qty: "", note: "" }])}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />新增品項
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {extraRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px_1fr_auto] gap-2 items-center">
                        <Select value={row.productId} onValueChange={(v) => setExtraRows((rows) => rows.map((r, i) => i === idx ? { ...r, productId: v } : r))}>
                          <SelectTrigger className="rounded-2xl h-8 text-xs"><SelectValue placeholder="選商品" /></SelectTrigger>
                          <SelectContent>
                            {(allProducts as any[]).map((p: any) => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number" min={1} placeholder="箱數"
                          className="rounded-2xl h-8 text-xs text-center"
                          value={row.qty}
                          onChange={(e) => setExtraRows((rows) => rows.map((r, i) => i === idx ? { ...r, qty: e.target.value } : r))}
                        />
                        <Input
                          placeholder="備註（選填）"
                          className="rounded-2xl h-8 text-xs"
                          value={row.note}
                          onChange={(e) => setExtraRows((rows) => rows.map((r, i) => i === idx ? { ...r, note: e.target.value } : r))}
                        />
                        <button
                          type="button"
                          className="text-stone-400 hover:text-rose-500 px-1"
                          onClick={() => setExtraRows((rows) => rows.length === 1 ? [{ productId: "", qty: "", note: "" }] : rows.filter((_, i) => i !== idx))}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-sky-600 text-white hover:bg-sky-700"
                      disabled={upsertExtraItems.isPending}
                      onClick={() => {
                        const valid = extraRows.filter((r) => r.productId && Number(r.qty) > 0);
                        upsertExtraItems.mutate({
                          dispatchOrderId: dispatchId,
                          tenantId: TENANT_ID,
                          items: valid.map((r) => ({ productId: Number(r.productId), qty: Number(r.qty), note: r.note || undefined })),
                        });
                      }}
                    >
                      {upsertExtraItems.isPending ? "儲存中..." : "儲存備用箱"}
                    </Button>
                  </div>
                </section>
              )}

              {/* 備用箱唯讀顯示（已列印後） */}
              {detail.status !== "draft" && (existingExtraItems as any[]).length > 0 && (
                <section className="no-print rounded-[26px] border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-900 mb-2">備用箱（已出車）</p>
                  <div className="space-y-1.5">
                    {(existingExtraItems as any[]).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-sky-800">{r.productName}</span>
                        <span className="font-semibold text-sky-900">{Number(r.qty)} {r.unit || "箱"}{r.note ? <span className="ml-2 text-xs text-sky-500">（{r.note}）</span> : null}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
                          {fmtDate(detail.dispatchDate)}　司機：{detail.driverName}　路線：{detail.routeCode}　共 {new Set(items.map((i: any) => i.customerId)).size} 客　備用箱 {detail.extraBoxes ?? 0} 箱
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
                        {(() => {
                          // 同一個客戶的多筆訂單合併成一行（依第一筆的 stopSequence 排序）
                          const customerMap = new Map<number, {
                            customerId: number; customerName: string; customerPhone: string;
                            customerAddress: string; firstStopSeq: number;
                            totalAmt: number; isSettled: boolean; paymentStatus: string;
                            prevBoxes: number; products: Map<string, { name: string; qty: number; unit: string }>;
                            notes: string[];
                          }>();
                          for (const item of items as any[]) {
                            const cid = Number(item.customerId);
                            if (!customerMap.has(cid)) {
                              customerMap.set(cid, {
                                customerId: cid,
                                customerName: item.customerName,
                                customerPhone: item.customerPhone ?? "",
                                customerAddress: item.customerAddress ?? "",
                                firstStopSeq: Number(item.stopSequence),
                                totalAmt: 0,
                                isSettled: item.paymentStatus === "monthly" || item.paymentStatus === "weekly",
                                paymentStatus: item.paymentStatus,
                                prevBoxes: Number(item.prevBoxes ?? 0),
                                products: new Map(),
                                notes: [],
                              });
                            }
                            const entry = customerMap.get(cid)!;
                            entry.totalAmt += Number(item.orderAmount ?? 0);
                            if (item.note) entry.notes.push(item.note);
                            // 合併品項
                            const stopProds = (productsByOrder as any[]).filter((p: any) => Number(p.orderId) === Number(item.orderId));
                            for (const p of stopProds) {
                              const key = String(p.productId);
                              if (!entry.products.has(key)) {
                                entry.products.set(key, { name: p.productName, qty: 0, unit: p.unit || "" });
                              }
                              entry.products.get(key)!.qty += Number(p.shippedQty ?? 0);
                            }
                          }
                          const rows = Array.from(customerMap.values()).sort((a, b) => a.firstStopSeq - b.firstStopSeq);
                          const payLabel: Record<string, string> = { monthly: "月結", weekly: "週結" };
                          return rows.map((entry, idx) => (
                            <tr key={entry.customerId} style={{borderBottom:"1px solid #ddd", verticalAlign:"top"}}>
                              <td style={{...tdStyle, textAlign:"center", fontWeight:"700", paddingTop:"7px"}}>{idx + 1}</td>
                              <td style={{...tdStyle, fontWeight:"600", paddingTop:"7px"}}>
                                {entry.customerName}
                                {entry.customerPhone && <div style={{fontSize:"10px", color:"#666", fontWeight:"400"}}>{entry.customerPhone}</div>}
                              </td>
                              <td style={{...tdStyle, fontSize:"10px", color:"#555", paddingTop:"7px"}}>{entry.customerAddress || "—"}</td>
                              <td style={{...tdStyle, paddingTop:"5px", paddingBottom:"5px", fontSize:"11px"}}>
                                {entry.products.size > 0 ? (
                                  <div style={{display:"flex", flexWrap:"wrap", gap:"2px 8px"}}>
                                    {Array.from(entry.products.values()).map((p, pi) => (
                                      <span key={pi} style={{whiteSpace:"nowrap"}}>
                                        {p.name} <strong>{Math.round(p.qty)}</strong>{p.unit}
                                      </span>
                                    ))}
                                  </div>
                                ) : <span style={{color:"#aaa"}}>—</span>}
                              </td>
                              <td style={{...tdStyle, textAlign:"right", fontWeight:"700", paddingTop:"7px"}}>
                                {entry.isSettled ? <span style={{color:"#2563eb"}}>{payLabel[entry.paymentStatus] ?? entry.paymentStatus}</span> : entry.totalAmt.toLocaleString()}
                              </td>
                              <td style={{...tdStyle, textAlign:"right", paddingTop:"7px", color:"#16a34a"}}>
                                {entry.isSettled ? "" : "＿＿＿＿"}
                              </td>
                              <td style={{...tdStyle, textAlign:"right", paddingTop:"7px", color:"#dc2626"}}>
                                {entry.isSettled ? "" : "＿＿＿＿"}
                              </td>
                              <td style={{...tdStyle, textAlign:"center", paddingTop:"7px", color:"#666"}}>{entry.prevBoxes || "＿"}</td>
                              <td style={{...tdStyle, textAlign:"center", paddingTop:"7px", color:"#aaa"}}>＿</td>
                              <td style={{...tdStyle, paddingTop:"7px", fontSize:"10px", color:"#aaa"}}>
                                {entry.notes.join("；") || ""}
                              </td>
                            </tr>
                          ));
                        })()}
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

                    {/* 備用箱列印區塊 */}
                    {(existingExtraItems as any[]).length > 0 && (
                      <div style={{marginTop:"8px", border:"1.5px solid #0ea5e9", borderRadius:"4px", padding:"8px 12px", background:"#f0f9ff"}}>
                        <div style={{fontWeight:"700", fontSize:"11px", color:"#0369a1", marginBottom:"4px"}}>備用箱（隨車帶出）</div>
                        <div style={{display:"flex", flexWrap:"wrap", gap:"4px 16px"}}>
                          {(existingExtraItems as any[]).map((r: any) => (
                            <span key={r.id} style={{fontSize:"11px", color:"#0c4a6e"}}>
                              {r.productName} <strong>{Number(r.qty)}</strong> {r.unit || "箱"}
                              {r.note ? `（${r.note}）` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

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

                  {/* ══ PAGE 2+: 個別出貨單（同客戶合併，cut line 分隔） ══ */}
                  <div style={{pageBreakBefore:"always"}}>
                    <div style={{fontSize:"11px", color:"#888", marginBottom:"8px", textAlign:"center", letterSpacing:"0.06em"}}>
                      ── 以下為各客戶出貨單（同客戶已合併），請沿虛線裁切交給客戶 ──
                    </div>
                    {(() => {
                      // 依客戶合併：同一個 customerId 的多站合為一張出貨單
                      type MergedSlip = {
                        customerId: number;
                        customerName: string;
                        customerPhone: string | null;
                        customerAddress: string | null;
                        paymentStatus: string;
                        prevBoxes: number;
                        deliverBoxes: number;
                        totalAmt: number;
                        stopNos: number[];
                        products: { productName: string; unit: string; qty: number; unitPrice: number | null }[];
                      };
                      const slipMap = new Map<number, MergedSlip>();
                      // preserve insertion order (司機站序)
                      const slipOrder: number[] = [];
                      for (const item of items) {
                        const cid = Number(item.customerId);
                        if (!slipMap.has(cid)) {
                          slipMap.set(cid, {
                            customerId: cid,
                            customerName: item.customerName,
                            customerPhone: item.customerPhone ?? null,
                            customerAddress: item.customerAddress ?? null,
                            paymentStatus: item.paymentStatus,
                            prevBoxes: Number(item.prevBoxes ?? 0),
                            deliverBoxes: Number(item.deliverBoxes ?? 0),
                            totalAmt: Number(item.orderAmount ?? 0),
                            stopNos: [item.stopSequence],
                            products: [],
                          });
                          slipOrder.push(cid);
                        } else {
                          const s = slipMap.get(cid)!;
                          s.stopNos.push(item.stopSequence);
                          s.deliverBoxes += Number(item.deliverBoxes ?? 0);
                          s.totalAmt += Number(item.orderAmount ?? 0);
                        }
                        // merge products: sum qty for same productId
                        const stopProducts = productsByOrder.filter((p: any) => Number(p.orderId) === Number(item.orderId));
                        for (const p of stopProducts) {
                          const slip = slipMap.get(cid)!;
                          const existing = slip.products.find((x) => x.productName === p.productName);
                          if (existing) {
                            existing.qty += Number(p.shippedQty ?? 0);
                          } else {
                            slip.products.push({
                              productName: p.productName,
                              unit: p.unit || "",
                              qty: Number(p.shippedQty ?? 0),
                              unitPrice: p.unitPrice != null ? Number(p.unitPrice) : null,
                            });
                          }
                        }
                      }
                      return slipOrder.map((cid, idx) => {
                        const slip = slipMap.get(cid)!;
                        const isMonthly = slip.paymentStatus === "monthly";
                        const isWeekly = slip.paymentStatus === "weekly";
                        const isCash = !isMonthly && !isWeekly;
                        const slipTotal = slip.products.reduce((s, p) =>
                          s + (p.unitPrice != null ? p.qty * p.unitPrice : 0), 0);
                        const displayTotal = slipTotal || slip.totalAmt;
                        const stopLabel = slip.stopNos.length > 1
                          ? `站 ${slip.stopNos.join("+")} (合併)`
                          : `站 ${slip.stopNos[0]}`;
                        return (
                          <div key={cid} style={{pageBreakInside:"avoid"}}>
                            {idx > 0 && (
                              <div style={{borderTop:"1.5px dashed #aaa", margin:"6px 0", position:"relative"}}>
                                <span style={{position:"absolute", top:"-8px", left:"50%", transform:"translateX(-50%)", background:"white", padding:"0 8px", fontSize:"10px", color:"#aaa"}}>✂</span>
                              </div>
                            )}
                            <div style={{border:"1.5px solid #aaa", borderRadius:"4px", padding:"10px 14px", marginBottom:"6px"}}>
                              {/* Slip header */}
                              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"2px solid #111", paddingBottom:"6px", marginBottom:"8px"}}>
                                <div>
                                  <div style={{fontSize:"15px", fontWeight:"800", letterSpacing:"0.05em"}}>大永蛋行　出貨單</div>
                                  <div style={{fontSize:"10px", color:"#666", marginTop:"1px"}}>
                                    第一聯（白）存根　第二聯（粉）客戶　第三聯（黃）收款
                                  </div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontSize:"11px", color:"#888"}}>路線 {detail.routeCode}　{fmtDate(detail.dispatchDate)}</div>
                                  <div style={{fontSize:"14px", fontWeight:"700", letterSpacing:"0.08em", color:"#111"}}>{stopLabel}</div>
                                </div>
                              </div>
                              {/* Customer info */}
                              <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:"4px 12px", marginBottom:"8px", fontSize:"12px"}}>
                                <span style={{color:"#666", whiteSpace:"nowrap"}}>訂購人</span>
                                <span style={{fontWeight:"700", fontSize:"14px"}}>{slip.customerName}</span>
                                {slip.customerPhone && <>
                                  <span style={{color:"#666"}}>電話</span>
                                  <span>{slip.customerPhone}</span>
                                </>}
                                {slip.customerAddress && <>
                                  <span style={{color:"#666", whiteSpace:"nowrap"}}>地址</span>
                                  <span style={{fontSize:"11px", color:"#444"}}>{slip.customerAddress}</span>
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
                                  {slip.products.length > 0 ? slip.products.map((p, pi) => {
                                    const lineAmt = p.unitPrice != null ? Math.round(p.qty * p.unitPrice) : null;
                                    return (
                                      <tr key={pi} style={{borderBottom:"1px solid #eee"}}>
                                        <td style={{padding:"5px 6px"}}>{p.productName}</td>
                                        <td style={{padding:"5px 6px", textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{Math.round(p.qty)} {p.unit}</td>
                                        <td style={{padding:"5px 6px", textAlign:"right", color:"#555", fontVariantNumeric:"tabular-nums"}}>
                                          {p.unitPrice != null ? p.unitPrice.toLocaleString() : "—"}
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
                              {/* Bottom: boxes + payment + total */}
                              <div style={{borderTop:"1.5px solid #aaa", paddingTop:"7px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:"0 16px", alignItems:"center"}}>
                                <div style={{display:"grid", gridTemplateColumns:"repeat(4,52px)", gap:"4px", textAlign:"center"}}>
                                  {([
                                    {label:"前　箱", value: String(slip.prevBoxes)},
                                    {label:"入　箱", value: String(slip.deliverBoxes)},
                                    {label:"回　箱", value: ""},
                                    {label:"餘　箱", value: ""},
                                  ] as {label: string; value: string}[]).map(({label, value}) => (
                                    <div key={label} style={{border:"1px solid #ccc", borderRadius:"2px", padding:"3px 2px"}}>
                                      <div style={{fontSize:"9px", color:"#777", lineHeight:"1.2"}}>{label}</div>
                                      <div style={{fontSize:"13px", fontWeight:"700", minHeight:"18px", borderBottom:"1px solid #aaa", marginTop:"1px", paddingBottom:"1px"}}>{value}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{fontSize:"11px"}}>
                                  <div style={{display:"flex", gap:"12px", marginBottom:"4px"}}>
                                    <span>□ 已收款</span>
                                    <span>□ 未收款</span>
                                    {!isCash && <span style={{color:"#2563eb", fontWeight:"700"}}>{isMonthly ? "月結" : "週結"}</span>}
                                  </div>
                                  <div style={{color:"#888", fontSize:"10px"}}>備註：＿＿＿＿＿＿＿＿＿</div>
                                </div>
                                <div style={{textAlign:"right", borderLeft:"1px solid #ddd", paddingLeft:"12px"}}>
                                  <div style={{fontSize:"10px", color:"#666", marginBottom:"2px"}}>總金額</div>
                                  <div style={{fontSize:"20px", fontWeight:"800", fontVariantNumeric:"tabular-nums", letterSpacing:"0.02em"}}>
                                    {displayTotal.toLocaleString()}
                                  </div>
                                  <div style={{fontSize:"10px", color:"#888", marginTop:"4px"}}>客戶簽收：＿＿＿＿＿</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
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

        {/* 待補金額攔截 Dialog */}
        <Dialog open={pendingAmountWarning.length > 0} onOpenChange={(v) => { if (!v) setPendingAmountWarning([]); }}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                有訂單金額尚未補填
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-stone-600">
              <p>以下訂單金額為 $0，請先補填後再列印撿貨單：</p>
              <div className="rounded-2xl bg-amber-50 px-3 py-2 space-y-1">
                {pendingAmountWarning.map((o, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{o.customerName}</span>
                    <span className="font-mono text-stone-500">{o.orderNo}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400">補填路徑：訂單管理 → 找到該筆 → 展開 → 補填金額 / 修改數量</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setPendingAmountWarning([])}>返回補填</Button>
              <Button
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={markPrinted.isPending}
                onClick={() => {
                  setPendingAmountWarning([]);
                  markPrinted.mutate({ id: dispatchId, tenantId: TENANT_ID, forceOverride: true });
                }}
              >
                {markPrinted.isPending ? "處理中..." : "忽略並強制列印"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}

export default function DayoneDispatch() {
  const [date, setDate] = useState(todayStr());
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [mergingDriverId, setMergingDriverId] = useState<number | null>(null);

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

  // 偵測同司機多張草稿
  const draftsByDriver = useMemo(() => {
    const draftDispatches = (dispatches as any[]).filter((d: any) => d.status === "draft");
    const map = new Map<number, any[]>();
    for (const d of draftDispatches) {
      const did = Number(d.driverId);
      if (!map.has(did)) map.set(did, []);
      map.get(did)!.push(d);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 1);
  }, [dispatches]);

  const setOrderDriver = trpc.dayone.orders.setDriver.useMutation({
    onSuccess: () => {
      toast.success("司機已指派");
      setAssigningId(null);
      setAssignDriverId("");
      utils.dayone.orders.list.invalidate();
    },
    onError: () => toast.error("指派失敗，請重試"),
  });

  const mergeDrafts = trpc.dayone.dispatch.mergeDraftDispatches.useMutation({
    onSuccess: (data) => {
      if (data.merged) {
        toast.success(`已合併 ${data.mergedCount} 張草稿派車單`);
      }
      setMergingDriverId(null);
      refresh();
    },
    onError: (e) => toast.error(e.message),
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
                <Button className="bg-white text-stone-900 hover:bg-white/90" onClick={() => setShowSyncDialog(true)}>
                  <Route className="mr-2 h-4 w-4" />
                  同步今日派車
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
                {dispatches.reduce((sum: number, dispatch: any) => sum + Number(dispatch.extraBoxes ?? 0), 0)}
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

          {/* 同司機多張草稿合併提示 */}
          {draftsByDriver.length > 0 && (
            <section className="rounded-[28px] border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <GitMerge className="h-4 w-4 text-sky-600 shrink-0" />
                <p className="text-sm font-semibold text-sky-800">發現可合併的草稿派車單</p>
              </div>
              <div className="space-y-2">
                {draftsByDriver.map(([driverId, list]) => (
                  <div key={driverId} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-stone-900">{list[0].driverName}</span>
                      <span className="ml-2 text-xs text-stone-400">
                        {list.length} 張草稿（共 {list.reduce((s: number, d: any) => s + Number(d.totalStops ?? 0), 0)} 站）
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 bg-sky-600 text-white hover:bg-sky-700 gap-1.5 text-xs"
                      disabled={mergingDriverId === driverId && mergeDrafts.isPending}
                      onClick={() => {
                        setMergingDriverId(driverId);
                        mergeDrafts.mutate({ tenantId: TENANT_ID, driverId, dispatchDate: date });
                      }}
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                      {mergingDriverId === driverId && mergeDrafts.isPending ? "合併中..." : "合併"}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-sky-600">合併後站點全部保留，以最早建立的派車單為主。</p>
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
              <Button className="mt-5 bg-amber-600 text-white hover:bg-amber-700" onClick={() => setShowSyncDialog(true)}>
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

      {showSyncDialog && (
        <SyncDialog date={date} onClose={() => setShowSyncDialog(false)} onSuccess={refresh} />
      )}

      {detailId !== null && <DispatchDetailSheet dispatchId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

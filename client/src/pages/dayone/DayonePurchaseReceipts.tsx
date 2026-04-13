import { useState, useRef, useEffect, useCallback } from "react";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}
function fmtMoney(v: number | string | null | undefined) {
  return `$${Number(v ?? 0).toLocaleString("zh-TW")}`;
}
function nowLocalDatetime() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending: { label: "待簽名", cls: "bg-orange-100 text-orange-700" },
  signed:  { label: "已簽名", cls: "bg-green-100 text-green-700" },
  anomaly: { label: "異常",   cls: "bg-red-100 text-red-700" },
};

// ── AnomalyDialog ──────────────────────────────────────────────────────────

function AnomalyDialog({ receipt, onClose, onSuccess }: { receipt: any; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote] = useState("");
  const mut = trpc.dayone.purchaseReceipt.markAnomaly.useMutation({
    onSuccess: () => { toast.success("已標記異常"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>標記異常</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-1">
          <Textarea placeholder="請描述異常情況..." value={note}
            onChange={(e) => setNote(e.target.value)} rows={3} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button size="sm" variant="destructive" disabled={!note || mut.isPending}
              onClick={() => mut.mutate({ id: receipt.id, tenantId: TENANT_ID, anomalyNote: note })}>
              {mut.isPending ? "送出中..." : "確認異常"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── DetailDialog ───────────────────────────────────────────────────────────

function DetailDialog({ receipt, onClose }: { receipt: any; onClose: () => void }) {
  const items = typeof receipt.items === "string" ? JSON.parse(receipt.items) : (receipt.items ?? []);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>進貨單詳情 #{receipt.id}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-400">供應商</p><p className="font-medium">{receipt.supplierName}</p></div>
            <div><p className="text-xs text-gray-400">司機</p><p className="font-medium">{receipt.driverName}</p></div>
            <div><p className="text-xs text-gray-400">收貨時間</p><p>{fmtDate(receipt.receiptDate)}</p></div>
            <div><p className="text-xs text-gray-400">車牌</p><p>{receipt.licensePlate ?? "-"}</p></div>
            <div><p className="text-xs text-gray-400">批次號</p><p>{receipt.batchNo ?? "-"}</p></div>
            <div><p className="text-xs text-gray-400">狀態</p>
              <Badge className={`${STATUS_CFG[receipt.status]?.cls ?? ""} border-0 text-xs`}>
                {STATUS_CFG[receipt.status]?.label ?? receipt.status}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">品項明細</p>
            <table className="w-full text-xs border rounded overflow-hidden">
              <thead><tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">品項</th>
                <th className="text-right px-3 py-2">數量</th>
                <th className="text-right px-3 py-2">單價</th>
                <th className="text-right px-3 py-2">小計</th>
              </tr></thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="px-3 py-1.5">{item.name}</td>
                    <td className="px-3 py-1.5 text-right">{item.qty}</td>
                    <td className="px-3 py-1.5 text-right">{fmtMoney(item.unitPrice)}</td>
                    <td className="px-3 py-1.5 text-right">{fmtMoney(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-semibold">
                <td colSpan={2} className="px-3 py-2">合計</td>
                <td className="px-3 py-2 text-right">{receipt.totalQty} 箱</td>
                <td className="px-3 py-2 text-right">{fmtMoney(receipt.totalAmount)}</td>
              </tr></tfoot>
            </table>
          </div>

          {receipt.anomalyNote && (
            <div className="bg-red-50 rounded p-3 text-red-700 text-xs">
              <p className="font-medium mb-1">異常說明</p>
              <p>{receipt.anomalyNote}</p>
            </div>
          )}

          {receipt.supplierSignatureUrl && (
            <div>
              <p className="text-xs text-gray-400 mb-2">供應商簽名</p>
              <img src={receipt.supplierSignatureUrl} alt="簽名" className="border rounded max-h-32 bg-white" />
              <p className="text-xs text-gray-400 mt-1">{fmtDate(receipt.signedAt)}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── SignatureSheet ─────────────────────────────────────────────────────────

function SignatureSheet({
  receiptId,
  items,
  onClose,
  onSuccess,
}: {
  receiptId: number;
  items: { name: string; qty: number }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const sign = trpc.dayone.purchaseReceipt.sign.useMutation({
    onSuccess: () => {
      toast.success("簽收完成，庫存已更新，應付帳款已建立");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Check if canvas is blank
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasContent = data.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasContent) { toast.error("請先簽名"); return; }
    const signatureBase64 = canvas.toDataURL("image/png");
    sign.mutate({ id: receiptId, tenantId: TENANT_ID, signatureBase64 });
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
        <SheetHeader className="px-5 pt-4 pb-3 border-b">
          <SheetTitle>供應商簽名確認</SheetTitle>
        </SheetHeader>

        {/* 品項摘要 */}
        <div className="px-5 py-3 bg-amber-50 border-b">
          <p className="text-xs font-medium text-amber-800 mb-1">品項確認</p>
          <div className="flex flex-wrap gap-2">
            {items.filter(i => i.qty > 0).map((item, idx) => (
              <span key={idx} className="text-xs bg-white border border-amber-200 rounded-full px-2 py-0.5 text-amber-900">
                {item.name} × {item.qty}
              </span>
            ))}
          </div>
        </div>

        {/* 簽名板 */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 gap-3">
          <p className="text-sm text-gray-500">請供應商在下方簽名</p>
          <div className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={260}
              className="w-full touch-none"
              style={{ height: "min(260px, 40vw)" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <Button variant="outline" size="sm" onClick={clearCanvas}>清除重簽</Button>
        </div>

        {/* 底部按鈕 */}
        <div className="px-5 pb-6 pt-2 border-t">
          <Button className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            disabled={sign.isPending} onClick={handleSubmit}>
            {sign.isPending ? "提交中..." : "確認簽名並提交"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── CreateDialog ───────────────────────────────────────────────────────────

function CreateDialog({ onClose, onSignNeeded }: {
  onClose: () => void;
  onSignNeeded: (receiptId: number, items: { name: string; qty: number }[]) => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [receiptDate, setReceiptDate] = useState(nowLocalDatetime());
  const [licensePlate, setLicensePlate] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [anomalyNote, setAnomalyNote] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [prices, setPrices] = useState<Record<number, number>>({});

  const { data: suppliers } = trpc.dayone.suppliers.list.useQuery({ tenantId: TENANT_ID });
  const { data: products } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });
  const { data: supplierPrices } = trpc.dayone.ap.supplierPriceList.useQuery(
    { tenantId: TENANT_ID, supplierId: Number(supplierId) },
    { enabled: !!supplierId }
  );

  // Pre-fill prices from supplier prices when supplier changes
  useEffect(() => {
    if (!products || !supplierPrices) return;
    const priceMap: Record<number, number> = {};
    for (const sp of supplierPrices as any[]) {
      priceMap[sp.productId] = Number(sp.price);
    }
    // Fall back to product price
    for (const p of products as any[]) {
      if (!priceMap[p.id]) priceMap[p.id] = Number(p.price ?? 0);
    }
    setPrices(priceMap);
  }, [supplierPrices, products]);

  const create = trpc.dayone.purchaseReceipt.create.useMutation({
    onSuccess: (data) => {
      const itemsForSign = (products as any[] ?? [])
        .filter((p: any) => (quantities[p.id] ?? 0) > 0)
        .map((p: any) => ({ name: p.name, qty: quantities[p.id] }));
      onClose();
      onSignNeeded(data.id, itemsForSign);
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit() {
    if (!supplierId) { toast.error("請選擇供應商"); return; }
    const items = (products as any[] ?? [])
      .filter((p: any) => (quantities[p.id] ?? 0) > 0)
      .map((p: any) => ({
        productId: p.id,
        name: p.name,
        qty: quantities[p.id],
        unitPrice: prices[p.id] ?? 0,
      }));
    if (!items.length) { toast.error("請至少選擇一個品項"); return; }

    create.mutate({
      tenantId: TENANT_ID,
      supplierId: Number(supplierId),
      receiptDate,
      licensePlate,
      batchNo: batchNo || undefined,
      items,
      anomalyNote: anomalyNote || undefined,
    });
  }

  function adjustQty(productId: number, delta: number) {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] ?? 0) + delta) }));
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>司機收貨登記</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          {/* 供應商 */}
          <div>
            <label className="text-sm font-medium mb-1 block">供應商 *</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="選擇供應商..." /></SelectTrigger>
              <SelectContent>
                {(suppliers as any[] ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 收貨時間 */}
          <div>
            <label className="text-sm font-medium mb-1 block">收貨時間</label>
            <Input type="datetime-local" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
          </div>
          {/* 車牌 */}
          <div>
            <label className="text-sm font-medium mb-1 block">車牌</label>
            <Input placeholder="例：ABC-1234" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
          </div>
          {/* 批次號 */}
          <div>
            <label className="text-sm font-medium mb-1 block">批次號（選填）</label>
            <Input placeholder="批次號" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
          </div>

          {/* 品項 Stepper */}
          <div>
            <label className="text-sm font-medium mb-2 block">品項數量 *</label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(products as any[] ?? []).map((p: any) => {
                const qty = quantities[p.id] ?? 0;
                const hasQty = qty > 0;
                return (
                  <div key={p.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${hasQty ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${hasQty ? "text-amber-900" : "text-gray-500"}`}>{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-400">單價：</span>
                        <input
                          type="number"
                          className="text-xs w-16 border rounded px-1 py-0.5 bg-white"
                          value={prices[p.id] ?? ""}
                          onChange={(e) => setPrices(prev => ({ ...prev, [p.id]: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button"
                        className="w-11 h-11 rounded-lg border border-gray-300 bg-white text-lg font-bold text-gray-600 hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center"
                        onClick={() => adjustQty(p.id, -1)}>－</button>
                      <span className={`w-8 text-center text-lg font-bold ${hasQty ? "text-amber-700" : "text-gray-400"}`}>{qty}</span>
                      <button type="button"
                        className="w-11 h-11 rounded-lg border border-amber-400 bg-amber-50 text-lg font-bold text-amber-700 hover:bg-amber-100 active:bg-amber-200 flex items-center justify-center"
                        onClick={() => adjustQty(p.id, 1)}>＋</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 異常備註 */}
          <div>
            <label className="text-sm font-medium mb-1 block">異常備註（選填）</label>
            <Textarea placeholder="如有異常請說明..." value={anomalyNote}
              onChange={(e) => setAnomalyNote(e.target.value)} rows={2} />
          </div>

          {/* 提交 */}
          <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending ? "建立中..." : "確認並進入簽名"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function DayonePurchaseReceipts() {
  const [supplierId, setSupplierId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [signTarget, setSignTarget] = useState<{ id: number; items: { name: string; qty: number }[] } | null>(null);
  const [anomalyTarget, setAnomalyTarget] = useState<any>(null);
  const [detailTarget, setDetailTarget] = useState<any>(null);

  const { data: suppliers } = trpc.dayone.suppliers.list.useQuery({ tenantId: TENANT_ID });
  const { data: receipts = [], isLoading, refetch } = trpc.dayone.purchaseReceipt.list.useQuery({
    tenantId: TENANT_ID,
    status: status !== "all" ? status : undefined,
    supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return (
    <DayoneLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* 標題 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">進貨簽收</h1>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={() => setShowCreate(true)}>
            ＋ 司機收貨登記
          </Button>
        </div>

        {/* 篩選 */}
        <div className="flex flex-wrap gap-3">
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="w-44"><SelectValue placeholder="所有供應商" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有供應商</SelectItem>
              {(suppliers as any[] ?? []).map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="全部狀態" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="pending">待簽名</SelectItem>
              <SelectItem value="signed">已簽名</SelectItem>
              <SelectItem value="anomaly">異常</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div>

        {/* 桌面表格 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-7 w-7 rounded-full border-b-2 border-amber-500" />
          </div>
        ) : !(receipts as any[]).length ? (
          <Card><CardContent className="py-12 text-center text-gray-400">無進貨記錄</CardContent></Card>
        ) : (
          <>
            <div className="hidden md:block rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 text-gray-600 border-b">
                    <th className="text-left px-4 py-3 font-medium">日期</th>
                    <th className="text-left px-4 py-3 font-medium">供應商</th>
                    <th className="text-left px-4 py-3 font-medium">司機</th>
                    <th className="text-left px-4 py-3 font-medium">車牌</th>
                    <th className="text-left px-4 py-3 font-medium">批次號</th>
                    <th className="text-right px-4 py-3 font-medium">總數量</th>
                    <th className="text-right px-4 py-3 font-medium">總金額</th>
                    <th className="text-center px-4 py-3 font-medium">狀態</th>
                    <th className="text-center px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(receipts as any[]).map((r: any) => {
                    const sc = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{fmtDate(r.receiptDate)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.supplierName}</td>
                        <td className="px-4 py-3 text-gray-600">{r.driverName}</td>
                        <td className="px-4 py-3 text-gray-500">{r.licensePlate ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.batchNo ?? "-"}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{r.totalQty} 箱</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.totalAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => setDetailTarget(r)}>查看</Button>
                            {r.status === "pending" && (
                              <Button size="sm" variant="ghost" className="text-xs h-7 text-red-600 hover:text-red-700"
                                onClick={() => setAnomalyTarget(r)}>異常</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 手機卡片 */}
            <div className="md:hidden space-y-3">
              {(receipts as any[]).map((r: any) => {
                const sc = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
                return (
                  <Card key={r.id} className={r.status === "anomaly" ? "border-l-4 border-l-red-500" : ""}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{r.supplierName}</p>
                          <p className="text-xs text-gray-400">{fmtDate(r.receiptDate)} · {r.driverName}</p>
                        </div>
                        <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-xs text-gray-400">總數量</p><p className="font-medium">{r.totalQty} 箱</p></div>
                        <div><p className="text-xs text-gray-400">總金額</p><p className="font-medium">{fmtMoney(r.totalAmount)}</p></div>
                        {r.licensePlate && <div><p className="text-xs text-gray-400">車牌</p><p>{r.licensePlate}</p></div>}
                        {r.batchNo && <div><p className="text-xs text-gray-400">批次號</p><p className="font-mono text-xs">{r.batchNo}</p></div>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1"
                          onClick={() => setDetailTarget(r)}>查看詳情</Button>
                        {r.status === "pending" && (
                          <Button size="sm" variant="ghost" className="text-red-600"
                            onClick={() => setAnomalyTarget(r)}>標記異常</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dialogs / Sheets */}
      {showCreate && (
        <CreateDialog
          onClose={() => setShowCreate(false)}
          onSignNeeded={(id, items) => setSignTarget({ id, items })}
        />
      )}
      {signTarget && (
        <SignatureSheet
          receiptId={signTarget.id}
          items={signTarget.items}
          onClose={() => setSignTarget(null)}
          onSuccess={() => refetch()}
        />
      )}
      {anomalyTarget && (
        <AnomalyDialog
          receipt={anomalyTarget}
          onClose={() => setAnomalyTarget(null)}
          onSuccess={() => refetch()}
        />
      )}
      {detailTarget && (
        <DetailDialog
          receipt={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </DayoneLayout>
  );
}

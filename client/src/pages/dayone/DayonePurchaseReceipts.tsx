import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ReceiptItem = {
  productId?: number;
  name: string;
  qty: number;
  unitPrice: number;
};

type ReceiptMeta = {
  supplierName: string;
  batchNo: string;
  licensePlate: string;
  receiptDate: string;
};

type ReceiptRecord = {
  id: number;
  supplierName: string;
  driverName: string;
  receiptDate: string;
  licensePlate?: string | null;
  batchNo?: string | null;
  totalQty: number;
  totalAmount: number;
  status: string;
  anomalyNote?: string | null;
  supplierSignatureUrl?: string | null;
  signedAt?: string | null;
  items: string | ReceiptItem[];
};

type PayableRecord = {
  id: number;
  supplierId: number;
  supplierName: string;
  purchaseReceiptId?: number | null;
  amount: number;
  paidAmount: number;
  dueDate?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  status: string;
  adminNote?: string | null;
};

function fmtDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-TW");
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-TW");
}

function fmtMoney(value: number | string | null | undefined) {
  return `NT$ ${Number(value ?? 0).toLocaleString("zh-TW")}`;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function nowLocalDatetime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function parseItems(raw: ReceiptRecord["items"]) {
  if (Array.isArray(raw)) return raw as ReceiptItem[];
  try {
    return JSON.parse(raw ?? "[]") as ReceiptItem[];
  } catch {
    return [];
  }
}

const payableStatusTone: Record<string, { label: string; className: string }> = {
  unpaid: { label: "未付款", className: "bg-stone-100 text-stone-700" },
  partial: { label: "部分付款", className: "bg-amber-100 text-amber-700" },
  paid: { label: "已付款", className: "bg-emerald-100 text-emerald-700" },
};

const receiptStatusTone: Record<string, { label: string; className: string }> = {
  pending: { label: "待簽收", className: "bg-amber-100 text-amber-700" },
  signed: { label: "待入倉", className: "bg-sky-100 text-sky-700" },
  warehoused: { label: "已入倉", className: "bg-emerald-100 text-emerald-700" },
  anomaly: { label: "異常", className: "bg-red-100 text-red-700" },
};

function ReceiptSummaryDialog({
  data,
  onClose,
}: {
  data: ReceiptMeta & { items: ReceiptItem[]; signatureUrl: string };
  onClose: () => void;
}) {
  const totalQty = data.items.reduce((sum, item) => sum + Number(item.qty), 0);
  const totalAmount = data.items.reduce((sum, item) => sum + Number(item.qty) * Number(item.unitPrice), 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>進貨簽收完成</DialogTitle>
        </DialogHeader>

        <div id="purchase-receipt-print-area" className="space-y-5 text-sm">
          <div className="rounded-3xl border border-amber-100 bg-amber-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">簽收摘要</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-stone-500">供應商</p>
                <p className="mt-1 font-semibold text-stone-900">{data.supplierName}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">收貨時間</p>
                <p className="mt-1 text-stone-700">{fmtDateTime(data.receiptDate)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">車牌</p>
                <p className="mt-1 text-stone-700">{data.licensePlate || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">批次號</p>
                <p className="mt-1 text-stone-700">{data.batchNo || "-"}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">品項</th>
                  <th className="px-4 py-3 text-right font-medium">數量</th>
                  <th className="px-4 py-3 text-right font-medium">單價</th>
                  <th className="px-4 py-3 text-right font-medium">小計</th>
                </tr>
              </thead>
              <tbody>
                {data.items
                  .filter((item) => Number(item.qty) > 0)
                  .map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="border-t border-stone-200">
                      <td className="px-4 py-3 text-stone-900">{item.name}</td>
                      <td className="px-4 py-3 text-right text-stone-700">{item.qty} 箱</td>
                      <td className="px-4 py-3 text-right text-stone-700">{fmtMoney(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">
                        {fmtMoney(Number(item.qty) * Number(item.unitPrice))}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-stone-50 font-semibold text-stone-900">
                <tr>
                  <td className="px-4 py-3">合計</td>
                  <td className="px-4 py-3 text-right">{totalQty} 箱</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">{fmtMoney(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {data.signatureUrl ? (
            <div className="rounded-3xl border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs text-stone-500">供應商簽名</p>
              <img src={data.signatureUrl} alt="供應商簽名" className="mt-3 max-h-32 rounded-2xl border bg-white" />
            </div>
          ) : null}
        </div>

        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #purchase-receipt-print-area,
            #purchase-receipt-print-area * {
              visibility: visible;
            }
            #purchase-receipt-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .purchase-receipt-no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="purchase-receipt-no-print flex gap-2">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => window.print()}>
            列印收貨單
          </Button>
          <Button className="flex-1 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={onClose}>
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnomalyDialog({
  receipt,
  onClose,
  onSuccess,
}: {
  receipt: ReceiptRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState(receipt.anomalyNote ?? "");
  const markAnomaly = trpc.dayone.purchaseReceipt.markAnomaly.useMutation({
    onSuccess: () => {
      toast.success("已標記進貨異常");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>標記異常</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {receipt.supplierName} 這張進貨單會被標記為異常，請寫下原因，方便後續追查與對帳。
          </div>
          <Textarea
            rows={4}
            placeholder="例如：到貨破損、數量不符、簽名補件中..."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="destructive"
              className="rounded-2xl"
              disabled={!note.trim() || markAnomaly.isPending}
              onClick={() =>
                markAnomaly.mutate({
                  id: receipt.id,
                  tenantId: TENANT_ID,
                  anomalyNote: note.trim(),
                })
              }
            >
              {markAnomaly.isPending ? "送出中..." : "確認標記"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReconcileAnomalyDialog({
  receipt,
  onClose,
  onSuccess,
}: {
  receipt: ReceiptRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>(
    parseItems(receipt.items).map((item) => ({
      productId: item.productId,
      name: item.name,
      qty: Number(item.qty ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
    }))
  );
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const reconcile = trpc.dayone.purchaseReceipt.reconcileAnomaly.useMutation({
    onSuccess: () => {
      toast.success("差異對帳已回寫，單據已退回待簽收");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>差異對帳</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {receipt.supplierName} 的異常簽收單會先回到待簽收，更新後的明細會成為重新簽收與後續 AP 建立基準。
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_110px_130px_84px]">
                <Select
                  value={item.productId ? String(item.productId) : ""}
                  onValueChange={(value) => {
                    const product = (products as any[]).find((row: any) => String(row.id) === value);
                    setItems((prev) =>
                      prev.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              productId: Number(value),
                              name: product?.name ?? row.name,
                            }
                          : row
                      )
                    );
                  }}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="選擇商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products as any[]).map((product: any) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, qty: Math.max(0, Number(event.target.value || 0)) } : row
                      )
                    )
                  }
                  placeholder="數量"
                />

                <Input
                  type="number"
                  min={0}
                  value={item.unitPrice}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, unitPrice: Math.max(0, Number(event.target.value || 0)) } : row
                      )
                    )
                  }
                  placeholder="單價"
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setItems((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                  disabled={items.length === 1}
                >
                  刪除
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => setItems((prev) => [...prev, { productId: undefined, name: "", qty: 0, unitPrice: 0 }])}
          >
            新增品項
          </Button>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">對帳說明</label>
            <Textarea
              rows={4}
              placeholder="例如：補單 2 箱、破損 1 箱已扣回、改以現場實點數量重開待簽收"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              取消
            </Button>
            <Button
              className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={reconcile.isPending || !note.trim()}
              onClick={() => {
                const validItems = items.filter(
                  (item) => item.productId && Number(item.qty) > 0 && Number(item.unitPrice) >= 0
                );
                if (!validItems.length) {
                  toast.error("至少要保留一筆對帳後的有效品項");
                  return;
                }
                reconcile.mutate({
                  id: receipt.id,
                  tenantId: TENANT_ID,
                  reconcileNote: note.trim(),
                  items: validItems.map((item) => ({
                    productId: Number(item.productId),
                    name: item.name,
                    qty: Number(item.qty),
                    unitPrice: Number(item.unitPrice),
                  })),
                });
              }}
            >
              {reconcile.isPending ? "回寫中..." : "確認對帳"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveWarehouseDialog({
  receipt,
  onClose,
  onSuccess,
}: {
  receipt: ReceiptRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");

  const receiveToWarehouse = trpc.dayone.purchaseReceipt.receiveToWarehouse.useMutation({
    onSuccess: () => {
      toast.success("已確認入倉，可賣庫存已更新");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>確認入倉</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            這筆進貨已完成供應商簽名，確認入倉後才會正式加進大永可賣庫存。
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">{receipt.supplierName}</p>
            <p className="mt-1">進貨時間：{fmtDateTime(receipt.receiptDate)}</p>
            <p className="mt-1">總數量：{Number(receipt.totalQty)} 箱</p>
            <p className="mt-1">總金額：{fmtMoney(receipt.totalAmount)}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">入倉備註</label>
            <Textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：已回倉點收完成、無短少"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              取消
            </Button>
            <Button
              className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={receiveToWarehouse.isPending}
              onClick={() =>
                receiveToWarehouse.mutate({
                  id: receipt.id,
                  tenantId: TENANT_ID,
                  note: note.trim() || undefined,
                })
              }
            >
              {receiveToWarehouse.isPending ? "入倉中..." : "確認入倉"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDetailDialog({
  receipt,
  onClose,
}: {
  receipt: ReceiptRecord;
  onClose: () => void;
}) {
  const items = parseItems(receipt.items);
  const statusTone = receiptStatusTone[receipt.status] ?? receiptStatusTone.pending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>進貨單詳情 #{receipt.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-500">供應商</p>
              <p className="mt-1 font-semibold text-stone-900">{receipt.supplierName}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-500">司機</p>
              <p className="mt-1 font-semibold text-stone-900">{receipt.driverName}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-500">收貨時間</p>
              <p className="mt-1 text-stone-700">{fmtDateTime(receipt.receiptDate)}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-500">狀態</p>
              <Badge className={`mt-2 border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-500">車牌</p>
              <p className="mt-1 text-stone-700">{receipt.licensePlate || "-"}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-500">批次號</p>
              <p className="mt-1 text-stone-700">{receipt.batchNo || "-"}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">品項</th>
                  <th className="px-4 py-3 text-right font-medium">數量</th>
                  <th className="px-4 py-3 text-right font-medium">單價</th>
                  <th className="px-4 py-3 text-right font-medium">小計</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="border-t border-stone-200">
                    <td className="px-4 py-3 text-stone-900">{item.name}</td>
                    <td className="px-4 py-3 text-right text-stone-700">{item.qty} 箱</td>
                    <td className="px-4 py-3 text-right text-stone-700">{fmtMoney(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">
                      {fmtMoney(Number(item.qty) * Number(item.unitPrice))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50 font-semibold text-stone-900">
                <tr>
                  <td className="px-4 py-3">合計</td>
                  <td className="px-4 py-3 text-right">{Number(receipt.totalQty)} 箱</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">{fmtMoney(receipt.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {receipt.anomalyNote ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">異常說明</p>
              <p className="mt-2 leading-6">{receipt.anomalyNote}</p>
            </div>
          ) : null}

          {receipt.supplierSignatureUrl ? (
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs text-stone-500">供應商簽名</p>
              <img
                src={receipt.supplierSignatureUrl}
                alt="供應商簽名"
                className="mt-3 max-h-32 rounded-2xl border bg-white"
              />
              <p className="mt-2 text-xs text-stone-400">簽收時間：{fmtDateTime(receipt.signedAt)}</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectPayableDialog({
  record,
  onClose,
  onSuccess,
}: {
  record: PayableRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const remaining = Math.max(0, Number(record.amount ?? 0) - Number(record.paidAmount ?? 0));
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : "");
  const [method, setMethod] = useState<"cash" | "transfer">("transfer");
  const [note, setNote] = useState(record.adminNote ?? "");

  const markPaid = trpc.dayone.ap.markPaid.useMutation({
    onSuccess: () => {
      toast.success("AP 付款已更新");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const paidAmount = Number(amount);
    if (!paidAmount || paidAmount <= 0) {
      toast.error("請輸入本次付款金額");
      return;
    }

    markPaid.mutate({
      id: record.id,
      tenantId: TENANT_ID,
      paymentMethod: method,
      paidAmount,
      adminNote: note.trim() || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>供應商付款核銷</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-semibold text-stone-900">{record.supplierName}</p>
            <p className="mt-1 text-stone-500">
              應付 {fmtMoney(record.amount)} / 已付 {fmtMoney(record.paidAmount)} / 未付 {fmtMoney(remaining)}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              到期日 {fmtDate(record.dueDate)}
              {record.purchaseReceiptId ? ` · 簽收單 #${record.purchaseReceiptId}` : ""}
            </p>
          </div>

          <div className="flex gap-4 text-sm text-stone-700">
            {(["cash", "transfer"] as const).map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="radio"
                  className="accent-amber-600"
                  checked={method === item}
                  onChange={() => setMethod(item)}
                />
                {item === "cash" ? "現金" : "匯款"}
              </label>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">本次付款金額</label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="付款帳號、對帳說明、手動核銷原因"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" disabled={markPaid.isPending}>
              {markPaid.isPending ? "更新中..." : "確認付款"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SignatureSheet({
  receiptId,
  receiptMeta,
  items,
  onClose,
  onSuccess,
}: {
  receiptId: number;
  receiptMeta?: ReceiptMeta;
  items: ReceiptItem[];
  onClose: () => void;
  onSuccess: (signatureUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const signReceipt = trpc.dayone.purchaseReceipt.sign.useMutation({
    onSuccess: (data) => {
      toast.success("簽收完成，庫存與應付帳款已同步更新");
      onSuccess(data.supplierSignatureUrl ?? "");
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
      }
    };

    const timer = setTimeout(syncCanvasSize, 400);
    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(canvas);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const getPoint = useCallback((event: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in event) {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  function startDraw(event: React.MouseEvent | React.TouchEvent) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPoint.current = getPoint(event, canvas);
  }

  function draw(event: React.MouseEvent | React.TouchEvent) {
    event.preventDefault();
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !lastPoint.current) return;

    const nextPoint = getPoint(event, canvas);
    context.beginPath();
    context.moveTo(lastPoint.current.x, lastPoint.current.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.strokeStyle = "#1c1917";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
    lastPoint.current = nextPoint;
  }

  function endDraw(event: React.MouseEvent | React.TouchEvent) {
    event.preventDefault();
    isDrawing.current = false;
    lastPoint.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function submitSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = data.some((value, index) => index % 4 === 3 && value > 0);
    if (!hasInk) {
      toast.error("請先完成簽名");
      return;
    }

    signReceipt.mutate({
      id: receiptId,
      tenantId: TENANT_ID,
      signatureBase64: canvas.toDataURL("image/png"),
    });
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[92vh] p-0">
        <SheetHeader className="border-b border-stone-200 px-5 py-4">
          <SheetTitle>供應商簽名確認</SheetTitle>
        </SheetHeader>

        <div className="flex h-full flex-col">
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">入庫前簽名</p>
            <div className="mt-3 grid gap-2 text-sm text-stone-700 md:grid-cols-2">
              <p>供應商：{receiptMeta?.supplierName || "-"}</p>
              <p>車牌：{receiptMeta?.licensePlate || "-"}</p>
              <p>批次號：{receiptMeta?.batchNo || "-"}</p>
              <p>收貨時間：{fmtDateTime(receiptMeta?.receiptDate)}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {items
                .filter((item) => Number(item.qty) > 0)
                .map((item, index) => (
                  <span
                    key={`${item.name}-${index}`}
                    className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-amber-900"
                  >
                    {item.name} × {item.qty} 箱
                  </span>
                ))}
            </div>
          </div>

          <div className="flex-1 px-5 py-4">
            <p className="mb-3 text-sm text-stone-500">請由供應商對接人員在下方簽名，送出後才會正式入庫並建立應付帳款。</p>
            <div className="overflow-hidden rounded-[28px] border-2 border-dashed border-stone-300 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={280}
                className="block h-[min(320px,48vh)] w-full touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="rounded-2xl" onClick={clearCanvas}>
                清除重簽
              </Button>
            </div>
          </div>

          <div className="border-t border-stone-200 px-5 pb-6 pt-4">
            <Button
              className="h-12 w-full rounded-2xl bg-amber-600 text-base font-semibold text-white hover:bg-amber-700"
              disabled={signReceipt.isPending}
              onClick={submitSignature}
            >
              {signReceipt.isPending ? "簽收送出中..." : "確認簽收並入庫"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CreateReceiptDialog({
  onClose,
  onSignNeeded,
}: {
  onClose: () => void;
  onSignNeeded: (receiptId: number, meta: ReceiptMeta, items: ReceiptItem[]) => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [receiptDate, setReceiptDate] = useState(nowLocalDatetime());
  const [licensePlate, setLicensePlate] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [anomalyNote, setAnomalyNote] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [prices, setPrices] = useState<Record<number, number>>({});

  const { data: suppliers = [] } = trpc.dayone.suppliers.list.useQuery({ tenantId: TENANT_ID });
  const { data: drivers = [] } = trpc.dayone.drivers.list.useQuery({ tenantId: TENANT_ID });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });
  const { data: supplierPrices = [] } = trpc.dayone.ap.supplierPriceList.useQuery(
    { tenantId: TENANT_ID, supplierId: Number(supplierId) },
    { enabled: !!supplierId }
  );

  useEffect(() => {
    if (!products.length) return;
    const nextPrices: Record<number, number> = {};
    for (const product of products as any[]) {
      nextPrices[Number(product.id)] = Number(product.price ?? 0);
    }
    for (const sp of supplierPrices as any[]) {
      nextPrices[Number(sp.productId)] = Number(sp.price ?? 0);
    }
    setPrices(nextPrices);
  }, [products, supplierPrices]);

  const createReceipt = trpc.dayone.purchaseReceipt.create.useMutation({
    onSuccess: (data) => {
      const supplier = suppliers.find((item: any) => String(item.id) === supplierId);
      const selectedItems = (products as any[])
        .filter((product: any) => Number(quantities[Number(product.id)] ?? 0) > 0)
        .map((product: any) => ({
          name: product.name,
          qty: Number(quantities[Number(product.id)] ?? 0),
          unitPrice: Number(prices[Number(product.id)] ?? 0),
        }));

      onClose();
      onSignNeeded(Number(data.id), {
        supplierName: supplier?.name ?? "",
        batchNo,
        licensePlate,
        receiptDate,
      }, selectedItems);
    },
    onError: (error) => toast.error(error.message),
  });

  function adjustQty(productId: number, delta: number) {
    const pid = Number(productId);
    setQuantities((current) => ({
      ...current,
      [pid]: Math.max(0, Number(current[pid] ?? 0) + delta),
    }));
  }

  function handleSubmit() {
    if (!supplierId) {
      toast.error("請先選擇供應商");
      return;
    }

    if (!driverId) {
      toast.error("請先選擇大永司機");
      return;
    }

    const items = (products as any[])
      .filter((product: any) => Number(quantities[Number(product.id)] ?? 0) > 0)
      .map((product: any) => ({
        productId: Number(product.id),
        name: product.name,
        qty: Number(quantities[Number(product.id)] ?? 0),
        unitPrice: Number(prices[Number(product.id)] ?? 0),
      }));

    if (!items.length) {
      toast.error("至少要輸入一個有數量的品項");
      return;
    }

    createReceipt.mutate({
      tenantId: TENANT_ID,
      supplierId: Number(supplierId),
      driverId: driverId ? Number(driverId) : undefined,
      receiptDate,
      licensePlate,
      batchNo: batchNo || undefined,
      items,
      anomalyNote: anomalyNote || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>建立司機收貨單</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">供應商</label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="選擇供應商..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">司機</label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="選擇司機..." />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={String(driver.id)}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">收貨時間</label>
              <Input
                type="datetime-local"
                className="rounded-2xl"
                value={receiptDate}
                onChange={(event) => setReceiptDate(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">車牌</label>
              <Input
                className="rounded-2xl"
                placeholder="例如：ABC-1234"
                value={licensePlate}
                onChange={(event) => setLicensePlate(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">批次號</label>
              <Input
                className="rounded-2xl"
                placeholder="可留空"
                value={batchNo}
                onChange={(event) => setBatchNo(event.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-stone-700">收貨品項</label>
              <span className="text-xs text-stone-400">先選數量，再請供應商簽名</span>
            </div>
            <div className="space-y-3">
              {products.map((product: any) => {
                const pid = Number(product.id);
                const qty = Number(quantities[pid] ?? 0);
                const active = qty > 0;
                return (
                  <div
                    key={pid}
                    className={`rounded-[24px] border px-4 py-4 transition-colors ${
                      active ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-stone-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${active ? "text-stone-900" : "text-stone-600"}`}>
                          {product.name}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                          <span>單價</span>
                          <input
                            type="number"
                            min="0"
                            className="h-8 w-24 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700"
                            value={prices[pid] ?? ""}
                            onChange={(event) =>
                              setPrices((current) => ({
                                ...current,
                                [pid]: Number(event.target.value || 0),
                              }))
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-300 bg-white text-lg font-semibold text-stone-600"
                          onClick={() => adjustQty(pid, -1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          className={`h-10 w-16 rounded-2xl border bg-white text-center text-sm font-semibold ${
                            active ? "border-amber-300 text-amber-700" : "border-stone-200 text-stone-500"
                          }`}
                          value={qty}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [pid]: Math.max(0, Number(event.target.value || 0)),
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300 bg-amber-100 text-lg font-semibold text-amber-700"
                          onClick={() => adjustQty(pid, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea
              rows={3}
              placeholder="例如：現場有破箱、補單、批次補記..."
              value={anomalyNote}
              onChange={(event) => setAnomalyNote(event.target.value)}
            />
          </div>

          <Button
            className="h-12 w-full rounded-2xl bg-amber-600 text-base font-semibold text-white hover:bg-amber-700"
            disabled={createReceipt.isPending}
            onClick={handleSubmit}
          >
            {createReceipt.isPending ? "建立中..." : "下一步：供應商簽名"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DayonePurchaseReceipts() {
  const utils = trpc.useUtils();
  const [supplierId, setSupplierId] = useState("all");
  const [status, setStatus] = useState("all");
  const [payableStatus, setPayableStatus] = useState("open");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summaryMonth, setSummaryMonth] = useState(currentMonthValue());
  const [showCreate, setShowCreate] = useState(false);
  const [signTarget, setSignTarget] = useState<{ id: number; meta: ReceiptMeta; items: ReceiptItem[] } | null>(null);
  const [receiptSummary, setReceiptSummary] = useState<(ReceiptMeta & { items: ReceiptItem[]; signatureUrl: string }) | null>(null);
  const [anomalyTarget, setAnomalyTarget] = useState<ReceiptRecord | null>(null);
  const [reconcileTarget, setReconcileTarget] = useState<ReceiptRecord | null>(null);
  const [warehouseTarget, setWarehouseTarget] = useState<ReceiptRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<ReceiptRecord | null>(null);
  const [payableTarget, setPayableTarget] = useState<PayableRecord | null>(null);

  const { data: suppliers = [] } = trpc.dayone.suppliers.list.useQuery({ tenantId: TENANT_ID });
  const { data: receipts = [], isLoading, refetch } = trpc.dayone.purchaseReceipt.list.useQuery({
    tenantId: TENANT_ID,
    status: status !== "all" ? status : undefined,
    supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: apSummary } = trpc.dayone.ap.summary.useQuery({
    tenantId: TENANT_ID,
    supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
    month: summaryMonth,
  });
  const { data: payables = [], isLoading: payablesLoading } = trpc.dayone.ap.listPayables.useQuery({
    tenantId: TENANT_ID,
    supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
    status: payableStatus !== "all" && payableStatus !== "open" ? payableStatus : undefined,
    page: 1,
  });

  const overview = apSummary?.overview;
  const supplierSummaryRows = apSummary?.suppliers ?? [];
  const payableRows = useMemo(() => {
    const rows = payables as PayableRecord[];
    return payableStatus === "open" ? rows.filter((item) => item.status !== "paid") : rows;
  }, [payables, payableStatus]);

  const topStats = useMemo(() => {
    const totalQty = receipts.reduce((sum: number, item: any) => sum + Number(item.totalQty ?? 0), 0);
    const totalAmount = receipts.reduce((sum: number, item: any) => sum + Number(item.totalAmount ?? 0), 0);
    const pendingCount = receipts.filter((item: any) => item.status === "pending").length;
    return { totalQty, totalAmount, pendingCount };
  }, [receipts]);
  const payableStats = useMemo(() => {
    return payableRows.reduce(
      (acc, item) => {
        const unpaidAmount = Math.max(0, Number(item.amount ?? 0) - Number(item.paidAmount ?? 0));
        acc.total += Number(item.amount ?? 0);
        acc.unpaid += unpaidAmount;
        if (item.status !== "paid") acc.openCount += 1;
        return acc;
      },
      { total: 0, unpaid: 0, openCount: 0 }
    );
  }, [payableRows]);

  return (
    <DayoneLayout>
      <div className="space-y-6">
        <div className="dayone-page-header">
          <div className="min-w-0">
            <h1 className="dayone-page-title">進貨簽收</h1>
            <p className="dayone-page-subtitle">
              這裡是上游供應商進貨主線：建立收貨單、供應商簽名、入庫、同步產生應付帳款，並彙整本月供應商帳。
            </p>
          </div>
          <Button
            className="dayone-action rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => setShowCreate(true)}
          >
            新增收貨單
          </Button>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="dayone-panel rounded-[28px] border-amber-100">
            <CardContent className="pt-5">
              <p className="text-xs text-stone-500">本次查詢進貨數量</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{topStats.totalQty.toLocaleString("zh-TW")} 箱</p>
            </CardContent>
          </Card>
          <Card className="dayone-panel rounded-[28px] border-amber-100">
            <CardContent className="pt-5">
              <p className="text-xs text-stone-500">本次查詢進貨金額</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{fmtMoney(topStats.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card className="dayone-panel rounded-[28px] border-amber-100">
            <CardContent className="pt-5">
              <p className="text-xs text-stone-500">待簽收進貨單</p>
              <p className="mt-2 dayone-kpi-value text-amber-700">{topStats.pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="dayone-panel rounded-[28px] border-amber-100">
            <CardContent className="pt-5">
              <p className="text-xs text-stone-500">{summaryMonth} 應付未付</p>
              <p className="mt-2 dayone-kpi-value text-red-600">{fmtMoney(overview?.unpaidAmount)}</p>
            </CardContent>
          </Card>
        </section>

        <section className="dayone-panel rounded-[32px] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">供應商月結快照</p>
              <p className="mt-1 text-sm text-stone-500">從進貨簽收直接往下看應付帳款，方便追供應商日結與月結。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                type="month"
                value={summaryMonth}
                onChange={(event) => setSummaryMonth(event.target.value)}
                className="w-[180px] rounded-2xl"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs text-stone-500">供應商數</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{Number(overview?.supplierCount ?? 0)}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs text-stone-500">本月應付總額</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{fmtMoney(overview?.totalAmount)}</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4">
              <p className="text-xs text-emerald-600">本月已付</p>
              <p className="mt-2 dayone-kpi-value text-emerald-700">{fmtMoney(overview?.paidAmount)}</p>
            </div>
            <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-4">
              <p className="text-xs text-red-600">逾期未付筆數</p>
              <p className="mt-2 dayone-kpi-value text-red-700">{Number(overview?.overdueCount ?? 0)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {!supplierSummaryRows.length ? (
              <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-10 text-center text-stone-400">
                這個月份目前沒有供應商應付帳資料。
              </div>
            ) : (
              supplierSummaryRows.map((row: any) => (
                <div
                  key={Number(row.supplierId)}
                  className="rounded-[28px] border border-stone-200 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(120,53,15,0.05)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone-900">{row.supplierName}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        收貨期間 {fmtDate(row.firstReceiptDate)} 至 {fmtDate(row.lastReceiptDate)}
                      </p>
                    </div>
                    <Badge className="w-fit border-0 bg-amber-100 text-amber-700">
                      {Number(row.receiptCount ?? 0)} 張簽收單 / {Number(row.payableCount ?? 0)} 筆帳款
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-stone-500">應付總額</p>
                      <p className="mt-1 font-semibold text-stone-900">{fmtMoney(row.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">已付金額</p>
                      <p className="mt-1 font-semibold text-emerald-700">{fmtMoney(row.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">未付金額</p>
                      <p className="mt-1 font-semibold text-red-600">{fmtMoney(row.unpaidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">最近到期日</p>
                      <p className="mt-1 font-semibold text-stone-900">{fmtDate(row.latestDueDate)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="dayone-panel rounded-[32px] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">AP 付款工作台</p>
              <p className="mt-1 text-sm text-stone-500">
                進貨簽收後產生的應付款可以直接在這裡做付款與核銷，避免只看彙總卻沒有實際動作。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={payableStatus} onValueChange={setPayableStatus}>
                <SelectTrigger className="w-[180px] rounded-2xl">
                  <SelectValue placeholder="付款狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">只看未結清</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="unpaid">未付款</SelectItem>
                  <SelectItem value="partial">部分付款</SelectItem>
                  <SelectItem value="paid">已付款</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs text-stone-500">目前筆數</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{payableRows.length}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs text-stone-500">本批應付總額</p>
              <p className="mt-2 dayone-kpi-value text-stone-900">{fmtMoney(payableStats.total)}</p>
            </div>
            <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-4">
              <p className="text-xs text-red-600">尚未結清</p>
              <p className="mt-2 dayone-kpi-value text-red-700">{fmtMoney(payableStats.unpaid)}</p>
            </div>
          </div>

          <div className="mt-5">
            {payablesLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              </div>
            ) : !payableRows.length ? (
              <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-10 text-center text-stone-400">
                目前沒有符合條件的 AP 付款資料。
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-stone-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">供應商</th>
                        <th className="px-4 py-3 text-left font-medium">來源</th>
                        <th className="px-4 py-3 text-right font-medium">應付</th>
                        <th className="px-4 py-3 text-right font-medium">已付</th>
                        <th className="px-4 py-3 text-right font-medium">未付</th>
                        <th className="px-4 py-3 text-center font-medium">到期日</th>
                        <th className="px-4 py-3 text-center font-medium">狀態</th>
                        <th className="px-4 py-3 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payableRows.map((record) => {
                        const statusTone = payableStatusTone[record.status] ?? payableStatusTone.unpaid;
                        const unpaidAmount = Math.max(0, Number(record.amount ?? 0) - Number(record.paidAmount ?? 0));
                        return (
                          <tr key={Number(record.id)} className="border-t border-stone-200">
                            <td className="px-4 py-4">
                              <p className="font-semibold text-stone-900">{record.supplierName}</p>
                              {record.adminNote ? <p className="mt-1 text-xs text-stone-400">{record.adminNote}</p> : null}
                            </td>
                            <td className="px-4 py-4 text-stone-500">
                              {record.purchaseReceiptId ? `簽收單 #${record.purchaseReceiptId}` : "手動 AP"}
                            </td>
                            <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(record.amount)}</td>
                            <td className="px-4 py-4 text-right text-emerald-700">{fmtMoney(record.paidAmount)}</td>
                            <td className="px-4 py-4 text-right font-semibold text-red-600">{fmtMoney(unpaidAmount)}</td>
                            <td className="px-4 py-4 text-center text-stone-700">{fmtDate(record.dueDate)}</td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={`border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {unpaidAmount > 0 ? (
                                <Button
                                  size="sm"
                                  className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                                  onClick={() => setPayableTarget(record)}
                                >
                                  付款
                                </Button>
                              ) : (
                                <span className="text-xs text-stone-400">{fmtDate(record.paidAt)}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {payableRows.map((record) => {
                    const statusTone = payableStatusTone[record.status] ?? payableStatusTone.unpaid;
                    const unpaidAmount = Math.max(0, Number(record.amount ?? 0) - Number(record.paidAmount ?? 0));
                    return (
                      <article key={Number(record.id)} className="dayone-mobile-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-base font-semibold text-stone-900">{record.supplierName}</h2>
                            <p className="mt-1 text-xs text-stone-400">
                              {record.purchaseReceiptId ? `簽收單 #${record.purchaseReceiptId}` : "手動 AP"} · 到期 {fmtDate(record.dueDate)}
                            </p>
                          </div>
                          <Badge className={`border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-stone-500">應付</p>
                            <p className="mt-1 font-semibold text-stone-900">{fmtMoney(record.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">已付</p>
                            <p className="mt-1 font-semibold text-emerald-700">{fmtMoney(record.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">未付</p>
                            <p className="mt-1 font-semibold text-red-600">{fmtMoney(unpaidAmount)}</p>
                          </div>
                        </div>

                        {record.adminNote ? (
                          <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-500">{record.adminNote}</div>
                        ) : null}

                        {unpaidAmount > 0 ? (
                          <Button
                            className="mt-4 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                            onClick={() => setPayableTarget(record)}
                          >
                            付款核銷
                          </Button>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="dayone-panel rounded-[32px] p-5">
          <div className="flex flex-wrap gap-3">
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="w-[180px] rounded-2xl">
                <SelectValue placeholder="所有供應商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有供應商</SelectItem>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px] rounded-2xl">
                <SelectValue placeholder="全部狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待簽收</SelectItem>
                <SelectItem value="signed">待入倉</SelectItem>
                <SelectItem value="warehoused">已入倉</SelectItem>
                <SelectItem value="anomaly">異常</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="w-[170px] rounded-2xl"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              type="date"
              className="w-[170px] rounded-2xl"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              </div>
            ) : !receipts.length ? (
              <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">
                目前沒有符合條件的進貨簽收資料。
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-stone-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">收貨時間</th>
                        <th className="px-4 py-3 text-left font-medium">供應商</th>
                        <th className="px-4 py-3 text-left font-medium">司機</th>
                        <th className="px-4 py-3 text-left font-medium">車牌 / 批次號</th>
                        <th className="px-4 py-3 text-right font-medium">總數量</th>
                        <th className="px-4 py-3 text-right font-medium">總金額</th>
                        <th className="px-4 py-3 text-center font-medium">狀態</th>
                        <th className="px-4 py-3 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((receipt: any) => {
                        const statusTone = receiptStatusTone[receipt.status] ?? receiptStatusTone.pending;
                        return (
                          <tr key={Number(receipt.id)} className="border-t border-stone-200">
                            <td className="px-4 py-4 text-stone-700">{fmtDateTime(receipt.receiptDate)}</td>
                            <td className="px-4 py-4 font-semibold text-stone-900">{receipt.supplierName}</td>
                            <td className="px-4 py-4 text-stone-700">{receipt.driverName}</td>
                            <td className="px-4 py-4 text-stone-500">
                              <p>{receipt.licensePlate || "-"}</p>
                              <p className="mt-1 text-xs font-mono text-stone-400">{receipt.batchNo || "-"}</p>
                            </td>
                            <td className="px-4 py-4 text-right text-stone-700">{Number(receipt.totalQty)} 箱</td>
                            <td className="px-4 py-4 text-right font-semibold text-stone-900">{fmtMoney(receipt.totalAmount)}</td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={`border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-2xl"
                                  onClick={() => setDetailTarget(receipt)}
                                >
                                  查看
                                </Button>
                                {receipt.status === "pending" ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-2xl text-red-600 hover:text-red-700"
                                    onClick={() => setAnomalyTarget(receipt)}
                                  >
                                    異常
                                  </Button>
                                ) : null}
                                {receipt.status === "anomaly" ? (
                                  <Button
                                    size="sm"
                                    className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                                    onClick={() => setReconcileTarget(receipt)}
                                  >
                                    對帳
                                  </Button>
                                ) : null}
                                {receipt.status === "signed" ? (
                                  <Button
                                    size="sm"
                                    className="rounded-2xl bg-sky-600 text-white hover:bg-sky-700"
                                    onClick={() => setWarehouseTarget(receipt)}
                                  >
                                    入倉
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {receipts.map((receipt: any) => {
                    const statusTone = receiptStatusTone[receipt.status] ?? receiptStatusTone.pending;
                    return (
                      <article key={Number(receipt.id)} className="dayone-mobile-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="text-base font-semibold text-stone-900">{receipt.supplierName}</h2>
                            <p className="mt-1 text-xs text-stone-400">
                              {fmtDateTime(receipt.receiptDate)} · {receipt.driverName}
                            </p>
                          </div>
                          <Badge className={`border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-stone-500">總數量</p>
                            <p className="mt-1 font-semibold text-stone-900">{Number(receipt.totalQty)} 箱</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">總金額</p>
                            <p className="mt-1 font-semibold text-stone-900">{fmtMoney(receipt.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">車牌</p>
                            <p className="mt-1 text-stone-700">{receipt.licensePlate || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">批次號</p>
                            <p className="mt-1 font-mono text-xs text-stone-700">{receipt.batchNo || "-"}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setDetailTarget(receipt)}>
                            查看詳情
                          </Button>
                          {receipt.status === "pending" ? (
                            <Button
                              variant="outline"
                              className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setAnomalyTarget(receipt)}
                            >
                              標記異常
                            </Button>
                          ) : null}
                          {receipt.status === "anomaly" ? (
                            <Button
                              className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                              onClick={() => setReconcileTarget(receipt)}
                            >
                              對帳
                            </Button>
                          ) : null}
                          {receipt.status === "signed" ? (
                            <Button
                              className="rounded-2xl bg-sky-600 text-white hover:bg-sky-700"
                              onClick={() => setWarehouseTarget(receipt)}
                            >
                              確認入倉
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {showCreate ? (
        <CreateReceiptDialog
          onClose={() => setShowCreate(false)}
          onSignNeeded={(id, meta, items) => setSignTarget({ id, meta, items })}
        />
      ) : null}

      {signTarget ? (
        <SignatureSheet
          receiptId={signTarget.id}
          receiptMeta={signTarget.meta}
          items={signTarget.items}
          onClose={() => setSignTarget(null)}
          onSuccess={(signatureUrl) => {
            refetch();
            setReceiptSummary({ ...signTarget.meta, items: signTarget.items, signatureUrl });
            setSignTarget(null);
          }}
        />
      ) : null}

      {receiptSummary ? <ReceiptSummaryDialog data={receiptSummary} onClose={() => setReceiptSummary(null)} /> : null}
      {anomalyTarget ? (
        <AnomalyDialog receipt={anomalyTarget} onClose={() => setAnomalyTarget(null)} onSuccess={() => refetch()} />
      ) : null}
      {reconcileTarget ? (
        <ReconcileAnomalyDialog
          receipt={reconcileTarget}
          onClose={() => setReconcileTarget(null)}
          onSuccess={() => refetch()}
        />
      ) : null}
      {warehouseTarget ? (
        <ReceiveWarehouseDialog
          receipt={warehouseTarget}
          onClose={() => setWarehouseTarget(null)}
          onSuccess={() => refetch()}
        />
      ) : null}
      {detailTarget ? <ReceiptDetailDialog receipt={detailTarget} onClose={() => setDetailTarget(null)} /> : null}
      {payableTarget ? (
        <CollectPayableDialog
          record={payableTarget}
          onClose={() => setPayableTarget(null)}
          onSuccess={() => {
            utils.dayone.ap.listPayables.invalidate();
            utils.dayone.ap.summary.invalidate();
          }}
        />
      ) : null}
    </DayoneLayout>
  );
}

import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Package, TrendingDown } from "lucide-react";

const TENANT_ID_PLACEHOLDER = 0; // injected via props

function fmtMoney(v: number | string | null | undefined) {
  return `NT$ ${Number(v ?? 0).toLocaleString("zh-TW")}`;
}
function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" });
}
function todayStr() {
  return new Date().toLocaleDateString("sv-SE");
}
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const AR_STATUS_TONE: Record<string, { label: string; cls: string }> = {
  unpaid:  { label: "未收",     cls: "bg-stone-100 text-stone-700" },
  partial: { label: "部分付款", cls: "bg-amber-100 text-amber-700" },
  paid:    { label: "已收",     cls: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "逾期",     cls: "bg-red-100 text-red-700" },
};
const AP_STATUS_TONE: Record<string, { label: string; cls: string }> = {
  pending_review: { label: "待入倉", cls: "bg-sky-100 text-sky-700" },
  unpaid:  { label: "未付",   cls: "bg-stone-100 text-stone-700" },
  partial: { label: "部分付", cls: "bg-amber-100 text-amber-700" },
  paid:    { label: "已付",   cls: "bg-emerald-100 text-emerald-700" },
};
const CYCLE_LABEL: Record<string, string> = {
  per_delivery: "逐筆結", weekly: "週結", monthly: "月結", cash: "現金",
};
const CASH_TONE: Record<string, { label: string; cls: string }> = {
  normal:  { label: "正常",       cls: "bg-emerald-100 text-emerald-700" },
  anomaly: { label: "異常待處理", cls: "bg-red-100 text-red-700" },
  resolved:{ label: "已解決",     cls: "bg-stone-100 text-stone-600" },
};
const BOX_TYPE_LABEL: Record<string, string> = {
  delivery: "送出", return: "回收",
};

// ─── dialogs ────────────────────────────────────────────────────────────────

function CollectDialog({ record, tenantId, onClose, onSuccess }: { record: any; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(String(Math.max(0, Number(record.amount) - Number(record.paidAmount))));
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [note, setNote] = useState("");
  const markPaid = trpc.dayone.ar.markPaid.useMutation({
    onSuccess: () => { toast.success("收款資料已更新"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>收款登錄</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">{record.customerName}</p>
            <p className="mt-1 text-xs text-stone-500">應收 {fmtMoney(record.amount)} ／ 已收 {fmtMoney(record.paidAmount)}</p>
          </div>
          <div className="flex gap-4">
            {(["cash", "transfer"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="radio" className="accent-amber-600" checked={method === m} onChange={() => setMethod(m)} />
                {m === "cash" ? "現金" : "轉帳"}
              </label>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">收款金額</label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-2xl" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea rows={2} placeholder="例如：部分付款、轉帳尾數..." value={note} onChange={(e) => setNote(e.target.value)} className="rounded-2xl" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>取消</Button>
            <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" disabled={markPaid.isPending}
              onClick={() => {
                const amt = Number(amount);
                if (!amt || amt <= 0) { toast.error("請輸入有效收款金額"); return; }
                markPaid.mutate({ id: record.id, tenantId, paymentMethod: method, paidAmount: amt, adminNote: note || undefined });
              }}>
              {markPaid.isPending ? "更新中…" : "確認收款"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayApDialog({ record, tenantId, onClose, onSuccess }: { record: any; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(String(Math.max(0, Number(record.amount) - Number(record.paidAmount))));
  const [method, setMethod] = useState<"cash" | "transfer">("transfer");
  const [note, setNote] = useState("");
  const markPaid = trpc.dayone.ap.markPaid.useMutation({
    onSuccess: () => { toast.success("付款記錄已更新"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>付款登錄</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">{record.supplierName}</p>
            <p className="mt-1 text-xs text-stone-500">應付 {fmtMoney(record.amount)} ／ 已付 {fmtMoney(record.paidAmount)}　到期 {fmtDate(record.dueDate)}</p>
          </div>
          <div className="flex gap-4">
            {(["cash", "transfer"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="radio" className="accent-amber-600" checked={method === m} onChange={() => setMethod(m)} />
                {m === "cash" ? "現金" : "轉帳"}
              </label>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">付款金額</label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-2xl" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea rows={2} placeholder="例如：本月月結、部分先付..." value={note} onChange={(e) => setNote(e.target.value)} className="rounded-2xl" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>取消</Button>
            <Button className="rounded-2xl bg-stone-900 text-white hover:bg-stone-800" disabled={markPaid.isPending}
              onClick={() => {
                const amt = Number(amount);
                if (!amt || amt <= 0) { toast.error("請輸入有效付款金額"); return; }
                markPaid.mutate({ id: record.id, tenantId, paymentMethod: method, paidAmount: amt, adminNote: note || undefined });
              }}>
              {markPaid.isPending ? "更新中…" : "確認付款"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResolveAnomalyDialog({ report, tenantId, onClose, onSuccess }: { report: any; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote] = useState("");
  const resolve = trpc.dayone.ar.resolveAnomaly.useMutation({
    onSuccess: () => { toast.success("已標記為解決"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>處理司機現金異常</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            差額 {fmtMoney(report.diff)}，請記錄處理結果。
          </div>
          <Textarea rows={4} placeholder="例如：補交現金、改列短收、主管核可調整..." value={note} onChange={(e) => setNote(e.target.value)} className="rounded-2xl" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>取消</Button>
            <Button className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
              disabled={!note.trim() || resolve.isPending}
              onClick={() => resolve.mutate({ id: report.id, tenantId, adminNote: note.trim() })}>
              {resolve.isPending ? "送出中…" : "確認解決"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmHandoverDialog({ dispatch, tenantId, onClose, onSuccess }: { dispatch: any; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [cash, setCash] = useState(String(dispatch.totalCollected ?? 0));
  const [note, setNote] = useState("");
  const confirm = trpc.dayone.dispatch.confirmHandover.useMutation({
    onSuccess: () => { toast.success("已完成點收，庫存已入帳"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const diff = Number(cash) - Number(dispatch.totalCollected ?? 0);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>管理員點收確認</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-semibold text-stone-900">{dispatch.driverName} — {fmtDate(dispatch.dispatchDate)}</p>
            <p className="mt-1 text-stone-500">司機回報現收 {fmtMoney(dispatch.totalCollected)}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">實際點收現金（NT$）</label>
            <Input type="number" min="0" value={cash} onChange={(e) => setCash(e.target.value)} className="rounded-2xl" />
            {Math.abs(diff) >= 1 && (
              <p className={`mt-1.5 text-xs ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                差額 {diff > 0 ? "+" : ""}{fmtMoney(diff)}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea rows={2} placeholder="例如：短收說明、備用金調整..." value={note} onChange={(e) => setNote(e.target.value)} className="rounded-2xl" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>取消</Button>
            <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" disabled={confirm.isPending}
              onClick={() => confirm.mutate({ dispatchOrderId: dispatch.id, tenantId, cashConfirmed: Number(cash), adminNote: note || undefined })}>
              {confirm.isPending ? "確認中…" : "完成點收"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── tabs ────────────────────────────────────────────────────────────────────

function ReceivableTab({ tenantId }: { tenantId: number }) {
  const utils = trpc.useUtils();
  const [customerId, setCustomerId] = useState("all");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "aging">("list");
  const [collectTarget, setCollectTarget] = useState<any>(null);

  const { data: customers = [] } = trpc.dayone.customers.list.useQuery({ tenantId });
  const { data: kpiData } = trpc.dayone.ar.kpiSummary.useQuery({ tenantId });
  const { data: overdueStats = [] } = trpc.dayone.ar.customerOverdueStats.useQuery({ tenantId });
  const { data: agingRows = [], isLoading: agingLoading } = trpc.dayone.ar.agingReport.useQuery(
    { tenantId }, { enabled: viewMode === "aging" }
  );
  const { data: records = [], isLoading, refetch } = trpc.dayone.ar.listReceivables.useQuery({
    tenantId,
    status: status !== "all" ? status : undefined,
    customerId: customerId !== "all" ? Number(customerId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
  });

  const overdueMap = useMemo(() => {
    const m = new Map<number, number>();
    (overdueStats as any[]).forEach((s: any) => { if (s.isOverdue) m.set(s.customerId, Number(s.overdueDays ?? 0)); });
    return m;
  }, [overdueStats]);

  const kpi = useMemo(() => ({
    unpaidAmt: kpiData?.unpaidAmt ?? 0,
    overdueAmt: kpiData?.overdueAmt ?? 0,
    overdueCustomers: (overdueStats as any[]).filter((s: any) => s.isOverdue).length,
    cashPaid: kpiData?.cashPaid ?? 0,
    transferPaid: kpiData?.transferPaid ?? 0,
  }), [kpiData, overdueStats]);

  function invalidate() { refetch(); utils.dayone.ar.kpiSummary.invalidate(); utils.dayone.ar.customerOverdueStats.invalidate(); utils.dayone.ar.agingReport.invalidate(); }

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "未收總額",   value: fmtMoney(kpi.unpaidAmt),       cls: "border-amber-100" },
          { label: "逾期金額",   value: fmtMoney(kpi.overdueAmt),      cls: "border-red-100 bg-red-50/50" },
          { label: "逾期客戶數", value: String(kpi.overdueCustomers),   cls: "border-red-100 bg-red-50/50" },
          { label: "現金已收",   value: fmtMoney(kpi.cashPaid),         cls: "border-emerald-100" },
          { label: "轉帳已收",   value: fmtMoney(kpi.transferPaid),     cls: "border-emerald-100" },
        ].map((k) => (
          <div key={k.label} className={`rounded-3xl border ${k.cls} bg-white p-4`}>
            <p className="text-xs text-stone-500">{k.label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* view toggle */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setViewMode("list")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
          明細列表
        </button>
        <button type="button" onClick={() => setViewMode("aging")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${viewMode === "aging" ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
          帳齡分析
        </button>
      </div>

      {viewMode === "aging" ? (
        agingLoading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
        ) : !(agingRows as any[]).length ? (
          <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">目前無逾期帳款。</div>
        ) : (
          <div className="overflow-x-auto rounded-[28px] border border-stone-200">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">客戶</th>
                  <th className="px-4 py-3 text-right font-medium">未收總額</th>
                  <th className="px-4 py-3 text-right font-medium text-yellow-700">0–30天</th>
                  <th className="px-4 py-3 text-right font-medium text-orange-700">31–60天</th>
                  <th className="px-4 py-3 text-right font-medium text-red-600">61–90天</th>
                  <th className="px-4 py-3 text-right font-medium text-red-800">90天以上</th>
                  <th className="px-4 py-3 text-center font-medium">信用額度</th>
                </tr>
              </thead>
              <tbody>
                {(agingRows as any[]).map((row: any) => (
                  <tr key={row.customerId} className={`border-t border-stone-200 ${row.overCreditLimit ? "bg-red-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">{row.customerName}</span>
                        {row.overCreditLimit && <Badge className="border-0 bg-red-100 text-red-700 text-xs">超額</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-stone-400">{CYCLE_LABEL[row.settlementCycle] ?? row.settlementCycle}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">{fmtMoney(row.totalUnpaid)}</td>
                    <td className="px-4 py-3 text-right text-yellow-700">{row.bucket0_30 > 0 ? fmtMoney(row.bucket0_30) : "-"}</td>
                    <td className="px-4 py-3 text-right text-orange-700">{row.bucket31_60 > 0 ? fmtMoney(row.bucket31_60) : "-"}</td>
                    <td className="px-4 py-3 text-right text-red-600">{row.bucket61_90 > 0 ? fmtMoney(row.bucket61_90) : "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-800">{row.bucket90plus > 0 ? fmtMoney(row.bucket90plus) : "-"}</td>
                    <td className="px-4 py-3 text-center text-xs text-stone-500">
                      {row.creditLimit > 0 ? fmtMoney(row.creditLimit) : "未設"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
          {/* filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] rounded-2xl"><SelectValue placeholder="所有客戶" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有客戶</SelectItem>
                {(customers as any[]).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px] rounded-2xl"><SelectValue placeholder="全部狀態" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="unpaid">未收</SelectItem>
                <SelectItem value="partial">部分付款</SelectItem>
                <SelectItem value="paid">已收</SelectItem>
                <SelectItem value="overdue">逾期</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-[160px] rounded-2xl" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            <Input type="date" className="w-[160px] rounded-2xl" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
          ) : !(records as any[]).length ? (
            <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">目前沒有符合條件的應收資料。</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-stone-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">客戶</th>
                      <th className="px-4 py-3 text-center font-medium">結帳</th>
                      <th className="px-4 py-3 text-right font-medium">應收</th>
                      <th className="px-4 py-3 text-right font-medium">已收</th>
                      <th className="px-4 py-3 text-right font-medium">未收</th>
                      <th className="px-4 py-3 text-center font-medium">收款方式</th>
                      <th className="px-4 py-3 text-center font-medium">到期日</th>
                      <th className="px-4 py-3 text-center font-medium">狀態</th>
                      <th className="px-4 py-3 text-center font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(records as any[]).map((rec: any) => {
                      const tone = AR_STATUS_TONE[rec.status] ?? AR_STATUS_TONE.unpaid;
                      const unpaid = Number(rec.amount) - Number(rec.paidAmount);
                      const overdueDays = overdueMap.get(rec.customerId);
                      return (
                        <tr key={rec.id} className={`border-t border-stone-200 ${overdueDays ? "bg-red-50/30" : ""}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900">{rec.customerName}</span>
                              {overdueDays ? <Badge className="border-0 bg-red-100 text-red-700 text-xs">逾 {overdueDays} 天</Badge> : null}
                            </div>
                            {rec.adminNote ? <p className="mt-0.5 text-xs text-stone-400">{rec.adminNote}</p> : null}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge variant="outline" className="text-xs">{CYCLE_LABEL[rec.settlementCycle ?? ""] ?? "-"}</Badge>
                          </td>
                          <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(rec.amount)}</td>
                          <td className="px-4 py-4 text-right text-emerald-700">{fmtMoney(rec.paidAmount)}</td>
                          <td className={`px-4 py-4 text-right font-semibold ${unpaid > 0 ? "text-red-600" : "text-stone-400"}`}>{fmtMoney(unpaid)}</td>
                          <td className="px-4 py-4 text-center text-xs text-stone-500">
                            {rec.paymentMethod === "cash" ? "現金" : rec.paymentMethod === "transfer" ? "轉帳" : "-"}
                          </td>
                          <td className="px-4 py-4 text-center text-stone-700">{fmtDate(rec.dueDate)}</td>
                          <td className="px-4 py-4 text-center">
                            <Badge className={`border-0 ${tone.cls}`}>{tone.label}</Badge>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {rec.status !== "paid" ? (
                              <Button size="sm" className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={() => setCollectTarget(rec)}>收款</Button>
                            ) : <span className="text-xs text-stone-400">已結清</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* mobile */}
              <div className="space-y-3 md:hidden">
                {(records as any[]).map((rec: any) => {
                  const tone = AR_STATUS_TONE[rec.status] ?? AR_STATUS_TONE.unpaid;
                  const unpaid = Number(rec.amount) - Number(rec.paidAmount);
                  const overdueDays = overdueMap.get(rec.customerId);
                  return (
                    <article key={rec.id} className="rounded-[24px] border border-stone-200/80 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-stone-900">{rec.customerName}</p>
                            {overdueDays ? <Badge className="border-0 bg-red-100 text-red-700 text-xs">逾 {overdueDays} 天</Badge> : null}
                          </div>
                          <p className="mt-0.5 text-xs text-stone-400">到期 {fmtDate(rec.dueDate)} · {CYCLE_LABEL[rec.settlementCycle ?? ""] ?? "-"}</p>
                        </div>
                        <Badge className={`border-0 shrink-0 ${tone.cls}`}>{tone.label}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-xs text-stone-400">應收</p><p className="mt-0.5 font-semibold text-stone-900">{fmtMoney(rec.amount)}</p></div>
                        <div><p className="text-xs text-stone-400">已收</p><p className="mt-0.5 font-semibold text-emerald-700">{fmtMoney(rec.paidAmount)}</p></div>
                        <div><p className="text-xs text-stone-400">未收</p><p className={`mt-0.5 font-semibold ${unpaid > 0 ? "text-red-600" : "text-stone-400"}`}>{fmtMoney(unpaid)}</p></div>
                      </div>
                      {rec.status !== "paid" && (
                        <Button className="mt-3 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={() => setCollectTarget(rec)}>收款</Button>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" className="rounded-2xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>上一頁</Button>
                <span className="text-sm text-stone-500">第 {page} 頁</span>
                <Button variant="outline" className="rounded-2xl" disabled={(records as any[]).length < 20} onClick={() => setPage((p) => p + 1)}>下一頁</Button>
              </div>
            </>
          )}
        </>
      )}

      {collectTarget && (
        <CollectDialog record={collectTarget} tenantId={tenantId} onClose={() => setCollectTarget(null)} onSuccess={invalidate} />
      )}
    </div>
  );
}

function PayableTab({ tenantId }: { tenantId: number }) {
  const utils = trpc.useUtils();
  const [supplierId, setSupplierId] = useState("all");
  const [status, setStatus] = useState("all");
  const [dueSoon, setDueSoon] = useState(false);
  const [page, setPage] = useState(1);
  const [payTarget, setPayTarget] = useState<any>(null);

  const { data: suppliers = [] } = trpc.dayone.purchase.suppliers.useQuery({ tenantId });
  const { data: dueSoonData } = trpc.dayone.ap.dueSoonCount.useQuery({ tenantId });
  const { data: apSummary } = trpc.dayone.ap.summary.useQuery({ tenantId });
  const { data: records = [], isLoading, refetch } = trpc.dayone.ap.listPayables.useQuery({
    tenantId,
    status: status !== "all" ? status : undefined,
    supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
    dueSoon: dueSoon || undefined,
    page,
  });

  const overview = (apSummary as any)?.overview;
  function invalidate() { refetch(); utils.dayone.ap.summary.invalidate(); utils.dayone.ap.dueSoonCount.invalidate(); }

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "未付總額",   value: fmtMoney(overview?.unpaidAmount),  cls: "border-stone-200" },
          { label: "逾期未付",   value: `${overview?.overdueCount ?? 0} 筆`, cls: "border-red-100 bg-red-50/50" },
          { label: "本週到期",   value: `${dueSoonData?.count ?? 0} 筆`,     cls: dueSoonData?.count ? "border-orange-200 bg-orange-50/60" : "border-stone-200" },
          { label: "本月已付",   value: fmtMoney(overview?.paidAmount),    cls: "border-emerald-100" },
        ].map((k) => (
          <div key={k.label} className={`rounded-3xl border ${k.cls} bg-white p-4`}>
            <p className="text-xs text-stone-500">{k.label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">{k.value}</p>
          </div>
        ))}
      </div>

      {dueSoonData?.count ? (
        <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          本週有 {dueSoonData.count} 筆應付帳款即將到期，請盡快處理。
          <button type="button" className="ml-auto text-xs font-semibold underline" onClick={() => { setDueSoon(true); setStatus("all"); }}>
            只看本週到期
          </button>
        </div>
      ) : null}

      {/* filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={supplierId} onValueChange={(v) => { setSupplierId(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] rounded-2xl"><SelectValue placeholder="所有供應商" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有供應商</SelectItem>
            {(suppliers as any[]).map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setDueSoon(false); setPage(1); }}>
          <SelectTrigger className="w-[140px] rounded-2xl"><SelectValue placeholder="全部狀態" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="unpaid">未付</SelectItem>
            <SelectItem value="partial">部分付</SelectItem>
            <SelectItem value="paid">已付</SelectItem>
          </SelectContent>
        </Select>
        {dueSoon && (
          <button type="button" className="rounded-full bg-orange-100 px-3 py-1.5 text-xs text-orange-700 font-medium"
            onClick={() => setDueSoon(false)}>
            ✕ 取消「本週到期」篩選
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
      ) : !(records as any[]).length ? (
        <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">目前沒有符合條件的應付資料。</div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">供應商</th>
                  <th className="px-4 py-3 text-left font-medium">進貨單號</th>
                  <th className="px-4 py-3 text-right font-medium">應付</th>
                  <th className="px-4 py-3 text-right font-medium">已付</th>
                  <th className="px-4 py-3 text-right font-medium">未付</th>
                  <th className="px-4 py-3 text-center font-medium">到期日</th>
                  <th className="px-4 py-3 text-center font-medium">狀態</th>
                  <th className="px-4 py-3 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(records as any[]).map((rec: any) => {
                  const tone = AP_STATUS_TONE[rec.status] ?? AP_STATUS_TONE.unpaid;
                  const unpaid = Number(rec.amount) - Number(rec.paidAmount);
                  const isUrgent = rec.dueDate && new Date(rec.dueDate) <= new Date(Date.now() + 7 * 86400000) && rec.status !== "paid";
                  return (
                    <tr key={rec.id} className={`border-t border-stone-200 ${isUrgent ? "bg-orange-50/40" : ""}`}>
                      <td className="px-4 py-4 font-semibold text-stone-900">{rec.supplierName}</td>
                      <td className="px-4 py-4 text-stone-500 text-xs">{rec.receiptNo ?? `#${rec.purchaseReceiptId ?? rec.id}`}</td>
                      <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(rec.amount)}</td>
                      <td className="px-4 py-4 text-right text-emerald-700">{fmtMoney(rec.paidAmount)}</td>
                      <td className={`px-4 py-4 text-right font-semibold ${unpaid > 0 ? "text-stone-800" : "text-stone-400"}`}>{fmtMoney(unpaid)}</td>
                      <td className={`px-4 py-4 text-center ${isUrgent ? "font-semibold text-orange-700" : "text-stone-700"}`}>{fmtDate(rec.dueDate)}</td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`border-0 ${tone.cls}`}>{tone.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {rec.status === "paid" ? (
                          <span className="text-xs text-stone-400">已結清</span>
                        ) : rec.status === "pending_review" ? (
                          <span className="text-xs text-sky-500">待入倉確認</span>
                        ) : (
                          <Button size="sm" className="rounded-2xl bg-stone-900 text-white hover:bg-stone-800" onClick={() => setPayTarget(rec)}>付款</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* mobile */}
          <div className="space-y-3 md:hidden">
            {(records as any[]).map((rec: any) => {
              const tone = AP_STATUS_TONE[rec.status] ?? AP_STATUS_TONE.unpaid;
              const unpaid = Number(rec.amount) - Number(rec.paidAmount);
              const isUrgent = rec.dueDate && new Date(rec.dueDate) <= new Date(Date.now() + 7 * 86400000) && rec.status !== "paid";
              return (
                <article key={rec.id} className={`rounded-[24px] border p-4 ${isUrgent ? "border-orange-200 bg-orange-50/40" : "border-stone-200 bg-white"} shadow-sm`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-stone-900">{rec.supplierName}</p>
                      <p className="mt-0.5 text-xs text-stone-400">到期 {fmtDate(rec.dueDate)}</p>
                    </div>
                    <Badge className={`border-0 shrink-0 ${tone.cls}`}>{tone.label}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-stone-400">應付</p><p className="mt-0.5 font-semibold text-stone-900">{fmtMoney(rec.amount)}</p></div>
                    <div><p className="text-xs text-stone-400">已付</p><p className="mt-0.5 font-semibold text-emerald-700">{fmtMoney(rec.paidAmount)}</p></div>
                    <div><p className="text-xs text-stone-400">未付</p><p className="mt-0.5 font-semibold text-stone-800">{fmtMoney(unpaid)}</p></div>
                  </div>
                  {rec.status !== "paid" && rec.status !== "pending_review" && (
                    <Button className="mt-3 w-full rounded-2xl bg-stone-900 text-white hover:bg-stone-800" onClick={() => setPayTarget(rec)}>付款</Button>
                  )}
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="rounded-2xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>上一頁</Button>
            <span className="text-sm text-stone-500">第 {page} 頁</span>
            <Button variant="outline" className="rounded-2xl" disabled={(records as any[]).length < 20} onClick={() => setPage((p) => p + 1)}>下一頁</Button>
          </div>
        </>
      )}

      {payTarget && (
        <PayApDialog record={payTarget} tenantId={tenantId} onClose={() => setPayTarget(null)} onSuccess={invalidate} />
      )}
    </div>
  );
}

function DriverCashTab({ tenantId }: { tenantId: number }) {
  const utils = trpc.useUtils();
  const [date, setDate] = useState(todayStr);
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [handoverTarget, setHandoverTarget] = useState<any>(null);

  // 列出今日派車單（pending_handover 狀態的需要點收）
  const { data: dispatches = [], refetch: refetchDispatches } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId, dispatchDate: date,
  });
  const { data: cashReports = [], isLoading, refetch } = trpc.dayone.ar.listDriverCashReports.useQuery({
    tenantId, reportDate: date,
  });

  const pendingHandover = (dispatches as any[]).filter((d: any) => d.status === "pending_handover");
  const anomalyCount = (cashReports as any[]).filter((r: any) => r.status === "anomaly").length;

  function invalidate() {
    refetch();
    refetchDispatches();
    utils.dayone.dispatch.listDispatch.invalidate();
  }

  async function handlePrintDailyStatement(driverId: number, driverName: string) {
    const result = await utils.dayone.reports.driverDailyStatement.fetch({ tenantId, driverId, date });
    const win = window.open("", "_blank");
    if (!win) return;
    const orders = (result.orders ?? []) as any[];
    const extras = (result.extraItems ?? []) as any[];
    const supps = (result.suppItems ?? []) as any[];
    const returns = (result.returnItems ?? []) as any[];
    const totalCollected = orders.reduce((s: number, o: any) => s + Number(o.arPaid ?? 0), 0);
    const totalInvoiced = orders.reduce((s: number, o: any) => s + Number(o.totalAmount ?? 0), 0);
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>司機日結對帳單</title>
<style>
body{font-family:sans-serif;padding:32px;color:#1c1917;font-size:13px}
h2{font-size:18px;font-weight:700;color:#b45309;margin-bottom:4px}
h3{font-size:13px;font-weight:700;margin:20px 0 6px;color:#44403c}
table{width:100%;border-collapse:collapse;margin-top:8px}
th{background:#f5f5f4;padding:7px 10px;text-align:left;font-size:12px;color:#78716c;border-bottom:1px solid #e7e5e4}
td{padding:7px 10px;border-bottom:1px solid #f5f5f4;font-size:12px}
.right{text-align:right}.center{text-align:center}
.total-row td{font-weight:700;background:#fafaf9}
.info{display:flex;gap:24px;margin:12px 0;font-size:13px}
.info span{color:#78716c}
.sig{display:flex;gap:64px;margin-top:48px}
.sig-box{border-top:1px solid #000;padding-top:6px;width:200px;text-align:center;font-size:12px}
</style>
</head><body>
<h2>大永蛋品 — 司機日結對帳單</h2>
<div class="info">
<div><span>司機：</span><strong>${driverName}</strong></div>
<div><span>日期：</span>${date}</div>
<div><span>路線：</span>${result.dispatch?.routeCode ?? "-"}</div>
</div>
<h3>訂單明細</h3>
<table>
<tr><th>訂單號</th><th>客戶</th><th>結帳</th><th class="right">應收</th><th class="right">實收</th><th class="center">收款方式</th><th class="center">狀態</th></tr>
${orders.map((o: any) => `<tr>
<td>#${o.orderNo ?? o.id}</td>
<td>${o.customerName ?? "-"}</td>
<td>${CYCLE_LABEL[o.settlementCycle] ?? o.settlementCycle ?? "-"}</td>
<td class="right">${fmtMoney(o.totalAmount)}</td>
<td class="right">${fmtMoney(o.arPaid)}</td>
<td class="center">${o.paymentMethod === "cash" ? "現金" : o.paymentMethod === "transfer" ? "轉帳" : "-"}</td>
<td class="center">${AR_STATUS_TONE[o.arStatus]?.label ?? o.paymentStatus ?? "-"}</td>
</tr>`).join("")}
<tr class="total-row">
<td colspan="3">合計</td>
<td class="right">${fmtMoney(totalInvoiced)}</td>
<td class="right">${fmtMoney(totalCollected)}</td>
<td colspan="2"></td>
</tr>
</table>
${extras.length ? `<h3>備用箱登記</h3>
<table>
<tr><th>品名</th><th>單位</th><th class="right">數量</th><th>備註</th></tr>
${extras.map((e: any) => `<tr><td>${e.productName}</td><td>${e.unit ?? "-"}</td><td class="right">${e.qty}</td><td>${e.note ?? ""}</td></tr>`).join("")}
</table>` : ""}
${supps.length ? `<h3>補單動用備用箱</h3>
<table>
<tr><th>品名</th><th class="right">動用數量</th></tr>
${supps.map((s: any) => `<tr><td>${s.productName}</td><td class="right">${s.suppQty}</td></tr>`).join("")}
</table>` : ""}
${returns.length ? `<h3>剩貨回庫</h3>
<table>
<tr><th>品名</th><th class="right">回庫數量</th></tr>
${returns.map((r: any) => `<tr><td>${r.productName}</td><td class="right">${r.returnedQty}</td></tr>`).join("")}
</table>` : ""}
<h3>現金繳款</h3>
<table>
<tr><th>應繳現金</th><th>實繳現金</th><th>差額</th><th>狀態</th></tr>
<tr>
<td>${fmtMoney(result.cashReport?.expectedAmount ?? 0)}</td>
<td>${fmtMoney(result.cashReport?.actualAmount ?? 0)}</td>
<td>${fmtMoney(result.cashReport?.diff ?? 0)}</td>
<td>${result.cashReport?.status === "normal" ? "正常" : result.cashReport?.status === "anomaly" ? "異常" : "-"}</td>
</tr>
</table>
<div class="sig">
<div class="sig-box">司機簽名</div>
<div class="sig-box">管理員確認</div>
</div>
</body></html>`);
    win.document.close();
    win.print();
  }

  async function handlePrintDailySummary() {
    const rows = await utils.dayone.reports.dailyCashSummary.fetch({ tenantId, date });
    const win = window.open("", "_blank");
    if (!win) return;
    const data = rows as any[];
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>每日收款彙總</title>
<style>
body{font-family:sans-serif;padding:32px;color:#1c1917;font-size:13px}
h2{font-size:18px;font-weight:700;color:#b45309;margin-bottom:4px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{background:#f5f5f4;padding:8px 12px;text-align:left;font-size:12px;color:#78716c;border-bottom:1px solid #e7e5e4}
td{padding:8px 12px;border-bottom:1px solid #f5f5f4}
.right{text-align:right}
.total-row td{font-weight:700;background:#fafaf9}
</style>
</head><body>
<h2>大永蛋品 — 每日收款彙總</h2>
<p style="color:#78716c;margin-bottom:16px">${date}</p>
<table>
<tr>
<th>司機</th><th>路線</th>
<th class="right">逐筆應收</th><th class="right">逐筆已收</th>
<th class="right">應繳現金</th><th class="right">實繳現金</th>
<th class="right">差額</th><th>狀態</th>
</tr>
${data.map((r: any) => {
  const diff = Number(r.reportDiff ?? 0);
  const diffStr = diff === 0 ? "—" : (diff > 0 ? "+" : "") + `NT$ ${Number(diff).toLocaleString("zh-TW")}`;
  const diffColor = diff < 0 ? "color:#dc2626" : diff > 0 ? "color:#059669" : "color:#a8a29e";
  return `<tr>
<td>${r.driverName}</td>
<td>${r.routeCode ?? "-"}</td>
<td class="right">${fmtMoney(r.perDeliveryAR)}</td>
<td class="right">${fmtMoney(r.perDeliveryPaid)}</td>
<td class="right">${fmtMoney(r.reportExpected)}</td>
<td class="right">${fmtMoney(r.reportActual)}</td>
<td class="right" style="${diffColor}">${diffStr}</td>
<td>${r.reportStatus === "normal" ? "正常" : r.reportStatus === "anomaly" ? "異常" : r.reportStatus === "resolved" ? "已解決" : "-"}</td>
</tr>`;
}).join("")}
</table>
</body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" className="w-[180px] rounded-2xl" value={date} onChange={(e) => setDate(e.target.value)} />
        {anomalyCount > 0 && <Badge className="border-0 bg-red-100 text-red-700">{anomalyCount} 筆現金異常待處理</Badge>}
        {pendingHandover.length > 0 && <Badge className="border-0 bg-amber-100 text-amber-700">{pendingHandover.length} 筆待點收</Badge>}
        <Button variant="outline" size="sm" className="rounded-2xl ml-auto" onClick={handlePrintDailySummary}>
          列印每日收款彙總
        </Button>
      </div>

      {/* 待管理員點收的派車單 */}
      {pendingHandover.length > 0 && (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-amber-700" />
            <p className="text-sm font-semibold text-amber-800">待點收派車單</p>
          </div>
          <div className="space-y-2">
            {pendingHandover.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{d.driverName ?? `司機 #${d.driverId}`}</p>
                  <p className="mt-0.5 text-xs text-stone-500">路線 {d.routeCode}　共 {d.totalStops ?? "?"} 站　司機回報現收 {fmtMoney(d.wlTotalCollected ?? 0)}</p>
                </div>
                <Button size="sm" className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => setHandoverTarget({ ...d, totalCollected: d.wlTotalCollected ?? 0, dispatchDate: date })}>
                  點收
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
      ) : !(cashReports as any[]).length ? (
        <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">
          <TrendingDown className="mx-auto h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">這一天尚未有司機日結記錄。</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">司機</th>
                  <th className="px-4 py-3 text-right font-medium">應收現金</th>
                  <th className="px-4 py-3 text-right font-medium">實繳現金</th>
                  <th className="px-4 py-3 text-right font-medium">差額</th>
                  <th className="px-4 py-3 text-center font-medium">狀態</th>
                  <th className="px-4 py-3 text-left font-medium">備註</th>
                  <th className="px-4 py-3 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(cashReports as any[]).map((rep: any) => {
                  const tone = CASH_TONE[rep.status] ?? CASH_TONE.normal;
                  const diff = Number(rep.diff ?? 0);
                  return (
                    <tr key={rep.id} className={`border-t border-stone-200 ${rep.status === "anomaly" ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-4 font-semibold text-stone-900">{rep.driverName}</td>
                      <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(rep.expectedAmount)}</td>
                      <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(rep.actualAmount)}</td>
                      <td className={`px-4 py-4 text-right font-semibold ${diff < 0 ? "text-red-600" : diff > 0 ? "text-emerald-700" : "text-stone-400"}`}>
                        {diff !== 0 ? (diff > 0 ? "+" : "") + fmtMoney(diff) : "—"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`border-0 ${tone.cls}`}>{tone.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-500 max-w-[200px] truncate">
                        {rep.adminNote || rep.driverNote || "-"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" className="rounded-2xl text-xs"
                            onClick={() => handlePrintDailyStatement(rep.driverId, rep.driverName)}>
                            列印日結
                          </Button>
                          {rep.status === "anomaly" && (
                            <Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => setResolveTarget(rep)}>解決</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {(cashReports as any[]).map((rep: any) => {
              const tone = CASH_TONE[rep.status] ?? CASH_TONE.normal;
              const diff = Number(rep.diff ?? 0);
              return (
                <article key={rep.id} className="rounded-[24px] border border-stone-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-stone-900">{rep.driverName}</p>
                    <Badge className={`border-0 shrink-0 ${tone.cls}`}>{tone.label}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-stone-400">應收現金</p><p className="mt-0.5 font-semibold">{fmtMoney(rep.expectedAmount)}</p></div>
                    <div><p className="text-xs text-stone-400">實繳現金</p><p className="mt-0.5 font-semibold">{fmtMoney(rep.actualAmount)}</p></div>
                    <div><p className="text-xs text-stone-400">差額</p><p className={`mt-0.5 font-semibold ${diff < 0 ? "text-red-600" : diff > 0 ? "text-emerald-700" : "text-stone-400"}`}>{diff !== 0 ? (diff > 0 ? "+" : "") + fmtMoney(diff) : "—"}</p></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-2xl text-xs"
                      onClick={() => handlePrintDailyStatement(rep.driverId, rep.driverName)}>
                      列印日結
                    </Button>
                    {rep.status === "anomaly" && (
                      <Button variant="destructive" size="sm" className="flex-1 rounded-2xl" onClick={() => setResolveTarget(rep)}>解決異常</Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {resolveTarget && (
        <ResolveAnomalyDialog report={resolveTarget} tenantId={tenantId} onClose={() => setResolveTarget(null)} onSuccess={invalidate} />
      )}
      {handoverTarget && (
        <ConfirmHandoverDialog dispatch={handoverTarget} tenantId={tenantId} onClose={() => setHandoverTarget(null)} onSuccess={invalidate} />
      )}
    </div>
  );
}

function BoxLedgerTab({ tenantId }: { tenantId: number }) {
  const [customerId, setCustomerId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const { data: customers = [] } = trpc.dayone.customers.list.useQuery({ tenantId });
  const { data: balances = [] } = trpc.dayone.ar.boxBalanceSummary.useQuery({ tenantId });
  const { data: txns = [], isLoading } = trpc.dayone.ar.listBoxTransactions.useQuery({
    tenantId,
    customerId: customerId !== "all" ? Number(customerId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
  });

  const totalOut = (balances as any[]).reduce((s: number, b: any) => s + Math.max(0, Number(b.currentBalance)), 0);

  return (
    <div className="space-y-5">
      {/* 客戶空箱餘額彙整 */}
      {(balances as any[]).length > 0 && (
        <section className="rounded-[28px] border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-amber-800">各客戶空箱餘額</p>
            <p className="text-xs text-amber-700">客戶合計欠 <span className="font-semibold">{totalOut} 箱</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(balances as any[]).map((b: any) => (
              <button key={b.customerId} type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  customerId === String(b.customerId)
                    ? "border-amber-600 bg-amber-600 text-white"
                    : b.currentBalance > 0
                      ? "border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
                      : "border-stone-200 bg-white text-stone-500 hover:bg-stone-100"
                }`}
                onClick={() => { setCustomerId(String(b.customerId)); setPage(1); }}>
                {b.customerName} {b.currentBalance > 0 ? `(${b.currentBalance})` : "(0)"}
              </button>
            ))}
            {customerId !== "all" && (
              <button type="button" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-600 hover:bg-stone-100"
                onClick={() => { setCustomerId("all"); setPage(1); }}>全部</button>
            )}
          </div>
        </section>
      )}

      {/* filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] rounded-2xl"><SelectValue placeholder="所有客戶" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有客戶</SelectItem>
            {(customers as any[]).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-[160px] rounded-2xl" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
        <Input type="date" className="w-[160px] rounded-2xl" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
      ) : !(txns as any[]).length ? (
        <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">
          <Package className="mx-auto h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">這個條件下沒有空箱異動記錄。</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">客戶</th>
                  <th className="px-4 py-3 text-center font-medium">類型</th>
                  <th className="px-4 py-3 text-right font-medium">箱數</th>
                  <th className="px-4 py-3 text-right font-medium">異動前</th>
                  <th className="px-4 py-3 text-right font-medium">異動後</th>
                  <th className="px-4 py-3 text-center font-medium">時間</th>
                </tr>
              </thead>
              <tbody>
                {(txns as any[]).map((t: any) => (
                  <tr key={t.id} className="border-t border-stone-200">
                    <td className="px-4 py-3 font-semibold text-stone-900">{t.customerName}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`border-0 text-xs ${t.type === "delivery" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {BOX_TYPE_LABEL[t.type] ?? t.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">{t.quantity}</td>
                    <td className="px-4 py-3 text-right text-stone-500">{t.balanceBefore}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">{t.balanceAfter}</td>
                    <td className="px-4 py-3 text-center text-stone-500">{fmtDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {(txns as any[]).map((t: any) => (
              <div key={t.id} className="rounded-[22px] border border-stone-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900">{t.customerName}</p>
                  <Badge className={`border-0 text-xs ${t.type === "delivery" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {BOX_TYPE_LABEL[t.type] ?? t.type}
                  </Badge>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-stone-500">
                  <span>箱數 <strong className="text-stone-900">{t.quantity}</strong></span>
                  <span>{t.balanceBefore} → <strong className="text-stone-900">{t.balanceAfter}</strong></span>
                  <span>{fmtDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="rounded-2xl" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>上一頁</Button>
            <span className="text-sm text-stone-500">第 {page} 頁</span>
            <Button variant="outline" className="rounded-2xl" disabled={(txns as any[]).length < 30} onClick={() => setPage((p) => p + 1)}>下一頁</Button>
          </div>
        </>
      )}
    </div>
  );
}

function MonthlyStatementTab({ tenantId }: { tenantId: number }) {
  const [customerId, setCustomerId] = useState("");
  const [yearMonth, setYearMonth] = useState(currentMonth);
  const [queried, setQueried] = useState(false);

  const { data: customers = [] } = trpc.dayone.customers.list.useQuery({ tenantId });
  const [year, month] = yearMonth.split("-").map(Number);
  const { data: stmt, isLoading, refetch } = trpc.dayone.reports.monthlyStatement.useQuery(
    { tenantId, customerId: Number(customerId), year, month },
    { enabled: queried && !!customerId }
  );

  function handlePrint() {
    if (!stmt) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const orders = (stmt.orders ?? []) as any[];
    const itemsByOrder = (stmt.itemsByOrder ?? {}) as Record<number, any[]>;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>月結對帳單</title>
<style>
body{font-family:sans-serif;padding:32px;color:#1c1917;font-size:13px}
h2{font-size:18px;font-weight:700;color:#b45309;margin-bottom:4px}
h3{font-size:13px;font-weight:700;margin:20px 0 6px;color:#44403c}
table{width:100%;border-collapse:collapse;margin-top:8px}
th{background:#f5f5f4;padding:7px 10px;text-align:left;font-size:12px;color:#78716c;border-bottom:1px solid #e7e5e4}
td{padding:7px 10px;border-bottom:1px solid #f5f5f4;font-size:12px}
.right{text-align:right}.center{text-align:center}
.total-row td{font-weight:700;background:#fafaf9}
.item-row td{background:#fafaf9;font-size:11px;color:#78716c}
.info{display:flex;gap:32px;margin:12px 0;font-size:13px}
.info span{color:#78716c}
.sig{display:flex;gap:64px;margin-top:48px}
.sig-box{border-top:1px solid #000;padding-top:6px;width:200px;text-align:center;font-size:12px}
</style>
</head><body>
<h2>大永蛋品月結對帳單</h2>
<p style="color:#78716c">${year} 年 ${month} 月</p>
<div class="info">
<div><span>客戶：</span><strong>${stmt.customer?.name ?? ""}</strong></div>
<div><span>電話：</span>${stmt.customer?.phone ?? "-"}</div>
</div>
<div style="color:#78716c;font-size:12px">${stmt.customer?.address ?? ""}</div>
<h3>訂單明細</h3>
<table>
<tr><th>送達日</th><th>訂單號</th><th>品項</th><th class="right">應收</th><th class="right">已收</th><th>狀態</th></tr>
${orders.map((o: any) => {
  const items = itemsByOrder[Number(o.id)] ?? [];
  const itemStr = items.map((i: any) => `${i.productName} ×${i.qty}`).join("、") || "-";
  const tone = AR_STATUS_TONE[o.arStatus] ?? AR_STATUS_TONE.unpaid;
  return `<tr>
<td>${fmtDate(o.deliveryDate)}</td>
<td>#${o.orderNo ?? o.id}</td>
<td>${itemStr}</td>
<td class="right">${fmtMoney(o.arAmount ?? o.totalAmount)}</td>
<td class="right">${fmtMoney(o.arPaid ?? o.paidAmount)}</td>
<td>${tone.label}</td>
</tr>`;
}).join("")}
<tr class="total-row">
<td colspan="3">合計</td>
<td class="right">${fmtMoney(stmt.totalInvoiced)}</td>
<td class="right">${fmtMoney(stmt.totalPaid)}</td>
<td style="color:#dc2626">未收 ${fmtMoney(stmt.totalUnpaid)}</td>
</tr>
</table>
${stmt.dueDate ? `<p style="margin-top:12px;font-size:12px;color:#78716c">到期日：${fmtDate(stmt.dueDate)}</p>` : ""}
<div class="sig">
<div class="sig-box">客戶確認簽章</div>
<div class="sig-box">大永蛋行</div>
</div>
</body></html>`);
    win.document.close();
    win.print();
  }

  async function handleExcel() {
    if (!stmt) return;
    const XLSX = await import("xlsx");
    const orders = (stmt.orders ?? []) as any[];
    const itemsByOrder = (stmt.itemsByOrder ?? {}) as Record<number, any[]>;
    const excelRows: any[] = [
      ["大永蛋品月結對帳單", `${year}年${month}月`],
      ["客戶", stmt.customer?.name ?? ""], ["電話", stmt.customer?.phone ?? ""],
      ["地址", stmt.customer?.address ?? ""], [],
      ["送達日", "訂單號", "品項", "應收", "已收", "狀態"],
      ...orders.map((o: any) => {
        const items = itemsByOrder[Number(o.id)] ?? [];
        return [
          fmtDate(o.deliveryDate),
          `#${o.orderNo ?? o.id}`,
          items.map((i: any) => `${i.productName}×${i.qty}`).join("、") || "-",
          Number(o.arAmount ?? o.totalAmount),
          Number(o.arPaid ?? o.paidAmount),
          AR_STATUS_TONE[o.arStatus]?.label ?? o.paymentStatus ?? "-",
        ];
      }),
      [],
      ["總應收", Number(stmt.totalInvoiced)],
      ["已收", Number(stmt.totalPaid)],
      ["未收", Number(stmt.totalUnpaid)],
    ];
    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "月結對帳");
    XLSX.writeFile(wb, `大永月結_${stmt.customer?.name ?? "客戶"}_${yearMonth}.xlsx`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs text-stone-500">客戶</label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-[220px] rounded-2xl"><SelectValue placeholder="選擇客戶…" /></SelectTrigger>
            <SelectContent>
              {(customers as any[]).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-stone-500">月份</label>
          <Input type="month" className="w-[180px] rounded-2xl" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        </div>
        <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
          onClick={() => { if (!customerId) { toast.error("請先選擇客戶"); return; } setQueried(true); refetch(); }}>
          查詢
        </Button>
      </div>

      {isLoading && queried ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>
      ) : null}

      {stmt ? (
        <>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={handlePrint}>列印 / PDF</Button>
            <Button variant="outline" className="rounded-2xl" onClick={handleExcel}>匯出 Excel</Button>
          </div>

          <div className="rounded-[32px] border border-stone-200 bg-white p-6">
            <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-semibold text-amber-700">大永蛋品月結對帳單</p>
                <p className="mt-0.5 text-sm text-stone-400">Dayone Egg Products</p>
              </div>
              <p className="text-sm text-stone-500">{year} 年 {month} 月</p>
            </div>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div><p className="text-xs text-stone-400">客戶</p><p className="mt-0.5 font-semibold text-stone-900">{stmt.customer?.name}</p></div>
              <div><p className="text-xs text-stone-400">電話</p><p className="mt-0.5 text-stone-700">{stmt.customer?.phone ?? "-"}</p></div>
              <div><p className="text-xs text-stone-400">地址</p><p className="mt-0.5 text-stone-700">{stmt.customer?.address ?? "-"}</p></div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">送達日</th>
                    <th className="px-4 py-3 text-left font-medium">訂單</th>
                    <th className="px-4 py-3 text-left font-medium">品項</th>
                    <th className="px-4 py-3 text-right font-medium">應收</th>
                    <th className="px-4 py-3 text-right font-medium">已收</th>
                    <th className="px-4 py-3 text-center font-medium">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {(stmt.orders ?? []).length ? (
                    (stmt.orders as any[]).map((o: any) => {
                      const items = ((stmt.itemsByOrder ?? {}) as Record<number, any[]>)[Number(o.id)] ?? [];
                      const tone = AR_STATUS_TONE[o.arStatus] ?? AR_STATUS_TONE.unpaid;
                      return (
                        <tr key={o.id} className="border-t border-stone-200">
                          <td className="px-4 py-3">{fmtDate(o.deliveryDate)}</td>
                          <td className="px-4 py-3 text-stone-500">#{o.orderNo ?? o.id}</td>
                          <td className="px-4 py-3 text-stone-600 text-xs">
                            {items.map((i: any) => `${i.productName} ×${i.qty}`).join("、") || "-"}
                          </td>
                          <td className="px-4 py-3 text-right">{fmtMoney(o.arAmount ?? o.totalAmount)}</td>
                          <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(o.arPaid ?? o.paidAmount)}</td>
                          <td className="px-4 py-3 text-center"><Badge className={`border-0 ${tone.cls}`}>{tone.label}</Badge></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-400">這個月份沒有帳款資料。</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">總應收</span><span className="font-semibold">{fmtMoney(stmt.totalInvoiced)}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">已收</span><span className="font-semibold text-emerald-700">{fmtMoney(stmt.totalPaid)}</span></div>
              <div className="flex justify-between border-t border-stone-200 pt-2"><span className="font-semibold">未收</span><span className="text-lg font-semibold text-red-600">{fmtMoney(stmt.totalUnpaid)}</span></div>
              {stmt.dueDate && <div className="flex justify-between pt-1"><span className="text-stone-500">月結到期日</span><span className="font-semibold text-stone-700">{fmtDate(stmt.dueDate)}</span></div>}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function DayoneARContent({ tenantId }: { tenantId: number }) {
  return (
    <div className="space-y-5">
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">帳務管理</h1>
          <p className="dayone-page-subtitle">
            應收、應付、司機現金點收、空箱台帳，所有帳款節點集中在這裡管理。
          </p>
        </div>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-[24px] border border-amber-200 bg-amber-50 p-2">
          {[
            { value: "receivables", label: "應收帳款" },
            { value: "payables",    label: "應付帳款" },
            { value: "driver-cash", label: "司機日報" },
            { value: "box-ledger",  label: "空箱台帳" },
            { value: "monthly",     label: "月結對帳單" },
          ].map((t) => (
            <TabsTrigger key={t.value} value={t.value}
              className="rounded-2xl data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="receivables" className="mt-5"><ReceivableTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="payables"    className="mt-5"><PayableTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="driver-cash" className="mt-5"><DriverCashTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="box-ledger"  className="mt-5"><BoxLedgerTab tenantId={tenantId} /></TabsContent>
        <TabsContent value="monthly"     className="mt-5"><MonthlyStatementTab tenantId={tenantId} /></TabsContent>
      </Tabs>
    </div>
  );
}

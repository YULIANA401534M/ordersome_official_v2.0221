import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── helpers ────────────────────────────────────────────────────────────────

function fmtMoney(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;
}

function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const AR_STATUS: Record<string, { label: string; cls: string }> = {
  unpaid:  { label: "未付",   cls: "bg-gray-100 text-gray-700" },
  partial: { label: "部分付款", cls: "bg-orange-100 text-orange-700" },
  paid:    { label: "已付",   cls: "bg-green-100 text-green-700" },
  overdue: { label: "逾期",   cls: "bg-red-100 text-red-700" },
};

const CYCLE_LABELS: Record<string, string> = {
  per_delivery: "現付",
  weekly: "週結",
  monthly: "月結",
};

const DRIVER_STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  normal:   { label: "正常", cls: "bg-green-100 text-green-700", icon: "✓" },
  anomaly:  { label: "異常待處理", cls: "bg-red-100 text-red-700", icon: "⚠️" },
  resolved: { label: "已解決", cls: "bg-gray-100 text-gray-500", icon: "✓" },
};

// ── PayDialog ──────────────────────────────────────────────────────────────

function PayDialog({ record, tenantId, onClose, onSuccess }: { record: any; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(
    String(Math.max(0, Number(record.amount) - Number(record.paidAmount)))
  );
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [note, setNote] = useState("");

  const mut = trpc.dayone.ar.markPaid.useMutation({
    onSuccess: () => { toast.success("收款記錄成功"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("請輸入有效金額"); return; }
    mut.mutate({ id: record.id, tenantId, paymentMethod: method, paidAmount: amt, adminNote: note || undefined });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>收款 — {record.customerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-1">
          <div className="flex gap-4">
            {(["cash", "transfer"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="method" value={m} checked={method === m}
                  onChange={() => setMethod(m)} className="accent-amber-500" />
                <span className="text-sm">{m === "cash" ? "💵 現金" : "🏦 匯款"}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">收款金額 <span className="text-red-500">*</span></label>
            <Input type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">備註</label>
            <Textarea placeholder="備註（選填）" value={note}
              onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button type="submit" size="sm" disabled={mut.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white">
              {mut.isPending ? "送出中..." : "確認收款"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── ResolveDialog ──────────────────────────────────────────────────────────

function ResolveDialog({ report, tenantId, onClose, onSuccess }: { report: any; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [note, setNote] = useState("");
  const mut = trpc.dayone.ar.resolveAnomaly.useMutation({
    onSuccess: () => { toast.success("已標記解決"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>解決異常 — {report.driverName}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="text-sm text-gray-600 bg-red-50 rounded p-3">
            差額：<span className="font-bold text-red-600">{fmtMoney(report.diff)}</span>
          </div>
          <Textarea placeholder="請填寫解決說明..." value={note}
            onChange={(e) => setNote(e.target.value)} rows={3} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button size="sm" disabled={!note || mut.isPending}
              onClick={() => mut.mutate({ id: report.id, tenantId, adminNote: note })}
              className="bg-red-600 hover:bg-red-700 text-white">
              {mut.isPending ? "送出中..." : "確認解決"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── CreateCashReportDialog ─────────────────────────────────────────────────

function CreateCashReportDialog({ reportDate, tenantId, onClose, onSuccess }: { reportDate: string; tenantId: number; onClose: () => void; onSuccess: () => void }) {
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const { data: drivers } = trpc.dayone.drivers.list.useQuery({ tenantId });
  const mut = trpc.dayone.ar.createDriverCashReport.useMutation({
    onSuccess: (data) => {
      toast.success(`新增成功，差額 ${fmtMoney(data.diff)}，狀態：${data.status === "normal" ? "正常" : "異常"}`);
      onSuccess(); onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>新增司機日報 — {fmtDate(reportDate)}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <label className="text-sm font-medium mb-1 block">司機</label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger><SelectValue placeholder="選擇司機..." /></SelectTrigger>
              <SelectContent>
                {(drivers ?? []).map((d: any) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">實收金額</label>
            <Input type="number" min="0" step="0.01" placeholder="0" value={amount}
              onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">備註</label>
            <Textarea placeholder="備註..." value={note}
              onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button size="sm" disabled={!driverId || !amount || mut.isPending}
              onClick={() => mut.mutate({
                tenantId, driverId: Number(driverId), reportDate,
                actualAmount: parseFloat(amount), driverNote: note || undefined,
              })}
              className="bg-amber-500 hover:bg-amber-600 text-white">
              {mut.isPending ? "新增中..." : "新增回報"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab1: 應收帳款 ─────────────────────────────────────────────────────────

function TabAR({ tenantId }: { tenantId: number }) {
  const [customerId, setCustomerId] = useState<string>("all");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [overdueFilter, setOverdueFilter] = useState<"all" | "overdue" | "normal">("all");

  const { data: customers } = trpc.dayone.customers.list.useQuery({ tenantId });
  const { data: overdueStats = [] } = trpc.dayone.ar.customerOverdueStats.useQuery({ tenantId });
  const { data: records = [], isLoading, refetch } = trpc.dayone.ar.listReceivables.useQuery({
    tenantId,
    status: status !== "all" ? status : undefined,
    customerId: customerId !== "all" ? Number(customerId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
  });

  // 逾期客戶對應 map（customerId → overdueDays）
  const overdueMap = useMemo(() => {
    const map = new Map<number, number>();
    (overdueStats as any[]).forEach((s: any) => {
      if (s.isOverdue) map.set(s.customerId, s.overdueDays);
    });
    return map;
  }, [overdueStats]);

  const overdueCount = (overdueStats as any[]).filter((s: any) => s.isOverdue).length;

  const kpi = useMemo(() => {
    const unpaidSum = records.filter((r: any) => r.status === "unpaid" || r.status === "partial")
      .reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount), 0);
    const overdueSum = records.filter((r: any) => r.status === "overdue")
      .reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount), 0);
    const paidSum = records.filter((r: any) => r.status === "paid")
      .reduce((s: number, r: any) => s + Number(r.paidAmount), 0);
    return { unpaidSum, overdueSum, paidSum };
  }, [records]);

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500 mb-1">應收未付總額</p>
          <p className="text-2xl font-bold text-amber-600">{fmtMoney(kpi.unpaidSum)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500 mb-1">逾期未收</p>
          <p className={`text-2xl font-bold ${kpi.overdueSum > 0 ? "text-red-600" : "text-gray-400"}`}>{fmtMoney(kpi.overdueSum)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500 mb-1">逾期客戶數</p>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-gray-400"}`}>{overdueCount} 家</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-gray-500 mb-1">本頁已收</p>
          <p className="text-2xl font-bold text-green-600">{fmtMoney(kpi.paidSum)}</p>
        </CardContent></Card>
      </div>

      {/* 逾期篩選 tab */}
      <div className="flex gap-2">
        {([["all", "全部"], ["overdue", `逾期 (${overdueCount})`], ["normal", "正常"]] as const).map(([v, label]) => (
          <button key={v} onClick={() => setOverdueFilter(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              overdueFilter === v
                ? v === "overdue" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* 篩選 */}
      <div className="flex flex-wrap gap-3">
        <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="所有客戶" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有客戶</SelectItem>
            {(customers ?? []).map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="全部狀態" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="unpaid">未付</SelectItem>
            <SelectItem value="overdue">逾期</SelectItem>
            <SelectItem value="partial">部分付款</SelectItem>
            <SelectItem value="paid">已付</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-40" placeholder="開始日期" />
        <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-40" placeholder="結束日期" />
      </div>

      {/* 桌面表格 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-7 w-7 rounded-full border-b-2 border-amber-500" /></div>
      ) : !records.length ? (
        <Card><CardContent className="py-12 text-center text-gray-400">無符合條件的帳款記錄</CardContent></Card>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-gray-600 border-b">
                  <th className="text-left px-4 py-3 font-medium">客戶名稱</th>
                  <th className="text-center px-4 py-3 font-medium">結算週期</th>
                  <th className="text-right px-4 py-3 font-medium">金額</th>
                  <th className="text-right px-4 py-3 font-medium">已付</th>
                  <th className="text-right px-4 py-3 font-medium">未付</th>
                  <th className="text-center px-4 py-3 font-medium">到期日</th>
                  <th className="text-center px-4 py-3 font-medium">狀態</th>
                  <th className="text-center px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.filter((r: any) => {
                  const isOD = overdueMap.has(r.customerId);
                  if (overdueFilter === "overdue") return isOD;
                  if (overdueFilter === "normal") return !isOD;
                  return true;
                }).map((r: any) => {
                  const sc = AR_STATUS[r.status] ?? AR_STATUS.unpaid;
                  const unpaid = Number(r.amount) - Number(r.paidAmount);
                  const isExpanded = expandedId === r.id;
                  const odDays = overdueMap.get(r.customerId);
                  const isOD = odDays !== undefined;
                  return [
                    <tr key={r.id}
                      className={`border-b transition-colors cursor-pointer ${isOD ? "bg-red-50" : "hover:bg-gray-50"}`}
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {isOD && <span className="text-red-500" title={`逾期 ${odDays} 天`}>⚠️</span>}
                          {r.customerName}
                          {isOD && <Badge className="bg-red-100 text-red-700 border-0 text-xs ml-1">逾 {odDays} 天</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs">
                          {CYCLE_LABELS[r.settlementCycle ?? ""] ?? "-"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.amount)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmtMoney(r.paidAmount)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${unpaid > 0 ? "text-red-600" : "text-gray-400"}`}>{fmtMoney(unpaid)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{fmtDate(r.dueDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {r.status !== "paid" && (
                          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7"
                            onClick={() => setPayTarget(r)}>收款</Button>
                        )}
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`${r.id}-detail`} className="bg-amber-50/40">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="flex gap-6 text-xs text-gray-600">
                            {r.adminNote && (
                              <div><span className="font-medium text-gray-700">管理員備註：</span>{r.adminNote}</div>
                            )}
                            {r.customerNote && (
                              <div><span className="font-medium text-blue-600">客戶備註：</span>{r.customerNote}</div>
                            )}
                            {!r.adminNote && !r.customerNote && <div className="text-gray-400">無備註</div>}
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>

          {/* 手機卡片 */}
          <div className="md:hidden space-y-3">
            {records.filter((r: any) => {
              const isOD = overdueMap.has(r.customerId);
              if (overdueFilter === "overdue") return isOD;
              if (overdueFilter === "normal") return !isOD;
              return true;
            }).map((r: any) => {
              const sc = AR_STATUS[r.status] ?? AR_STATUS.unpaid;
              const unpaid = Number(r.amount) - Number(r.paidAmount);
              const odDays = overdueMap.get(r.customerId);
              const isOD = odDays !== undefined;
              return (
                <Card key={r.id} className={isOD ? "border-l-4 border-l-red-500" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isOD && <span className="text-red-500">⚠️</span>}
                        <p className="font-semibold text-gray-900">{r.customerName}</p>
                        {isOD && <Badge className="bg-red-100 text-red-700 border-0 text-xs">逾 {odDays} 天</Badge>}
                      </div>
                      <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><p className="text-xs text-gray-400">應收</p><p className="font-medium">{fmtMoney(r.amount)}</p></div>
                      <div><p className="text-xs text-gray-400">已付</p><p className="font-medium text-green-700">{fmtMoney(r.paidAmount)}</p></div>
                      <div><p className="text-xs text-gray-400">未付</p><p className={`font-bold ${unpaid > 0 ? "text-red-600" : "text-gray-400"}`}>{fmtMoney(unpaid)}</p></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>到期：{fmtDate(r.dueDate)}</span>
                      <Badge variant="outline" className="text-xs">{CYCLE_LABELS[r.settlementCycle ?? ""] ?? "-"}</Badge>
                    </div>
                    {(r.adminNote || r.customerNote) && (
                      <div className="text-xs space-y-1 bg-gray-50 rounded p-2">
                        {r.adminNote && <p><span className="text-gray-500">備註：</span>{r.adminNote}</p>}
                        {r.customerNote && <p><span className="text-blue-500">客戶備註：</span>{r.customerNote}</p>}
                      </div>
                    )}
                    {r.status !== "paid" && (
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => setPayTarget(r)}>收款</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 分頁 */}
          <div className="flex justify-center gap-2 pt-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
            <span className="text-sm text-gray-500 self-center">第 {page} 頁</span>
            <Button variant="outline" size="sm" disabled={records.length < 20} onClick={() => setPage(p => p + 1)}>下一頁</Button>
          </div>
        </>
      )}

      {payTarget && (
        <PayDialog record={payTarget} tenantId={tenantId} onClose={() => setPayTarget(null)} onSuccess={() => refetch()} />
      )}
    </div>
  );
}

// ── Tab2: 司機日報 ─────────────────────────────────────────────────────────

function TabDriverCash({ tenantId }: { tenantId: number }) {
  const [date, setDate] = useState(todayStr);
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: reports = [], isLoading, refetch } = trpc.dayone.ar.listDriverCashReports.useQuery({
    tenantId, reportDate: date,
  });

  const anomalyCount = (reports as any[]).filter((r: any) => r.status === "anomaly").length;

  return (
    <div className="space-y-5">
      {/* 頂部 */}
      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        {anomalyCount > 0 && (
          <Badge className="bg-red-600 text-white text-sm px-3 py-1">⚠️ {anomalyCount} 筆異常待處理</Badge>
        )}
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>+ 新增回報</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-7 w-7 rounded-full border-b-2 border-amber-500" /></div>
      ) : !(reports as any[]).length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 mb-4">當日無繳款記錄</p>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>+ 新增回報</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 桌面表格 */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 text-gray-600 border-b">
                  <th className="text-left px-4 py-3 font-medium">司機</th>
                  <th className="text-right px-4 py-3 font-medium">應收</th>
                  <th className="text-right px-4 py-3 font-medium">實收</th>
                  <th className="text-right px-4 py-3 font-medium">差額</th>
                  <th className="text-center px-4 py-3 font-medium">狀態</th>
                  <th className="text-left px-4 py-3 font-medium">備註</th>
                  <th className="text-center px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(reports as any[]).map((r: any) => {
                  const sc = DRIVER_STATUS[r.status] ?? DRIVER_STATUS.normal;
                  const diff = Number(r.diff);
                  return (
                    <tr key={r.id} className={`border-b transition-colors ${r.status === "anomaly" ? "bg-red-50" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.driverName}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.expectedAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.actualAmount)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {diff >= 0 ? "+" : ""}{fmtMoney(diff)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${sc.cls} border-0 text-xs`}>{sc.icon} {sc.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">
                        {r.adminNote || r.driverNote || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.status === "anomaly" && (
                          <Button size="sm" variant="destructive" className="text-xs h-7"
                            onClick={() => setResolveTarget(r)}>解決</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 手機卡片 */}
          <div className="md:hidden space-y-3">
            {(reports as any[]).map((r: any) => {
              const sc = DRIVER_STATUS[r.status] ?? DRIVER_STATUS.normal;
              const diff = Number(r.diff);
              return (
                <Card key={r.id} className={r.status === "anomaly" ? "border-l-4 border-l-red-500" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{r.driverName}</p>
                      <Badge className={`${sc.cls} border-0 text-xs`}>{sc.icon} {sc.label}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><p className="text-xs text-gray-400">應收</p><p className="font-medium">{fmtMoney(r.expectedAmount)}</p></div>
                      <div><p className="text-xs text-gray-400">實收</p><p className="font-medium">{fmtMoney(r.actualAmount)}</p></div>
                      <div>
                        <p className="text-xs text-gray-400">差額</p>
                        <p className={`font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400"}`}>
                          {diff >= 0 ? "+" : ""}{fmtMoney(diff)}
                        </p>
                      </div>
                    </div>
                    {(r.adminNote || r.driverNote) && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                        {r.adminNote || r.driverNote}
                      </p>
                    )}
                    {r.status === "anomaly" && (
                      <Button size="sm" variant="destructive" className="w-full"
                        onClick={() => setResolveTarget(r)}>解決異常</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {resolveTarget && (
        <ResolveDialog report={resolveTarget} tenantId={tenantId} onClose={() => setResolveTarget(null)} onSuccess={() => refetch()} />
      )}
      {showCreate && (
        <CreateCashReportDialog reportDate={date} tenantId={tenantId} onClose={() => setShowCreate(false)} onSuccess={() => refetch()} />
      )}
    </div>
  );
}

// ── Tab3: 月結對帳單 ───────────────────────────────────────────────────────

function TabStatement({ tenantId }: { tenantId: number }) {
  const [customerId, setCustomerId] = useState<string>("");
  const [yearMonth, setYearMonth] = useState(thisMonthStr);
  const [queried, setQueried] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: customers } = trpc.dayone.customers.list.useQuery({ tenantId });

  const [year, month] = yearMonth.split("-").map(Number);
  const { data: stmt, isLoading, refetch } = trpc.dayone.ar.monthlyStatement.useQuery(
    { tenantId, customerId: Number(customerId), year, month },
    { enabled: queried && !!customerId }
  );

  function handleQuery() {
    if (!customerId) { toast.error("請選擇客戶"); return; }
    setQueried(true);
    refetch();
  }

  function handlePrint() {
    window.print();
  }

  function handleExcel() {
    if (!stmt) return;
    const rows: any[] = [];
    rows.push(["大永蛋品有限公司", `對帳單 ${yearMonth}`]);
    rows.push(["客戶：", stmt.customer?.name ?? ""]);
    rows.push([]);
    rows.push(["日期", "訂單", "金額", "已付", "狀態"]);
    for (const ar of (stmt.arRecords ?? [])) {
      rows.push([
        fmtDate(ar.dueDate),
        `#${ar.orderId}`,
        Number(ar.amount),
        Number(ar.paidAmount),
        AR_STATUS[ar.status]?.label ?? ar.status,
      ]);
    }
    rows.push([]);
    rows.push(["", "總金額", stmt.totalAmount, "", ""]);
    rows.push(["", "已付", stmt.paidAmount, "", ""]);
    rows.push(["", "未付", stmt.unpaidAmount, "", ""]);
    rows.push(["空箱餘額", stmt.boxBalance]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "對帳單");
    XLSX.writeFile(wb, `大永對帳單_${stmt.customer?.name ?? "客戶"}_${yearMonth}.xlsx`);
  }

  return (
    <div className="space-y-5">
      {/* 篩選 */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">客戶</label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="選擇客戶..." /></SelectTrigger>
            <SelectContent>
              {(customers ?? []).map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">年月</label>
          <Input type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} className="w-40" />
        </div>
        <Button onClick={handleQuery} className="bg-amber-500 hover:bg-amber-600 text-white">查詢</Button>
      </div>

      {isLoading && queried && (
        <div className="flex justify-center py-12"><div className="animate-spin h-7 w-7 rounded-full border-b-2 border-amber-500" /></div>
      )}

      {stmt && (
        <>
          {/* 操作按鈕（列印時隱藏）*/}
          <div className="flex gap-2 no-print">
            <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ 列印 / PDF</Button>
            <Button variant="outline" size="sm" onClick={handleExcel}>📊 匯出 Excel</Button>
          </div>

          {/* 對帳單主體 */}
          <div ref={printRef} className="print-target bg-white rounded-xl border p-6 space-y-6">
            {/* 標頭 */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <p className="text-lg font-bold text-amber-700">大永蛋品有限公司</p>
                <p className="text-sm text-gray-500">DayOne Egg Products Co., Ltd.</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">月結對帳單</p>
                <p className="text-sm text-gray-500">{year} 年 {month} 月</p>
              </div>
            </div>

            {/* 客戶資訊 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">客戶名稱</p>
                <p className="font-semibold text-gray-900">{stmt.customer?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">電話</p>
                <p className="text-gray-700">{stmt.customer?.phone ?? "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400">地址</p>
                <p className="text-gray-700">{stmt.customer?.address ?? "-"}</p>
              </div>
            </div>

            {/* 帳款明細 */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">帳款明細</h3>
              {!(stmt.arRecords ?? []).length ? (
                <p className="text-gray-400 text-sm">本月無帳款記錄</p>
              ) : (
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600">
                      <th className="text-left px-3 py-2 font-medium">到期日</th>
                      <th className="text-left px-3 py-2 font-medium">訂單</th>
                      <th className="text-right px-3 py-2 font-medium">金額</th>
                      <th className="text-right px-3 py-2 font-medium">已付</th>
                      <th className="text-center px-3 py-2 font-medium">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stmt.arRecords ?? []).map((ar: any) => {
                      const sc = AR_STATUS[ar.status] ?? AR_STATUS.unpaid;
                      return (
                        <tr key={ar.id} className="border-b">
                          <td className="px-3 py-2 text-gray-600">{fmtDate(ar.dueDate)}</td>
                          <td className="px-3 py-2 text-gray-500 font-mono text-xs">#{ar.orderId}</td>
                          <td className="px-3 py-2 text-right text-gray-800">{fmtMoney(ar.amount)}</td>
                          <td className="px-3 py-2 text-right text-green-700">{fmtMoney(ar.paidAmount)}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* 空箱台帳 */}
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">空箱台帳</h3>
              <div className="flex gap-8 text-sm">
                <div><p className="text-xs text-gray-400">目前餘箱</p><p className="text-xl font-bold text-amber-700">{stmt.boxBalance}</p></div>
              </div>
            </div>

            {/* 合計 */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">總應收金額</span>
                <span className="font-semibold text-gray-900">{fmtMoney(stmt.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已付金額</span>
                <span className="font-semibold text-green-700">{fmtMoney(stmt.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-800">尚欠金額</span>
                <span className={`font-bold text-lg ${stmt.unpaidAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {fmtMoney(stmt.unpaidAmount)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function DayoneARContent({ tenantId }: { tenantId: number }) {
  return (
    <div className="p-4 md:p-6 space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">帳務管理</h1>

      <Tabs defaultValue="ar">
        <TabsList className="bg-amber-50 border border-amber-200">
          <TabsTrigger value="ar" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            應收帳款
          </TabsTrigger>
          <TabsTrigger value="driver" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            司機日報
          </TabsTrigger>
          <TabsTrigger value="statement" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            月結對帳單
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ar" className="mt-5">
          <TabAR tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="driver" className="mt-5">
          <TabDriverCash tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="statement" className="mt-5">
          <TabStatement tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

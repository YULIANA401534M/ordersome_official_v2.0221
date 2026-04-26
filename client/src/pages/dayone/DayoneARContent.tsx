import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function fmtMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `NT$ ${amount.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;
}

function fmtDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-TW");
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const receivableStatusTone: Record<string, { label: string; className: string }> = {
  unpaid: { label: "未收", className: "bg-stone-100 text-stone-700" },
  partial: { label: "部分付款", className: "bg-amber-100 text-amber-700" },
  paid: { label: "已收", className: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "逾期", className: "bg-red-100 text-red-700" },
};

const settlementCycleLabel: Record<string, string> = {
  per_delivery: "逐筆結",
  weekly: "週結",
  monthly: "月結",
  cash: "現金",
};

const cashReportStatusTone: Record<string, { label: string; className: string; icon: string }> = {
  normal: { label: "正常", className: "bg-emerald-100 text-emerald-700", icon: "✓" },
  anomaly: { label: "異常待處理", className: "bg-red-100 text-red-700", icon: "!" },
  resolved: { label: "已解決", className: "bg-stone-100 text-stone-600", icon: "✓" },
};

function CollectPaymentDialog({
  record,
  tenantId,
  onClose,
  onSuccess,
}: {
  record: any;
  tenantId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(Math.max(0, Number(record.amount) - Number(record.paidAmount))));
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [note, setNote] = useState("");

  const markPaid = trpc.dayone.ar.markPaid.useMutation({
    onSuccess: () => {
      toast.success("收款資料已更新");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const paidAmount = Number(amount);
    if (!paidAmount || paidAmount <= 0) {
      toast.error("請輸入有效收款金額");
      return;
    }

    markPaid.mutate({
      id: record.id,
      tenantId,
      paymentMethod: method,
      paidAmount,
      adminNote: note || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>收款登錄</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">{record.customerName}</p>
            <p className="mt-1 text-xs text-stone-500">
              應收 {fmtMoney(record.amount)} / 已收 {fmtMoney(record.paidAmount)}
            </p>
          </div>

          <div className="flex gap-4">
            {(["cash", "transfer"] as const).map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  className="accent-amber-600"
                  checked={method === item}
                  onChange={() => setMethod(item)}
                />
                {item === "cash" ? "現金" : "轉帳"}
              </label>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">收款金額</label>
            <Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea
              rows={3}
              placeholder="例如：現場收現、部分付款、轉帳尾數..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" disabled={markPaid.isPending}>
              {markPaid.isPending ? "更新中..." : "確認收款"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResolveAnomalyDialog({
  report,
  tenantId,
  onClose,
  onSuccess,
}: {
  report: any;
  tenantId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");
  const resolveAnomaly = trpc.dayone.ar.resolveAnomaly.useMutation({
    onSuccess: () => {
      toast.success("司機現金異常已標記為解決");
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>處理司機現金異常</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            差額 {fmtMoney(report.diff)}，請寫下處理結果，作為後續帳務追蹤依據。
          </div>

          <Textarea
            rows={4}
            placeholder="例如：補交現金、改列短收、主管核可調整..."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              取消
            </Button>
            <Button
              className="rounded-2xl bg-red-600 text-white hover:bg-red-700"
              disabled={!note.trim() || resolveAnomaly.isPending}
              onClick={() => resolveAnomaly.mutate({ id: report.id, tenantId, adminNote: note.trim() })}
            >
              {resolveAnomaly.isPending ? "送出中..." : "確認解決"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateCashReportDialog({
  reportDate,
  tenantId,
  onClose,
  onSuccess,
}: {
  reportDate: string;
  tenantId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const { data: drivers = [] } = trpc.dayone.drivers.list.useQuery({ tenantId });

  const createReport = trpc.dayone.ar.createDriverCashReport.useMutation({
    onSuccess: (data) => {
      toast.success(`司機日報已建立，差額 ${fmtMoney(data.diff)}`);
      onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增司機日報</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            <label className="mb-1.5 block text-sm font-medium text-stone-700">實收金額</label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">備註</label>
            <Textarea
              rows={3}
              placeholder="例如：今日代收款、司機補述..."
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
              disabled={!driverId || !amount || createReport.isPending}
              onClick={() =>
                createReport.mutate({
                  tenantId,
                  driverId: Number(driverId),
                  reportDate,
                  actualAmount: Number(amount),
                  driverNote: note || undefined,
                })
              }
            >
              {createReport.isPending ? "建立中..." : "建立日報"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceivableTab({ tenantId }: { tenantId: number }) {
  const [customerId, setCustomerId] = useState("all");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [overdueFilter, setOverdueFilter] = useState<"all" | "overdue" | "normal">("all");
  const [paymentTarget, setPaymentTarget] = useState<any>(null);

  const { data: customers = [] } = trpc.dayone.customers.list.useQuery({ tenantId });
  const { data: overdueStats = [] } = trpc.dayone.ar.customerOverdueStats.useQuery({ tenantId });
  const { data: records = [], isLoading, refetch } = trpc.dayone.ar.listReceivables.useQuery({
    tenantId,
    status: status !== "all" ? status : undefined,
    customerId: customerId !== "all" ? Number(customerId) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
  });

  const overdueMap = useMemo(() => {
    const map = new Map<number, number>();
    overdueStats.forEach((item: any) => {
      if (item.isOverdue) {
        map.set(item.customerId, Number(item.overdueDays ?? 0));
      }
    });
    return map;
  }, [overdueStats]);

  const filteredRecords = useMemo(() => {
    return records.filter((record: any) => {
      const isOverdueCustomer = overdueMap.has(record.customerId);
      if (overdueFilter === "overdue") return isOverdueCustomer;
      if (overdueFilter === "normal") return !isOverdueCustomer;
      return true;
    });
  }, [records, overdueFilter, overdueMap]);

  const kpi = useMemo(() => {
    const unpaidAmount = filteredRecords
      .filter((record: any) => record.status === "unpaid" || record.status === "partial")
      .reduce((sum: number, record: any) => sum + Number(record.amount) - Number(record.paidAmount), 0);
    const overdueAmount = filteredRecords
      .filter((record: any) => record.status === "overdue")
      .reduce((sum: number, record: any) => sum + Number(record.amount) - Number(record.paidAmount), 0);
    const paidAmount = filteredRecords
      .filter((record: any) => record.status === "paid")
      .reduce((sum: number, record: any) => sum + Number(record.paidAmount), 0);
    return {
      unpaidAmount,
      overdueAmount,
      paidAmount,
      overdueCustomers: overdueStats.filter((item: any) => item.isOverdue).length,
    };
  }, [filteredRecords, overdueStats]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[28px] border-amber-100">
          <CardContent className="pt-5">
            <p className="text-xs text-stone-500">未收總額</p>
            <p className="mt-2 dayone-kpi-value text-stone-900">{fmtMoney(kpi.unpaidAmount)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-red-100">
          <CardContent className="pt-5">
            <p className="text-xs text-red-600">逾期金額</p>
            <p className="mt-2 dayone-kpi-value text-red-700">{fmtMoney(kpi.overdueAmount)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-red-100">
          <CardContent className="pt-5">
            <p className="text-xs text-red-600">逾期客戶</p>
            <p className="mt-2 dayone-kpi-value text-red-700">{kpi.overdueCustomers}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-emerald-100">
          <CardContent className="pt-5">
            <p className="text-xs text-emerald-600">已收金額</p>
            <p className="mt-2 dayone-kpi-value text-emerald-700">{fmtMoney(kpi.paidAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all" as const, label: "全部" },
          { key: "overdue" as const, label: `逾期 (${kpi.overdueCustomers})` },
          { key: "normal" as const, label: "正常" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              overdueFilter === item.key
                ? item.key === "overdue"
                  ? "bg-red-600 text-white"
                  : "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            onClick={() => setOverdueFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={customerId} onValueChange={(value) => { setCustomerId(value); setPage(1); }}>
          <SelectTrigger className="w-[180px] rounded-2xl">
            <SelectValue placeholder="所有客戶" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有客戶</SelectItem>
            {customers.map((customer: any) => (
              <SelectItem key={customer.id} value={String(customer.id)}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-2xl">
            <SelectValue placeholder="全部狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="unpaid">未收</SelectItem>
            <SelectItem value="partial">部分付款</SelectItem>
            <SelectItem value="paid">已收</SelectItem>
            <SelectItem value="overdue">逾期</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[170px] rounded-2xl"
          value={startDate}
          onChange={(event) => { setStartDate(event.target.value); setPage(1); }}
        />
        <Input
          type="date"
          className="w-[170px] rounded-2xl"
          value={endDate}
          onChange={(event) => { setEndDate(event.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : !filteredRecords.length ? (
        <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">
          目前沒有符合條件的應收資料。
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">客戶</th>
                  <th className="px-4 py-3 text-center font-medium">結帳週期</th>
                  <th className="px-4 py-3 text-right font-medium">應收</th>
                  <th className="px-4 py-3 text-right font-medium">已收</th>
                  <th className="px-4 py-3 text-right font-medium">未收</th>
                  <th className="px-4 py-3 text-center font-medium">到期日</th>
                  <th className="px-4 py-3 text-center font-medium">狀態</th>
                  <th className="px-4 py-3 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record: any) => {
                  const statusTone = receivableStatusTone[record.status] ?? receivableStatusTone.unpaid;
                  const unpaid = Number(record.amount) - Number(record.paidAmount);
                  const overdueDays = overdueMap.get(record.customerId);
                  return (
                    <tr key={record.id} className={`border-t border-stone-200 ${overdueDays ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900">{record.customerName}</span>
                          {overdueDays ? (
                            <Badge className="border-0 bg-red-100 text-red-700">逾 {overdueDays} 天</Badge>
                          ) : null}
                        </div>
                        {record.customerNote || record.adminNote ? (
                          <p className="mt-1 text-xs text-stone-400">{record.customerNote || record.adminNote}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="outline">{settlementCycleLabel[record.settlementCycle ?? ""] ?? "-"}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(record.amount)}</td>
                      <td className="px-4 py-4 text-right text-emerald-700">{fmtMoney(record.paidAmount)}</td>
                      <td className={`px-4 py-4 text-right font-semibold ${unpaid > 0 ? "text-red-600" : "text-stone-400"}`}>
                        {fmtMoney(unpaid)}
                      </td>
                      <td className="px-4 py-4 text-center text-stone-700">{fmtDate(record.dueDate)}</td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {record.status !== "paid" ? (
                          <Button
                            size="sm"
                            className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                            onClick={() => setPaymentTarget(record)}
                          >
                            收款
                          </Button>
                        ) : (
                          <span className="text-xs text-stone-400">已結清</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredRecords.map((record: any) => {
              const statusTone = receivableStatusTone[record.status] ?? receivableStatusTone.unpaid;
              const unpaid = Number(record.amount) - Number(record.paidAmount);
              const overdueDays = overdueMap.get(record.customerId);
              return (
                <article key={record.id} className="dayone-mobile-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-stone-900">{record.customerName}</h2>
                        {overdueDays ? <Badge className="border-0 bg-red-100 text-red-700">逾 {overdueDays} 天</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-stone-400">
                        到期日 {fmtDate(record.dueDate)} · {settlementCycleLabel[record.settlementCycle ?? ""] ?? "-"}
                      </p>
                    </div>
                    <Badge className={`border-0 ${statusTone.className}`}>{statusTone.label}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-stone-500">應收</p>
                      <p className="mt-1 font-semibold text-stone-900">{fmtMoney(record.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">已收</p>
                      <p className="mt-1 font-semibold text-emerald-700">{fmtMoney(record.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">未收</p>
                      <p className={`mt-1 font-semibold ${unpaid > 0 ? "text-red-600" : "text-stone-400"}`}>{fmtMoney(unpaid)}</p>
                    </div>
                  </div>

                  {record.customerNote || record.adminNote ? (
                    <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-500">
                      {record.customerNote || record.adminNote}
                    </div>
                  ) : null}

                  {record.status !== "paid" ? (
                    <Button
                      className="mt-4 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                      onClick={() => setPaymentTarget(record)}
                    >
                      收款
                    </Button>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" className="rounded-2xl" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
              上一頁
            </Button>
            <span className="text-sm text-stone-500">第 {page} 頁</span>
            <Button
              variant="outline"
              className="rounded-2xl"
              disabled={records.length < 20}
              onClick={() => setPage((value) => value + 1)}
            >
              下一頁
            </Button>
          </div>
        </>
      )}

      {paymentTarget ? (
        <CollectPaymentDialog
          record={paymentTarget}
          tenantId={tenantId}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => refetch()}
        />
      ) : null}
    </div>
  );
}

function DriverCashTab({ tenantId }: { tenantId: number }) {
  const [date, setDate] = useState(todayStr);
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { data: reports = [], isLoading, refetch } = trpc.dayone.ar.listDriverCashReports.useQuery({
    tenantId,
    reportDate: date,
  });

  const anomalyCount = reports.filter((report: any) => report.status === "anomaly").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="date" className="w-[180px] rounded-2xl" value={date} onChange={(event) => setDate(event.target.value)} />
        {anomalyCount > 0 ? (
          <Badge className="border-0 bg-red-100 text-red-700">{anomalyCount} 筆異常待處理</Badge>
        ) : null}
        <div className="ml-auto">
          <Button variant="outline" className="rounded-2xl" onClick={() => setShowCreate(true)}>
            新增回報
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : !reports.length ? (
        <div className="rounded-3xl border border-dashed border-stone-200 px-6 py-16 text-center text-stone-400">
          這一天尚未建立司機現金日報。
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[28px] border border-stone-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">司機</th>
                  <th className="px-4 py-3 text-right font-medium">應收現金</th>
                  <th className="px-4 py-3 text-right font-medium">實收現金</th>
                  <th className="px-4 py-3 text-right font-medium">差額</th>
                  <th className="px-4 py-3 text-center font-medium">狀態</th>
                  <th className="px-4 py-3 text-left font-medium">備註</th>
                  <th className="px-4 py-3 text-center font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: any) => {
                  const tone = cashReportStatusTone[report.status] ?? cashReportStatusTone.normal;
                  const diff = Number(report.diff ?? 0);
                  return (
                    <tr key={report.id} className={`border-t border-stone-200 ${report.status === "anomaly" ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-4 font-semibold text-stone-900">{report.driverName}</td>
                      <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(report.expectedAmount)}</td>
                      <td className="px-4 py-4 text-right text-stone-900">{fmtMoney(report.actualAmount)}</td>
                      <td className={`px-4 py-4 text-right font-semibold ${diff < 0 ? "text-red-600" : diff > 0 ? "text-emerald-700" : "text-stone-500"}`}>
                        {diff > 0 ? "+" : ""}
                        {fmtMoney(diff)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`border-0 ${tone.className}`}>
                          {tone.icon} {tone.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-stone-500">{report.adminNote || report.driverNote || "-"}</td>
                      <td className="px-4 py-4 text-center">
                        {report.status === "anomaly" ? (
                          <Button variant="destructive" size="sm" className="rounded-2xl" onClick={() => setResolveTarget(report)}>
                            解決
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {reports.map((report: any) => {
              const tone = cashReportStatusTone[report.status] ?? cashReportStatusTone.normal;
              const diff = Number(report.diff ?? 0);
              return (
                <article key={report.id} className="dayone-mobile-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-stone-900">{report.driverName}</h2>
                    <Badge className={`border-0 ${tone.className}`}>
                      {tone.icon} {tone.label}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-stone-500">應收現金</p>
                      <p className="mt-1 font-semibold text-stone-900">{fmtMoney(report.expectedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">實收現金</p>
                      <p className="mt-1 font-semibold text-stone-900">{fmtMoney(report.actualAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">差額</p>
                      <p className={`mt-1 font-semibold ${diff < 0 ? "text-red-600" : diff > 0 ? "text-emerald-700" : "text-stone-500"}`}>
                        {diff > 0 ? "+" : ""}
                        {fmtMoney(diff)}
                      </p>
                    </div>
                  </div>

                  {report.adminNote || report.driverNote ? (
                    <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-500">
                      {report.adminNote || report.driverNote}
                    </div>
                  ) : null}

                  {report.status === "anomaly" ? (
                    <Button variant="destructive" className="mt-4 w-full rounded-2xl" onClick={() => setResolveTarget(report)}>
                      解決異常
                    </Button>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}

      {resolveTarget ? (
        <ResolveAnomalyDialog
          report={resolveTarget}
          tenantId={tenantId}
          onClose={() => setResolveTarget(null)}
          onSuccess={() => refetch()}
        />
      ) : null}

      {showCreate ? (
        <CreateCashReportDialog
          reportDate={date}
          tenantId={tenantId}
          onClose={() => setShowCreate(false)}
          onSuccess={() => refetch()}
        />
      ) : null}
    </div>
  );
}

function MonthlyStatementTab({ tenantId }: { tenantId: number }) {
  const [customerId, setCustomerId] = useState("");
  const [yearMonth, setYearMonth] = useState(currentMonth);
  const [queried, setQueried] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: customers = [] } = trpc.dayone.customers.list.useQuery({ tenantId });

  const [year, month] = yearMonth.split("-").map(Number);
  const { data: statement, isLoading, refetch } = trpc.dayone.ar.monthlyStatement.useQuery(
    { tenantId, customerId: Number(customerId), year, month },
    { enabled: queried && !!customerId }
  );

  function handleQuery() {
    if (!customerId) {
      toast.error("請先選擇客戶");
      return;
    }
    setQueried(true);
    refetch();
  }

  function handlePrint() {
    window.print();
  }

  function handleExcel() {
    if (!statement) return;

    const rows: any[] = [];
    rows.push(["大永蛋品月結對帳單", yearMonth]);
    rows.push(["客戶", statement.customer?.name ?? ""]);
    rows.push(["電話", statement.customer?.phone ?? ""]);
    rows.push(["地址", statement.customer?.address ?? ""]);
    rows.push([]);
    rows.push(["到期日", "訂單編號", "應收", "已收", "狀態"]);

    for (const record of statement.arRecords ?? []) {
      rows.push([
        fmtDate(record.dueDate),
        `#${record.orderId}`,
        Number(record.amount),
        Number(record.paidAmount),
        receivableStatusTone[record.status]?.label ?? record.status,
      ]);
    }

    rows.push([]);
    rows.push(["總應收", Number(statement.totalAmount ?? 0)]);
    rows.push(["已收", Number(statement.paidAmount ?? 0)]);
    rows.push(["未收", Number(statement.unpaidAmount ?? 0)]);
    rows.push(["空箱結存", Number(statement.boxBalance ?? 0)]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "月結對帳");
    XLSX.writeFile(workbook, `大永月結_${statement.customer?.name ?? "客戶"}_${yearMonth}.xlsx`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs text-stone-500">客戶</label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-[220px] rounded-2xl">
              <SelectValue placeholder="選擇客戶..." />
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
          <label className="mb-1.5 block text-xs text-stone-500">月份</label>
          <Input type="month" className="w-[180px] rounded-2xl" value={yearMonth} onChange={(event) => setYearMonth(event.target.value)} />
        </div>
        <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={handleQuery}>
          查詢
        </Button>
      </div>

      {isLoading && queried ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : null}

      {statement ? (
        <>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={handlePrint}>
              列印 / PDF
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={handleExcel}>
              匯出 Excel
            </Button>
          </div>

          <div ref={printRef} className="rounded-[32px] border border-stone-200 bg-white p-6">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-semibold text-amber-700">大永蛋品月結對帳單</p>
                <p className="mt-1 text-sm text-stone-500">Dayone Egg Products</p>
              </div>
              <div className="text-sm text-stone-500">
                <p>{year} 年 {month} 月</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-stone-500">客戶</p>
                <p className="mt-1 font-semibold text-stone-900">{statement.customer?.name}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">電話</p>
                <p className="mt-1 text-stone-700">{statement.customer?.phone ?? "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-stone-500">地址</p>
                <p className="mt-1 text-stone-700">{statement.customer?.address ?? "-"}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">到期日</th>
                    <th className="px-4 py-3 text-left font-medium">訂單</th>
                    <th className="px-4 py-3 text-right font-medium">應收</th>
                    <th className="px-4 py-3 text-right font-medium">已收</th>
                    <th className="px-4 py-3 text-center font-medium">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {(statement.arRecords ?? []).length ? (
                    statement.arRecords.map((record: any) => {
                      const tone = receivableStatusTone[record.status] ?? receivableStatusTone.unpaid;
                      return (
                        <tr key={record.id} className="border-t border-stone-200">
                          <td className="px-4 py-3 text-stone-700">{fmtDate(record.dueDate)}</td>
                          <td className="px-4 py-3 text-stone-500">#{record.orderId}</td>
                          <td className="px-4 py-3 text-right text-stone-900">{fmtMoney(record.amount)}</td>
                          <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(record.paidAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`border-0 ${tone.className}`}>{tone.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                        這個月份沒有帳款資料。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-amber-100 bg-amber-50 px-4 py-4">
                <p className="text-xs text-amber-700">空箱台帳</p>
                <p className="mt-2 dayone-kpi-value text-amber-700">{Number(statement.boxBalance ?? 0)}</p>
              </div>
              <div className="space-y-2 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">總應收</span>
                  <span className="font-semibold text-stone-900">{fmtMoney(statement.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">已收</span>
                  <span className="font-semibold text-emerald-700">{fmtMoney(statement.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                  <span className="font-semibold text-stone-900">未收</span>
                  <span className="text-lg font-semibold text-red-600">{fmtMoney(statement.unpaidAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function DayoneARContent({ tenantId }: { tenantId: number }) {
  return (
    <div className="space-y-5">
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">帳務管理</h1>
          <p className="dayone-page-subtitle">
            這裡統一處理客戶應收、司機現金日報與月結對帳單，避免帳款節點分散在多個頁面難以追蹤。
          </p>
        </div>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList className="flex h-auto flex-wrap gap-2 rounded-[24px] border border-amber-200 bg-amber-50 p-2">
          <TabsTrigger
            value="receivables"
            className="rounded-2xl data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            應收帳款
          </TabsTrigger>
          <TabsTrigger
            value="driver-cash"
            className="rounded-2xl data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            司機日報
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="rounded-2xl data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            月結對帳單
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="mt-5">
          <ReceivableTab tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="driver-cash" className="mt-5">
          <DriverCashTab tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="monthly" className="mt-5">
          <MonthlyStatementTab tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

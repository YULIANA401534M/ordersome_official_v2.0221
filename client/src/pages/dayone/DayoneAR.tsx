import { useState, useMemo } from "react";
import { DayoneLayout } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────

function fmtMoney(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "-";
  const d = new Date(v);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  monthly: "月結",
  weekly: "週結",
  cash: "現付",
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; cls: string }
> = {
  paid: { label: "已付", cls: "bg-green-100 text-green-700" },
  partial: { label: "部分付款", cls: "bg-amber-100 text-amber-700" },
  unpaid: { label: "未付", cls: "bg-red-100 text-red-700" },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "現金",
  transfer: "銀行轉帳",
  offset: "沖帳",
};

// ── PaymentDialog ──────────────────────────────────────────────────────────

function PaymentDialog({
  customer,
  unpaidOrders,
  onClose,
  onSuccess,
}: {
  customer: any;
  unpaidOrders: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [orderId, setOrderId] = useState<string>("none");
  const [method, setMethod] = useState<"cash" | "transfer" | "offset">("cash");
  const [note, setNote] = useState("");

  const recordPayment = trpc.dayone.ar.recordPayment.useMutation({
    onSuccess: () => {
      toast.success("收款記錄成功");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("請輸入有效金額");
      return;
    }
    recordPayment.mutate({
      customerId: customer.customerId,
      orderId: orderId !== "none" ? Number(orderId) : undefined,
      amount: amt,
      paymentMethod: method,
      note: note || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>記錄收款 — {customer.customerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 金額 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              收款金額 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="請輸入金額"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* 關聯訂單 */}
          {unpaidOrders.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                關聯訂單（可選）
              </label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇訂單（可不選）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不指定訂單</SelectItem>
                  {unpaidOrders.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.orderNo} — {fmtDate(o.deliveryDate)} —{" "}
                      {fmtMoney(Number(o.totalAmount) - Number(o.paidAmount))} 未付
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 收款方式 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              收款方式
            </label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as typeof method)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="transfer">銀行轉帳</SelectItem>
                <SelectItem value="offset">沖帳</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 備註 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              備註
            </label>
            <Input
              placeholder="備註（選填）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "送出中..." : "確認收款"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CustomerDetailDialog ───────────────────────────────────────────────────

function CustomerDetailDialog({
  customer,
  onClose,
}: {
  customer: any;
  onClose: () => void;
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const {
    data: orders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = trpc.dayone.ar.getCustomerOrders.useQuery(
    { customerId: customer.customerId },
    { enabled: !!customer }
  );

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } =
    trpc.dayone.ar.getPaymentHistory.useQuery(
      { customerId: customer.customerId },
      { enabled: !!customer }
    );

  const unpaidOrders = useMemo(
    () =>
      (orders ?? []).filter(
        (o: any) => o.paymentStatus === "unpaid" || o.paymentStatus === "partial"
      ),
    [orders]
  );

  function handlePaymentSuccess() {
    refetchOrders();
    refetchHistory();
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客戶帳務詳情</DialogTitle>
          </DialogHeader>

          {/* 客戶資訊卡 */}
          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">客戶名稱</span>
              <p className="font-semibold text-gray-900">{customer.customerName}</p>
            </div>
            <div>
              <span className="text-gray-500">電話</span>
              <p className="text-gray-800">{customer.phone ?? "-"}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">地址</span>
              <p className="text-gray-800">{customer.address ?? "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">付款方式</span>
              <p className="text-gray-800">
                {PAYMENT_TYPE_LABELS[customer.paymentType] ?? customer.paymentType}
              </p>
            </div>
            <div>
              <span className="text-gray-500">信用額度</span>
              <p className="text-gray-800">{fmtMoney(customer.creditLimit)}</p>
            </div>
            <div>
              <span className="text-gray-500">未付金額</span>
              <p className={`font-bold text-base ${Number(customer.outstanding) > 0 ? "text-red-600" : "text-green-600"}`}>
                {fmtMoney(customer.outstanding)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">逾期訂單數</span>
              <p className={`font-semibold ${Number(customer.overdueOrders) > 0 ? "text-red-600" : "text-gray-700"}`}>
                {customer.overdueOrders} 筆
              </p>
            </div>
          </div>

          {/* 記錄收款按鈕 */}
          <div className="flex justify-end">
            <Button onClick={() => setShowPaymentForm(true)} className="bg-blue-600 hover:bg-blue-700">
              + 記錄收款
            </Button>
          </div>

          {/* 訂單列表 */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">訂單記錄</h3>
            {ordersLoading ? (
              <div className="text-center py-6 text-gray-400">載入中...</div>
            ) : !orders?.length ? (
              <div className="text-center py-6 text-gray-400 text-sm">尚無訂單</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600">
                      <th className="text-left px-3 py-2 font-medium">訂單編號</th>
                      <th className="text-left px-3 py-2 font-medium">配送日</th>
                      <th className="text-right px-3 py-2 font-medium">總金額</th>
                      <th className="text-right px-3 py-2 font-medium">已付</th>
                      <th className="text-center px-3 py-2 font-medium">付款狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o: any) => {
                      const sc =
                        PAYMENT_STATUS_CONFIG[o.paymentStatus] ??
                        PAYMENT_STATUS_CONFIG.unpaid;
                      return (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">
                            {o.orderNo}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {fmtDate(o.deliveryDate)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-800">
                            {fmtMoney(o.totalAmount)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-800">
                            {fmtMoney(o.paidAmount)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={`${sc.cls} border-0 text-xs`}>
                              {sc.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 收款紀錄歷史 */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">收款紀錄</h3>
            {historyLoading ? (
              <div className="text-center py-4 text-gray-400">載入中...</div>
            ) : !history?.length ? (
              <div className="text-center py-4 text-gray-400 text-sm">尚無收款紀錄</div>
            ) : (
              <div className="space-y-2">
                {history.map((h: any) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700">
                          {fmtMoney(h.amount)}
                        </span>
                        <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">
                          {METHOD_LABELS[h.paymentMethod] ?? h.paymentMethod}
                        </Badge>
                        {h.orderNo && (
                          <span className="text-gray-500 text-xs">
                            #{h.orderNo}
                          </span>
                        )}
                      </div>
                      {h.note && (
                        <p className="text-gray-500 text-xs">{h.note}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs whitespace-nowrap">
                      {fmtDateTime(h.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showPaymentForm && (
        <PaymentDialog
          customer={customer}
          unpaidOrders={unpaidOrders}
          onClose={() => setShowPaymentForm(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function DayoneAR() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unpaid" | "overdue">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: summary, isLoading, refetch } = trpc.dayone.ar.getARSummary.useQuery();

  // ── 統計卡片數值 ──
  const stats = useMemo(() => {
    if (!summary) return { totalAmount: 0, totalOutstanding: 0, overdueCount: 0, thisMonthPaid: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return {
      totalAmount: summary.reduce((s: number, c: any) => s + Number(c.totalAmount), 0),
      totalOutstanding: summary.reduce((s: number, c: any) => s + Number(c.outstanding), 0),
      overdueCount: summary.filter((c: any) => Number(c.overdueOrders) > 0).length,
      // 本月收款：暫用前端統計（後端未開獨立查詢）
      thisMonthPaid: 0,
    };
  }, [summary]);

  // ── 篩選後列表 ──
  const filtered = useMemo(() => {
    if (!summary) return [];
    return summary.filter((c: any) => {
      const matchSearch =
        !search ||
        c.customerName.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "unpaid" && Number(c.outstanding) > 0) ||
        (filter === "overdue" && Number(c.overdueOrders) > 0);
      return matchSearch && matchFilter;
    });
  }, [summary, search, filter]);

  return (
    <DayoneLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">應收帳款</h1>

        {/* ── 統計卡片 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 mb-1">總應收金額</p>
              <p className="text-2xl font-bold text-gray-900">
                {fmtMoney(stats.totalAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 mb-1">未收金額</p>
              <p className={`text-2xl font-bold ${stats.totalOutstanding > 0 ? "text-red-600" : "text-gray-900"}`}>
                {fmtMoney(stats.totalOutstanding)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 mb-1">逾期客戶數</p>
              <p className={`text-2xl font-bold ${stats.overdueCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                {stats.overdueCount} 位
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 mb-1">本月收款</p>
              <p className="text-2xl font-bold text-green-700">
                {fmtMoney(stats.thisMonthPaid)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── 搜尋 & 篩選 ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="搜尋客戶名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            {(["all", "unpaid", "overdue"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {{ all: "全部", unpaid: "未付", overdue: "逾期" }[f]}
              </button>
            ))}
          </div>
        </div>

        {/* ── 客戶列表 ── */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filtered.length ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              無符合條件的客戶
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 桌面表格 */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500 font-normal">
                  共 {filtered.length} 位客戶
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600">
                        <th className="text-left px-4 py-3 font-medium">客戶名稱</th>
                        <th className="text-left px-4 py-3 font-medium">電話</th>
                        <th className="text-center px-4 py-3 font-medium">付款方式</th>
                        <th className="text-right px-4 py-3 font-medium">總應收</th>
                        <th className="text-right px-4 py-3 font-medium">已付</th>
                        <th className="text-right px-4 py-3 font-medium">未付</th>
                        <th className="text-center px-4 py-3 font-medium">逾期訂單</th>
                        <th className="text-center px-4 py-3 font-medium">最後下單日</th>
                        <th className="text-center px-4 py-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c: any) => {
                        const isOverdue = Number(c.overdueOrders) > 0;
                        return (
                          <tr
                            key={c.customerId}
                            className={`border-b transition-colors ${
                              isOverdue
                                ? "bg-red-50 border-l-4 border-l-red-500"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {c.customerName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {c.phone ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {PAYMENT_TYPE_LABELS[c.paymentType] ?? c.paymentType}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-800">
                              {fmtMoney(c.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-green-700">
                              {fmtMoney(c.totalPaid)}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${Number(c.outstanding) > 0 ? "text-red-600" : "text-gray-400"}`}>
                              {fmtMoney(c.outstanding)}
                            </td>
                            <td className={`px-4 py-3 text-center font-medium ${isOverdue ? "text-red-600" : "text-gray-400"}`}>
                              {c.overdueOrders}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-500">
                              {fmtDate(c.lastOrderDate)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCustomer(c)}
                              >
                                查看
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 平板 / 手機卡片 */}
            <div className="lg:hidden grid sm:grid-cols-2 gap-3">
              {filtered.map((c: any) => {
                const isOverdue = Number(c.overdueOrders) > 0;
                return (
                  <Card
                    key={c.customerId}
                    className={`${isOverdue ? "border-l-4 border-l-red-500" : ""}`}
                  >
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {c.customerName}
                          </p>
                          <p className="text-xs text-gray-500">{c.phone ?? "-"}</p>
                        </div>
                        <Badge
                          className={`text-xs border-0 ${
                            PAYMENT_TYPE_LABELS[c.paymentType] === "月結"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {PAYMENT_TYPE_LABELS[c.paymentType] ?? c.paymentType}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">總應收</p>
                          <p className="font-medium text-gray-800">
                            {fmtMoney(c.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">已付</p>
                          <p className="font-medium text-green-700">
                            {fmtMoney(c.totalPaid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">未付</p>
                          <p className={`font-bold ${Number(c.outstanding) > 0 ? "text-red-600" : "text-gray-400"}`}>
                            {fmtMoney(c.outstanding)}
                          </p>
                        </div>
                      </div>

                      {isOverdue && (
                        <p className="text-xs text-red-600 font-medium">
                          ⚠ 逾期 {c.overdueOrders} 筆訂單
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedCustomer(c)}
                      >
                        查看詳情
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 客戶詳細 Dialog */}
      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          onClose={() => {
            setSelectedCustomer(null);
            refetch();
          }}
        />
      )}
    </DayoneLayout>
  );
}

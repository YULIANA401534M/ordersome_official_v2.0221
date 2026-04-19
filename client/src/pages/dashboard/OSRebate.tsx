import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calculator, CheckCircle, CreditCard, TrendingDown } from "lucide-react";

const now = new Date();
const DEFAULT_YEAR = now.getFullYear();
const DEFAULT_MONTH = now.getMonth() + 1;

function formatAmount(n: number | string) {
  return Number(n).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

const REBATE_TYPE_LABEL: Record<string, string> = {
  percentage: "百分比",
  fixed: "固定差價",
  offset: "抵貨款",
};

const REBATE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  calculated: { label: "待確認", className: "bg-gray-100 text-gray-700" },
  confirmed: { label: "已確認", className: "bg-blue-100 text-blue-700" },
  received: { label: "已收款", className: "bg-green-100 text-green-700" },
  offset: { label: "已抵扣", className: "bg-teal-100 text-teal-700" },
};

const PAYABLE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "未付", className: "bg-yellow-100 text-yellow-800" },
  partial: { label: "部分付", className: "bg-orange-100 text-orange-800" },
  paid: { label: "已付", className: "bg-green-100 text-green-800" },
  cancelled: { label: "取消", className: "bg-gray-100 text-gray-700" },
};

export default function OSRebate() {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);

  // 確認收款 dialog
  const [receivedDialog, setReceivedDialog] = useState<{ open: boolean; id: number; supplierName: string } | null>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivedNote, setReceivedNote] = useState("");

  // 付款 dialog
  const [paidDialog, setPaidDialog] = useState<{ open: boolean; id: number; supplierName: string; netPayable: number } | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState("");
  const [paidNote, setPaidNote] = useState("");

  const { data: rebates = [], refetch: refetchRebates, isLoading: loadingRebates } = trpc.osRebate.list.useQuery({ year, month });
  const { data: payables = [], refetch: refetchPayables, isLoading: loadingPayables } = trpc.osRebate.payableList.useQuery({ year, month });

  // 查 os_rebates（accounting 路由寫入的正確資料）
  const { data: rebatesFromAccounting = [], refetch: refetchRebates2 } =
    trpc.accounting.listRebates.useQuery({ month: `${year}-${String(month).padStart(2, '0')}` });

  const calculateMutation = trpc.osRebate.calculate.useMutation({
    onSuccess: (data) => {
      toast.success(`計算完成，共 ${data.count} 筆廠商`);
      refetchRebates();
      refetchPayables();
    },
    onError: (e) => toast.error(e.message || "計算失敗"),
  });

  // 使用 accounting.calculateRebates 計算並寫入 os_rebates
  const calcRebatesMut = trpc.accounting.calculateRebates.useMutation({
    onSuccess: (d: any) => { toast.success(d.message || "退佣計算完成"); refetchRebates2(); },
    onError: (e: any) => toast.error(e.message || "計算失敗"),
  });

  const confirmReceivedMutation = trpc.osRebate.confirmReceived.useMutation({
    onSuccess: () => {
      toast.success("已標記收款");
      setReceivedDialog(null);
      refetchRebates();
    },
    onError: (e) => toast.error(e.message || "操作失敗"),
  });

  const markPaidMutation = trpc.osRebate.markPaid.useMutation({
    onSuccess: () => {
      toast.success("已標記付款");
      setPaidDialog(null);
      refetchPayables();
    },
    onError: (e) => toast.error(e.message || "操作失敗"),
  });

  const totalRebate = rebates.reduce((s: number, r: any) => s + Number(r.rebateAmount || 0), 0);
  const totalPayable = payables.reduce((s: number, p: any) => s + Number(p.netPayable || 0), 0);
  const totalPaid = payables.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.paidAmount || 0), 0);

  const yearOptions = [DEFAULT_YEAR - 1, DEFAULT_YEAR, DEFAULT_YEAR + 1];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <AdminDashboardLayout>
      <div className="py-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown className="h-7 w-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">退佣帳款管理</h1>
            <p className="text-sm text-gray-500">廠商退佣自動計算 · 應付帳款月結</p>
          </div>
        </div>

        {/* 年月選擇 + 計算按鈕 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m} 月</option>
            ))}
          </select>
          <Button
            onClick={() => calculateMutation.mutate({ year, month })}
            disabled={calculateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {calculateMutation.isPending ? "計算中..." : "重新計算退佣"}
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-xs gap-1"
            disabled={calcRebatesMut.isPending}
            onClick={() => calcRebatesMut.mutate({ month: `${year}-${String(month).padStart(2, '0')}` })}>
            <Calculator className="w-3.5 h-3.5" /> 計算本月退佣(os_rebates)
          </Button>
        </div>

        <Tabs defaultValue="rebate">
          <TabsList className="mb-4">
            <TabsTrigger value="rebate">退佣管理</TabsTrigger>
            <TabsTrigger value="payable">應付帳款</TabsTrigger>
          </TabsList>

          {/* ── 退佣管理 Tab ── */}
          <TabsContent value="rebate">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingRebates ? (
                <div className="p-8 text-center text-gray-500">載入中...</div>
              ) : rebates.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>尚無退佣記錄，請點「重新計算退佣」</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">廠商</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">退佣類型</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">本月叫貨</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">退佣金額</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">狀態</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rebates.map((r: any) => {
                      const statusCfg = REBATE_STATUS_CONFIG[r.status] || REBATE_STATUS_CONFIG.calculated;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{r.supplierName}</td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600">{REBATE_TYPE_LABEL[r.rebateType] || r.rebateType}</span>
                            {r.rebateType === "percentage" && (
                              <span className="ml-1 text-xs text-gray-400">({(Number(r.rebateRate) * 100).toFixed(2)}%)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">$ {formatAmount(r.totalPurchaseAmount)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">$ {formatAmount(r.rebateAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(r.status === "calculated" || r.status === "confirmed") && r.rebateType !== "offset" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => {
                                  setReceivedDialog({ open: true, id: r.id, supplierName: r.supplierName });
                                  setReceivedDate(new Date().toISOString().slice(0, 10));
                                  setReceivedNote("");
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                確認收款
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">本月退佣總計</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">$ {formatAmount(totalRebate)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </TabsContent>

          {/* ── 應付帳款 Tab ── */}
          <TabsContent value="payable">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {loadingPayables ? (
                <div className="p-8 text-center text-gray-500">載入中...</div>
              ) : payables.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>尚無應付帳款記錄，請先計算退佣</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">廠商</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">月結總額</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">退佣抵扣</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">實際應付</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">狀態</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">付款日期</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payables.map((p: any) => {
                      const statusCfg = PAYABLE_STATUS_CONFIG[p.status] || PAYABLE_STATUS_CONFIG.pending;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.supplierName}</td>
                          <td className="px-4 py-3 text-right text-gray-700">$ {formatAmount(p.totalAmount)}</td>
                          <td className="px-4 py-3 text-right text-teal-600">
                            {Number(p.rebateOffset) > 0 ? `- $ ${formatAmount(p.rebateOffset)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">$ {formatAmount(p.netPayable)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {p.paidDate ? new Date(p.paidDate).toLocaleDateString("zh-TW") : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.status !== "paid" && p.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => {
                                  setPaidDialog({ open: true, id: p.id, supplierName: p.supplierName, netPayable: Number(p.netPayable) });
                                  setPaidDate(new Date().toISOString().slice(0, 10));
                                  setPaidAmount(String(Math.round(Number(p.netPayable))));
                                  setPaidNote("");
                                }}
                              >
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                標記已付
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">本月合計</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">$ {formatAmount(totalPayable)}</td>
                      <td colSpan={2} className="px-4 py-3 text-right text-sm text-gray-500">
                        已付 $ {formatAmount(totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        未付 $ {formatAmount(totalPayable - totalPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 確認收款 Dialog */}
        {receivedDialog?.open && (
          <Dialog open onOpenChange={() => setReceivedDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>確認收款 — {receivedDialog.supplierName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">收款日期</label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">銀行備註（選填）</label>
                  <input
                    type="text"
                    value={receivedNote}
                    onChange={(e) => setReceivedNote(e.target.value)}
                    placeholder="例：匯款單號或備忘"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReceivedDialog(null)}>取消</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={confirmReceivedMutation.isPending}
                  onClick={() => confirmReceivedMutation.mutate({
                    id: receivedDialog.id,
                    receivedDate,
                    bankTxNote: receivedNote || undefined,
                  })}
                >
                  {confirmReceivedMutation.isPending ? "儲存中..." : "確認收款"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* 標記已付 Dialog */}
        {paidDialog?.open && (
          <Dialog open onOpenChange={() => setPaidDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>標記已付 — {paidDialog.supplierName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">付款日期</label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">實際付款金額</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">應付：$ {formatAmount(paidDialog.netPayable)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">銀行備註（選填）</label>
                  <input
                    type="text"
                    value={paidNote}
                    onChange={(e) => setPaidNote(e.target.value)}
                    placeholder="例：匯款單號或備忘"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaidDialog(null)}>取消</Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={markPaidMutation.isPending}
                  onClick={() => markPaidMutation.mutate({
                    id: paidDialog.id,
                    paidDate,
                    paidAmount: Number(paidAmount),
                    bankTxNote: paidNote || undefined,
                  })}
                >
                  {markPaidMutation.isPending ? "儲存中..." : "標記已付"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

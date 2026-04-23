import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
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
const DEFAULT_MONTH_STR = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

function formatAmount(n: number | string) {
  return Number(n).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

const REBATE_TYPE_LABEL: Record<string, string> = {
  percentage: "百分比（廣弘）",
  fixed_diff: "固定差價（伯享）",
  offset: "抵貨款（韓濟）",
};

const REBATE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: "待計算",  className: "bg-gray-100 text-gray-700" },
  calculated: { label: "已計算",  className: "bg-blue-100 text-blue-700" },
  received:   { label: "已收款",  className: "bg-green-100 text-green-700" },
  offset:     { label: "已抵扣",  className: "bg-teal-100 text-teal-700" },
};

const PAYABLE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "未付",    className: "bg-yellow-100 text-yellow-800" },
  partial: { label: "部分付",  className: "bg-orange-100 text-orange-800" },
  paid:    { label: "已付",    className: "bg-green-100 text-green-800" },
};

export default function OSRebate() {
  const [monthStr, setMonthStr] = useState(DEFAULT_MONTH_STR);

  // 退佣：確認收款 dialog
  const [receivedDialog, setReceivedDialog] = useState<{
    open: boolean; id: number; supplierName: string; rebateAmount: number;
  } | null>(null);
  const [receivedDate, setReceivedDate] = useState(now.toISOString().slice(0, 10));
  const [receivedBankRef, setReceivedBankRef] = useState("");
  const [receivedManualAmt, setReceivedManualAmt] = useState("");

  // 應付：標記已付 dialog
  const [paidDialog, setPaidDialog] = useState<{
    open: boolean; id: number; supplierName: string; netPayable: number;
  } | null>(null);
  const [paidDate, setPaidDate] = useState(now.toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState("");
  const [paidBankRef, setPaidBankRef] = useState("");

  // ── 資料查詢（全部走 accounting 路由）
  const {
    data: rebates = [],
    refetch: refetchRebates,
    isLoading: loadingRebates,
  } = trpc.accounting.listRebates.useQuery({ month: monthStr });

  const {
    data: payables = [],
    refetch: refetchPayables,
    isLoading: loadingPayables,
  } = trpc.accounting.listPayables.useQuery({ month: monthStr });

  // ── Mutations
  const calcRebatesMut = trpc.accounting.calculateRebates.useMutation();
  const updateRebateMut = trpc.accounting.updateRebate.useMutation();
  const markPaidMut = trpc.accounting.markPayablePaid.useMutation();

  // ── 統計
  const totalRebate = (rebates as any[]).reduce((s, r) => s + Number(r.netRebate || 0), 0);
  const totalPayable = (payables as any[]).reduce((s, p) => s + Number(p.netPayable || 0), 0);
  const totalPaid = (payables as any[])
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.paidAmount || 0), 0);

  const monthOptions: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <AdminDashboardLayout>
      <div className="py-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown className="h-7 w-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">退佣帳款管理</h1>
            <p className="text-sm text-gray-500">廠商退佣計算 · 應付帳款月結</p>
          </div>
        </div>

        {/* 月份選擇 + 計算按鈕 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={monthStr}
            onChange={(e) => setMonthStr(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <Button
            onClick={() => calcRebatesMut.mutate({ month: monthStr }, {
              onSuccess: (d: any) => { toast.success(d.message || "退佣計算完成"); refetchRebates(); },
              onError: (e: any) => toast.error(e.message || "計算失敗"),
            })}
            disabled={calcRebatesMut.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {calcRebatesMut.isPending ? "計算中..." : "計算本月退佣"}
          </Button>
          <p className="text-xs text-gray-400">計算後伯享/韓濟需人工輸入金額</p>
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
              ) : (rebates as any[]).length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>尚無退佣記錄，請先點「計算本月退佣」</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">廠商</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">退佣類型</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">本月採購</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">退佣金額</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">手續費</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">淨退佣</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">狀態</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(rebates as any[]).map((r) => {
                      const statusCfg = REBATE_STATUS_CONFIG[r.status] ?? REBATE_STATUS_CONFIG.calculated;
                      const needsManual = (r.rebateType === "offset" || r.rebateType === "fixed_diff") && Number(r.rebateAmount) === 0;
                      return (
                        <tr key={r.id} className={`hover:bg-gray-50 ${needsManual ? "bg-amber-50" : ""}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.supplierName}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {REBATE_TYPE_LABEL[r.rebateType] ?? r.rebateType}
                            {needsManual && <span className="ml-1 text-amber-600 font-semibold">⚠ 需輸入金額</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">$ {formatAmount(r.baseAmount)}</td>
                          <td className="px-4 py-3 text-right text-emerald-700">$ {formatAmount(r.rebateAmount)}</td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs">
                            {Number(r.handlingFee) > 0 ? `- $ ${formatAmount(r.handlingFee)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">$ {formatAmount(r.netRebate)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.status !== "received" && r.status !== "offset" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => {
                                  setReceivedDialog({
                                    open: true, id: r.id,
                                    supplierName: r.supplierName,
                                    rebateAmount: Number(r.rebateAmount),
                                  });
                                  setReceivedDate(now.toISOString().slice(0, 10));
                                  setReceivedBankRef("");
                                  setReceivedManualAmt(String(Math.round(Number(r.rebateAmount))));
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
                      <td colSpan={5} className="px-4 py-3 font-semibold text-gray-700">本月淨退佣合計</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">
                        $ {formatAmount(totalRebate)}
                      </td>
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
              ) : (payables as any[]).length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>尚無應付帳款記錄（叫貨單確認收貨後自動產生）</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">廠商</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">月結總額</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">退佣抵扣</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">實際應付</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">已付</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">狀態</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(payables as any[]).map((p) => {
                      const statusCfg = PAYABLE_STATUS_CONFIG[p.status] ?? PAYABLE_STATUS_CONFIG.pending;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.supplierName}</td>
                          <td className="px-4 py-3 text-right text-gray-700">$ {formatAmount(p.totalAmount)}</td>
                          <td className="px-4 py-3 text-right text-teal-600">
                            {Number(p.rebateAmount) > 0 ? `- $ ${formatAmount(p.rebateAmount)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">$ {formatAmount(p.netPayable)}</td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {Number(p.paidAmount) > 0 ? `$ ${formatAmount(p.paidAmount)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.status !== "paid" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => {
                                  setPaidDialog({
                                    open: true, id: p.id,
                                    supplierName: p.supplierName,
                                    netPayable: Number(p.netPayable),
                                  });
                                  setPaidDate(now.toISOString().slice(0, 10));
                                  setPaidAmount(String(Math.round(Number(p.netPayable))));
                                  setPaidBankRef("");
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
                      <td className="px-4 py-3 text-right text-sm text-gray-500">已付 $ {formatAmount(totalPaid)}</td>
                      <td />
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

        {/* ── 確認退佣收款 Dialog ── */}
        {receivedDialog?.open && (
          <Dialog open onOpenChange={() => setReceivedDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>確認退佣收款 — {receivedDialog.supplierName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">退佣金額（可修改）</label>
                  <input
                    type="number"
                    value={receivedManualAmt}
                    onChange={(e) => setReceivedManualAmt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">伯享/韓濟若系統為 0，請在此輸入實際金額</p>
                </div>
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
                    value={receivedBankRef}
                    onChange={(e) => setReceivedBankRef(e.target.value)}
                    placeholder="匯款單號或備忘"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReceivedDialog(null)}>取消</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={updateRebateMut.isPending}
                  onClick={() => {
                    const amt = Number(receivedManualAmt);
                    updateRebateMut.mutate(
                      {
                        id: receivedDialog.id,
                        status: "received",
                        ...(amt > 0 && amt !== receivedDialog.rebateAmount ? { rebateAmount: amt } : {}),
                        ...(receivedBankRef ? { bankRef: receivedBankRef } : {}),
                      },
                      {
                        onSuccess: () => { toast.success("已更新退佣狀態"); setReceivedDialog(null); refetchRebates(); },
                        onError: (e: any) => toast.error(e.message || "操作失敗"),
                      }
                    );
                  }}
                >
                  {updateRebateMut.isPending ? "儲存中..." : "確認收款"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ── 標記應付帳款已付 Dialog ── */}
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
                    value={paidBankRef}
                    onChange={(e) => setPaidBankRef(e.target.value)}
                    placeholder="匯款單號或備忘"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaidDialog(null)}>取消</Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={markPaidMut.isPending || !paidAmount}
                  onClick={() => markPaidMut.mutate(
                    { id: paidDialog.id, paidAmount: Number(paidAmount), bankRef: paidBankRef || undefined },
                    {
                      onSuccess: () => { toast.success("已標記付款"); setPaidDialog(null); refetchPayables(); },
                      onError: (e: any) => toast.error(e.message || "操作失敗"),
                    }
                  )}
                >
                  {markPaidMut.isPending ? "儲存中..." : "標記已付"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import {
  CreditCard,
  Plus,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const now = new Date();
const DEFAULT_YEAR = now.getFullYear();
const DEFAULT_MONTH = now.getMonth() + 1;

function fmt(n: number) {
  return n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function formatDate(val: any): string {
  if (!val) return "";
  const s = String(val);
  return s.slice(0, 10);
}

export default function OSFranchiseePayments() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === "super_admin";

  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [filterUserId, setFilterUserId] = useState<number | undefined>(undefined);

  // 新增帳款 dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    direction: "receivable" as "receivable" | "paid",
    category: "貨款",
    note: "",
    paidAt: "",
  });

  // 標記已收款 dialog
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<any>(null);
  const [markPaidForm, setMarkPaidForm] = useState({
    paidAmount: "",
    paidAt: new Date().toISOString().slice(0, 10),
    note: "",
  });

  // 加盟主清單（role=franchisee）
  const { data: franchisees = [] } = trpc.franchisee.franchiseeList.useQuery();

  // 帳款資料
  const { data, isLoading, refetch } = trpc.franchiseePayment.listPayments.useQuery(
    { userId: filterUserId, year, month },
    { keepPreviousData: true }
  );

  const payments = data?.payments ?? [];
  const summary = data?.summary ?? { totalReceivable: 0, totalPaid: 0, outstanding: 0 };
  const byFranchisee = data?.byFranchisee ?? [];

  // mutations
  const createMutation = trpc.franchiseePayment.createPayment.useMutation({
    onSuccess: () => {
      toast.success("帳款新增成功");
      setCreateOpen(false);
      refetch();
    },
    onError: (e) => toast.error(`新增失敗：${e.message}`),
  });

  const markPaidMutation = trpc.franchiseePayment.markPaid.useMutation({
    onSuccess: () => {
      toast.success("已標記收款");
      setMarkPaidOpen(false);
      refetch();
    },
    onError: (e) => toast.error(`標記失敗：${e.message}`),
  });

  // 匯出 Excel
  const exportQuery = trpc.franchiseePayment.exportPayments.useQuery(
    { userId: filterUserId, year, month },
    { enabled: false }
  );

  async function handleExport() {
    const result = await exportQuery.refetch();
    if (!result.data) return;
    const { headers, rows: dataRows, summary: sum } = result.data;

    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // 主工作表
      const wsData = [headers, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "帳款明細");

      // 摘要工作表
      const sumData = [
        ["年月", `${sum.year}年${sum.month}月`],
        ["本期應收", sum.totalReceivable],
        ["本期已收", sum.totalPaid],
        ["未結清", sum.outstanding],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(sumData);
      XLSX.utils.book_append_sheet(wb, ws2, "摘要");

      XLSX.writeFile(wb, `加盟主帳款_${year}${String(month).padStart(2, "0")}.xlsx`);
      toast.success("Excel 匯出成功");
    } catch {
      toast.error("匯出失敗，請確認 xlsx 套件已安裝");
    }
  }

  function openMarkPaid(payment: any) {
    setMarkPaidTarget(payment);
    setMarkPaidForm({
      paidAmount: String(payment.amount),
      paidAt: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setMarkPaidOpen(true);
  }

  const yearOptions = [DEFAULT_YEAR - 1, DEFAULT_YEAR, DEFAULT_YEAR + 1];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <AdminDashboardLayout>
      <div className="py-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">加盟主帳款管理</h1>
            <p className="text-xs text-stone-500 mt-0.5">應收帳款・收款記錄・週結摘要</p>
          </div>

          {/* 右上角操作 */}
          <div className="ml-auto flex gap-2">
            {isSuperAdmin && (
              <Button
                size="sm"
                className="bg-amber-700 hover:bg-amber-600 text-white"
                onClick={() => {
                  setCreateForm({
                    userId: (franchisees as any[])[0]?.id ?? 0,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    amount: "",
                    direction: "receivable",
                    category: "貨款",
                    note: "",
                    paidAt: "",
                  });
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                新增帳款
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              匯出 Excel
            </Button>
          </div>
        </div>

        {/* 篩選列 */}
        <div className="flex flex-wrap gap-3 mb-6 bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 whitespace-nowrap">年份</label>
            <select
              className="border border-stone-200 rounded-lg px-2 py-1 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 whitespace-nowrap">月份</label>
            <select
              className="border border-stone-200 rounded-lg px-2 py-1 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m} 月</option>
              ))}
            </select>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500 whitespace-nowrap">加盟主</label>
              <select
                className="border border-stone-200 rounded-lg px-2 py-1 text-sm"
                value={filterUserId ?? ""}
                onChange={(e) =>
                  setFilterUserId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">全部</option>
                {(franchisees as any[]).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* KPI 三卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm">
            <p className="text-xs text-stone-500 mb-1">本期應收總額</p>
            <p
              className="text-2xl font-bold text-blue-700"
              style={{ fontFamily: "jf-kamabit, var(--font-brand), sans-serif" }}
            >
              $ {fmt(summary.totalReceivable)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-5 shadow-sm">
            <p className="text-xs text-stone-500 mb-1">本期已收</p>
            <p
              className="text-2xl font-bold text-green-700"
              style={{ fontFamily: "jf-kamabit, var(--font-brand), sans-serif" }}
            >
              $ {fmt(summary.totalPaid)}
            </p>
          </div>
          <div
            className={`bg-white rounded-xl border p-5 shadow-sm ${
              summary.outstanding > 0 ? "border-red-100" : "border-green-100"
            }`}
          >
            <p className="text-xs text-stone-500 mb-1">未收餘額</p>
            <p
              className={`text-2xl font-bold ${
                summary.outstanding > 0 ? "text-red-600" : "text-green-700"
              }`}
              style={{ fontFamily: "jf-kamabit, var(--font-brand), sans-serif" }}
            >
              $ {fmt(summary.outstanding)}
            </p>
          </div>
        </div>

        {/* 帳款明細表 */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-700">帳款明細</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-stone-400 text-sm">載入中…</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-sm">本期無帳款記錄</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-xs text-stone-500">
                    <th className="px-4 py-2 text-left">日期</th>
                    <th className="px-4 py-2 text-left">加盟主</th>
                    <th className="px-4 py-2 text-left">類別</th>
                    <th className="px-4 py-2 text-right">金額</th>
                    <th className="px-4 py-2 text-center">方向</th>
                    <th className="px-4 py-2 text-left">備註</th>
                    {isSuperAdmin && <th className="px-4 py-2 text-center">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr
                      key={p.id}
                      className={`border-t border-stone-100 border-l-4 ${
                        p.direction === "receivable"
                          ? "border-l-blue-400"
                          : "border-l-green-400"
                      }`}
                    >
                      <td className="px-4 py-2 text-stone-600 whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="px-4 py-2 text-stone-800 font-medium">
                        {p.userName ?? `ID:${p.userId}`}
                      </td>
                      <td className="px-4 py-2 text-stone-500">{p.category}</td>
                      <td
                        className={`px-4 py-2 text-right font-semibold ${
                          p.direction === "receivable"
                            ? "text-blue-700"
                            : "text-green-700"
                        }`}
                      >
                        {p.direction === "receivable"
                          ? `$ ${fmt(Number(p.amount))}`
                          : `- $ ${fmt(Number(p.amount))}`}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                            p.direction === "receivable"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {p.direction === "receivable" ? "應收" : "已付"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-stone-400 text-xs max-w-[200px] truncate">
                        {p.note ?? "—"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-2 text-center">
                          {p.direction === "receivable" && (
                            <button
                              className="text-xs text-amber-700 hover:text-amber-600 underline"
                              onClick={() => openMarkPaid(p)}
                            >
                              標記已收款
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 底部週結摘要 */}
        {byFranchisee.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-700">各加盟主本期結算</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-xs text-stone-500">
                    <th className="px-4 py-2 text-left">加盟主</th>
                    <th className="px-4 py-2 text-right">應收</th>
                    <th className="px-4 py-2 text-right">已收</th>
                    <th className="px-4 py-2 text-right">未結清</th>
                  </tr>
                </thead>
                <tbody>
                  {byFranchisee.map((f: any) => (
                    <tr key={f.userId} className="border-t border-stone-100">
                      <td className="px-4 py-2 font-medium text-stone-800">{f.name}</td>
                      <td className="px-4 py-2 text-right text-blue-700">
                        $ {fmt(f.receivable)}
                      </td>
                      <td className="px-4 py-2 text-right text-green-700">
                        $ {fmt(f.paid)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={`flex items-center justify-end gap-1 font-semibold ${
                            f.outstanding > 0 ? "text-red-600" : "text-green-700"
                          }`}
                        >
                          {f.outstanding > 0 ? (
                            <>
                              <AlertCircle className="h-3.5 w-3.5" />
                              $ {fmt(f.outstanding)}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              $ 0
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 新增帳款 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增帳款</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-stone-500">加盟主</label>
              <select
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                value={createForm.userId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, userId: Number(e.target.value) })
                }
              >
                {(franchisees as any[]).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">日期</label>
              <input
                type="date"
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                value={createForm.paymentDate}
                onChange={(e) =>
                  setCreateForm({ ...createForm, paymentDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-stone-500">金額</label>
              <input
                type="number"
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
                value={createForm.amount}
                onChange={(e) =>
                  setCreateForm({ ...createForm, amount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-stone-500">方向</label>
              <select
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                value={createForm.direction}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    direction: e.target.value as "receivable" | "paid",
                  })
                }
              >
                <option value="receivable">應收</option>
                <option value="paid">已付</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">類別</label>
              <input
                type="text"
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                value={createForm.category}
                onChange={(e) =>
                  setCreateForm({ ...createForm, category: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-stone-500">備註</label>
              <textarea
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                rows={2}
                value={createForm.note}
                onChange={(e) =>
                  setCreateForm({ ...createForm, note: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-amber-700 hover:bg-amber-600 text-white"
              disabled={createMutation.isLoading || !createForm.userId || !createForm.amount}
              onClick={() =>
                createMutation.mutate({
                  userId: createForm.userId,
                  paymentDate: createForm.paymentDate,
                  amount: Number(createForm.amount),
                  direction: createForm.direction,
                  category: createForm.category || "貨款",
                  note: createForm.note || undefined,
                })
              }
            >
              {createMutation.isLoading ? "新增中…" : "確認新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 標記已收款 Dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>標記已收款</DialogTitle>
          </DialogHeader>
          {markPaidTarget && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-stone-500">
                原應收：<span className="text-blue-700 font-semibold">$ {fmt(Number(markPaidTarget.amount))}</span>
                ・{formatDate(markPaidTarget.paymentDate)}
              </p>
              <div>
                <label className="text-xs text-stone-500">收款金額</label>
                <input
                  type="number"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                  value={markPaidForm.paidAmount}
                  onChange={(e) =>
                    setMarkPaidForm({ ...markPaidForm, paidAmount: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-stone-500">收款日期</label>
                <input
                  type="date"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                  value={markPaidForm.paidAt}
                  onChange={(e) =>
                    setMarkPaidForm({ ...markPaidForm, paidAt: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-stone-500">備註</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                  value={markPaidForm.note}
                  onChange={(e) =>
                    setMarkPaidForm({ ...markPaidForm, note: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-green-700 hover:bg-green-600 text-white"
              disabled={markPaidMutation.isLoading || !markPaidForm.paidAmount}
              onClick={() =>
                markPaidMutation.mutate({
                  receivableId: markPaidTarget.id,
                  paidAmount: Number(markPaidForm.paidAmount),
                  paidAt: markPaidForm.paidAt,
                  note: markPaidForm.note || undefined,
                })
              }
            >
              {markPaidMutation.isLoading ? "處理中…" : "確認收款"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calculator, CheckCircle, CreditCard, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const REBATE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "待計算", color: "var(--os-text-2)",   bg: "var(--os-surface-2)" },
  calculated: { label: "已計算", color: "var(--os-info)",     bg: "var(--os-info-bg)" },
  received:   { label: "已收款", color: "var(--os-success)",  bg: "var(--os-success-bg)" },
  offset:     { label: "已抵扣", color: "var(--os-success)",  bg: "var(--os-success-bg)" },
};

const PAYABLE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "未付",   color: "var(--os-warning)", bg: "var(--os-warning-bg)" },
  partial: { label: "部分付", color: "var(--os-warning)", bg: "var(--os-warning-bg)" },
  paid:    { label: "已付",   color: "var(--os-success)", bg: "var(--os-success-bg)" },
};

const thSt: React.CSSProperties = { color: "var(--os-text-3)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };
const panelSt: React.CSSProperties = { background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflowX: "auto" };
const selectSt: React.CSSProperties = { padding: "6px 12px", border: "1px solid var(--os-border)", borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)" };
const inputSt: React.CSSProperties = { width: "100%", padding: "6px 10px", border: "1px solid var(--os-border)", borderRadius: 6, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };

const TABS = [
  { key: "rebate",  label: "退佣管理" },
  { key: "payable", label: "應付帳款" },
] as const;

export default function OSRebate() {
  const [monthStr, setMonthStr] = useState(DEFAULT_MONTH_STR);
  const [tab, setTab] = useState<"rebate" | "payable">("rebate");

  const [receivedDialog, setReceivedDialog] = useState<{
    open: boolean; id: number; supplierName: string; rebateAmount: number;
  } | null>(null);
  const [receivedDate, setReceivedDate] = useState(now.toISOString().slice(0, 10));
  const [receivedBankRef, setReceivedBankRef] = useState("");
  const [receivedManualAmt, setReceivedManualAmt] = useState("");

  const [paidDialog, setPaidDialog] = useState<{
    open: boolean; id: number; supplierName: string; netPayable: number;
  } | null>(null);
  const [paidDate, setPaidDate] = useState(now.toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState("");
  const [paidBankRef, setPaidBankRef] = useState("");

  const { data: rebates = [], refetch: refetchRebates, isLoading: loadingRebates } =
    trpc.accounting.listRebates.useQuery({ month: monthStr });

  const { data: payables = [], refetch: refetchPayables, isLoading: loadingPayables } =
    trpc.accounting.listPayables.useQuery({ month: monthStr });

  const calcRebatesMut = trpc.accounting.calculateRebates.useMutation();
  const updateRebateMut = trpc.accounting.updateRebate.useMutation();
  const markPaidMut = trpc.accounting.markPayablePaid.useMutation();

  const totalRebate = (rebates as any[]).reduce((s, r) => s + Number(r.netRebate || 0), 0);
  const totalPayable = (payables as any[]).reduce((s, p) => s + Number(p.netPayable || 0), 0);
  const totalPaid = (payables as any[]).filter(p => p.status === "paid").reduce((s, p) => s + Number(p.paidAmount || 0), 0);

  const monthOptions: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function trHover(e: React.MouseEvent<HTMLTableRowElement>, enter: boolean) {
    e.currentTarget.style.background = enter ? "var(--os-amber-soft)" : "";
  }

  const loadingRow = (cols: number) => (
    <tr><td colSpan={cols} style={{ textAlign: "center", color: "var(--os-text-3)", padding: "40px 0", fontSize: 13 }}>載入中...</td></tr>
  );

  const emptyRow = (cols: number, icon: React.ReactNode, msg: string) => (
    <tr><td colSpan={cols} style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ color: "var(--os-text-3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13 }}>{msg}</span>
      </div>
    </td></tr>
  );

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 16 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <TrendingDown style={{ height: 20, width: 20, color: "var(--os-success)" }} />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>退佣帳款管理</h1>
              <p style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 2 }}>廠商退佣計算・應付帳款月結</p>
            </div>
          </div>

          {/* Month selector + calc button */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={monthStr} onChange={e => setMonthStr(e.target.value)} style={selectSt}>
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <Button
              onClick={() => calcRebatesMut.mutate({ month: monthStr }, {
                onSuccess: (d: any) => { toast.success(d.message || "退佣計算完成"); refetchRebates(); },
                onError: (e: any) => toast.error(e.message || "計算失敗"),
              })}
              disabled={calcRebatesMut.isPending}
              className="text-white gap-1.5"
              style={amberBtn}
            >
              <Calculator className="w-4 h-4" />
              {calcRebatesMut.isPending ? "計算中..." : "計算本月退佣"}
            </Button>
            <p style={{ fontSize: 12, color: "var(--os-text-3)" }}>計算後伯享/韓濟需人工輸入金額</p>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
            <TabsList style={{ background: "var(--os-surface-2)", border: "1px solid var(--os-border)", padding: 3 }}>
              {TABS.map(t => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="data-[state=active]:bg-[--os-surface] data-[state=active]:text-[--os-text-1] data-[state=inactive]:text-[--os-text-3] text-sm"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── 退佣管理 ── */}
            <TabsContent value="rebate" className="mt-3">
              <div style={panelSt}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                      {["廠商","退佣類型","本月採購","退佣金額","手續費","淨退佣","狀態","操作"].map((h, i) => (
                        <th key={h} className={i < 2 ? "px-4 py-3 text-left" : "px-4 py-3 text-right"} style={{ ...thSt, textAlign: i === 6 || i === 7 ? "center" : undefined }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRebates ? loadingRow(8) :
                     (rebates as any[]).length === 0 ? emptyRow(8, <Calculator style={{ width: 36, height: 36, opacity: 0.25 }} />, "尚無退佣記錄，請先點「計算本月退佣」") :
                     (rebates as any[]).map((r: any) => {
                      const sc = REBATE_STATUS_CONFIG[r.status] ?? REBATE_STATUS_CONFIG.calculated;
                      const needsManual = (r.rebateType === "offset" || r.rebateType === "fixed_diff") && Number(r.rebateAmount) === 0;
                      return (
                        <tr key={r.id}
                          style={{ borderTop: "1px solid var(--os-border-2)", background: needsManual ? "var(--os-warning-bg)" : "" }}
                          onMouseEnter={e => trHover(e, true)} onMouseLeave={e => trHover(e, false)}>
                          <td className="px-4 py-3 font-medium" style={{ color: "var(--os-text-1)" }}>{r.supplierName}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--os-text-3)" }}>
                            {REBATE_TYPE_LABEL[r.rebateType] ?? r.rebateType}
                            {needsManual && <span style={{ marginLeft: 6, color: "var(--os-warning)", fontWeight: 600 }}>⚠ 需輸入金額</span>}
                          </td>
                          <td className="px-4 py-3 text-right">$ {formatAmount(r.baseAmount)}</td>
                          <td className="px-4 py-3 text-right" style={{ color: "var(--os-success)" }}>$ {formatAmount(r.rebateAmount)}</td>
                          <td className="px-4 py-3 text-right text-xs" style={{ color: "var(--os-text-3)" }}>
                            {Number(r.handlingFee) > 0 ? `- $ ${formatAmount(r.handlingFee)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: "var(--os-success)" }}>$ {formatAmount(r.netRebate)}</td>
                          <td className="px-4 py-3 text-center">
                            <span style={{ display: "inline-block", borderRadius: 4, padding: "1px 8px", fontSize: 12, fontWeight: 500, color: sc.color, background: sc.bg }}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.status !== "received" && r.status !== "offset" && (
                              <Button size="sm" variant="outline" className="text-xs gap-1"
                                onClick={() => {
                                  setReceivedDialog({ open: true, id: r.id, supplierName: r.supplierName, rebateAmount: Number(r.rebateAmount) });
                                  setReceivedDate(now.toISOString().slice(0, 10));
                                  setReceivedBankRef("");
                                  setReceivedManualAmt(String(Math.round(Number(r.rebateAmount))));
                                }}>
                                <CheckCircle className="w-3.5 h-3.5" /> 確認收款
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {(rebates as any[]).length > 0 && (
                    <tfoot>
                      <tr style={{ background: "var(--os-success-bg)", borderTop: "2px solid var(--os-border)" }}>
                        <td colSpan={5} className="px-4 py-3 font-semibold" style={{ color: "var(--os-text-1)" }}>本月淨退佣合計</td>
                        <td className="px-4 py-3 text-right font-bold text-base" style={{ color: "var(--os-success)" }}>$ {formatAmount(totalRebate)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </TabsContent>

            {/* ── 應付帳款 ── */}
            <TabsContent value="payable" className="mt-3">
              <div style={panelSt}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                      {["廠商","月結總額","退佣抵扣","實際應付","已付","狀態","操作"].map((h, i) => (
                        <th key={h} className={i === 0 ? "px-4 py-3 text-left" : "px-4 py-3 text-right"} style={{ ...thSt, textAlign: i === 5 || i === 6 ? "center" : undefined }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPayables ? loadingRow(7) :
                     (payables as any[]).length === 0 ? emptyRow(7, <CreditCard style={{ width: 36, height: 36, opacity: 0.25 }} />, "尚無應付帳款記錄（叫貨單確認收貨後自動產生）") :
                     (payables as any[]).map((p: any) => {
                      const sc = PAYABLE_STATUS_CONFIG[p.status] ?? PAYABLE_STATUS_CONFIG.pending;
                      return (
                        <tr key={p.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                          onMouseEnter={e => trHover(e, true)} onMouseLeave={e => trHover(e, false)}>
                          <td className="px-4 py-3 font-medium" style={{ color: "var(--os-text-1)" }}>{p.supplierName}</td>
                          <td className="px-4 py-3 text-right">$ {formatAmount(p.totalAmount)}</td>
                          <td className="px-4 py-3 text-right" style={{ color: "var(--os-success)" }}>
                            {Number(p.rebateAmount) > 0 ? `- $ ${formatAmount(p.rebateAmount)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: "var(--os-text-1)" }}>$ {formatAmount(p.netPayable)}</td>
                          <td className="px-4 py-3 text-right" style={{ color: "var(--os-text-3)" }}>
                            {Number(p.paidAmount) > 0 ? `$ ${formatAmount(p.paidAmount)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span style={{ display: "inline-block", borderRadius: 4, padding: "1px 8px", fontSize: 12, fontWeight: 500, color: sc.color, background: sc.bg }}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.status !== "paid" && (
                              <Button size="sm" variant="outline" className="text-xs gap-1"
                                onClick={() => {
                                  setPaidDialog({ open: true, id: p.id, supplierName: p.supplierName, netPayable: Number(p.netPayable) });
                                  setPaidDate(now.toISOString().slice(0, 10));
                                  setPaidAmount(String(Math.round(Number(p.netPayable))));
                                  setPaidBankRef("");
                                }}>
                                <CreditCard className="w-3.5 h-3.5" /> 標記已付
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {(payables as any[]).length > 0 && (
                    <tfoot>
                      <tr style={{ background: "var(--os-amber-soft)", borderTop: "2px solid var(--os-border)" }}>
                        <td colSpan={3} className="px-4 py-3 font-semibold" style={{ color: "var(--os-text-1)" }}>本月合計</td>
                        <td className="px-4 py-3 text-right font-bold text-base" style={{ color: "var(--os-text-1)" }}>$ {formatAmount(totalPayable)}</td>
                        <td className="px-4 py-3 text-right text-sm" style={{ color: "var(--os-text-3)" }}>已付 $ {formatAmount(totalPaid)}</td>
                        <td />
                        <td className="px-4 py-3 text-right font-bold" style={{ color: "var(--os-danger)" }}>未付 $ {formatAmount(totalPayable - totalPaid)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── 確認退佣收款 Dialog ── */}
      {receivedDialog?.open && (
        <Dialog open onOpenChange={() => setReceivedDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認退佣收款 — {receivedDialog.supplierName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--os-text-3)", marginBottom: 6 }}>退佣金額（可修改）</label>
                <input type="number" value={receivedManualAmt} onChange={e => setReceivedManualAmt(e.target.value)} style={inputSt} />
                <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>伯享/韓濟若系統為 0，請在此輸入實際金額</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--os-text-3)", marginBottom: 6 }}>收款日期</label>
                <input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} style={inputSt} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--os-text-3)", marginBottom: 6 }}>銀行備註（選填）</label>
                <input type="text" value={receivedBankRef} onChange={e => setReceivedBankRef(e.target.value)} placeholder="匯款單號或備忘" style={inputSt} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReceivedDialog(null)}>取消</Button>
              <Button style={amberBtn} disabled={updateRebateMut.isPending}
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
                }}>
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
                <label style={{ display: "block", fontSize: 12, color: "var(--os-text-3)", marginBottom: 6 }}>付款日期</label>
                <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} style={inputSt} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--os-text-3)", marginBottom: 6 }}>實際付款金額</label>
                <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} style={inputSt} />
                <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>應付：$ {formatAmount(paidDialog.netPayable)}</p>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--os-text-3)", marginBottom: 6 }}>銀行備註（選填）</label>
                <input type="text" value={paidBankRef} onChange={e => setPaidBankRef(e.target.value)} placeholder="匯款單號或備忘" style={inputSt} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaidDialog(null)}>取消</Button>
              <Button style={amberBtn} disabled={markPaidMut.isPending || !paidAmount}
                onClick={() => markPaidMut.mutate(
                  { id: paidDialog.id, paidAmount: Number(paidAmount), bankRef: paidBankRef || undefined },
                  {
                    onSuccess: () => { toast.success("已標記付款"); setPaidDialog(null); refetchPayables(); },
                    onError: (e: any) => toast.error(e.message || "操作失敗"),
                  }
                )}>
                {markPaidMut.isPending ? "儲存中..." : "標記已付"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminDashboardLayout>
  );
}

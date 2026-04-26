import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Plus, RefreshCw, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

function fmtAmt(n: number | null | undefined) {
  if (n == null) return "-";
  return `$${Number(n).toLocaleString("zh-TW")}`;
}
function nowMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const PAYABLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "待付款", color: "var(--os-text-2)",   bg: "var(--os-surface-2)" },
  partial:  { label: "部分付", color: "var(--os-warning)",  bg: "var(--os-warning-bg)" },
  paid:     { label: "已付清", color: "var(--os-success)",  bg: "var(--os-success-bg)" },
  overdue:  { label: "逾期",   color: "var(--os-danger)",   bg: "var(--os-danger-bg)" },
};
const REBATE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "待收",    color: "var(--os-text-2)",  bg: "var(--os-surface-2)" },
  received: { label: "已入帳",  color: "var(--os-success)", bg: "var(--os-success-bg)" },
  offset:   { label: "已抵貨款", color: "var(--os-info)",   bg: "var(--os-info-bg)" },
};

function StatusBadge({ cfg, value }: { cfg: Record<string, { label: string; color: string; bg: string }>; value: string }) {
  const c = cfg[value] ?? { label: value, color: "var(--os-text-2)", bg: "var(--os-surface-2)" };
  return (
    <span style={{ color: c.color, background: c.bg, display: "inline-block", borderRadius: 4, padding: "1px 8px", fontSize: 12, fontWeight: 500 }}>
      {c.label}
    </span>
  );
}

const thSt: React.CSSProperties = { color: "var(--os-text-3)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const panelSt: React.CSSProperties = { background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, overflowX: "auto" };
const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff" };

const TABS = [
  { key: "payables", label: "應付帳款" },
  { key: "bank",     label: "銀行明細對帳" },
  { key: "rebate",   label: "退佣管理" },
  { key: "transfer", label: "提貨調貨" },
] as const;

export default function OSAccounting() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("payables");
  const [month, setMonth] = useState("");

  const [payFilterStatus, setPayFilterStatus] = useState("all");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [payAmt, setPayAmt] = useState("");
  const [payBankRef, setPayBankRef] = useState("");
  const [payNote, setPayNote] = useState("");

  const [showCreatePayable, setShowCreatePayable] = useState(false);
  const [cpSupplier, setCpSupplier] = useState("");
  const [cpMonth, setCpMonth] = useState(nowMonth());
  const [cpAmount, setCpAmount] = useState("");
  const [cpDueDate, setCpDueDate] = useState("");
  const [cpNote, setCpNote] = useState("");

  const [bankFilterStatus, setBankFilterStatus] = useState("all");
  const [showBankImport, setShowBankImport] = useState(false);
  const [bankBatchName, setBankBatchName] = useState("");
  const [bankPreview, setBankPreview] = useState<any[]>([]);
  const [showConfirmMatch, setShowConfirmMatch] = useState(false);
  const [matchTarget, setMatchTarget] = useState<any>(null);
  const [matchType, setMatchType] = useState("payable");
  const bankFileRef = useRef<HTMLInputElement>(null);

  const [showRebateEdit, setShowRebateEdit] = useState(false);
  const [rebateTarget, setRebateTarget] = useState<any>(null);
  const [rebateManualAmt, setRebateManualAmt] = useState("");
  const [rebateBankRef, setRebateBankRef] = useState("");

  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferStore, setTransferStore] = useState("");
  const [transferProduct, setTransferProduct] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [transferUnit, setTransferUnit] = useState("箱");
  const [transferPrice, setTransferPrice] = useState(0);
  const [transferNote, setTransferNote] = useState("");
  const [showBillConfirm, setShowBillConfirm] = useState(false);
  const [showTransferImport, setShowTransferImport] = useState(false);
  const [transferPreview, setTransferPreview] = useState<any[]>([]);

  const { data: allSuppliers = [] } = trpc.procurement.getSuppliers.useQuery();

  const { data: payables = [], refetch: refetchPayables } = trpc.accounting.listPayables.useQuery({
    month,
    status: payFilterStatus !== "all" ? payFilterStatus : undefined,
  });

  const { data: exportData = [] } = trpc.accounting.exportPayables.useQuery({ month });

  const { data: bankTxs = [], refetch: refetchBank } = trpc.accounting.listBankTransactions.useQuery({ month });

  const { data: rebates = [], refetch: refetchRebates } = trpc.accounting.listRebates.useQuery({ month });

  const { data: transfers = [], refetch: refetchTransfers } = trpc.accounting.listTransfers.useQuery({ month });

  const kpiTotalPayable = (payables as any[]).reduce((s, p) => s + Number(p.totalAmount ?? 0), 0);
  const kpiPaid = (payables as any[]).reduce((s, p) => s + Number(p.paidAmount ?? 0), 0);
  const kpiPending = (payables as any[]).filter(p => p.status !== "paid").reduce((s, p) => s + (Number(p.totalAmount) - Number(p.paidAmount ?? 0)), 0);

  const generatePayables = trpc.accounting.generateMonthlyPayables.useMutation({
    onSuccess: (d: any) => { toast.success(d.message); refetchPayables(); },
    onError: (e) => toast.error(e.message),
  });

  const markPaid = trpc.accounting.markPayablePaid.useMutation({
    onSuccess: () => { toast.success("付款已登記"); setShowPayDialog(false); setPayTarget(null); setPayAmt(""); refetchPayables(); },
    onError: (e) => toast.error(e.message),
  });

  const importBank = trpc.accounting.importBankTransactions.useMutation({
    onSuccess: (d: any) => { toast.success(d.message); setShowBankImport(false); setBankPreview([]); refetchBank(); },
    onError: (e) => toast.error(e.message),
  });

  const autoMatch = trpc.accounting.autoMatchTransactions.useMutation({
    onSuccess: (d: any) => { toast.success(d.message); refetchBank(); },
    onError: (e) => toast.error(e.message),
  });

  const confirmMatchMut = trpc.accounting.confirmMatch.useMutation({
    onSuccess: () => { toast.success("對帳確認完成"); setShowConfirmMatch(false); refetchBank(); },
    onError: (e) => toast.error(e.message),
  });

  const calcRebates = trpc.accounting.calculateRebates.useMutation({
    onSuccess: (d: any) => { toast.success(d.message); refetchRebates(); },
    onError: (e) => toast.error(e.message),
  });

  const updateRebate = trpc.accounting.updateRebate.useMutation({
    onSuccess: () => { toast.success("退佣已更新"); setShowRebateEdit(false); refetchRebates(); },
    onError: (e) => toast.error(e.message),
  });

  const createTransfer = trpc.accounting.createTransfer.useMutation({
    onSuccess: () => { toast.success("提貨調貨已新增"); setShowNewTransfer(false); refetchTransfers(); },
    onError: (e) => toast.error(e.message),
  });

  const importTransfersMut = trpc.accounting.importTransfers.useMutation({
    onSuccess: (d: any) => { toast.success(`匯入 ${d.inserted} 筆`); setShowTransferImport(false); setTransferPreview([]); refetchTransfers(); },
    onError: (e) => toast.error(e.message),
  });

  const billTransfers = trpc.accounting.billTransfers.useMutation({
    onSuccess: (d: any) => { toast.success(d.message); setShowBillConfirm(false); refetchTransfers(); },
    onError: (e) => toast.error(e.message),
  });

  const createPayable = trpc.accounting.createPayable.useMutation({
    onSuccess: () => {
      toast.success("應付帳款已新增");
      setShowCreatePayable(false);
      setCpSupplier(""); setCpAmount(""); setCpDueDate(""); setCpNote("");
      refetchPayables();
    },
    onError: (e) => toast.error(e.message),
  });

  const voidTransfer = trpc.accounting.voidTransfer.useMutation({
    onSuccess: () => { toast.success("已作廢"); refetchTransfers(); },
    onError: (e) => toast.error(e.message),
  });

  function parseBankExcel(file: File) {
    setBankBatchName(`台新_${month}`);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      const parsed = rows.slice(1).filter(r => r[1]).map(r => ({
        transactionDate: r[1] instanceof Date ? r[1].toISOString().slice(0, 10) : String(r[1] ?? "").slice(0, 10),
        summary: String(r[2] ?? ""),
        debit: Number(r[3] ?? 0),
        credit: Number(r[4] ?? 0),
        balance: Number(r[5] ?? 0),
        note1: String(r[6] ?? ""),
        note2: String(r[7] ?? ""),
      }));
      setBankPreview(parsed);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseTransferExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      let currentStore = "";
      const parsed: any[] = [];
      for (const r of rows) {
        const cell0 = String(r[0] ?? "");
        if (cell0.includes("調貨明細") || cell0.includes("門市調貨")) {
          currentStore = cell0.replace(/調貨明細|門市/g, "").trim();
          continue;
        }
        if (!r[4] || !r[6] || !currentStore) continue;
        const dateVal = r[4];
        const date = dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : String(dateVal ?? "").slice(0, 10);
        if (!date || date.length < 7) continue;
        parsed.push({
          transferDate: date,
          toStore: currentStore,
          productName: String(r[6] ?? ""),
          quantity: Number(r[7] ?? 0),
          unit: String(r[8] ?? ""),
          unitPrice: Number(r[9] ?? 0),
        });
      }
      setTransferPreview(parsed);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleExportPayables() {
    const rows = (exportData as any[]).map(p => ({
      "廠商": p.supplierName,
      "月份": p.month,
      "應付金額": Number(p.totalAmount ?? 0),
      "退佣抵扣": Number(p.rebateAmount ?? 0),
      "實際應付": Number(p.netPayable ?? 0),
      "已付": Number(p.paidAmount ?? 0),
      "狀態": PAYABLE_BADGE[p.status]?.label ?? p.status,
      "預計付款日": p.dueDate ?? "",
      "銀行摘要": p.bankRef ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "應付帳款");
    XLSX.writeFile(wb, `應付帳款_${month}.xlsx`);
  }

  const MonthInput = () => (
    <div className="flex items-center gap-1">
      <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="h-8 text-sm w-36" />
      {month && (
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setMonth("")}>
          全部
        </Button>
      )}
    </div>
  );

  const emptyRow = (cols: number, msg: string) => (
    <tr><td colSpan={cols} style={{ textAlign: "center", color: "var(--os-text-3)", padding: "40px 0", fontSize: 13 }}>{msg}</td></tr>
  );

  function trHover(e: React.MouseEvent<HTMLTableRowElement>, enter: boolean) {
    e.currentTarget.style.background = enter ? "var(--os-amber-soft)" : "";
  }

  const transferStatusBadge = (status: string) => {
    if (status === "billed") return { label: "已開帳", color: "var(--os-info)",    bg: "var(--os-info-bg)" };
    if (status === "void")   return { label: "已作廢", color: "var(--os-text-3)",  bg: "var(--os-surface-2)" };
    return                          { label: "待結算", color: "var(--os-text-2)",  bg: "var(--os-surface-2)" };
  };

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 16 }} className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-3" style={{ borderBottom: '1px solid var(--os-border)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>帳務管理</h1>
          <span style={{ fontSize: 13, color: "var(--os-text-2)" }}>
            本月應付 <strong style={{ color: "var(--os-amber-text)", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(kpiTotalPayable)}</strong>
          </span>
          <span style={{ fontSize: 13, color: "var(--os-text-2)" }}>
            已付 <strong style={{ color: "var(--os-success)", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(kpiPaid)}</strong>
          </span>
          <span style={{ fontSize: 13, color: "var(--os-text-2)" }}>
            待付 <strong style={{ color: "var(--os-danger)", fontVariantNumeric: "tabular-nums" }}>{fmtAmt(kpiPending)}</strong>
          </span>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
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

        {/* ── Tab: 應付帳款 ─────────────────────────────────── */}
        <TabsContent value="payables">
          <div className="space-y-3 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <MonthInput />
              <Select value={payFilterStatus} onValueChange={setPayFilterStatus}>
                <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  {Object.entries(PAYABLE_BADGE).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => generatePayables.mutate({ month })} disabled={generatePayables.isPending || !month}>
                  <RefreshCw className="w-3.5 h-3.5" /> 自動匯總本月帳款
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => { setCpMonth(month); setShowCreatePayable(true); }}>
                  <Plus className="w-3.5 h-3.5" /> 手動新增
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={handleExportPayables}>
                  <FileSpreadsheet className="w-3.5 h-3.5" /> 匯出 Excel
                </Button>
              </div>
            </div>
            <div style={{ ...panelSt }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                    {["廠商","月份","應付金額","退佣抵扣","實際應付","已付","狀態","預計付款日","銀行摘要","操作"].map((h, i) => (
                      <th key={h} className={i < 2 || i >= 7 ? "text-left p-3" : "text-right p-3"} style={{ ...thSt, textAlign: i === 6 ? "center" : i === 9 ? "center" : undefined }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(payables as any[]).length === 0 ? emptyRow(10, "本月尚無應付帳款，請先點擊「自動匯總本月帳款」") : (payables as any[]).map((p: any) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                      onMouseEnter={e => trHover(e, true)} onMouseLeave={e => trHover(e, false)}>
                      <td className="p-3 font-medium" style={{ color: "var(--os-text-1)" }}>{p.supplierName}</td>
                      <td className="p-3" style={{ color: "var(--os-text-3)" }}>{p.month}</td>
                      <td className="p-3 text-right">{fmtAmt(p.totalAmount)}</td>
                      <td className="p-3 text-right" style={{ color: "var(--os-success)" }}>{Number(p.rebateAmount) > 0 ? fmtAmt(p.rebateAmount) : "-"}</td>
                      <td className="p-3 text-right font-medium">{fmtAmt(p.netPayable)}</td>
                      <td className="p-3 text-right">{fmtAmt(p.paidAmount)}</td>
                      <td className="p-3 text-center"><StatusBadge cfg={PAYABLE_BADGE} value={p.status} /></td>
                      <td className="p-3 text-xs" style={{ color: "var(--os-text-3)" }}>{p.dueDate ?? "-"}</td>
                      <td className="p-3 text-xs max-w-[120px] truncate" style={{ color: "var(--os-text-3)" }}>{p.bankRef ?? "-"}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {p.status !== "paid" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => { setPayTarget(p); setPayAmt(""); setPayBankRef(""); setPayNote(""); setShowPayDialog(true); }}>
                              登記付款
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => navigate(`/dashboard/purchasing?supplier=${encodeURIComponent(p.supplierName)}`)}>
                            查看明細
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: 銀行明細對帳 ─────────────────────────────── */}
        <TabsContent value="bank">
          <div className="space-y-3 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <MonthInput />
              <Select value={bankFilterStatus} onValueChange={setBankFilterStatus}>
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="unmatched">未對帳</SelectItem>
                  <SelectItem value="suggested">建議中</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => { setBankPreview([]); setBankBatchName(`台新_${month}`); setShowBankImport(true); }}>
                  <Upload className="w-3.5 h-3.5" /> 匯入銀行明細 Excel
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => autoMatch.mutate({ month })} disabled={autoMatch.isPending || !month}>
                  <RefreshCw className="w-3.5 h-3.5" /> 自動比對
                </Button>
              </div>
            </div>
            <div style={{ ...panelSt }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                    {["日期","摘要","支出","收入","餘額","對帳狀態","操作"].map((h, i) => (
                      <th key={h} className={i < 2 ? "text-left p-3" : "text-right p-3"} style={{ ...thSt, textAlign: i === 5 || i === 6 ? "center" : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = (bankTxs as any[]).filter(tx => {
                      if (bankFilterStatus === "all") return true;
                      if (bankFilterStatus === "unmatched") return tx.matchedType === "unmatched";
                      if (bankFilterStatus === "suggested") return tx.matchedType !== "unmatched" && !tx.confirmedBy;
                      if (bankFilterStatus === "confirmed") return !!tx.confirmedBy;
                      return true;
                    });
                    if (filtered.length === 0) return emptyRow(7,
                      (bankTxs as any[]).length === 0 ? "本月尚無銀行明細，請先匯入" : "無符合篩選條件的資料"
                    );
                    return filtered.map((tx: any) => {
                      const isConfirmed = !!tx.confirmedBy;
                      const hasSuggestion = tx.matchedType && tx.matchedType !== "unmatched" && !isConfirmed;
                      return (
                        <tr key={tx.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                          onMouseEnter={e => trHover(e, true)} onMouseLeave={e => trHover(e, false)}>
                          <td className="p-3 text-xs" style={{ color: "var(--os-text-3)" }}>{tx.transactionDate}</td>
                          <td className="p-3 text-xs max-w-[200px]">
                            <div style={{ color: "var(--os-text-1)" }}>{tx.summary}</div>
                            {tx.note1 && <div style={{ color: "var(--os-text-3)" }}>{tx.note1}</div>}
                          </td>
                          <td className="p-3 text-right" style={{ color: "var(--os-danger)" }}>{Number(tx.debit) > 0 ? fmtAmt(tx.debit) : "-"}</td>
                          <td className="p-3 text-right" style={{ color: "var(--os-success)" }}>{Number(tx.credit) > 0 ? fmtAmt(tx.credit) : "-"}</td>
                          <td className="p-3 text-right text-xs" style={{ color: "var(--os-text-3)" }}>{Number(tx.balance) > 0 ? fmtAmt(tx.balance) : "-"}</td>
                          <td className="p-3 text-center">
                            {isConfirmed ? (
                              <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "var(--os-success-bg)", color: "var(--os-success)" }}>已確認</span>
                            ) : hasSuggestion ? (
                              <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "var(--os-warning-bg)", color: "var(--os-warning)" }}>系統建議（{tx.matchScore ?? "?"}%）</span>
                            ) : (
                              <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, background: "var(--os-surface-2)", color: "var(--os-text-3)" }}>未對帳</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {!isConfirmed && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => { setMatchTarget(tx); setMatchType(hasSuggestion ? tx.matchedType : "payable"); setShowConfirmMatch(true); }}>
                                {hasSuggestion ? "確認對帳" : "手動對帳"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: 退佣管理 ─────────────────────────────────── */}
        <TabsContent value="rebate">
          <div className="space-y-3 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <MonthInput />
              <div className="ml-auto">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => calcRebates.mutate({ month })} disabled={calcRebates.isPending || !month}>
                  <RefreshCw className="w-3.5 h-3.5" /> 計算本月退佣
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "廣弘", rule: "叫貨總額 ÷ 1.12，差額退佣，扣 $30 手續費" },
                { name: "伯享", rule: "差價退佣（人工輸入）" },
                { name: "韓濟", rule: "差價退佣，直接抵貨款" },
              ].map(r => (
                <div key={r.name} style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 10, padding: "12px 16px" }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: "var(--os-text-1)", marginBottom: 4 }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: "var(--os-text-3)" }}>{r.rule}</p>
                </div>
              ))}
            </div>
            <div style={{ ...panelSt }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                    {["廠商","月份","計算方式","基準金額","退佣金額","手續費","實收退佣","狀態","操作"].map((h, i) => (
                      <th key={h} className={i < 3 ? "text-left p-3" : "text-right p-3"} style={{ ...thSt, textAlign: i === 7 || i === 8 ? "center" : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rebates as any[]).length === 0 ? emptyRow(9, "本月尚無退佣資料，請先點擊「計算本月退佣」") : (rebates as any[]).map((r: any) => (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                      onMouseEnter={e => trHover(e, true)} onMouseLeave={e => trHover(e, false)}>
                      <td className="p-3 font-medium" style={{ color: "var(--os-text-1)" }}>{r.supplierName}</td>
                      <td className="p-3" style={{ color: "var(--os-text-3)" }}>{r.month}</td>
                      <td className="p-3 text-xs" style={{ color: "var(--os-text-3)" }}>
                        {r.rebateType === "percentage" ? "百分比（÷1.12）" : r.rebateType === "offset" ? "抵貨款" : "人工輸入"}
                      </td>
                      <td className="p-3 text-right">{fmtAmt(r.baseAmount)}</td>
                      <td className="p-3 text-right">{fmtAmt(r.rebateAmount)}</td>
                      <td className="p-3 text-right" style={{ color: "var(--os-text-3)" }}>{Number(r.handlingFee) > 0 ? fmtAmt(r.handlingFee) : "-"}</td>
                      <td className="p-3 text-right font-medium">{fmtAmt(r.netRebate)}</td>
                      <td className="p-3 text-center"><StatusBadge cfg={REBATE_BADGE} value={r.status ?? "pending"} /></td>
                      <td className="p-3 text-center">
                        {(r.rebateType === "manual" || r.rebateType === "offset" || r.status === "pending") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => { setRebateTarget(r); setRebateManualAmt(String(r.rebateAmount ?? "")); setRebateBankRef(r.bankRef ?? ""); setShowRebateEdit(true); }}>
                            {r.rebateType === "manual" ? "人工輸入金額" : r.rebateType === "offset" ? "登記抵貨款" : "登記收款"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: 提貨調貨 ─────────────────────────────────── */}
        <TabsContent value="transfer">
          <div className="space-y-3 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <MonthInput />
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => { setTransferPreview([]); setShowTransferImport(true); }}>
                  <Upload className="w-3.5 h-3.5" /> 匯入 Excel
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                  onClick={() => { setTransferDate(new Date().toISOString().slice(0, 10)); setShowNewTransfer(true); }}>
                  <Plus className="w-3.5 h-3.5" /> 新增一筆
                </Button>
                <Button size="sm" className="h-8 text-xs text-white" style={amberBtn}
                  onClick={() => setShowBillConfirm(true)}>
                  月底結算開帳
                </Button>
              </div>
            </div>
            {(transfers as any[]).length > 0 && (() => {
              const storeMap = new Map<string, number>();
              (transfers as any[]).forEach((t: any) => storeMap.set(t.toStore, (storeMap.get(t.toStore) ?? 0) + Number(t.amount ?? 0)));
              return (
                <div className="flex flex-wrap gap-2">
                  {Array.from(storeMap.entries()).map(([s, amt]) => (
                    <div key={s} style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
                      <span style={{ color: "var(--os-text-3)" }}>{s}：</span>
                      <span style={{ fontWeight: 600, color: "var(--os-amber-text)" }}>{fmtAmt(amt)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ ...panelSt }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--os-surface-2)", borderBottom: "1px solid var(--os-border)" }}>
                    {["日期","收貨門市","品名","數量","單位","單價","小計","狀態","操作"].map((h, i) => (
                      <th key={h} className={i < 2 || i === 4 ? "text-left p-3" : "text-right p-3"} style={{ ...thSt, textAlign: i === 7 || i === 8 ? "center" : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(transfers as any[]).length === 0 ? emptyRow(9, "本月尚無提貨調貨記錄") : (transfers as any[]).map((t: any) => {
                    const bs = transferStatusBadge(t.status);
                    return (
                      <tr key={t.id} style={{ borderTop: "1px solid var(--os-border-2)" }}
                        onMouseEnter={e => trHover(e, true)} onMouseLeave={e => trHover(e, false)}>
                        <td className="p-3 text-xs" style={{ color: "var(--os-text-3)" }}>{t.transferDate}</td>
                        <td className="p-3" style={{ color: "var(--os-text-1)" }}>{t.toStore}</td>
                        <td className="p-3">{t.productName}</td>
                        <td className="p-3 text-right">{t.quantity}</td>
                        <td className="p-3" style={{ color: "var(--os-text-3)" }}>{t.unit}</td>
                        <td className="p-3 text-right">{fmtAmt(t.unitPrice)}</td>
                        <td className="p-3 text-right font-medium">{fmtAmt(t.amount)}</td>
                        <td className="p-3 text-center">
                          <span style={{ fontSize: 12, padding: "1px 8px", borderRadius: 4, background: bs.bg, color: bs.color }}>{bs.label}</span>
                        </td>
                        <td className="p-3 text-center">
                          {t.status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              style={{ color: "var(--os-danger)", borderColor: "var(--os-danger-bg)" }}
                              onClick={() => { if (confirm("確認作廢？")) voidTransfer.mutate({ id: t.id }); }}>
                              作廢
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* ═══ 登記付款 Dialog ══════════════════════════════════ */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>登記付款</DialogTitle></DialogHeader>
          {payTarget && (
            <div className="space-y-3 py-2">
              <div style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                <span style={{ color: "var(--os-text-3)" }}>廠商：</span><strong style={{ color: "var(--os-text-1)" }}>{payTarget.supplierName}</strong>
                <span style={{ marginLeft: 16, color: "var(--os-text-3)" }}>待付：</span>
                <strong style={{ color: "var(--os-danger)" }}>{fmtAmt(Number(payTarget.netPayable ?? payTarget.totalAmount) - Number(payTarget.paidAmount ?? 0))}</strong>
              </div>
              <div>
                <Label className="text-xs">付款金額 *</Label>
                <Input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="0" className="h-8 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">銀行摘要</Label>
                <Input value={payBankRef} onChange={e => setPayBankRef(e.target.value)} placeholder="台新轉帳 / 現金" className="h-8 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">備註</Label>
                <Input value={payNote} onChange={e => setPayNote(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>取消</Button>
            <Button style={amberBtn} disabled={!payAmt || markPaid.isPending}
              onClick={() => {
                if (!payTarget) return;
                try { markPaid.mutate({ id: payTarget.id, paidAmount: Number(payAmt), bankRef: payBankRef || undefined, note: payNote || undefined }); }
                catch (e: any) { toast.error(e.message); }
              }}>確認付款</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 銀行明細匯入 Dialog ═══════════════════════════════ */}
      <Dialog open={showBankImport} onOpenChange={open => { if (!open) { setShowBankImport(false); setBankPreview([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>匯入銀行明細 Excel</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 80, border: "2px dashed var(--os-border)", borderRadius: 10, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--os-amber)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--os-border)")}>
              <Upload style={{ width: 20, height: 20, color: "var(--os-text-3)", marginBottom: 4 }} />
              <span style={{ fontSize: 13, color: "var(--os-text-3)" }}>點擊選擇 .xlsx 銀行明細</span>
              <input ref={bankFileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) parseBankExcel(f); }} />
            </label>
            {bankPreview.length > 0 && (
              <div style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--os-text-2)" }}>
                已解析 <strong>{bankPreview.length}</strong> 筆｜日期：{bankPreview[0]?.transactionDate} ～ {bankPreview[bankPreview.length - 1]?.transactionDate}
              </div>
            )}
            <div>
              <Label className="text-xs">批次名稱（防重複）</Label>
              <Input value={bankBatchName} onChange={e => setBankBatchName(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBankImport(false); setBankPreview([]); }}>取消</Button>
            <Button style={amberBtn} disabled={bankPreview.length === 0 || !bankBatchName || importBank.isPending}
              onClick={() => {
                try { importBank.mutate({ importBatch: bankBatchName, rows: bankPreview }); }
                catch (e: any) { toast.error(e.message); }
              }}>{importBank.isPending ? "匯入中..." : "確認匯入"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 確認對帳 Dialog ═══════════════════════════════════ */}
      <Dialog open={showConfirmMatch} onOpenChange={setShowConfirmMatch}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>對帳確認</DialogTitle></DialogHeader>
          {matchTarget && (
            <div className="space-y-3 py-2">
              <div style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                <div><span style={{ color: "var(--os-text-3)" }}>日期：</span>{matchTarget.transactionDate}</div>
                <div><span style={{ color: "var(--os-text-3)" }}>摘要：</span>{matchTarget.summary}</div>
                <div><span style={{ color: "var(--os-text-3)" }}>金額：</span>
                  {Number(matchTarget.debit) > 0 ? `支出 ${fmtAmt(matchTarget.debit)}` : `收入 ${fmtAmt(matchTarget.credit)}`}
                </div>
              </div>
              <div>
                <Label className="text-xs">對帳類型</Label>
                <Select value={matchType} onValueChange={setMatchType}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payable">廠商付款</SelectItem>
                    <SelectItem value="receivable">加盟主收款</SelectItem>
                    <SelectItem value="rebate">退佣入帳</SelectItem>
                    <SelectItem value="salary">薪資</SelectItem>
                    <SelectItem value="expense">費用</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmMatch(false)}>取消</Button>
            <Button style={amberBtn} disabled={confirmMatchMut.isPending}
              onClick={() => {
                if (!matchTarget) return;
                try { confirmMatchMut.mutate({ transactionId: matchTarget.id, matchedType: matchType as any, matchedId: matchTarget.matchedId ?? undefined }); }
                catch (e: any) { toast.error(e.message); }
              }}>確認對帳</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 退佣登記 Dialog ════════════════════════════════════ */}
      <Dialog open={showRebateEdit} onOpenChange={setShowRebateEdit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{rebateTarget?.rebateType === "manual" ? "人工輸入退佣金額" : "登記退佣收款"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">退佣金額</Label>
              <Input type="number" value={rebateManualAmt} onChange={e => setRebateManualAmt(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">銀行摘要</Label>
              <Input value={rebateBankRef} onChange={e => setRebateBankRef(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRebateEdit(false)}>取消</Button>
            <Button style={amberBtn} disabled={!rebateManualAmt || updateRebate.isPending}
              onClick={() => {
                if (!rebateTarget) return;
                try { updateRebate.mutate({ id: rebateTarget.id, rebateAmount: Number(rebateManualAmt), bankRef: rebateBankRef || undefined, status: "received" }); }
                catch (e: any) { toast.error(e.message); }
              }}>確認</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 新增提貨調貨 Dialog ════════════════════════════════ */}
      <Dialog open={showNewTransfer} onOpenChange={setShowNewTransfer}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>新增提貨調貨</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">日期 *</Label>
              <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div><Label className="text-xs">收貨門市 *</Label>
              <Input value={transferStore} onChange={e => setTransferStore(e.target.value)} placeholder="逢甲旗艦店" className="h-8 text-sm mt-1" />
            </div>
            <div><Label className="text-xs">品名 *</Label>
              <Input value={transferProduct} onChange={e => setTransferProduct(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">數量</Label>
                <Input type="number" value={transferQty} onChange={e => setTransferQty(Number(e.target.value))} className="h-8 text-sm mt-1" />
              </div>
              <div><Label className="text-xs">單位</Label>
                <Input value={transferUnit} onChange={e => setTransferUnit(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
              <div><Label className="text-xs">單價</Label>
                <Input type="number" value={transferPrice} onChange={e => setTransferPrice(Number(e.target.value))} className="h-8 text-sm mt-1" />
              </div>
            </div>
            <div><Label className="text-xs">備註</Label>
              <Input value={transferNote} onChange={e => setTransferNote(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTransfer(false)}>取消</Button>
            <Button style={amberBtn} disabled={!transferDate || !transferStore || !transferProduct || createTransfer.isPending}
              onClick={() => {
                try { createTransfer.mutate({ transferDate, toStore: transferStore, productName: transferProduct, quantity: transferQty, unit: transferUnit, unitPrice: transferPrice, note: transferNote || undefined }); }
                catch (e: any) { toast.error(e.message); }
              }}>新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 提貨調貨 Excel 匯入 Dialog ═════════════════════════ */}
      <Dialog open={showTransferImport} onOpenChange={open => { if (!open) { setShowTransferImport(false); setTransferPreview([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>匯入提貨調貨明細 Excel</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 80, border: "2px dashed var(--os-border)", borderRadius: 10, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--os-amber)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--os-border)")}>
              <Upload style={{ width: 20, height: 20, color: "var(--os-text-3)", marginBottom: 4 }} />
              <span style={{ fontSize: 13, color: "var(--os-text-3)" }}>點擊選擇 .xlsx 提貨調貨明細</span>
              <input type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) parseTransferExcel(f); }} />
            </label>
            {transferPreview.length > 0 && (
              <div style={{ background: "var(--os-surface-2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--os-text-2)" }}>
                已解析 <strong>{transferPreview.length}</strong> 筆
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTransferImport(false); setTransferPreview([]); }}>取消</Button>
            <Button style={amberBtn} disabled={transferPreview.length === 0 || importTransfersMut.isPending}
              onClick={() => {
                try { importTransfersMut.mutate({ month, rows: transferPreview }); }
                catch (e: any) { toast.error(e.message); }
              }}>{importTransfersMut.isPending ? "匯入中..." : "確認匯入"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ 月底結算確認 Dialog ════════════════════════════════ */}
      <Dialog open={showBillConfirm} onOpenChange={setShowBillConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>月底結算開帳</DialogTitle></DialogHeader>
          <p style={{ fontSize: 13, color: "var(--os-text-2)", padding: "8px 0" }}>
            確認要將本月（{month}）所有「待結算」的提貨調貨開立帳款嗎？<br />
            開帳後可至「加盟主帳款」頁面確認。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBillConfirm(false)}>取消</Button>
            <Button style={amberBtn} disabled={billTransfers.isPending || !month}
              onClick={() => {
                try { billTransfers.mutate({ month }); }
                catch (e: any) { toast.error(e.message); }
              }}>確認結算</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手動新增應付帳款 Dialog */}
      <Dialog open={showCreatePayable} onOpenChange={setShowCreatePayable}>
        <DialogContent>
          <DialogHeader><DialogTitle>手動新增應付帳款</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>廠商名稱</Label>
              <Select value={cpSupplier} onValueChange={setCpSupplier}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="選擇廠商" /></SelectTrigger>
                <SelectContent>
                  {(allSuppliers as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>月份</Label>
              <Input type="month" value={cpMonth} onChange={e => setCpMonth(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>應付金額（必填）</Label>
              <Input type="number" value={cpAmount} onChange={e => setCpAmount(e.target.value)} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>預計付款日（選填）</Label>
              <Input type="date" value={cpDueDate} onChange={e => setCpDueDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>備註（選填）</Label>
              <textarea
                style={{ width: "100%", border: "1px solid var(--os-border)", borderRadius: 6, padding: 8, fontSize: 13, minHeight: 72, resize: "none", background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" }}
                value={cpNote}
                onChange={e => setCpNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePayable(false)}>取消</Button>
            <Button
              onClick={() => {
                if (!cpSupplier || !cpAmount || Number(cpAmount) <= 0) {
                  toast.error("請填寫廠商名稱與應付金額");
                  return;
                }
                createPayable.mutate({
                  supplierName: cpSupplier,
                  month: cpMonth,
                  totalAmount: Number(cpAmount),
                  dueDate: cpDueDate || undefined,
                  note: cpNote || undefined,
                });
              }}
              disabled={createPayable.isPending}
              style={amberBtn}
            >
              {createPayable.isPending ? "新增中…" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  );
}

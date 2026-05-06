import { ChangeEvent, useEffect, useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function fmtMoney(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDateStr(dateStr: string, deltaDays: number) {
  const base = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(base.getTime())) return todayStr();
  base.setDate(base.getDate() + deltaDays);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function n(v: string) { return Number(v) || 0; }

const labelSt: React.CSSProperties = { fontSize: 12, color: 'var(--os-text-3)', display: 'block', marginBottom: 4 };
const cardSt: React.CSSProperties = {
  background: 'var(--os-surface)',
  border: '1px solid var(--os-border)',
  borderRadius: 10,
  padding: '16px 20px',
};
const sectionTitleSt: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--os-text-1)', marginBottom: 12 };

interface DailyForm {
  instoreSales: string; uberSales: string; pandaSales: string;
  guestInstore: string; guestUber: string; guestPanda: string;
  phoneOrderCount: string; phoneOrderAmount: string;
  deliveryOrderCount: string; deliveryOrderAmount: string;
  voidCount: string; voidAmount: string;
  cashVoucherCount: string; loyaltyCardCount: string;
  staffFull: string; staffPart: string; laborHours: string; dailyCost: string;
  reviewGood: string; reviewBad: string; note: string;
}

type MonthlyForm = {
  electricityFee: string; waterFee: string; rentFee: string; miscFee: string;
  staffSalaryCost: string; performanceReview: string; competitorInfo: string;
  monthlyPlan: string; staffChanges: string; otherNotes: string;
  targetSales: string; targetGuest: string; targetProductivity: string;
};

type MonthlySummaryRow = {
  storeName: string; reportDays?: number; weekdayDays?: number; holidayDays?: number;
  totalSales?: number; instoreSales?: number; uberSales?: number; pandaSales?: number;
  guestTotal?: number; avgWeekdaySales?: number; avgHolidaySales?: number; avgProductivity?: number;
};

type MonthlyReportRow = {
  storeName: string; electricityFee?: number; waterFee?: number; rentFee?: number; miscFee?: number;
  staffSalaryCost?: number; performanceReview?: string | null; competitorInfo?: string | null;
  monthlyPlan?: string | null; staffChanges?: string | null; otherNotes?: string | null;
  targetSales?: number; targetGuest?: number; targetProductivity?: number;
};

const emptyForm = (): DailyForm => ({
  instoreSales: "", uberSales: "", pandaSales: "",
  guestInstore: "", guestUber: "", guestPanda: "",
  phoneOrderCount: "", phoneOrderAmount: "",
  deliveryOrderCount: "", deliveryOrderAmount: "",
  voidCount: "", voidAmount: "",
  cashVoucherCount: "", loyaltyCardCount: "",
  staffFull: "", staffPart: "", laborHours: "", dailyCost: "",
  reviewGood: "", reviewBad: "", note: "",
});

const emptyMonthlyForm = (): MonthlyForm => ({
  electricityFee: "", waterFee: "", rentFee: "", miscFee: "",
  staffSalaryCost: "", performanceReview: "", competitorInfo: "",
  monthlyPlan: "", staffChanges: "", otherNotes: "",
  targetSales: "", targetGuest: "", targetProductivity: "",
});

function DailyInputTab() {
  const [storeName, setStoreName] = useState("");
  const [reportDate, setReportDate] = useState(todayStr());
  const [form, setForm] = useState<DailyForm>(emptyForm());
  const [isDirty, setIsDirty] = useState(false);
  const utils = trpc.useUtils();

  const storesQuery = trpc.dailyReport.getStores.useQuery();
  const stores = storesQuery.data ?? [];

  const holidayQuery = trpc.dailyReport.checkHoliday.useQuery({ date: reportDate }, { enabled: !!reportDate });
  const isHoliday = holidayQuery.data?.isHoliday ?? false;

  const existingQuery = trpc.dailyReport.getByDate.useQuery(
    { storeName, reportDate },
    { enabled: !!storeName && !!reportDate }
  );

  useEffect(() => {
    if (!storeName || !reportDate) return;
    const data = existingQuery.data;
    if (data) {
      setForm({
        instoreSales: String(data.instoreSales ?? ""),
        uberSales: String(data.uberSales ?? ""),
        pandaSales: String(data.pandaSales ?? ""),
        guestInstore: String(data.guestInstore ?? ""),
        guestUber: String(data.guestUber ?? ""),
        guestPanda: String(data.guestPanda ?? ""),
        phoneOrderCount: String(data.phoneOrderCount ?? ""),
        phoneOrderAmount: String(data.phoneOrderAmount ?? ""),
        deliveryOrderCount: String(data.deliveryOrderCount ?? ""),
        deliveryOrderAmount: String(data.deliveryOrderAmount ?? ""),
        voidCount: String(data.voidCount ?? ""),
        voidAmount: String(data.voidAmount ?? ""),
        cashVoucherCount: String(data.cashVoucherCount ?? ""),
        loyaltyCardCount: String(data.loyaltyCardCount ?? ""),
        staffFull: String(data.staffFull ?? ""),
        staffPart: String(data.staffPart ?? ""),
        laborHours: String(data.laborHours ?? ""),
        dailyCost: String(data.dailyCost ?? ""),
        reviewGood: String(data.reviewGood ?? ""),
        reviewBad: String(data.reviewBad ?? ""),
        note: data.note ?? "",
      });
      setIsDirty(false);
      return;
    }
    if (existingQuery.isFetched) { setForm(emptyForm()); setIsDirty(false); }
  }, [existingQuery.data, existingQuery.isFetched, reportDate, storeName]);

  const submitMutation = trpc.dailyReport.submit.useMutation({
    onSuccess: () => {
      toast.success(`${storeName} ${reportDate} 日報已儲存`);
      setIsDirty(false);
      utils.dailyReport.getByDate.invalidate({ storeName, reportDate });
      utils.dailyReport.monthlySummary.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalSales = n(form.instoreSales) + n(form.uberSales) + n(form.pandaSales);
  const guestTotal = n(form.guestInstore) + n(form.guestUber) + n(form.guestPanda);
  const avgTicket = guestTotal > 0 ? Math.round(totalSales / guestTotal) : 0;

  function setField(k: keyof DailyForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsDirty(true);
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
    };
  }

  function canSwitchContext() {
    if (!isDirty || submitMutation.isPending) return true;
    return window.confirm("目前有未儲存內容，確定要切換門市或日期嗎？");
  }

  const inputCls = "h-12 text-right text-base font-medium";

  return (
    <div className="space-y-4">
      {/* Context selector */}
      <div style={cardSt}>
        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div>
            <label style={labelSt}>門市</label>
            <Select value={storeName} onValueChange={v => { if (canSwitchContext()) setStoreName(v); }}>
              <SelectTrigger className="h-12"><SelectValue placeholder="請選擇門市" /></SelectTrigger>
              <SelectContent>
                {stores.map((store) => <SelectItem key={store} value={store}>{store}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label style={labelSt}>結算日期</label>
            <div className="flex items-center gap-2">
              <Input type="date" value={reportDate} onChange={e => { if (canSwitchContext()) setReportDate(e.target.value); }} className="h-12" />
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                background: isHoliday ? 'var(--os-warning-bg)' : 'var(--os-surface-2)',
                color: isHoliday ? 'var(--os-warning)' : 'var(--os-text-3)',
                whiteSpace: 'nowrap',
              }}>
                {isHoliday ? "假日" : "平日"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { if (canSwitchContext()) setReportDate(p => shiftDateStr(p, -1)); }}>前一天</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { if (canSwitchContext()) setReportDate(todayStr()); }}>今天</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { if (canSwitchContext()) setReportDate(p => shiftDateStr(p, 1)); }}>後一天</Button>
            </div>
          </div>
        </div>
        {existingQuery.data && (
          <p style={{ fontSize: 12, color: 'var(--os-warning)', marginTop: 12 }}>
            這一天已經有資料，重新儲存會直接覆蓋原本內容。
          </p>
        )}
      </div>

      {/* Sales */}
      <div style={cardSt}>
        <div style={sectionTitleSt}>營業額</div>
        <div className="space-y-3">
          {[
            { label: "店內營業額", key: "instoreSales" },
            { label: "Uber Eats 營業額", key: "uberSales" },
            { label: "Foodpanda 營業額", key: "pandaSales" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={labelSt}>{label}</label>
              <Input type="number" value={form[key as keyof DailyForm]} onChange={setField(key as keyof DailyForm)} className={inputCls} placeholder="0" />
            </div>
          ))}
          {/* total bar */}
          <div style={{ background: 'var(--os-text-1)', borderRadius: 10, padding: '14px 16px', color: '#fff' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, opacity: 0.75 }}>當日總營業額</span>
              <span style={{ fontSize: 22, fontWeight: 700 }}>{fmtMoney(totalSales)}</span>
            </div>
            {guestTotal > 0 && (
              <div className="flex items-center justify-between mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8 }}>
                <span style={{ fontSize: 12, opacity: 0.65 }}>平均客單價</span>
                <span style={{ fontWeight: 600 }}>{fmtMoney(avgTicket)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guest & Orders */}
      <div style={cardSt}>
        <div style={sectionTitleSt}>客流與訂單</div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "店內客數", key: "guestInstore" },
              { label: "Uber 客數", key: "guestUber" },
              { label: "Panda 客數", key: "guestPanda" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label style={labelSt}>{label}</label>
                <Input type="number" value={form[key as keyof DailyForm]} onChange={setField(key as keyof DailyForm)} className={inputCls} placeholder="0" />
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--os-surface-2)', borderRadius: 8, padding: '10px 14px' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: 'var(--os-text-3)' }}>總來客數</span>
              <span style={{ fontWeight: 600, color: 'var(--os-text-1)' }}>{guestTotal.toLocaleString("zh-TW")} 人</span>
            </div>
          </div>

          {[
            [{ label: "電話訂單數", key: "phoneOrderCount" }, { label: "電話訂單金額", key: "phoneOrderAmount" }],
            [{ label: "外送訂單數", key: "deliveryOrderCount" }, { label: "外送訂單金額", key: "deliveryOrderAmount" }],
            [{ label: "作廢筆數", key: "voidCount" }, { label: "作廢金額", key: "voidAmount" }],
            [{ label: "現金券使用數", key: "cashVoucherCount" }, { label: "會員卡使用數", key: "loyaltyCardCount" }],
          ].map((pair, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              {pair.map(({ label, key }) => (
                <div key={key}>
                  <label style={labelSt}>{label}</label>
                  <Input type="number" value={form[key as keyof DailyForm]} onChange={setField(key as keyof DailyForm)} className={inputCls} placeholder="0" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Staff & Notes */}
      <div style={cardSt}>
        <div style={sectionTitleSt}>人力與備註</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[{ label: "正職人數", key: "staffFull" }, { label: "兼職人數", key: "staffPart" }].map(({ label, key }) => (
              <div key={key}>
                <label style={labelSt}>{label}</label>
                <Input type="number" value={form[key as keyof DailyForm]} onChange={setField(key as keyof DailyForm)} className={inputCls} placeholder="0" />
              </div>
            ))}
          </div>
          <div>
            <label style={labelSt}>總工時</label>
            <Input type="number" step="0.5" value={form.laborHours} onChange={setField("laborHours")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label style={labelSt}>當日成本</label>
            <Input type="number" value={form.dailyCost} onChange={setField("dailyCost")} className={inputCls} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ label: "Google 好評數", key: "reviewGood" }, { label: "Google 負評數", key: "reviewBad" }].map(({ label, key }) => (
              <div key={key}>
                <label style={labelSt}>{label}</label>
                <Input type="number" value={form[key as keyof DailyForm]} onChange={setField(key as keyof DailyForm)} className={inputCls} placeholder="0" />
              </div>
            ))}
          </div>
          <div>
            <label style={labelSt}>備註</label>
            <Textarea value={form.note} onChange={setField("note")} className="min-h-[100px] text-sm" placeholder="記錄當日狀況、異常事件、客訴或補充說明" />
          </div>
        </div>
      </div>

      <Button
        className="h-14 w-full text-base font-semibold text-white"
        style={{ background: 'var(--os-amber)' }}
        onClick={() => {
          if (!storeName) { toast.error("請先選擇門市"); return; }
          if (!reportDate) { toast.error("請先選擇日期"); return; }
          submitMutation.mutate({
            tenantId: 1, reportDate, storeName, isHoliday,
            instoreSales: n(form.instoreSales), uberSales: n(form.uberSales), pandaSales: n(form.pandaSales),
            guestInstore: n(form.guestInstore), guestUber: n(form.guestUber), guestPanda: n(form.guestPanda),
            phoneOrderCount: n(form.phoneOrderCount), phoneOrderAmount: n(form.phoneOrderAmount),
            deliveryOrderCount: n(form.deliveryOrderCount), deliveryOrderAmount: n(form.deliveryOrderAmount),
            voidCount: n(form.voidCount), voidAmount: n(form.voidAmount),
            cashVoucherCount: n(form.cashVoucherCount), loyaltyCardCount: n(form.loyaltyCardCount),
            staffFull: n(form.staffFull), staffPart: n(form.staffPart),
            laborHours: n(form.laborHours), dailyCost: n(form.dailyCost),
            reviewGood: n(form.reviewGood), reviewBad: n(form.reviewBad),
            note: form.note || undefined,
          });
        }}
        disabled={submitMutation.isPending || !storeName || !reportDate}
      >
        {submitMutation.isPending ? "儲存中..." : "儲存今日報表"}
      </Button>
    </div>
  );
}

interface MonthlyExpandState { [storeName: string]: boolean; }

function MonthlyOverviewTab() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [expanded, setExpanded] = useState<MonthlyExpandState>({});
  const [monthlyForms, setMonthlyForms] = useState<Record<string, MonthlyForm>>({});
  const utils = trpc.useUtils();

  const summaryQuery = trpc.dailyReport.monthlySummary.useQuery({ year: viewYear, month: viewMonth });
  const summaryData = summaryQuery.data;
  const dailyRows: MonthlySummaryRow[] = summaryData?.daily ?? [];
  const monthlyRows: MonthlyReportRow[] = summaryData?.monthly ?? [];

  useEffect(() => {
    if (!summaryData) return;
    const nextForms: Record<string, MonthlyForm> = {};
    for (const row of monthlyRows) {
      nextForms[row.storeName] = {
        electricityFee: String(row.electricityFee ?? ""),
        waterFee: String(row.waterFee ?? ""),
        rentFee: String(row.rentFee ?? ""),
        miscFee: String(row.miscFee ?? ""),
        staffSalaryCost: String(row.staffSalaryCost ?? ""),
        performanceReview: row.performanceReview ?? "",
        competitorInfo: row.competitorInfo ?? "",
        monthlyPlan: row.monthlyPlan ?? "",
        staffChanges: row.staffChanges ?? "",
        otherNotes: row.otherNotes ?? "",
        targetSales: String(row.targetSales ?? ""),
        targetGuest: String(row.targetGuest ?? ""),
        targetProductivity: String(row.targetProductivity ?? ""),
      };
    }
    setMonthlyForms(nextForms);
    setExpanded({});
  }, [summaryData, monthlyRows]);

  const submitMonthly = trpc.dailyReport.submitMonthly.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${vars.storeName} ${viewYear}/${viewMonth} 月報已儲存`);
      utils.dailyReport.monthlySummary.invalidate({ year: viewYear, month: viewMonth });
    },
    onError: (e) => toast.error(e.message),
  });

  function getForm(storeName: string) { return monthlyForms[storeName] ?? emptyMonthlyForm(); }
  function setFormField(storeName: string, key: keyof MonthlyForm, value: string) {
    setMonthlyForms((prev) => ({ ...prev, [storeName]: { ...getForm(storeName), ...(prev[storeName] ?? {}), [key]: value } }));
  }

  function handleSaveMonthly(storeName: string) {
    const form = getForm(storeName);
    submitMonthly.mutate({
      storeName, year: viewYear, month: viewMonth,
      electricityFee: n(form.electricityFee), waterFee: n(form.waterFee),
      rentFee: n(form.rentFee), miscFee: n(form.miscFee),
      staffSalaryCost: n(form.staffSalaryCost),
      performanceReview: form.performanceReview || undefined,
      competitorInfo: form.competitorInfo || undefined,
      monthlyPlan: form.monthlyPlan || undefined,
      staffChanges: form.staffChanges || undefined,
      otherNotes: form.otherNotes || undefined,
      targetSales: n(form.targetSales), targetGuest: n(form.targetGuest), targetProductivity: n(form.targetProductivity),
    });
  }

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const totalSalesAll = dailyRows.reduce((sum, row) => sum + Number(row.totalSales ?? 0), 0);
  const thSt: React.CSSProperties = { color: 'var(--os-text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="space-y-4">
      {/* Year/Month selector + total */}
      <div style={cardSt}>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(viewYear)} onValueChange={(v) => setViewYear(Number(v))}>
            <SelectTrigger className="h-10 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(viewMonth)} onValueChange={(v) => setViewMonth(Number(v))}>
            <SelectTrigger className="h-10 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m} value={String(m)}>{m} 月</SelectItem>)}
            </SelectContent>
          </Select>
          <div style={{ marginLeft: 'auto', background: 'var(--os-text-1)', borderRadius: 10, padding: '10px 16px', textAlign: 'right', color: '#fff' }}>
            <p style={{ fontSize: 11, opacity: 0.65 }}>本月總營業額</p>
            <p style={{ fontSize: 16, fontWeight: 700 }}>{fmtMoney(totalSalesAll)}</p>
          </div>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--os-text-3)' }}>載入中...</div>
      ) : dailyRows.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--os-text-3)' }}>這個月份目前還沒有日報資料。</div>
      ) : (
        <>
          {dailyRows.map((row) => {
            const monthlyRow = monthlyRows.find((item) => item.storeName === row.storeName);
            const totalSales = Number(row.totalSales ?? 0);
            const instoreShare = totalSales > 0 ? Math.round((Number(row.instoreSales ?? 0) / totalSales) * 100) : 0;
            const uberShare = totalSales > 0 ? Math.round((Number(row.uberSales ?? 0) / totalSales) * 100) : 0;
            const pandaShare = totalSales > 0 ? Math.round((Number(row.pandaSales ?? 0) / totalSales) * 100) : 0;
            const achRate = monthlyRow?.targetSales && monthlyRow.targetSales > 0
              ? Math.round((totalSales / Number(monthlyRow.targetSales)) * 100) : null;
            const isOpen = !!expanded[row.storeName];
            const form = getForm(row.storeName);

            return (
              <div key={row.storeName} style={cardSt} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--os-text-1)' }}>{row.storeName}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { label: `平日 ${row.weekdayDays ?? 0} 天`, style: { background: 'var(--os-surface-2)', color: 'var(--os-text-2)' } },
                        { label: `假日 ${row.holidayDays ?? 0} 天`, style: { background: 'var(--os-surface-2)', color: 'var(--os-text-2)' } },
                        { label: `日報 ${row.reportDays ?? 0} 天`, style: { background: 'var(--os-amber-soft)', color: 'var(--os-amber-text)' } },
                      ].map(({ label, style }) => (
                        <span key={label} style={{ ...style, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>{label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--os-text-1)' }}>{fmtMoney(totalSales)}</p>
                    {achRate !== null && (
                      <p style={{ fontSize: 12, fontWeight: 500, color: achRate >= 100 ? 'var(--os-success)' : 'var(--os-warning)' }}>
                        目標達成率 {achRate}%
                      </p>
                    )}
                  </div>
                </div>

                {totalSales > 0 && (
                  <div>
                    <div style={{ display: 'flex', height: 8, overflow: 'hidden', borderRadius: 99, background: 'var(--os-surface-2)' }}>
                      <div style={{ width: `${instoreShare}%`, background: 'var(--os-text-1)' }} />
                      <div style={{ width: `${uberShare}%`, background: 'var(--os-success)' }} />
                      <div style={{ width: `${pandaShare}%`, background: 'var(--os-amber)' }} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3" style={{ fontSize: 12, color: 'var(--os-text-3)' }}>
                      <span>店內 {fmtMoney(row.instoreSales)}</span>
                      <span>Uber {fmtMoney(row.uberSales)}</span>
                      <span>Panda {fmtMoney(row.pandaSales)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "平均平日營業額", value: fmtMoney(row.avgWeekdaySales) },
                    { label: "平均假日營業額", value: fmtMoney(row.avgHolidaySales) },
                    { label: "平均生產力", value: `${fmtMoney(row.avgProductivity)}/h` },
                    { label: "總來客數", value: `${Number(row.guestTotal ?? 0).toLocaleString("zh-TW")} 人` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--os-surface-2)', borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--os-text-3)' }}>{label}</p>
                      <p style={{ fontWeight: 600, color: 'var(--os-text-1)', fontSize: 13 }}>{value}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  style={{ width: '100%', textAlign: 'center', paddingTop: 4, fontSize: 12, color: 'var(--os-text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setExpanded((prev) => ({ ...prev, [row.storeName]: !prev[row.storeName] }))}
                >
                  {isOpen ? "收起月報補充" : "展開月報補充（費用 / 目標 / 文字）"}
                </button>

                {isOpen && (
                  <div className="space-y-3" style={{ borderTop: '1px solid var(--os-border)', paddingTop: 16 }}>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["電費", "electricityFee"], ["水費", "waterFee"], ["租金", "rentFee"], ["雜費", "miscFee"],
                        ["薪資成本", "staffSalaryCost"], ["目標營業額", "targetSales"],
                        ["目標客數", "targetGuest"], ["目標生產力", "targetProductivity"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <label style={labelSt}>{label}</label>
                          <Input
                            type="number"
                            value={form[key as keyof MonthlyForm]}
                            onChange={(e) => setFormField(row.storeName, key as keyof MonthlyForm, e.target.value)}
                            className="h-10 text-sm"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                    {[
                      ["本月營運回顧", "performanceReview"], ["競品觀察", "competitorInfo"],
                      ["下月行動計畫", "monthlyPlan"], ["人員異動", "staffChanges"], ["其他備註", "otherNotes"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label style={labelSt}>{label}</label>
                        <Textarea
                          value={form[key as keyof MonthlyForm]}
                          onChange={(e) => setFormField(row.storeName, key as keyof MonthlyForm, e.target.value)}
                          className="min-h-[72px] text-sm"
                          placeholder="請輸入內容"
                        />
                      </div>
                    ))}
                    <Button
                      className="w-full text-white"
                      style={{ background: 'var(--os-amber)' }}
                      size="sm"
                      onClick={() => handleSaveMonthly(row.storeName)}
                      disabled={submitMonthly.isPending}
                    >
                      儲存 {row.storeName} 月報補充
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary table */}
          <div style={cardSt}>
            <div style={{ ...sectionTitleSt, marginBottom: 0 }}>月報總表</div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
                    {["門市", "總營業額", "店內", "Uber", "Panda", "來客數", "平均平日", "平均假日", "平均生產力"].map(h => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left" style={thSt}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((row) => (
                    <tr
                      key={row.storeName}
                      style={{ borderTop: '1px solid var(--os-border-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--os-amber-soft)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-medium" style={{ color: 'var(--os-text-1)' }}>{row.storeName}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold" style={{ color: 'var(--os-text-1)' }}>{fmtMoney(row.totalSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(row.instoreSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(row.uberSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(row.pandaSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{Number(row.guestTotal ?? 0).toLocaleString("zh-TW")}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(row.avgWeekdaySales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(row.avgHolidaySales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(row.avgProductivity)}/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DailyRangeTab() {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(todayStr());
  const ALL_STORES = "__all__";
  const [filterStore, setFilterStore] = useState(ALL_STORES);

  const storesQuery = trpc.dailyReport.getStores.useQuery();
  const stores = storesQuery.data ?? [];

  const listQuery = trpc.dailyReport.list.useQuery(
    { startDate, endDate, storeName: filterStore === ALL_STORES ? undefined : filterStore },
    { enabled: !!startDate && !!endDate }
  );
  const rows = (listQuery.data ?? []) as any[];

  const totalSales = rows.reduce((s, r) => s + Number(r.totalSales ?? 0), 0);
  const totalGuest = rows.reduce((s, r) => s + Number(r.guestTotal ?? 0), 0);

  return (
    <div className="space-y-4">
      <div style={cardSt}>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label style={labelSt}>開始日期</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10" />
          </div>
          <div>
            <label style={labelSt}>結束日期</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10" />
          </div>
          <div>
            <label style={labelSt}>門市篩選</label>
            <Select value={filterStore} onValueChange={setFilterStore}>
              <SelectTrigger className="h-10"><SelectValue placeholder="全部門市" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STORES}>全部門市</SelectItem>
                {stores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="h-10" onClick={() => listQuery.refetch()}>查詢</Button>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ ...cardSt, background: 'var(--os-text-1)', color: '#fff' }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p style={{ fontSize: 11, opacity: 0.65 }}>期間總營業額</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{fmtMoney(totalSales)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, opacity: 0.65 }}>總筆數</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{rows.length} 天</p>
            </div>
            <div>
              <p style={{ fontSize: 11, opacity: 0.65 }}>總來客數</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{totalGuest.toLocaleString("zh-TW")} 人</p>
            </div>
          </div>
        </div>
      )}

      {listQuery.isLoading ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--os-text-3)' }}>載入中...</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--os-text-3)' }}>查無資料，請確認日期範圍。</div>
      ) : (
        <div style={{ ...cardSt, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
                  {["日期", "門市", "總營業額", "店內", "Uber", "Panda", "來客數", "客單價", "假日"].map(h => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 text-left" style={{ color: 'var(--os-text-3)', fontSize: 11, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const total = Number(r.totalSales ?? 0);
                  const guest = Number(r.guestTotal ?? 0);
                  const avgTicket = guest > 0 ? Math.round(total / guest) : 0;
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--os-border-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--os-amber-soft)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{r.reportDate?.slice(0, 10)}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium" style={{ color: 'var(--os-text-1)' }}>{r.storeName}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold" style={{ color: 'var(--os-text-1)' }}>{fmtMoney(total)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(r.instoreSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(r.uberSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{fmtMoney(r.pandaSales)}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{guest.toLocaleString("zh-TW")}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: 'var(--os-text-2)' }}>{avgTicket > 0 ? fmtMoney(avgTicket) : "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: r.isHoliday ? 'var(--os-warning)' : 'var(--os-text-3)' }}>{r.isHoliday ? "假日" : "平日"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OSDailyReport() {
  return (
    <AdminDashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--os-text-1)' }}>每日日報</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--os-text-3)' }}>可直接選擇結算日期，預設就是今天。</p>
        </div>

        <Tabs defaultValue="input">
          <TabsList style={{ background: 'var(--os-surface-2)', border: '1px solid var(--os-border)', padding: '3px' }}>
            <TabsTrigger value="input" style={{ fontSize: 13 }}
              className="data-[state=active]:bg-[--os-surface] data-[state=active]:text-[--os-text-1] data-[state=inactive]:text-[--os-text-3]">
              日報填寫
            </TabsTrigger>
            <TabsTrigger value="range" style={{ fontSize: 13 }}
              className="data-[state=active]:bg-[--os-surface] data-[state=active]:text-[--os-text-1] data-[state=inactive]:text-[--os-text-3]">
              報表總覽
            </TabsTrigger>
            <TabsTrigger value="monthly" style={{ fontSize: 13 }}
              className="data-[state=active]:bg-[--os-surface] data-[state=active]:text-[--os-text-1] data-[state=inactive]:text-[--os-text-3]">
              月報彙整
            </TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="mt-4"><DailyInputTab /></TabsContent>
          <TabsContent value="range" className="mt-4"><DailyRangeTab /></TabsContent>
          <TabsContent value="monthly" className="mt-4"><MonthlyOverviewTab /></TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}

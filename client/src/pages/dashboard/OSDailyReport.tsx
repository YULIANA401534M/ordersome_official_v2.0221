import { ChangeEvent, useEffect, useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function n(v: string) {
  return Number(v) || 0;
}

interface DailyForm {
  instoreSales: string;
  uberSales: string;
  pandaSales: string;
  guestInstore: string;
  guestUber: string;
  guestPanda: string;
  phoneOrderCount: string;
  phoneOrderAmount: string;
  deliveryOrderCount: string;
  deliveryOrderAmount: string;
  voidCount: string;
  voidAmount: string;
  cashVoucherCount: string;
  loyaltyCardCount: string;
  staffFull: string;
  staffPart: string;
  laborHours: string;
  dailyCost: string;
  reviewGood: string;
  reviewBad: string;
  note: string;
}

type MonthlyForm = {
  electricityFee: string;
  waterFee: string;
  rentFee: string;
  miscFee: string;
  staffSalaryCost: string;
  performanceReview: string;
  competitorInfo: string;
  monthlyPlan: string;
  staffChanges: string;
  otherNotes: string;
  targetSales: string;
  targetGuest: string;
  targetProductivity: string;
};

type MonthlySummaryRow = {
  storeName: string;
  reportDays?: number;
  weekdayDays?: number;
  holidayDays?: number;
  totalSales?: number;
  instoreSales?: number;
  uberSales?: number;
  pandaSales?: number;
  guestTotal?: number;
  avgWeekdaySales?: number;
  avgHolidaySales?: number;
  avgProductivity?: number;
};

type MonthlyReportRow = {
  storeName: string;
  electricityFee?: number;
  waterFee?: number;
  rentFee?: number;
  miscFee?: number;
  staffSalaryCost?: number;
  performanceReview?: string | null;
  competitorInfo?: string | null;
  monthlyPlan?: string | null;
  staffChanges?: string | null;
  otherNotes?: string | null;
  targetSales?: number;
  targetGuest?: number;
  targetProductivity?: number;
};

const emptyForm = (): DailyForm => ({
  instoreSales: "",
  uberSales: "",
  pandaSales: "",
  guestInstore: "",
  guestUber: "",
  guestPanda: "",
  phoneOrderCount: "",
  phoneOrderAmount: "",
  deliveryOrderCount: "",
  deliveryOrderAmount: "",
  voidCount: "",
  voidAmount: "",
  cashVoucherCount: "",
  loyaltyCardCount: "",
  staffFull: "",
  staffPart: "",
  laborHours: "",
  dailyCost: "",
  reviewGood: "",
  reviewBad: "",
  note: "",
});

const emptyMonthlyForm = (): MonthlyForm => ({
  electricityFee: "",
  waterFee: "",
  rentFee: "",
  miscFee: "",
  staffSalaryCost: "",
  performanceReview: "",
  competitorInfo: "",
  monthlyPlan: "",
  staffChanges: "",
  otherNotes: "",
  targetSales: "",
  targetGuest: "",
  targetProductivity: "",
});

function DailyInputTab() {
  const [storeName, setStoreName] = useState("");
  const [reportDate, setReportDate] = useState(todayStr());
  const [form, setForm] = useState<DailyForm>(emptyForm());
  const [isDirty, setIsDirty] = useState(false);
  const utils = trpc.useUtils();

  const storesQuery = trpc.dailyReport.getStores.useQuery();
  const stores = storesQuery.data ?? [];

  const holidayQuery = trpc.dailyReport.checkHoliday.useQuery(
    { date: reportDate },
    { enabled: !!reportDate }
  );
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

    if (existingQuery.isFetched) {
      setForm(emptyForm());
      setIsDirty(false);
    }
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

  function handleStoreChange(nextStoreName: string) {
    if (!canSwitchContext()) return;
    setStoreName(nextStoreName);
  }

  function handleDateChange(nextDate: string) {
    if (!canSwitchContext()) return;
    setReportDate(nextDate);
  }

  function handleQuickDate(deltaDays: number) {
    if (!canSwitchContext()) return;
    setReportDate((prev) => shiftDateStr(prev, deltaDays));
  }

  function handleSubmit() {
    if (!storeName) {
      toast.error("請先選擇門市");
      return;
    }

    if (!reportDate) {
      toast.error("請先選擇日期");
      return;
    }

    submitMutation.mutate({
      tenantId: 1,
      reportDate,
      storeName,
      isHoliday,
      instoreSales: n(form.instoreSales),
      uberSales: n(form.uberSales),
      pandaSales: n(form.pandaSales),
      guestInstore: n(form.guestInstore),
      guestUber: n(form.guestUber),
      guestPanda: n(form.guestPanda),
      phoneOrderCount: n(form.phoneOrderCount),
      phoneOrderAmount: n(form.phoneOrderAmount),
      deliveryOrderCount: n(form.deliveryOrderCount),
      deliveryOrderAmount: n(form.deliveryOrderAmount),
      voidCount: n(form.voidCount),
      voidAmount: n(form.voidAmount),
      cashVoucherCount: n(form.cashVoucherCount),
      loyaltyCardCount: n(form.loyaltyCardCount),
      staffFull: n(form.staffFull),
      staffPart: n(form.staffPart),
      laborHours: n(form.laborHours),
      dailyCost: n(form.dailyCost),
      reviewGood: n(form.reviewGood),
      reviewBad: n(form.reviewBad),
      note: form.note || undefined,
    });
  }

  const inputCls = "h-12 text-right text-base font-medium";

  return (
    <div className="space-y-4">
      <Card className="border-stone-200 shadow-sm">
        <CardContent className="pt-5">
          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
            <div>
              <label className="mb-1 block text-xs text-stone-500">門市</label>
              <Select value={storeName} onValueChange={handleStoreChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="請選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-stone-500">結算日期</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={reportDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-12"
                />
                <Badge
                  variant={isHoliday ? "default" : "secondary"}
                  className={isHoliday ? "bg-amber-500 text-white" : ""}
                >
                  {isHoliday ? "假日" : "平日"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickDate(-1)}>
                  前一天
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDateChange(todayStr())}>
                  今天
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickDate(1)}>
                  後一天
                </Button>
              </div>
            </div>
          </div>

          {existingQuery.data && (
            <p className="mt-3 text-xs text-amber-600">
              這一天已經有資料，重新儲存會直接覆蓋原本內容。
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-stone-800">營業額</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">店內營業額</label>
            <Input type="number" value={form.instoreSales} onChange={setField("instoreSales")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Uber Eats 營業額</label>
            <Input type="number" value={form.uberSales} onChange={setField("uberSales")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Foodpanda 營業額</label>
            <Input type="number" value={form.pandaSales} onChange={setField("pandaSales")} className={inputCls} placeholder="0" />
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">當日總營業額</span>
              <span className="text-2xl font-bold">{fmtMoney(totalSales)}</span>
            </div>
            {guestTotal > 0 && (
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-xs text-white/70">平均客單價</span>
                <span className="font-semibold">{fmtMoney(avgTicket)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-stone-800">客流與訂單</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">店內客數</label>
              <Input type="number" value={form.guestInstore} onChange={setField("guestInstore")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Uber 客數</label>
              <Input type="number" value={form.guestUber} onChange={setField("guestUber")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Panda 客數</label>
              <Input type="number" value={form.guestPanda} onChange={setField("guestPanda")} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500">總來客數</span>
              <span className="font-semibold text-stone-800">{guestTotal.toLocaleString("zh-TW")} 人</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">電話訂單數</label>
              <Input type="number" value={form.phoneOrderCount} onChange={setField("phoneOrderCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">電話訂單金額</label>
              <Input type="number" value={form.phoneOrderAmount} onChange={setField("phoneOrderAmount")} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">外送訂單數</label>
              <Input type="number" value={form.deliveryOrderCount} onChange={setField("deliveryOrderCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">外送訂單金額</label>
              <Input type="number" value={form.deliveryOrderAmount} onChange={setField("deliveryOrderAmount")} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">作廢筆數</label>
              <Input type="number" value={form.voidCount} onChange={setField("voidCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">作廢金額</label>
              <Input type="number" value={form.voidAmount} onChange={setField("voidAmount")} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">現金券使用數</label>
              <Input type="number" value={form.cashVoucherCount} onChange={setField("cashVoucherCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">會員卡使用數</label>
              <Input type="number" value={form.loyaltyCardCount} onChange={setField("loyaltyCardCount")} className={inputCls} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-stone-800">人力與備註</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">正職人數</label>
              <Input type="number" value={form.staffFull} onChange={setField("staffFull")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">兼職人數</label>
              <Input type="number" value={form.staffPart} onChange={setField("staffPart")} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">總工時</label>
            <Input type="number" step="0.5" value={form.laborHours} onChange={setField("laborHours")} className={inputCls} placeholder="0" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">當日成本</label>
            <Input type="number" value={form.dailyCost} onChange={setField("dailyCost")} className={inputCls} placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Google 好評數</label>
              <Input type="number" value={form.reviewGood} onChange={setField("reviewGood")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Google 負評數</label>
              <Input type="number" value={form.reviewBad} onChange={setField("reviewBad")} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">備註</label>
            <Textarea
              value={form.note}
              onChange={setField("note")}
              className="min-h-[100px] text-sm"
              placeholder="記錄當日狀況、異常事件、客訴或補充說明"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="h-14 w-full bg-amber-500 text-base font-semibold text-white hover:bg-amber-600"
        onClick={handleSubmit}
        disabled={submitMutation.isPending || !storeName || !reportDate}
      >
        {submitMutation.isPending ? "儲存中..." : "儲存今日報表"}
      </Button>
    </div>
  );
}

interface MonthlyExpandState {
  [storeName: string]: boolean;
}

function MonthlyOverviewTab() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [expanded, setExpanded] = useState<MonthlyExpandState>({});
  const [monthlyForms, setMonthlyForms] = useState<Record<string, MonthlyForm>>({});
  const utils = trpc.useUtils();

  const summaryQuery = trpc.dailyReport.monthlySummary.useQuery({
    year: viewYear,
    month: viewMonth,
  });

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

  function getForm(storeName: string) {
    return monthlyForms[storeName] ?? emptyMonthlyForm();
  }

  function setFormField(storeName: string, key: keyof MonthlyForm, value: string) {
    setMonthlyForms((prev) => ({
      ...prev,
      [storeName]: {
        ...getForm(storeName),
        ...(prev[storeName] ?? {}),
        [key]: value,
      },
    }));
  }

  function handleSaveMonthly(storeName: string) {
    const form = getForm(storeName);
    submitMonthly.mutate({
      storeName,
      year: viewYear,
      month: viewMonth,
      electricityFee: n(form.electricityFee),
      waterFee: n(form.waterFee),
      rentFee: n(form.rentFee),
      miscFee: n(form.miscFee),
      staffSalaryCost: n(form.staffSalaryCost),
      performanceReview: form.performanceReview || undefined,
      competitorInfo: form.competitorInfo || undefined,
      monthlyPlan: form.monthlyPlan || undefined,
      staffChanges: form.staffChanges || undefined,
      otherNotes: form.otherNotes || undefined,
      targetSales: n(form.targetSales),
      targetGuest: n(form.targetGuest),
      targetProductivity: n(form.targetProductivity),
    });
  }

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const totalSalesAll = dailyRows.reduce((sum, row) => sum + Number(row.totalSales ?? 0), 0);

  return (
    <div className="space-y-4">
      <Card className="border-stone-200 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={String(viewYear)} onValueChange={(v) => setViewYear(Number(v))}>
              <SelectTrigger className="h-10 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year} 年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(viewMonth)} onValueChange={(v) => setViewMonth(Number(v))}>
              <SelectTrigger className="h-10 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={String(month)}>
                    {month} 月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto rounded-xl bg-slate-900 px-4 py-3 text-right text-white">
              <p className="text-xs text-white/70">本月總營業額</p>
              <p className="text-lg font-bold">{fmtMoney(totalSalesAll)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {summaryQuery.isLoading ? (
        <div className="py-12 text-center text-sm text-stone-400">載入中...</div>
      ) : dailyRows.length === 0 ? (
        <div className="py-12 text-center text-sm text-stone-400">這個月份目前還沒有日報資料。</div>
      ) : (
        <>
          {dailyRows.map((row) => {
            const monthlyRow = monthlyRows.find((item) => item.storeName === row.storeName);
            const totalSales = Number(row.totalSales ?? 0);
            const instoreShare = totalSales > 0 ? Math.round((Number(row.instoreSales ?? 0) / totalSales) * 100) : 0;
            const uberShare = totalSales > 0 ? Math.round((Number(row.uberSales ?? 0) / totalSales) * 100) : 0;
            const pandaShare = totalSales > 0 ? Math.round((Number(row.pandaSales ?? 0) / totalSales) * 100) : 0;
            const achRate =
              monthlyRow?.targetSales && monthlyRow.targetSales > 0
                ? Math.round((totalSales / Number(monthlyRow.targetSales)) * 100)
                : null;
            const isOpen = !!expanded[row.storeName];
            const form = getForm(row.storeName);

            return (
              <Card key={row.storeName} className="border-stone-200 shadow-sm">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">{row.storeName}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">平日 {row.weekdayDays ?? 0} 天</Badge>
                        <Badge variant="outline">假日 {row.holidayDays ?? 0} 天</Badge>
                        <Badge variant="secondary">日報 {row.reportDays ?? 0} 天</Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{fmtMoney(totalSales)}</p>
                      {achRate !== null && (
                        <p className={`text-xs font-medium ${achRate >= 100 ? "text-green-600" : "text-orange-500"}`}>
                          目標達成率 {achRate}%
                        </p>
                      )}
                    </div>
                  </div>

                  {totalSales > 0 && (
                    <div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
                        <div className="bg-slate-800" style={{ width: `${instoreShare}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${uberShare}%` }} />
                        <div className="bg-amber-500" style={{ width: `${pandaShare}%` }} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
                        <span>店內 {fmtMoney(row.instoreSales)}</span>
                        <span>Uber {fmtMoney(row.uberSales)}</span>
                        <span>Panda {fmtMoney(row.pandaSales)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">平均平日營業額</p>
                      <p className="font-semibold">{fmtMoney(row.avgWeekdaySales)}</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">平均假日營業額</p>
                      <p className="font-semibold">{fmtMoney(row.avgHolidaySales)}</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">平均生產力</p>
                      <p className="font-semibold">{fmtMoney(row.avgProductivity)}/h</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">總來客數</p>
                      <p className="font-semibold">{Number(row.guestTotal ?? 0).toLocaleString("zh-TW")} 人</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full pt-1 text-xs text-stone-400 transition-colors hover:text-stone-700"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [row.storeName]: !prev[row.storeName],
                      }))
                    }
                  >
                    {isOpen ? "收起月報補充" : "展開月報補充（費用 / 目標 / 文字）"}
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-stone-200 pt-4">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["電費", "electricityFee"],
                          ["水費", "waterFee"],
                          ["租金", "rentFee"],
                          ["雜費", "miscFee"],
                          ["薪資成本", "staffSalaryCost"],
                          ["目標營業額", "targetSales"],
                          ["目標客數", "targetGuest"],
                          ["目標生產力", "targetProductivity"],
                        ].map(([label, key]) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs text-stone-500">{label}</label>
                            <Input
                              type="number"
                              value={form[key as keyof MonthlyForm]}
                              onChange={(e) =>
                                setFormField(row.storeName, key as keyof MonthlyForm, e.target.value)
                              }
                              className="h-10 text-sm"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>

                      {[
                        ["本月營運回顧", "performanceReview"],
                        ["競品觀察", "competitorInfo"],
                        ["下月行動計畫", "monthlyPlan"],
                        ["人員異動", "staffChanges"],
                        ["其他備註", "otherNotes"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <label className="mb-1 block text-xs text-stone-500">{label}</label>
                          <Textarea
                            value={form[key as keyof MonthlyForm]}
                            onChange={(e) =>
                              setFormField(row.storeName, key as keyof MonthlyForm, e.target.value)
                            }
                            className="min-h-[72px] text-sm"
                            placeholder="請輸入內容"
                          />
                        </div>
                      ))}

                      <Button
                        className="w-full bg-amber-500 text-white hover:bg-amber-600"
                        size="sm"
                        onClick={() => handleSaveMonthly(row.storeName)}
                        disabled={submitMonthly.isPending}
                      >
                        儲存 {row.storeName} 月報補充
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-stone-800">月報總表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b bg-stone-50">
                    <tr>
                      {[
                        "門市",
                        "總營業額",
                        "店內",
                        "Uber",
                        "Panda",
                        "來客數",
                        "平均平日",
                        "平均假日",
                        "平均生產力",
                      ].map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-3 py-2 text-left font-medium text-stone-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {dailyRows.map((row) => (
                      <tr key={row.storeName} className="hover:bg-stone-50">
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-stone-900">{row.storeName}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">{fmtMoney(row.totalSales)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtMoney(row.instoreSales)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtMoney(row.uberSales)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtMoney(row.pandaSales)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{Number(row.guestTotal ?? 0).toLocaleString("zh-TW")}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtMoney(row.avgWeekdaySales)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtMoney(row.avgHolidaySales)}</td>
                        <td className="whitespace-nowrap px-3 py-2">{fmtMoney(row.avgProductivity)}/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function OSDailyReport() {
  const [tab, setTab] = useState<"input" | "monthly">("input");

  return (
    <AdminDashboardLayout>
      <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">每日日報</h1>
          <p className="mt-1 text-sm text-stone-500">可直接選擇結算日期，預設就是今天。</p>
        </div>

        <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "input" ? "bg-amber-500 text-white" : "text-stone-600 hover:bg-stone-50"
            }`}
            onClick={() => setTab("input")}
          >
            日報填寫
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "monthly" ? "bg-amber-500 text-white" : "text-stone-600 hover:bg-stone-50"
            }`}
            onClick={() => setTab("monthly")}
          >
            月報總覽
          </button>
        </div>

        {tab === "input" ? <DailyInputTab /> : <MonthlyOverviewTab />}
      </div>
    </AdminDashboardLayout>
  );
}

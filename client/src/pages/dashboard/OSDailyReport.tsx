import { useState, useEffect } from "react";
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
  return `$${n.toLocaleString("zh-TW")}`;
}

function fmtDate(v: string | Date | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

const emptyForm = (): DailyForm => ({
  instoreSales: "", uberSales: "", pandaSales: "",
  guestInstore: "", guestUber: "", guestPanda: "",
  phoneOrderCount: "", phoneOrderAmount: "",
  deliveryOrderCount: "", deliveryOrderAmount: "",
  voidCount: "", voidAmount: "",
  cashVoucherCount: "", loyaltyCardCount: "",
  staffFull: "", staffPart: "", laborHours: "",
  dailyCost: "", reviewGood: "", reviewBad: "", note: "",
});

function n(v: string) { return Number(v) || 0; }

// ─── 每日輸入 Tab ─────────────────────────────────────────
function DailyInputTab() {
  const [storeName, setStoreName] = useState("");
  const [reportDate, setReportDate] = useState(todayStr());
  const [form, setForm] = useState<DailyForm>(emptyForm());
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
    } else if (existingQuery.isFetched) {
      setForm(emptyForm());
    }
  }, [existingQuery.data, existingQuery.isFetched]);

  const submitMutation = trpc.dailyReport.submit.useMutation({
    onSuccess: () => {
      toast.success(`${storeName} ${reportDate} 日報已儲存`);
      utils.dailyReport.getByDate.invalidate({ storeName, reportDate });
    },
    onError: (e) => toast.error(e.message),
  });

  const totalSales = n(form.instoreSales) + n(form.uberSales) + n(form.pandaSales);
  const guestTotal = n(form.guestInstore) + n(form.guestUber) + n(form.guestPanda);

  function setField(k: keyof DailyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));
  }

  function handleSubmit() {
    if (!storeName) { toast.error("請選擇門市"); return; }
    if (!reportDate) { toast.error("請選擇日期"); return; }
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

  const inputCls = "h-12 text-base text-center text-lg font-medium";

  return (
    <div className="space-y-4">
      {/* 門市 & 日期選擇 */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">門市</label>
              <Select value={storeName} onValueChange={setStoreName}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="選擇門市..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s: string) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">日期</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="h-12 text-base flex-1"
                />
                {holidayQuery.isFetched && (
                  <Badge variant={isHoliday ? "default" : "secondary"} className={isHoliday ? "bg-amber-500" : ""}>
                    {isHoliday ? "假日" : "平日"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {existingQuery.data && (
            <p className="text-xs text-amber-600 mt-2">⚡ 已有資料，編輯後儲存將覆蓋</p>
          )}
        </CardContent>
      </Card>

      {/* 區塊一：營業額 */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-gray-700">💰 營業額</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">店內業績</label>
            <Input type="number" inputMode="numeric" value={form.instoreSales} onChange={setField("instoreSales")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Uber Eats 業績</label>
            <Input type="number" inputMode="numeric" value={form.uberSales} onChange={setField("uberSales")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Panda 業績</label>
            <Input type="number" inputMode="numeric" value={form.pandaSales} onChange={setField("pandaSales")} className={inputCls} placeholder="0" />
          </div>
          <div className="bg-blue-50 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-blue-700 font-medium">合計</span>
            <span className="text-xl font-bold text-blue-700">{fmtMoney(totalSales)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 區塊二：來客與訂單 */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-gray-700">👥 來客與訂單</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">店內來客</label>
              <Input type="number" inputMode="numeric" value={form.guestInstore} onChange={setField("guestInstore")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Uber 來客</label>
              <Input type="number" inputMode="numeric" value={form.guestUber} onChange={setField("guestUber")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Panda 來客</label>
              <Input type="number" inputMode="numeric" value={form.guestPanda} onChange={setField("guestPanda")} className={inputCls} placeholder="0" />
            </div>
          </div>
          {guestTotal > 0 && (
            <div className="bg-gray-50 rounded-lg px-4 py-2 flex justify-between items-center">
              <span className="text-xs text-gray-500">總來客</span>
              <span className="font-semibold text-gray-700">{guestTotal.toLocaleString("zh-TW")} 人</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">電話訂單筆數</label>
              <Input type="number" inputMode="numeric" value={form.phoneOrderCount} onChange={setField("phoneOrderCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">電話訂單金額</label>
              <Input type="number" inputMode="numeric" value={form.phoneOrderAmount} onChange={setField("phoneOrderAmount")} className={inputCls} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">外送訂單筆數</label>
              <Input type="number" inputMode="numeric" value={form.deliveryOrderCount} onChange={setField("deliveryOrderCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">外送訂單金額</label>
              <Input type="number" inputMode="numeric" value={form.deliveryOrderAmount} onChange={setField("deliveryOrderAmount")} className={inputCls} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">作廢筆數</label>
              <Input type="number" inputMode="numeric" value={form.voidCount} onChange={setField("voidCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">作廢金額</label>
              <Input type="number" inputMode="numeric" value={form.voidAmount} onChange={setField("voidAmount")} className={inputCls} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">現金卷（張）</label>
              <Input type="number" inputMode="numeric" value={form.cashVoucherCount} onChange={setField("cashVoucherCount")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">集點卡（張）</label>
              <Input type="number" inputMode="numeric" value={form.loyaltyCardCount} onChange={setField("loyaltyCardCount")} className={inputCls} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 區塊三：人員與成本 */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-gray-700">⚙️ 人員與成本</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">正職人數</label>
              <Input type="number" inputMode="numeric" value={form.staffFull} onChange={setField("staffFull")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">兼職人數</label>
              <Input type="number" inputMode="numeric" value={form.staffPart} onChange={setField("staffPart")} className={inputCls} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">總工時（小時，如 23.5）</label>
            <Input type="number" inputMode="decimal" step="0.5" value={form.laborHours} onChange={setField("laborHours")} className={inputCls} placeholder="0.0" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">當日自購成本</label>
            <Input type="number" inputMode="numeric" value={form.dailyCost} onChange={setField("dailyCost")} className={inputCls} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Google 好評（4.5★↑）</label>
              <Input type="number" inputMode="numeric" value={form.reviewGood} onChange={setField("reviewGood")} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Google 差評（3★↓）</label>
              <Input type="number" inputMode="numeric" value={form.reviewBad} onChange={setField("reviewBad")} className={inputCls} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">備註</label>
            <Textarea value={form.note} onChange={setField("note")} placeholder="今日特殊狀況、備注..." className="text-sm min-h-[80px]" />
          </div>
        </CardContent>
      </Card>

      {/* 儲存按鈕 */}
      <Button
        className="w-full h-14 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white"
        onClick={handleSubmit}
        disabled={submitMutation.isPending || !storeName}
      >
        {submitMutation.isPending ? "儲存中..." : "儲存今日報表"}
      </Button>
    </div>
  );
}

// ─── 月報總覽 Tab ─────────────────────────────────────────
interface MonthlyExpandState {
  [storeName: string]: boolean;
}

function MonthlyOverviewTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expanded, setExpanded] = useState<MonthlyExpandState>({});
  const [monthlyForms, setMonthlyForms] = useState<Record<string, any>>({});
  const utils = trpc.useUtils();

  const summaryQuery = trpc.dailyReport.monthlySummary.useQuery({ year, month });
  const summaryData = summaryQuery.data;
  const dailyRows: any[] = summaryData?.daily ?? [];
  const monthlyData: any[] = summaryData?.monthly ?? [];

  useEffect(() => {
    const init: Record<string, any> = {};
    for (const row of monthlyData) {
      init[row.storeName] = {
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
    setMonthlyForms(init);
  }, [monthlyData.length, year, month]);

  const submitMonthly = trpc.dailyReport.submitMonthly.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${vars.storeName} ${year}/${month} 月報已儲存`);
      utils.dailyReport.monthlySummary.invalidate({ year, month });
    },
    onError: (e) => toast.error(e.message),
  });

  function getForm(storeName: string) {
    return monthlyForms[storeName] ?? {
      electricityFee: "", waterFee: "", rentFee: "", miscFee: "",
      staffSalaryCost: "", performanceReview: "", competitorInfo: "",
      monthlyPlan: "", staffChanges: "", otherNotes: "",
      targetSales: "", targetGuest: "", targetProductivity: "",
    };
  }

  function setFormField(storeName: string, key: string, value: string) {
    setMonthlyForms(prev => ({
      ...prev,
      [storeName]: { ...(prev[storeName] ?? {}), [key]: value },
    }));
  }

  function handleSaveMonthly(storeName: string) {
    const f = getForm(storeName);
    submitMonthly.mutate({
      storeName, year, month,
      electricityFee: n(f.electricityFee),
      waterFee: n(f.waterFee),
      rentFee: n(f.rentFee),
      miscFee: n(f.miscFee),
      staffSalaryCost: n(f.staffSalaryCost),
      performanceReview: f.performanceReview || undefined,
      competitorInfo: f.competitorInfo || undefined,
      monthlyPlan: f.monthlyPlan || undefined,
      staffChanges: f.staffChanges || undefined,
      otherNotes: f.otherNotes || undefined,
      targetSales: n(f.targetSales),
      targetGuest: n(f.targetGuest),
      targetProductivity: n(f.targetProductivity),
    });
  }

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const totalSalesAll = dailyRows.reduce((s, r) => s + Number(r.totalSales ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* 年月選擇 */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-28 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-20 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m} value={String(m)}>{m} 月</SelectItem>)}
              </SelectContent>
            </Select>
            {totalSalesAll > 0 && (
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">全門市合計</p>
                <p className="text-lg font-bold text-blue-700">{fmtMoney(totalSalesAll)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {summaryQuery.isLoading ? (
        <div className="text-center text-gray-400 text-sm py-12">載入中...</div>
      ) : dailyRows.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-12">本月尚無資料</div>
      ) : (
        <>
          {/* 各門市卡片 */}
          {dailyRows.map((r: any) => {
            const mData = monthlyData.find((m: any) => m.storeName === r.storeName);
            const achRate = mData?.targetSales > 0
              ? Math.round(Number(r.totalSales) / mData.targetSales * 100)
              : null;
            const totalSales = Number(r.totalSales ?? 0);
            const instoreShare = totalSales > 0 ? Math.round(Number(r.instoreSales ?? 0) / totalSales * 100) : 0;
            const uberShare = totalSales > 0 ? Math.round(Number(r.uberSales ?? 0) / totalSales * 100) : 0;
            const pandaShare = totalSales > 0 ? Math.round(Number(r.pandaSales ?? 0) / totalSales * 100) : 0;
            const isOpen = !!expanded[r.storeName];
            const f = getForm(r.storeName);

            return (
              <Card key={r.storeName}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  {/* 門市名稱 + 業績 */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{r.storeName}</h3>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">平日 {r.weekdayDays ?? 0}天</Badge>
                        <Badge variant="outline" className="text-xs">假日 {r.holidayDays ?? 0}天</Badge>
                        <Badge variant="secondary" className="text-xs">共 {r.reportDays} 天</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">{fmtMoney(r.totalSales)}</p>
                      {achRate !== null && (
                        <p className={`text-xs font-medium ${achRate >= 100 ? "text-green-600" : "text-orange-500"}`}>
                          達成率 {achRate}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 業績拆解橫向 bar */}
                  {totalSales > 0 && (
                    <div>
                      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                        {instoreShare > 0 && <div className="bg-blue-500 h-full rounded-full" style={{ width: `${instoreShare}%` }} title={`店內 ${instoreShare}%`} />}
                        {uberShare > 0 && <div className="bg-green-500 h-full rounded-full" style={{ width: `${uberShare}%` }} title={`Uber ${uberShare}%`} />}
                        {pandaShare > 0 && <div className="bg-red-500 h-full rounded-full" style={{ width: `${pandaShare}%` }} title={`Panda ${pandaShare}%`} />}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />店內 {fmtMoney(r.instoreSales)}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Uber {fmtMoney(r.uberSales)}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Panda {fmtMoney(r.pandaSales)}</span>
                      </div>
                    </div>
                  )}

                  {/* 統計資訊 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">日均(平日)</p>
                      <p className="font-semibold">{fmtMoney(r.avgWeekdaySales)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">日均(假日)</p>
                      <p className="font-semibold">{fmtMoney(r.avgHolidaySales)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">平均產能</p>
                      <p className="font-semibold">{fmtMoney(r.avgProductivity)}/h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">總來客</p>
                      <p className="font-semibold">{Number(r.guestTotal ?? 0).toLocaleString("zh-TW")}</p>
                    </div>
                  </div>

                  {/* 月報補充摺疊 */}
                  <button
                    className="w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 pt-1"
                    onClick={() => setExpanded(prev => ({ ...prev, [r.storeName]: !prev[r.storeName] }))}
                  >
                    {isOpen ? "▲ 收起月報補充" : "▼ 展開月報補充（費用 / 目標 / 文字）"}
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["電費", "electricityFee"], ["水費", "waterFee"],
                          ["房租", "rentFee"], ["雜支", "miscFee"],
                          ["薪資成本", "staffSalaryCost"],
                        ].map(([label, key]) => (
                          <div key={key}>
                            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                            <Input
                              type="number" inputMode="numeric"
                              value={f[key] ?? ""}
                              onChange={e => setFormField(r.storeName, key, e.target.value)}
                              className="h-10 text-sm"
                              placeholder="0"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">月目標業績</label>
                          <Input type="number" inputMode="numeric" value={f.targetSales ?? ""} onChange={e => setFormField(r.storeName, "targetSales", e.target.value)} className="h-10 text-sm" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">月目標來客</label>
                          <Input type="number" inputMode="numeric" value={f.targetGuest ?? ""} onChange={e => setFormField(r.storeName, "targetGuest", e.target.value)} className="h-10 text-sm" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">目標產能(元/h)</label>
                          <Input type="number" inputMode="numeric" value={f.targetProductivity ?? ""} onChange={e => setFormField(r.storeName, "targetProductivity", e.target.value)} className="h-10 text-sm" placeholder="0" />
                        </div>
                      </div>
                      {[
                        ["本月業績評估", "performanceReview"],
                        ["競品動態", "competitorInfo"],
                        ["下月計畫", "monthlyPlan"],
                        ["人員異動", "staffChanges"],
                        ["其他備注", "otherNotes"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                          <Textarea
                            value={f[key] ?? ""}
                            onChange={e => setFormField(r.storeName, key, e.target.value)}
                            className="text-sm min-h-[60px]"
                            placeholder="選填..."
                          />
                        </div>
                      ))}
                      <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        size="sm"
                        onClick={() => handleSaveMonthly(r.storeName)}
                        disabled={submitMonthly.isPending}
                      >
                        儲存 {r.storeName} 月報補充
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* 跨門市比較表 */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold text-gray-700">跨門市比較</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["門市", "總業績", "店內", "Uber", "Panda", "來客", "日均(平日)", "日均(假日)", "產能"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyRows.map((r: any) => (
                      <tr key={r.storeName} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.storeName}</td>
                        <td className="px-3 py-2 text-blue-700 font-semibold whitespace-nowrap">{fmtMoney(r.totalSales)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtMoney(r.instoreSales)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtMoney(r.uberSales)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtMoney(r.pandaSales)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{Number(r.guestTotal ?? 0).toLocaleString()}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtMoney(r.avgWeekdaySales)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtMoney(r.avgHolidaySales)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtMoney(r.avgProductivity)}/h</td>
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

// ─── 主頁面 ───────────────────────────────────────────────
export default function OSDailyReport() {
  const [tab, setTab] = useState<"input" | "monthly">("input");

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">門市日報</h1>
        </div>

        {/* Tab 切換 */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "input" ? "bg-amber-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            onClick={() => setTab("input")}
          >
            每日輸入
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "monthly" ? "bg-amber-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
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

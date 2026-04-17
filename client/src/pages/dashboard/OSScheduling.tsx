import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Settings, Download } from "lucide-react";
import * as XLSX from "xlsx";

const HQ_STORE_ID = 401534;

const STATUS_CONFIG = {
  work:           { label: "●", color: "#1c1917", bg: "transparent" },
  rest:           { label: "休", color: "#9ca3af", bg: "transparent" },
  designated:     { label: "指", color: "#b45309", bg: "transparent" },
  personal_leave: { label: "事", color: "#dc2626", bg: "transparent" },
  public_leave:   { label: "公", color: "#0369a1", bg: "transparent" },
  absent:         { label: "曠", color: "#dc2626", bg: "#fef2f2" },
  overtime:       { label: "加", color: "#15803d", bg: "transparent" },
} as const;

const WEEKDAYS = ["日","一","二","三","四","五","六"];
const SCHEDULE_TYPE_LABELS = { early:"早班", late:"晚班", mobile:"機動人員" };

export default function OSScheduling() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isManager = user?.role === "manager";
  const canEdit = isSuperAdmin || isManager;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined);
  const [scheduleTab, setScheduleTab] = useState<"early"|"late"|"mobile">("early");
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [popoverCell, setPopoverCell] = useState<{employeeName:string,storeId:number,date:string}|null>(null);
  const [popoverData, setPopoverData] = useState<any>({});

  const { data: stores = [] } = trpc.store.list.useQuery();
  const { data: templates = [], refetch: refetchTemplates } = trpc.scheduling.listTemplates.useQuery(
    { storeId: selectedStoreId }
  );
  const { data: schedules = [], refetch: refetchSchedules } = trpc.scheduling.listSchedules.useQuery(
    { storeId: selectedStoreId, year, month }
  );
  const { data: summary = [] } = trpc.scheduling.getMonthSummary.useQuery(
    { storeId: selectedStoreId, year, month }
  );
  const { data: holidays = [] } = trpc.dailyReport.getHolidaysByMonth.useQuery({ year, month });

  const upsertSchedule = trpc.scheduling.upsertSchedule.useMutation({
    onSuccess: () => { refetchSchedules(); setPopoverCell(null); },
    onError: (e) => toast.error(e.message)
  });
  const upsertTemplate = trpc.scheduling.upsertTemplate.useMutation({
    onSuccess: () => { refetchTemplates(); setShowTemplateDialog(false); },
    onError: (e) => toast.error(e.message)
  });
  const deleteTemplate = trpc.scheduling.deleteTemplate.useMutation({
    onSuccess: () => refetchTemplates()
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredTemplates = useMemo(() =>
    templates.filter((t: any) =>
      scheduleTab === "mobile"
        ? t.storeId === HQ_STORE_ID
        : t.scheduleType === scheduleTab && t.storeId !== HQ_STORE_ID
    ), [templates, scheduleTab]);

  const scheduleMap = useMemo(() => {
    const map: Record<string, any> = {};
    schedules.forEach((s: any) => {
      const key = `${s.employeeName}__${s.scheduleDate}`;
      map[key] = s;
    });
    return map;
  }, [schedules]);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(holidays)) {
      (holidays as any[]).forEach((h: any) => { if (h.isHoliday) set.add(h.date); });
    }
    return set;
  }, [holidays]);

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  const getCell = (employeeName: string, storeId: number, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return scheduleMap[`${employeeName}__${dateStr}`];
  };

  const handleCellClick = (employeeName: string, storeId: number, day: number) => {
    if (!canEdit) return;
    const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const existing = scheduleMap[`${employeeName}__${dateStr}`];
    setPopoverData(existing ? {
      status: existing.status,
      startTime: existing.startTime ?? "",
      endTime: existing.endTime ?? "",
      supportStoreId: existing.supportStoreId ?? "",
      note: existing.note ?? ""
    } : { status: "work", startTime: "", endTime: "", supportStoreId: "", note: "" });
    setPopoverCell({ employeeName, storeId, date: dateStr });
  };

  const handleSaveCell = () => {
    if (!popoverCell) return;
    upsertSchedule.mutate({
      storeId: popoverCell.storeId,
      employeeName: popoverCell.employeeName,
      scheduleDate: popoverCell.date,
      status: popoverData.status,
      startTime: popoverData.startTime || undefined,
      endTime: popoverData.endTime || undefined,
      supportStoreId: popoverData.supportStoreId ? Number(popoverData.supportStoreId) : undefined,
      note: popoverData.note || undefined
    });
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const header1 = ["員工", ...days.map(d => d), "出勤"];
    const header2 = ["星期", ...days.map(d => {
      const dt = new Date(year, month-1, d);
      return WEEKDAYS[dt.getDay()];
    }), ""];
    const dataRows = filteredTemplates.map((t: any) => {
      const row: any[] = [t.employeeName];
      let workCount = 0;
      days.forEach(d => {
        const cell = getCell(t.employeeName, t.storeId, d);
        const s = cell?.status ?? "";
        row.push(STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? "");
        if (["work","designated","overtime"].includes(s)) workCount++;
      });
      row.push(workCount);
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...dataRows]);
    XLSX.utils.book_append_sheet(wb, ws, `${month}月`);
    XLSX.writeFile(wb, `${year}年${String(month).padStart(2,"0")}月-班表.xlsx`);
  };

  function renderTemplateDrawer() {
    return (
      <Sheet open={showTemplateDrawer} onOpenChange={setShowTemplateDrawer}>
        <SheetContent side="right" className="w-[420px]">
          <SheetHeader>
            <SheetTitle>員工班別設定</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {templates.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div>
                  <p className="font-medium text-sm">{t.employeeName}</p>
                  <p className="text-xs text-stone-400">
                    {SCHEDULE_TYPE_LABELS[t.scheduleType as keyof typeof SCHEDULE_TYPE_LABELS]}
                    {t.defaultStartTime && t.defaultEndTime && ` · ${t.defaultStartTime}-${t.defaultEndTime}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditTemplate(t); setShowTemplateDialog(true); }}>編輯</Button>
                  <Button size="sm" variant="ghost" className="text-red-500"
                    onClick={() => { if (confirm(`確定停用 ${t.employeeName}？`)) deleteTemplate.mutate({ id: t.id }); }}>
                    停用
                  </Button>
                </div>
              </div>
            ))}
            <Button className="w-full mt-4 bg-amber-700 hover:bg-amber-800 text-white"
              onClick={() => { setEditTemplate(null); setShowTemplateDialog(true); }}>
              新增員工
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (templates.length === 0) {
    return (
      <AdminDashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-stone-500">尚未設定員工班別，請先新增員工</p>
          {canEdit && (
            <Button onClick={() => setShowTemplateDrawer(true)} className="bg-amber-700 hover:bg-amber-800 text-white">
              前往員工設定
            </Button>
          )}
          {renderTemplateDrawer()}
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="p-4 space-y-4" style={{ background: "#f7f6f3", minHeight: "100vh" }}>
        {/* 頂部控制列 */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedStoreId?.toString() ?? "all"}
            onValueChange={v => setSelectedStoreId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-44"><SelectValue placeholder="選擇門市" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              {stores.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg overflow-hidden">
            {(["early","late","mobile"] as const).map(tab => (
              <button key={tab}
                className={`px-3 py-1.5 text-sm ${scheduleTab === tab ? "bg-amber-700 text-white" : "bg-white text-stone-600 hover:bg-stone-50"}`}
                onClick={() => setScheduleTab(tab)}>
                {SCHEDULE_TYPE_LABELS[tab]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium px-2">{year}年{String(month).padStart(2,"0")}月</span>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />匯出</Button>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setShowTemplateDrawer(true)}>
                <Settings className="w-4 h-4 mr-1" />員工設定
              </Button>
            )}
          </div>
        </div>

        {/* 班表主體 */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
          <table className="text-xs border-collapse" style={{ minWidth: "max-content" }}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-10 px-3 py-2 text-left border-b border-r border-stone-100 font-medium text-stone-600 min-w-[80px]">員工</th>
                {days.map(d => {
                  const dt = new Date(year, month-1, d);
                  const dow = dt.getDay();
                  const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const isHoliday = holidaySet.has(dateStr);
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th key={d} className="px-1 py-2 text-center border-b border-stone-100 min-w-[36px]"
                      style={{ background: isHoliday ? "#fef2f2" : "transparent" }}>
                      <div style={{ color: isWeekend ? "#9ca3af" : "#1c1917" }}>{d}</div>
                      <div style={{ color: isWeekend ? "#9ca3af" : "#6b7280" }}>{WEEKDAYS[dow]}</div>
                    </th>
                  );
                })}
                <th className="sticky right-0 bg-white z-10 px-2 py-2 text-center border-b border-l border-stone-100 font-medium text-stone-600 min-w-[40px]">出勤</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((t: any, idx: number) => {
                const workCount = days.filter(d => {
                  const cell = getCell(t.employeeName, t.storeId, d);
                  return cell && ["work","designated","overtime"].includes(cell.status);
                }).length;
                return (
                  <tr key={t.id} className={idx % 2 === 0 ? "bg-white" : "bg-stone-50/50"}>
                    <td className="sticky left-0 z-10 px-3 py-1 border-r border-stone-100 font-medium text-stone-700"
                      style={{ background: idx % 2 === 0 ? "white" : "#fafaf9" }}>
                      {t.employeeName}
                    </td>
                    {days.map(d => {
                      const cell = getCell(t.employeeName, t.storeId, d);
                      const cfg = cell ? STATUS_CONFIG[cell.status as keyof typeof STATUS_CONFIG] : null;
                      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                      const isActive = popoverCell?.employeeName === t.employeeName && popoverCell?.date === dateStr;
                      const storeName = cell?.supportStoreId
                        ? (stores as any[]).find((s:any) => s.id === cell.supportStoreId)?.name?.replace("來點什麼 ","") ?? ""
                        : "";
                      return (
                        <td key={d}
                          className={`px-1 py-1 text-center border-stone-100 cursor-pointer hover:bg-amber-50 transition-colors ${isActive ? "ring-2 ring-amber-400 ring-inset" : ""}`}
                          style={{ background: cfg?.bg }}
                          onClick={() => handleCellClick(t.employeeName, t.storeId, d)}>
                          {cfg ? (
                            <div>
                              <span style={{ color: cfg.color, fontWeight: cell?.status === "absent" ? 700 : 400 }}>
                                {cfg.label}
                              </span>
                              {cell?.startTime && cell?.endTime && (
                                <div style={{ color: "#9ca3af", fontSize: "9px" }}>
                                  {cell.startTime.slice(0,2)}-{cell.endTime.slice(0,2)}
                                </div>
                              )}
                              {storeName && (
                                <div style={{ color: "#b45309", fontSize: "9px" }}>{storeName}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#e5e7eb" }}>·</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 px-2 py-1 text-center border-l border-stone-100 font-medium"
                      style={{ background: idx % 2 === 0 ? "white" : "#fafaf9",
                               fontFamily: "'jf-kamabit', sans-serif", color: "#b45309" }}>
                      {workCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 月結摘要 */}
        {summary.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="text-sm font-medium text-stone-700 mb-3">本月統計</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["員工","出勤","例休","事假","公假","曠職","加班","總工時"].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left text-stone-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s: any) => (
                    <tr key={s.employeeName} className="border-b border-stone-50">
                      <td className="px-2 py-1.5 font-medium text-stone-700">{s.employeeName}</td>
                      <td className="px-2 py-1.5 text-stone-600">{s.workDays}</td>
                      <td className="px-2 py-1.5 text-stone-400">{s.restDays}</td>
                      <td className="px-2 py-1.5 text-red-500">{s.personalLeaveDays}</td>
                      <td className="px-2 py-1.5 text-blue-500">{s.publicLeaveDays}</td>
                      <td className="px-2 py-1.5 text-red-700 font-medium">{s.absentDays}</td>
                      <td className="px-2 py-1.5 text-green-600">{s.overtimeDays}</td>
                      <td className="px-2 py-1.5" style={{ fontFamily:"'jf-kamabit',sans-serif", color:"#b45309" }}>
                        {Number(s.totalHours).toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Popover 編輯格子 */}
        {popoverCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={() => setPopoverCell(null)}>
            <div className="bg-white rounded-xl border border-stone-200 shadow-lg p-4 w-72"
              onClick={e => e.stopPropagation()}>
              <p className="text-sm font-medium text-stone-700 mb-3">
                {popoverCell.employeeName} · {popoverCell.date}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key}
                    className={`px-2 py-1 rounded-md text-xs border transition-colors ${popoverData.status === key ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white hover:bg-stone-50"}`}
                    style={{ color: cfg.color }}
                    onClick={() => setPopoverData((p:any) => ({ ...p, status: key }))}>
                    {cfg.label} {key === "work" ? "出勤" : key === "rest" ? "例休" : key === "designated" ? "指定班" : key === "personal_leave" ? "事假" : key === "public_leave" ? "公假" : key === "absent" ? "曠職" : "加班"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <Label className="text-xs">上班時間</Label>
                  <Input className="h-7 text-xs mt-0.5" placeholder="0600"
                    value={popoverData.startTime}
                    onChange={e => setPopoverData((p:any) => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">下班時間</Label>
                  <Input className="h-7 text-xs mt-0.5" placeholder="1430"
                    value={popoverData.endTime}
                    onChange={e => setPopoverData((p:any) => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              {scheduleTab === "mobile" && (
                <div className="mb-3">
                  <Label className="text-xs">支援門市</Label>
                  <Select value={popoverData.supportStoreId?.toString() ?? ""}
                    onValueChange={v => setPopoverData((p:any) => ({ ...p, supportStoreId: v }))}>
                    <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="選擇門市" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不指定</SelectItem>
                      {(stores as any[]).filter((s:any) => s.id !== HQ_STORE_ID).map((s:any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace("來點什麼 ","")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="mb-3">
                <Label className="text-xs">備註</Label>
                <Input className="h-7 text-xs mt-0.5" placeholder="選填"
                  value={popoverData.note}
                  onChange={e => setPopoverData((p:any) => ({ ...p, note: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                  onClick={handleSaveCell} disabled={upsertSchedule.isPending}>
                  {upsertSchedule.isPending ? "儲存中..." : "儲存"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPopoverCell(null)}>取消</Button>
              </div>
            </div>
          </div>
        )}

        {/* 員工設定 Drawer */}
        {renderTemplateDrawer()}

        {/* 新增/編輯員工 Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTemplate ? "編輯員工" : "新增員工"}</DialogTitle>
            </DialogHeader>
            <TemplateForm
              initial={editTemplate}
              stores={stores}
              onSave={(data: any) => upsertTemplate.mutate(data)}
              onCancel={() => setShowTemplateDialog(false)}
              isPending={upsertTemplate.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}

function TemplateForm({ initial, stores, onSave, onCancel, isPending }: any) {
  const [form, setForm] = useState({
    id: initial?.id,
    storeId: initial?.storeId ?? "",
    employeeName: initial?.employeeName ?? "",
    scheduleType: initial?.scheduleType ?? "early",
    defaultStartTime: initial?.defaultStartTime ?? "",
    defaultEndTime: initial?.defaultEndTime ?? "",
    fixedRestDays: initial?.fixedRestDays ? JSON.parse(initial.fixedRestDays) : [],
    note: initial?.note ?? ""
  });
  const WEEKDAY_LABELS = ["日","一","二","三","四","五","六"];
  const toggleRestDay = (d: number) => {
    setForm(f => ({
      ...f,
      fixedRestDays: f.fixedRestDays.includes(d)
        ? f.fixedRestDays.filter((x:number) => x !== d)
        : [...f.fixedRestDays, d]
    }));
  };
  return (
    <div className="space-y-3">
      <div>
        <Label>員工姓名</Label>
        <Input value={form.employeeName} onChange={e => setForm(f => ({...f, employeeName: e.target.value}))} />
      </div>
      <div>
        <Label>所屬門市</Label>
        <Select value={form.storeId?.toString()} onValueChange={v => setForm(f => ({...f, storeId: Number(v)}))}>
          <SelectTrigger><SelectValue placeholder="選擇門市" /></SelectTrigger>
          <SelectContent>
            {stores.map((s:any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>班別</Label>
        <Select value={form.scheduleType} onValueChange={v => setForm(f => ({...f, scheduleType: v}))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="early">早班</SelectItem>
            <SelectItem value="late">晚班</SelectItem>
            <SelectItem value="mobile">機動人員</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>預設上班</Label>
          <Input placeholder="0600" value={form.defaultStartTime} onChange={e => setForm(f => ({...f, defaultStartTime: e.target.value}))} />
        </div>
        <div>
          <Label>預設下班</Label>
          <Input placeholder="1430" value={form.defaultEndTime} onChange={e => setForm(f => ({...f, defaultEndTime: e.target.value}))} />
        </div>
      </div>
      <div>
        <Label className="block mb-1">固定休假日</Label>
        <div className="flex gap-2">
          {WEEKDAY_LABELS.map((label, idx) => (
            <label key={idx} className="flex flex-col items-center gap-1 cursor-pointer">
              <Checkbox checked={form.fixedRestDays.includes(idx)}
                onCheckedChange={() => toggleRestDay(idx)} />
              <span className="text-xs">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>備註</Label>
        <Input value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        <Button className="bg-amber-700 hover:bg-amber-800 text-white"
          onClick={() => onSave({ ...form, storeId: Number(form.storeId) })}
          disabled={isPending || !form.employeeName || !form.storeId}>
          {isPending ? "儲存中..." : "儲存"}
        </Button>
      </DialogFooter>
    </div>
  );
}

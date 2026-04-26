import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Settings, Download } from "lucide-react";

const HQ_STORE_ID = 401534;

const STATUS_CONFIG = {
  work:           { label: "●", color: "var(--os-text-1)",    bg: "transparent" },
  rest:           { label: "休", color: "var(--os-text-3)",   bg: "transparent" },
  designated:     { label: "指", color: "var(--os-amber)",    bg: "transparent" },
  personal_leave: { label: "事", color: "var(--os-danger)",   bg: "transparent" },
  public_leave:   { label: "公", color: "var(--os-info)",     bg: "transparent" },
  absent:         { label: "曠", color: "var(--os-danger)",   bg: "var(--os-danger-bg)" },
  overtime:       { label: "加", color: "var(--os-success)",  bg: "transparent" },
} as const;

const WEEKDAYS = ["日","一","二","三","四","五","六"];
const SCHEDULE_TYPE_LABELS = { early:"早班", late:"晚班", mobile:"機動人員" };

const inputSt: React.CSSProperties = {
  width: "100%", padding: "7px 10px", border: "1px solid var(--os-border)",
  borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none",
};
const labelSt: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--os-text-2)", display: "block", marginBottom: 4,
};

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

  const handleExport = async () => {
    const XLSX = await import("xlsx");
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
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {templates.map((t: any) => (
              <div key={t.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1px solid var(--os-border)", borderRadius: 10, background: "var(--os-surface)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)", margin: 0 }}>{t.employeeName}</p>
                  <p style={{ fontSize: 11, color: "var(--os-text-3)", margin: "2px 0 0" }}>
                    {SCHEDULE_TYPE_LABELS[t.scheduleType as keyof typeof SCHEDULE_TYPE_LABELS]}
                    {t.defaultStartTime && t.defaultEndTime && ` · ${t.defaultStartTime}-${t.defaultEndTime}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditTemplate(t); setShowTemplateDialog(true); }}
                    style={{ padding: "5px 12px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 12, cursor: "pointer" }}>
                    編輯
                  </button>
                  <button onClick={() => { if (confirm(`確定停用 ${t.employeeName}？`)) deleteTemplate.mutate({ id: t.id }); }}
                    style={{ padding: "5px 12px", border: "none", borderRadius: 8, background: "none", color: "var(--os-danger)", fontSize: 12, cursor: "pointer" }}>
                    停用
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditTemplate(null); setShowTemplateDialog(true); }}
              style={{ width: "100%", marginTop: 8, padding: "10px 0", border: "none", borderRadius: 10, background: "var(--os-amber)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              新增員工
            </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (templates.length === 0) {
    return (
      <AdminDashboardLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 256, gap: 16 }}>
          <p style={{ color: "var(--os-text-3)", fontSize: 14 }}>尚未設定員工班別，請先新增員工</p>
          {canEdit && (
            <button onClick={() => setShowTemplateDrawer(true)}
              style={{ padding: "8px 20px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              前往員工設定
            </button>
          )}
          {renderTemplateDrawer()}
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

  return (
    <AdminDashboardLayout>
      <div style={{ padding: 16, background: "var(--os-bg)", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 頂部控制列 */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <Select value={selectedStoreId?.toString() ?? "all"}
            onValueChange={v => setSelectedStoreId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger style={{ width: 176 }}><SelectValue placeholder="選擇門市" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              {stores.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div style={{ display: "flex", border: "1px solid var(--os-border)", borderRadius: 8, overflow: "hidden" }}>
            {(["early","late","mobile"] as const).map(tab => (
              <button key={tab}
                style={{ padding: "7px 14px", fontSize: 13, border: "none", cursor: "pointer", background: scheduleTab === tab ? "var(--os-amber)" : "var(--os-surface)", color: scheduleTab === tab ? "#fff" : "var(--os-text-2)", fontWeight: scheduleTab === tab ? 600 : 400, transition: "all 0.15s" }}
                onClick={() => setScheduleTab(tab)}>
                {SCHEDULE_TYPE_LABELS[tab]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={prevMonth}
              style={{ padding: "6px 8px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft style={{ width: 14, height: 14, color: "var(--os-text-2)" }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)", padding: "0 8px" }}>{year}年{String(month).padStart(2,"0")}月</span>
            <button onClick={nextMonth}
              style={{ padding: "6px 8px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight style={{ width: 14, height: 14, color: "var(--os-text-2)" }} />
            </button>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={handleExport}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>
              <Download style={{ width: 14, height: 14 }} />匯出
            </button>
            {canEdit && (
              <button onClick={() => setShowTemplateDrawer(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>
                <Settings style={{ width: 14, height: 14 }} />員工設定
              </button>
            )}
          </div>
        </div>

        {/* 班表主體 */}
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, overflowX: "auto" }}>
          <table style={{ fontSize: 11, borderCollapse: "collapse", minWidth: "max-content", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, background: "var(--os-surface)", zIndex: 10, padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--os-border)", borderRight: "1px solid var(--os-border)", fontWeight: 600, color: "var(--os-text-2)", minWidth: 80 }}>員工</th>
                {days.map(d => {
                  const dt = new Date(year, month-1, d);
                  const dow = dt.getDay();
                  const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const isHoliday = holidaySet.has(dateStr);
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th key={d} style={{ padding: "6px 4px", textAlign: "center", borderBottom: "1px solid var(--os-border)", minWidth: 36, background: isHoliday ? "var(--os-danger-bg)" : "transparent" }}>
                      <div style={{ color: isWeekend ? "var(--os-text-3)" : "var(--os-text-1)" }}>{d}</div>
                      <div style={{ color: isWeekend ? "var(--os-text-3)" : "var(--os-text-2)", fontSize: 10 }}>{WEEKDAYS[dow]}</div>
                    </th>
                  );
                })}
                <th style={{ position: "sticky", right: 0, background: "var(--os-surface)", zIndex: 10, padding: "8px 8px", textAlign: "center", borderBottom: "1px solid var(--os-border)", borderLeft: "1px solid var(--os-border)", fontWeight: 600, color: "var(--os-text-2)", minWidth: 40 }}>出勤</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((t: any, idx: number) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? "var(--os-surface)" : "var(--os-surface-2)";
                const workCount = days.filter(d => {
                  const cell = getCell(t.employeeName, t.storeId, d);
                  return cell && ["work","designated","overtime"].includes(cell.status);
                }).length;
                return (
                  <tr key={t.id}>
                    <td style={{ position: "sticky", left: 0, zIndex: 10, padding: "5px 12px", borderRight: "1px solid var(--os-border)", fontWeight: 600, color: "var(--os-text-1)", background: rowBg }}>
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
                          style={{ padding: "4px", textAlign: "center", cursor: canEdit ? "pointer" : "default", background: cfg?.bg !== "transparent" ? cfg?.bg : (isActive ? "var(--os-amber-soft)" : rowBg), outline: isActive ? "2px solid var(--os-amber)" : "none", outlineOffset: -2, transition: "background 0.1s" }}
                          onClick={() => handleCellClick(t.employeeName, t.storeId, d)}>
                          {cfg ? (
                            <div>
                              <span style={{ color: cfg.color, fontWeight: cell?.status === "absent" ? 700 : 400 }}>
                                {cfg.label}
                              </span>
                              {cell?.startTime && cell?.endTime && (
                                <div style={{ color: "var(--os-text-3)", fontSize: 9 }}>
                                  {cell.startTime.slice(0,2)}-{cell.endTime.slice(0,2)}
                                </div>
                              )}
                              {storeName && (
                                <div style={{ color: "var(--os-amber)", fontSize: 9 }}>{storeName}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--os-border)" }}>·</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ position: "sticky", right: 0, zIndex: 10, padding: "5px 8px", textAlign: "center", borderLeft: "1px solid var(--os-border)", fontWeight: 600, color: "var(--os-amber)", background: rowBg }}>
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
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-2)", marginBottom: 12 }}>本月統計</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--os-border)" }}>
                    {["員工","出勤","例休","事假","公假","曠職","加班","總工時"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--os-text-3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s: any) => (
                    <tr key={s.employeeName} style={{ borderBottom: "1px solid var(--os-border-2)" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--os-text-1)" }}>{s.employeeName}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-text-2)" }}>{s.workDays}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-text-3)" }}>{s.restDays}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-danger)" }}>{s.personalLeaveDays}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-info)" }}>{s.publicLeaveDays}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-danger)", fontWeight: 700 }}>{s.absentDays}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-success)" }}>{s.overtimeDays}</td>
                      <td style={{ padding: "6px 8px", color: "var(--os-amber)", fontWeight: 600 }}>
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
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}
            onClick={() => setPopoverCell(null)}>
            <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: 16, width: 288 }}
              onClick={e => e.stopPropagation()}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)", marginBottom: 12 }}>
                {popoverCell.employeeName} · {popoverCell.date}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key}
                    style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, border: `1px solid ${popoverData.status === key ? "var(--os-amber)" : "var(--os-border)"}`, background: popoverData.status === key ? "var(--os-amber-soft)" : "var(--os-surface)", color: cfg.color, cursor: "pointer", transition: "all 0.1s" }}
                    onClick={() => setPopoverData((p:any) => ({ ...p, status: key }))}>
                    {cfg.label} {key === "work" ? "出勤" : key === "rest" ? "例休" : key === "designated" ? "指定班" : key === "personal_leave" ? "事假" : key === "public_leave" ? "公假" : key === "absent" ? "曠職" : "加班"}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={labelSt}>上班時間</label>
                  <input style={{ ...inputSt, height: 30, fontSize: 12 }} placeholder="0600"
                    value={popoverData.startTime}
                    onChange={e => setPopoverData((p:any) => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <label style={labelSt}>下班時間</label>
                  <input style={{ ...inputSt, height: 30, fontSize: 12 }} placeholder="1430"
                    value={popoverData.endTime}
                    onChange={e => setPopoverData((p:any) => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              {scheduleTab === "mobile" && (
                <div style={{ marginBottom: 10 }}>
                  <label style={labelSt}>支援門市</label>
                  <Select value={popoverData.supportStoreId?.toString() || "none"}
                    onValueChange={v => setPopoverData((p:any) => ({ ...p, supportStoreId: v === "none" ? "" : v }))}>
                    <SelectTrigger style={{ height: 30, fontSize: 12 }}><SelectValue placeholder="選擇門市" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">不指定</SelectItem>
                      {(stores as any[]).filter((s:any) => s.id !== HQ_STORE_ID).map((s:any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace("來點什麼 ","")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={labelSt}>備註</label>
                <input style={{ ...inputSt, height: 30, fontSize: 12 }} placeholder="選填"
                  value={popoverData.note}
                  onChange={e => setPopoverData((p:any) => ({ ...p, note: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSaveCell} disabled={upsertSchedule.isPending}
                  style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: upsertSchedule.isPending ? 0.7 : 1 }}>
                  {upsertSchedule.isPending ? "儲存中..." : "儲存"}
                </button>
                <button onClick={() => setPopoverCell(null)}
                  style={{ flex: 1, padding: "8px 0", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {renderTemplateDrawer()}

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

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "7px 10px", border: "1px solid var(--os-border)",
    borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none",
  };
  const labelSt: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "var(--os-text-2)", display: "block", marginBottom: 4,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelSt}>員工姓名</label>
        <input style={inputSt} value={form.employeeName} onChange={e => setForm(f => ({...f, employeeName: e.target.value}))} />
      </div>
      <div>
        <label style={labelSt}>所屬門市</label>
        <Select value={form.storeId?.toString()} onValueChange={v => setForm(f => ({...f, storeId: Number(v)}))}>
          <SelectTrigger><SelectValue placeholder="選擇門市" /></SelectTrigger>
          <SelectContent>
            {stores.map((s:any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={labelSt}>班別</label>
        <Select value={form.scheduleType} onValueChange={v => setForm(f => ({...f, scheduleType: v}))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="early">早班</SelectItem>
            <SelectItem value="late">晚班</SelectItem>
            <SelectItem value="mobile">機動人員</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelSt}>預設上班</label>
          <input style={inputSt} placeholder="0600" value={form.defaultStartTime} onChange={e => setForm(f => ({...f, defaultStartTime: e.target.value}))} />
        </div>
        <div>
          <label style={labelSt}>預設下班</label>
          <input style={inputSt} placeholder="1430" value={form.defaultEndTime} onChange={e => setForm(f => ({...f, defaultEndTime: e.target.value}))} />
        </div>
      </div>
      <div>
        <label style={{ ...labelSt, marginBottom: 8 }}>固定休假日</label>
        <div style={{ display: "flex", gap: 8 }}>
          {WEEKDAY_LABELS.map((label, idx) => {
            const checked = form.fixedRestDays.includes(idx);
            return (
              <label key={idx}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                onClick={() => toggleRestDay(idx)}>
                <div style={{ width: 22, height: 22, border: `2px solid ${checked ? "var(--os-amber)" : "var(--os-border)"}`, borderRadius: 4, background: checked ? "var(--os-amber-soft)" : "var(--os-surface)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {checked && <div style={{ width: 10, height: 10, background: "var(--os-amber)", borderRadius: 2 }} />}
                </div>
                <span style={{ fontSize: 11, color: "var(--os-text-2)" }}>{label}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <label style={labelSt}>備註</label>
        <input style={inputSt} value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} />
      </div>
      <DialogFooter>
        <button onClick={onCancel}
          style={{ padding: "8px 18px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>
          取消
        </button>
        <button onClick={() => onSave({ ...form, storeId: Number(form.storeId) })}
          disabled={isPending || !form.employeeName || !form.storeId}
          style={{ padding: "8px 18px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (isPending || !form.employeeName || !form.storeId) ? 0.6 : 1 }}>
          {isPending ? "儲存中..." : "儲存"}
        </button>
      </DialogFooter>
    </div>
  );
}

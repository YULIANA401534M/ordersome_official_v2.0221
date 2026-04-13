import { useState, useMemo } from "react";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtMoney(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "-";
  const d = new Date(v);
  return `${d.toLocaleDateString("zh-TW")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DISPATCH_STATUS: Record<string, { label: string; cls: string }> = {
  draft:       { label: "草稿",   cls: "bg-gray-100 text-gray-600" },
  printed:     { label: "已列印", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "配送中", cls: "bg-orange-100 text-orange-700" },
  completed:   { label: "已完成", cls: "bg-green-100 text-green-700" },
};

const PAY_STATUS_STYLE: Record<string, string> = {
  monthly: "bg-blue-50 text-blue-700 border-blue-200",
  weekly:  "bg-green-50 text-green-700 border-green-200",
  unpaid:  "bg-orange-50 text-orange-700 border-orange-200",
  paid:    "bg-green-100 text-green-800 border-green-300",
};

const PAY_STATUS_LABEL: Record<string, string> = {
  monthly: "月結", weekly: "週結", unpaid: "現付", paid: "已付",
};

// ── GenerateConfirmDialog ──────────────────────────────────────────────────

function GenerateConfirmDialog({
  date,
  onClose,
  onSuccess,
}: {
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const mut = trpc.dayone.dispatch.generateDispatch.useMutation({
    onSuccess: (data) => {
      if (data.dispatchOrders.length === 0) {
        toast.warning((data as any).message ?? "當日無訂單");
      } else {
        toast.success(`已生成 ${data.dispatchOrders.length} 張派車單`);
      }
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>確認自動生成派車單</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <p className="text-sm text-gray-600">
            將為 <span className="font-semibold text-amber-700">{fmtDate(date)}</span> 的訂單自動分組並建立派車單。
          </p>
          <p className="text-xs text-gray-400 bg-amber-50 rounded p-2">
            ⚠️ 此操作將依行政區司機分組，並自動建立 AR 應收帳款記錄。
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button size="sm" disabled={mut.isPending}
              onClick={() => mut.mutate({ tenantId: TENANT_ID, dispatchDate: date })}
              className="bg-amber-500 hover:bg-amber-600 text-white">
              {mut.isPending ? "生成中..." : "確認生成"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── ManualAddStopDialog ────────────────────────────────────────────────────

function ManualAddStopDialog({
  dispatchOrderId,
  onClose,
  onSuccess,
}: {
  dispatchOrderId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [deliverBoxes, setDeliverBoxes] = useState(1);
  const [payStatus, setPayStatus] = useState("unpaid");

  const { data: customers } = trpc.dayone.customers.list.useQuery({ tenantId: TENANT_ID });

  const mut = trpc.dayone.dispatch.manualAddStop.useMutation({
    onSuccess: () => { toast.success("加站成功"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>手動加站</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <label className="text-sm font-medium mb-1 block">客戶</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="選擇客戶..." /></SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">入箱數量</label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm"
                className="w-10 h-10 text-lg font-bold"
                onClick={() => setDeliverBoxes(n => Math.max(1, n - 1))}>－</Button>
              <span className="text-xl font-bold w-10 text-center">{deliverBoxes}</span>
              <Button type="button" variant="outline" size="sm"
                className="w-10 h-10 text-lg font-bold"
                onClick={() => setDeliverBoxes(n => n + 1)}>＋</Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">付款方式</label>
            <Select value={payStatus} onValueChange={setPayStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">現付</SelectItem>
                <SelectItem value="monthly">月結</SelectItem>
                <SelectItem value="weekly">週結</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button size="sm" disabled={!customerId || mut.isPending}
              onClick={() => mut.mutate({
                dispatchOrderId,
                tenantId: TENANT_ID,
                customerId: Number(customerId),
                deliverBoxes,
                paymentStatus: payStatus,
                items: [],
              })}
              className="bg-amber-500 hover:bg-amber-600 text-white">
              {mut.isPending ? "新增中..." : "確認加站"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── DispatchDetailSheet ────────────────────────────────────────────────────

function DispatchDetailSheet({
  dispatchId,
  onClose,
}: {
  dispatchId: number;
  onClose: () => void;
}) {
  const [showAddStop, setShowAddStop] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");

  const { data: detail, isLoading, refetch } = trpc.dayone.dispatch.getDispatchDetail.useQuery(
    { id: dispatchId, tenantId: TENANT_ID },
    { enabled: !!dispatchId }
  );

  const markPrinted = trpc.dayone.dispatch.markPrinted.useMutation({
    onSuccess: () => { toast.success("已標記列印"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const items: any[] = detail?.items ?? [];

  const totals = useMemo(() => {
    const totalDeliver = items.reduce((s: number, i: any) => s + Number(i.deliverBoxes), 0);
    const totalReturn = items.reduce((s: number, i: any) => s + Number(i.returnBoxes), 0);
    const totalCash = items
      .filter((i: any) => i.paymentStatus === "unpaid" || i.paymentStatus === "paid")
      .reduce((s: number, i: any) => s + Number(i.cashCollected ?? i.orderAmount ?? 0), 0);
    return { totalDeliver, totalReturn, totalCash };
  }, [items]);

  function handlePrint() {
    window.print();
  }

  return (
    <Sheet open={!!dispatchId} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-amber-500" />
          </div>
        ) : !detail ? null : (
          <div className="h-full flex flex-col">
            {/* 操作列（列印時隱藏）*/}
            <div className="no-print sticky top-0 z-10 bg-white border-b px-5 py-3 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>← 返回</Button>
              <div className="ml-auto flex gap-2">
                {detail.status === "draft" && (
                  <Button size="sm" variant="outline"
                    disabled={markPrinted.isPending}
                    onClick={() => markPrinted.mutate({ id: dispatchId, tenantId: TENANT_ID })}>
                    標記已列印
                  </Button>
                )}
                <Button size="sm" onClick={handlePrint}
                  className="bg-amber-500 hover:bg-amber-600 text-white">
                  🖨️ 列印派車單
                </Button>
              </div>
            </div>

            {/* 列印主體 */}
            <div className="print-target flex-1 px-5 py-5 space-y-5">
              {/* 標頭 */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <p className="text-lg font-bold text-amber-700">大永蛋品有限公司</p>
                  <p className="text-xs text-gray-400">DayOne Egg Products Co., Ltd.</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">派車單</p>
                  <p className="text-sm text-gray-500">{fmtDate(detail.dispatchDate)}</p>
                </div>
              </div>

              {/* 基本資訊 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">司機</p>
                  <p className="font-semibold text-gray-900">{detail.driverName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">路線代碼</p>
                  <p className="font-semibold text-gray-900">{detail.routeCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">車牌（可填）</p>
                  <Input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="車牌號碼" className="h-7 text-sm no-print" />
                  <p className="hidden print:block text-gray-900">{licensePlate || "_________"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">狀態</p>
                  <Badge className={`${DISPATCH_STATUS[detail.status]?.cls ?? ""} border-0 text-xs mt-0.5`}>
                    {DISPATCH_STATUS[detail.status]?.label ?? detail.status}
                  </Badge>
                </div>
              </div>

              {/* 站點表格 */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">配送站點（共 {items.length} 站）</h3>

                {/* 桌面表格 */}
                <div className="hidden sm:block rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-amber-50 text-gray-600 border-b">
                        <th className="text-center px-2 py-2 font-medium w-8">序</th>
                        <th className="text-left px-3 py-2 font-medium">客戶名稱</th>
                        <th className="text-left px-3 py-2 font-medium hidden md:table-cell">地址</th>
                        <th className="text-left px-2 py-2 font-medium hidden md:table-cell">電話</th>
                        <th className="text-center px-2 py-2 font-medium">前箱</th>
                        <th className="text-center px-2 py-2 font-medium">入箱</th>
                        <th className="text-center px-2 py-2 font-medium">回箱</th>
                        <th className="text-center px-2 py-2 font-medium">餘箱</th>
                        <th className="text-center px-2 py-2 font-medium">付款</th>
                        <th className="text-right px-3 py-2 font-medium">應收</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => {
                        const remain = Number(item.prevBoxes) + Number(item.deliverBoxes) - Number(item.returnBoxes);
                        const isMonthly = item.paymentStatus === "monthly";
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-2 py-2 text-center text-gray-400 font-mono">{item.stopSequence}</td>
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900">{item.customerName}</p>
                              {item.orderNo && <p className="text-gray-400 font-mono">#{item.orderId}</p>}
                            </td>
                            <td className="px-3 py-2 text-gray-500 hidden md:table-cell max-w-[140px] truncate">
                              {item.customerAddress ?? "-"}
                            </td>
                            <td className="px-2 py-2 text-gray-500 hidden md:table-cell">
                              {item.customerPhone ?? "-"}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-600">{item.prevBoxes}</td>
                            <td className="px-2 py-2 text-center text-amber-700 font-semibold">{item.deliverBoxes || "___"}</td>
                            <td className="px-2 py-2 text-center text-gray-500">{item.returnBoxes || "___"}</td>
                            <td className="px-2 py-2 text-center font-bold text-gray-900">{remain || "___"}</td>
                            <td className="px-2 py-2 text-center">
                              <Badge className={`${PAY_STATUS_STYLE[item.paymentStatus] ?? ""} border text-xs`}>
                                {PAY_STATUS_LABEL[item.paymentStatus] ?? item.paymentStatus}
                              </Badge>
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold ${isMonthly ? "text-blue-500" : "text-red-600"}`}>
                              {isMonthly ? "月結" : fmtMoney(item.orderAmount ?? 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t font-semibold text-xs text-gray-700">
                        <td colSpan={4} className="px-3 py-2 text-right hidden md:table-cell">合計</td>
                        <td colSpan={2} className="px-3 py-2 text-right sm:hidden md:hidden">合計</td>
                        <td className="px-2 py-2 text-center"></td>
                        <td className="px-2 py-2 text-center text-amber-700">{totals.totalDeliver}</td>
                        <td className="px-2 py-2 text-center">{totals.totalReturn}</td>
                        <td className="px-2 py-2 text-center"></td>
                        <td className="px-2 py-2 text-center"></td>
                        <td className="px-3 py-2 text-right text-red-600">{fmtMoney(totals.totalCash)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 手機卡片 */}
                <div className="sm:hidden space-y-3">
                  {items.map((item: any) => {
                    const remain = Number(item.prevBoxes) + Number(item.deliverBoxes) - Number(item.returnBoxes);
                    const isMonthly = item.paymentStatus === "monthly";
                    return (
                      <div key={item.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-mono w-5">{item.stopSequence}.</span>
                            <p className="font-semibold text-gray-900 text-sm">{item.customerName}</p>
                          </div>
                          <Badge className={`${PAY_STATUS_STYLE[item.paymentStatus] ?? ""} border text-xs`}>
                            {PAY_STATUS_LABEL[item.paymentStatus] ?? item.paymentStatus}
                          </Badge>
                        </div>
                        {item.customerAddress && (
                          <p className="text-xs text-gray-500 ml-7">{item.customerAddress}</p>
                        )}
                        <div className="grid grid-cols-4 gap-1 text-xs ml-7">
                          <div className="text-center"><p className="text-gray-400">前箱</p><p className="font-medium">{item.prevBoxes}</p></div>
                          <div className="text-center"><p className="text-gray-400">入箱</p><p className="font-medium text-amber-700">{item.deliverBoxes || "___"}</p></div>
                          <div className="text-center"><p className="text-gray-400">回箱</p><p className="font-medium">{item.returnBoxes || "___"}</p></div>
                          <div className="text-center"><p className="text-gray-400">餘箱</p><p className="font-bold">{remain || "___"}</p></div>
                        </div>
                        <div className="flex justify-between items-center ml-7">
                          <span className="text-xs text-gray-400">應收</span>
                          <span className={`font-bold text-sm ${isMonthly ? "text-blue-500" : "text-red-600"}`}>
                            {isMonthly ? "月結" : fmtMoney(item.orderAmount ?? 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 底部合計 + 備用箱 */}
              <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">合計入箱</p>
                  <p className="text-2xl font-bold text-amber-700">{totals.totalDeliver}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">合計回箱</p>
                  <p className="text-2xl font-bold text-gray-700">{totals.totalReturn}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">合計應收現金</p>
                  <p className="text-xl font-bold text-red-600">{fmtMoney(totals.totalCash)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">備用箱數</p>
                  <p className="text-2xl font-bold text-blue-700">{detail.extraBoxes ?? 20}</p>
                </div>
              </div>

              {/* 簽收欄（列印用）*/}
              <div className="hidden print:grid grid-cols-2 gap-8 pt-6 border-t mt-6">
                <div>
                  <p className="text-xs text-gray-400 mb-4">司機簽名</p>
                  <div className="border-b border-gray-400 h-8" />
                  <p className="text-xs text-center text-gray-400 mt-1">{detail.driverName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-4">主管確認</p>
                  <div className="border-b border-gray-400 h-8" />
                </div>
              </div>

              {/* 手動加站按鈕（列印時隱藏）*/}
              <div className="no-print pt-2">
                <Button variant="outline" size="sm"
                  onClick={() => setShowAddStop(true)}>
                  ＋ 手動加站
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAddStop && (
          <ManualAddStopDialog
            dispatchOrderId={dispatchId}
            onClose={() => setShowAddStop(false)}
            onSuccess={() => refetch()}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function DayoneDispatch() {
  const [date, setDate] = useState(todayStr);
  const [showGenConfirm, setShowGenConfirm] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: dispatches = [], isLoading, refetch } = trpc.dayone.dispatch.listDispatch.useQuery({
    tenantId: TENANT_ID,
    dispatchDate: date,
  });

  function handleGenSuccess() {
    refetch();
    utils.dayone.dispatch.listDispatch.invalidate();
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-target { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <DayoneLayout>
        <div className="p-4 md:p-6 space-y-5">
          {/* 頁面標題 */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">派車管理</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
              <Button
                onClick={() => setShowGenConfirm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5">
                ⚡ 自動生成派車單
              </Button>
            </div>
          </div>

          {/* 派車單列表 */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-amber-500" />
            </div>
          ) : !(dispatches as any[]).length ? (
            <Card>
              <CardContent className="py-16 text-center space-y-4">
                <p className="text-gray-400">
                  {date} 尚無派車單
                </p>
                <Button
                  onClick={() => setShowGenConfirm(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white">
                  ⚡ 自動生成派車單
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(dispatches as any[]).map((d: any) => {
                const sc = DISPATCH_STATUS[d.status] ?? DISPATCH_STATUS.draft;
                return (
                  <Card key={d.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base text-gray-900">{d.driverName}</CardTitle>
                          <p className="text-xs text-gray-400 mt-0.5">路線：{d.routeCode}</p>
                        </div>
                        <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">配送日期</p>
                          <p className="font-medium text-gray-800">{fmtDate(d.dispatchDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">生成時間</p>
                          <p className="text-gray-600 text-xs">{d.generatedAt ? fmtDateTime(d.generatedAt) : "-"}</p>
                        </div>
                        {d.printedAt && (
                          <div>
                            <p className="text-xs text-gray-400">列印時間</p>
                            <p className="text-gray-600 text-xs">{fmtDateTime(d.printedAt)}</p>
                          </div>
                        )}
                        {d.completedAt && (
                          <div>
                            <p className="text-xs text-gray-400">完成時間</p>
                            <p className="text-green-700 text-xs">{fmtDateTime(d.completedAt)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1"
                          onClick={() => setDetailId(d.id)}>
                          查看 / 列印
                        </Button>
                        {d.status === "draft" && (
                          <Button size="sm" variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setDetailId(d.id)}>
                            標記列印
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DayoneLayout>

      {/* 自動生成確認 Dialog */}
      {showGenConfirm && (
        <GenerateConfirmDialog
          date={date}
          onClose={() => setShowGenConfirm(false)}
          onSuccess={handleGenSuccess}
        />
      )}

      {/* 派車單詳情 Sheet */}
      {detailId !== null && (
        <DispatchDetailSheet
          dispatchId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </>
  );
}

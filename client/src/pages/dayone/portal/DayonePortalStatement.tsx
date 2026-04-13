import { useState } from "react";
import DayonePortalLayout from "./DayonePortalLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function fmtMoney(v: number | string | null | undefined) {
  return `$${Number(v ?? 0).toLocaleString("zh-TW")}`;
}
function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}
function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const AR_STATUS: Record<string, { label: string; cls: string }> = {
  unpaid:  { label: "未付",   cls: "bg-red-100 text-red-700" },
  partial: { label: "部分付", cls: "bg-orange-100 text-orange-700" },
  paid:    { label: "已付",   cls: "bg-green-100 text-green-700" },
  overdue: { label: "逾期",   cls: "bg-red-200 text-red-800" },
};

export default function DayonePortalStatement() {
  const [yearMonth, setYearMonth] = useState(thisMonthStr());
  const [queried, setQueried] = useState(false);
  const [noteArId, setNoteArId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  const [y, m] = yearMonth.split("-").map(Number);

  const { data: stmt, isLoading, refetch } = trpc.dayone.portal.myStatement.useQuery(
    { year: y, month: m },
    { enabled: queried }
  );

  const addNote = trpc.dayone.portal.addCustomerNote.useMutation({
    onSuccess: () => { toast.success("備註已儲存"); setNoteArId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-target { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <DayonePortalLayout>
        <div className="p-4 space-y-5">
          <h1 className="text-lg font-bold text-gray-900">月結對帳單</h1>

          {/* 篩選 */}
          <div className="flex items-center gap-2">
            <Input type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} className="w-44" />
            <Button className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => { setQueried(true); refetch(); }}>查詢</Button>
          </div>

          {isLoading && queried && (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-6 w-6 rounded-full border-b-2 border-amber-500" />
            </div>
          )}

          {stmt && (
            <>
              <div className="no-print flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>🖨️ 下載 PDF</Button>
              </div>

              <div className="print-target space-y-4">
                {/* 標頭 */}
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-amber-600 text-base">大永蛋品有限公司</p>
                        <p className="text-xs text-gray-400">客戶月結對帳單</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{y} 年 {m} 月</p>
                        <p className="text-sm text-gray-600">{(stmt as any).customer?.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 帳款明細 */}
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">帳款明細</p>
                    {!(stmt as any).arRecords?.length ? (
                      <p className="text-sm text-gray-400">本月無帳款記錄</p>
                    ) : (
                      <div className="space-y-2">
                        {(stmt as any).arRecords.map((ar: any) => {
                          const sc = AR_STATUS[ar.status] ?? AR_STATUS.unpaid;
                          const isEditingNote = noteArId === ar.id;
                          return (
                            <div key={ar.id} className="border rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">訂單 #{ar.orderId}</p>
                                  <p className="text-xs text-gray-400">到期：{fmtDate(ar.dueDate)}</p>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                                  <span className="font-semibold text-gray-800">{fmtMoney(ar.amount)}</span>
                                </div>
                              </div>
                              {ar.adminNote && (
                                <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">管理員：{ar.adminNote}</p>
                              )}
                              {ar.customerNote && (
                                <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">我的備註：{ar.customerNote}</p>
                              )}
                              {isEditingNote ? (
                                <div className="space-y-1">
                                  <textarea className="w-full border rounded p-2 text-xs h-16 resize-none"
                                    value={noteText} onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="輸入備註..." />
                                  <div className="flex gap-1">
                                    <Button size="sm" className="text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white"
                                      disabled={addNote.isPending}
                                      onClick={() => addNote.mutate({ arId: ar.id, note: noteText })}>
                                      {addNote.isPending ? "儲存中..." : "儲存"}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-xs h-7"
                                      onClick={() => setNoteArId(null)}>取消</Button>
                                  </div>
                                </div>
                              ) : (
                                <button className="no-print text-xs text-amber-600 hover:underline"
                                  onClick={() => { setNoteArId(ar.id); setNoteText(ar.customerNote ?? ""); }}>
                                  + 新增我的備註
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 空箱台帳 */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">空箱台帳</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">目前餘箱</p>
                      <p className={`text-2xl font-bold ${(stmt as any).boxBalance < 0 ? "text-red-600" : "text-amber-700"}`}>
                        {(stmt as any).boxBalance}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 合計 */}
                <Card>
                  <CardContent className="pt-4 pb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">總應收金額</span>
                      <span className="font-medium text-gray-900">{fmtMoney((stmt as any).totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">已付金額</span>
                      <span className="font-medium text-green-700">{fmtMoney((stmt as any).paidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-800">尚欠金額</span>
                      <span className={`text-xl font-bold ${(stmt as any).unpaidAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmtMoney((stmt as any).unpaidAmount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DayonePortalLayout>
    </>
  );
}

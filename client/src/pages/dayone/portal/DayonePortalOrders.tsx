import { useState } from "react";
import DayonePortalLayout from "./DayonePortalLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

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

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  paid:    { label: "已付",   cls: "bg-green-100 text-green-700" },
  unpaid:  { label: "未付",   cls: "bg-red-100 text-red-700" },
  partial: { label: "部分付", cls: "bg-orange-100 text-orange-700" },
  monthly: { label: "月結",   cls: "bg-blue-100 text-blue-700" },
  weekly:  { label: "週結",   cls: "bg-purple-100 text-purple-700" },
};

export default function DayonePortalOrders() {
  const [month, setMonth] = useState(thisMonthStr());
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: orders = [], isLoading } = trpc.dayone.portal.myOrders.useQuery({ page, month });

  return (
    <DayonePortalLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-lg font-bold text-gray-900">我的訂單</h1>

        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }}
            className="w-44" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 rounded-full border-b-2 border-amber-500" />
          </div>
        ) : !(orders as any[]).length ? (
          <Card><CardContent className="py-10 text-center text-gray-400">當月無訂單記錄</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {(orders as any[]).map((o: any) => {
              const ps = PAY_STATUS[o.paymentStatus ?? "unpaid"] ?? PAY_STATUS.unpaid;
              const isOpen = expanded === o.id;
              return (
                <Card key={o.id}>
                  <CardContent className="p-0">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : o.id)}>
                      <div>
                        <p className="font-semibold text-gray-900">{fmtDate(o.deliveryDate ?? o.createdAt)}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">#{o.orderNo ?? o.id}</p>
                        {o.items?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {(o.items as any[]).slice(0, 2).map((i: any) => `${i.productName} ×${i.qty}`).join("、")}
                            {o.items.length > 2 ? ` 等 ${o.items.length} 項` : ""}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{fmtMoney(o.totalAmount)}</p>
                          <div className="flex justify-end mt-1">
                            <Badge className={`${ps.cls} border-0 text-xs`}>{ps.label}</Badge>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isOpen && o.items?.length > 0 && (
                      <div className="border-t px-4 py-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 mb-2">品項明細</p>
                        {(o.items as any[]).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm py-0.5">
                            <span className="text-gray-700">{item.productName}</span>
                            <span className="text-gray-600">{item.qty} × {fmtMoney(item.unitPrice)} = <strong>{fmtMoney(item.qty * item.unitPrice)}</strong></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-center gap-2 pt-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
          <span className="self-center text-sm text-gray-500">第 {page} 頁</span>
          <Button variant="outline" size="sm" disabled={(orders as any[]).length < 20} onClick={() => setPage(p => p + 1)}>下一頁</Button>
        </div>
      </div>
    </DayonePortalLayout>
  );
}

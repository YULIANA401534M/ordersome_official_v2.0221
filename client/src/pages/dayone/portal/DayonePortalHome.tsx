import { useMemo } from "react";
import { useLocation } from "wouter";
import DayonePortalLayout from "./DayonePortalLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function fmtMoney(v: number | string | null | undefined) {
  return `$${Number(v ?? 0).toLocaleString("zh-TW")}`;
}
function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: "待處理", cls: "bg-blue-100 text-blue-700" },
  delivering: { label: "配送中", cls: "bg-orange-100 text-orange-700" },
  delivered:  { label: "已送達", cls: "bg-green-100 text-green-700" },
  cancelled:  { label: "已取消", cls: "bg-gray-100 text-gray-500" },
};

export default function DayonePortalHome() {
  const [, navigate] = useLocation();

  const { data: me } = trpc.dayone.portal.me.useQuery();
  const { data: receivables = [] } = trpc.dayone.portal.myReceivables.useQuery({ status: "unpaid" });
  const { data: orders = [] } = trpc.dayone.portal.myOrders.useQuery({ page: 1 });

  const unpaidSum = useMemo(() =>
    (receivables as any[]).reduce((s: number, r: any) => s + Number(r.amount) - Number(r.paidAmount), 0),
    [receivables]
  );

  const thisMonthOrders = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return (orders as any[]).filter((o: any) => (o.deliveryDate ?? o.createdAt ?? "").startsWith(ym)).length;
  }, [orders]);

  const boxBalance = (me as any)?.boxBalance ?? 0;
  const recent5 = (orders as any[]).slice(0, 5);

  return (
    <DayonePortalLayout>
      <div className="p-4 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            您好，{(me as any)?.customer?.name ?? "客戶"} 👋
          </h1>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString("zh-TW", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        {/* 摘要卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dayone/portal/statement")}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-gray-400 mb-1">未付款</p>
              <p className={`text-xl font-bold ${unpaidSum > 0 ? "text-red-600" : "text-gray-400"}`}>{fmtMoney(unpaidSum)}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dayone/portal/orders")}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-gray-400 mb-1">本月訂單</p>
              <p className="text-xl font-bold text-amber-600">{thisMonthOrders} 筆</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dayone/portal/account")}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-gray-400 mb-1">空箱餘額</p>
              <p className={`text-xl font-bold ${boxBalance < 0 ? "text-red-600" : "text-amber-700"}`}>{boxBalance}</p>
            </CardContent>
          </Card>
        </div>

        {boxBalance < 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            ⚠️ 空箱餘額為負數（{boxBalance}），請確認是否有空箱待歸還。
          </div>
        )}

        {/* 最近訂單 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">最近訂單</h2>
            <Button variant="ghost" size="sm" className="text-amber-600 text-xs"
              onClick={() => navigate("/dayone/portal/orders")}>查看全部 →</Button>
          </div>

          {!recent5.length ? (
            <Card><CardContent className="py-8 text-center text-gray-400 text-sm">尚無訂單記錄</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {recent5.map((o: any) => {
                const sc = ORDER_STATUS[o.status] ?? { label: o.status, cls: "bg-gray-100 text-gray-600" };
                return (
                  <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fmtDate(o.deliveryDate ?? o.createdAt)}</p>
                      <p className="text-xs text-gray-400 font-mono">#{o.orderNo ?? o.id}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <Badge className={`${sc.cls} border-0 text-xs`}>{sc.label}</Badge>
                      <span className="text-sm font-semibold text-gray-700">{fmtMoney(o.totalAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DayonePortalLayout>
  );
}

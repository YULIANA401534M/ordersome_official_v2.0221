import { useState } from "react";
import DriverLayout from "./DriverLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ClipboardList, MapPin, Phone, ChevronRight, ChevronDown } from "lucide-react";

const TENANT_ID = 90004;

const STATUS_LABEL: Record<string, string> = {
  pending: "待處理",
  assigned: "已派車",
  picked: "已撿貨",
  delivering: "配送中",
  delivered: "已送達",
  returned: "已回單",
};

const STATUS_TONE: Record<string, string> = {
  pending:    "bg-stone-100 text-stone-500",
  assigned:   "bg-sky-100 text-sky-700",
  picked:     "bg-amber-100 text-amber-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  returned:   "bg-rose-100 text-rose-700",
};

export default function DriverOrders() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const todayDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: todayDate,
  });

  return (
    <DriverLayout title="配送訂單">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-[28px] bg-stone-900 px-5 py-5 text-white shadow-[0_16px_40px_rgba(28,25,23,0.18)]">
            <p className="text-xs tracking-[0.18em] text-white/50">今日配送</p>
            <h2 className="mt-3 font-brand text-[1.75rem] leading-none">配送清單</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              共 {orders.length} 站，點展開查看詳情，點箭頭進入簽收。
            </p>
          </section>

          {orders.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-14 text-center text-stone-400">
              <ClipboardList className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">今天沒有需要配送的訂單。</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(orders as any[]).map((order: any) => {
                const isExpanded = expandedId === order.id;
                const tone = STATUS_TONE[order.status] ?? "bg-stone-100 text-stone-500";
                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-[24px] border border-stone-200/80 bg-white shadow-[0_8px_20px_rgba(120,53,15,0.05)]"
                  >
                    {/* 收合列：點擊展開/收合 */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-stone-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      {order.stopSequence != null && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                          {order.stopSequence}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900">{order.customerName}</p>
                        <p className="mt-0.5 truncate text-xs text-stone-400">{order.customerAddress ?? "未提供地址"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 shrink-0 text-stone-300" />
                        : <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                      }
                    </button>

                    {/* 展開區：地址/電話/金額 + 進入按鈕 */}
                    {isExpanded && (
                      <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-3">
                        <div className="space-y-1.5 text-sm text-stone-500">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
                            <span>{order.customerAddress ?? "未提供地址"}</span>
                          </div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0 text-amber-500" />
                              <a href={`tel:${order.customerPhone}`} className="text-amber-700 underline-offset-2 hover:underline">
                                {order.customerPhone}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-stone-400">應收金額</p>
                            <p className="mt-0.5 text-lg font-bold text-stone-900">
                              NT$ {Number(order.totalAmount ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/driver/order/${order.id}`)}
                            className="flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
                          >
                            進入簽收
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DriverLayout>
  );
}

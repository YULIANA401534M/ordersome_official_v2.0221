import { useState, useEffect } from "react";
import liff from "@line/liff";
import { trpc } from "@/lib/trpc";

const TENANT_CONFIG: Record<string, { liffId: string; brandName: string }> = {
  dayone: { liffId: "2009700774-rWyJ27md", brandName: "大永蛋品" },
};
const DEFAULT_CONFIG = { liffId: "2009700774-rWyJ27md", brandName: "大永蛋品" };

function getTenantConfig(slug: string | null) {
  if (!slug) return { ...DEFAULT_CONFIG, slug: null };
  return { ...(TENANT_CONFIG[slug] ?? DEFAULT_CONFIG), slug };
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: "已收單，確認中", color: "bg-stone-100 text-stone-600" },
  assigned:   { label: "已排車",        color: "bg-sky-100 text-sky-700" },
  picked:     { label: "備貨中",        color: "bg-violet-100 text-violet-700" },
  delivering: { label: "配送中",        color: "bg-amber-100 text-amber-700" },
  delivered:  { label: "已送達",        color: "bg-emerald-100 text-emerald-700" },
  returned:   { label: "已退回",        color: "bg-rose-100 text-rose-700" },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  unpaid:  { label: "未付款",   color: "text-rose-600" },
  partial: { label: "部分付款", color: "text-amber-600" },
  paid:    { label: "已付清",   color: "text-emerald-600" },
};

function todayTW() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function monthStartTW() {
  return todayTW().slice(0, 7) + "-01";
}

function formatDate(val: string) {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit",
  });
}

function formatDateTime(val: string) {
  if (!val) return "-";
  return new Date(val).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatMoney(val: number) {
  return `NT$ ${val.toLocaleString("zh-TW")}`;
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">載入中...</p>
    </div>
  );
}

// ── 訂單卡片 ──
function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = ORDER_STATUS[order.status] ?? { label: order.status, color: "bg-stone-100 text-stone-600" };
  const payment = PAYMENT_STATUS[order.paymentStatus] ?? { label: order.paymentStatus, color: "text-stone-500" };
  const unpaid = Math.max(order.totalAmount - order.paidAmount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 頂部：訂單號 + 狀態 */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">{order.orderNo}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            配送日 {formatDate(order.deliveryDate)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">下單 {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* 金額 + 付款狀態 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-base font-bold text-gray-900">{formatMoney(order.totalAmount)}</p>
          <p className={`text-xs font-medium mt-0.5 ${payment.color}`}>{payment.label}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-amber-600 font-semibold px-3 py-1.5 rounded-xl bg-amber-50 active:bg-amber-100 shrink-0"
        >
          {expanded ? "收起" : "查看明細"}
        </button>
      </div>

      {/* 品項明細（展開） */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pt-3 pb-4 space-y-2">
          {order.items.length === 0 ? (
            <p className="text-xs text-gray-400">無品項資料</p>
          ) : (
            order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-gray-800 truncate">{item.productName}</span>
                  <span className="shrink-0 text-gray-400 text-xs">× {item.qty}{item.unit}</span>
                </div>
                <span className="shrink-0 ml-2 text-gray-600 font-medium">
                  {item.unitPrice > 0 ? formatMoney(item.subtotal) : "待確認"}
                </span>
              </div>
            ))
          )}

          {/* 付款細節 */}
          {order.totalAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              {order.paidAmount > 0 && order.paymentStatus !== "paid" && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>已付</span>
                  <span>{formatMoney(order.paidAmount)}</span>
                </div>
              )}
              {unpaid > 0 && (
                <div className="flex justify-between text-xs font-semibold text-rose-600">
                  <span>尚待付款</span>
                  <span>{formatMoney(unpaid)}</span>
                </div>
              )}
              {order.paymentStatus === "paid" && (
                <div className="flex justify-between text-xs font-semibold text-emerald-600">
                  <span>已全額付清</span>
                  <span>{formatMoney(order.totalAmount)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type DateMode = "single" | "range";

// ── 主頁面 ──
export default function LiffMyOrders() {
  const tenantSlug = new URLSearchParams(window.location.search).get("tenant");
  const config = getTenantConfig(tenantSlug);

  const [lineId, setLineId] = useState("");
  const [liffError, setLiffError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 日期模式
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [singleDate, setSingleDate] = useState(todayTW());
  const [rangeFrom, setRangeFrom] = useState(monthStartTW());
  const [rangeTo, setRangeTo] = useState(todayTW());

  const dateFrom = dateMode === "single" ? singleDate : rangeFrom;
  const dateTo   = dateMode === "single" ? singleDate : rangeTo;

  useEffect(() => {
    liff
      .init({ liffId: config.liffId })
      .then(() => {
        if (!liff.isLoggedIn()) { liff.login(); return; }
        return liff.getProfile().then((profile) => {
          setLineId(profile.userId);
          setReady(true);
        });
      })
      .catch((err: unknown) => {
        setLiffError(`LIFF 初始化失敗：${err instanceof Error ? err.message : String(err)}`);
      });
  }, []);

  const { data, isLoading, isError, error } = trpc.dayone.liff.getMyOrders.useQuery(
    { lineId, tenant: config.slug ?? undefined, dateFrom, dateTo },
    { enabled: ready && lineId !== "", retry: false }
  );

  if (liffError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
        <p className="text-sm text-red-500 text-center">{liffError}</p>
      </div>
    );
  }

  if (!ready || isLoading) return <LoadingScreen />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center gap-3">
        <p className="text-sm text-red-500">{(error as any)?.message ?? "查詢失敗，請稍後再試"}</p>
        <p className="text-xs text-gray-400">如尚未綁定帳號，請先點選「立即下單」完成綁定</p>
      </div>
    );
  }

  const orders = data?.orders ?? [];
  const customerName = data?.customerName ?? "";
  const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0);
  const unpaidAmount = orders.reduce((s, o) => s + Math.max(o.totalAmount - o.paidAmount, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* 頂部品牌區 */}
      <div className="bg-white px-5 pt-8 pb-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg leading-none">{config.brandName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{config.brandName}</h1>
            <p className="text-xs text-gray-500">{customerName}，您好</p>
          </div>
        </div>

        {/* 單日 / 範圍 切換 */}
        <div className="flex gap-2 mb-3">
          {([["single", "選單日"], ["range", "選範圍"]] as [DateMode, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDateMode(val)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                dateMode === val ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 日期輸入 */}
        {dateMode === "single" ? (
          <input
            type="date"
            value={singleDate}
            max={todayTW()}
            onChange={(e) => setSingleDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={rangeFrom}
              max={rangeTo}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <span className="text-gray-400 text-sm shrink-0">至</span>
            <input
              type="date"
              value={rangeTo}
              min={rangeFrom}
              max={todayTW()}
              onChange={(e) => setRangeTo(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        )}
      </div>

      {/* 統計列 */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 px-4 pt-4">
          <div className="bg-white rounded-2xl px-3 py-3 text-center shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">訂單數</p>
            <p className="text-xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-2xl px-3 py-3 text-center shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">總金額</p>
            <p className="text-sm font-bold text-gray-900">NT$ {totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl px-3 py-3 text-center shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">待付款</p>
            <p className={`text-sm font-bold ${unpaidAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              NT$ {unpaidAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* 訂單列表 */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">查無訂單資料</p>
            <p className="text-xs text-gray-400 mt-1">請調整日期範圍後重新查詢</p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.orderId} order={order} />)
        )}
      </div>
    </div>
  );
}

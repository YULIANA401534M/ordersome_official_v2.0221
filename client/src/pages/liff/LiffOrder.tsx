import { useState } from "react";
import { trpc } from "@/lib/trpc";

// ---------- 型別 ----------
interface CartItem {
  productId: number;
  qty: number;
}

// ---------- 子元件：商品卡片 ----------
function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
}: {
  product: { id: number; name: string; unit: string; defaultPrice: number };
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const selected = qty > 0;
  return (
    <div
      className={`rounded-2xl shadow-sm border p-4 transition-colors ${
        selected ? "bg-amber-50 border-amber-300" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* 商品資訊 */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-base leading-snug truncate">
            {product.name}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {product.defaultPrice > 0
              ? `NT$ ${product.defaultPrice} / ${product.unit}`
              : `依訂單確認 / ${product.unit}`}
          </p>
        </div>

        {/* 數量控制 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRemove}
            disabled={qty === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border transition-colors
              disabled:border-gray-200 disabled:text-gray-300 disabled:bg-gray-50
              enabled:border-amber-400 enabled:text-amber-600 enabled:bg-white enabled:active:bg-amber-50"
            aria-label="減少數量"
          >
            −
          </button>
          <span
            className={`w-8 text-center text-lg font-bold tabular-nums ${
              selected ? "text-amber-700" : "text-gray-400"
            }`}
          >
            {qty}
          </span>
          <button
            onClick={onAdd}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border border-amber-400 text-amber-600 bg-white active:bg-amber-50 transition-colors"
            aria-label="增加數量"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- 成功畫面 ----------
function SuccessScreen({ orderNo }: { orderNo: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg
          className="w-14 h-14 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">訂單已送出！</h2>
      <p className="text-gray-500 text-sm mb-4">業務將盡快確認您的訂單</p>
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 w-full max-w-xs">
        <p className="text-xs text-gray-400 mb-1">訂單編號</p>
        <p className="font-mono font-bold text-gray-700 text-base tracking-wide break-all">
          {orderNo}
        </p>
      </div>
    </div>
  );
}

// ---------- 主頁面 ----------
export default function LiffOrder() {
  // 從 URL query string 取得 lineId
  const params = new URLSearchParams(window.location.search);
  const lineId = params.get("lineId") ?? "";

  const [cart, setCart] = useState<Record<number, number>>({});
  const [submittedOrderNo, setSubmittedOrderNo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: products, isLoading, isError } = trpc.dayone.liff.getProducts.useQuery();
  const createOrder = trpc.dayone.liff.createOrder.useMutation({
    onSuccess(data) {
      setSubmittedOrderNo(data.orderNo);
    },
    onError(err) {
      setErrorMsg(err.message ?? "送出失敗，請稍後再試");
    },
  });

  // 送出成功 → 顯示成功畫面
  if (submittedOrderNo) {
    return <SuccessScreen orderNo={submittedOrderNo} />;
  }

  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

  function add(id: number) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setErrorMsg(null);
  }
  function remove(id: number) {
    setCart((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) > 0) next[id] -= 1;
      return next;
    });
  }

  function handleSubmit() {
    if (!lineId) {
      setErrorMsg("缺少 LINE 身份識別（lineId），請從 LINE 選單重新進入");
      return;
    }
    const items = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, qty]) => ({ productId: Number(id), qty }));
    if (items.length === 0) {
      setErrorMsg("請至少選擇一樣商品");
      return;
    }
    setErrorMsg(null);
    createOrder.mutate({ lineId, items });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* ===== 頂部品牌區 ===== */}
      <div className="bg-white px-5 pt-8 pb-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg leading-none">大</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">大永蛋品</h1>
            <p className="text-xs text-gray-400 tracking-widest">快速下單</p>
          </div>
        </div>
        {!lineId && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            ⚠️ 未帶入 lineId，請從 LINE 選單重新進入
          </div>
        )}
      </div>

      {/* ===== 商品列表 ===== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32">
        {isLoading && (
          <div className="text-center py-16 text-gray-400 text-sm">載入商品中…</div>
        )}
        {isError && (
          <div className="text-center py-16 text-red-400 text-sm">商品載入失敗，請重新整理</div>
        )}
        {products?.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            qty={cart[p.id] ?? 0}
            onAdd={() => add(p.id)}
            onRemove={() => remove(p.id)}
          />
        ))}
        {products && products.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">目前沒有可訂購的商品</div>
        )}
      </div>

      {/* ===== 底部固定送出按鈕 ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
           style={{ maxWidth: 480, margin: "0 auto", left: "50%", transform: "translateX(-50%)", width: "100%" }}>
        {errorMsg && (
          <p className="text-xs text-red-500 mb-2 text-center">{errorMsg}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={createOrder.isPending || totalItems === 0}
          className="w-full py-4 rounded-2xl text-white text-lg font-bold tracking-wide transition-all
            bg-gray-900 active:bg-gray-700
            disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {createOrder.isPending
            ? "送出中…"
            : totalItems > 0
            ? `送出訂單（${totalItems} 項）`
            : "請選擇商品"}
        </button>
      </div>
    </div>
  );
}

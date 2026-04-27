import { useState, useEffect } from "react";
import liff from "@line/liff";
import { trpc } from "@/lib/trpc";

// 租戶對應表：?tenant=xxx → { liffId, brandName }
const TENANT_CONFIG: Record<string, { liffId: string; brandName: string }> = {
  dayone: { liffId: "2009700774-rWyJ27md", brandName: "大永蛋品" },
};
const DEFAULT_CONFIG = { liffId: "2009700774-rWyJ27md", brandName: "快速下單" };

function getTenantConfig(slug: string | null) {
  if (!slug) return { ...DEFAULT_CONFIG, slug: null };
  return { ...(TENANT_CONFIG[slug] ?? DEFAULT_CONFIG), slug };
}

interface CartItem {
  productId: number;
  qty: number;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  defaultPrice: number;
  imageUrl: string | null;
  currentQty: number;
}

// ---------- 子元件：商品卡片 ----------
function ProductCard({
  product,
  qty,
  onAdd,
  onRemove,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const selected = qty > 0;
  const soldOut = product.currentQty === 0;

  return (
    <div
      className={`rounded-2xl shadow-sm border p-4 transition-colors ${
        soldOut
          ? "bg-gray-50 border-gray-100 opacity-60"
          : selected
          ? "bg-amber-50 border-amber-300"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* 商品圖片 */}
        <div className="shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        {/* 品名與價格 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-800 text-base leading-snug truncate">
              {product.name}
            </p>
            {soldOut && (
              <span className="shrink-0 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">補貨中</span>
            )}
          </div>
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
            disabled={qty === 0 || soldOut}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border transition-colors
              disabled:border-gray-200 disabled:text-gray-300 disabled:bg-gray-50
              enabled:border-amber-400 enabled:text-amber-600 enabled:bg-white enabled:active:bg-amber-50"
            aria-label="減少數量"
          >
            −
          </button>
          <span
            className={`w-8 text-center text-lg font-bold tabular-nums ${
              selected && !soldOut ? "text-amber-700" : "text-gray-400"
            }`}
          >
            {qty}
          </span>
          <button
            onClick={onAdd}
            disabled={soldOut}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border transition-colors
              disabled:border-gray-200 disabled:text-gray-300 disabled:bg-gray-50
              enabled:border-amber-400 enabled:text-amber-600 enabled:bg-white enabled:active:bg-amber-50"
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
function SuccessScreen({
  orderNo,
  items,
  products,
}: {
  orderNo: string;
  items: { productId: number; qty: number }[];
  products: Product[];
}) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const totalAmount = items.reduce((sum, item) => {
    const p = productMap.get(item.productId);
    return sum + (p ? p.defaultPrice * item.qty : 0);
  }, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg className="w-14 h-14 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">訂單已送出！</h2>
      <p className="text-gray-500 text-sm mb-4">業務將盡快確認您的訂單</p>

      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 w-full max-w-xs text-left">
        <p className="text-xs text-gray-400 mb-1 text-center">訂單編號</p>
        <p className="font-mono font-bold text-gray-700 text-sm tracking-wide break-all text-center mb-4">{orderNo}</p>

        <div className="border-t border-gray-100 pt-3 space-y-2">
          {items.map((item) => {
            const p = productMap.get(item.productId);
            if (!p) return null;
            return (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-700">{p.name} × {item.qty}{p.unit}</span>
                <span className="text-gray-500 shrink-0">
                  {p.defaultPrice > 0 ? `NT$ ${(p.defaultPrice * item.qty).toLocaleString()}` : "待確認"}
                </span>
              </div>
            );
          })}
        </div>

        {totalAmount > 0 && (
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm font-semibold">
            <span className="text-gray-700">合計</span>
            <span className="text-amber-700">NT$ {totalAmount.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Loading 畫面 ----------
function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{message ?? "載入中..."}</p>
    </div>
  );
}

// ---------- 綁定畫面 ----------
function BindingScreen({
  brandName,
  lineId,
  tenant,
  onBound,
}: {
  brandName: string;
  lineId: string;
  tenant: string | null;
  onBound: (customerName: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bindMutation = trpc.dayone.liff.bindLineId.useMutation({
    onSuccess(data) {
      onBound(data.customerName);
    },
    onError(err) {
      setErrorMsg(err.message ?? "綁定失敗，請稍後再試");
    },
  });

  function handleBind() {
    const trimmed = phone.trim();
    if (!trimmed) { setErrorMsg("請輸入手機號碼"); return; }
    if (!/^0\d{9}$/.test(trimmed)) { setErrorMsg("請輸入正確的手機號碼格式，例如 0912345678"); return; }
    setErrorMsg(null);
    bindMutation.mutate({ lineId, phone: trimmed, tenant: tenant ?? undefined });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg leading-none">{brandName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{brandName}</h1>
            <p className="text-xs text-gray-400 tracking-widest">首次使用</p>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">綁定您的帳號</h2>
          <p className="text-sm text-gray-500">請輸入您在大永蛋品登記的手機號碼，完成綁定後即可開始下單。</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">手機號碼</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="0912345678"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrorMsg(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleBind()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
        {errorMsg && <p className="text-sm text-red-500 mb-4">{errorMsg}</p>}
        <button
          onClick={handleBind}
          disabled={bindMutation.isPending}
          className="w-full py-4 rounded-2xl text-white text-lg font-bold tracking-wide transition-all bg-gray-900 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {bindMutation.isPending ? "綁定中…" : "確認綁定"}
        </button>
        <p className="text-xs text-gray-400 text-center mt-4">如有問題請聯絡您的業務人員</p>
      </div>
    </div>
  );
}

// ---------- 主頁面 ----------
type AppState = "init" | "checking" | "binding" | "ordering";

export default function LiffOrder() {
  const tenantSlug = new URLSearchParams(window.location.search).get("tenant");
  const config = getTenantConfig(tenantSlug);

  const [lineId, setLineId] = useState<string>("");
  const [liffError, setLiffError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("init");
  const [customerName, setCustomerName] = useState<string>("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [submittedOrderNo, setSubmittedOrderNo] = useState<string | null>(null);
  const [submittedItems, setSubmittedItems] = useState<{ productId: number; qty: number }[]>([]);
  const [orderErrorMsg, setOrderErrorMsg] = useState<string | null>(null);

  // Step 1: LIFF init → 取得 lineId
  useEffect(() => {
    liff
      .init({ liffId: config.liffId })
      .then(() => {
        if (!liff.isLoggedIn()) { liff.login(); return; }
        return liff.getProfile().then((profile) => {
          setLineId(profile.userId);
          setAppState("checking");
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setLiffError(`LIFF 初始化失敗：${msg}`);
      });
  }, []);

  // ★ 所有 Hook 必須無條件在頂層呼叫，用 enabled 控制是否執行 ★

  // Step 2: 查綁定狀態
  const checkBinding = trpc.dayone.liff.checkBinding.useQuery(
    { lineId, tenant: config.slug ?? undefined },
    { enabled: appState === "checking" && lineId !== "", retry: false }
  );

  useEffect(() => {
    if (appState !== "checking") return;
    if (checkBinding.isSuccess) {
      if (checkBinding.data.bound) {
        setCustomerName(checkBinding.data.customerName ?? "");
        setAppState("ordering");
      } else {
        setAppState("binding");
      }
    } else if (checkBinding.isError) {
      setAppState("binding");
    }
  }, [appState, checkBinding.isSuccess, checkBinding.isError, checkBinding.data]);

  // Step 3: 取商品（進入下單頁才啟用，帶 lineId 讓後端回傳該客戶適用價格）
  const productsQuery = trpc.dayone.liff.getProducts.useQuery(
    { tenant: config.slug ?? undefined, lineId: lineId || undefined },
    { enabled: appState === "ordering" && lineId !== "" }
  );

  // Step 4: 建立訂單
  const createOrder = trpc.dayone.liff.createOrder.useMutation({
    onSuccess(data) {
      const items = Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => ({ productId: Number(id), qty }));
      setSubmittedItems(items);
      setSubmittedOrderNo(data.orderNo);
    },
    onError(err) { setOrderErrorMsg(err.message ?? "送出失敗，請稍後再試"); },
  });

  // ---------- 渲染邏輯（純條件式 return，不再有 Hook）----------

  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
        <p className="text-red-500 text-sm">{liffError}</p>
      </div>
    );
  }

  if (appState === "init" || (appState === "checking" && !checkBinding.isSuccess && !checkBinding.isError)) {
    return <LoadingScreen message="驗證身份中..." />;
  }

  if (appState === "binding") {
    return (
      <BindingScreen
        brandName={config.brandName}
        lineId={lineId}
        tenant={config.slug}
        onBound={(name) => { setCustomerName(name); setAppState("ordering"); }}
      />
    );
  }

  if (submittedOrderNo) {
    return (
      <SuccessScreen
        orderNo={submittedOrderNo}
        items={submittedItems}
        products={productsQuery.data ?? []}
      />
    );
  }

  const products = productsQuery.data ?? [];

  // 購物車總金額
  const totalAmount = products.reduce((sum, p) => {
    const qty = cart[p.id] ?? 0;
    return sum + (p.defaultPrice > 0 ? p.defaultPrice * qty : 0);
  }, 0);
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

  function add(id: number) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setOrderErrorMsg(null);
  }
  function remove(id: number) {
    setCart((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) > 0) next[id] -= 1;
      return next;
    });
  }
  function handleSubmit() {
    const items = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, qty]) => ({ productId: Number(id), qty }));
    if (items.length === 0) { setOrderErrorMsg("請至少選擇一樣商品"); return; }
    setOrderErrorMsg(null);
    createOrder.mutate({ lineId, tenant: config.slug ?? undefined, items });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* 頂部品牌區 */}
      <div className="bg-white px-5 pt-8 pb-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg leading-none">{config.brandName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{config.brandName}</h1>
            {customerName
              ? <p className="text-xs text-gray-500">{customerName}，歡迎光臨</p>
              : <p className="text-xs text-gray-400 tracking-widest">快速下單</p>
            }
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-36">
        {productsQuery.isLoading && (
          <div className="text-center py-16 text-gray-400 text-sm">載入商品中…</div>
        )}
        {productsQuery.isError && (
          <div className="text-center py-16 text-red-400 text-sm">商品載入失敗，請重新整理</div>
        )}
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            qty={cart[p.id] ?? 0}
            onAdd={() => add(p.id)}
            onRemove={() => remove(p.id)}
          />
        ))}
        {!productsQuery.isLoading && products.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">目前沒有可訂購的商品</div>
        )}
      </div>

      {/* 底部小計 + 送出按鈕 */}
      <div
        className="fixed bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ maxWidth: 480, left: "50%", transform: "translateX(-50%)", width: "100%" }}
      >
        {/* 小計列 */}
        {totalItems > 0 && (
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-sm text-gray-500">合計 {totalItems} 項</span>
            <span className="text-base font-bold text-amber-700">
              {totalAmount > 0 ? `NT$ ${totalAmount.toLocaleString()}` : "金額待確認"}
            </span>
          </div>
        )}
        {orderErrorMsg && <p className="text-xs text-red-500 mb-2 text-center">{orderErrorMsg}</p>}
        <button
          onClick={handleSubmit}
          disabled={createOrder.isPending || totalItems === 0}
          className="w-full py-4 rounded-2xl text-white text-lg font-bold tracking-wide transition-all
            bg-gray-900 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {createOrder.isPending ? "送出中…" : totalItems > 0 ? `送出訂單（${totalItems} 項）` : "請選擇商品"}
        </button>
      </div>
    </div>
  );
}

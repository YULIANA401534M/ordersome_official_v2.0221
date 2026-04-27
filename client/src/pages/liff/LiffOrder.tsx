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
  onBound,
  lineId,
  tenant,
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
    if (!trimmed) {
      setErrorMsg("請輸入手機號碼");
      return;
    }
    if (!/^0\d{9}$/.test(trimmed)) {
      setErrorMsg("請輸入正確的手機號碼格式，例如 0912345678");
      return;
    }
    setErrorMsg(null);
    bindMutation.mutate({ lineId, phone: trimmed, tenant: tenant ?? undefined });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        {/* 品牌 header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg leading-none">{brandName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{brandName}</h1>
            <p className="text-xs text-gray-400 tracking-widest">首次使用</p>
          </div>
        </div>

        {/* 說明 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">綁定您的帳號</h2>
          <p className="text-sm text-gray-500">
            請輸入您在大永蛋品登記的手機號碼，完成綁定後即可開始下單。
          </p>
        </div>

        {/* 手機號輸入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">手機號碼</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="0912345678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrorMsg(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleBind()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-500 mb-4">{errorMsg}</p>
        )}

        <button
          onClick={handleBind}
          disabled={bindMutation.isPending}
          className="w-full py-4 rounded-2xl text-white text-lg font-bold tracking-wide transition-all
            bg-gray-900 active:bg-gray-700
            disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {bindMutation.isPending ? "綁定中…" : "確認綁定"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          如有問題請聯絡您的業務人員
        </p>
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: LIFF init → 取得 lineId → checkBinding
  useEffect(() => {
    liff
      .init({ liffId: config.liffId })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
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

  // Step 2: 有 lineId 後查綁定狀態
  const checkBinding = trpc.dayone.liff.checkBinding.useQuery(
    { lineId, tenant: config.slug ?? undefined },
    {
      enabled: appState === "checking" && lineId !== "",
      retry: false,
    }
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

  // ---------- 錯誤畫面 ----------
  if (liffError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
        <p className="text-red-500 text-sm">{liffError}</p>
      </div>
    );
  }

  // ---------- 初始化 / 查詢中 ----------
  if (appState === "init" || (appState === "checking" && checkBinding.isLoading)) {
    return <LoadingScreen message="驗證身份中..." />;
  }

  // ---------- 綁定畫面 ----------
  if (appState === "binding") {
    return (
      <BindingScreen
        brandName={config.brandName}
        lineId={lineId}
        tenant={config.slug}
        onBound={(name) => {
          setCustomerName(name);
          setAppState("ordering");
        }}
      />
    );
  }

  // ---------- 下單頁 ----------
  const { data: products, isLoading, isError } = trpc.dayone.liff.getProducts.useQuery({
    tenant: config.slug ?? undefined,
  });
  const createOrder = trpc.dayone.liff.createOrder.useMutation({
    onSuccess(data) {
      setSubmittedOrderNo(data.orderNo);
    },
    onError(err) {
      setErrorMsg(err.message ?? "送出失敗，請稍後再試");
    },
  });

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
    const items = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, qty]) => ({ productId: Number(id), qty }));
    if (items.length === 0) {
      setErrorMsg("請至少選擇一樣商品");
      return;
    }
    setErrorMsg(null);
    createOrder.mutate({ lineId, tenant: config.slug ?? undefined, items });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* ===== 頂部品牌區 ===== */}
      <div className="bg-white px-5 pt-8 pb-5 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg leading-none">{config.brandName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">{config.brandName}</h1>
            {customerName ? (
              <p className="text-xs text-gray-500">{customerName}，歡迎光臨</p>
            ) : (
              <p className="text-xs text-gray-400 tracking-widest">快速下單</p>
            )}
          </div>
        </div>
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
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ maxWidth: 480, margin: "0 auto", left: "50%", transform: "translateX(-50%)", width: "100%" }}
      >
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

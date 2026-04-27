import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const TENANT_ID = 90004;

function nowLocalDatetime() {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// ── 簽名畫布 ──────────────────────────────────────────────
function SignatureCanvas({ onDone }: { onDone: (base64: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
      }
    };
    const t = setTimeout(sync, 300);
    const obs = new ResizeObserver(sync);
    obs.observe(canvas);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, []);

  const getPoint = useCallback((e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }, []);

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPoint.current = getPoint(e, canvas);
  }
  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const next = getPoint(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(next.x, next.y);
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = next;
  }
  function endDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    isDrawing.current = false;
    lastPoint.current = null;
  }
  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  function confirm() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!data.some((v, i) => i % 4 === 3 && v > 0)) {
      toast.error("請先完成簽名");
      return;
    }
    onDone(canvas.toDataURL("image/png"));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500">請牧場工作人員在下方簽名確認</p>
      <div className="overflow-hidden rounded-[24px] border-2 border-dashed border-stone-300 bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={240}
          className="block h-[200px] w-full touch-none"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex-1 rounded-2xl border border-stone-300 bg-white py-3 text-sm font-medium text-stone-600 active:bg-stone-50"
        >
          清除重簽
        </button>
        <button
          type="button"
          onClick={confirm}
          className="flex-1 rounded-2xl bg-amber-600 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(180,83,9,0.22)] active:bg-amber-700"
        >
          確認簽名 →
        </button>
      </div>
    </div>
  );
}

// ── 主頁面 ────────────────────────────────────────────────
type Step = "form" | "sign" | "done";

export default function DriverPurchaseReceipt() {
  const [step, setStep] = useState<Step>("form");
  const [supplierId, setSupplierId] = useState("");
  const [receiptDate, setReceiptDate] = useState(nowLocalDatetime());
  const [licensePlate, setLicensePlate] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [prices, setPrices] = useState<Record<number, number>>({});
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [signatureUrl, setSignatureUrl] = useState("");

  const { data: suppliers = [] } = trpc.dayone.suppliers.listForDriver.useQuery({ tenantId: TENANT_ID });
  const { data: products = [] } = trpc.dayone.products.listForDriver.useQuery({ tenantId: TENANT_ID });
  const { data: eggPrice, refetch: refetchEggPrice } = trpc.dayone.eggPrice.today.useQuery();

  // 識別哪個商品是「普白大箱」（對應農委會雞蛋大運輸價）
  const EGG_PRODUCT_KEYWORDS = ["普白", "白蛋", "白殼"];

  // 初始化價格：普白大箱用農委會時價，其他用商品預設價
  useEffect(() => {
    if (!products.length) return;
    const next: Record<number, number> = {};
    for (const p of products as any[]) {
      const pid = Number(p.id);
      const isEgg = EGG_PRODUCT_KEYWORDS.some((kw) => (p.name as string).includes(kw));
      if (isEgg && eggPrice?.pricePerBox) {
        next[pid] = eggPrice.pricePerBox;
      } else {
        next[pid] = Number(p.defaultPrice ?? p.price ?? 0);
      }
    }
    setPrices(next);
  }, [products, eggPrice]);

  const createReceipt = trpc.dayone.purchaseReceipt.create.useMutation({
    onSuccess: (data) => {
      setCreatedId(Number(data.id));
      setStep("sign");
    },
    onError: (e) => toast.error(e.message),
  });

  const signReceipt = trpc.dayone.purchaseReceipt.sign.useMutation({
    onSuccess: (data) => {
      setSignatureUrl(data.supplierSignatureUrl ?? "");
      setStep("done");
    },
    onError: (e) => toast.error(e.message),
  });

  function adjustQty(pid: number, delta: number) {
    setQuantities((c) => ({ ...c, [pid]: Math.max(0, Number(c[pid] ?? 0) + delta) }));
  }

  function handleSubmit() {
    if (!supplierId) { toast.error("請選擇供應商（牧場）"); return; }
    const items = (products as any[])
      .filter((p: any) => Number(quantities[Number(p.id)] ?? 0) > 0)
      .map((p: any) => ({
        productId: Number(p.id),
        name: p.name as string,
        qty: Number(quantities[Number(p.id)]),
        unitPrice: Number(prices[Number(p.id)] ?? 0),
      }));
    if (!items.length) { toast.error("請至少輸入一個品項的數量"); return; }
    createReceipt.mutate({
      tenantId: TENANT_ID,
      supplierId: Number(supplierId),
      receiptDate,
      licensePlate,
      items,
    });
  }

  const selectedItems = (products as any[])
    .filter((p: any) => Number(quantities[Number(p.id)] ?? 0) > 0)
    .map((p: any) => ({
      name: p.name as string,
      qty: Number(quantities[Number(p.id)]),
      unitPrice: Number(prices[Number(p.id)] ?? 0),
    }));
  const totalQty = selectedItems.reduce((s, i) => s + i.qty, 0);
  const totalAmount = selectedItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const supplierName = (suppliers as any[]).find((s: any) => String(s.id) === supplierId)?.name ?? "";

  // ── 完成畫面 ──
  if (step === "done") {
    return (
      <DriverLayout title="進貨完成">
        <div className="space-y-5 pb-8">
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-3xl">✓</span>
            </div>
            <p className="mt-3 text-lg font-bold text-emerald-800">進貨簽收完成</p>
            <p className="mt-1 text-sm text-emerald-600">{supplierName} · {totalQty} 箱</p>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-white px-5 py-4 text-sm space-y-3">
            <p className="font-semibold text-stone-700">簽收摘要</p>
            {selectedItems.map((item, i) => (
              <div key={i} className="flex justify-between text-stone-600">
                <span>{item.name} × {item.qty} 箱</span>
                <span>NT$ {(item.qty * item.unitPrice).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-stone-100 pt-3 font-semibold text-stone-900">
              <span>合計</span>
              <span>NT$ {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {signatureUrl && (
            <div className="rounded-[24px] border border-stone-200 bg-white px-5 py-4">
              <p className="mb-2 text-xs text-stone-500">牧場簽名</p>
              <img src={signatureUrl} alt="簽名" className="max-h-24 rounded-xl border bg-white" />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setStep("form");
              setSupplierId("");
              setQuantities({});
              setReceiptDate(nowLocalDatetime());
              setLicensePlate("");
              setCreatedId(null);
            }}
            className="w-full rounded-2xl border border-stone-300 bg-white py-3.5 text-sm font-medium text-stone-700 active:bg-stone-50"
          >
            再建一張收貨單
          </button>
        </div>
      </DriverLayout>
    );
  }

  // ── 簽名畫面 ──
  if (step === "sign") {
    return (
      <DriverLayout title="牧場簽名">
        <div className="space-y-5 pb-8">
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4 text-sm">
            <p className="font-semibold text-amber-800">{supplierName}</p>
            <p className="mt-2 text-amber-700">
              {selectedItems.map((i) => `${i.name} × ${i.qty} 箱`).join("　")}
            </p>
            <p className="mt-1 font-semibold text-amber-900">
              合計 NT$ {totalAmount.toLocaleString()}（{totalQty} 箱）
            </p>
          </div>

          <SignatureCanvas
            onDone={(base64) => {
              if (!createdId) return;
              signReceipt.mutate({ id: createdId, tenantId: TENANT_ID, signatureBase64: base64 });
            }}
          />

          {signReceipt.isPending && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-amber-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              簽收送出中...
            </div>
          )}
        </div>
      </DriverLayout>
    );
  }

  // ── 填寫表單 ──
  return (
    <DriverLayout title="進貨收貨">
      <div className="space-y-5 pb-8">

        {/* 農委會今日蛋價 */}
        {eggPrice?.pricePerJin ? (
          <div className="flex items-center justify-between rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3">
            <div>
              <p className="text-xs text-amber-600">農委會大運輸價（資料日期：{eggPrice.date}）</p>
              <p className="mt-0.5 text-lg font-bold text-amber-800">NT$ {eggPrice.pricePerJin} / 台斤</p>
              <p className="text-xs text-stone-400">換算箱價：NT$ {eggPrice.pricePerBox} / 箱（20 台斤）</p>
            </div>
            <button
              type="button"
              onClick={() => refetchEggPrice()}
              className="rounded-xl p-2 text-amber-600 hover:bg-amber-100 active:bg-amber-200"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
            農委會蛋價今日暫無資料，請手動輸入單價
          </div>
        )}

        {/* 供應商 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">牧場（供應商）</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-amber-400"
          >
            <option value="">選擇牧場...</option>
            {(suppliers as any[]).map((s: any) => (
              <option key={Number(s.id)} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 收貨時間 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">收貨時間</label>
          <input
            type="datetime-local"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-amber-400"
          />
        </div>

        {/* 車牌 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">車牌號碼</label>
          <input
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            placeholder="例：ABC-1234"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-amber-400"
          />
        </div>

        {/* 品項數量 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">收貨品項</label>
          <div className="space-y-2">
            {(products as any[]).map((p: any) => {
              const pid = Number(p.id);
              const qty = Number(quantities[pid] ?? 0);
              const active = qty > 0;
              const isEgg = EGG_PRODUCT_KEYWORDS.some((kw) => (p.name as string).includes(kw));
              return (
                <div
                  key={pid}
                  className={`rounded-[22px] border px-4 py-3.5 transition-colors ${active ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${active ? "text-stone-900" : "text-stone-600"}`}>
                        {p.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-500">
                        <span>單價</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={prices[pid] ?? ""}
                          onChange={(e) => setPrices((c) => ({ ...c, [pid]: Number(e.target.value || 0) }))}
                          className="h-7 w-20 rounded-xl border border-stone-200 bg-white px-2 text-sm text-stone-700 outline-none"
                        />
                        {isEgg && eggPrice?.pricePerJin && (
                          <span className="text-amber-600">（農委會 {eggPrice.pricePerJin}/台斤）</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustQty(pid, -1)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-lg font-bold text-stone-500 active:bg-stone-100"
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => setQuantities((c) => ({ ...c, [pid]: Math.max(0, Number(e.target.value || 0)) }))}
                        className={`h-10 w-14 rounded-2xl border bg-white text-center text-sm font-bold outline-none ${active ? "border-amber-300 text-amber-700" : "border-stone-200 text-stone-400"}`}
                      />
                      <button
                        type="button"
                        onClick={() => adjustQty(pid, 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300 bg-amber-100 text-lg font-bold text-amber-700 active:bg-amber-200"
                      >+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 小計 */}
        {totalQty > 0 && (
          <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4">
            <div className="flex justify-between text-sm text-stone-600">
              <span>總箱數</span><span className="font-semibold text-stone-900">{totalQty} 箱</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-stone-600">預估金額</span>
              <span className="font-bold text-stone-900">NT$ {totalAmount.toLocaleString()}</span>
            </div>
            <p className="mt-1.5 text-xs text-stone-400">實際金額以供應商簽名後為準</p>
          </div>
        )}

        {/* 送出 */}
        <button
          type="button"
          disabled={createReceipt.isPending || !supplierId || totalQty === 0}
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-amber-600 py-4 text-base font-bold text-white shadow-[0_12px_28px_rgba(180,83,9,0.24)] disabled:opacity-40 active:bg-amber-700"
        >
          {createReceipt.isPending ? "建立中..." : "下一步：請牧場簽名 →"}
        </button>
      </div>
    </DriverLayout>
  );
}

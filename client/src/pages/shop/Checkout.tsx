"use client";
import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, CreditCard, Building, Store, FileText,
  AlertCircle, ShoppingCart, User, Package, ChevronRight,
  Mail, Phone, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

// ─── 驗證函式 ────────────────────────────────────────────────
const PHONE_RE = /^09\d{8}$/;
const TAX_ID_RE = /^\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePhone = (v: string) => PHONE_RE.test(v);
const validateTaxId = (v: string) => TAX_ID_RE.test(v);
const validateEmail = (v: string) => EMAIL_RE.test(v);

// ─── 小工具：紅色錯誤提示 ─────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {msg}
    </p>
  );
}

// ─── 步驟標題 ─────────────────────────────────────────────────
function StepHeader({ num, icon: Icon, title }: { num: number; icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
        {num}
      </div>
      <Icon className="h-5 w-5 text-amber-600" />
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

// ─── 主組件 ──────────────────────────────────────────────────
export default function Checkout() {
  useEffect(() => {
    document.querySelector('meta[name="robots"]')?.setAttribute(
      "content",
      "noindex, nofollow"
    );
  }, []);

  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, clearCart } = useCartStore();

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { data: storeSettings, isLoading: isSettingsLoading } = trpc.storeSettings.get.useQuery();
  const baseShippingFee = storeSettings?.baseShippingFee ?? 100;
  const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 1000;
  const shippingFee = totalPrice >= freeShippingThreshold ? 0 : baseShippingFee;
  const grandTotal = totalPrice + shippingFee;

  // ─── 表單狀態 ─────────────────────────────────────────────
  const [form, setForm] = useState({
    // Block 2
    guestEmail: "",
    guestPhone: "",
    // Block 3
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    shippingAddress: "",
    note: "",
    paymentMethod: "credit_card",
    invoiceType: "personal" as "personal" | "company",
    companyTaxId: "",
    companyName: "",
  });

  // 登入狀態自動帶入用戶資料（OAuth 回跳後自動填充）
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm(prev => ({
        ...prev,
        guestEmail: prev.guestEmail || (user as any).email || "",
        recipientName: prev.recipientName || (user as any).name || (user as any).fullName || "",
        recipientEmail: prev.recipientEmail || (user as any).email || "",
        recipientPhone: prev.recipientPhone || (user as any).phone || "",
        shippingAddress: prev.shippingAddress || (user as any).shippingAddress || (user as any).address || "",
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, (user as any)?.id]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── 即時驗證（onChange + onBlur 雙觸發）────────────────────
  const validate = useCallback(
    (data: typeof form): Record<string, string> => {
      const e: Record<string, string> = {};

      // Block 2：訪客電話（登入用戶可選填）
      if (!isAuthenticated) {
        if (!data.guestPhone) {
          e.guestPhone = "請輸入聯絡電話";
        } else if (!validatePhone(data.guestPhone)) {
          e.guestPhone = "格式錯誤：需為 09 開頭共 10 碼（例：0912345678）";
        }
        if (data.guestEmail && !validateEmail(data.guestEmail)) {
          e.guestEmail = "請輸入有效的電子郵件格式";
        }
      }

      // Block 3：收件資訊
      if (!data.recipientName.trim()) e.recipientName = "請輸入收件人姓名";

      if (!data.recipientPhone) {
        e.recipientPhone = "請輸入收件人電話";
      } else if (!validatePhone(data.recipientPhone)) {
        e.recipientPhone = "格式錯誤：需為 09 開頭共 10 碼（例：0912345678）";
      }

      if (!data.recipientEmail) {
        e.recipientEmail = "請輸入電子郵件";
      } else if (!validateEmail(data.recipientEmail)) {
        e.recipientEmail = "請輸入有效的電子郵件格式";
      }

      if (!data.shippingAddress.trim()) e.shippingAddress = "請輸入收件地址";

      // 發票驗證
      if (data.invoiceType === "company") {
        if (!data.companyTaxId) {
          e.companyTaxId = "請輸入統一編號";
        } else if (!validateTaxId(data.companyTaxId)) {
          e.companyTaxId = "統一編號必須為 8 碼數字";
        }
        if (!data.companyName.trim()) e.companyName = "請輸入發票抬頭（公司名稱）";
      }

      return e;
    },
    [isAuthenticated]
  );

  // 更新欄位並即時驗證
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched[key]) {
      const newErrors = validate(next);
      setErrors(newErrors);
    }
  };

  const handleBlur = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const newErrors = validate(form);
    setErrors(newErrors);
  };

  // ─── 計算是否可提交 ───────────────────────────────────────
  const currentErrors = validate(form);
  const isFormValid = Object.keys(currentErrors).length === 0;

  // ─── 訂單建立 ─────────────────────────────────────────────
  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      clearCart();
      toast.success("訂單建立成功，正在跳轉至付款頁面...");
      navigate(`/shop/payment/${data.orderNumber}`);
    },
    onError: (error) => {
      toast.error(error.message || "訂單建立失敗");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 觸碰所有欄位以顯示全部錯誤
    const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const finalErrors = validate(form);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      toast.error("請修正表單中的錯誤後再提交");
      return;
    }
    if (items.length === 0) {
      toast.error("購物車是空的");
      return;
    }

    setIsSubmitting(true);
    createOrder.mutate({
      recipientName: form.recipientName,
      recipientPhone: form.recipientPhone,
      recipientEmail: form.recipientEmail,
      shippingAddress: form.shippingAddress,
      note: form.note,
      paymentMethod: form.paymentMethod,
      invoiceType: form.invoiceType,
      companyTaxId: form.invoiceType === "company" ? form.companyTaxId : undefined,
      companyName: form.invoiceType === "company" ? form.companyName : undefined,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        selectedSpecs: item.selectedSpecs ?? {},
      })),
    });
  };

  // ─── 空購物車 ─────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <CorporateLayout>
        <section className="py-20 bg-gray-50 min-h-[60vh]">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">購物車是空的</h1>
              <Link href="/shop">
                <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
                  <ArrowLeft className="h-4 w-4" /> 前往購物
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </CorporateLayout>
    );
  }

  // ─── 主要渲染 ─────────────────────────────────────────────
  return (
    <CorporateLayout>
      {/* 頁首 */}
      <section className="py-10 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <div className="flex items-center gap-3">
            <Link href="/shop/cart">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-1 px-0">
                <ArrowLeft className="h-4 w-4" /> 購物車
              </Button>
            </Link>
            <ChevronRight className="h-4 w-4 text-white/40" />
            <span className="text-white font-semibold">結帳</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">確認訂單</h1>
          <p className="text-white/60 mt-1 text-sm">請依序填寫以下三個步驟完成結帳</p>
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="container">
          <form onSubmit={handleSubmit}>
            {/* ─── 漏斗主體（全寬垂直） ─────────────────────── */}
            <div className="max-w-3xl mx-auto space-y-6">

              {/* ══════════════════════════════════════════════
                  BLOCK 1：購物車內容
              ══════════════════════════════════════════════ */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-amber-500" />
                <CardContent className="p-6">
                  <StepHeader num={1} icon={ShoppingCart} title="購物車內容" />

                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${JSON.stringify(item.selectedSpecs)}`}
                        className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg shrink-0 bg-gray-100"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                          {item.selectedSpecs && Object.keys(item.selectedSpecs).length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {Object.entries(item.selectedSpecs)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">數量：{item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900 shrink-0">
                          NT$ {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 小計列 */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>商品小計</span>
                      <span>NT$ {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>運費</span>
                      <span>
                        {isSettingsLoading ? (
                          <span className="text-gray-400 animate-pulse">計算中…</span>
                        ) : shippingFee === 0 ? (
                          <span className="text-green-600 font-medium">免運費</span>
                        ) : (
                          `NT$ ${shippingFee.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    {!isSettingsLoading && totalPrice < freeShippingThreshold && (
                      <p className="text-xs text-amber-600">
                        再購 NT$ {(freeShippingThreshold - totalPrice).toLocaleString()} 即享免運費
                      </p>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-gray-900 text-base">
                      <span>訂單總計</span>
                      <span className="text-amber-700">
                        {isSettingsLoading ? "—" : `NT$ ${grandTotal.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════
                  BLOCK 2：會員專區
              ══════════════════════════════════════════════ */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-amber-500" />
                <CardContent className="p-6">
                  <StepHeader num={2} icon={User} title="會員與聯絡方式" />

                  {/* 快速登入按鈕列 */}
                  <div className="mb-6">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">快速登入</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* LINE 登入 */}
                      <a href="/api/oauth/line/start?redirect=/shop/checkout" className="block">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                          bg-[#06C755] hover:bg-[#05a847] text-white font-semibold text-sm
                          border-2 border-[#06C755] transition-colors"
                        title="LINE 快速登入"
                      >
                        {/* LINE SVG icon */}
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                         LINE 快速登入
                      </button>
                      </a>
                      {/* Google 登入 */}
                      <a href="/api/oauth/google/start?redirect=/shop/checkout" className="block">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                          bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm
                          border-2 border-gray-200 transition-colors shadow-sm"
                        title="Google 快速登入"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google 快速登入
                      </button>
                      </a>

                      {/* 一般會員登入 */}
                      {isAuthenticated ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                          bg-green-50 text-green-700 font-semibold text-sm
                          border-2 border-green-200">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          已登入：{user?.name ?? user?.email}
                        </div>
                      ) : (
                        <a href={getLoginUrl("/shop/checkout")} className="block">
                          <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                              bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm
                              border-2 border-amber-600 transition-colors"
                          >
                            <User className="h-5 w-5" />
                            一般會員登入
                          </button>
                        </a>
                      )}
                    </div>
                  </div>

                  <Separator className="my-5" />

                  {/* 訪客聯絡方式 */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                      {isAuthenticated ? "聯絡方式確認" : "訪客聯絡方式"}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guestEmail" className="flex items-center gap-1 mb-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          電子郵件
                        </Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={form.guestEmail}
                          onChange={(e) => setField("guestEmail", e.target.value)}
                          onBlur={() => handleBlur("guestEmail")}
                          className={errors.guestEmail && touched.guestEmail ? "border-red-400 focus-visible:ring-red-400" : ""}
                        />
                        {touched.guestEmail && <FieldError msg={errors.guestEmail} />}
                      </div>
                      <div>
                        <Label htmlFor="guestPhone" className="flex items-center gap-1 mb-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          手機號碼 {!isAuthenticated && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="guestPhone"
                          type="tel"
                          placeholder="09xxxxxxxx"
                          maxLength={10}
                          value={form.guestPhone}
                          onChange={(e) => setField("guestPhone", e.target.value)}
                          onBlur={() => handleBlur("guestPhone")}
                          className={errors.guestPhone && touched.guestPhone ? "border-red-400 focus-visible:ring-red-400" : ""}
                        />
                        {touched.guestPhone && <FieldError msg={errors.guestPhone} />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════
                  BLOCK 3：付款與運送方式
              ══════════════════════════════════════════════ */}
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-amber-500" />
                <CardContent className="p-6">
                  <StepHeader num={3} icon={Package} title="付款與運送方式" />

                  {/* 3-A 收件資訊 */}
                  <div className="mb-8">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">收件資訊</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* 收件人姓名 */}
                      <div>
                        <Label htmlFor="recipientName" className="mb-1.5 block">
                          收件人姓名 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="recipientName"
                          placeholder="請輸入真實姓名"
                          value={form.recipientName}
                          onChange={(e) => setField("recipientName", e.target.value)}
                          onBlur={() => handleBlur("recipientName")}
                          className={errors.recipientName && touched.recipientName ? "border-red-400 focus-visible:ring-red-400" : ""}
                        />
                        {touched.recipientName && <FieldError msg={errors.recipientName} />}
                      </div>

                      {/* 收件人電話 */}
                      <div>
                        <Label htmlFor="recipientPhone" className="mb-1.5 block">
                          收件人電話 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="recipientPhone"
                          type="tel"
                          placeholder="09xxxxxxxx"
                          maxLength={10}
                          value={form.recipientPhone}
                          onChange={(e) => setField("recipientPhone", e.target.value)}
                          onBlur={() => handleBlur("recipientPhone")}
                          className={errors.recipientPhone && touched.recipientPhone ? "border-red-400 focus-visible:ring-red-400" : ""}
                        />
                        {touched.recipientPhone && <FieldError msg={errors.recipientPhone} />}
                      </div>
                    </div>

                    {/* 電子郵件 */}
                    <div className="mt-4">
                      <Label htmlFor="recipientEmail" className="mb-1.5 block">
                        電子郵件 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={form.recipientEmail}
                        onChange={(e) => setField("recipientEmail", e.target.value)}
                        onBlur={() => handleBlur("recipientEmail")}
                        className={errors.recipientEmail && touched.recipientEmail ? "border-red-400 focus-visible:ring-red-400" : ""}
                      />
                      {touched.recipientEmail && <FieldError msg={errors.recipientEmail} />}
                    </div>

                    {/* 收件地址 */}
                    <div className="mt-4">
                      <Label htmlFor="shippingAddress" className="mb-1.5 block">
                        收件地址 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="shippingAddress"
                        placeholder="縣市 + 鄉鎮區 + 路街 + 號"
                        value={form.shippingAddress}
                        onChange={(e) => setField("shippingAddress", e.target.value)}
                        onBlur={() => handleBlur("shippingAddress")}
                        className={errors.shippingAddress && touched.shippingAddress ? "border-red-400 focus-visible:ring-red-400" : ""}
                      />
                      {touched.shippingAddress && <FieldError msg={errors.shippingAddress} />}
                    </div>

                    {/* 備註 */}
                    <div className="mt-4">
                      <Label htmlFor="note" className="mb-1.5 block text-gray-600">
                        訂單備註（選填）
                      </Label>
                      <Textarea
                        id="note"
                        rows={2}
                        placeholder="如有特殊需求請在此說明"
                        value={form.note}
                        onChange={(e) => setField("note", e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator className="mb-8" />

                  {/* 3-B 付款方式 */}
                  <div className="mb-8">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">付款方式</p>
                    <RadioGroup
                      value={form.paymentMethod}
                      onValueChange={(v) => setField("paymentMethod", v)}
                      className="space-y-2"
                    >
                      {[
                        { value: "credit_card", icon: CreditCard, label: "信用卡付款", desc: "Visa / Mastercard / JCB" },
                        { value: "atm", icon: Building, label: "ATM 轉帳", desc: "銀行轉帳，3 天內完成付款" },
                        { value: "cvs", icon: Store, label: "超商代碼繳費", desc: "7-11 / 全家 / 萊爾富 / OK" },
                      ].map(({ value, icon: Icon, label, desc }) => (
                        <label
                          key={value}
                          htmlFor={value}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors
                            ${form.paymentMethod === value
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"}`}
                        >
                          <RadioGroupItem value={value} id={value} className="shrink-0" />
                          <Icon className={`h-5 w-5 shrink-0 ${form.paymentMethod === value ? "text-amber-600" : "text-gray-400"}`} />
                          <div>
                            <p className={`font-medium text-sm ${form.paymentMethod === value ? "text-amber-800" : "text-gray-800"}`}>
                              {label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator className="mb-8" />

                  {/* 3-C 發票資訊 */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      發票資訊
                    </p>
                    <RadioGroup
                      value={form.invoiceType}
                      onValueChange={(v) => setField("invoiceType", v as "personal" | "company")}
                      className="space-y-2"
                    >
                      <label
                        htmlFor="personal"
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors
                          ${form.invoiceType === "personal"
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"}`}
                      >
                        <RadioGroupItem value="personal" id="personal" className="shrink-0" />
                        <div>
                          <p className={`font-medium text-sm ${form.invoiceType === "personal" ? "text-amber-800" : "text-gray-800"}`}>
                            個人電子發票
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">系統自動開立雲端發票</p>
                        </div>
                      </label>

                      <label
                        htmlFor="company"
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors
                          ${form.invoiceType === "company"
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"}`}
                      >
                        <RadioGroupItem value="company" id="company" className="shrink-0" />
                        <div>
                          <p className={`font-medium text-sm ${form.invoiceType === "company" ? "text-amber-800" : "text-gray-800"}`}>
                            公司統編
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">開立三聯式發票，需填寫統一編號</p>
                        </div>
                      </label>
                    </RadioGroup>

                    {/* 統編展開區 */}
                    {form.invoiceType === "company" && (
                      <div className="mt-4 p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
                        <p className="text-xs font-medium text-amber-700">請填寫公司發票資訊</p>
                        <div>
                          <Label htmlFor="companyTaxId" className="mb-1.5 block">
                            統一編號 <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">（8 碼數字）</span>
                          </Label>
                          <Input
                            id="companyTaxId"
                            placeholder="12345678"
                            maxLength={8}
                            value={form.companyTaxId}
                            onChange={(e) => setField("companyTaxId", e.target.value.replace(/\D/g, ""))}
                            onBlur={() => handleBlur("companyTaxId")}
                            className={errors.companyTaxId && touched.companyTaxId ? "border-red-400 focus-visible:ring-red-400 bg-white" : "bg-white"}
                          />
                          {touched.companyTaxId && <FieldError msg={errors.companyTaxId} />}
                        </div>
                        <div>
                          <Label htmlFor="companyName" className="mb-1.5 block">
                            發票抬頭（公司名稱）<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="companyName"
                            placeholder="請輸入公司全名"
                            value={form.companyName}
                            onChange={(e) => setField("companyName", e.target.value)}
                            onBlur={() => handleBlur("companyName")}
                            className={errors.companyName && touched.companyName ? "border-red-400 focus-visible:ring-red-400 bg-white" : "bg-white"}
                          />
                          {touched.companyName && <FieldError msg={errors.companyName} />}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ══════════════════════════════════════════════
                  底部：確認付款按鈕
              ══════════════════════════════════════════════ */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                {/* 訂單金額摘要 */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">訂單總計</span>
                  <span className="text-2xl font-bold text-amber-700">
                    {isSettingsLoading ? "—" : `NT$ ${grandTotal.toLocaleString()}`}
                  </span>
                </div>

                {/* 驗證失敗提示 */}
                {!isFormValid && Object.keys(touched).length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">請修正上方表單中的錯誤後再提交</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                  disabled={isSubmitting || !isFormValid || isSettingsLoading}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      處理中…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      確認付款
                    </span>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  點擊確認付款即代表您同意本站服務條款及隱私政策
                </p>
              </div>

            </div>
          </form>
        </div>
      </section>
    </CorporateLayout>
  );
}

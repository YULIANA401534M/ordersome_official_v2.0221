"use client";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Building, Store, LineChart, Mail, Phone, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

// 驗證函式
const validatePhone = (phone: string): boolean => /^09\d{8}$/.test(phone);
const validateTaxId = (taxId: string): boolean => /^\d{8}$/.test(taxId);

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, clearCart } = useCartStore();
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { data: storeSettings, isLoading: isSettingsLoading } = trpc.storeSettings.get.useQuery();
  const baseShippingFee = storeSettings?.baseShippingFee ?? 100;
  const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 1000;
  const shippingFee = totalPrice >= freeShippingThreshold ? 0 : baseShippingFee;
  const grandTotal = totalPrice + shippingFee;

  const [formData, setFormData] = useState({
    // Step 1: Cart (read-only)
    // Step 2: Member & Contact
    guestEmail: user?.email || "",
    guestPhone: "",
    // Step 3: Shipping & Payment
    recipientName: user?.name || "",
    recipientPhone: "",
    recipientEmail: user?.email || "",
    shippingAddress: "",
    note: "",
    paymentMethod: "credit_card",
    // Invoice
    invoiceType: "personal", // "personal" or "company"
    companyTaxId: "",
    companyName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Step 2 驗證
    if (!formData.guestPhone && !isAuthenticated) {
      newErrors.guestPhone = "請輸入聯絡電話";
    } else if (formData.guestPhone && !validatePhone(formData.guestPhone)) {
      newErrors.guestPhone = "請輸入有效的台灣手機號碼（09 開頭，共 10 碼）";
    }

    // Step 3 驗證
    if (!formData.recipientName) {
      newErrors.recipientName = "請輸入收件人姓名";
    }
    if (!formData.recipientPhone) {
      newErrors.recipientPhone = "請輸入收件人電話";
    } else if (!validatePhone(formData.recipientPhone)) {
      newErrors.recipientPhone = "請輸入有效的台灣手機號碼（09 開頭，共 10 碼）";
    }
    if (!formData.recipientEmail) {
      newErrors.recipientEmail = "請輸入收件人電子郵件";
    }
    if (!formData.shippingAddress) {
      newErrors.shippingAddress = "請輸入收件地址";
    }

    // 發票驗證
    if (formData.invoiceType === "company") {
      if (!formData.companyTaxId) {
        newErrors.companyTaxId = "請輸入統一編號";
      } else if (!validateTaxId(formData.companyTaxId)) {
        newErrors.companyTaxId = "統一編號必須為 8 碼數字";
      }
      if (!formData.companyName) {
        newErrors.companyName = "請輸入公司名稱";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("請修正表單中的錯誤");
      return;
    }
    if (items.length === 0) {
      toast.error("購物車是空的");
      return;
    }

    setIsSubmitting(true);
    createOrder.mutate({
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      recipientEmail: formData.recipientEmail,
      shippingAddress: formData.shippingAddress,
      note: formData.note,
      paymentMethod: formData.paymentMethod,
      invoiceType: formData.invoiceType as 'personal' | 'company',
      companyTaxId: formData.invoiceType === "company" ? formData.companyTaxId : undefined,
      companyName: formData.invoiceType === "company" ? formData.companyName : undefined,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        selectedSpecs: item.selectedSpecs || {},
      })),
    });
  };

  if (!isAuthenticated) {
    return (
      <CorporateLayout>
        <section className="py-20 bg-gray-50 min-h-[60vh]">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">請先登入</h1>
              <p className="text-gray-600 mb-6">您需要登入才能進行結帳</p>
              <a href={getLoginUrl()}>
                <Button className="bg-amber-600 hover:bg-amber-700">登入 / 註冊</Button>
              </a>
            </div>
          </div>
        </section>
      </CorporateLayout>
    );
  }

  if (items.length === 0) {
    return (
      <CorporateLayout>
        <section className="py-20 bg-gray-50 min-h-[60vh]">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
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

  const isFormValid = Object.keys(errors).length === 0 && formData.recipientName && formData.recipientPhone && formData.recipientEmail && formData.shippingAddress;

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold">結帳</h1>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Step 1: 購物車內容 */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <h2 className="text-xl font-bold text-gray-900">購物車內容</h2>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={`${item.id}-${JSON.stringify(item.selectedSpecs)}`} className="flex justify-between items-start pb-3 border-b last:border-b-0">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            {item.selectedSpecs && Object.entries(item.selectedSpecs).length > 0 && (
                              <p className="text-sm text-gray-500">
                                {Object.entries(item.selectedSpecs).map(([key, value]) => `${key}: ${value}`).join(" / ")}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">數量: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">NT$ {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: 會員專區 */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <h2 className="text-xl font-bold text-gray-900">會員與聯絡方式</h2>
                    </div>

                    {/* 快速登入按鈕 (UI 預留) */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3">快速登入選項（預留）</p>
                      <div className="flex gap-3 flex-wrap">
                        <Button variant="outline" className="flex-1 gap-2 opacity-50 cursor-not-allowed" disabled>
                          <LineChart className="h-4 w-4" />
                          LINE 登入
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 opacity-50 cursor-not-allowed" disabled>
                          <Mail className="h-4 w-4" />
                          Google 登入
                        </Button>
                      </div>
                    </div>

                    {/* 非會員聯絡方式 */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="guestEmail">聯絡信箱 *</Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          value={formData.guestEmail}
                          onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestPhone">聯絡電話 *</Label>
                        <Input
                          id="guestPhone"
                          placeholder="09xxxxxxxx"
                          value={formData.guestPhone}
                          onChange={(e) => {
                            setFormData({ ...formData, guestPhone: e.target.value });
                            if (errors.guestPhone) {
                              setErrors({ ...errors, guestPhone: "" });
                            }
                          }}
                        />
                        {errors.guestPhone && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" /> {errors.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: 付款與運送方式 */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <h2 className="text-xl font-bold text-gray-900">付款與運送方式</h2>
                    </div>

                    {/* 收件資訊 */}
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-semibold text-gray-900 mb-4">收件資訊</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="recipientName">收件人姓名 *</Label>
                          <Input
                            id="recipientName"
                            value={formData.recipientName}
                            onChange={(e) => {
                              setFormData({ ...formData, recipientName: e.target.value });
                              if (errors.recipientName) {
                                setErrors({ ...errors, recipientName: "" });
                              }
                            }}
                          />
                          {errors.recipientName && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" /> {errors.recipientName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="recipientPhone">聯絡電話 *</Label>
                          <Input
                            id="recipientPhone"
                            placeholder="09xxxxxxxx"
                            value={formData.recipientPhone}
                            onChange={(e) => {
                              setFormData({ ...formData, recipientPhone: e.target.value });
                              if (errors.recipientPhone) {
                                setErrors({ ...errors, recipientPhone: "" });
                              }
                            }}
                          />
                          {errors.recipientPhone && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" /> {errors.recipientPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="recipientEmail">電子郵件 *</Label>
                        <Input
                          id="recipientEmail"
                          type="email"
                          value={formData.recipientEmail}
                          onChange={(e) => {
                            setFormData({ ...formData, recipientEmail: e.target.value });
                            if (errors.recipientEmail) {
                              setErrors({ ...errors, recipientEmail: "" });
                            }
                          }}
                        />
                        {errors.recipientEmail && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" /> {errors.recipientEmail}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="shippingAddress">收件地址 *</Label>
                        <Input
                          id="shippingAddress"
                          value={formData.shippingAddress}
                          onChange={(e) => {
                            setFormData({ ...formData, shippingAddress: e.target.value });
                            if (errors.shippingAddress) {
                              setErrors({ ...errors, shippingAddress: "" });
                            }
                          }}
                        />
                        {errors.shippingAddress && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" /> {errors.shippingAddress}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="note">備註</Label>
                        <Textarea
                          id="note"
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                          placeholder="如有特殊需求請在此說明"
                        />
                      </div>
                    </div>

                    {/* 付款方式 */}
                    <div className="mb-6 pb-6 border-b">
                      <h3 className="font-semibold text-gray-900 mb-4">付款方式</h3>
                      <RadioGroup value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="credit_card" id="credit_card" />
                          <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer flex-1">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                            信用卡付款
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 mt-2">
                          <RadioGroupItem value="atm" id="atm" />
                          <Label htmlFor="atm" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Building className="h-5 w-5 text-gray-600" />
                            ATM 轉帳
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 mt-2">
                          <RadioGroupItem value="cvs" id="cvs" />
                          <Label htmlFor="cvs" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Store className="h-5 w-5 text-gray-600" />
                            超商代碼繳費
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 發票資訊 */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        發票資訊
                      </h3>
                      <RadioGroup value={formData.invoiceType} onValueChange={(value) => setFormData({ ...formData, invoiceType: value as "personal" | "company" })}>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="personal" id="personal" />
                          <Label htmlFor="personal" className="cursor-pointer flex-1">
                            個人電子發票
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 mt-2">
                          <RadioGroupItem value="company" id="company" />
                          <Label htmlFor="company" className="cursor-pointer flex-1">
                            公司統編
                          </Label>
                        </div>
                      </RadioGroup>

                      {formData.invoiceType === "company" && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                          <div>
                            <Label htmlFor="companyTaxId">統一編號 *</Label>
                            <Input
                              id="companyTaxId"
                              placeholder="8 碼數字"
                              value={formData.companyTaxId}
                              onChange={(e) => {
                                setFormData({ ...formData, companyTaxId: e.target.value });
                                if (errors.companyTaxId) {
                                  setErrors({ ...errors, companyTaxId: "" });
                                }
                              }}
                            />
                            {errors.companyTaxId && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" /> {errors.companyTaxId}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="companyName">公司名稱 *</Label>
                            <Input
                              id="companyName"
                              value={formData.companyName}
                              onChange={(e) => {
                                setFormData({ ...formData, companyName: e.target.value });
                                if (errors.companyName) {
                                  setErrors({ ...errors, companyName: "" });
                                }
                              }}
                            />
                            {errors.companyName && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" /> {errors.companyName}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 訂單摘要 (右側) */}
              <div>
                <Card className="border-0 shadow-lg sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">訂單摘要</h2>
                    <div className="space-y-3 mb-4">
                      {items.map((item) => (
                        <div key={`${item.id}-${JSON.stringify(item.selectedSpecs)}`} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} x {item.quantity}</span>
                          <span>NT$ {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>商品小計</span>
                        <span>NT$ {totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>運費</span>
                        <span>
                          {isSettingsLoading
                            ? <span className="text-gray-400 animate-pulse">計算中...</span>
                            : shippingFee === 0 ? "免運費" : `NT$ ${shippingFee.toLocaleString()}`}
                        </span>
                      </div>
                      {!isSettingsLoading && totalPrice < freeShippingThreshold && (
                        <p className="text-xs text-gray-400">滿 NT$ {freeShippingThreshold.toLocaleString()} 免運費</p>
                      )}
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                        <span>總計</span>
                        <span>{isSettingsLoading ? "—" : `NT$ ${grandTotal.toLocaleString()}`}</span>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 mt-6"
                      size="lg"
                      disabled={isSubmitting || !isFormValid || isSettingsLoading}
                    >
                      {isSubmitting ? "處理中..." : "確認付款"}
                    </Button>
                    <Link href="/shop/cart">
                      <Button variant="outline" className="w-full mt-2 gap-2">
                        <ArrowLeft className="h-4 w-4" /> 返回購物車
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </section>
    </CorporateLayout>
  );
}

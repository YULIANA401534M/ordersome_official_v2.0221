import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Building, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { items, clearCart } = useCartStore();
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = totalPrice >= 1000 ? 0 : 100;
  const grandTotal = totalPrice + shippingFee;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    note: "",
    paymentMethod: "credit_card",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      clearCart();
      toast.success("訂單建立成功，正在跳轉至付款頁面...");
      // Redirect to payment page
      navigate(`/shop/payment/${data.orderNumber}`);
    },
    onError: (error) => {
      toast.error(error.message || "訂單建立失敗");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("請先登入");
      return;
    }
    if (items.length === 0) {
      toast.error("購物車是空的");
      return;
    }
    setIsSubmitting(true);
    createOrder.mutate({
      recipientName: formData.name,
      recipientPhone: formData.phone,
      recipientEmail: formData.email,
      shippingAddress: formData.address,
      note: formData.note,
      paymentMethod: formData.paymentMethod,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
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
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">收件資訊</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>收件人姓名 *</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div>
                        <Label>聯絡電話 *</Label>
                        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>電子郵件 *</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="mt-4">
                      <Label>收件地址 *</Label>
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                    </div>
                    <div className="mt-4">
                      <Label>備註</Label>
                      <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="如有特殊需求請在此說明" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">付款方式</h2>
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
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border-0 shadow-lg sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">訂單摘要</h2>
                    <div className="space-y-3 mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} x {item.quantity}</span>
                          <span>NT$ {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>商品小計</span>
                        <span>NT$ {totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>運費</span>
                        <span>{shippingFee === 0 ? "免運費" : `NT$ ${shippingFee}`}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                        <span>總計</span>
                        <span>NT$ {grandTotal}</span>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 mt-6" size="lg" disabled={isSubmitting}>
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

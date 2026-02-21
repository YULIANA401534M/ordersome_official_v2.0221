import { Link } from "wouter";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { useCartStore } from "@/stores/cartStore";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold">購物車</h1>
        </div>
      </section>

      <section className="py-12 bg-gray-50 min-h-[60vh]">
        <div className="container">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">購物車是空的</p>
              <Link href="/shop">
                <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
                  <ArrowLeft className="h-4 w-4" /> 繼續購物
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <img src="/images/corporate-logo.png" alt="" className="w-12 h-12 opacity-20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{item.name}</h3>
                          <p className="text-amber-600 font-bold">NT$ {item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                          <p className="font-bold text-gray-900">NT$ {item.price * item.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-between">
                  <Link href="/shop">
                    <Button variant="outline" className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> 繼續購物
                    </Button>
                  </Link>
                  <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={clearCart}>
                    清空購物車
                  </Button>
                </div>
              </div>

              <div>
                <Card className="border-0 shadow-lg sticky top-4">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">訂單摘要</h2>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>商品小計</span>
                        <span>NT$ {totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>運費</span>
                        <span>{totalPrice >= 1000 ? "免運費" : "NT$ 100"}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>總計</span>
                          <span>NT$ {totalPrice >= 1000 ? totalPrice : totalPrice + 100}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">滿 NT$ 1,000 免運費</p>
                    <Link href="/shop/checkout">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                        前往結帳
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>
    </CorporateLayout>
  );
}

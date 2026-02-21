import { useState } from "react";
import { useParams, Link } from "wouter";
import { ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = trpc.product.getById.useQuery({ id: parseInt(id || "0") });
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ id: product.id, name: product.name, price: parseFloat(product.price), imageUrl: product.imageUrl, quantity });
    toast.success("已加入購物車");
  };

  if (isLoading) {
    return <CorporateLayout><div className="container py-20 text-center">載入中...</div></CorporateLayout>;
  }

  if (!product) {
    return <CorporateLayout><div className="container py-20 text-center">找不到商品</div></CorporateLayout>;
  }

  return (
    <CorporateLayout>
      <section className="py-12 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <Link href="/shop"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />返回商城</Button></Link>
            <Link href="/shop/cart">
              <Button variant="outline" className="gap-2"><ShoppingCart className="h-5 w-5" />{totalCartItems > 0 && <Badge className="bg-amber-600">{totalCartItems}</Badge>}</Button>
            </Link>
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-3xl font-bold text-amber-600 mb-6">NT$ {product.price}</p>
              {product.originalPrice && <p className="text-gray-400 line-through mb-4">原價 NT$ {product.originalPrice}</p>}
              <p className="text-gray-600 mb-8">{product.description}</p>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-700">數量：</span>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <Button size="lg" className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleAddToCart}>加入購物車</Button>
            </div>
          </div>
        </div>
      </section>
    </CorporateLayout>
  );
}

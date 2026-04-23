import { useState, useEffect } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import { Link } from "wouter";
import { ShoppingCart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ShopHome() {
  const { user } = useAuth();

  // Show welcome toast when redirected after login/register
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1") {
      const name = user?.name || "會員";
      toast.success(`歡迎加入來點什麼，${name} 🎉`, {
        description: "登入成功，開始選購吧！",
        duration: 4000,
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user]);

  useEffect(() => {
    document.title = "來點什麼 線上商城｜獨家特製辣椒醬、人氣周邊商品室配";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "來點什麼官方商城。在家也能享受獨門風味！立即選購招版特製辣椒醬、品牌周邊，全台快速室配到府。"
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "來點什麼辣椒醬, 特製辣椒醬, 團購美食, 室配美食, 早午餐周邊"
    );

    // ItemList Schema
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "來點什麼線上商城商品",
      "description": "來點什麼特製辣椒醬、品牌周邊及美食團購",
      "url": "https://ordersome.com.tw/shop",
      "itemListElement": []
    };
    const cleanup = injectSchema("item-list", itemListSchema);
    return cleanup;
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { data: categories } = trpc.category.list.useQuery();
  const { data: products, isLoading } = trpc.product.list.useQuery();
  const { data: salesStats } = trpc.product.salesStats.useQuery();
  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const filteredProducts = selectedCategory
    ? products?.filter((p) => p.categoryId === selectedCategory)
    : products;

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
      quantity: 1,
      stock: product.stock ?? 99,
    });
    toast.success(`已將 ${product.name} 加入購物車`);
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">來點什麼 線上商城</h1>
              <p className="text-gray-300">獨家特製辣椒醬、人氣周邊商品室配到府</p>
            </div>
            <Link href="/shop/cart">
              <Button
                variant="ghost"
                className="gap-2 border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <ShoppingCart className="h-5 w-5" />
                購物車
                {totalCartItems > 0 && (
                  <Badge className="bg-amber-600 text-white ml-1">{totalCartItems}</Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container">
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              全部商品
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200" />
                  <CardContent className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow group">
                  <Link href={`/shop/product/${product.id}`}>
                    <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img src="/logos/corporate-logo.png" alt="" className="w-20 h-20 opacity-20" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/shop/product/${product.id}`}>
                      <h3 className="font-bold text-gray-900 mb-1 hover:text-amber-600 transition-colors">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                    {(() => {
                      const realSales = salesStats?.[product.id] ?? 0;
                      const displayed = realSales + ((product as any).salesCountOffset ?? 0);
                      return displayed > 0 ? (
                        <p className="text-xs text-gray-400 mb-2">🔥 已有 <span className="font-semibold text-gray-600">{displayed.toLocaleString()}</span> 人付款</p>
                      ) : null;
                    })()}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-amber-600">NT$ {product.price}</p>
                      <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-amber-600 hover:bg-amber-700">
                        加入購物車
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">目前沒有商品</p>
              <p className="text-gray-400">商品即將上架，敬請期待</p>
            </div>
          )}
        </div>
      </section>
    </CorporateLayout>
  );
}

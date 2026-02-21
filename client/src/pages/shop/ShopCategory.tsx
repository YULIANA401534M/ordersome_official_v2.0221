import { useParams, Link } from "wouter";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

export default function ShopCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { data: category } = trpc.category.getBySlug.useQuery({ slug: slug || "" });
  const { data: products, isLoading } = trpc.product.list.useQuery();
  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products?.filter((p) => p.categoryId === category?.id);

  const handleAddToCart = (product: any) => {
    addToCart({ id: product.id, name: product.name, price: parseFloat(product.price), imageUrl: product.imageUrl, quantity: 1 });
    toast.success("已加入購物車");
  };

  return (
    <CorporateLayout>
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">{category?.name || "商品分類"}</h1>
            <p className="text-gray-300">{category?.description}</p>
          </div>
          <Link href="/shop/cart">
            <Button variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
              <ShoppingCart className="h-5 w-5" />
              {totalCartItems > 0 && <Badge className="bg-amber-600">{totalCartItems}</Badge>}
            </Button>
          </Link>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="container">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <Card key={i} className="animate-pulse"><div className="aspect-square bg-gray-200" /></Card>)}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow group">
                  <Link href={"/shop/product/" + product.id}>
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-amber-600">NT$ {product.price}</p>
                      <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-amber-600 hover:bg-amber-700">加入購物車</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">此分類目前沒有商品</div>
          )}
        </div>
      </section>
    </CorporateLayout>
  );
}

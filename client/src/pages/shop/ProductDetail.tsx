import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Minus, Plus, ShoppingCart, Truck, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: product, isLoading } = trpc.product.getById.useQuery({ id: parseInt(id || "0") });

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [specError, setSpecError] = useState(false);

  const addToCart = useCartStore((state) => state.addItem);

  // Parse images array
  const images = useMemo(() => {
    if (!product) return [];
    try {
      const parsed = JSON.parse(product.images || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    } catch { /* ignore */ }
    return product.imageUrl ? [product.imageUrl] : [];
  }, [product]);

  // Parse specifications JSON
  const specifications = useMemo(() => {
    if (!product?.specifications) return {} as Record<string, string[]>;
    try { return JSON.parse(product.specifications) as Record<string, string[]>; }
    catch { return {}; }
  }, [product]);

  const specKeys = Object.keys(specifications);
  const allSpecsSelected = specKeys.length === 0 || specKeys.every((k) => selectedSpecs[k]);

  const handleSpecSelect = (key: string, value: string) => {
    setSelectedSpecs((prev) => ({ ...prev, [key]: value }));
    setSpecError(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!allSpecsSelected) { setSpecError(true); return; }
    addToCart({
      id: product.id, name: product.name,
      price: parseFloat(product.price),
      imageUrl: images[0] ?? product.imageUrl,
      quantity,
      selectedSpecs: specKeys.length > 0 ? selectedSpecs : undefined,
    });
    toast.success("已加入購物車");
    setSpecError(false);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!allSpecsSelected) { setSpecError(true); return; }
    addToCart({
      id: product.id, name: product.name,
      price: parseFloat(product.price),
      imageUrl: images[0] ?? product.imageUrl,
      quantity,
      selectedSpecs: specKeys.length > 0 ? selectedSpecs : undefined,
    });
    navigate("/shop/cart");
  };

  if (isLoading) {
    return <CorporateLayout><div className="container py-20 text-center text-gray-500">載入中...</div></CorporateLayout>;
  }
  if (!product) {
    return <CorporateLayout><div className="container py-20 text-center text-gray-500">找不到商品</div></CorporateLayout>;
  }

  const price = parseFloat(product.price);
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const discountPercent = originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : null;

  return (
    <CorporateLayout>
      <div className="container py-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
          <a href="/shop" className="hover:text-amber-600 transition-colors">商城</a>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Top Two-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* LEFT: Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {images.length > 0 ? (
                <img src={images[activeImageIndex]} alt={product.name} className="w-full h-full object-cover transition-all duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><Package className="h-16 w-16" /></div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex ? "border-amber-500 ring-2 ring-amber-200" : "border-gray-200 hover:border-amber-300"
                    }`}>
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Purchase Decision Area */}
          <div className="flex flex-col gap-5">
            <div>
              {!product.isActive && <Badge variant="outline" className="mb-2 text-gray-500 border-gray-300">已下架</Badge>}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-amber-600">NT$ {price.toLocaleString()}</span>
              {originalPrice && originalPrice > price && (
                <>
                  <span className="text-lg text-gray-400 line-through">NT$ {originalPrice.toLocaleString()}</span>
                  <Badge className="bg-red-100 text-red-600 border-red-200 font-semibold">-{discountPercent}%</Badge>
                </>
              )}
            </div>

            {/* Specification Selector */}
            {specKeys.length > 0 && (
              <div className="space-y-4">
                {specKeys.map((key) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {key}
                      {!selectedSpecs[key] && <span className="text-gray-400 font-normal ml-1">（請選擇）</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {specifications[key].map((val) => (
                        <button key={val} onClick={() => handleSpecSelect(key, val)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedSpecs[key] === val
                              ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-400"
                              : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50"
                          }`}>
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {specError && <p className="text-red-500 text-sm font-medium">請先選擇所有規格，再加入購物車</p>}
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">數量</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
                {product.stock !== null && product.stock !== undefined && (
                  <span className={`text-sm ml-2 ${product.stock <= 10 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    庫存 {product.stock} 件
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mt-2">
              <Button variant="outline" className="flex-1 h-12 border-amber-500 text-amber-600 hover:bg-amber-50"
                onClick={handleAddToCart} disabled={!product.isActive}>
                <ShoppingCart className="h-4 w-4 mr-2" />加入購物車
              </Button>
              <Button className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                onClick={handleBuyNow} disabled={!product.isActive}>
                立即購買
              </Button>
            </div>
            {!product.isActive && <p className="text-center text-gray-500 text-sm">此商品目前已下架</p>}

            {/* Shipping Info */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-500" />
                <span>消費滿 NT$1,000 免運費，未滿酌收 NT$100</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Tab Section ── */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="border-b border-gray-200 bg-transparent w-full justify-start rounded-none h-auto p-0 gap-0">
            <TabsTrigger value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 px-6 py-3 text-gray-600 font-medium bg-transparent">
              商品介紹
            </TabsTrigger>
            <TabsTrigger value="specs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 px-6 py-3 text-gray-600 font-medium bg-transparent">
              規格說明
            </TabsTrigger>
            <TabsTrigger value="shipping"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 px-6 py-3 text-gray-600 font-medium bg-transparent">
              運送方式
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            {product.description ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{product.description}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">尚無商品介紹</p>
            )}
          </TabsContent>

          <TabsContent value="specs" className="mt-6">
            {specKeys.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <tbody>
                    {specKeys.map((key, idx) => (
                      <tr key={key} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-5 py-3 font-semibold text-gray-700 w-1/4 border-r border-gray-200">{key}</td>
                        <td className="px-5 py-3 text-gray-600">{specifications[key].join("、")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">無規格資料</p>
            )}
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <Truck className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">宅配到府</p>
                  <p>消費滿 NT$1,000 免運費，未滿酌收 NT$100 運費。預計 3-5 個工作天到貨。</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Package className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">門市自取</p>
                  <p>可至各門市自取，無需運費。請於結帳備註欄填寫自取門市。</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CorporateLayout>
  );
}

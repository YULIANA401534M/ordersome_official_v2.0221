import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCartStore } from "@/stores/cartStore";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * B2B 封閉式賣場 - 專屬商品頁面
 * 路由: /exclusive/:slug
 * 
 * 特性:
 * - 隱藏 Navbar 與 Footer（獨立全螢幕頁面）
 * - 100% 寬度渲染一頁式長圖
 * - 底部固定操作列（福委價 + 立即購買按鈕）
 * - noindex, nofollow 防止搜尋引擎收錄
 */
export default function ExclusiveProduct() {
  const [, params] = useRoute("/exclusive/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const { data: product, isLoading, error } = trpc.product.getByExclusiveSlug.useQuery(
    { exclusiveSlug: slug },
    { enabled: !!slug }
  );

  const addItem = useCartStore((state) => state.addItem);

  // 注入 noindex, nofollow meta tag
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    if (existing) {
      existing.setAttribute("content", "noindex, nofollow");
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, nofollow";
      document.head.appendChild(meta);
    }
    return () => {
      const meta = document.querySelector('meta[name="robots"][content="noindex, nofollow"]');
      if (meta) meta.remove();
    };
  }, []);

  // 更新頁面標題
  useEffect(() => {
    if (product) {
      document.title = `${product.name} - 專屬優惠`;
    }
    return () => { document.title = "來點什麼"; };
  }, [product]);

  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      quantity: 1,
      stock: product.stock,
    });
    toast.success("已加入購物車");
    navigate(`/shop/checkout?source=${slug}`);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // ── Not Found ──
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-3">找不到此商品</h1>
          <p className="text-gray-400 mb-6">此專屬連結可能已失效或商品已下架</p>
          <Button onClick={() => navigate("/shop")} variant="outline">
            前往商城
          </Button>
        </div>
      </div>
    );
  }

  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* 一頁式長圖 - Mobile 全寬 / Desktop 最大 768px 置中 */}
      <div className="flex-1 w-full flex justify-center">
        <div className="w-full max-w-[768px]">
          {product.exclusiveImageUrl ? (
            <img
              src={product.exclusiveImageUrl}
              alt={product.name}
              className="w-full h-auto block"
              loading="eager"
            />
          ) : (
            /* 如果沒有一頁式長圖，顯示商品基本資訊 */
            <div className="px-4 py-12">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full rounded-2xl shadow-lg mb-8"
                />
              )}
              <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
              {product.description && (
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部固定操作列 - 與圖片容器同寬置中 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-[768px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* 價格區 */}
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-xs text-gray-400">福委價</span>
            <span className="text-2xl font-bold text-red-600">
              NT$ {price.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                NT$ {originalPrice.toLocaleString()}
              </span>
            )}
            {discount && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>

          {/* 購買按鈕 */}
          <Button
            onClick={handleBuyNow}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 text-base rounded-full shadow-lg shrink-0"
            disabled={product.stock <= 0}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {product.stock <= 0 ? "已售完" : "立即購買"}
          </Button>
        </div>
      </div>

      {/* 底部 padding 避免內容被操作列遮擋 */}
      <div className="h-20" />
    </div>
  );
}

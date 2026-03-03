import { useEffect } from "react";
import { injectSchema } from "./schemaUtils";

const BASE_URL = "https://ordersome.com.tw";

interface ProductData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  originalPrice?: string | null;
  imageUrl?: string | null;
  images?: string | null; // JSON array of image URLs
  stock: number;
  isActive: boolean;
}

/**
 * useProductSchema Hook
 * 動態生成 Product Schema JSON-LD，符合 Google Product Rich Results 規範
 * 使用 useEffect 確保僅在客戶端執行，避免 hydration error
 *
 * 參考：https://developers.google.com/search/docs/appearance/structured-data/product
 */
export function useProductSchema(product: ProductData | undefined | null) {
  useEffect(() => {
    if (!product) return;

    // 解析商品圖片陣列
    let imageList: string[] = [];
    try {
      const parsed = JSON.parse(product.images || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        imageList = parsed as string[];
      }
    } catch {
      // ignore parse error
    }
    if (imageList.length === 0 && product.imageUrl) {
      imageList = [product.imageUrl];
    }

    const price = parseFloat(product.price);
    const originalPrice = product.originalPrice
      ? parseFloat(product.originalPrice)
      : null;

    // 庫存狀態：依 stock 欄位與 isActive 決定
    const availability =
      product.isActive && product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    // 建立 Offer 物件
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      url: `${BASE_URL}/shop/product/${product.slug || product.id}`,
      priceCurrency: "TWD",
      price: price.toFixed(0),
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      )
        .toISOString()
        .split("T")[0],
      availability,
      seller: {
        "@type": "Organization",
        name: "來點什麼 Ordersome",
        url: BASE_URL,
      },
    };

    // 若有原價，加入 highPrice（促銷商品）
    if (originalPrice && originalPrice > price) {
      offer["@type"] = "AggregateOffer";
      offer["lowPrice"] = price.toFixed(0);
      offer["highPrice"] = originalPrice.toFixed(0);
      offer["offerCount"] = 1;
    }

    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${BASE_URL}/shop/product/${product.slug || product.id}`,
      name: product.name,
      description:
        product.description ||
        `來點什麼 Ordersome 精選商品 - ${product.name}`,
      url: `${BASE_URL}/shop/product/${product.slug || product.id}`,
      sku: String(product.id),
      brand: {
        "@type": "Brand",
        name: "來點什麼 Ordersome",
      },
      offers: offer,
    };

    // 加入圖片（Google 要求至少一張）
    if (imageList.length === 1) {
      schema["image"] = imageList[0];
    } else if (imageList.length > 1) {
      schema["image"] = imageList;
    }

    const cleanup = injectSchema("product", schema);
    return cleanup;
  }, [product]);
}

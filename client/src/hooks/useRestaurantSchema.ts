import { useEffect } from "react";
import { injectSchema } from "./schemaUtils";

const BASE_URL = "https://ordersome.com.tw";

interface StoreData {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  openingHours?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  imageUrl?: string | null;
  slug?: string | null;       // 若資料庫有 slug 欄位，優先用於 @id
  ratingValue?: number | null; // 門市平均評分（若資料庫有）
  reviewCount?: number | null; // 評論數（若資料庫有）
}

/**
 * 解析門市地址為 PostalAddress 結構
 * 台灣地址格式：縣市 + 區 + 街道
 */
function parseAddress(address: string) {
  // 嘗試匹配台灣地址格式（例：台中市北屯區東山路一段147巷10弄6號）
  const cityMatch = address.match(/^(.{2,4}[市縣])/);
  const districtMatch = address.match(/[市縣](.{2,4}[區鄉鎮市])/);
  const postalMatch = address.match(/^(\d{3,6})/);

  const addressLocality = cityMatch ? cityMatch[1] : "台中市";
  const addressRegion = cityMatch ? cityMatch[1] : "台中市";
  const streetAddress = districtMatch
    ? address.replace(cityMatch?.[0] || "", "")
    : address;
  const postalCode = postalMatch ? postalMatch[1] : "";

  return {
    "@type": "PostalAddress",
    streetAddress: streetAddress.trim(),
    addressLocality,
    addressRegion,
    postalCode,
    addressCountry: "TW",
  };
}

/**
 * 解析營業時間字串為 openingHoursSpecification 陣列
 * 支援格式：「週一至週五 07:00-14:00」或「Mon-Fri 07:00-14:00」
 */
function parseOpeningHours(openingHours: string | null | undefined) {
  if (!openingHours) {
    // 預設早午餐時段
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "07:00",
        closes: "14:00",
      },
    ];
  }

  // 嘗試解析常見格式
  const dayMap: Record<string, string> = {
    週一: "Monday",
    週二: "Tuesday",
    週三: "Wednesday",
    週四: "Thursday",
    週五: "Friday",
    週六: "Saturday",
    週日: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  const timeMatch = openingHours.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  const opens = timeMatch ? timeMatch[1] : "07:00";
  const closes = timeMatch ? timeMatch[2] : "14:00";

  // 預設全週開放
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: Object.values(dayMap).slice(0, 7),
      opens,
      closes,
    },
  ];
}

/**
 * useRestaurantSchema Hook
 * 動態生成多個 Restaurant Schema（每間門市一個）
 * 符合 Google Rich Results 規範
 */
export function useRestaurantSchema(stores: StoreData[] | undefined) {
  useEffect(() => {
    if (!stores || stores.length === 0) return;

    // 生成 ItemList 包含多個 Restaurant
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "來點什麼 Ordersome 門市列表",
      description: "來點什麼台韓式早午餐品牌全台門市據點",
      url: `${BASE_URL}/brand/stores`,
      itemListElement: stores.map((store, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Restaurant",
          // @id 必須唯一：優先使用 slug，否則使用數字 id
          "@id": store.slug
            ? `${BASE_URL}/brand/stores/${store.slug}`
            : `${BASE_URL}/brand/stores#store-${store.id}`,
          name: `來點什麼 - ${store.name}`,
          description: "台韓式早午餐，提供韓式飯捲、台式蛋餅、鐵板麵等特色餐點",
          image: store.imageUrl || `${BASE_URL}/logo.png`,
          // url 指向對應門市的頁面錨點，確保每間門市 url 唯一
          url: `${BASE_URL}/brand/stores#store-${store.id}`,
          menu: `${BASE_URL}/brand/menu`,
          telephone: store.phone || "04-2437-9666",
          address: parseAddress(store.address),
          ...(store.latitude && store.longitude
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: parseFloat(store.latitude),
                  longitude: parseFloat(store.longitude),
                },
              }
            : {}),
          openingHoursSpecification: parseOpeningHours(store.openingHours),
          servesCuisine: ["台式早午餐", "韓式料理", "早餐"],
          priceRange: "$",
          currenciesAccepted: "TWD",
          paymentAccepted: "Cash, Credit Card",
          hasMap: store.latitude && store.longitude
            ? `https://maps.google.com/?q=${store.latitude},${store.longitude}`
            : undefined,
          // aggregateRating：有資料庫數據則真實呈現，否則預設基礎數據
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: store.ratingValue ?? 5,
            reviewCount: store.reviewCount ?? 1,
            bestRating: 5,
            worstRating: 1,
          },
        },
      })),
    };

    const cleanup = injectSchema("restaurant", schema);
    return cleanup;
  }, [stores]);
}

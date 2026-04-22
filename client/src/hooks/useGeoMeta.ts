import { useEffect } from "react";
import { useLocation } from "wouter";

const BASE_URL = "https://ordersome.com.tw";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

type MetaRule = {
  match: RegExp;
  title: string;
  description: string;
  keywords: string;
  type?: "website" | "article" | "product";
};

const PUBLIC_META_RULES: MetaRule[] = [
  {
    match: /^\/$/,
    title: "宇聯國際文化餐飲｜來點什麼早餐加盟與官方商城",
    description:
      "宇聯國際文化餐飲旗下品牌「來點什麼」，聚焦早餐加盟創業與線上商城，提供品牌展店支援與人氣商品購買。",
    keywords:
      "宇聯國際文化餐飲,來點什麼,早餐加盟,早餐加盟推薦,早餐加盟創業,台中加盟,早午餐加盟,辣椒醬",
    type: "website",
  },
  {
    match: /^\/brand\/franchise$/,
    title: "來點什麼加盟方案｜早餐加盟與早午餐創業支援",
    description:
      "來點什麼提供早餐加盟與早午餐創業方案，涵蓋開店流程、教育訓練、總部輔導與營運 SOP，協助降低創業風險。",
    keywords:
      "台中加盟,早餐加盟,早午餐加盟,優秀加盟商,早餐加盟費用,早餐加盟推薦,來點什麼加盟",
    type: "website",
  },
  {
    match: /^\/brand\/franchise-taichung$/,
    title: "台中早餐加盟推薦｜早午餐加盟與開店評估指南",
    description:
      "針對台中加盟、早餐加盟、早午餐加盟等高意圖查詢，整理品牌挑選重點與創業者評估流程，幫助你快速決策。",
    keywords:
      "台中加盟,台中早餐加盟,早餐加盟推薦,早午餐加盟,優秀加盟商,加盟創業指南",
    type: "article",
  },
  {
    match: /^\/shop$/,
    title: "來點什麼官方商城｜辣椒醬與人氣商品線上購買",
    description:
      "來點什麼官方線上商城，提供辣椒醬與人氣商品，支援快速選購與配送。",
    keywords:
      "辣椒醬,辣椒醬推薦,來點什麼辣椒醬,早餐店辣椒醬,台灣辣椒醬,線上商城",
    type: "website",
  },
  {
    match: /^\/shop\/chili-sauce-guide$/,
    title: "辣椒醬推薦指南｜口味挑選與線上購買建議",
    description:
      "想找好吃辣椒醬？這份辣椒醬推薦指南整理辣度、香氣與料理搭配重點，協助你找到適合的口味。",
    keywords:
      "辣椒醬推薦,好吃辣椒醬,辣椒醬怎麼挑,早餐店辣椒醬,辣椒醬線上購買",
    type: "article",
  },
  {
    match: /^\/shop\/product\/[^/]+$/,
    title: "來點什麼商品頁｜辣椒醬與品牌商品資訊",
    description: "查看商品介紹、規格與價格，快速完成線上購買。",
    keywords: "來點什麼商品,辣椒醬商品,線上購買",
    type: "product",
  },
];

function setOrCreateMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOrCreateMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function getMetaRule(pathname: string) {
  return PUBLIC_META_RULES.find((rule) => rule.match.test(pathname));
}

function isNoIndexPath(pathname: string) {
  const noIndexPrefixes = [
    "/dashboard",
    "/api",
    "/profile",
    "/member",
    "/dayone",
    "/driver",
    "/super-admin",
  ];

  const noIndexExact = ["/login", "/shop/cart", "/shop/checkout", "/shop/my-orders"];
  const noIndexRegex = [/^\/shop\/payment\//, /^\/shop\/order-complete\//];

  return (
    noIndexPrefixes.some((p) => pathname.startsWith(p)) ||
    noIndexExact.includes(pathname) ||
    noIndexRegex.some((re) => re.test(pathname))
  );
}

export function useGeoMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = new URL(window.location.href).pathname;
    const rule = getMetaRule(pathname);

    if (rule) {
      document.title = rule.title;
      setOrCreateMetaByName("description", rule.description);
      setOrCreateMetaByName("keywords", rule.keywords);

      setOrCreateMetaByProperty("og:title", rule.title);
      setOrCreateMetaByProperty("og:description", rule.description);
      setOrCreateMetaByProperty("og:url", `${BASE_URL}${pathname}`);
      setOrCreateMetaByProperty("og:type", rule.type ?? "website");
      setOrCreateMetaByProperty("og:image", DEFAULT_OG_IMAGE);

      setOrCreateMetaByName("twitter:title", rule.title);
      setOrCreateMetaByName("twitter:description", rule.description);
      setOrCreateMetaByName("twitter:card", "summary_large_image");
      setOrCreateMetaByName("twitter:image", DEFAULT_OG_IMAGE);
    }

    const robotsContent = isNoIndexPath(pathname)
      ? "noindex, nofollow, noarchive"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    setOrCreateMetaByName("robots", robotsContent);
    setOrCreateMetaByName("googlebot", robotsContent);
  }, [location]);
}

import { useEffect } from "react";
import { useLocation } from "wouter";

const BASE_URL = "https://ordersome.com.tw";

/**
 * 動態 Canonical 標籤 Hook
 * - 移除 UTM 參數（utm_source, utm_medium, utm_campaign, utm_content, utm_term）
 * - 移除分頁 query string（page, p）
 * - 保留其他有意義的 query 參數
 */
export function useCanonical() {
  const [location] = useLocation();

  useEffect(() => {
    // 解析當前 URL
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // 移除 UTM 參數
    const utmParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ];
    utmParams.forEach((p) => params.delete(p));

    // 移除分頁參數
    const paginationParams = ["page", "p"];
    paginationParams.forEach((p) => params.delete(p));

    // 組合乾淨的 canonical URL
    const cleanPath = url.pathname;
    const cleanQuery = params.toString();
    const canonicalUrl = cleanQuery
      ? `${BASE_URL}${cleanPath}?${cleanQuery}`
      : `${BASE_URL}${cleanPath}`;

    // 更新或建立 canonical link 標籤
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // 清理：組件卸載時移除 canonical（避免殘留）
    return () => {
      // 保留 canonical 不移除，讓下一個頁面覆寫即可
    };
  }, [location]);
}

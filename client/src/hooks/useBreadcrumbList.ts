import { useEffect } from "react";
import { useLocation } from "wouter";

const BASE_URL = "https://ordersome.com.tw";

interface BreadcrumbItem {
  name: string;
  item: string;
}

/**
 * 動態 BreadcrumbList Schema Hook
 * 根據當前路徑自動生成層級導覽結構
 */
export function useBreadcrumbList() {
  const [location] = useLocation();

  useEffect(() => {
    // 定義路由對應的麵包屑
    const getBreadcrumbs = (): BreadcrumbItem[] => {
      const path = location;

      // 首頁
      if (path === "/") {
        return [{ name: "首頁", item: BASE_URL }];
      }

      // 品牌菜單頁
      if (path === "/brand/menu") {
        return [
          { name: "首頁", item: BASE_URL },
          { name: "來點什麼", item: `${BASE_URL}/brand` },
          { name: "菜單", item: `${BASE_URL}/brand/menu` },
        ];
      }

      // 品牌門市頁
      if (path === "/brand/stores") {
        return [
          { name: "首頁", item: BASE_URL },
          { name: "來點什麼", item: `${BASE_URL}/brand` },
          { name: "門市據點", item: `${BASE_URL}/brand/stores` },
        ];
      }

      // 商城首頁
      if (path === "/shop") {
        return [
          { name: "首頁", item: BASE_URL },
          { name: "線上商城", item: `${BASE_URL}/shop` },
        ];
      }

      // 商品詳情頁（動態提取分類與商品名稱）
      const productMatch = path.match(/^\/shop\/product\/(.+)$/);
      if (productMatch) {
        // 注：實際商品名稱需從 URL 參數或資料庫取得
        // 這裡先用簡化版本，實際應用需整合 useParams 與 API
        return [
          { name: "首頁", item: BASE_URL },
          { name: "線上商城", item: `${BASE_URL}/shop` },
          { name: "商品", item: `${BASE_URL}/shop/product/${productMatch[1]}` },
        ];
      }

      // 其他頁面（預設只顯示首頁）
      return [{ name: "首頁", item: BASE_URL }];
    };

    const breadcrumbs = getBreadcrumbs();

    // 生成 BreadcrumbList Schema JSON-LD
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    };

    // 更新或建立 BreadcrumbList script 標籤
    let scriptTag = document.querySelector(
      'script[type="application/ld+json"][data-breadcrumb]'
    );
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.setAttribute("type", "application/ld+json");
      scriptTag.setAttribute("data-breadcrumb", "true");
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);

    // 清理：組件卸載時保留 script（讓下一個頁面覆寫）
    return () => {
      // 保留 script 不移除
    };
  }, [location]);
}

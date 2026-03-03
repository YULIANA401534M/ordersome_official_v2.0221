import { useEffect } from "react";
import { useLocation } from "wouter";
import { injectSchema } from "./schemaUtils";

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

      // 商品詳情頁
      const productMatch = path.match(/^\/shop\/product\/(.+)$/);
      if (productMatch) {
        return [
          { name: "首頁", item: BASE_URL },
          { name: "線上商城", item: `${BASE_URL}/shop` },
          { name: "商品", item: `${BASE_URL}/shop/product/${productMatch[1]}` },
        ];
      }

      // 最新消息頁
      const newsMatch = path.match(/^\/news\/(.+)$/);
      if (newsMatch) {
        return [
          { name: "首頁", item: BASE_URL },
          { name: "最新消息", item: `${BASE_URL}/news` },
          { name: "文章", item: `${BASE_URL}/news/${newsMatch[1]}` },
        ];
      }

      // 其他頁面（預設只顯示首頁）
      return [{ name: "首頁", item: BASE_URL }];
    };

    const breadcrumbs = getBreadcrumbs();
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

    const cleanup = injectSchema("breadcrumb", schema);
    return cleanup;
  }, [location]);
}

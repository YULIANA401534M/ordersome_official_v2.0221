import { useEffect } from "react";

const BASE_URL = "https://ordersome.com.tw";
const PUBLISHER_NAME = "宇聯國際文化餐飲有限公司";
const PUBLISHER_LOGO = `${BASE_URL}/logo.png`;

interface ArticleSchemaProps {
  headline: string;
  description?: string;
  datePublished: string; // ISO 8601 format
  dateModified?: string; // ISO 8601 format
  author?: string;
  image?: string;
  url: string;
}

/**
 * Article Schema Hook
 * 為文章頁面動態注入 Article 結構化數據
 * 防止 hydration error：使用 useEffect 確保僅在客戶端執行
 */
export function useArticleSchema(props: ArticleSchemaProps) {
  const {
    headline,
    description,
    datePublished,
    dateModified = datePublished,
    author = "來點什麼",
    image,
    url,
  } = props;

  useEffect(() => {
    // 生成 Article Schema JSON-LD
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline,
      description: description || headline,
      image: image ? [image] : [],
      datePublished,
      dateModified,
      author: {
        "@type": "Organization",
        name: author,
      },
      publisher: {
        "@type": "Organization",
        name: PUBLISHER_NAME,
        logo: {
          "@type": "ImageObject",
          url: PUBLISHER_LOGO,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
    };

    // 更新或建立 Article script 標籤
    let scriptTag = document.querySelector(
      'script[type="application/ld+json"][data-article]'
    );
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.setAttribute("type", "application/ld+json");
      scriptTag.setAttribute("data-article", "true");
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);

    // 清理：組件卸載時保留 script（讓下一個頁面覆寫）
    return () => {
      // 保留 script 不移除
    };
  }, [headline, description, datePublished, dateModified, author, image, url]);
}

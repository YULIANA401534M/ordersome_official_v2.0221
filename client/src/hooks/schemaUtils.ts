/**
 * schemaUtils.ts
 * 全站 JSON-LD Schema 注入工具函式
 *
 * 設計原則：
 * 1. 每種 Schema 類型使用唯一的 data-schema-* 屬性作為選擇器
 * 2. 注入前先移除同類型的舊 script，確保 DOM 中只存在單一實例
 * 3. cleanup 函式在組件卸載時移除對應 script，防止跨頁殘留
 *
 * 支援的 Schema 類型（data-schema-type 值）：
 * - "organization"  → 首頁 Organization Schema
 * - "menu"          → 菜單頁 Menu Schema
 * - "faq"           → 加盟頁 FAQPage Schema
 * - "item-list"     → 商城首頁 ItemList Schema
 * - "breadcrumb"    → 全站 BreadcrumbList Schema（App.tsx 層）
 * - "article"       → 文章頁 Article Schema
 * - "restaurant"    → 門市頁 Restaurant Schema
 * - "product"       → 商品詳情頁 Product Schema
 */

/**
 * 注入或更新 JSON-LD script 標籤
 * @param schemaType 唯一識別此 Schema 類型的字串
 * @param schema     要序列化的 Schema 物件
 * @returns cleanup 函式，呼叫後移除對應 script 標籤
 */
export function injectSchema(
  schemaType: string,
  schema: Record<string, unknown>
): () => void {
  const selector = `script[type="application/ld+json"][data-schema-type="${schemaType}"]`;

  // 先移除同類型的舊 script（防止 React StrictMode 或 HMR 造成重複）
  const existing = document.querySelectorAll(selector);
  existing.forEach((el) => el.remove());

  // 建立新的 script 標籤
  const scriptEl = document.createElement("script");
  scriptEl.type = "application/ld+json";
  scriptEl.setAttribute("data-schema-type", schemaType);
  scriptEl.textContent = JSON.stringify(schema);
  document.head.appendChild(scriptEl);

  // 回傳 cleanup 函式
  return () => {
    const toRemove = document.querySelectorAll(selector);
    toRemove.forEach((el) => el.remove());
  };
}

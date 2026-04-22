import CorporateLayout from "@/components/layout/CorporateLayout";
import { Link } from "wouter";
import { injectSchema } from "@/hooks/schemaUtils";
import { useEffect } from "react";

export default function ShopChiliSauceGuide() {
  useEffect(() => {
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "辣椒醬推薦怎麼挑？來點什麼人氣口味與選購重點",
      description:
        "整理辣椒醬推薦挑選方法、口味差異與購買建議，協助消費者快速找到適合自己的辣椒醬。",
      mainEntityOfPage: "https://ordersome.com.tw/shop/chili-sauce-guide",
      author: {
        "@type": "Organization",
        name: "宇聯國際文化餐飲有限公司",
      },
      publisher: {
        "@type": "Organization",
        name: "宇聯國際文化餐飲有限公司",
      },
      inLanguage: "zh-TW",
    };

    const cleanup = injectSchema("article-chili-guide", articleSchema);
    return cleanup;
  }, []);

  return (
    <CorporateLayout>
      <main className="container py-12 md:py-16">
        <article className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4">
            <p className="text-sm text-gray-500">辣椒醬推薦 / 線上購買指南</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              辣椒醬推薦怎麼挑？口味、辣度與料理搭配一次看懂
            </h1>
            <p className="text-lg leading-8 text-gray-700">
              如果你正在找「辣椒醬推薦、好吃辣椒醬、早餐店辣椒醬」，
              這份指南整理了挑選重點，幫你快速找到適合自己的口味。
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. 先確認你要的辣度與香氣</h2>
            <p className="leading-8 text-gray-700">
              辣椒醬不只分辣不辣，還要看前段香氣、後段辣感與回甘層次。
              日常拌麵、沾醬、炒菜，適合的辣度區間都不同。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. 看成分與用途，不要只看價格</h2>
            <p className="leading-8 text-gray-700">
              好的辣椒醬通常有清楚成分、風味定位與建議搭配料理。
              你可以優先挑選有品牌背景與穩定出貨的官方通路，避免踩雷。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. 從小包裝試口味，再決定回購</h2>
            <p className="leading-8 text-gray-700">
              建議先試一到兩款最常見口味，確認你平常料理情境用得上，
              再進行長期回購，會更符合實際需求。
            </p>
          </section>

          <section className="rounded-2xl bg-gray-100 p-6 md:p-8">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">前往官方商城</h2>
            <p className="mb-5 leading-8 text-gray-700">
              你可以直接到來點什麼商城查看目前上架商品與熱銷品項。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-800"
              >
                進入來點什麼商城
              </Link>
              <Link
                href="/brand/menu"
                className="rounded-full border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-white"
              >
                查看品牌菜單
              </Link>
            </div>
          </section>
        </article>
      </main>
    </CorporateLayout>
  );
}

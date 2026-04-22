import BrandLayout from "@/components/layout/BrandLayout";
import { Link } from "wouter";
import { injectSchema } from "@/hooks/schemaUtils";
import { useEffect } from "react";

export default function BrandFranchiseTaichung() {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "台中早餐加盟推薦怎麼選？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "建議先看品牌總部是否有完整教育訓練、展店 SOP、供應鏈穩定度與開店後營運支援，而不是只看低加盟金。",
          },
        },
        {
          "@type": "Question",
          name: "第一次創業適合做早午餐加盟嗎？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "如果你重視標準化流程、可複製門店模型與總部陪跑，早午餐加盟會是相對友善的創業起點。",
          },
        },
        {
          "@type": "Question",
          name: "來點什麼加盟重點是什麼？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "重點在高頻餐飲場景、可執行 SOP、品牌差異化商品與持續營運輔導，降低創業初期試錯成本。",
          },
        },
      ],
    };

    const cleanup = injectSchema("faq-taichung-franchise", faqSchema);
    return cleanup;
  }, []);

  return (
    <BrandLayout>
      <main className="container py-12 md:py-16">
        <article className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4">
            <p className="text-sm text-gray-500">台中加盟 / 早餐加盟 / 早午餐加盟指南</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              台中早餐加盟怎麼選？給創業者的早午餐加盟實戰指南
            </h1>
            <p className="text-lg leading-8 text-gray-700">
              如果你正在搜尋「台中加盟、早餐加盟、早午餐加盟、優秀加盟商」，
              這頁整理了創業者最常忽略的判斷重點，幫你用更低風險方式評估品牌。
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">1. 不只看加盟金，先看總部支援深度</h2>
            <p className="leading-8 text-gray-700">
              優秀加盟商通常不會只提供開店前協助，更重要的是開店後的營運陪跑，
              包含訓練、稽核、商品策略、品質控管與問題排除流程。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">2. 觀察門店模型是否可複製</h2>
            <p className="leading-8 text-gray-700">
              同一套 SOP 在不同商圈是否可執行，決定你的展店效率與長期穩定度。
              這也是許多「看起來很紅」但無法長期複製的品牌會卡住的地方。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">3. 產品差異化決定回購與口碑</h2>
            <p className="leading-8 text-gray-700">
              早午餐加盟競爭高，真正能留住客人的通常是可被記住的核心商品與穩定品質。
              品牌若有清楚產品策略，會更容易在在地市場建立優勢。
            </p>
          </section>

          <section className="rounded-2xl bg-amber-50 p-6 md:p-8">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">下一步建議</h2>
            <p className="mb-5 leading-8 text-gray-700">
              你可以先看完整加盟資訊，再評估你的預算、商圈與投入時間是否匹配。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/brand/franchise"
                className="rounded-full bg-amber-500 px-5 py-3 font-medium text-gray-900 hover:bg-amber-400"
              >
                查看來點什麼加盟方案
              </Link>
              <Link
                href="/brand/stores"
                className="rounded-full border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-white"
              >
                查看門市據點
              </Link>
            </div>
          </section>
        </article>
      </main>
    </BrandLayout>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Sparkles, Store, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import LogoIntro from "@/components/LogoIntro";

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.title = "宇聯科技 Ordersome | 品牌官網與企業服務";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Ordersome 提供品牌官網、企業介紹、線上商店與營運系統整合，協助餐飲與零售團隊建立更穩定的數位營運基礎。",
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "Ordersome, 宇聯科技, 品牌官網, 企業網站, 電商系統, ERP",
    );

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "宇聯科技 Ordersome",
      alternateName: "Ordersome",
      url: "https://ordersome.com.tw",
      logo: "https://ordersome.com.tw/logo.png",
      description: "品牌官網、企業介紹、線上商店與營運系統整合服務。",
      address: {
        "@type": "PostalAddress",
        addressCountry: "TW",
      },
      sameAs: ["https://www.facebook.com/ordersome"],
    };

    return injectSchema("organization", schema);
  }, []);

  return (
    <>
      <LogoIntro onComplete={() => setShowContent(true)} />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,#fffdf7_0%,#f5f2ea_56%,#f1ece2_100%)]">
        <div className={["transition-opacity duration-500", showContent ? "opacity-100" : "opacity-0"].join(" ")}>
          <section className="relative overflow-hidden px-6 py-14 md:py-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[6%] top-20 h-56 w-56 rounded-full bg-yellow-200/35 blur-3xl" />
              <div className="absolute right-[8%] top-12 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-stone-200/45 blur-3xl" />
            </div>

            <div className="container relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mx-auto max-w-4xl text-center"
              >
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 shadow-sm backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  Brand x Corporate x Commerce
                </p>
                <h1 className="mt-6 text-balance text-[clamp(2.8rem,6vw,5.7rem)] font-extrabold tracking-[-0.055em] text-stone-950">
                  先選你要進入的世界
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-stone-600 md:text-lg">
                  一邊是更年輕、更有節奏的品牌體驗，一邊是穩定清楚的企業服務入口。
                  邏輯不變，但這頁會先把方向感說清楚。
                </p>
              </motion.div>

              <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.08 }}
                >
                  <Link href="/brand">
                    <a className="group block overflow-hidden rounded-[34px] border border-amber-200/80 bg-[linear-gradient(135deg,#26211d_0%,#42342a_32%,#f2ce58_100%)] p-7 text-white shadow-[0_28px_80px_-34px_rgba(120,53,15,0.55)] transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex h-full flex-col justify-between gap-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-100/90">Brand Website</p>
                            <h2 className="mt-4 font-brand text-[clamp(2.8rem,5vw,5rem)] leading-[0.9] tracking-[-0.04em] text-white">
                              來點什麼
                            </h2>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-100 md:text-base">
                              年輕、韓系、明亮、好吃又有節奏的品牌入口。從品牌故事、菜單、門市到加盟，先進入比較有溫度的那一面。
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 text-yellow-100 shadow-lg backdrop-blur-sm">
                            <UtensilsCrossed className="h-7 w-7" />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-yellow-100/80">氛圍</p>
                            <p className="mt-2 font-semibold text-white">年輕活潑</p>
                          </div>
                          <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-yellow-100/80">風味</p>
                            <p className="mt-2 font-semibold text-white">台韓混血</p>
                          </div>
                          <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-yellow-100/80">方向</p>
                            <p className="mt-2 font-semibold text-white">品牌主站</p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm font-semibold text-yellow-50">
                          前往來點什麼
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.14 }}
                >
                  <Link href="/corporate">
                    <a className="group block h-full rounded-[34px] border border-stone-200 bg-white/88 p-7 text-stone-900 shadow-[0_26px_70px_-36px_rgba(17,24,39,0.24)] backdrop-blur transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex h-full flex-col justify-between gap-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Corporate Website</p>
                            <h2 className="mt-4 text-[clamp(2.1rem,4vw,3.7rem)] font-extrabold leading-[0.92] tracking-[-0.05em] text-stone-950">
                              宇聯國際
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-stone-600 md:text-base">
                              企業介紹、品牌整合、合作能力與集團定位都從這裡展開。內容先不改，但入口體驗會和品牌站一起被整理得更清楚。
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950 text-amber-300 shadow-lg">
                            <Building2 className="h-7 w-7" />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">定位</p>
                            <p className="mt-2 font-semibold text-stone-900">企業服務</p>
                          </div>
                          <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">狀態</p>
                            <p className="mt-2 font-semibold text-stone-900">內容維持不動</p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm font-semibold text-stone-800">
                          前往宇聯官網
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
              >
                <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white/80 backdrop-blur">
                  <Link href="/shop">直接進商店</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white/80 backdrop-blur">
                  <Link href="/brand/stores">看門市據點</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white/80 backdrop-blur">
                  <Link href="/brand/franchise">加盟合作</Link>
                </Button>
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

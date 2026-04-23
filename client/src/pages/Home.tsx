import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Calendar, Store, Users, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import LogoIntro from "@/components/LogoIntro";
import CountUpNumber from "@/components/CountUpNumber";

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

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(180deg,_#fffdf8_0%,_#f6f4ee_100%)]">
        <div
          className={[
            "transition-opacity duration-500",
            showContent ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[8%] top-16 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
              <div className="absolute bottom-8 right-[10%] h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
            </div>

            <div className="container relative z-10 px-6 py-16 md:py-24">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mx-auto max-w-4xl text-center"
              >
                <p className="mb-4 inline-flex rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm backdrop-blur">
                  Brand, Commerce, ERP
                </p>
                <h1 className="text-balance text-4xl font-black tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
                  宇聯科技 Ordersome
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-stone-600 md:text-lg">
                  我們整合品牌網站、企業形象、門市資訊與營運系統，
                  讓餐飲與零售團隊可以在同一個數位基礎上穩定成長。
                </p>
              </motion.div>

              <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Link href="/brand">
                    <a className="group block rounded-[28px] border border-amber-100 bg-white/90 p-8 shadow-[0_20px_70px_-32px_rgba(120,53,15,0.35)] transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">
                            Brand
                          </p>
                          <h2 className="mt-3 text-3xl font-bold text-stone-900">品牌官網</h2>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                          <Utensils className="h-7 w-7" />
                        </div>
                      </div>
                      <p className="mt-5 text-sm leading-7 text-stone-600 md:text-base">
                        進入品牌故事、門市資訊、加盟介紹與產品內容，查看對外形象與消費者入口。
                      </p>
                      <div className="mt-8 flex items-center text-sm font-semibold text-amber-700">
                        前往品牌站
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </a>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Link href="/corporate">
                    <a className="group block rounded-[28px] border border-stone-200 bg-stone-950 p-8 text-white shadow-[0_20px_70px_-32px_rgba(15,23,42,0.65)] transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
                            Corporate
                          </p>
                          <h2 className="mt-3 text-3xl font-bold">企業服務</h2>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-amber-200">
                          <Building2 className="h-7 w-7" />
                        </div>
                      </div>
                      <p className="mt-5 text-sm leading-7 text-stone-300 md:text-base">
                        查看企業介紹、品牌整合、加盟合作與聯絡資訊，理解 Ordersome 的服務與商業能力。
                      </p>
                      <div className="mt-8 flex items-center text-sm font-semibold text-amber-300">
                        前往企業站
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </a>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
              >
                <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white/80">
                  <Link href="/shop">前往商店</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white/80">
                  <Link href="/brand/franchise">加盟合作</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-stone-300 bg-white/80">
                  <Link href="/brand/stores">門市資訊</Link>
                </Button>
              </motion.div>
            </div>
          </section>

          <section className="px-6 pb-20">
            <div className="container">
              <div className="mx-auto rounded-[32px] border border-white/70 bg-white/85 px-6 py-10 shadow-[0_30px_100px_-48px_rgba(120,53,15,0.4)] backdrop-blur md:px-10">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-stone-900 md:text-3xl">營運節奏與服務經驗</h3>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                    從品牌曝光到實際營運，我們把網站、內容、商店與系統整合在同一條工作流。
                  </p>
                </div>

                <div className="mt-10 grid gap-8 md:grid-cols-3">
                  <CountUpNumber
                    end={12}
                    suffix="+"
                    label="服務模組"
                    icon={<Store className="h-8 w-8 text-white" />}
                  />
                  <CountUpNumber
                    end={5}
                    suffix="+"
                    label="營運場景"
                    icon={<Calendar className="h-8 w-8 text-white" />}
                  />
                  <CountUpNumber
                    end={1200000}
                    suffix="+"
                    label="年度互動"
                    icon={<Users className="h-8 w-8 text-white" />}
                  />
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-stone-200/70 bg-white/80 px-6 py-8 backdrop-blur">
            <div className="container flex flex-col gap-3 text-center text-sm text-stone-500 md:flex-row md:items-center md:justify-between md:text-left">
              <p>© {new Date().getFullYear()} 宇聯科技 Ordersome. All rights reserved.</p>
              <div className="flex items-center justify-center gap-4 md:justify-end">
                <Link href="/brand">
                  <a className="transition-colors hover:text-stone-800">品牌站</a>
                </Link>
                <Link href="/corporate">
                  <a className="transition-colors hover:text-stone-800">企業站</a>
                </Link>
                <Link href="/shop">
                  <a className="transition-colors hover:text-stone-800">商店</a>
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

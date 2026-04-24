import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { injectSchema } from "@/hooks/schemaUtils";
import LogoIntro from "@/components/LogoIntro";

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.title = "Ordersome | 台韓兩味，混搭就對";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Ordersome 串連來點什麼品牌入口與宇聯企業資訊，從首頁先選你想逛的那一邊。",
    );
    document.querySelector('meta[name="keywords"]')?.setAttribute(
      "content",
      "Ordersome, 來點什麼, 宇聯國際, 早餐, 品牌官網",
    );

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Ordersome",
      url: "https://ordersome.com.tw",
      logo: "https://ordersome.com.tw/logo.png",
      description: "來點什麼品牌入口與宇聯企業資訊整合首頁。",
      address: {
        "@type": "PostalAddress",
        addressCountry: "TW",
      },
    };

    return injectSchema("organization", schema);
  }, []);

  return (
    <>
      <LogoIntro onComplete={() => setShowContent(true)} />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff0ae_0%,rgba(255,240,174,0.4)_24%,transparent_54%),linear-gradient(180deg,#fffdf8_0%,#faf6ec_100%)]">
        <div className={["transition-opacity duration-500", showContent ? "opacity-100" : "opacity-0"].join(" ")}>
          <section className="relative overflow-hidden px-6 py-14 md:py-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[7%] top-16 h-60 w-60 rounded-full bg-[#ffe37a]/35 blur-3xl" />
              <div className="absolute right-[6%] top-20 h-72 w-72 rounded-full bg-[#ffd24a]/24 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#efe5ce]/60 blur-3xl" />
            </div>

            <div className="container relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mx-auto max-w-4xl text-center"
              >
                <p className="inline-flex items-center rounded-full border border-[#f3d56b] bg-white/75 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-[#9d7400] shadow-sm backdrop-blur">
                  ORDERSOME
                </p>
                <h1 className="mt-6 text-[clamp(3rem,7vw,6rem)] font-black tracking-[-0.06em] text-[#181512]">
                  台韓兩味，
                  <span className="block text-[#181512]">混搭就對</span>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#6b6254] md:text-lg">
                  想吃的，先進來點什麼。想看企業資訊，再往宇聯那邊走。
                </p>
              </motion.div>

              <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.08 }}
                >
                  <Link href="/brand">
                    <a className="group block overflow-hidden rounded-[36px] border border-[#e8d39a] bg-[linear-gradient(135deg,#2b241e_0%,#5a452f_34%,#f0ca49_100%)] p-7 text-white shadow-[0_28px_90px_-36px_rgba(131,88,10,0.55)] transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#fff0b4]">來點什麼</p>
                          <h2 className="mt-4 text-[clamp(2.5rem,5vw,4.6rem)] font-black tracking-[-0.06em]">
                            早餐、早午餐、
                            <span className="block">韓味小驚喜</span>
                          </h2>
                          <p className="mt-4 max-w-lg text-sm leading-7 text-[#fff8df] md:text-base">
                            先逛品牌、菜單、門市和加盟，這一邊比較熱鬧，也比較有食慾。
                          </p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/15 backdrop-blur-sm">
                          <UtensilsCrossed className="h-7 w-7 text-[#fff4c7]" />
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <span className="rounded-full bg-white/12 px-4 py-2 text-sm text-[#fff4d3]">台韓混搭</span>
                        <span className="rounded-full bg-white/12 px-4 py-2 text-sm text-[#fff4d3]">年輕感</span>
                        <span className="rounded-full bg-white/12 px-4 py-2 text-sm text-[#fff4d3]">門市加盟</span>
                      </div>

                      <div className="mt-8 flex items-center text-sm font-semibold text-[#fff9e6]">
                        前往來點什麼
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </a>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.14 }}
                >
                  <Link href="/corporate">
                    <a className="group block h-full rounded-[36px] border border-[#ece3cf] bg-white/88 p-7 shadow-[0_24px_70px_-40px_rgba(46,36,20,0.32)] backdrop-blur transition-transform duration-300 hover:-translate-y-1">
                      <div className="flex h-full flex-col justify-between gap-7">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9e9586]">宇聯國際</p>
                            <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.06em] text-[#181512]">
                              企業資訊
                              <span className="block">從這邊進</span>
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-[#6b6254] md:text-base">
                              公司介紹、品牌整合、合作內容都放在這裡，先維持乾淨清楚就好。
                            </p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#1f1a14] text-[#f3cd56]">
                            <Building2 className="h-7 w-7" />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[22px] bg-[#faf5ea] px-4 py-4">
                            <p className="text-xs text-[#8e826e]">內容</p>
                            <p className="mt-2 font-semibold text-[#181512]">企業介紹</p>
                          </div>
                          <div className="rounded-[22px] bg-[#faf5ea] px-4 py-4">
                            <p className="text-xs text-[#8e826e]">狀態</p>
                            <p className="mt-2 font-semibold text-[#181512]">這輪不改內頁</p>
                          </div>
                        </div>

                        <div className="flex items-center text-sm font-semibold text-[#181512]">
                          前往宇聯官網
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
              >
                <Button asChild variant="outline" className="rounded-full border-[#d8ccb6] bg-white/85">
                  <Link href="/shop">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    直接逛商店
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-[#d8ccb6] bg-white/85">
                  <Link href="/brand/stores">
                    <MapPin className="mr-2 h-4 w-4" />
                    看門市據點
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

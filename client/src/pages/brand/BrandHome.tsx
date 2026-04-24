import { Link } from "wouter";
import { ArrowRight, MapPin, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

const heroNotes = [
  "早上是早餐",
  "中午像早午餐",
  "晚上還想再來點",
];

const highlights = [
  {
    title: "台味打底",
    description: "蛋餅、吐司、鐵板麵這些熟悉的東西要先站穩，吃起來才有親切感。",
  },
  {
    title: "韓味加分",
    description: "不是整間變韓式，而是在醬、配料和氣氛裡多一點新鮮感。",
  },
  {
    title: "好吃也好拍",
    description: "門店、包裝和主視覺都該有記憶點，年輕人看了才會想分享。",
  },
];

export default function BrandHome() {
  const { data: stores } = trpc.store.list.useQuery();
  const storeCount = stores?.length ?? 0;

  return (
    <BrandLayout>
      <section className="relative overflow-hidden px-6 pb-16 pt-6 md:pb-20 md:pt-10">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-3xl"
            >
              <p className="inline-flex items-center gap-2 rounded-full bg-[#fff1bf] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[#9d7400]">
                <Sparkles className="h-3.5 w-3.5" />
                ORDER SOME
              </p>
              <h1 className="mt-6 text-[clamp(3rem,7vw,6rem)] font-black leading-[0.92] tracking-[-0.07em] text-[#181512]">
                台韓兩味，
                <span className="block">混搭就對</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#675e50] md:text-lg">
                熟悉的早餐底子，混進一點韓味和年輕感。看起來要有記憶點，吃起來也不能失手。
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {heroNotes.map((item) => (
                  <span key={item} className="rounded-full border border-[#ead9a6] bg-white px-4 py-2 text-sm text-[#5f5748] shadow-sm">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-[#181512] px-8 text-white hover:bg-[#2a241d]">
                  <Link href="/brand/menu">
                    先看菜單
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-[#dcc98d] bg-[#fff8de] px-8 text-[#5c4d26] hover:bg-[#ffefb4]">
                  <Link href="/brand/stores">
                    <MapPin className="mr-2 h-4 w-4" />
                    看門市
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="relative"
            >
              <div className="absolute -top-4 right-10 rounded-full bg-[#181512] px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[#ffe18b]">
                PHOTO SLOT
              </div>
              <div className="rounded-[38px] border border-[#ead9a6] bg-[linear-gradient(140deg,#fff9ea_0%,#fff2c7_100%)] p-5 shadow-[0_30px_90px_-40px_rgba(131,88,10,0.42)]">
                <div className="rounded-[30px] border border-dashed border-[#d8c07d] bg-white/55 p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#8c6a00]">
                      主視覺圖片預留區
                    </span>
                    <Star className="h-4 w-4 text-[#d9aa18]" />
                  </div>
                  <div className="mt-6 flex aspect-[4/5] items-center justify-center rounded-[26px] bg-[radial-gradient(circle_at_top,#fff3bf_0%,#fffaf0_56%)] px-8 text-center">
                    <div>
                      <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="mx-auto h-24 w-auto md:h-28" />
                      <p className="mt-5 text-base font-semibold text-[#181512]">
                        這裡等你放真正的餐點或門市主圖
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#746a59]">
                        素材到位後，我再補你要的浮動貼紙、光暈邊緣或比較有趣的進場效果。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="container">
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-[30px] border border-[#ece1c7] bg-white/92 p-7 shadow-[0_20px_60px_-44px_rgba(91,66,18,0.28)]"
              >
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[#181512]">{item.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[#675e50]">{item.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="container">
          <div className="rounded-[40px] bg-[linear-gradient(140deg,#251f19_0%,#5d472e_38%,#f0c845_100%)] px-6 py-8 text-white shadow-[0_30px_80px_-40px_rgba(91,66,18,0.5)] md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)] lg:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#fff2bf]">STORE & FRANCHISE</p>
                <h2 className="mt-4 text-[clamp(2.1rem,4vw,4rem)] font-black leading-[0.94] tracking-[-0.06em]">
                  門市要好找，
                  <span className="block">加盟也要看起來有吸引力</span>
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-[#fff6da] md:text-base">
                  現在先把首頁的語氣拉正。下一步很適合直接收菜單、門市、加盟頁，讓整個品牌站不再像拼起來的。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[24px] bg-white/12 px-5 py-5 backdrop-blur-sm">
                  <p className="text-xs tracking-[0.16em] text-[#fff2bf]">門市數量</p>
                  <p className="mt-3 text-3xl font-black">{storeCount}</p>
                  <p className="mt-2 text-sm text-[#fff6da]">可直接往門市頁接著修視覺</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-5 py-5 backdrop-blur-sm">
                  <p className="text-xs tracking-[0.16em] text-[#fff2bf]">下一步</p>
                  <p className="mt-3 text-xl font-black">補真實圖片</p>
                  <p className="mt-2 text-sm text-[#fff6da]">圖一進來，質感就能再往上拉一段。</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-white px-8 text-[#181512] hover:bg-[#fff7db]">
                <Link href="/brand/stores">看門市</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-white/10 px-8 text-white hover:bg-white hover:text-[#181512]">
                <Link href="/brand/franchise">看加盟</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}

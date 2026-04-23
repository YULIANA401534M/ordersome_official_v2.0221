import { Link } from "wouter";
import {
  ArrowRight,
  Clock3,
  MapPin,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

const signatureItems = [
  {
    title: "台韓混血早餐感",
    description: "不是純韓式，也不是老派早餐店，而是把台灣熟悉度和韓系記憶點揉在一起。",
    accent: "from-amber-400 to-yellow-300",
  },
  {
    title: "雙時段營運節奏",
    description: "從早午餐到晚間加碼，讓品牌不只好拍，也能撐起真實營收節奏。",
    accent: "from-stone-900 to-stone-700",
  },
  {
    title: "適合被喜歡的品牌",
    description: "視覺、餐點、門市語氣都要更年輕，讓人願意拍、願意分享、也願意再回來。",
    accent: "from-amber-500 to-orange-400",
  },
];

const productMoments = [
  {
    title: "韓式飯捲",
    desc: "俐落、飽滿、有記憶點的招牌系列",
    note: "圖片預留區 A",
  },
  {
    title: "台式蛋餅",
    desc: "熟悉底蘊裡帶一點韓系轉折",
    note: "圖片預留區 B",
  },
  {
    title: "鐵板麵與炸物",
    desc: "把早餐感延伸到更完整的飽足場景",
    note: "圖片預留區 C",
  },
];

const sceneCards = [
  {
    eyebrow: "Morning Rush",
    title: "早晨第一波",
    desc: "門市外帶節奏、招牌吐司與飯捲，是來點什麼最強的第一印象。",
  },
  {
    eyebrow: "Late Brunch",
    title: "中午還想再坐一下",
    desc: "空間與餐點都不只是快，還要讓人願意留下來拍照和分享。",
  },
  {
    eyebrow: "Night Craving",
    title: "晚一點也還吃得到",
    desc: "品牌最有差異的地方，是把早餐感做出全天候的吸引力。",
  },
];

export default function BrandHome() {
  const { data: stores } = trpc.store.list.useQuery();
  const { data: newsItems } = trpc.news.list.useQuery({ category: "brand" });

  const storeCount = stores?.length ?? 0;
  const newsCount = newsItems?.length ?? 0;

  return (
    <BrandLayout>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#1f1f1f_0%,#2f2a26_36%,#f3cf57_100%)] text-white">
        <div className="absolute inset-0">
          <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-yellow-300/18 blur-3xl" />
          <div className="absolute right-0 top-0 h-[32rem] w-[32rem] rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-white/8 blur-3xl" />
        </div>

        <div className="container relative z-10 px-6 py-12 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-200 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Taiwanese x Korean Brunch
              </div>

              <div className="mt-6">
                <h1 className="font-brand text-[clamp(3.1rem,7vw,6.2rem)] leading-[0.92] tracking-[-0.045em] text-white">
                  來點什麼
                </h1>
                <p className="mt-3 text-[clamp(1.2rem,2.2vw,1.85rem)] font-semibold tracking-[-0.03em] text-yellow-200">
                  年輕、明亮、台韓混血的雙時段早午餐品牌
                </p>
              </div>

              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-200 md:text-lg">
                我們想做的不是又一家早餐店，而是一個讓人看了會想拍、吃了會記得、經過還會想再進來的年輕品牌。
                早上有速度，中午有飽足感，晚上也還保留一點想來點什麼的理由。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/brand/menu">
                  <Button size="lg" className="rounded-full bg-stone-950 px-8 text-base font-bold text-white shadow-[0_16px_34px_rgba(17,24,39,0.35)] hover:bg-stone-800">
                    先看菜單
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/brand/franchise">
                  <Button size="lg" variant="outline" className="rounded-full border-white/35 bg-white/8 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white hover:text-stone-900">
                    加盟合作
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100/80">門市據點</p>
                  <p className="mt-3 text-3xl font-bold text-white">{storeCount}</p>
                  <p className="mt-1 text-xs text-stone-200">持續擴張中的品牌節奏</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100/80">品牌動態</p>
                  <p className="mt-3 text-3xl font-bold text-white">{newsCount}</p>
                  <p className="mt-1 text-xs text-stone-200">可延伸社群與活動內容</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100/80">營運定位</p>
                  <p className="mt-3 text-lg font-bold text-white">雙時段</p>
                  <p className="mt-1 text-xs text-stone-200">早餐感延伸到更完整時段</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -top-5 right-10 rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200 shadow-lg">
                Hero Image Slot
              </div>
              <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] p-5 shadow-[0_32px_70px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="rounded-[30px] border border-dashed border-white/25 bg-[linear-gradient(180deg,rgba(255,241,184,0.34),rgba(255,255,255,0.08))] px-6 py-8">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700">
                      之後可換主視覺餐點照
                    </span>
                    <Star className="h-4 w-4 text-yellow-100" />
                  </div>
                  <div className="mt-8 grid gap-5">
                    <div className="rounded-[28px] bg-white/88 p-5 text-stone-900 shadow-[0_14px_30px_rgba(17,24,39,0.12)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">主視覺圖片預留區</p>
                      <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-[24px] border border-dashed border-stone-300 bg-[linear-gradient(180deg,#fff8dc,#fffdf4)] px-6 text-center">
                        <div>
                          <p className="font-brand text-4xl text-stone-900">OrderSome</p>
                          <p className="mt-3 text-sm leading-6 text-stone-500">
                            這裡之後可直接換成品牌主餐點、門市人物照或情境照片。
                            我會再依你的素材補光暈、漂浮貼紙、局部動畫。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] bg-stone-950/90 p-4 text-white">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-200">Visual Cue</p>
                        <p className="mt-2 text-sm leading-6 text-stone-200">餐點可做輕漂浮、貼紙標籤、局部光暈。</p>
                      </div>
                      <div className="rounded-[24px] bg-white/80 p-4 text-stone-900">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Photo Direction</p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">建議用明亮、近距離、可口、乾淨的餐點照片。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf7] px-6 py-20 md:py-24">
        <div className="container">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Brand Vocabulary
              </p>
              <h2 className="mt-5 text-[clamp(2.2rem,4vw,4rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-stone-950">
                不是只賣早餐
                <span className="block text-stone-500">而是賣一種會被喜歡的節奏</span>
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-stone-600">
              來點什麼現在最有價值的，不只是餐點名稱，而是它已經有一種屬於自己、能被年輕客群快速辨識的氣質。
              這份首頁會先把那個氣質整理出來，再讓後面的菜單、門市和加盟頁一起接上。
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {signatureItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Card className="h-full overflow-hidden rounded-[30px] border border-stone-200/80 bg-white shadow-[0_18px_45px_rgba(120,113,108,0.08)]">
                  <div className={`h-2 bg-gradient-to-r ${item.accent}`} />
                  <CardContent className="p-7">
                    <h3 className="text-2xl font-bold tracking-[-0.03em] text-stone-950">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-stone-600">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-950 px-6 py-20 text-white md:py-24">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-200">
                <ShoppingBag className="h-3.5 w-3.5" />
                Signature Menu
              </p>
              <h2 className="mt-5 text-[clamp(2.2rem,4vw,4rem)] font-extrabold leading-[0.94] tracking-[-0.05em]">
                該有亮點
                <span className="block text-stone-400">也要保留日常感</span>
              </h2>
            </div>
            <Link href="/brand/menu">
              <Button size="lg" className="rounded-full bg-amber-400 px-7 text-base font-bold text-stone-950 hover:bg-amber-300">
                看完整菜單
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {productMoments.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group"
              >
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="aspect-[4/3] border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.22),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-5">
                    <div className="flex h-full flex-col justify-between rounded-[24px] border border-dashed border-white/20 p-5">
                      <span className="w-fit rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-800">
                        {item.note}
                      </span>
                      <div>
                        <p className="font-brand text-3xl text-yellow-200">OrderSome</p>
                        <p className="mt-2 text-sm leading-6 text-stone-200">
                          這裡之後可直接替換成對應品項主圖，我會再依實際素材補 hover 或局部動效。
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-300">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f3ea] px-6 py-20 md:py-24">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-200">
                <Clock3 className="h-3.5 w-3.5" />
                Brand Scenes
              </p>
              <h2 className="mt-5 text-[clamp(2.2rem,4vw,4rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-stone-950">
                一天裡不同時間
                <span className="block text-stone-500">都能找到來點什麼的位置</span>
              </h2>
            </div>

            <div className="grid gap-4">
              {sceneCards.map((item, index) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-[28px] border border-stone-200/70 bg-white px-6 py-6 shadow-[0_18px_40px_rgba(120,113,108,0.07)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">{item.eyebrow}</p>
                  <h3 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-stone-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 md:py-24">
        <div className="container">
          <div className="rounded-[38px] bg-[linear-gradient(135deg,#25211d_0%,#43352b_36%,#f0c743_100%)] px-6 py-8 text-white shadow-[0_26px_70px_rgba(68,53,43,0.24)] md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-100">
                  <Store className="h-3.5 w-3.5" />
                  Locations & Expansion
                </p>
                <h2 className="mt-5 text-[clamp(2.1rem,4vw,3.8rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">
                  門市、加盟、品牌感
                  <span className="block text-yellow-100">要一起成立才有說服力</span>
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-stone-100 md:text-base">
                  現在這版先把品牌首頁的第一印象整理出來。下一步很適合接著補門市實景、招牌品項照片、
                  年輕客群互動感，以及加盟頁的轉換節奏。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[26px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100/80">門市據點</p>
                  <p className="mt-3 text-3xl font-bold">{storeCount}</p>
                  <p className="mt-1 text-sm text-stone-100">可接著補強實景照與門市氛圍</p>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100/80">下一步重點</p>
                  <p className="mt-3 text-lg font-bold">圖片素材進場</p>
                  <p className="mt-1 text-sm text-stone-100">你給圖後，我再加局部動畫與更細的視覺表現。</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/brand/stores">
                <Button size="lg" className="rounded-full bg-white px-7 text-base font-bold text-stone-950 hover:bg-yellow-50">
                  <MapPin className="mr-2 h-4 w-4" />
                  看門市據點
                </Button>
              </Link>
              <Link href="/brand/franchise">
                <Button size="lg" variant="outline" className="rounded-full border-white/35 bg-white/8 px-7 text-base font-semibold text-white hover:bg-white hover:text-stone-950">
                  查看加盟方案
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}

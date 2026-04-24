import { useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const foodItems = [
  {
    src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg",
    name: "慶尚道辣炒豬",
    tag: "人氣第一",
  },
  {
    src: "/images/food/tuna-onigiri.jpg",
    name: "手作鮪魚飯糰",
    tag: "每日現做",
  },
  {
    src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/CApeTRjJBNflTLdV.jpg",
    name: "混醬厚片",
    tag: "招牌必點",
  },
  {
    src: "/images/food/korean-tuna-bento.jpg",
    name: "韓式搖搖便當",
    tag: "午餐限定",
  },
  {
    src: "/images/food/seaweed-roll.jpg",
    name: "海苔肉鬆飯捲",
    tag: "台式經典",
  },
  {
    src: "/images/food/peanut-bacon-toast.jpg",
    name: "溶岩花生培根吐司",
    tag: "早午餐霸主",
  },
];

function RevealText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
      }}
    >
      {children}
    </motion.div>
  );
}

export default function BrandHome() {
  const { data: stores } = trpc.store.list.useQuery();
  const { data: newsItems } = trpc.news.list.useQuery({ category: "brand" });

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <BrandLayout>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        {/* 視差背景大字 */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(140px, 30vw, 420px)",
              color: "oklch(0.92 0.06 85)",
              letterSpacing: "-0.04em",
            }}
          >
            ORDER
          </span>
        </motion.div>

        {/* 右上角食物圖 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.3 }}
          className="absolute top-20 right-0 w-[45vw] max-w-[560px] aspect-[3/4] overflow-hidden"
          style={{ borderRadius: "0 0 0 40% 0" }}
        >
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg"
            alt="慶尚道辣炒豬，韓式台味招牌"
            className="w-full h-full object-cover"
            style={{ filter: "saturate(1.1)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom left, transparent 50%, oklch(0.97 0.02 85) 100%)",
            }}
          />
        </motion.div>

        {/* 主文字 */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 flex flex-col justify-end min-h-screen pb-20 px-6 md:px-12 lg:px-20"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.98 0.01 85)",
              }}
            >
              台韓混血早午餐
            </span>
            <span className="text-xs text-stone-500">
              <Clock className="inline h-3 w-3 mr-1" />
              06:00 – 02:00
            </span>
          </motion.div>

          <div className="max-w-[700px]">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.15 }}
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(52px, 9vw, 120px)",
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                color: "oklch(0.18 0.02 60)",
              }}
            >
              來點
              <br />
              什麼
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.35 }}
              className="mt-6 max-w-md text-base md:text-lg leading-relaxed"
              style={{ color: "oklch(0.42 0.03 60)" }}
            >
              從台中東勢山城出發，把早餐店翻轉成
              <br className="hidden md:block" />
              全時段台韓街頭品牌。真材實料，不說廢話。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.5 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href="/brand/menu">
                <button
                  className="group flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base transition-all duration-200"
                  style={{
                    background: "oklch(0.75 0.18 70)",
                    color: "oklch(0.98 0.01 85)",
                    boxShadow: "0 8px 32px oklch(0.75 0.18 70 / 0.4)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px oklch(0.75 0.18 70 / 0.55)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px oklch(0.75 0.18 70 / 0.4)";
                  }}
                >
                  看完整菜單
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/brand/stores">
                <button
                  className="flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base border-2 transition-all duration-200"
                  style={{
                    borderColor: "oklch(0.18 0.02 60)",
                    color: "oklch(0.18 0.02 60)",
                    background: "transparent",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.18 0.02 60)";
                    (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.97 0.02 85)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.18 0.02 60)";
                  }}
                >
                  <MapPin className="h-4 w-4" />
                  找附近門市
                </button>
              </Link>
            </motion.div>
          </div>

          {/* 底部門市數 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 flex items-center gap-8"
          >
            <div>
              <p
                className="text-4xl font-black"
                style={{ fontFamily: "var(--font-brand)", color: "oklch(0.75 0.18 70)" }}
              >
                12
              </p>
              <p className="text-xs text-stone-500 mt-0.5">間門市</p>
            </div>
            <div
              className="w-px h-10 self-center"
              style={{ background: "oklch(0.85 0.03 85)" }}
            />
            <div>
              <p
                className="text-4xl font-black"
                style={{ fontFamily: "var(--font-brand)", color: "oklch(0.75 0.18 70)" }}
              >
                06–02
              </p>
              <p className="text-xs text-stone-500 mt-0.5">全天候供應</p>
            </div>
            <div
              className="w-px h-10 self-center"
              style={{ background: "oklch(0.85 0.03 85)" }}
            />
            <div>
              <p
                className="text-4xl font-black"
                style={{ fontFamily: "var(--font-brand)", color: "oklch(0.75 0.18 70)" }}
              >
                2020
              </p>
              <p className="text-xs text-stone-500 mt-0.5">創立至今</p>
            </div>
          </motion.div>
        </motion.div>

        {/* 底部滾動提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: "oklch(0.65 0.05 70)" }}
          >
            <div
              className="w-1 h-1.5 rounded-full"
              style={{ background: "oklch(0.65 0.05 70)" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 食物照片牆 ───────────────────────────────────────── */}
      <section
        className="py-24 overflow-hidden"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        <div className="px-6 md:px-12 lg:px-20 mb-12">
          <RevealText>
            <h2
              className="font-black leading-none"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(40px, 7vw, 88px)",
                color: "oklch(0.97 0.02 85)",
                letterSpacing: "-0.02em",
              }}
            >
              今天吃什麼
              <span
                className="ml-4"
                style={{ color: "oklch(0.75 0.18 70)" }}
              >
                ?
              </span>
            </h2>
            <p className="mt-4 text-base" style={{ color: "oklch(0.62 0.04 70)" }}>
              台韓風味完美融合，每一口都是驚喜
            </p>
          </RevealText>
        </div>

        {/* 橫向卡片捲動列 */}
        <StaggerGrid className="flex gap-4 px-6 md:px-12 lg:px-20 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {foodItems.map((item) => (
            <StaggerItem key={item.name}>
              <div
                className="relative flex-shrink-0 w-64 md:w-72 aspect-[3/4] rounded-2xl overflow-hidden snap-start group cursor-pointer"
              >
                <img
                  src={item.src}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, oklch(0.12 0.02 60 / 0.9) 0%, transparent 55%)",
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full mb-2 inline-block"
                    style={{
                      background: "oklch(0.75 0.18 70)",
                      color: "oklch(0.18 0.02 60)",
                    }}
                  >
                    {item.tag}
                  </span>
                  <p
                    className="font-bold text-base mt-1"
                    style={{ color: "oklch(0.97 0.02 85)" }}
                  >
                    {item.name}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>

        <div className="px-6 md:px-12 lg:px-20 mt-10">
          <Link href="/brand/menu">
            <button
              className="group flex items-center gap-2 text-base font-bold transition-all duration-200"
              style={{ color: "oklch(0.75 0.18 70)" }}
              onMouseEnter={e => (e.currentTarget.style.gap = "12px")}
              onMouseLeave={e => (e.currentTarget.style.gap = "8px")}
            >
              查看完整菜單 <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* ── 品牌 DNA ─────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <RevealText>
              <p
                className="text-xs font-bold tracking-[0.2em] uppercase mb-4"
                style={{ color: "oklch(0.75 0.18 70)" }}
              >
                我們是誰
              </p>
              <h2
                className="font-black leading-tight mb-6"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "clamp(36px, 5vw, 64px)",
                  color: "oklch(0.18 0.02 60)",
                  letterSpacing: "-0.02em",
                }}
              >
                不只是早餐店
              </h2>
              <p
                className="text-base md:text-lg leading-relaxed max-w-xl"
                style={{ color: "oklch(0.42 0.03 60)" }}
              >
                2020 年從台中東勢出發，一群年輕人把「推廣自己愛吃的東西」
                這件事認真做成了事業。韓式吐司遇上粉漿蛋餅，
                搖搖便當配上台式炸物，這就是來點什麼：
                台灣人從小吃到大的那種飽足感。
              </p>
              <Link href="/brand/story" className="mt-8 inline-flex items-center gap-2 font-bold text-sm" style={{ color: "oklch(0.18 0.02 60)" }}>
                了解品牌故事 <ArrowRight className="h-4 w-4" />
              </Link>
            </RevealText>
          </div>

          {/* 右側交錯圖塊 */}
          <StaggerGrid className="relative grid grid-cols-2 gap-4 h-[480px]">
            <StaggerItem>
              <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden h-full">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/CApeTRjJBNflTLdV.jpg"
                  alt="混醬厚片"
                  className="w-full h-full object-cover"
                />
              </div>
            </StaggerItem>
            <StaggerItem>
              <div
                className="rounded-2xl p-6 flex flex-col justify-end h-44"
                style={{ background: "oklch(0.75 0.18 70)" }}
              >
                <p
                  className="font-black text-3xl leading-tight"
                  style={{
                    fontFamily: "var(--font-brand)",
                    color: "oklch(0.18 0.02 60)",
                  }}
                >
                  台韓
                  <br />
                  混血
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div
                className="rounded-2xl overflow-hidden h-44"
                style={{ background: "oklch(0.92 0.04 85)" }}
              >
                <img
                  src="/images/food/seaweed-roll.jpg"
                  alt="海苔肉鬆飯捲"
                  className="w-full h-full object-cover"
                />
              </div>
            </StaggerItem>
          </StaggerGrid>
        </div>
      </section>

      {/* ── 門市據點 ─────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: "oklch(0.94 0.03 85)" }}
      >
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <RevealText>
              <h2
                className="font-black leading-none"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "clamp(36px, 5.5vw, 72px)",
                  color: "oklch(0.18 0.02 60)",
                  letterSpacing: "-0.02em",
                }}
              >
                找到
                <br />
                你的門市
              </h2>
            </RevealText>
            <Link href="/brand/stores">
              <button
                className="flex-shrink-0 flex items-center gap-2 text-sm font-bold"
                style={{ color: "oklch(0.42 0.03 60)" }}
              >
                查看全部 {stores?.length || 12} 間 <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {stores && stores.length > 0 ? (
            <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.slice(0, 6).map((store) => (
                <StaggerItem key={store.id}>
                  <div
                    className="rounded-2xl p-6 flex items-start gap-4 transition-all duration-300"
                    style={{
                      background: "oklch(0.98 0.01 85)",
                      border: "1px solid oklch(0.88 0.04 85)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px oklch(0.75 0.18 70 / 0.15)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = "";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(0.75 0.18 70 / 0.15)" }}
                    >
                      <MapPin className="h-5 w-5" style={{ color: "oklch(0.65 0.18 70)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm" style={{ color: "oklch(0.18 0.02 60)" }}>
                        {store.name}
                      </p>
                      <p className="text-xs mt-1 truncate" style={{ color: "oklch(0.55 0.04 70)" }}>
                        {store.address}
                      </p>
                      {store.phone && (
                        <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.04 70)" }}>
                          {store.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "北屯大平店", "北屯新光店", "大里店", "東勢店", "東山店",
                "民權店", "永興店", "向陽梅花店", "北屯中山店", "西屯福科店",
                "財神店", "豐甲旗艦店",
              ].slice(0, 6).map((name, i) => (
                <StaggerItem key={i}>
                  <div
                    className="rounded-2xl p-6 flex items-center gap-4"
                    style={{
                      background: "oklch(0.98 0.01 85)",
                      border: "1px solid oklch(0.88 0.04 85)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(0.75 0.18 70 / 0.15)" }}
                    >
                      <MapPin className="h-5 w-5" style={{ color: "oklch(0.65 0.18 70)" }} />
                    </div>
                    <p className="font-bold text-sm" style={{ color: "oklch(0.18 0.02 60)" }}>
                      來點什麼 {name}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}

          <RevealText delay={0.2}>
            <div className="mt-10 text-center">
              <Link href="/brand/stores">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm border-2 transition-all duration-200"
                  style={{
                    borderColor: "oklch(0.18 0.02 60)",
                    color: "oklch(0.18 0.02 60)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.18 0.02 60)";
                    (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.97 0.02 85)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.18 0.02 60)";
                  }}
                >
                  查看全部門市 <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </RevealText>
        </div>
      </section>

      {/* ── 線上商城 CTA ──────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20 overflow-hidden relative"
        style={{ background: "oklch(0.75 0.18 70)" }}
      >
        {/* 背景大字裝飾 */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap opacity-10"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(100px, 20vw, 300px)",
              color: "oklch(0.18 0.02 60)",
              letterSpacing: "-0.04em",
            }}
          >
            SOME
          </span>
        </div>
        <div className="relative z-10 max-w-3xl">
          <RevealText>
            <p
              className="text-xs font-bold tracking-[0.2em] uppercase mb-4"
              style={{ color: "oklch(0.18 0.02 60 / 0.6)" }}
            >
              線上商城
            </p>
            <h2
              className="font-black leading-tight mb-6"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(36px, 6vw, 80px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.02em",
              }}
            >
              把味道
              <br />
              帶回家
            </h2>
            <p className="text-base md:text-lg mb-10 max-w-lg" style={{ color: "oklch(0.22 0.02 60)" }}>
              獨家台韓辣椒醬，宅配直送到府。
              吃不夠的時候，這裡有。
            </p>
            <Link href="/shop">
              <button
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all duration-200"
                style={{
                  background: "oklch(0.18 0.02 60)",
                  color: "oklch(0.97 0.02 85)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px oklch(0.18 0.02 60 / 0.35)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                }}
              >
                前往選購 <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </RevealText>
        </div>
      </section>

      {/* ── 最新消息 ─────────────────────────────────────────── */}
      {newsItems && newsItems.length > 0 && (
        <section
          className="py-24 px-6 md:px-12 lg:px-20"
          style={{ background: "oklch(0.97 0.02 85)" }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <RevealText>
                <h2
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(32px, 4.5vw, 60px)",
                    color: "oklch(0.18 0.02 60)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  最新消息
                </h2>
              </RevealText>
              <Link href="/brand/news">
                <button className="text-sm font-bold flex items-center gap-1" style={{ color: "oklch(0.55 0.04 70)" }}>
                  查看全部 <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsItems.slice(0, 3).map((news) => (
                <StaggerItem key={news.id}>
                  <div
                    className="rounded-2xl overflow-hidden group cursor-pointer"
                    style={{ border: "1px solid oklch(0.88 0.04 85)" }}
                  >
                    {news.imageUrl && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={news.imageUrl}
                          alt={news.title}
                          className="w-full h-full object-cover transition-transform duration-700"
                          style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                          onMouseLeave={e => (e.currentTarget.style.transform = "")}
                        />
                      </div>
                    )}
                    <div className="p-6" style={{ background: "oklch(0.98 0.01 85)" }}>
                      <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.65 0.12 70)" }}>
                        {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("zh-TW") : ""}
                      </p>
                      <h3 className="font-bold text-base mb-2 line-clamp-2" style={{ color: "oklch(0.18 0.02 60)" }}>
                        {news.title}
                      </h3>
                      <p className="text-sm line-clamp-2" style={{ color: "oklch(0.50 0.03 60)" }}>
                        {news.content}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>
      )}

      {/* ── 加盟 CTA（降優先）─────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <RevealText>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "oklch(0.55 0.04 70)" }}>
              加盟諮詢
            </p>
            <p className="font-bold text-xl md:text-2xl" style={{ color: "oklch(0.97 0.02 85)" }}>
              想把來點什麼帶到你的城市？
            </p>
          </RevealText>
          <Link href="/brand/franchise" className="flex-shrink-0">
            <button
              className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm border-2 transition-all duration-200"
              style={{
                borderColor: "oklch(0.75 0.18 70)",
                color: "oklch(0.75 0.18 70)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.75 0.18 70)";
                (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.18 0.02 60)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.75 0.18 70)";
              }}
            >
              了解加盟方案 <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </BrandLayout>
  );
}

import { useRef } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── 動畫元件 ─────────────────────────────────────────────────── */

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function StaggerGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
    >
      {children}
    </motion.div>
  );
}

function StaggerChild({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── 統計數字 ─────────────────────────────────────────────────── */

const STATS = [
  { value: "2020", label: "創立年份" },
  { value: "12+", label: "門市據點" },
  { value: "50+", label: "專業團隊" },
  { value: "1", label: "旗下品牌" },
];

/* ── 主頁面 ──────────────────────────────────────────────────── */

export default function CorporateHome() {
  const [, setLocation] = useLocation();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { data: _newsData } = trpc.content.getPublishedPosts.useQuery({ publishTarget: "corporate" });
  const newsItems = _newsData?.posts ?? [];
  const { data: products } = trpc.product.list.useQuery();

  return (
    <CorporateLayout>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          minHeight: "92vh",
          background: "oklch(0.15 0.01 250)",
        }}
      >
        {/* 視差背景紋理 */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 120% 80% at 60% 40%, oklch(0.25 0.04 60 / 0.35) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 60% at 20% 70%, oklch(0.65 0.12 65 / 0.08) 0%, transparent 60%)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="container relative z-10 px-6 py-24 md:py-32"
        >
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-sm font-medium tracking-[0.2em] uppercase mb-6"
              style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
            >
              YULIAN International Cultural Catering
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: EASE, delay: 0.08 }}
              style={{
                fontFamily: "var(--font-corporate)",
                color: "oklch(0.97 0.01 85)",
                lineHeight: 1.1,
              }}
              className="text-5xl md:text-7xl font-black mb-8"
            >
              宇聯國際
              <span className="block" style={{ color: "oklch(0.65 0.12 65)" }}>
                文化餐飲
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
              className="text-lg md:text-xl leading-relaxed max-w-xl mb-12"
              style={{ color: "oklch(0.75 0.01 250)", fontFamily: "var(--font-corporate)" }}
            >
              以創新思維與專業服務，打造優質餐飲品牌，
              持續拓展多元化的餐飲版圖，
              為每一位消費者帶來美好體驗。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/corporate/about">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-sm tracking-wide transition-all duration-300"
                  style={{
                    fontFamily: "var(--font-corporate)",
                    background: "oklch(0.65 0.12 65)",
                    color: "oklch(0.15 0.01 250)",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.72 0.14 65)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.65 0.12 65)";
                  }}
                >
                  了解更多 <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/corporate/brands">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-sm tracking-wide transition-all duration-300"
                  style={{
                    fontFamily: "var(--font-corporate)",
                    border: "1px solid oklch(0.65 0.12 65 / 0.5)",
                    color: "oklch(0.65 0.12 65)",
                    background: "transparent",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.65 0.12 65 / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  旗下品牌
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* 底部漸層過渡 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, oklch(0.15 0.01 250))",
          }}
        />
      </section>

      {/* ── 數字指標 ──────────────────────────────────────────── */}
      <section
        style={{ background: "oklch(0.15 0.01 250)", borderBottom: "1px solid oklch(0.25 0.02 250)" }}
        className="py-16"
      >
        <div className="container px-6">
          <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <StaggerChild key={s.label}>
                <div className="text-center">
                  <p
                    className="text-4xl md:text-5xl font-black mb-2"
                    style={{ fontFamily: "var(--font-corporate)", color: "oklch(0.65 0.12 65)" }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-sm tracking-wider"
                    style={{ color: "oklch(0.55 0.01 250)", fontFamily: "var(--font-corporate)" }}
                  >
                    {s.label}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ── 關於宇聯 ──────────────────────────────────────────── */}
      <section
        style={{ background: "oklch(0.18 0.01 250)" }}
        className="py-24"
      >
        <div className="container px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                  style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                >
                  ABOUT US
                </p>
                <h2
                  className="text-3xl md:text-5xl font-black leading-tight mb-8"
                  style={{ fontFamily: "var(--font-corporate)", color: "oklch(0.95 0.01 85)" }}
                >
                  關於宇聯國際
                </h2>
                <p
                  className="text-base leading-loose mb-5"
                  style={{ color: "oklch(0.68 0.01 250)", fontFamily: "var(--font-corporate)" }}
                >
                  宇聯國際文化餐飲有限公司成立於 2020 年，由一群充滿熱情的年輕創業家所創立。
                  我們從台中東勢山城出發，秉持著「推廣自己愛吃的東西」的初心，
                  將傳統早餐店翻轉成全新的街頭台韓品牌。
                </p>
                <p
                  className="text-base leading-loose mb-10"
                  style={{ color: "oklch(0.68 0.01 250)", fontFamily: "var(--font-corporate)" }}
                >
                  我們相信每一份餐點都是改變人生的起點。透過嚴格的品質控管、
                  創新的產品研發，以及完善的加盟體系，我們持續拓展多元化的餐飲版圖。
                </p>
                <Link href="/corporate/about">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide transition-all duration-300"
                    style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.72 0.14 65)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.65 0.12 65)";
                    }}
                  >
                    了解更多 <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div
                className="grid grid-cols-2 gap-px"
                style={{ background: "oklch(0.25 0.02 250)" }}
              >
                {[
                  { en: "EXPERTISE", zh: "專業經營", desc: "多年餐飲管理與品牌運營經驗" },
                  { en: "TEAMWORK", zh: "團隊協作", desc: "跨功能專業團隊密切協作" },
                  { en: "GROWTH", zh: "持續成長", desc: "年年擴展門市與加盟版圖" },
                  { en: "QUALITY", zh: "品質保證", desc: "嚴格食材把關與標準化流程" },
                ].map((item) => (
                  <div
                    key={item.en}
                    className="p-8"
                    style={{ background: "oklch(0.18 0.01 250)" }}
                  >
                    <p
                      className="text-xs font-bold tracking-[0.2em] mb-2"
                      style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                    >
                      {item.en}
                    </p>
                    <p
                      className="text-lg font-bold mb-2"
                      style={{ color: "oklch(0.92 0.01 85)", fontFamily: "var(--font-corporate)" }}
                    >
                      {item.zh}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "oklch(0.55 0.01 250)", fontFamily: "var(--font-corporate)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 旗下品牌 ──────────────────────────────────────────── */}
      <section
        style={{ background: "oklch(0.15 0.01 250)" }}
        className="py-24"
      >
        <div className="container px-6">
          <Reveal>
            <div className="mb-14">
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
              >
                OUR BRANDS
              </p>
              <h2
                className="text-3xl md:text-5xl font-black"
                style={{ fontFamily: "var(--font-corporate)", color: "oklch(0.95 0.01 85)" }}
              >
                旗下品牌
              </h2>
            </div>
          </Reveal>

          <StaggerGroup className="grid md:grid-cols-2 gap-8 max-w-4xl">
            <StaggerChild>
              <Link href="/brand">
                <div
                  className="group overflow-hidden cursor-pointer"
                  style={{
                    background: "oklch(0.21 0.02 60)",
                    border: "1px solid oklch(0.3 0.05 60 / 0.4)",
                    borderRadius: "4px",
                    transition: "border-color 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.65 0.12 65 / 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.3 0.05 60 / 0.4)";
                  }}
                >
                  <div className="aspect-video flex items-center justify-center overflow-hidden"
                    style={{ background: "oklch(0.19 0.03 70)" }}>
                    <img
                      src="/images/brand-logo-yellow.png"
                      alt="來點什麼"
                      className="h-24 w-auto transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-7">
                    <p
                      className="text-xs tracking-[0.2em] uppercase mb-2"
                      style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                    >
                      BRAND 01
                    </p>
                    <h3
                      className="text-xl font-bold mb-3"
                      style={{ color: "oklch(0.93 0.01 85)", fontFamily: "var(--font-corporate)" }}
                    >
                      來點什麼 ORDER SOME
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-5"
                      style={{ color: "oklch(0.6 0.01 250)", fontFamily: "var(--font-corporate)" }}
                    >
                      社區型精緻平價早午餐品牌，主打台韓混搭風格，提供真材實料的美味餐點。
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                    >
                      品牌官網 <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </StaggerChild>

            <StaggerChild>
              <div
                className="overflow-hidden"
                style={{
                  background: "oklch(0.19 0.01 250)",
                  border: "1px solid oklch(0.25 0.01 250)",
                  borderRadius: "4px",
                  opacity: 0.5,
                }}
              >
                <div
                  className="aspect-video flex items-center justify-center"
                  style={{ background: "oklch(0.17 0.01 250)" }}
                >
                  <p
                    className="text-sm tracking-widest"
                    style={{ color: "oklch(0.4 0.01 250)", fontFamily: "var(--font-corporate)" }}
                  >
                    MORE COMING SOON
                  </p>
                </div>
                <div className="p-7">
                  <p
                    className="text-xs tracking-[0.2em] uppercase mb-2"
                    style={{ color: "oklch(0.4 0.01 250)", fontFamily: "var(--font-corporate)" }}
                  >
                    BRAND 02
                  </p>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: "oklch(0.5 0.01 250)", fontFamily: "var(--font-corporate)" }}
                  >
                    敬請期待
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "oklch(0.4 0.01 250)", fontFamily: "var(--font-corporate)" }}
                  >
                    我們正在籌備更多優質餐飲品牌。
                  </p>
                </div>
              </div>
            </StaggerChild>
          </StaggerGroup>
        </div>
      </section>

      {/* ── 線上商城 ──────────────────────────────────────────── */}
      <section
        style={{ background: "oklch(0.18 0.01 250)" }}
        className="py-24"
      >
        <div className="container px-6">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                  style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                >
                  ONLINE SHOP
                </p>
                <h2
                  className="text-3xl md:text-5xl font-black"
                  style={{ fontFamily: "var(--font-corporate)", color: "oklch(0.95 0.01 85)" }}
                >
                  線上商城
                </h2>
              </div>
              <Link href="/shop">
                <button
                  className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide shrink-0"
                  style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                >
                  前往商城 <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </Reveal>

          <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products && products.length > 0
              ? products.slice(0, 4).map((product) => (
                  <StaggerChild key={product.id}>
                    <Link href={`/shop/product/${product.id}`}>
                      <div
                        className="group overflow-hidden cursor-pointer"
                        style={{
                          background: "oklch(0.21 0.01 250)",
                          border: "1px solid oklch(0.27 0.01 250)",
                          borderRadius: "4px",
                          transition: "border-color 0.25s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.65 0.12 65 / 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.27 0.01 250)";
                        }}
                      >
                        <div className="aspect-square overflow-hidden" style={{ background: "oklch(0.19 0.01 250)" }}>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <img src="/images/corporate-logo.png" alt="宇聯國際" className="w-16 h-16 opacity-10" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3
                            className="font-bold text-sm mb-1 line-clamp-1"
                            style={{ color: "oklch(0.88 0.01 85)", fontFamily: "var(--font-corporate)" }}
                          >
                            {product.name}
                          </h3>
                          <p
                            className="text-sm font-bold"
                            style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                          >
                            NT$ {product.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </StaggerChild>
                ))
              : [
                  { id: "a", src: "/images/products/chili-sauce-1.jpg", name: "台韓辣椒醬（單瓶）", price: 239 },
                  { id: "b", src: "/images/products/chili-sauce-2.jpg", name: "台韓辣椒醬（兩入組）", price: 398 },
                ].map((product) => (
                  <StaggerChild key={product.id}>
                    <Link href="/shop">
                      <div
                        className="group overflow-hidden cursor-pointer"
                        style={{
                          background: "oklch(0.21 0.01 250)",
                          border: "1px solid oklch(0.27 0.01 250)",
                          borderRadius: "4px",
                          transition: "border-color 0.25s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.65 0.12 65 / 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.27 0.01 250)";
                        }}
                      >
                        <div className="aspect-square overflow-hidden" style={{ background: "oklch(0.19 0.01 250)" }}>
                          <img
                            src={product.src}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3
                            className="font-bold text-sm mb-1"
                            style={{ color: "oklch(0.88 0.01 85)", fontFamily: "var(--font-corporate)" }}
                          >
                            {product.name}
                          </h3>
                          <p
                            className="text-sm font-bold"
                            style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                          >
                            NT$ {product.price}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </StaggerChild>
                ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ── 新聞中心 ──────────────────────────────────────────── */}
      <section
        style={{ background: "oklch(0.15 0.01 250)" }}
        className="py-24"
      >
        <div className="container px-6">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.25em] uppercase mb-4"
                  style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                >
                  NEWS
                </p>
                <h2
                  className="text-3xl md:text-5xl font-black"
                  style={{ fontFamily: "var(--font-corporate)", color: "oklch(0.95 0.01 85)" }}
                >
                  新聞中心
                </h2>
              </div>
              <Link href="/corporate/news">
                <button
                  className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide shrink-0"
                  style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
                >
                  查看所有新聞 <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </Reveal>

          {newsItems.length > 0 ? (
            <StaggerGroup className="grid md:grid-cols-3 gap-8">
              {newsItems.slice(0, 3).map((news) => (
                <StaggerChild key={news.id}>
                  <div
                    className="group overflow-hidden cursor-pointer"
                    style={{
                      background: "oklch(0.18 0.01 250)",
                      border: "1px solid oklch(0.25 0.01 250)",
                      borderRadius: "4px",
                      transition: "border-color 0.25s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.65 0.12 65 / 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(0.25 0.01 250)";
                    }}
                    onClick={() => setLocation(`/corporate/news/${news.slug}`)}
                  >
                    <div className="aspect-video overflow-hidden" style={{ background: "oklch(0.16 0.01 250)" }}>
                      {news.coverImage ? (
                        <img
                          src={news.coverImage}
                          alt={news.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <img src="/images/corporate-logo.png" alt="宇聯國際" className="w-12 h-12 opacity-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <p
                        className="text-xs mb-3"
                        style={{ color: "oklch(0.45 0.01 250)", fontFamily: "var(--font-corporate)" }}
                      >
                        {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("zh-TW") : ""}
                      </p>
                      <h3
                        className="font-bold text-base mb-2 line-clamp-2"
                        style={{ color: "oklch(0.88 0.01 85)", fontFamily: "var(--font-corporate)" }}
                      >
                        {news.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed line-clamp-2"
                        style={{ color: "oklch(0.55 0.01 250)", fontFamily: "var(--font-corporate)" }}
                      >
                        {news.excerpt}
                      </p>
                    </div>
                  </div>
                </StaggerChild>
              ))}
            </StaggerGroup>
          ) : (
            <Reveal>
              <p
                className="text-center py-12 text-sm tracking-wider"
                style={{ color: "oklch(0.4 0.01 250)", fontFamily: "var(--font-corporate)" }}
              >
                新聞資訊即將發布
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── 加盟 CTA ──────────────────────────────────────────── */}
      <section
        className="py-28 relative overflow-hidden"
        style={{ background: "oklch(0.19 0.03 65)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, oklch(0.65 0.12 65 / 0.08) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="container px-6 relative z-10">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center">
              <p
                className="text-xs font-semibold tracking-[0.25em] uppercase mb-6"
                style={{ color: "oklch(0.65 0.12 65)", fontFamily: "var(--font-corporate)" }}
              >
                FRANCHISE
              </p>
              <h2
                className="text-3xl md:text-5xl font-black leading-tight mb-6"
                style={{ fontFamily: "var(--font-corporate)", color: "oklch(0.95 0.01 85)" }}
              >
                加入宇聯國際
              </h2>
              <p
                className="text-base leading-loose mb-10"
                style={{ color: "oklch(0.7 0.04 65)", fontFamily: "var(--font-corporate)" }}
              >
                我們提供完善的加盟體系與專業支援，讓您的創業之路更加順利。
                歡迎有志之士加入我們的大家庭。
              </p>
              <Link href="/corporate/franchise">
                <button
                  className="inline-flex items-center gap-2 px-10 py-4 font-semibold text-sm tracking-wide transition-all duration-300"
                  style={{
                    fontFamily: "var(--font-corporate)",
                    background: "oklch(0.65 0.12 65)",
                    color: "oklch(0.15 0.01 250)",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.72 0.14 65)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.65 0.12 65)";
                  }}
                >
                  了解加盟資訊 <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </CorporateLayout>
  );
}

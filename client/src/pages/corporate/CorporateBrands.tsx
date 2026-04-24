import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import CorporateLayout from "@/components/layout/CorporateLayout";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg: "oklch(0.12 0.01 60)",
  bgAlt: "oklch(0.97 0.02 85)",
  bgMid: "oklch(0.17 0.015 65)",
  text: "oklch(0.95 0.01 80)",
  textMuted: "oklch(0.60 0.025 75)",
  textDim: "oklch(0.40 0.02 70)",
  accent: "oklch(0.72 0.14 78)",
  accentDim: "oklch(0.26 0.06 78)",
  divide: "oklch(0.22 0.02 70)",
  divideLight: "oklch(0.88 0.015 85)",
  textOnAlt: "oklch(0.16 0.02 60)",
  textMutedOnAlt: "oklch(0.40 0.02 65)",
};

// ── Reveal helpers ─────────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealLeft({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -48 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

function RevealRight({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: 48 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Brand highlights for 來點什麼 ───────────────────────────────────────────
const brandHighlights = [
  { val: "12", label: "直營暨加盟門市" },
  { val: "2020", label: "創立年份" },
  { val: "台韓混搭", label: "品牌風格" },
];

const brandFeatures = [
  { num: "01", title: "社區型精緻平價", body: "主打 18-35 歲學生與都會上班族，每份早餐都是對在地社區的真誠投入。" },
  { num: "02", title: "台韓混搭街頭感", body: "融合台灣在地食材與韓式料理靈感，打造獨一無二的早午餐體驗。" },
  { num: "03", title: "中央廚房標準化", body: "全面引進中央廚房與數位點餐系統，確保每間門市的品質穩定一致。" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CorporateBrands() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <CorporateLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[80vh] overflow-hidden flex items-end"
        style={{ background: C.bg }}
      >
        {/* 右側滿版圖片 */}
        <motion.div
          style={{ y: bgY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.1 }}
          className="absolute inset-y-0 right-0 w-[58vw] pointer-events-none select-none"
          aria-hidden="true"
        >
          <img
            src="/images/logo-intro-dark.png"
            alt=""
            className="w-full h-full object-cover object-left"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${C.bg} 0%, transparent 40%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${C.bg} 0%, transparent 35%)`,
            }}
          />
        </motion.div>

        {/* 主文字 */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full pb-20 px-6 md:px-12 lg:px-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: C.accentDim, color: C.accent }}
            >
              旗下品牌
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 52 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.18 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(52px, 9.5vw, 128px)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              color: C.text,
            }}
          >
            每個品牌
            <br />
            都是一份
            <br />
            <span style={{ color: C.accent }}>承諾</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: C.textMuted }}
          >
            宇聯國際旗下每個品牌，都承載著同一套核心：誠信、熱忱、對在地社區的長期投入。
          </motion.p>
        </motion.div>

        {/* 滾動提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: C.divide }}
          >
            <div className="w-1 h-1.5 rounded-full" style={{ background: C.textMuted }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 品牌總覽帶 ──────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgMid }}
      >
        <Reveal className="flex items-center gap-6">
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase"
            style={{ color: C.textMuted }}
          >
            現有品牌
          </p>
          <div className="flex-1 h-px" style={{ background: C.divide }} />
          <p className="text-xs" style={{ color: C.textDim }}>1 個品牌 · 更多即將推出</p>
        </Reveal>
      </section>

      {/* ── 來點什麼：主品牌全版展示 ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: C.bg }}
      >
        {/* 品牌號碼浮水印 */}
        <div
          className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(180px, 32vw, 480px)",
              color: C.accentDim,
              letterSpacing: "-0.06em",
              opacity: 0.18,
              display: "block",
              lineHeight: 0.8,
            }}
          >
            01
          </span>
        </div>

        <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-24 pb-16">
          {/* 品牌標題列 */}
          <RevealLeft className="mb-16">
            <div className="flex items-start gap-6 flex-wrap">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: C.accentDim }}
              >
                <img
                  src="/images/brand-logo-yellow.png"
                  alt="來點什麼 ORDER SOME"
                  className="w-14 h-14 object-contain"
                />
              </div>
              <div>
                <p
                  className="text-xs font-bold tracking-[0.22em] uppercase mb-1"
                  style={{ color: C.accent }}
                >
                  Brand 01
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(32px, 5.5vw, 72px)",
                    lineHeight: 0.92,
                    letterSpacing: "-0.03em",
                    color: C.text,
                  }}
                >
                  來點什麼
                  <br />
                  <span style={{ color: C.textMuted, fontSize: "0.52em", letterSpacing: "0.06em", fontFamily: "inherit" }}>
                    ORDER SOME
                  </span>
                </h2>
              </div>
            </div>
          </RevealLeft>

          {/* 主內容：左文右圖 */}
          <div className="grid lg:grid-cols-[1fr_44%] gap-16 lg:gap-24 items-start">
            {/* 左欄：描述 + 特色 + 數字 + CTA */}
            <div>
              <RevealLeft delay={0.05}>
                <p
                  className="text-lg md:text-xl leading-relaxed mb-12 max-w-2xl"
                  style={{ color: C.textMuted }}
                >
                  社區型精緻平價早午餐品牌。從台中東勢山城一間早餐店出發，歷經五年深耕，成長至 12 間直營暨加盟門市。
                  台韓混搭的街頭風格，真材實料的每日早餐，是「點一份期待，嚐一口未來」的具體實踐。
                </p>
              </RevealLeft>

              {/* 三大特色橫線排列 */}
              <div
                className="divide-y mb-14"
                style={{ borderColor: C.divide }}
              >
                {brandFeatures.map((f, i) => (
                  <Reveal key={f.num} delay={i * 0.08}>
                    <div className="py-8 grid sm:grid-cols-[72px_160px_1fr] gap-4 sm:gap-6 items-start">
                      <span
                        className="font-black leading-none"
                        style={{
                          fontFamily: "var(--font-brand)",
                          fontSize: "clamp(26px, 3.5vw, 42px)",
                          color: C.accentDim,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {f.num}
                      </span>
                      <h3
                        className="font-black self-start pt-1"
                        style={{
                          fontSize: "clamp(15px, 1.8vw, 18px)",
                          color: C.text,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {f.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed self-start pt-1"
                        style={{ color: C.textMuted }}
                      >
                        {f.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* 數字帶 */}
              <Reveal delay={0.1}>
                <div
                  className="flex items-center gap-10 flex-wrap pb-14"
                  style={{ borderBottom: `1px solid ${C.divide}` }}
                >
                  {brandHighlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-10">
                      {i > 0 && (
                        <div className="w-px h-10" style={{ background: C.divide }} />
                      )}
                      <div>
                        <p
                          className="font-black leading-none"
                          style={{
                            fontFamily: "var(--font-brand)",
                            fontSize: "clamp(32px, 4.5vw, 56px)",
                            color: C.accent,
                            letterSpacing: "-0.03em",
                          }}
                        >
                          {h.val}
                        </p>
                        <p className="text-xs mt-1.5" style={{ color: C.textMuted }}>
                          {h.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* CTA */}
              <Reveal delay={0.15} className="pt-10">
                <div className="flex flex-wrap gap-4 items-center">
                  <Link href="/brand">
                    <motion.button
                      className="inline-flex items-center gap-3 px-8 py-4 font-bold text-base"
                      style={{
                        background: C.accent,
                        color: "oklch(0.12 0.01 60)",
                        borderRadius: "4px",
                        boxShadow: `0 8px 32px oklch(0.72 0.14 78 / 0.35)`,
                      }}
                      whileHover={{
                        y: -2,
                        boxShadow: "0 12px 40px oklch(0.72 0.14 78 / 0.55)",
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      前往品牌官網
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                  <Link href="/brand/franchise">
                    <motion.button
                      className="inline-flex items-center gap-3 px-8 py-4 font-bold text-base border"
                      style={{
                        borderColor: C.divide,
                        color: C.text,
                        background: "transparent",
                        borderRadius: "4px",
                      }}
                      whileHover={{
                        borderColor: C.accent,
                        color: C.accent,
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      了解品牌加盟
                    </motion.button>
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* 右欄：品牌視覺 */}
            <RevealRight delay={0.1}>
              <div className="sticky top-24">
                {/* 主視覺圖 */}
                <div
                  className="relative overflow-hidden mb-4"
                  style={{ borderRadius: "2px 48px 2px 48px" }}
                >
                  <img
                    src="/images/logo-intro-desktop.png"
                    alt="來點什麼 ORDER SOME 品牌形象"
                    className="w-full aspect-[3/4] object-cover object-center"
                  />
                  {/* 底部金色融入遮罩 */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top, ${C.bg} 0%, transparent 40%)`,
                    }}
                  />
                </div>

                {/* 口號帶 */}
                <div
                  className="px-6 py-5"
                  style={{
                    background: C.accentDim,
                    borderRadius: "4px",
                  }}
                >
                  <p
                    className="font-black text-center"
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: "clamp(16px, 2vw, 22px)",
                      color: C.accent,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    「點一份期待，嚐一口未來。」
                  </p>
                </div>
              </div>
            </RevealRight>
          </div>
        </div>
      </section>

      {/* ── 食物預覽小圖帶 ──────────────────────────────────────────────────── */}
      <section
        className="py-16 px-6 md:px-12 lg:px-20 overflow-hidden"
        style={{ background: C.bgMid }}
      >
        <Reveal className="mb-8">
          <p className="text-xs font-bold tracking-[0.22em] uppercase" style={{ color: C.textDim }}>
            代表菜色
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <div
            className="grid grid-cols-3 md:grid-cols-6 gap-3"
          >
            {[
              { src: "/images/food/korean-tuna-bento.jpg", alt: "韓式鮪魚便當" },
              { src: "/images/food/peanut-bacon-toast.jpg", alt: "花生培根吐司" },
              { src: "/images/food/tuna-egg-crepe.jpg", alt: "鮪魚蛋可麗餅" },
              { src: "/images/food/seaweed-roll.jpg", alt: "海苔飯捲" },
              { src: "/images/food/tuna-onigiri.jpg", alt: "鮪魚飯糰" },
              { src: "/images/food/tofu-salad.jpg", alt: "豆腐沙拉" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="aspect-square overflow-hidden"
                style={{ borderRadius: "4px" }}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: i * 0.06 }}
              >
                <motion.img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── 即將推出品牌 ────────────────────────────────────────────────────── */}
      <section
        className="py-32 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt }}
      >
        <Reveal className="mb-16">
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
            style={{ color: C.accent }}
          >
            Brand 02+
          </p>
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(32px, 4.5vw, 58px)",
              color: C.textOnAlt,
              letterSpacing: "-0.02em",
            }}
          >
            下一個品牌
            <br />
            正在醞釀中
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-px" style={{ background: C.divideLight }}>
          {[
            { label: "餐飲品牌", hint: "持續深耕台灣中部市場" },
            { label: "加盟生態系", hint: "讓敢拚的人有舞台可站" },
            { label: "在地夥伴", hint: "每個社區的好鄰居" },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                className="px-8 py-12"
                style={{ background: C.bgAlt }}
              >
                <div
                  className="w-10 h-0.5 mb-8"
                  style={{ background: C.divideLight }}
                />
                <p
                  className="font-black mb-3"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(20px, 2.5vw, 28px)",
                    color: C.textOnAlt,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.textMutedOnAlt }}>
                  {item.hint}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10">
          <p className="text-sm" style={{ color: C.textMutedOnAlt }}>
            宇聯國際持續評估新品牌機會，以相同的核心價值延伸至更多在地市場。敬請期待。
          </p>
        </Reveal>
      </section>

      {/* ── 引言帶 ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-36 px-6 overflow-hidden"
        style={{ background: C.accent }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(120px, 26vw, 360px)",
              color: "oklch(0.62 0.18 78)",
              letterSpacing: "-0.04em",
              opacity: 0.28,
            }}
          >
            BRANDS
          </span>
        </div>

        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-bold tracking-[0.28em] uppercase mb-8"
            style={{ color: "oklch(0.30 0.08 75)" }}
          >
            宇聯品牌哲學
          </p>
          <h2
            className="font-black leading-tight mb-8"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(28px, 4.5vw, 58px)",
              color: "oklch(0.12 0.01 60)",
              letterSpacing: "-0.02em",
            }}
          >
            一個品牌，
            <br />
            就是一份對地方的承諾。
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: "oklch(0.30 0.06 70)" }}
          >
            不是每個品牌都需要全台展店。我們在乎的是：這個品牌在它所在的社區，是否真的被需要、被珍惜。
          </p>
        </Reveal>
      </section>

      {/* ── CTA 底帶 ────────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <Reveal className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 max-w-5xl">
          <div>
            <h3
              className="font-black mb-2"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(26px, 4vw, 52px)",
                color: C.text,
                letterSpacing: "-0.02em",
              }}
            >
              深入了解宇聯
            </h3>
            <p style={{ color: C.textMuted }}>探索企業文化，或洽詢加盟合作機會。</p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/corporate/about">
              <motion.button
                className="px-8 py-4 font-bold text-base"
                style={{
                  background: C.accent,
                  color: "oklch(0.12 0.01 60)",
                  borderRadius: "4px",
                  boxShadow: `0 8px 32px oklch(0.72 0.14 78 / 0.35)`,
                }}
                whileHover={{
                  y: -2,
                  boxShadow: "0 12px 40px oklch(0.72 0.14 78 / 0.55)",
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                關於宇聯國際
              </motion.button>
            </Link>
            <Link href="/corporate/franchise">
              <motion.button
                className="px-8 py-4 font-bold text-base border"
                style={{
                  borderColor: C.divide,
                  color: C.text,
                  background: "transparent",
                  borderRadius: "4px",
                }}
                whileHover={{
                  borderColor: C.accent,
                  color: C.accent,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                企業加盟合作
              </motion.button>
            </Link>
          </div>
        </Reveal>
      </section>
    </CorporateLayout>
  );
}

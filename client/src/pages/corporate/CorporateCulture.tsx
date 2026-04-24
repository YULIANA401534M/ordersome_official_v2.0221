import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "wouter";
import CorporateLayout from "@/components/layout/CorporateLayout";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

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

// ── Data ───────────────────────────────────────────────────────────────────────
const principles = [
  {
    num: "01",
    title: "根基於誠信，成就參天事業",
    body: "我們視「誠信」為最核心的價值與所有行為的基石。從食材選用到夥伴合作，言必信、行必果。",
  },
  {
    num: "02",
    title: "珍視公司榮譽，恪盡職守",
    body: "我們珍惜公司的名譽，絕不利用職務之便謀取私人利益，以身作則保護品牌信任。",
  },
  {
    num: "03",
    title: "擁抱團隊合作，相互成就",
    body: "尊重並服從團隊的指揮與分工，透過坦誠的溝通與協作達成目標，共好才能共榮。",
  },
  {
    num: "04",
    title: "專注本業，共創最大價值",
    body: "全心投入於創造公司與個人的最大價值，把精力放在真正重要的事情上。",
  },
  {
    num: "05",
    title: "嚴守機密，保護共同資產",
    body: "公司的業務機密與智慧財產是寶貴的共同資產，我們用相互信任的方式加以守護。",
  },
  {
    num: "06",
    title: "主動積極，擁抱挑戰",
    body: "以正面態度迎接任務與挑戰，不畏艱難、不推諉拖延，把每個難題當作成長的機會。",
  },
  {
    num: "07",
    title: "展現專業，注重形象",
    body: "專業的形象是贏得信任的第一步。從服裝儀容到言行舉止，都代表著品牌的臉面。",
  },
  {
    num: "08",
    title: "善始善終，負責到底",
    body: "每日以負責的態度完成工作，確保任務告一段落，不留尾巴、不留遺憾。",
  },
];

const commitments = [
  {
    num: "01",
    title: "學習即進步",
    body: "我們不設學歷門檻，提供結構化的內部培訓體系，讓每個人都有清晰的成長路徑。",
  },
  {
    num: "02",
    title: "制度即保護",
    body: "標準化流程不是束縛，而是讓每個人都能站在同一起跑線，靠實力競爭、靠努力晉升。",
  },
  {
    num: "03",
    title: "共好即共榮",
    body: "我們的成功建立在彼此的成就。當團隊的每一個人都在進步，整個生態系才能向上。",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CorporateCulture() {
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
        className="relative min-h-[92vh] overflow-hidden flex items-end"
        style={{ background: C.bg }}
      >
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
              企業文化
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
            不是靠
            <br />
            運氣，
            <br />
            <span style={{ color: C.accent }}>靠制度</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: C.textMuted }}
          >
            宇聯國際的文化，不是貼在牆上的標語，
            而是每一位夥伴每天用行動刻進去的痕跡。
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            className="mt-12 flex items-center gap-8 flex-wrap"
          >
            {[
              { val: "8", label: "行動準則" },
              { val: "100+", label: "團隊成員" },
              { val: "2020", label: "創立年份" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && (
                  <div className="w-px h-10" style={{ background: C.divide }} />
                )}
                <div>
                  <p
                    className="text-4xl font-black leading-none"
                    style={{ fontFamily: "var(--font-brand)", color: C.accent }}
                  >
                    {item.val}
                  </p>
                  <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

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

      {/* ── 核心宣言帶 ──────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgMid }}
      >
        <div className="max-w-5xl">
          <Reveal>
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-10"
              style={{ color: C.accent }}
            >
              我們的信念
            </p>
          </Reveal>
          <RevealLeft>
            <blockquote
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(26px, 4vw, 52px)",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                color: C.text,
              }}
            >
              我們相信：不是每個人都有背景，
              <br />
              但每個人都值得一次翻身的機會。
              <br />
              <span style={{ color: C.accent }}>
                而我們，就是要做那個讓努力有出口的品牌。
              </span>
            </blockquote>
          </RevealLeft>
          <Reveal delay={0.2}>
            <div className="mt-12 h-0.5 w-20" style={{ background: C.accent }} />
          </Reveal>
        </div>
      </section>

      {/* ── 八大行動準則 ────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(32px, 4.5vw, 58px)",
              color: C.text,
              letterSpacing: "-0.02em",
            }}
          >
            員工行動準則
          </h2>
          <p className="mt-3 text-base max-w-xl" style={{ color: C.textMuted }}>
            為了實現我們共同的願景，打造每一位夥伴都能引以為傲、持續成長的工作環境。
          </p>
        </Reveal>

        <div className="divide-y" style={{ borderColor: C.divide }}>
          {principles.map((p, i) => (
            <Reveal key={p.num} delay={i * 0.05}>
              <motion.div
                className="py-8 grid md:grid-cols-[100px_220px_1fr] gap-6 items-start group cursor-default"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <span
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    color: C.accentDim,
                    letterSpacing: "-0.04em",
                    transition: "color 0.3s",
                  }}
                >
                  {p.num}
                </span>
                <h3
                  className="font-black self-center"
                  style={{
                    fontSize: "clamp(15px, 1.6vw, 20px)",
                    color: C.text,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-base leading-relaxed self-center"
                  style={{ color: C.textMuted }}
                >
                  {p.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 職場環境三大承諾 ────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl">
          <RevealLeft delay={0.05}>
            <p
              className="text-xs font-bold tracking-[0.22em] uppercase mb-6"
              style={{ color: C.accent }}
            >
              職場環境
            </p>
            <h2
              className="font-black mb-8"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(32px, 4.5vw, 58px)",
                color: C.textOnAlt,
                letterSpacing: "-0.02em",
              }}
            >
              讓每個人
              <br />
              都站在
              <br />
              同一起跑線
            </h2>
            <p
              className="text-base leading-relaxed max-w-sm"
              style={{ color: C.textMutedOnAlt }}
            >
              宇聯的職場文化從來不靠「血統」，而是靠制度和執行力。
              我們為每位夥伴提供清晰的培訓路徑、透明的晉升機制，
              以及一個說到做到的工作環境。
            </p>
            <div className="mt-10 h-0.5 w-16" style={{ background: C.accent }} />
          </RevealLeft>

          <div className="divide-y" style={{ borderColor: C.divideLight }}>
            {commitments.map((c, i) => (
              <RevealRight key={c.num} delay={i * 0.1}>
                <div className="py-10">
                  <div className="flex items-start gap-6">
                    <span
                      className="font-black leading-none shrink-0"
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontSize: "clamp(36px, 4.5vw, 56px)",
                        color: C.accent,
                        letterSpacing: "-0.04em",
                        opacity: 0.55,
                      }}
                    >
                      {c.num}
                    </span>
                    <div>
                      <h3
                        className="font-black mb-3"
                        style={{
                          fontSize: "clamp(18px, 2vw, 24px)",
                          color: C.textOnAlt,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {c.title}
                      </h3>
                      <p
                        className="text-base leading-relaxed"
                        style={{ color: C.textMutedOnAlt }}
                      >
                        {c.body}
                      </p>
                    </div>
                  </div>
                </div>
              </RevealRight>
            ))}
          </div>
        </div>
      </section>

      {/* ── 引言帶 CULTURE ──────────────────────────────────────────────────── */}
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
              fontSize: "clamp(100px, 22vw, 320px)",
              color: "oklch(0.62 0.18 78)",
              letterSpacing: "-0.04em",
              opacity: 0.28,
            }}
          >
            CULTURE
          </span>
        </div>

        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-bold tracking-[0.28em] uppercase mb-8"
            style={{ color: "oklch(0.30 0.08 75)" }}
          >
            攜手成長，共創卓越
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
            做出好早餐，
            <br />
            扶起好老闆，
            <br />
            點燃好社區。
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: "oklch(0.30 0.06 70)" }}
          >
            這句話，不只是我們的口號，而是我們每天回到工作崗位的理由。
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
              成為我們的夥伴
            </h3>
            <p style={{ color: C.textMuted }}>
              認同我們的文化，歡迎洽詢加盟合作或企業聯絡。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/corporate/franchise">
              <button
                className="px-8 py-4 rounded-full font-bold text-base transition-all duration-200"
                style={{
                  background: C.accent,
                  color: "oklch(0.12 0.01 60)",
                  boxShadow: `0 8px 32px oklch(0.72 0.14 78 / 0.35)`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px oklch(0.72 0.14 78 / 0.55)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px oklch(0.72 0.14 78 / 0.35)`;
                }}
              >
                企業加盟合作
              </button>
            </Link>
            <Link href="/corporate/contact">
              <button
                className="px-8 py-4 rounded-full font-bold text-base border-2 transition-all duration-200"
                style={{
                  borderColor: C.divide,
                  color: C.text,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = C.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.divide;
                  (e.currentTarget as HTMLButtonElement).style.color = C.text;
                }}
              >
                聯絡我們
              </button>
            </Link>
          </div>
        </Reveal>
      </section>
    </CorporateLayout>
  );
}

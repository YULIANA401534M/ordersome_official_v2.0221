import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "wouter";
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

// ── Data ───────────────────────────────────────────────────────────────────────
const metrics = [
  { val: "12", label: "直營暨加盟門市" },
  { val: "2020", label: "創立年份" },
  { val: "5+", label: "年品牌耕耘" },
  { val: "100+", label: "團隊成員" },
];

const visionMission = [
  {
    num: "01",
    title: "企業願景",
    quote: "Every Breakfast, A Bold Beginning.",
    body: "每份早餐，都是改變人生的起點。我們的願景，是在 2030 年前成為中部地區最具影響力的連鎖早午餐品牌——不只是好吃的店，而是讓人從小吃到大、出社會後還會回來的品牌。",
  },
  {
    num: "02",
    title: "企業使命",
    quote: "Made for Makers. 讓敢拚的人，有系統可依。",
    body: "打造一個來自街頭、長在地方、做得起來也帶得出去的連鎖早餐品牌。在一個連鎖靠資本、開店看背景的時代，我們選擇走不一樣的路：用制度而不是靠運氣，靠執行而不是靠血統。",
  },
];

const values = [
  {
    num: "01",
    title: "手心向下",
    body: "主動付出，樂於助人，因為我們知道幫助別人成功，就是成就自己。",
  },
  {
    num: "02",
    title: "誠信為先",
    body: "說到做到，對食材、對顧客、對夥伴都不欺不瞞。",
  },
  {
    num: "03",
    title: "態度制勝",
    body: "學歷、經歷都不設限，關鍵在於學習的姿態與執行的速度。",
  },
  {
    num: "04",
    title: "制度即保護",
    body: "標準化流程不是束縛，而是讓每個人都能站在同一起跑線。",
  },
  {
    num: "05",
    title: "共好共榮",
    body: "我們的成功建立在彼此的成就，凝聚成一個向上的生態系。",
  },
];

const team = [
  { name: "Leo", title: "董事長 / 創辦人" },
  { name: "Dennis", title: "董事 / 法律顧問" },
  { name: "Peggy", title: "共同創辦人 / 營運長" },
  { name: "Joseph", title: "來點什麼 / 品牌總監" },
];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CorporateAbout() {
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
        {/* 右側滿版圖片：logo-intro-dark 已是深色背景，直接裁切右半融入 */}
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
          {/* 左側漸層遮罩讓圖片自然融入背景 */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${C.bg} 0%, transparent 40%)`,
            }}
          />
          {/* 底部遮罩 */}
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
              style={{
                background: C.accentDim,
                color: C.accent,
              }}
            >
              關於宇聯國際
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
            用誠信
            <br />
            建立的
            <br />
            <span style={{ color: C.accent }}>企業</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: C.textMuted }}
          >
            宇聯國際文化餐飲，從台中東勢山城一間早餐店出發，
            以制度和誠信搭建一個讓敢拚的人都能長期站穩的舞台。
          </motion.p>

          {/* 數字條預覽 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            className="mt-12 flex items-center gap-8 flex-wrap"
          >
            {[
              { val: "2020", label: "創立年份" },
              { val: "12", label: "間門市" },
              { val: "100+", label: "團隊成員" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && (
                  <div
                    className="w-px h-10"
                    style={{ background: C.divide }}
                  />
                )}
                <div>
                  <p
                    className="text-4xl font-black leading-none"
                    style={{
                      fontFamily: "var(--font-brand)",
                      color: C.accent,
                    }}
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
            <div
              className="w-1 h-1.5 rounded-full"
              style={{ background: C.textMuted }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 企業故事 ────────────────────────────────────────────────────────── */}
      <section
        className="py-28"
        style={{ background: C.bgAlt }}
      >
        <div className="px-6 md:px-12 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl">
            {/* 文字 */}
            <RevealLeft delay={0.05}>
              <p
                className="text-xs font-bold tracking-[0.22em] uppercase mb-6"
                style={{ color: C.accent }}
              >
                企業故事
              </p>
              <h2
                className="font-black mb-10"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "clamp(32px, 4.5vw, 58px)",
                  color: C.textOnAlt,
                  letterSpacing: "-0.02em",
                }}
              >
                從一間早餐店
                <br />
                到十二個據點
              </h2>
              <div
                className="space-y-5 text-base leading-relaxed"
                style={{ color: C.textMutedOnAlt }}
              >
                <p>
                  宇聯國際文化餐飲有限公司成立於 2020 年，由一群充滿熱情的年輕創業家所創立。
                  我們從台中東勢山城出發，秉持著「推廣自己愛吃的東西」的初心，
                  將長輩經營二十一年的傳統早餐店，翻轉成全新的街頭台韓品牌。
                </p>
                <p>
                  疫情間開展品牌並沒有澆熄這份熱血，反而讓我們更確定早餐不只是果腹，
                  而是一種讓人重新出發的力量。我們拆掉老舊裝潢、重新設計動線，
                  引進中央廚房與數位點餐系統——但我們沒有拆掉的是「誠信、熱忱、創新」這三顆螺絲。
                </p>
                <p>
                  短短數年間，我們從 1 家偏遠山區的門市成長至 10 多家直營與加盟門市，
                  靠的不是行銷話術，而是一份份真材實料的早餐，
                  和一句句「早安，今天來點什麼？」的親切問候。
                </p>
              </div>
              <div
                className="mt-10 h-0.5 w-16"
                style={{ background: C.accent }}
              />
            </RevealLeft>

            {/* 圖片 */}
            <RevealRight delay={0.12}>
              <div
                className="aspect-[4/3] overflow-hidden relative"
                style={{ borderRadius: "32px 0 32px 0" }}
              >
                <img
                  src="/images/logo-intro-dark.png"
                  alt="宇聯國際 YULIAN"
                  className="w-full h-full object-cover object-center"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, transparent 55%, oklch(0.97 0.02 85) 100%)`,
                  }}
                />
              </div>
            </RevealRight>
          </div>
        </div>
      </section>

      {/* ── 核心數字帶 ──────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: C.bg }}
      >
        <Reveal>
          <div
            className="grid grid-cols-2 md:grid-cols-4 divide-x"
            style={{ borderColor: C.divide }}
          >
            {metrics.map((m, i) => (
              <div key={i} className="px-8 py-4 first:pl-0">
                <p
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(40px, 6vw, 80px)",
                    color: C.accent,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {m.val}
                </p>
                <p
                  className="mt-2 text-sm"
                  style={{ color: C.textMuted }}
                >
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── 願景與使命 ──────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(32px, 4.5vw, 58px)",
              color: C.textOnAlt,
              letterSpacing: "-0.02em",
            }}
          >
            我們為何而做
          </h2>
        </Reveal>

        <div
          className="divide-y max-w-4xl"
          style={{ borderColor: C.divideLight }}
        >
          {visionMission.map((item, i) => (
            <Reveal key={item.num} delay={i * 0.1}>
              <div className="py-12 grid md:grid-cols-[140px_1fr] gap-8 items-start">
                <span
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(52px, 7vw, 88px)",
                    color: C.accent,
                    letterSpacing: "-0.04em",
                    opacity: 0.45,
                  }}
                >
                  {item.num}
                </span>
                <div>
                  <h3
                    className="font-bold mb-3"
                    style={{
                      fontSize: "clamp(16px, 2vw, 22px)",
                      color: C.textMutedOnAlt,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="font-black mb-4"
                    style={{
                      fontSize: "clamp(18px, 2.2vw, 26px)",
                      color: C.textOnAlt,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    「{item.quote}」
                  </p>
                  <p
                    className="text-base leading-relaxed max-w-2xl"
                    style={{ color: C.textMutedOnAlt }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 核心價值觀 ──────────────────────────────────────────────────────── */}
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
            核心價值觀
          </h2>
        </Reveal>

        <div
          className="divide-y"
          style={{ borderColor: C.divide }}
        >
          {values.map((v, i) => (
            <Reveal key={v.num} delay={i * 0.07}>
              <motion.div
                className="py-8 grid md:grid-cols-[100px_200px_1fr] gap-6 items-start group cursor-default"
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
                  {v.num}
                </span>
                <h3
                  className="font-black self-center"
                  style={{
                    fontSize: "clamp(18px, 2vw, 24px)",
                    color: C.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {v.title}
                </h3>
                <p
                  className="text-base leading-relaxed self-center"
                  style={{ color: C.textMuted }}
                >
                  {v.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 經營團隊 ────────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgMid }}
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
            經營團隊
          </h2>
          <p
            className="mt-3 text-base"
            style={{ color: C.textMuted }}
          >
            帶領宇聯國際持續深耕台中在地市場
          </p>
        </Reveal>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x"
          style={{ borderColor: C.divide }}
        >
          {team.map((person, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="px-0 sm:px-8 py-8 sm:py-0 first:pl-0">
                <div
                  className="w-12 h-0.5 mb-6"
                  style={{ background: C.accent }}
                />
                <p
                  className="font-black mb-1"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(22px, 2.5vw, 30px)",
                    color: C.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {person.name}
                </p>
                <p
                  className="text-sm"
                  style={{ color: C.textMuted }}
                >
                  {person.title}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 引言帶 ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-36 px-6 overflow-hidden"
        style={{ background: C.accent }}
      >
        {/* 背景裝飾大字 */}
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
            VISION
          </span>
        </div>

        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-bold tracking-[0.28em] uppercase mb-8"
            style={{ color: "oklch(0.30 0.08 75)" }}
          >
            我們的承諾
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
            一間店，就是一個人的未來。一份餐，就是一次改變的起點。
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
            <p style={{ color: C.textMuted }}>
              探索旗下品牌，或洽詢企業加盟合作機會。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/corporate/brands">
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
                了解旗下品牌
              </button>
            </Link>
            <Link href="/corporate/franchise">
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
                企業加盟合作
              </button>
            </Link>
          </div>
        </Reveal>
      </section>
    </CorporateLayout>
  );
}

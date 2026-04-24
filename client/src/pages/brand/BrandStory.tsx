import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import BrandLayout from "@/components/layout/BrandLayout";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

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

const milestones = [
  {
    year: "2018",
    title: "一個念頭",
    body: "創辦人旅行韓國歸來，帶著滿腦子「為什麼台灣沒有這種東西」的念頭，在東勢山城的老家廚房開始試做第一份韓式飯捲。",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/cAkpoRocvsmsyigJ.png",
    imageAlt: "韓式飯捲、台式蛋餅初代組合",
  },
  {
    year: "2020",
    title: "第一間店",
    body: "台中東勢，第一家「來點什麼」正式開幕。菜單只有十二項，但每一項都是反覆測試後才敢上桌的東西。開幕三個月內，排隊人龍延伸到街角。",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg",
    imageAlt: "慶尚道辣炒豬，東勢開幕招牌",
  },
  {
    year: "2022",
    title: "台中全面展店",
    body: "從東勢往台中市區延伸，北屯、太平、豐原相繼開幕。不同地區的顧客口味有所不同，但「真材實料、不說廢話」的核心沒有妥協。",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/CApeTRjJBNflTLdV.jpg",
    imageAlt: "混醬厚片，台中各店共同招牌",
  },
  {
    year: "2024",
    title: "十二間門市",
    body: "目前遍佈台中12個據點，從早上六點到凌晨兩點持續供應。每間店保持同樣的食材標準與製作流程，讓你在任何一間都能吃到一樣的味道。",
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/iJelVRmLamxKoAet.png",
    imageAlt: "十二間門市，早午餐全日供應",
  },
];

const principles = [
  {
    num: "01",
    title: "真材實料",
    body: "沒有人工添加物的藉口，也沒有偷工減料的空間。每一份餐點的食材都經過嚴格挑選，做到什麼程度就端出什麼。",
  },
  {
    num: "02",
    title: "台韓混血",
    body: "我們不是韓國料理，也不是台灣早餐店。是兩者最好的部分放在同一個盤子裡：韓式辣味的層次、台式食材的親切感。",
  },
  {
    num: "03",
    title: "全時段供應",
    body: "06:00 到 02:00，無論你是趕早班的工人還是宵夜返家的夜貓子，都應該有一個選擇。這不是口號，是我們的每日承諾。",
  },
];

export default function BrandStory() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <BrandLayout>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] overflow-hidden flex items-end"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        {/* 背景大字視差 */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(100px, 22vw, 360px)",
              color: "oklch(0.92 0.06 85)",
              letterSpacing: "-0.04em",
            }}
          >
            STORY
          </span>
        </motion.div>

        {/* 右側圖片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: 60 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.2 }}
          className="absolute top-16 right-0 w-[42vw] max-w-[520px] aspect-[3/4] overflow-hidden"
          style={{ borderRadius: "0 0 0 36% 0" }}
        >
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663285169742/VjlyUhcBYLeXUEcB.jpg"
            alt="慶尚道辣炒豬，來點什麼招牌菜"
            className="w-full h-full object-cover"
            style={{ filter: "saturate(1.05)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom left, transparent 55%, oklch(0.97 0.02 85) 100%)",
            }}
          />
        </motion.div>

        {/* 主文字區 */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full pb-20 px-6 md:px-12 lg:px-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.98 0.01 85)",
              }}
            >
              我們的故事
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.18 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(56px, 10vw, 130px)",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              color: "oklch(0.18 0.02 60)",
            }}
          >
            從山城出發
            <br />
            用一口飯糰
            <br />
            說一個故事
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.38 }}
            className="mt-8 max-w-md text-base md:text-lg leading-relaxed"
            style={{ color: "oklch(0.42 0.03 60)" }}
          >
            台中東勢，2020 年。一間不到十坪的早餐店，
            把韓式味道帶進台灣的清晨。
          </motion.p>

          {/* 數字條 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex items-center gap-8 flex-wrap"
          >
            {[
              { val: "2020", label: "創立年份" },
              { val: "12", label: "間門市" },
              { val: "06–02", label: "供應時段" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && (
                  <div
                    className="w-px h-10"
                    style={{ background: "oklch(0.85 0.03 85)" }}
                  />
                )}
                <div>
                  <p
                    className="text-4xl font-black leading-none"
                    style={{
                      fontFamily: "var(--font-brand)",
                      color: "oklch(0.75 0.18 70)",
                    }}
                  >
                    {item.val}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.03 70)" }}>
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
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
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

      {/* ── 品牌起源引言 ──────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.18 0.02 60)" }}
      >
        <Reveal className="max-w-3xl mx-auto text-center">
          <p
            className="font-black leading-tight"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(28px, 4.5vw, 58px)",
              color: "oklch(0.97 0.02 85)",
              letterSpacing: "-0.02em",
            }}
          >
            「如果我自己每天都願意吃，
            <br />
            那才值得賣給別人。」
          </p>
          <p
            className="mt-6 text-sm tracking-widest uppercase"
            style={{ color: "oklch(0.75 0.18 70)" }}
          >
            創辦人理念
          </p>
        </Reveal>
      </section>

      {/* ── 時間軸故事 ──────────────────────────────────────── */}
      <section
        className="py-28"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <div className="px-6 md:px-12 lg:px-20">
          <Reveal>
            <h2
              className="font-black mb-20"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(36px, 5.5vw, 72px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.02em",
              }}
            >
              走到現在的
              <span style={{ color: "oklch(0.75 0.18 70)" }}>四個節點</span>
            </h2>
          </Reveal>

          <div className="space-y-32">
            {milestones.map((m, i) => (
              <div
                key={m.year}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  i % 2 === 1 ? "" : ""
                }`}
              >
                {/* 文字側 */}
                <RevealLeft
                  delay={0.05}
                  className={i % 2 === 1 ? "md:order-2" : ""}
                >
                  <span
                    className="font-black leading-none block mb-4"
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: "clamp(56px, 10vw, 120px)",
                      color: "oklch(0.92 0.08 75)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {m.year}
                  </span>
                  <h3
                    className="font-black mb-5"
                    style={{
                      fontSize: "clamp(22px, 3vw, 36px)",
                      color: "oklch(0.18 0.02 60)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {m.title}
                  </h3>
                  <p
                    className="leading-relaxed text-base md:text-lg max-w-prose"
                    style={{ color: "oklch(0.42 0.03 60)" }}
                  >
                    {m.body}
                  </p>
                  <div
                    className="mt-8 h-0.5 w-16"
                    style={{ background: "oklch(0.75 0.18 70)" }}
                  />
                </RevealLeft>

                {/* 圖片側 */}
                <RevealRight
                  delay={0.12}
                  className={i % 2 === 1 ? "md:order-1" : ""}
                >
                  <div
                    className="aspect-[4/3] overflow-hidden"
                    style={{
                      borderRadius: i % 2 === 0 ? "0 32px 32px 0" : "32px 0 0 32px",
                    }}
                  >
                    <motion.img
                      src={m.image}
                      alt={m.imageAlt}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                </RevealRight>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 核心理念 ──────────────────────────────────────────── */}
      <section
        className="py-28 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.13 0.015 60)" }}
      >
        <Reveal className="mb-16">
          <h2
            className="font-black"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(36px, 5.5vw, 72px)",
              color: "oklch(0.97 0.02 85)",
              letterSpacing: "-0.02em",
            }}
          >
            我們堅持的
            <span style={{ color: "oklch(0.75 0.18 70)" }}>三件事</span>
          </h2>
        </Reveal>

        <div className="space-y-0 divide-y" style={{ borderColor: "oklch(0.22 0.02 60)" }}>
          {principles.map((p, i) => (
            <Reveal key={p.num} delay={i * 0.1}>
              <div className="py-10 grid md:grid-cols-[120px_1fr] gap-8 items-start group">
                <span
                  className="font-black leading-none"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "clamp(48px, 7vw, 88px)",
                    color: "oklch(0.30 0.04 70)",
                    letterSpacing: "-0.04em",
                    transition: "color 0.3s",
                  }}
                >
                  {p.num}
                </span>
                <div>
                  <h3
                    className="font-black mb-4"
                    style={{
                      fontSize: "clamp(20px, 2.5vw, 30px)",
                      color: "oklch(0.97 0.02 85)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="leading-relaxed text-base max-w-2xl"
                    style={{ color: "oklch(0.62 0.04 70)" }}
                  >
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 願景：暖黃浸染帶 ─────────────────────────────────── */}
      <section
        className="relative py-36 px-6 overflow-hidden"
        style={{ background: "oklch(0.75 0.18 70)" }}
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
              fontSize: "clamp(120px, 25vw, 340px)",
              color: "oklch(0.70 0.20 70)",
              letterSpacing: "-0.04em",
              opacity: 0.5,
            }}
          >
            VISION
          </span>
        </div>

        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase mb-8"
            style={{ color: "oklch(0.50 0.12 70)" }}
          >
            未來展望
          </p>
          <h2
            className="font-black leading-tight mb-8"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(32px, 5vw, 64px)",
              color: "oklch(0.18 0.02 60)",
              letterSpacing: "-0.02em",
            }}
          >
            讓每一個台灣人，
            <br />
            都能在來點什麼
            <br />
            找到屬於自己的那一口
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: "oklch(0.35 0.06 65)" }}
          >
            不停在同一個模子裡複製，而是讓每間店都在地紮根，
            持續研發新品，讓「來點什麼」成為台灣早午餐文化的一部分。
          </p>
        </Reveal>
      </section>

      {/* ── 底部 CTA ────────────────────────────────────────── */}
      <section
        className="py-24 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        <Reveal className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 max-w-5xl mx-auto">
          <div>
            <h3
              className="font-black mb-2"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(26px, 4vw, 52px)",
                color: "oklch(0.18 0.02 60)",
                letterSpacing: "-0.02em",
              }}
            >
              想親自嘗嘗嗎？
            </h3>
            <p style={{ color: "oklch(0.50 0.03 60)" }}>
              找到離你最近的門市，今天就來點什麼。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a href="/brand/menu">
              <button
                className="px-8 py-4 rounded-full font-bold text-base transition-all duration-200"
                style={{
                  background: "oklch(0.75 0.18 70)",
                  color: "oklch(0.98 0.01 85)",
                  boxShadow: "0 8px 32px oklch(0.75 0.18 70 / 0.4)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-2px)";
                  (
                    e.currentTarget as HTMLButtonElement
                  ).style.boxShadow =
                    "0 12px 40px oklch(0.75 0.18 70 / 0.55)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (
                    e.currentTarget as HTMLButtonElement
                  ).style.boxShadow =
                    "0 8px 32px oklch(0.75 0.18 70 / 0.4)";
                }}
              >
                看完整菜單
              </button>
            </a>
            <a href="/brand/stores">
              <button
                className="px-8 py-4 rounded-full font-bold text-base border-2 transition-all duration-200"
                style={{
                  borderColor: "oklch(0.18 0.02 60)",
                  color: "oklch(0.18 0.02 60)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "oklch(0.18 0.02 60)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.97 0.02 85)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.18 0.02 60)";
                }}
              >
                找附近門市
              </button>
            </a>
          </div>
        </Reveal>
      </section>
    </BrandLayout>
  );
}

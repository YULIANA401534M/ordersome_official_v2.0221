import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const C = {
  bg: "oklch(0.12 0.01 60)",
  bgAlt: "oklch(0.97 0.02 85)",
  bgMid: "oklch(0.17 0.015 65)",
  text: "oklch(0.95 0.01 80)",
  textMuted: "oklch(0.60 0.025 75)",
  accent: "oklch(0.72 0.14 78)",
  accentDim: "oklch(0.26 0.06 78)",
  divide: "oklch(0.22 0.02 70)",
  divideLight: "oklch(0.88 0.015 85)",
  textOnAlt: "oklch(0.16 0.02 60)",
  textMutedOnAlt: "oklch(0.40 0.02 65)",
  textDimOnAlt: "oklch(0.60 0.02 70)",
};

// ── Reveal (for static sections only — NOT for async data) ────────────────────
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
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type NewsPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: string | Date | null;
  category?: string;
};

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(d?: string | Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ── Category pill ─────────────────────────────────────────────────────────────
function CategoryPill({ label, dark = false }: { label?: string; dark?: boolean }) {
  if (!label) return null;
  return (
    <span
      className="inline-block text-xs font-bold tracking-[0.12em] px-2.5 py-1 rounded-full"
      style={
        dark
          ? { background: C.accentDim, color: C.accent }
          : { background: "oklch(0.90 0.06 80)", color: "oklch(0.45 0.10 72)" }
      }
    >
      {label}
    </span>
  );
}

// ── Featured card (first post, horizontal layout) ─────────────────────────────
function FeaturedCard({ news, onClick }: { news: NewsPost; onClick: () => void }) {
  return (
    <motion.article
      className="group cursor-pointer grid md:grid-cols-[1fr_1fr] gap-0 overflow-hidden"
      style={{ background: C.bgMid, borderRadius: "2px" }}
      onClick={onClick}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
    >
      {/* 圖片 */}
      <div className="relative overflow-hidden" style={{ minHeight: "280px" }}>
        {news.coverImage ? (
          <motion.img
            src={news.coverImage}
            alt={news.title}
            className="w-full h-full object-cover"
            style={{ position: "absolute", inset: 0 }}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: C.bg }}
          >
            <span
              className="font-black select-none"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(48px, 8vw, 96px)",
                color: C.accentDim,
                letterSpacing: "-0.04em",
              }}
            >
              NEWS
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, transparent 60%, oklch(0.17 0.015 65) 100%)",
          }}
        />
      </div>

      {/* 文字 */}
      <div className="flex flex-col justify-center px-10 py-12">
        <div className="flex items-center gap-3 mb-5">
          <CategoryPill label={news.category ?? "集團動態"} dark />
          <span
            className="text-xs tracking-[0.14em]"
            style={{ color: C.textMuted }}
          >
            {formatDate(news.publishedAt)}
          </span>
        </div>

        <h2
          className="font-black mb-4 group-hover:underline underline-offset-4"
          style={{
            fontSize: "clamp(20px, 2.2vw, 30px)",
            color: C.text,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            textDecorationColor: C.accent,
            maxWidth: "38ch",
          }}
        >
          {news.title}
        </h2>

        {news.excerpt && (
          <p
            className="text-sm leading-[1.75] line-clamp-3"
            style={{
              color: C.textMuted,
              maxWidth: "50ch",
            }}
          >
            {news.excerpt}
          </p>
        )}

        <div className="mt-8 flex items-center gap-2" style={{ color: C.accent }}>
          <span className="text-xs font-bold tracking-[0.16em] uppercase">閱讀全文</span>
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </motion.article>
  );
}

// ── Standard card (grid items) ────────────────────────────────────────────────
function NewsCard({ news, index, onClick }: { news: NewsPost; index: number; onClick: () => void }) {
  return (
    <motion.article
      className="group cursor-pointer"
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: index * 0.06 }}
    >
      {/* 圖片區 */}
      <div
        className="relative w-full overflow-hidden mb-5"
        style={{
          paddingTop: "60%",
          background: "oklch(0.91 0.03 82)",
        }}
      >
        <div className="absolute inset-0">
          {news.coverImage ? (
            <motion.img
              src={news.coverImage}
              alt={news.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "oklch(0.91 0.03 82)" }}
            >
              <span
                className="font-black select-none"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "clamp(28px, 4vw, 48px)",
                  color: "oklch(0.82 0.04 80)",
                  letterSpacing: "-0.04em",
                }}
              >
                NEWS
              </span>
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <CategoryPill label={news.category ?? "集團動態"} />
        </div>
      </div>

      {/* 文字區 — 精確的排版層次 */}
      <div>
        {/* 日期：最小，最淡，最上 */}
        <p
          className="text-xs tracking-[0.14em] mb-2.5"
          style={{ color: C.textDimOnAlt }}
        >
          {formatDate(news.publishedAt)}
        </p>

        {/* 標題：最大，最重，主角 */}
        <h3
          className="font-bold leading-snug mb-3 line-clamp-2"
          style={{
            fontSize: "clamp(16px, 1.6vw, 20px)",
            color: C.textOnAlt,
            letterSpacing: "-0.01em",
            maxWidth: "32ch",
          }}
        >
          <span
            className="group-hover:underline underline-offset-4"
            style={{ textDecorationColor: C.accent }}
          >
            {news.title}
          </span>
        </h3>

        {/* 摘要：最小，最淡，補充 */}
        {news.excerpt && (
          <p
            className="text-sm leading-[1.7] line-clamp-2"
            style={{
              color: C.textMutedOnAlt,
              maxWidth: "42ch",
            }}
          >
            {news.excerpt}
          </p>
        )}
      </div>
    </motion.article>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = ["餐飲新聞", "加盟快報", "品牌動態", "集團公告"];
const PAGE_SIZE = 9;

export default function CorporateNews() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { data, isLoading } = trpc.content.getPublishedPosts.useQuery({
    publishTarget: "corporate",
    category: categoryFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const posts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const featuredPost = page === 1 && !categoryFilter ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  const handleCategoryChange = (cat: string | undefined) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  return (
    <CorporateLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative pt-36 pb-24 px-6 md:px-12 lg:px-20 overflow-hidden"
        style={{ background: C.bg }}
      >
        {/* 右側大字水印 */}
        <motion.div
          style={{ y: bgY }}
          className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(120px, 24vw, 380px)",
              color: C.accentDim,
              letterSpacing: "-0.04em",
              opacity: 0.55,
            }}
          >
            NEWS
          </span>
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-6"
          >
            <span
              className="text-xs font-bold tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: C.accentDim, color: C.accent }}
            >
              新聞中心
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: EASE_OUT_EXPO, delay: 0.18 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(52px, 9vw, 118px)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: C.text,
            }}
          >
            掌握
            <span style={{ color: C.accent }}>集團</span>
            <br />
            最新動態
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.35 }}
            className="mt-7 text-base md:text-lg leading-[1.75]"
            style={{
              color: C.textMuted,
              maxWidth: "46ch",
            }}
          >
            餐飲新聞、加盟快報、品牌動態與集團公告，
            第一手掌握宇聯國際的每一個重要時刻。
          </motion.p>
        </motion.div>
      </section>

      {/* ── 文章列表 ────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: C.bgAlt }}
      >
        {/* 分類篩選 Tab */}
        <Reveal className="mb-12">
          <div className="flex items-center gap-2 flex-wrap">
            {[{ label: "全部", value: undefined }, ...CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))].map(
              ({ label, value }) => {
                const active = value === categoryFilter;
                return (
                  <button
                    key={label}
                    onClick={() => handleCategoryChange(value)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={
                      active
                        ? { background: C.textOnAlt, color: C.bgAlt }
                        : {
                            background: "transparent",
                            color: C.textMutedOnAlt,
                            border: `1.5px solid ${C.divideLight}`,
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
                        (e.currentTarget as HTMLButtonElement).style.color = C.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = C.divideLight;
                        (e.currentTarget as HTMLButtonElement).style.color = C.textMutedOnAlt;
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>
        </Reveal>

        {/* 載入中 */}
        {isLoading && (
          <div className="py-24 text-center text-sm" style={{ color: C.textDimOnAlt }}>
            載入中...
          </div>
        )}

        {/* 內容：非同步資料一律直接 animate，不綁 useInView */}
        {!isLoading && posts.length > 0 && (
          <div className="space-y-16">
            {/* 精選首篇：橫版全幅（僅第一頁且無分類篩選時出現） */}
            {featuredPost && (
              <FeaturedCard
                news={featuredPost as NewsPost}
                onClick={() => setLocation(`/corporate/news/${featuredPost.slug}`)}
              />
            )}

            {/* 其餘文章：三欄格子 */}
            {gridPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
                {gridPosts.map((news, i) => (
                  <NewsCard
                    key={news.id}
                    news={news as NewsPost}
                    index={i}
                    onClick={() => setLocation(`/corporate/news/${news.slug}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 空狀態 */}
        {!isLoading && posts.length === 0 && (
          <div className="py-32 text-center">
            <p
              className="font-black mb-3"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(40px, 6vw, 72px)",
                color: C.divideLight,
                letterSpacing: "-0.02em",
              }}
            >
              即將發布
            </p>
            <p className="text-base" style={{ color: C.textDimOnAlt }}>
              集團消息敬請期待
            </p>
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-16">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{
                border: `1.5px solid ${C.divideLight}`,
                color: C.textMutedOnAlt,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                if (page > 1) {
                  (e.currentTarget as HTMLButtonElement).style.background = C.textOnAlt;
                  (e.currentTarget as HTMLButtonElement).style.color = C.bgAlt;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.textOnAlt;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = C.textMutedOnAlt;
                (e.currentTarget as HTMLButtonElement).style.borderColor = C.divideLight;
              }}
            >
              上一頁
            </button>
            <span className="text-sm tabular-nums" style={{ color: C.textDimOnAlt }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30"
              style={{
                border: `1.5px solid ${C.divideLight}`,
                color: C.textMutedOnAlt,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                if (page < totalPages) {
                  (e.currentTarget as HTMLButtonElement).style.background = C.textOnAlt;
                  (e.currentTarget as HTMLButtonElement).style.color = C.bgAlt;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.textOnAlt;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = C.textMutedOnAlt;
                (e.currentTarget as HTMLButtonElement).style.borderColor = C.divideLight;
              }}
            >
              下一頁
            </button>
          </div>
        )}
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
              探索企業加盟，或直接聯絡我們的合作窗口。
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
                style={{ borderColor: C.divide, color: C.text, background: "transparent" }}
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

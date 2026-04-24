import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const CATEGORY_OPTIONS = ["餐飲新聞", "加盟快報", "品牌動態", "集團公告"];
const PAGE_SIZE = 9;

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
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  );
}

type NewsPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: string | Date | null;
  category?: string;
};

function NewsCard({
  news,
  onClick,
}: {
  news: NewsPost;
  onClick: () => void;
}) {
  const dateStr = news.publishedAt
    ? new Date(news.publishedAt).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  return (
    <motion.article
      className="group cursor-pointer"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
    >
      {/* 圖片 */}
      <div
        className="relative w-full overflow-hidden mb-4"
        style={{
          paddingTop: "62%",
          borderRadius: "12px",
          background: "oklch(0.90 0.04 80)",
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
              style={{ background: "oklch(0.90 0.05 80)" }}
            >
              <img
                src="/images/brand-icon.png"
                alt="來點什麼"
                className="w-12 h-12 opacity-20"
              />
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "oklch(0.75 0.18 70)",
              color: "oklch(0.18 0.02 60)",
            }}
          >
            {news.category ?? "最新消息"}
          </span>
        </div>
      </div>

      {/* 文字 */}
      <div>
        <p
          className="text-xs mb-2"
          style={{ color: "oklch(0.60 0.04 70)" }}
        >
          {dateStr}
        </p>
        <h3
          className="font-bold leading-snug mb-2 line-clamp-2"
          style={{
            fontSize: "clamp(15px, 1.5vw, 18px)",
            color: "oklch(0.18 0.02 60)",
            textDecoration: "none",
          }}
        >
          <span
            className="group-hover:underline underline-offset-2"
            style={{ textDecorationColor: "oklch(0.75 0.18 70)" }}
          >
            {news.title}
          </span>
        </h3>
        {news.excerpt && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "oklch(0.50 0.03 60)" }}
          >
            {news.excerpt}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export default function BrandNews() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined
  );

  const { data, isLoading } = trpc.content.getPublishedPosts.useQuery({
    publishTarget: "brand",
    category: categoryFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const posts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleCategoryChange = (cat: string | undefined) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  return (
    <BrandLayout>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-20 px-6 md:px-12 lg:px-20 overflow-hidden"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        {/* 背景大字裝飾 */}
        <div
          className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(120px, 22vw, 340px)",
              color: "oklch(0.92 0.05 85)",
              letterSpacing: "-0.04em",
            }}
          >
            NEWS
          </span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.98 0.01 85)",
              }}
            >
              最新消息
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.12 }}
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(52px, 9vw, 110px)",
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "oklch(0.18 0.02 60)",
            }}
          >
            掌握
            <span style={{ color: "oklch(0.75 0.18 70)" }}>動態</span>
            <br />
            不錯過任何
            <br />
            一件事
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.3 }}
            className="mt-6 text-base md:text-lg leading-relaxed max-w-sm"
            style={{ color: "oklch(0.46 0.03 60)" }}
          >
            品牌動態、加盟快報、最新優惠，都在這裡。
          </motion.p>
        </div>
      </section>

      {/* ── 文章列表 ──────────────────────────────────────────── */}
      <section
        className="py-20 px-6 md:px-12 lg:px-20"
        style={{ background: "oklch(0.97 0.02 85)" }}
      >
        {/* 分類篩選 */}
        <Reveal className="mb-12">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={
                !categoryFilter
                  ? {
                      background: "oklch(0.18 0.02 60)",
                      color: "oklch(0.97 0.02 85)",
                    }
                  : {
                      background: "transparent",
                      color: "oklch(0.46 0.03 60)",
                      border: "1.5px solid oklch(0.82 0.04 80)",
                    }
              }
            >
              全部
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={
                  categoryFilter === cat
                    ? {
                        background: "oklch(0.75 0.18 70)",
                        color: "oklch(0.18 0.02 60)",
                      }
                    : {
                        background: "transparent",
                        color: "oklch(0.46 0.03 60)",
                        border: "1.5px solid oklch(0.82 0.04 80)",
                      }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        {/* 載入中 */}
        {isLoading && (
          <div
            className="text-center py-20 text-sm"
            style={{ color: "oklch(0.60 0.03 70)" }}
          >
            載入中...
          </div>
        )}

        {/* 文章格子：直接 animate，不綁 useInView（資料非同步載入） */}
        {posts.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {posts.map((news, i) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    ease: EASE_OUT_EXPO,
                    delay: i * 0.06,
                  }}
                >
                  <NewsCard
                    news={news as NewsPost}
                    onClick={() => setLocation(`/news/${news.slug}`)}
                  />
                </motion.div>
              ))}
            </div>

            {/* 分頁 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30"
                  style={{
                    border: "1.5px solid oklch(0.82 0.04 80)",
                    color: "oklch(0.36 0.03 60)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (page > 1) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "oklch(0.18 0.02 60)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "oklch(0.97 0.02 85)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "oklch(0.36 0.03 60)";
                  }}
                >
                  上一頁
                </button>
                <span
                  className="text-sm"
                  style={{ color: "oklch(0.55 0.03 60)" }}
                >
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30"
                  style={{
                    border: "1.5px solid oklch(0.82 0.04 80)",
                    color: "oklch(0.36 0.03 60)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (page < totalPages) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "oklch(0.18 0.02 60)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "oklch(0.97 0.02 85)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "oklch(0.36 0.03 60)";
                  }}
                >
                  下一頁
                </button>
              </div>
            )}
          </>
        )}

        {/* 空狀態 */}
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-28">
            <p
              className="font-black mb-3"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(36px, 5vw, 60px)",
                color: "oklch(0.88 0.06 80)",
                letterSpacing: "-0.02em",
              }}
            >
              即將發布
            </p>
            <p
              className="text-base"
              style={{ color: "oklch(0.60 0.03 70)" }}
            >
              最新消息敬請期待
            </p>
          </div>
        )}
      </section>
    </BrandLayout>
  );
}

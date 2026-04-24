import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const CATEGORY_OPTIONS = ["品牌活動", "加盟消息", "新品資訊", "媒體報導"];
const PAGE_SIZE = 9;

export default function BrandNews() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

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
      <section className="px-6 pb-10 pt-6 md:pb-12 md:pt-10">
        <div className="container">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#fff1bf] px-4 py-2 text-xs font-semibold tracking-[0.2em] text-[#9d7400]">
              NEWS
            </p>
            <h1 className="mt-5 text-[clamp(2.7rem,6vw,5rem)] font-black tracking-[-0.06em] text-[#181512]">
              有新消息，
              <span className="block">就放這裡</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#675e50] md:text-lg">
              活動、新品、加盟資訊，整理乾淨就好，不需要太多裝飾。
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-24">
        <div className="container">
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                !categoryFilter ? "bg-[#181512] text-white" : "border border-[#d8ccb6] bg-white text-[#675e50]"
              }`}
            >
              全部
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  categoryFilter === cat ? "bg-[#181512] text-white" : "border border-[#d8ccb6] bg-white text-[#675e50]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading && <div className="py-16 text-center text-[#8b826f]">消息整理中...</div>}

          {posts.length > 0 && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((news) => (
                  <Card
                    key={news.id}
                    className="cursor-pointer overflow-hidden rounded-[28px] border border-[#ece1c7] bg-white shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)] transition-transform hover:-translate-y-1"
                    onClick={() => setLocation(`/news/${news.slug}`)}
                  >
                    <div className="relative w-full pt-[56.25%]">
                      <div className="absolute inset-0 bg-[#fff8e8]">
                        {news.coverImage ? (
                          <img src={news.coverImage} alt={news.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="h-14 w-auto opacity-30" />
                          </div>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#fff1bf] px-2.5 py-1 text-xs text-[#8c6a00]">
                          {(news as any).category || "最新消息"}
                        </span>
                        <span className="text-xs text-[#8b826f]">
                          {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("zh-TW") : ""}
                        </span>
                      </div>
                      <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#181512] line-clamp-2">
                        {news.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[#675e50] line-clamp-3">{news.excerpt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full border border-[#d8ccb6] bg-white px-5 py-2 text-sm text-[#675e50] disabled:opacity-40"
                  >
                    上一頁
                  </button>
                  <span className="text-sm text-[#8b826f]">
                    第 {page} / {totalPages} 頁
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-full border border-[#d8ccb6] bg-white px-5 py-2 text-sm text-[#675e50] disabled:opacity-40"
                  >
                    下一頁
                  </button>
                </div>
              )}
            </>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="rounded-[32px] border border-[#ece1c7] bg-white px-6 py-16 text-center shadow-[0_18px_50px_-44px_rgba(91,66,18,0.25)]">
              <img src="/logos/brand-logo-yellow.png" alt="來點什麼" className="mx-auto h-16 w-auto opacity-35" />
              <p className="mt-6 text-lg font-semibold text-[#181512]">目前還沒有新消息</p>
              <p className="mt-2 text-sm text-[#8b826f]">之後活動和新品更新會整理在這裡。</p>
            </div>
          )}
        </div>
      </section>
    </BrandLayout>
  );
}

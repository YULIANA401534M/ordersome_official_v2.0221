import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const CATEGORY_OPTIONS = ["餐飲新聞", "加盟快報", "品牌動態", "集團公告"];
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
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-amber-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              最新消息
            </h1>
            <p className="text-lg text-gray-600">
              掌握來點什麼的最新動態與優惠活動
            </p>
          </div>
        </div>
      </section>

      {/* News List */}
      <section className="py-12">
        <div className="container">
          {/* 分類篩選 */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${!categoryFilter ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              全部
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${categoryFilter === cat ? "bg-primary text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-12 text-gray-500">載入中...</div>
          )}

          {posts.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((news) => (
                  <Card
                    key={news.id}
                    className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/news/${news.slug}`)}
                  >
                    {/* 16:9 圖片 */}
                    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                      <div className="absolute inset-0 bg-gray-100">
                        {news.coverImage ? (
                          <img
                            src={news.coverImage}
                            alt={news.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src="/images/brand-icon.png"
                              alt="來點什麼"
                              className="w-16 h-16 opacity-20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {(news as any).category ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {(news as any).category}
                          </span>
                        ) : (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            最新消息
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("zh-TW") : ""}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{news.excerpt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分頁 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    上一頁
                  </button>
                  <span className="text-sm text-gray-600">
                    第 {page} 頁 / 共 {totalPages} 頁
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    下一頁
                  </button>
                </div>
              )}
            </>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <img
                src="/images/brand-icon.png"
                alt="來點什麼"
                className="w-24 h-24 mx-auto mb-6 opacity-30"
              />
              <p className="text-gray-500 text-lg">最新消息即將發布</p>
              <p className="text-gray-400 mt-2">敬請期待我們的最新動態</p>
            </div>
          )}
        </div>
      </section>
    </BrandLayout>
  );
}

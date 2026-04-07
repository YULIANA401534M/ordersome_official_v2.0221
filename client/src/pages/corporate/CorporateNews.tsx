import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const CATEGORY_OPTIONS = ["餐飲新聞", "加盟快報", "品牌動態", "集團公告"];
const PAGE_SIZE = 9;

export default function CorporateNews() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = trpc.content.getPublishedPosts.useQuery({
    publishTarget: "corporate",
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
    <CorporateLayout>
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">新聞中心</h1>
          <p className="text-xl text-gray-300">掌握宇聯國際的最新動態</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container">
          {/* 分類篩選 */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${!categoryFilter ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              全部
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${categoryFilter === cat ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                    <div className="absolute inset-0 bg-gray-200" />
                  </div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((news) => (
                  <Card
                    key={news.id}
                    className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/corporate/news/${news.slug}`)}
                  >
                    {/* 16:9 圖片 */}
                    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                      <div className="absolute inset-0 bg-gray-100">
                        {news.coverImage ? (
                          <img src={news.coverImage} alt={news.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <img src="/images/corporate-logo.png" alt="宇聯國際" className="w-16 h-16 opacity-20" />
                          </div>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {(news as any).category && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                            {(news as any).category}
                          </span>
                        )}
                        <p className="text-xs text-gray-500">
                          {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("zh-TW") : ""}
                        </p>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
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
          ) : (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">新聞資訊即將發布</p>
              <p className="text-sm mt-2">請持續關注我們的最新動態</p>
            </div>
          )}
        </div>
      </section>
    </CorporateLayout>
  );
}

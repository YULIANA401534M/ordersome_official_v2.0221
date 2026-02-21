import { Card, CardContent } from "@/components/ui/card";
import BrandLayout from "@/components/layout/BrandLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function BrandNews() {
  const [, setLocation] = useLocation();
  const { data: newsItems, isLoading } = trpc.content.getPublishedPosts.useQuery({ publishTarget: "brand" });

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
          {isLoading && (
            <div className="text-center py-12 text-gray-500">
              載入中...
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems?.map((news) => (
              <Card 
                key={news.id} 
                className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/news/${news.slug}`)}
              >
                <div className="aspect-video bg-gray-100">
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
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      最新消息
                    </span>
                    <span className="text-xs text-gray-500">
                      {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('zh-TW') : ''}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{news.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!newsItems || newsItems.length === 0) && !isLoading && (
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

import { Card, CardContent } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function CorporateNews() {
  const [, setLocation] = useLocation();
  const { data: newsItems, isLoading } = trpc.content.getPublishedPosts.useQuery({ publishTarget: "corporate" });

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
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <div className="aspect-video bg-gray-200" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : newsItems && newsItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsItems.map((news) => (
                <Card 
                  key={news.id} 
                  className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/corporate/news/${news.slug}`)}
                >
                  <div className="aspect-video bg-gray-100">
                    {news.coverImage ? (
                      <img src={news.coverImage} alt={news.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img src="/images/corporate-logo.png" alt="宇聯國際" className="w-16 h-16 opacity-20" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <p className="text-xs text-gray-500 mb-2">{news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('zh-TW') : ''}</p>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{news.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
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

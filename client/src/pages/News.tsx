import { trpc } from "../lib/trpc";
import { Calendar, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import BrandHeader from "../components/layout/BrandHeader";
import BrandFooter from "../components/layout/BrandFooter";

export default function News() {
  const [, setLocation] = useLocation();
  const { data: posts, isLoading } = trpc.content.getPublishedPosts.useQuery({ publishTarget: "brand" });

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">最新消息</h1>
            <p className="text-lg text-gray-600">掌握來點什麼的最新動態與活動資訊</p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-600">載入中...</div>
            </div>
          )}

          {/* Posts Grid */}
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => setLocation(`/news/${post.slug}`)}
                >
                  {/* Cover Image */}
                  {post.coverImage ? (
                    <div className="h-56 bg-gray-200 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <span className="text-white text-6xl font-bold opacity-20">來點</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : ""}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-yellow-600 transition">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}

                    {/* Read More */}
                    <button className="text-yellow-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                      閱讀更多
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-600">目前尚無最新消息</p>
              </div>
            )
          )}
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

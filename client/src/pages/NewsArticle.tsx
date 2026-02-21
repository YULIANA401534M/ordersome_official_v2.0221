import { trpc } from "../lib/trpc";
import { Calendar, ArrowLeft, User } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import BrandHeader from "../components/layout/BrandHeader";
import BrandFooter from "../components/layout/BrandFooter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function NewsArticle() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug || "";

  const { data: post, isLoading, error } = trpc.content.getPostBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">載入中...</div>
        </main>
        <BrandFooter />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h1>
            <button
              onClick={() => setLocation("/news")}
              className="text-yellow-600 font-semibold hover:underline"
            >
              返回新聞列表
            </button>
          </div>
        </main>
        <BrandFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => setLocation("/news")}
            className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            返回新聞列表
          </button>

          {/* Article */}
          <article className="bg-white">
            {/* Cover Image */}
            {post.coverImage && (
              <div className="w-full aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-xl mb-8 shadow-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">{post.title}</h1>

              {/* Meta Info */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("zh-TW", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  宇聯編輯部
                </div>
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="text-xl text-gray-600 mb-10 leading-relaxed font-medium bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  {post.excerpt}
                </div>
              )}

              {/* Content with Markdown */}
              <div className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-yellow-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-bold prose-ul:my-6 prose-ol:my-6 prose-li:text-gray-700 prose-img:rounded-lg prose-img:shadow-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>
          </article>

          {/* Back Button Bottom */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <button
              onClick={() => setLocation("/news")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              返回新聞列表
            </button>
          </div>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

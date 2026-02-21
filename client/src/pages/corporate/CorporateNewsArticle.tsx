import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, User, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CorporateNewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = trpc.content.getPostBySlug.useQuery({ slug: slug || "" });

  if (isLoading) {
    return (
      <CorporateLayout>
        <div className="container py-20">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </CorporateLayout>
    );
  }

  if (!post) {
    return (
      <CorporateLayout>
        <div className="container py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">文章不存在</h1>
            <p className="text-gray-600 mb-8">抱歉，您要查看的文章不存在或已被刪除。</p>
            <Link href="/corporate/news">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回新聞列表
              </Button>
            </Link>
          </div>
        </div>
      </CorporateLayout>
    );
  }

  return (
    <CorporateLayout>
      {/* Breadcrumb */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="container">
          <Link href="/corporate/news">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-white">
              <ChevronLeft className="h-4 w-4" />
              返回新聞列表
            </Button>
          </Link>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-16">
        <div className="container max-w-4xl">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg aspect-video">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-amber-600" />
              <span>宇聯國際</span>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="bg-amber-50 border-l-4 border-amber-600 p-6 mb-8 rounded-r-lg">
              <p className="text-lg text-gray-700 leading-relaxed italic">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                a: ({node, ...props}) => <a className="text-amber-600 hover:text-amber-700 underline" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
                ),
                code: ({node, inline, ...props}: any) => 
                  inline ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-amber-600" {...props} />
                  ) : (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm" {...props} />
                  ),
                img: ({node, ...props}) => (
                  <img className="rounded-lg shadow-md my-6 w-full" {...props} />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Back Button */}
          <div className="mt-12 pt-8 border-t">
            <Link href="/corporate/news">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                返回新聞列表
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </CorporateLayout>
  );
}

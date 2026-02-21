import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, Clock, Share2, Link as LinkIcon, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import CorporateLayout from "@/components/layout/CorporateLayout";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

function calcReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return Math.max(1, Math.ceil(text.length / 500));
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CorporateNewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const { data: post, isLoading } = trpc.content.getPostBySlug.useQuery({ slug: slug || "" });

  useEffect(() => {
    const handleScroll = () => {
      const article = articleRef.current;
      if (!article) return;
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const progress = Math.min(
        100,
        Math.max(
          0,
          ((scrollTop - articleTop + windowHeight * 0.3) / (articleHeight - windowHeight * 0.5)) * 100
        )
      );
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      });
    }
  };

  if (isLoading) {
    return (
      <CorporateLayout>
        <div className="container py-20">
          <div className="flex items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
            <p className="text-gray-500">載入文章中...</p>
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

  const readingTime = calcReadingTime(post.content);
  const isHtml = post.content.trim().startsWith("<");

  return (
    <CorporateLayout>
      {/* 閱讀進度條 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        {post.coverImage ? (
          <>
            <div className="absolute inset-0">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-gray-900/40" />
            </div>
            <div className="relative z-10 container py-24 md:py-32">
              <Link href="/corporate/news">
                <button className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  返回新聞中心
                </button>
              </Link>
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">{post.title}</h1>
                {post.excerpt && (
                  <p className="text-lg text-gray-300 mb-8 leading-relaxed">{post.excerpt}</p>
                )}
                <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    約 {readingTime} 分鐘閱讀
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="relative z-10 container py-20">
            <Link href="/corporate/news">
              <button className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                返回新聞中心
              </button>
            </Link>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">{post.title}</h1>
              {post.excerpt && (
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">{post.excerpt}</p>
              )}
              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  約 {readingTime} 分鐘閱讀
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Article Content */}
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <article
            ref={articleRef}
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-lg prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline"
          >
            {isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <Streamdown>{post.content}</Streamdown>
            )}
          </article>

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm font-medium text-gray-500">分享這篇文章</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  <LinkIcon className="w-4 h-4" />
                  複製連結
                </button>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <Link href="/corporate/news">
              <button className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                返回新聞中心列表
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Copy Link Toast */}
      {showShareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          連結已複製到剪貼簿！
        </div>
      )}
    </CorporateLayout>
  );
}

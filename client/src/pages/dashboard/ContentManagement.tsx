import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { FileText, Plus, Edit2, Trash2, Eye, Calendar, User } from "lucide-react";
import { useLocation } from "wouter";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

type PostStatus = "draft" | "published";

const CATEGORY_OPTIONS = ["餐飲新聞", "加盟快報", "品牌動態", "集團公告"];

export default function ContentManagement() {
  const [, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { data: posts, isLoading, refetch } = trpc.content.listPosts.useQuery(
    categoryFilter !== "all" ? { category: categoryFilter } : undefined
  );
  const deletePostMutation = trpc.content.deletePost.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDelete = (postId: number, title: string) => {
    if (confirm(`確定要刪除文章「${title}」嗎？`)) {
      deletePostMutation.mutate({ postId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="py-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">內容管理系統</h1>
            </div>
            <p className="text-gray-600">管理網站新聞文章和部落格內容</p>
          </div>

          {/* Action Bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                全部
              </button>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${categoryFilter === cat ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setLocation("/dashboard/content/new")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              建立新文章
            </button>
          </div>

          {/* Posts Grid */}
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                  {/* Cover Image */}
                  {post.coverImage && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Status Badge + Category */}
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          post.scheduledAt && new Date(post.scheduledAt) > new Date()
                            ? "bg-amber-100 text-amber-800"
                            : post.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {post.scheduledAt && new Date(post.scheduledAt) > new Date()
                          ? "排程中"
                          : post.status === "published"
                          ? "已發布"
                          : "草稿"}
                      </span>
                      {(post as any).category && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {(post as any).category}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.status === "published" && post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
                          : post.scheduledAt
                          ? `排程：${new Date(post.scheduledAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                          : "草稿未發布"}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        作者 #{post.authorId}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {post.status === "published" && (
                        <button
                          onClick={() => setLocation(`/news/${post.slug}`)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          預覽
                        </button>
                      )}
                      <button
                        onClick={() => setLocation(`/dashboard/content/edit/${post.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">尚無文章</h3>
              <p className="text-gray-600 mb-6">開始建立您的第一篇文章吧！</p>
              <button
                onClick={() => setLocation("/dashboard/content/new")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                建立新文章
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}

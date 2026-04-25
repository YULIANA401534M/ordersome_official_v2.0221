import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { FileText, Plus, Edit2, Trash2, Eye, Calendar, User } from "lucide-react";
import { useLocation } from "wouter";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";

type PostStatus = "draft" | "published";

const CATEGORY_OPTIONS = ["餐飲新聞", "加盟快報", "品牌動態", "集團公告"];

const amberBtn: React.CSSProperties = { background: "var(--os-amber)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };

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

  const getStatusBadge = (post: any) => {
    if (post.scheduledAt && new Date(post.scheduledAt) > new Date()) {
      return { label: "排程中", color: "var(--os-warning)", bg: "var(--os-warning-bg)" };
    }
    if (post.status === "published") {
      return { label: "已發布", color: "var(--os-success)", bg: "var(--os-success-bg)" };
    }
    return { label: "草稿", color: "var(--os-text-3)", bg: "var(--os-surface-2)" };
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "var(--os-text-3)", fontSize: 14 }}>
          載入中...
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div style={{ background: "var(--os-bg)", minHeight: "100vh", padding: 20 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-1)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FileText style={{ width: 20, height: 20, color: "var(--os-amber)" }} />內容管理系統
            </h1>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2 }}>管理網站新聞文章和部落格內容</p>
          </div>
          <Button onClick={() => setLocation("/dashboard/content/new")} className="gap-1.5 text-white" style={{ background: "var(--os-amber)" }}>
            <Plus style={{ width: 16, height: 16 }} />建立新文章
          </Button>
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", ...CATEGORY_OPTIONS].map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer",
                  border: "none", transition: "all 0.15s",
                  background: active ? "var(--os-amber)" : "var(--os-surface)",
                  color: active ? "#fff" : "var(--os-text-2)",
                  boxShadow: active ? "none" : "0 0 0 1px var(--os-border)",
                }}>
                {cat === "all" ? "全部" : cat}
              </button>
            );
          })}
        </div>

        {/* Posts Grid */}
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post: any) => {
              const badge = getStatusBadge(post);
              return (
                <div key={post.id}
                  style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-amber)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px oklch(0.75 0.18 70 / 0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--os-border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>

                  {/* Cover Image */}
                  {post.coverImage && (
                    <div style={{ height: 180, background: "var(--os-surface-2)", overflow: "hidden" }}>
                      <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <div style={{ padding: 20 }}>
                    {/* Badges */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                      {(post as any).category && (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, color: "var(--os-info)", background: "var(--os-info-bg)" }}>
                          {(post as any).category}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p style={{ fontSize: 12, color: "var(--os-text-3)", marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--os-text-3)", marginBottom: 14, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar style={{ width: 12, height: 12 }} />
                        {post.status === "published" && post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
                          : post.scheduledAt
                          ? `排程：${new Date(post.scheduledAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                          : "草稿未發布"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <User style={{ width: 12, height: 12 }} />作者 #{post.authorId}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {post.status === "published" && (
                        <button onClick={() => setLocation(`/news/${post.slug}`)}
                          style={{ flex: 1, padding: "7px 0", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface-2)", color: "var(--os-text-2)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <Eye style={{ width: 13, height: 13 }} />預覽
                        </button>
                      )}
                      <button onClick={() => setLocation(`/dashboard/content/edit/${post.id}`)}
                        style={{ flex: 1, padding: "7px 0", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Edit2 style={{ width: 13, height: 13 }} />編輯
                      </button>
                      <button onClick={() => handleDelete(post.id, post.title)}
                        style={{ padding: "7px 12px", border: "1px solid var(--os-danger-bg)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-danger)", fontSize: 12, cursor: "pointer" }}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: "64px 0", textAlign: "center" }}>
            <FileText style={{ width: 48, height: 48, color: "var(--os-text-3)", margin: "0 auto 12px", opacity: 0.4 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)", marginBottom: 6 }}>尚無文章</h3>
            <p style={{ fontSize: 13, color: "var(--os-text-3)", marginBottom: 20 }}>開始建立您的第一篇文章吧！</p>
            <Button onClick={() => setLocation("/dashboard/content/new")} className="gap-1.5 text-white" style={{ background: "var(--os-amber)" }}>
              <Plus style={{ width: 16, height: 16 }} />建立新文章
            </Button>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}

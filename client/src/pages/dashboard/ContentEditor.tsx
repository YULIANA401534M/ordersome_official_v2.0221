import { useState, useEffect, lazy, Suspense } from "react";
import { trpc } from "../../lib/trpc";
const RichTextEditor = lazy(() => import("@/components/RichTextEditor"));
import { Save, ArrowLeft, Eye } from "lucide-react";
import { useLocation, useRoute } from "wouter";

const inputSt: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid var(--os-border)", borderRadius: 8, fontSize: 13, background: "var(--os-surface)", color: "var(--os-text-1)", outline: "none" };
const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--os-text-2)", display: "block", marginBottom: 6 };

export default function ContentEditor() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/dashboard/content/edit/:id");
  const postId = params?.id ? parseInt(params.id) : null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishTargets, setPublishTargets] = useState<("corporate" | "brand")[]>(["brand"]);
  const [category, setCategory] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: post, isLoading } = trpc.content.getPostById.useQuery(
    { postId: postId! },
    { enabled: !!postId }
  );

  const createPostMutation = trpc.content.createPost.useMutation({
    onSuccess: () => { alert("文章已建立！"); setLocation("/dashboard/content"); },
  });

  const updatePostMutation = trpc.content.updatePost.useMutation({
    onSuccess: () => { alert("文章已更新！"); setLocation("/dashboard/content"); },
    onError: (error) => { alert(`更新失敗：${error.message}`); },
  });

  const uploadImageMutation = trpc.storage.uploadImage.useMutation({
    onSuccess: (data) => { setCoverImage(data.url); setIsUploading(false); alert("圖片上傳成功！"); },
    onError: (error) => { setIsUploading(false); alert(`圖片上傳失敗：${error.message}`); },
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || "");
      setContent(post.content);
      setCoverImage(post.coverImage || "");
      setStatus(post.status);
      setPublishTargets((post.publishTargets as ("corporate" | "brand")[]) || ["brand"]);
      setCategory((post as any).category || "");
      if ((post as any).scheduledAt) {
        const utc = new Date((post as any).scheduledAt);
        const taipei = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
        setScheduledAt(taipei.toISOString().slice(0, 16));
      } else {
        setScheduledAt("");
      }
    }
  }, [post]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!postId) {
      const autoSlug = newTitle.toLowerCase().replace(/[^a-z0-9一-龥]+/g, "-").replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("請選擇圖片檔案！"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("圖片大小不能超過 5MB！"); return; }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => { uploadImageMutation.mutate({ fileName: file.name, fileData: reader.result as string, contentType: file.type }); };
    reader.onerror = () => { setIsUploading(false); alert("讀取檔案失敗！"); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title || !slug || !content) { alert("請填寫標題、Slug 和內容"); return; }
    if (publishTargets.length === 0) { alert("請至少選擇一個發布目標"); return; }
    const resolvedStatus: "draft" | "published" = scheduledAt ? "published" : status;
    const scheduledAtValue = scheduledAt ? new Date(scheduledAt + ":00+08:00").toISOString() : null;
    const postData = { title, slug, excerpt, content, coverImage, status: resolvedStatus, publishTargets, category: category || undefined, scheduledAt: scheduledAtValue };
    if (postId) { updatePostMutation.mutate({ postId, ...postData }); }
    else { createPostMutation.mutate(postData); }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--os-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--os-text-3)", fontSize: 14 }}>
        載入中...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--os-bg)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Top Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => setLocation("/dashboard/content")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--os-text-2)" }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />返回列表
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {status === "published" && slug && (
              <button onClick={() => window.open(`/news/${slug}`, "_blank")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>
                <Eye style={{ width: 14, height: 14 }} />預覽
              </button>
            )}
            <button onClick={handleSubmit} disabled={createPostMutation.isPending || updatePostMutation.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (createPostMutation.isPending || updatePostMutation.isPending) ? 0.6 : 1 }}>
              <Save style={{ width: 15, height: 15 }} />{postId ? "更新文章" : "建立文章"}
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 28 }} className="space-y-6">
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>
            {postId ? "編輯文章" : "建立新文章"}
          </h1>

          {/* Title */}
          <div>
            <label style={labelSt}>標題 *</label>
            <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="輸入文章標題..." style={{ ...inputSt, fontSize: 16, padding: "10px 14px" }} />
          </div>

          {/* Slug */}
          <div>
            <label style={labelSt}>Slug（網址路徑）*</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug" style={inputSt} />
            <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>文章網址：/news/{slug || "your-slug"}</p>
          </div>

          {/* Cover Image */}
          <div>
            <label style={labelSt}>封面圖片</label>
            {coverImage && (
              <div style={{ marginBottom: 12, position: "relative" }}>
                <img src={coverImage} alt="封面預覽" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8, border: "1px solid var(--os-border)" }} />
                <button type="button" onClick={() => setCoverImage("")}
                  style={{ position: "absolute", top: 8, right: 8, background: "var(--os-danger)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                  移除
                </button>
              </div>
            )}
            <label style={{ display: "block" }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: "none" }} />
              <div style={{ padding: "10px 0", background: "var(--os-amber)", color: "#fff", textAlign: "center", borderRadius: 8, cursor: isUploading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: isUploading ? 0.6 : 1 }}>
                {isUploading ? "上傳中..." : "📷 上傳圖片"}
              </div>
            </label>
            <div style={{ marginTop: 10 }}>
              <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
                placeholder="或手動輸入圖片 URL" style={inputSt} />
            </div>
            <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 6 }}>支援 JPG, PNG, GIF 格式，檔案大小不超過 5MB</p>
          </div>

          {/* Excerpt */}
          <div>
            <label style={labelSt}>摘要</label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              placeholder="簡短描述文章內容..." rows={3}
              style={{ ...inputSt, resize: "none" }} />
          </div>

          {/* Content */}
          <div>
            <label style={labelSt}>內容 *</label>
            <Suspense fallback={<div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--os-text-3)", fontSize: 13 }}>載入編輯器...</div>}>
              <RichTextEditor content={content} onChange={(html) => setContent(html)} placeholder="撰寫文章內容..." />
            </Suspense>
            <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 6 }}>支援富文本格式（粗體、標題、列表、圖片、連結等）</p>
          </div>

          {/* Publish Targets */}
          <div>
            <label style={labelSt}>發布目標（可多選）</label>
            <div className="space-y-2">
              {[
                { key: "brand", name: "來點什麼官網", desc: "文章將顯示在品牌官網的最新消息頁面" },
                { key: "corporate", name: "宇聯官網", desc: "文章將顯示在宇聯國際官網的新聞中心頁面" },
              ].map(t => {
                const checked = publishTargets.includes(t.key as any);
                return (
                  <label key={t.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", border: "1px solid", borderColor: checked ? "var(--os-amber)" : "var(--os-border)", borderRadius: 8, cursor: "pointer", background: checked ? "var(--os-amber-soft)" : "var(--os-surface-2)", transition: "all 0.15s" }}>
                    <input type="checkbox" checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setPublishTargets([...publishTargets, t.key as any]);
                        else setPublishTargets(publishTargets.filter(x => x !== t.key));
                      }}
                      style={{ width: 16, height: 16, marginTop: 1, accentColor: "var(--os-amber)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 2 }}>{t.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            {publishTargets.length === 0 && (
              <p style={{ fontSize: 11, color: "var(--os-danger)", marginTop: 6 }}>請至少選擇一個發布目標</p>
            )}
          </div>

          {/* Category + ScheduledAt */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label style={labelSt}>文章分類</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputSt, appearance: "none" }}>
                <option value="">不分類</option>
                <option value="餐飲新聞">餐飲新聞</option>
                <option value="加盟快報">加盟快報</option>
                <option value="品牌動態">品牌動態</option>
                <option value="集團公告">集團公告</option>
              </select>
            </div>
            <div>
              <label style={labelSt}>排程發布時間（選填）</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={inputSt} />
              {scheduledAt ? (
                <p style={{ fontSize: 11, color: "var(--os-warning)", fontWeight: 600, marginTop: 4 }}>
                  ⏰ 已設定排程：{new Date(scheduledAt + ":00+08:00").toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}（台北時間）
                </p>
              ) : (
                <p style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4 }}>選填。設定後到指定時間自動顯示。</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelSt}>狀態</label>
            {scheduledAt ? (
              <div style={{ padding: "10px 14px", border: "1px solid var(--os-warning-bg)", background: "var(--os-warning-bg)", borderRadius: 8, fontSize: 13, color: "var(--os-warning)" }}>
                已發布（排程中）—— 到達排程時間前前台不顯示
              </div>
            ) : (
              <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} style={{ ...inputSt, appearance: "none" }}>
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
              </select>
            )}
          </div>

          {/* Save */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSubmit} disabled={createPostMutation.isPending || updatePostMutation.isPending}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: (createPostMutation.isPending || updatePostMutation.isPending) ? 0.6 : 1 }}>
              <Save style={{ width: 16, height: 16 }} />{postId ? "更新文章" : "建立文章"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

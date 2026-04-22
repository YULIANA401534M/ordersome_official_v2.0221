import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import RichTextEditor from "@/components/RichTextEditor";
import { Save, ArrowLeft, Eye } from "lucide-react";
import { useLocation, useRoute } from "wouter";

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

  // Fetch post if editing existing
  const { data: post, isLoading } = trpc.content.getPostById.useQuery(
    { postId: postId! },
    { enabled: !!postId }
  );

  const createPostMutation = trpc.content.createPost.useMutation({
    onSuccess: () => {
      alert("文章已建立！");
      setLocation("/dashboard/content");
    },
  });

   const updatePostMutation = trpc.content.updatePost.useMutation({
    onSuccess: () => {
      alert("文章已更新！");
      setLocation("/dashboard/content");
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`);
    },
  });

  const uploadImageMutation = trpc.storage.uploadImage.useMutation({
    onSuccess: (data) => {
      setCoverImage(data.url);
      setIsUploading(false);
      alert("圖片上傳成功！");
    },
    onError: (error) => {
      setIsUploading(false);
      alert(`圖片上傳失敗：${error.message}`);
    },
  });

  // Load post data if editing
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
      // DB 存 UTC，轉台北時間（UTC+8）顯示在 datetime-local
      if ((post as any).scheduledAt) {
        const utc = new Date((post as any).scheduledAt);
        const taipei = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
        setScheduledAt(taipei.toISOString().slice(0, 16));
      } else {
        setScheduledAt("");
      }
    }
  }, [post]);

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!postId) {
      // Only auto-generate slug for new posts
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔案！");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("圖片大小不能超過 5MB！");
      return;
    }

    setIsUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      uploadImageMutation.mutate({
        fileName: file.name,
        fileData: base64Data,
        contentType: file.type,
      });
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("讀取檔案失敗！");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title || !slug || !content) {
      alert("請填寫標題、Slug 和內容");
      return;
    }
    if (publishTargets.length === 0) {
      alert("請至少選擇一個發布目標");
      return;
    }

    // 有排程時間 → status 設為 published，前台查詢有時間過濾，未到時間自然不顯示
    // 清除排程時間 → 保持用戶選擇的 status（draft / published）
    const resolvedStatus: "draft" | "published" = scheduledAt ? "published" : status;

    // datetime-local 值為台北時間，附加 +08:00 讓後端 new Date() 正確解析為 UTC
    // 清空時送 null 讓後端把 scheduledAt 清為 null
    const scheduledAtValue = scheduledAt
      ? new Date(scheduledAt + ":00+08:00").toISOString()
      : null;

    const postData = {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      status: resolvedStatus,
      publishTargets,
      category: category || undefined,
      scheduledAt: scheduledAtValue,
    };

    if (postId) {
      updatePostMutation.mutate({ postId, ...postData });
    } else {
      createPostMutation.mutate(postData);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => setLocation("/dashboard/content")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            返回列表
          </button>
          <div className="flex items-center gap-3">
            {status === "published" && slug && (
              <button
                onClick={() => window.open(`/news/${slug}`, "_blank")}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                預覽
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || updatePostMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {postId ? "更新文章" : "建立文章"}
            </button>
          </div>
        </div>

        {/* Editor Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {postId ? "編輯文章" : "建立新文章"}
          </h1>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">標題 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="輸入文章標題..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Slug */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug（網址路徑）*
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">文章網址：/news/{slug || "your-slug"}</p>
          </div>

          {/* Cover Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">封面圖片</label>
            
            {/* Image Preview */}
            {coverImage && (
              <div className="mb-4 relative">
                <img
                  src={coverImage}
                  alt="封面預覽"
                  className="w-full max-h-64 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                >
                  移除
                </button>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="w-full px-4 py-3 bg-blue-500 text-white text-center rounded-lg cursor-pointer hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploading ? "上傳中..." : "📷 上傳圖片"}
                </div>
              </label>
            </div>

            {/* Manual URL Input */}
            <div className="mt-3">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="或手動輸入圖片 URL"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              支援 JPG, PNG, GIF 格式，檔案大小不超過 5MB。圖片將上傳至 S3 儲存，不佔用伺服器空間。
            </p>
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">摘要</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="簡短描述文章內容..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">內容 *</label>
            <RichTextEditor
              content={content}
              onChange={(html) => setContent(html)}
              placeholder="撰寫文章內容..."
            />
            <p className="mt-1 text-xs text-gray-500">支援富文本格式（粗體、標題、列表、圖片、連結等）</p>
          </div>

          {/* Publish Targets (Multiple Selection) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">發布目標（可多選）</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={publishTargets.includes("brand")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPublishTargets([...publishTargets, "brand"]);
                    } else {
                      setPublishTargets(publishTargets.filter(t => t !== "brand"));
                    }
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">來點什麼官網</div>
                  <div className="text-xs text-gray-500">文章將顯示在品牌官網的最新消息頁面</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={publishTargets.includes("corporate")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPublishTargets([...publishTargets, "corporate"]);
                    } else {
                      setPublishTargets(publishTargets.filter(t => t !== "corporate"));
                    }
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">宇聯官網</div>
                  <div className="text-xs text-gray-500">文章將顯示在宇聯國際官網的新聞中心頁面</div>
                </div>
              </label>
            </div>
            {publishTargets.length === 0 && (
              <p className="mt-2 text-xs text-red-600">請至少選擇一個發布目標</p>
            )}
            {publishTargets.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                已選擇 {publishTargets.length} 個發布目標
              </p>
            )}
          </div>

          {/* Category + ScheduledAt (side by side) */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">文章分類</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">不分類</option>
                <option value="餐飲新聞">餐飲新聞</option>
                <option value="加盟快報">加盟快報</option>
                <option value="品牌動態">品牌動態</option>
                <option value="集團公告">集團公告</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排程發布時間（選填）</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {scheduledAt ? (
                <p className="mt-1 text-xs text-amber-600 font-medium">
                  ⏰ 已設定排程：文章將於 {new Date(scheduledAt + ":00+08:00").toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })} 出現在前台（台北時間）
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">選填。設定後系統於指定時間自動將文章由草稿改為已發布。</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">狀態</label>
            {scheduledAt ? (
              <div className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-lg text-amber-700 text-sm">
                已發布（排程中）—— 到達排程時間前前台不顯示，到時間自動出現
              </div>
            ) : (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
              </select>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || updatePostMutation.isPending}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {postId ? "更新文章" : "建立文章"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

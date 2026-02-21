import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Sun, Moon, Shield, Wrench, Users, AlertTriangle,
  BookOpen, ChevronRight, CheckCircle, Clock, Search,
  Plus, Edit, Trash2, Eye, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Moon, Shield, Wrench, Users, AlertTriangle, BookOpen,
};

function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = icon ? (ICON_MAP[icon] || BookOpen) : BookOpen;
  return <Icon className={className} />;
}

export default function SOPKnowledgeBase() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState<number | null>(null);

  // Form state
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docStatus, setDocStatus] = useState<"draft" | "published">("published");

  const { data: categories } = trpc.sop.getCategories.useQuery();
  const { data: documents, refetch: refetchDocs } = trpc.sop.getDocuments.useQuery(
    { categoryId: selectedCategoryId ?? undefined }
  );
  const { data: allDocuments } = trpc.sop.getAllDocuments.useQuery(undefined, {
    enabled: isManager,
  });
  const { data: selectedDocument } = trpc.sop.getDocumentById.useQuery(
    { id: selectedDoc! },
    { enabled: !!selectedDoc }
  );
  const { data: readStatus, refetch: refetchRead } = trpc.sop.getReadStatus.useQuery(
    { documentId: selectedDoc! },
    { enabled: !!selectedDoc }
  );

  const markAsRead = trpc.sop.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("已標記為已讀");
      refetchRead();
    },
  });

  const createDoc = trpc.sop.createDocument.useMutation({
    onSuccess: () => {
      toast.success("SOP 文件已建立");
      setShowCreateDoc(false);
      setDocTitle("");
      setDocContent("");
      refetchDocs();
    },
  });

  const updateDoc = trpc.sop.updateDocument.useMutation({
    onSuccess: () => {
      toast.success("SOP 文件已更新");
      setEditingDoc(null);
      refetchDocs();
    },
  });

  const deleteDoc = trpc.sop.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("SOP 文件已封存");
      setSelectedDoc(null);
      refetchDocs();
    },
  });

  const displayDocs = isManager ? allDocuments : documents;
  const filteredDocs = displayDocs?.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDoc = () => {
    if (!docTitle.trim() || !docContent.trim()) {
      toast.error("請填寫標題和內容");
      return;
    }
    createDoc.mutate({
      categoryId: selectedCategoryId || 1,
      title: docTitle,
      content: docContent,
      status: docStatus,
    });
  };

  const handleUpdateDoc = () => {
    if (!editingDoc) return;
    updateDoc.mutate({
      id: editingDoc,
      title: docTitle,
      content: docContent,
      status: docStatus,
    });
  };

  const startEdit = (doc: NonNullable<typeof selectedDocument>) => {
    setEditingDoc(doc.id);
    setDocTitle(doc.title);
    setDocContent(doc.content);
    setDocStatus(doc.status as "draft" | "published");
    setShowCreateDoc(false);
  };

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* 左側：分類列表 */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            SOP 知識庫
          </h2>
        </div>
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? "bg-amber-50 text-amber-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            全部文件
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <CategoryIcon icon={cat.icon} className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* 中間：文件列表 */}
      <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              {categories?.find((c) => c.id === selectedCategoryId)?.name || "全部文件"}
            </h3>
            {isManager && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateDoc(true);
                  setEditingDoc(null);
                  setDocTitle("");
                  setDocContent("");
                  setDocStatus("published");
                }}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                新增
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜尋文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs?.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              暫無文件
            </div>
          )}
          {filteredDocs?.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc.id)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                selectedDoc === doc.id
                  ? "bg-amber-50 border border-amber-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{doc.title}</p>
                <Badge
                  variant={doc.status === "published" ? "default" : "secondary"}
                  className="text-xs flex-shrink-0"
                >
                  {doc.status === "published" ? "已發布" : doc.status === "draft" ? "草稿" : "已封存"}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                v{doc.version} · {new Date(doc.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 右側：文件內容 / 編輯器 */}
      <main className="flex-1 overflow-y-auto">
        {/* 新增/編輯表單 */}
        {(showCreateDoc || editingDoc) && isManager && (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  {editingDoc ? "編輯 SOP 文件" : "新增 SOP 文件"}
                </h3>
                <button
                  onClick={() => { setShowCreateDoc(false); setEditingDoc(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">標題 *</label>
                  <Input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="SOP 文件標題"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as "draft" | "published")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="published">立即發布</option>
                    <option value="draft">儲存草稿</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">內容 *</label>
                  <RichTextEditor
                    content={docContent}
                    onChange={setDocContent}
                    placeholder="撰寫 SOP 內容..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setShowCreateDoc(false); setEditingDoc(null); }}>
                    取消
                  </Button>
                  <Button
                    onClick={editingDoc ? handleUpdateDoc : handleCreateDoc}
                    disabled={createDoc.isPending || updateDoc.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {editingDoc ? "儲存更新" : "建立文件"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 文件閱讀視圖 */}
        {selectedDoc && selectedDocument && !showCreateDoc && !editingDoc && (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDocument.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span>版本 {selectedDocument.version}</span>
                    <span>·</span>
                    <span>更新於 {new Date(selectedDocument.updatedAt).toLocaleDateString("zh-TW")}</span>
                    <Badge variant={selectedDocument.status === "published" ? "default" : "secondary"}>
                      {selectedDocument.status === "published" ? "已發布" : "草稿"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isManager && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(selectedDocument)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        編輯
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteDoc.mutate({ id: selectedDoc })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {!readStatus?.isRead ? (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => markAsRead.mutate({ documentId: selectedDoc })}
                      disabled={markAsRead.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      標記已讀
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      已讀
                    </div>
                  )}
                </div>
              </div>
              <article
                className="prose prose-sm max-w-none prose-headings:font-bold prose-p:text-gray-700"
                dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
              />
            </div>
          </div>
        )}

        {/* 空狀態 */}
        {!selectedDoc && !showCreateDoc && !editingDoc && (
          <div className="flex items-center justify-center h-full min-h-96">
            <div className="text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">選擇左側文件開始閱讀</p>
              <p className="text-sm mt-1">或從分類中篩選您需要的 SOP 文件</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

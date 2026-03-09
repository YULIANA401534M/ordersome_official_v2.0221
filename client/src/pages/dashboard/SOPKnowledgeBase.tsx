import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { toast } from "sonner";
import {
  BookOpen, Edit2, Plus, CheckCircle, Eye, EyeOff,
  FileText, Download, Upload, ChevronLeft, Search, Save, Loader2, Trash2, ArrowUpDown
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = "list" | "read" | "edit" | "create";

export default function SOPKnowledgeBase() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<"draft" | "published">("published");
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [editVersion, setEditVersion] = useState("1.0");
  const [editPdfUrl, setEditPdfUrl] = useState("");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // tRPC queries
  // 使用 getAccessibleCategories 根據權限動態渲染分類（管理員可看全部，其他角色依權限表顯示）
  const { data: categories = [] } = trpc.sop.getAccessibleCategories.useQuery();
  const { data: documents = [], refetch: refetchDocs } = trpc.sop.getDocuments.useQuery({
    categoryId: selectedCategoryId ?? undefined,
    sortBy,
  });
  const { data: allDocuments = [], refetch: refetchAllDocs } = trpc.sop.getAllDocuments.useQuery(
    undefined,
    { enabled: isManager }
  );
  const { data: currentDoc, refetch: refetchDoc } = trpc.sop.getDocumentById.useQuery(
    { id: selectedDocId! },
    { enabled: selectedDocId !== null }
  );
  const { data: readStatus, refetch: refetchReadStatus } = trpc.sop.getReadStatus.useQuery(
    { documentId: selectedDocId! },
    { enabled: selectedDocId !== null }
  );

  const markAsRead = trpc.sop.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("已標記為已讀！");
      refetchDoc();
      refetchReadStatus();
    },
  });

  const createDoc = trpc.sop.createDocument.useMutation({
    onSuccess: () => {
      toast.success("文件已建立！");
      refetchDocs();
      refetchAllDocs();
      setViewMode("list");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateDoc = trpc.sop.updateDocument.useMutation({
    onSuccess: () => {
      toast.success("文件已更新！");
      refetchDocs();
      refetchAllDocs();
      refetchDoc();
      setViewMode("read");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDoc = trpc.sop.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("文件已刪除");
      setDeleteConfirmId(null);
      refetchDocs();
      refetchAllDocs();
    },
    onError: (err) => toast.error("刪除失敗：" + err.message),
  });

  const uploadPdf = trpc.storage.uploadPdf.useMutation({
    onSuccess: (data) => {
      setEditPdfUrl(data.url);
      toast.success("PDF 上傳成功！");
      setIsUploadingPdf(false);
    },
    onError: (err) => {
      toast.error("PDF 上傳失敗：" + err.message);
      setIsUploadingPdf(false);
    },
  });

  // 顯示的文件列表
  const displayDocs = isManager ? allDocuments : documents;
  const filteredDocs = displayDocs.filter((doc) => {
    const matchCategory = selectedCategoryId ? doc.categoryId === selectedCategoryId : true;
    const matchSearch = searchQuery
      ? doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchCategory && matchSearch;
  });

  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? "未分類";

  const handleOpenDoc = (docId: number) => {
    setSelectedDocId(docId);
    setViewMode("read");
  };

  const handleEditDoc = () => {
    if (!currentDoc) return;
    setEditTitle(currentDoc.title);
    setEditContent(currentDoc.content);
    setEditCategoryId(currentDoc.categoryId);
    setEditStatus(currentDoc.status as "draft" | "published");
    setEditIsVisible(currentDoc.isVisibleToStaff);
    setEditVersion(currentDoc.version ?? "1.0");
    setEditPdfUrl(currentDoc.pdfUrl ?? "");
    setViewMode("edit");
  };

  const handleCreateNew = () => {
    setEditTitle("");
    setEditContent("");
    setEditCategoryId(categories[0]?.id ?? 0);
    setEditStatus("published");
    setEditIsVisible(true);
    setEditVersion("1.0");
    setEditPdfUrl("");
    setViewMode("create");
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      toast.error("標題不能為空");
      return;
    }
    if (viewMode === "create") {
      createDoc.mutate({
        categoryId: editCategoryId || (categories[0]?.id ?? 1),
        title: editTitle,
        content: editContent,
        pdfUrl: editPdfUrl || undefined,
        version: editVersion,
        status: editStatus,
        isVisibleToStaff: editIsVisible,
      });
    } else if (viewMode === "edit" && selectedDocId) {
      updateDoc.mutate({
        id: selectedDocId,
        title: editTitle,
        content: editContent,
        pdfUrl: editPdfUrl || undefined,
        version: editVersion,
        status: editStatus,
        isVisibleToStaff: editIsVisible,
        categoryId: editCategoryId,
      });
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("PDF 檔案不能超過 16MB");
      return;
    }
    setIsUploadingPdf(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      uploadPdf.mutate({ fileName: file.name, fileData: base64 });
    };
    reader.readAsDataURL(file);
  };

  // ===== 閱讀視圖 =====
  if (viewMode === "read" && currentDoc) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">返回列表</span>
            </button>
            <div className="flex items-center gap-2">
              {!currentDoc.isVisibleToStaff && isManager && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                  <EyeOff className="w-3 h-3 mr-1" />員工隱藏
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">v{currentDoc.version}</Badge>
              {isManager && (
                <Button size="sm" variant="outline" onClick={handleEditDoc} className="flex items-center gap-1">
                  <Edit2 className="w-4 h-4" />
                  ✏️ 編輯
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
              {getCategoryName(currentDoc.categoryId)}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-4">{currentDoc.title}</h1>

            {currentDoc.pdfUrl && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">PDF 附件</p>
                    <p className="text-xs text-blue-600">點擊下載或線上預覽</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={currentDoc.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />預覽
                  </a>
                  <a href={currentDoc.pdfUrl} download
                    className="flex items-center gap-1 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />下載
                  </a>
                </div>
              </div>
            )}

            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentDoc.content }}
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            {readStatus?.isRead ? (
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">已完成閱讀簽收</p>
                  <p className="text-sm text-gray-500">感謝你確認已閱讀此文件</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">閱讀完畢後，請點擊下方按鈕確認已閱讀此文件。</p>
                <Button
                  onClick={() => markAsRead.mutate({ documentId: currentDoc.id })}
                  disabled={markAsRead.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-base font-semibold rounded-xl"
                >
                  {markAsRead.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  ✅ 我已閱讀此文件
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== 編輯 / 新增視圖 =====
  if ((viewMode === "edit" || viewMode === "create") && isManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setViewMode(selectedDocId && viewMode === "edit" ? "read" : "list")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">取消</span>
            </button>
            <h2 className="font-semibold text-gray-900">
              {viewMode === "create" ? "新增文件" : "編輯文件"}
            </h2>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createDoc.isPending || updateDoc.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {(createDoc.isPending || updateDoc.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              發佈
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">基本設定</h3>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">文件標題</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="輸入文件標題..." className="text-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">所屬章節</Label>
                <Select value={editCategoryId.toString()} onValueChange={(v) => setEditCategoryId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="選擇章節" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">版本號</Label>
                <Input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} placeholder="1.0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">發佈狀態</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as "draft" | "published")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿（不公開）</SelectItem>
                    <SelectItem value="published">發佈（公開）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">員工可見</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Switch checked={editIsVisible} onCheckedChange={setEditIsVisible} />
                  <span className="text-sm text-gray-600">
                    {editIsVisible ? (
                      <span className="flex items-center gap-1 text-green-600"><Eye className="w-4 h-4" />開放員工閱覽</span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-600"><EyeOff className="w-4 h-4" />僅管理員可見</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">PDF 附件（選填）</h3>
            {editPdfUrl ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700">PDF 已上傳</span>
                </div>
                <div className="flex gap-2">
                  <a href={editPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">預覽</a>
                  <button onClick={() => setEditPdfUrl("")} className="text-xs text-red-500 hover:underline">移除</button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                {isUploadingPdf ? (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">上傳中...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">點擊上傳 PDF（最大 16MB）</span>
                  </>
                )}
                <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isUploadingPdf} />
              </label>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">文件內容（WYSIWYG 編輯器）</h3>
            <RichTextEditor content={editContent} onChange={setEditContent} placeholder="在此輸入 SOP 內容..." />
          </div>
        </div>
      </div>
    );
  }

  // ===== 列表視圖 =====
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BackButton className="-ml-2" />
              <BookOpen className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">SOP 知識庫</h1>
            </div>
            {isManager && (
              <Button onClick={handleCreateNew} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1">
                <Plus className="w-4 h-4" />新增文件
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜尋 SOP 文件..." className="pl-9 bg-gray-50" />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "oldest")}>
              <SelectTrigger className="w-32 bg-gray-50 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">最新到舊</SelectItem>
                <SelectItem value="oldest">最舊到新</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategoryId === null ? "bg-purple-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategoryId === cat.id ? "bg-purple-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}
            >
              {cat.icon} {cat.name.replace(/^Ch\d+ /, "")}
            </button>
          ))}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{searchQuery ? "找不到符合的文件" : "此分類尚無文件"}</p>
            {isManager && (
              <Button onClick={handleCreateNew} variant="outline" className="mt-3">
                <Plus className="w-4 h-4 mr-1" />新增第一篇文件
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc.id)}
                className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                        {getCategoryName(doc.categoryId)}
                      </span>
                      {isManager && !doc.isVisibleToStaff && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />員工隱藏
                        </span>
                      )}
                      {isManager && doc.status === "draft" && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">草稿</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">v{doc.version}</span>
                      {doc.pdfUrl && (
                        <span className="text-xs text-blue-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />PDF
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 flex-shrink-0" />
                    {isManager && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(doc.id); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除文件"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 刪除二次確認彈窗 */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除文件</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除後，所有員工的阅讀簽收記錄也將一並刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteDoc.mutate({ id: deleteConfirmId })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

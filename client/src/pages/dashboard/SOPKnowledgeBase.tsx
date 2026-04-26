import { useState, useEffect, lazy, Suspense } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const RichTextEditor = lazy(() => import("@/components/RichTextEditor"));
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

const inputSt: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1px solid var(--os-border)",
  borderRadius: 8, fontSize: 14, background: "var(--os-surface)",
  color: "var(--os-text-1)", outline: "none",
};
const labelSt: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "var(--os-text-2)", display: "block", marginBottom: 6,
};

// ---- Sortable Item 元件 ----
function SortableDocItem({
  doc,
  isManager,
  getCategoryName,
  onOpen,
  onDelete,
}: {
  doc: { id: number; title: string; categoryId: number; version: string | null; pdfUrl: string | null; isVisibleToStaff: boolean; status: string };
  isManager: boolean;
  getCategoryName: (id: number) => string;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doc.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "var(--os-surface)",
        border: "1px solid var(--os-border)",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <button
          {...attributes}
          {...listeners}
          style={{ padding: 4, color: "var(--os-text-3)", cursor: "grab", flexShrink: 0, marginTop: 2, background: "none", border: "none" }}
          onClick={(e) => e.stopPropagation()}
          title="拖曳排序"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => onOpen(doc.id)}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--os-amber-text)", background: "var(--os-amber-soft)", padding: "2px 8px", borderRadius: 20 }}>
              {getCategoryName(doc.categoryId)}
            </span>
            {isManager && !doc.isVisibleToStaff && (
              <span style={{ fontSize: 11, color: "var(--os-warning)", background: "var(--os-warning-bg)", padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                <EyeOff style={{ width: 10, height: 10 }} />員工隱藏
              </span>
            )}
            {isManager && doc.status === "draft" && (
              <span style={{ fontSize: 11, color: "var(--os-text-3)", background: "var(--os-surface-2)", padding: "2px 8px", borderRadius: 20 }}>草稿</span>
            )}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", margin: 0 }}>{doc.title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "var(--os-text-3)" }}>v{doc.version}</span>
            {doc.pdfUrl && (
              <span style={{ fontSize: 11, color: "var(--os-info)", display: "flex", alignItems: "center", gap: 4 }}>
                <FileText style={{ width: 11, height: 11 }} />PDF
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft style={{ width: 18, height: 18, color: "var(--os-text-3)", transform: "rotate(180deg)", flexShrink: 0 }} onClick={() => onOpen(doc.id)} />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
            style={{ padding: "4px 6px", color: "var(--os-danger)", background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}
            title="刪除文件"
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SOPKnowledgeBase() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  const [localDocs, setLocalDocs] = useState<typeof filteredDocs>([]);

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
    onSuccess: () => { toast.success("已標記為已讀！"); refetchDoc(); refetchReadStatus(); },
  });

  const createDoc = trpc.sop.createDocument.useMutation({
    onSuccess: () => { toast.success("文件已建立！"); refetchDocs(); refetchAllDocs(); setViewMode("list"); },
    onError: (err) => toast.error(err.message),
  });

  const updateDoc = trpc.sop.updateDocument.useMutation({
    onSuccess: () => { toast.success("文件已更新！"); refetchDocs(); refetchAllDocs(); refetchDoc(); setViewMode("read"); },
    onError: (err) => toast.error(err.message),
  });

  const reorderDocs = trpc.sop.reorderDocuments.useMutation({
    onError: (err) => toast.error("排序失敗：" + err.message),
  });

  const deleteDoc = trpc.sop.deleteDocument.useMutation({
    onSuccess: () => { toast.success("文件已刪除"); setDeleteConfirmId(null); refetchDocs(); refetchAllDocs(); },
    onError: (err) => toast.error("刪除失敗：" + err.message),
  });

  const uploadPdf = trpc.storage.uploadPdf.useMutation({
    onSuccess: (data) => { setEditPdfUrl(data.url); toast.success("PDF 上傳成功！"); setIsUploadingPdf(false); },
    onError: (err) => { toast.error("PDF 上傳失敗：" + err.message); setIsUploadingPdf(false); },
  });

  const displayDocs = isManager ? allDocuments : documents;
  const filteredDocs = displayDocs.filter((doc) => {
    const matchCategory = selectedCategoryId ? doc.categoryId === selectedCategoryId : true;
    const matchSearch = searchQuery ? doc.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchCategory && matchSearch;
  });

  useEffect(() => { setLocalDocs(filteredDocs); }, [filteredDocs.length, sortBy, selectedCategoryId, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localDocs.findIndex((d) => d.id === active.id);
    const newIndex = localDocs.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(localDocs, oldIndex, newIndex);
    setLocalDocs(reordered);
    reorderDocs.mutate(reordered.map((d: any, i: number) => ({ id: d.id, displayOrder: i })));
  };

  const getCategoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "未分類";

  const handleOpenDoc = (docId: number) => { setSelectedDocId(docId); setViewMode("read"); };

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
    setEditTitle(""); setEditContent("");
    setEditCategoryId(categories[0]?.id ?? 0);
    setEditStatus("published"); setEditIsVisible(true);
    setEditVersion("1.0"); setEditPdfUrl("");
    setViewMode("create");
  };

  const handleSave = () => {
    if (!editTitle.trim()) { toast.error("標題不能為空"); return; }
    if (viewMode === "create") {
      createDoc.mutate({
        categoryId: editCategoryId || (categories[0]?.id ?? 1),
        title: editTitle, content: editContent,
        pdfUrl: editPdfUrl || undefined, version: editVersion,
        status: editStatus, isVisibleToStaff: editIsVisible,
      });
    } else if (viewMode === "edit" && selectedDocId) {
      updateDoc.mutate({
        id: selectedDocId, title: editTitle, content: editContent,
        pdfUrl: editPdfUrl || undefined, version: editVersion,
        status: editStatus, isVisibleToStaff: editIsVisible, categoryId: editCategoryId,
      });
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("PDF 檔案不能超過 16MB"); return; }
    setIsUploadingPdf(true);
    const reader = new FileReader();
    reader.onload = (ev) => { uploadPdf.mutate({ fileName: file.name, fileData: ev.target?.result as string }); };
    reader.readAsDataURL(file);
  };

  // ===== 閱讀視圖 =====
  if (viewMode === "read" && currentDoc) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--os-bg)" }}>
        <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setViewMode("list")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--os-text-2)" }}>
              <ChevronLeft style={{ width: 18, height: 18 }} />返回列表
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!currentDoc.isVisibleToStaff && isManager && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, color: "var(--os-warning)", background: "var(--os-warning-bg)", display: "flex", alignItems: "center", gap: 4 }}>
                  <EyeOff style={{ width: 10, height: 10 }} />員工隱藏
                </span>
              )}
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, color: "var(--os-text-3)", background: "var(--os-surface-2)", border: "1px solid var(--os-border)" }}>
                v{currentDoc.version}
              </span>
              {isManager && (
                <button onClick={handleEditDoc}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 12, cursor: "pointer" }}>
                  <Edit2 style={{ width: 13, height: 13 }} />編輯
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--os-amber-text)", background: "var(--os-amber-soft)", padding: "2px 10px", borderRadius: 20 }}>
              {getCategoryName(currentDoc.categoryId)}
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--os-text-1)", marginTop: 12, marginBottom: 16 }}>{currentDoc.title}</h1>

            {currentDoc.pdfUrl && (
              <div style={{ marginBottom: 20, padding: 16, background: "var(--os-info-bg)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FileText style={{ width: 28, height: 28, color: "var(--os-info)" }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-1)", margin: 0 }}>PDF 附件</p>
                    <p style={{ fontSize: 11, color: "var(--os-info)", margin: 0 }}>點擊下載或線上預覽</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={currentDoc.pdfUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-info)", background: "var(--os-surface)", border: "1px solid var(--os-border)", padding: "6px 12px", borderRadius: 8, textDecoration: "none" }}>
                    <Eye style={{ width: 13, height: 13 }} />預覽
                  </a>
                  <a href={currentDoc.pdfUrl} download
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#fff", background: "var(--os-info)", padding: "6px 12px", borderRadius: 8, textDecoration: "none" }}>
                    <Download style={{ width: 13, height: 13 }} />下載
                  </a>
                </div>
              </div>
            )}

            <div className="prose prose-sm max-w-none"
              style={{ color: "var(--os-text-1)", lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: currentDoc.content }}
            />
          </div>

          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20 }}>
            {readStatus?.isRead ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--os-success)" }}>
                <CheckCircle style={{ width: 24, height: 24 }} />
                <div>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>已完成閱讀簽收</p>
                  <p style={{ fontSize: 12, color: "var(--os-text-3)", margin: 0 }}>感謝你確認已閱讀此文件</p>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "var(--os-text-2)", marginBottom: 12 }}>閱讀完畢後，請點擊下方按鈕確認已閱讀此文件。</p>
                <button
                  onClick={() => markAsRead.mutate({ documentId: currentDoc.id })}
                  disabled={markAsRead.isPending}
                  style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 10, background: "var(--os-success)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: markAsRead.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: markAsRead.isPending ? 0.7 : 1 }}>
                  {markAsRead.isPending ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : <CheckCircle style={{ width: 18, height: 18 }} />}
                  我已閱讀此文件
                </button>
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
      <div style={{ minHeight: "100vh", background: "var(--os-bg)" }}>
        <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setViewMode(selectedDocId && viewMode === "edit" ? "read" : "list")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--os-text-2)" }}>
              <ChevronLeft style={{ width: 18, height: 18 }} />取消
            </button>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>
              {viewMode === "create" ? "新增文件" : "編輯文件"}
            </h2>
            <button onClick={handleSave} disabled={createDoc.isPending || updateDoc.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (createDoc.isPending || updateDoc.isPending) ? 0.6 : 1 }}>
              {(createDoc.isPending || updateDoc.isPending) ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Save style={{ width: 13, height: 13 }} />}
              發佈
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-2)", margin: 0 }}>基本設定</h3>
            <div>
              <label style={labelSt}>文件標題</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="輸入文件標題..." style={{ ...inputSt, fontSize: 15 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelSt}>所屬章節</label>
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
                <label style={labelSt}>版本號</label>
                <input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} placeholder="1.0" style={inputSt} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelSt}>發佈狀態</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as "draft" | "published")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿（不公開）</SelectItem>
                    <SelectItem value="published">發佈（公開）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={labelSt}>員工可見</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <Switch checked={editIsVisible} onCheckedChange={setEditIsVisible} />
                  <span style={{ fontSize: 12, color: editIsVisible ? "var(--os-success)" : "var(--os-warning)", display: "flex", alignItems: "center", gap: 4 }}>
                    {editIsVisible ? <><Eye style={{ width: 13, height: 13 }} />開放閱覽</> : <><EyeOff style={{ width: 13, height: 13 }} />僅管理員</>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-2)", marginBottom: 12 }}>PDF 附件（選填）</h3>
            {editPdfUrl ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--os-info-bg)", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText style={{ width: 18, height: 18, color: "var(--os-info)" }} />
                  <span style={{ fontSize: 13, color: "var(--os-info)" }}>PDF 已上傳</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a href={editPdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--os-info)", textDecoration: "none" }}>預覽</a>
                  <button onClick={() => setEditPdfUrl("")} style={{ fontSize: 12, color: "var(--os-danger)", background: "none", border: "none", cursor: "pointer" }}>移除</button>
                </div>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 96, border: "2px dashed var(--os-border)", borderRadius: 10, cursor: "pointer" }}>
                {isUploadingPdf ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--os-amber)" }}>
                    <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                    <span style={{ fontSize: 13 }}>上傳中...</span>
                  </div>
                ) : (
                  <>
                    <Upload style={{ width: 22, height: 22, color: "var(--os-text-3)", marginBottom: 6 }} />
                    <span style={{ fontSize: 13, color: "var(--os-text-3)" }}>點擊上傳 PDF（最大 16MB）</span>
                  </>
                )}
                <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdfUpload} disabled={isUploadingPdf} />
              </label>
            )}
          </div>

          <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-2)", marginBottom: 12 }}>文件內容（WYSIWYG 編輯器）</h3>
            <Suspense fallback={<div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--os-text-3)", fontSize: 13 }}>載入編輯器...</div>}>
              <RichTextEditor content={editContent} onChange={setEditContent} placeholder="在此輸入 SOP 內容..." />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  // ===== 列表視圖 =====
  return (
    <div style={{ minHeight: "100vh", background: "var(--os-bg)" }}>
      <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BackButton className="-ml-2" />
              <BookOpen style={{ width: 20, height: 20, color: "var(--os-amber)" }} />
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>SOP 知識庫</h1>
            </div>
            {isManager && (
              <button onClick={handleCreateNew}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", border: "none", borderRadius: 8, background: "var(--os-amber)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus style={{ width: 14, height: 14 }} />新增文件
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--os-text-3)" }} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜尋 SOP 文件..."
                style={{ ...inputSt, paddingLeft: 32 }} />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "oldest")}>
              <SelectTrigger style={{ width: 120, flexShrink: 0 }}>
                <ArrowUpDown style={{ width: 12, height: 12, marginRight: 4, color: "var(--os-text-3)" }} />
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

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
          <button onClick={() => setSelectedCategoryId(null)}
            style={{ flexShrink: 0, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: selectedCategoryId === null ? 700 : 400, cursor: "pointer", border: "none", background: selectedCategoryId === null ? "var(--os-amber)" : "var(--os-surface)", color: selectedCategoryId === null ? "#fff" : "var(--os-text-2)", boxShadow: selectedCategoryId === null ? "none" : "0 0 0 1px var(--os-border)" }}>
            全部
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
              style={{ flexShrink: 0, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: selectedCategoryId === cat.id ? 700 : 400, cursor: "pointer", border: "none", background: selectedCategoryId === cat.id ? "var(--os-amber)" : "var(--os-surface)", color: selectedCategoryId === cat.id ? "#fff" : "var(--os-text-2)", boxShadow: selectedCategoryId === cat.id ? "none" : "0 0 0 1px var(--os-border)" }}>
              {cat.icon} {cat.name.replace(/^Ch\d+ /, "")}
            </button>
          ))}
        </div>

        {filteredDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <BookOpen style={{ width: 44, height: 44, color: "var(--os-text-3)", margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ color: "var(--os-text-3)", fontSize: 14 }}>{searchQuery ? "找不到符合的文件" : "此分類尚無文件"}</p>
            {isManager && (
              <button onClick={handleCreateNew}
                style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-2)", fontSize: 13, cursor: "pointer" }}>
                <Plus style={{ width: 14, height: 14 }} />新增第一篇文件
              </button>
            )}
          </div>
        ) : isManager ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localDocs.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {localDocs.map((doc) => (
                  <SortableDocItem key={doc.id} doc={doc} isManager={isManager}
                    getCategoryName={getCategoryName} onOpen={handleOpenDoc}
                    onDelete={(id) => setDeleteConfirmId(id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredDocs.map((doc) => (
              <div key={doc.id} onClick={() => handleOpenDoc(doc.id)}
                style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--os-amber-text)", background: "var(--os-amber-soft)", padding: "2px 8px", borderRadius: 20 }}>
                        {getCategoryName(doc.categoryId)}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", margin: 0 }}>{doc.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--os-text-3)" }}>v{doc.version}</span>
                      {doc.pdfUrl && (
                        <span style={{ fontSize: 11, color: "var(--os-info)", display: "flex", alignItems: "center", gap: 4 }}>
                          <FileText style={{ width: 11, height: 11 }} />PDF
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronLeft style={{ width: 18, height: 18, color: "var(--os-text-3)", transform: "rotate(180deg)", flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除文件</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除後，所有員工的閱讀簽收記錄也將一並刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteDoc.mutate({ id: deleteConfirmId })}
              className="bg-red-600 hover:bg-red-700 text-white">
              {deleteDoc.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

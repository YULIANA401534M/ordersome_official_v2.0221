import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Search, Package, ArrowLeft, X, ImagePlus, Loader2, GripVertical } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SpecEntry { key: string; values: string }
interface FormState {
  name: string; slug: string; description: string;
  price: string; originalPrice: string;
  categoryId: number; stock: number;
  imageUrl: string; images: string[];
  specifications: SpecEntry[];
  isActive: boolean; isFeatured: boolean; sortOrder: number;
}

const EMPTY_FORM: FormState = {
  name: "", slug: "", description: "", price: "", originalPrice: "",
  categoryId: 0, stock: 100, imageUrl: "", images: [],
  specifications: [], isActive: true, isFeatured: false, sortOrder: 0,
};

function specsToJson(specs: SpecEntry[]): string {
  const obj: Record<string, string[]> = {};
  specs.forEach(({ key, values }) => {
    if (key.trim()) obj[key.trim()] = values.split("、").map(v => v.trim()).filter(Boolean);
  });
  return JSON.stringify(obj);
}

function jsonToSpecs(json: string | null | undefined): SpecEntry[] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json) as Record<string, string[]>;
    return Object.entries(obj).map(([key, vals]) => ({ key, values: vals.join("、") }));
  } catch { return []; }
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
function ImageUploadZone({ images, onAdd, onRemove, onSetPrimary, isUploading }:
  { images: string[]; onAdd: (files: FileList) => void; onRemove: (idx: number) => void; onSetPrimary: (idx: number) => void; isUploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((url, idx) => (
          <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer"
            onClick={() => onSetPrimary(idx)}
            title={idx === 0 ? "主圖" : "點擊設為主圖"}>
            <img src={url} alt="" className="w-full h-full object-cover" />
            {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-amber-600/80 text-white text-[10px] text-center py-0.5">主圖</span>}
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-colors disabled:opacity-50">
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImagePlus className="w-5 h-5" /><span className="text-[10px] mt-1">上傳圖片</span></>}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => e.target.files && onAdd(e.target.files)} />
      <p className="text-xs text-gray-400">支援 JPG / PNG / WebP，第一張為主圖。點擊縮圖可設為主圖。</p>
    </div>
  );
}

// ─── Spec Editor ──────────────────────────────────────────────────────────────
function SpecEditor({ specs, onChange }: { specs: SpecEntry[]; onChange: (s: SpecEntry[]) => void }) {
  const add = () => onChange([...specs, { key: "", values: "" }]);
  const remove = (i: number) => onChange(specs.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof SpecEntry, val: string) => {
    const next = [...specs]; next[i] = { ...next[i], [field]: val }; onChange(next);
  };
  return (
    <div className="space-y-2">
      {specs.map((s, i) => (
        <div key={i} className="flex gap-2 items-center">
          <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
          <Input value={s.key} onChange={(e) => update(i, "key", e.target.value)} placeholder="規格名稱（如：口味）" className="w-32 shrink-0" />
          <Input value={s.values} onChange={(e) => update(i, "values", e.target.value)} placeholder="選項，以「、」分隔（如：鹽水雞、甘蔗雞）" />
          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full border-dashed">
        <Plus className="w-3 h-3 mr-1" /> 新增規格
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.product.listAll.useQuery();
  const { data: categories } = trpc.category.listAll.useQuery();

  const uploadImage = trpc.storage.uploadImage.useMutation();

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => { toast.success("商品新增成功"); setDrawerOpen(false); utils.product.listAll.invalidate(); },
    onError: (e) => toast.error("新增失敗：" + e.message),
  });
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => { toast.success("商品更新成功"); setDrawerOpen(false); utils.product.listAll.invalidate(); },
    onError: (e) => toast.error("更新失敗：" + e.message),
  });
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => { toast.success("商品已刪除"); utils.product.listAll.invalidate(); },
    onError: (e) => toast.error("刪除失敗：" + e.message),
  });
  const toggleMutation = trpc.product.update.useMutation({
    onSuccess: () => utils.product.listAll.invalidate(),
    onError: (e) => toast.error("操作失敗：" + e.message),
  });

  // ── Image upload handler ──
  const handleImageUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((res, rej) => {
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        const result = await uploadImage.mutateAsync({ fileName: file.name, fileData: base64, contentType: file.type });
        newUrls.push(result.url);
      } catch { toast.error(`${file.name} 上傳失敗`); }
    }
    setForm(prev => {
      const merged = [...prev.images, ...newUrls];
      return { ...prev, images: merged, imageUrl: merged[0] ?? prev.imageUrl };
    });
    setIsUploading(false);
  }, [uploadImage]);

  const handleRemoveImage = (idx: number) => {
    setForm(prev => {
      const next = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: next, imageUrl: next[0] ?? "" };
    });
  };

  const handleSetPrimary = (idx: number) => {
    setForm(prev => {
      const next = [...prev.images];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return { ...prev, images: next, imageUrl: next[0] };
    });
  };

  // ── Open drawer ──
  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setDrawerOpen(true); };
  const openEdit = (p: any) => {
    setEditingId(p.id);
    const imgs: string[] = (() => { try { return JSON.parse(p.images || "[]"); } catch { return p.imageUrl ? [p.imageUrl] : []; } })();
    setForm({
      name: p.name, slug: p.slug, description: p.description || "",
      price: p.price, originalPrice: p.originalPrice || "",
      categoryId: p.categoryId, stock: p.stock ?? 0,
      imageUrl: p.imageUrl || "", images: imgs,
      specifications: jsonToSpecs(p.specifications),
      isActive: p.isActive, isFeatured: p.isFeatured, sortOrder: p.sortOrder ?? 0,
    });
    setDrawerOpen(true);
  };

  // ── Submit ──
  const buildPayload = () => ({
    name: form.name,
    slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: form.description,
    price: form.price,
    originalPrice: form.originalPrice || undefined,
    categoryId: form.categoryId,
    stock: form.stock,
    imageUrl: form.images[0] || form.imageUrl,
    images: JSON.stringify(form.images),
    specifications: form.specifications.length ? specsToJson(form.specifications) : undefined,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    sortOrder: form.sortOrder,
  });

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("請填寫商品名稱、售價與分類"); return; }
    if (editingId !== null) updateMutation.mutate({ id: editingId, ...buildPayload() });
    else createMutation.mutate(buildPayload() as any);
  };

  const handleDelete = (id: number) => { if (confirm("確定要刪除此商品？此操作無法復原。")) deleteMutation.mutate({ id }); };
  const handleToggle = (p: any) => toggleMutation.mutate({ id: p.id, isActive: !p.isActive });

  const filtered = products?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const isBusy = createMutation.isPending || updateMutation.isPending;

  // ── Auth guard ──
  if (!isAuthenticated || (user?.role !== "super_admin" && user?.role !== "manager")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">需要管理員權限</h2>
          <Link href="/admin"><Button variant="outline" className="mt-4">返回後台</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-4 sticky top-0 z-10">
        <div className="container flex items-center gap-4">
          <Link href="/admin"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4 mr-2" />返回</Button></Link>
          <h1 className="text-xl font-bold flex-1">商品管理</h1>
          <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-2" />新增商品
          </Button>
        </div>
      </div>

      <div className="container py-6">
        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="搜尋商品名稱…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[280px]">商品</TableHead>
                <TableHead>分類</TableHead>
                <TableHead>售價</TableHead>
                <TableHead>庫存</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />載入中…</TableCell></TableRow>
              ) : filtered && filtered.length > 0 ? filtered.map((p) => {
                const imgs: string[] = (() => { try { return JSON.parse(p.images || "[]"); } catch { return []; } })();
                const thumb = imgs[0] || p.imageUrl;
                const cat = categories?.find(c => c.id === p.categoryId);
                return (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="w-12 h-12 rounded-lg object-cover border" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.slug}</p>
                          {imgs.length > 1 && <p className="text-xs text-blue-400">{imgs.length} 張圖片</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm text-gray-600">{cat?.name || "—"}</span></TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm">NT$ {Number(p.price).toLocaleString()}</p>
                      {p.originalPrice && <p className="text-xs text-gray-400 line-through">NT$ {Number(p.originalPrice).toLocaleString()}</p>}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${p.stock <= 10 ? "text-red-500" : "text-gray-700"}`}>{p.stock}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={p.isActive ? "bg-green-50 text-green-700 border-green-200 w-fit" : "bg-gray-50 text-gray-500 w-fit"}>
                          {p.isActive ? "上架中" : "已下架"}
                        </Badge>
                        {p.isFeatured && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 w-fit">精選</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="編輯"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(p)} title={p.isActive ? "下架" : "上架"}
                          className={p.isActive ? "text-orange-500 hover:text-orange-700" : "text-green-500 hover:text-green-700"}>
                          {p.isActive ? "下架" : "上架"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} title="刪除"><Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  {searchTerm ? "找不到符合的商品" : "尚無商品資料，點擊「新增商品」開始建立"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">共 {filtered?.length ?? 0} 件商品</p>
      </div>

      {/* ── Drawer Form ── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="h-full w-full max-w-2xl ml-auto rounded-none overflow-y-auto">
          <DrawerHeader className="border-b sticky top-0 bg-white z-10">
            <DrawerTitle>{editingId !== null ? "編輯商品" : "新增商品"}</DrawerTitle>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* 基本資訊 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">基本資訊</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>商品名稱 <span className="text-red-500">*</span></Label>
                    <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="例：招牌鹽水雞" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>網址代稱 (slug)</Label>
                    <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="自動產生" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>分類 <span className="text-red-500">*</span></Label>
                  <Select value={form.categoryId ? form.categoryId.toString() : ""} onValueChange={(v) => setForm(p => ({ ...p, categoryId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
                    <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            {/* 價格與庫存 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">價格與庫存</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>建議售價 <span className="text-red-500">*</span></Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="239" />
                </div>
                <div className="space-y-1.5">
                  <Label>原價（劃線價）</Label>
                  <Input type="number" value={form.originalPrice} onChange={(e) => setForm(p => ({ ...p, originalPrice: e.target.value }))} placeholder="選填" />
                </div>
                <div className="space-y-1.5">
                  <Label>庫存數量</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </section>

            <Separator />

            {/* 圖片 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">商品圖片</h3>
              <ImageUploadZone
                images={form.images}
                onAdd={handleImageUpload}
                onRemove={handleRemoveImage}
                onSetPrimary={handleSetPrimary}
                isUploading={isUploading}
              />
              {form.images.length === 0 && (
                <div className="mt-3 space-y-1.5">
                  <Label className="text-gray-500">或直接輸入圖片網址</Label>
                  <Input value={form.imageUrl} onChange={(e) => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
                </div>
              )}
            </section>

            <Separator />

            {/* 商品介紹 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">商品介紹</h3>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="輸入商品詳細介紹（支援 Markdown 語法）"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">支援 Markdown 語法，例如 **粗體**、## 標題</p>
            </section>

            <Separator />

            {/* 規格 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">商品規格</h3>
              <SpecEditor specs={form.specifications} onChange={(s) => setForm(p => ({ ...p, specifications: s }))} />
            </section>

            <Separator />

            {/* 顯示設定 */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">顯示設定</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="font-medium text-sm">上架狀態</p><p className="text-xs text-gray-400">關閉後商品將從商城隱藏</p></div>
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm(p => ({ ...p, isActive: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="font-medium text-sm">精選商品</p><p className="text-xs text-gray-400">顯示於首頁精選區塊</p></div>
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm(p => ({ ...p, isFeatured: v }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>排序權重（數字越大越前面）</Label>
                  <Input type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className="w-32" />
                </div>
              </div>
            </section>
          </div>

          <DrawerFooter className="border-t sticky bottom-0 bg-white">
            <div className="flex gap-3 justify-end">
              <DrawerClose asChild>
                <Button variant="outline">取消</Button>
              </DrawerClose>
              <Button onClick={handleSubmit} disabled={isBusy || isUploading} className="bg-amber-600 hover:bg-amber-700 min-w-[100px]">
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId !== null ? "儲存變更" : "新增商品"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

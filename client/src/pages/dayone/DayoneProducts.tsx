import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", code: "", unit: "箱", defaultPrice: 0, isActive: true, imageUrl: null as string | null };

export default function DayoneProducts() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: "", sortOrder: 0 });
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });
  const { data: units = [] } = trpc.dayone.units.list.useQuery({ tenantId: TENANT_ID });

  const uploadImage = trpc.storage.uploadImage.useMutation();

  const upsertUnit = trpc.dayone.units.upsert.useMutation({
    onSuccess: () => {
      toast.success(editingUnit ? "單位已更新" : "單位已新增");
      setUnitOpen(false);
      setUnitForm({ name: "", sortOrder: 0 });
      setEditingUnit(null);
      utils.dayone.units.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteUnit = trpc.dayone.units.delete.useMutation({
    onSuccess: () => {
      toast.success("單位已刪除");
      utils.dayone.units.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const upsert = trpc.dayone.products.upsert.useMutation({
    onSuccess: () => {
      toast.success(editing ? "品項已更新" : "品項已新增");
      setOpen(false);
      utils.dayone.products.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteProduct = trpc.dayone.products.delete.useMutation({
    onSuccess: () => {
      toast.success("品項已刪除");
      setDeleteTarget(null);
      utils.dayone.products.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(product: any) {
    setEditing(product);
    setForm({
      name: product.name,
      code: product.code ?? "",
      unit: product.unit,
      defaultPrice: Number(product.defaultPrice),
      isActive: product.isActive !== false,
      imageUrl: product.imageUrl ?? null,
    });
    setOpen(true);
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片檔案");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片不能超過 5MB");
      return;
    }
    setImageUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({
        fileName: `dy-product-${Date.now()}-${file.name}`,
        fileData: base64,
        contentType: file.type,
      });
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success("圖片已上傳");
    } catch {
      toast.error("圖片上傳失敗");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <DayoneLayout>
      <div className="dayone-page">
        <div className="dayone-page-header">
          <div>
            <h1 className="dayone-page-title">品項管理</h1>
            <p className="dayone-page-subtitle">管理蛋品、包材與配送計價基礎 · 預設售價影響建單與報表</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="rounded-2xl" onClick={() => { setEditingUnit(null); setUnitForm({ name: "", sortOrder: 0 }); setUnitOpen(true); }}>
              管理單位
            </Button>
            <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新增品項
            </Button>
          </div>
        </div>

        <section className="rounded-[30px] border border-stone-200/70 bg-white shadow-[0_14px_28px_rgba(120,53,15,0.05)]">
          {isLoading ? (
            <div className="p-10 text-center text-stone-400">讀取中...</div>
          ) : products.length === 0 ? (
            <div className="p-14 text-center text-stone-400">
              <Package2 className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">目前還沒有品項資料。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50">
                  <tr>
                    {["圖片", "品項名稱", "代碼", "單位", "預設售價", "狀態", "操作"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left font-medium text-stone-500">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product.id} className="border-b transition-colors hover:bg-stone-50/80">
                      <td className="px-4 py-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
                            <Package2 className="h-5 w-5 text-stone-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-900">{product.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">{product.code ?? "-"}</td>
                      <td className="px-4 py-3 text-stone-600">{product.unit}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">NT$ {Number(product.defaultPrice).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge className={product.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}>
                          {product.isActive !== false ? "啟用中" : "已停用"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteTarget(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "編輯品項" : "新增品項"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>品項圖片</Label>
                <div className="mt-1 flex items-center gap-3">
                  {form.imageUrl ? (
                    <div className="relative">
                      <img src={form.imageUrl} alt="品項圖片" className="h-16 w-16 rounded-xl object-cover border border-stone-200" />
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-500 p-0.5 text-white"
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: null }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-stone-100 flex items-center justify-center border border-dashed border-stone-300">
                      <Package2 className="h-7 w-7 text-stone-300" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={imageUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-1.5 h-4 w-4" />
                      {imageUploading ? "上傳中..." : "選擇圖片"}
                    </Button>
                    <p className="mt-1 text-xs text-stone-400">支援 JPG、PNG，最大 5MB</p>
                  </div>
                </div>
              </div>
              <div>
                <Label>品項名稱</Label>
                <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div>
                <Label>代碼</Label>
                <Input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
              </div>
              <div>
                <Label>單位</Label>
                <Select value={form.unit} onValueChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(units.length ? units : [{ name: "箱" }]).map((unit: any) => (
                      <SelectItem key={unit.name} value={unit.name}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>預設售價</Label>
                <Input type="number" min={0} value={form.defaultPrice} onChange={(event) => setForm((prev) => ({ ...prev, defaultPrice: Number(event.target.value) }))} />
              </div>
              <div>
                <Label>狀態</Label>
                <Select value={form.isActive ? "active" : "inactive"} onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value === "active" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">啟用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-2 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={upsert.isPending || imageUploading}
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error("請先填寫品項名稱");
                  return;
                }
                upsert.mutate({
                  tenantId: TENANT_ID,
                  id: editing?.id,
                  name: form.name,
                  code: form.code,
                  unit: form.unit,
                  defaultPrice: Number(form.defaultPrice),
                  isActive: form.isActive,
                  imageUrl: form.imageUrl ?? null,
                });
              }}
            >
              {upsert.isPending ? "儲存中..." : "確認儲存"}
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(value) => { if (!value) setDeleteTarget(null); }}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle>刪除品項</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-6 text-stone-500">
              確定要刪除 <span className="font-semibold text-stone-900">{deleteTarget?.name}</span> 嗎？這會影響後續選單與建單資料。
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button
                className="bg-rose-600 text-white hover:bg-rose-700"
                disabled={deleteProduct.isPending}
                onClick={() => deleteProduct.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}
              >
                {deleteProduct.isPending ? "刪除中..." : "確認刪除"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>單位設定</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-stone-200">
                <table className="w-full text-sm">
                  <thead className="border-b bg-stone-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-stone-500">單位名稱</th>
                      <th className="px-3 py-2 text-left font-medium text-stone-500">排序</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit: any) => (
                      <tr key={unit.id} className="border-b last:border-b-0">
                        {editingUnit?.id === unit.id ? (
                          <>
                            <td className="px-3 py-2"><Input className="h-8" value={editingUnit.name} onChange={(event) => setEditingUnit((prev: any) => ({ ...prev, name: event.target.value }))} /></td>
                            <td className="px-3 py-2"><Input className="h-8 w-20" type="number" value={editingUnit.sortOrder} onChange={(event) => setEditingUnit((prev: any) => ({ ...prev, sortOrder: Number(event.target.value) }))} /></td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2 text-xs">
                                <button type="button" className="text-amber-600" onClick={() => upsertUnit.mutate({ id: unit.id, tenantId: TENANT_ID, name: editingUnit.name, sortOrder: editingUnit.sortOrder })}>儲存</button>
                                <button type="button" className="text-stone-400" onClick={() => setEditingUnit(null)}>取消</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-stone-900">{unit.name}</td>
                            <td className="px-3 py-2 text-stone-500">{unit.sortOrder}</td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2 text-xs">
                                <button type="button" className="text-amber-600" onClick={() => setEditingUnit({ id: unit.id, name: unit.name, sortOrder: unit.sortOrder })}>編輯</button>
                                <button type="button" className="text-rose-500" onClick={() => deleteUnit.mutate({ id: unit.id, tenantId: TENANT_ID })}>刪除</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Input placeholder="新增單位名稱" value={unitForm.name} onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))} />
                <Button
                  className="shrink-0 rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
                  onClick={() => {
                    if (!unitForm.name.trim()) return;
                    upsertUnit.mutate({ tenantId: TENANT_ID, name: unitForm.name, sortOrder: unitForm.sortOrder });
                  }}
                >
                  新增
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

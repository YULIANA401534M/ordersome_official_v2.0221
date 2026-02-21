import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Package, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "", slug: "", description: "", price: "", originalPrice: "",
    categoryId: 0, stock: 100, imageUrl: "", isActive: true, isFeatured: false,
  });

  const { data: products, isLoading, refetch } = trpc.product.listAll.useQuery();
  const { data: categories } = trpc.category.listAll.useQuery();
  
  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => { toast.success("商品新增成功"); setIsAddDialogOpen(false); resetForm(); refetch(); },
    onError: (error) => { toast.error("新增失敗: " + error.message); },
  });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => { toast.success("商品更新成功"); setIsEditDialogOpen(false); setEditingProduct(null); refetch(); },
    onError: (error) => { toast.error("更新失敗: " + error.message); },
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => { toast.success("商品刪除成功"); refetch(); },
    onError: (error) => { toast.error("刪除失敗: " + error.message); },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", price: "", originalPrice: "", categoryId: 0, stock: 100, imageUrl: "", isActive: true, isFeatured: false });
  };

  const handleAdd = () => {
    if (!formData.name || !formData.price || !formData.categoryId) { toast.error("請填寫必要欄位"); return; }
    createMutation.mutate({ ...formData, slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-") });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({ name: product.name, slug: product.slug, description: product.description || "", price: product.price, originalPrice: product.originalPrice || "", categoryId: product.categoryId, stock: product.stock || 0, imageUrl: product.imageUrl || "", isActive: product.isActive, isFeatured: product.isFeatured });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => { if (!editingProduct) return; updateMutation.mutate({ id: editingProduct.id, ...formData }); };
  const handleDelete = (id: number) => { if (confirm("確定要刪除此商品嗎？")) { deleteMutation.mutate({ id }); } };
  const filteredProducts = products?.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isAuthenticated || user?.role !== "super_admin" && user?.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">需要管理員權限</h2>
          <p className="text-gray-500 mb-4">請使用管理員帳號登入</p>
          <Link href="/"><Button variant="outline">返回首頁</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  const ProductForm = ({ onSubmit, submitText }: { onSubmit: () => void; submitText: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>商品名稱 *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="輸入商品名稱" /></div>
        <div><Label>網址代稱</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="自動產生" /></div>
      </div>
      <div><Label>商品描述</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="輸入商品描述" rows={3} /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>售價 *</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="239" /></div>
        <div><Label>原價</Label><Input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} placeholder="選填" /></div>
        <div><Label>庫存</Label><Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} /></div>
      </div>
      <div><Label>分類 *</Label>
        <Select value={formData.categoryId.toString()} onValueChange={(v) => setFormData({ ...formData, categoryId: parseInt(v) })}>
          <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
          <SelectContent>{categories?.map((cat) => (<SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      <div><Label>圖片網址</Label><Input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="/products/example.jpg" /></div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2"><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} /><Label>上架中</Label></div>
        <div className="flex items-center gap-2"><Switch checked={formData.isFeatured} onCheckedChange={(v) => setFormData({ ...formData, isFeatured: v })} /><Label>精選商品</Label></div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>取消</Button>
        <Button onClick={onSubmit} className="bg-amber-600 hover:bg-amber-700">{submitText}</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white py-4">
        <div className="container flex items-center gap-4">
          <Link href="/admin"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4 mr-2" /> 返回</Button></Link>
          <h1 className="text-xl font-bold">商品管理</h1>
        </div>
      </div>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>商品列表</CardTitle>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="搜尋商品..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild><Button className="bg-amber-600 hover:bg-amber-700" onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> 新增</Button></DialogTrigger>
                  <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>新增商品</DialogTitle></DialogHeader><ProductForm onSubmit={handleAdd} submitText="新增商品" /></DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (<div className="text-center py-8 text-gray-500">載入中...</div>) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>商品</TableHead><TableHead>價格</TableHead><TableHead>庫存</TableHead><TableHead>狀態</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell><div className="flex items-center gap-3">{product.imageUrl ? (<img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded object-cover" />) : (<div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center"><Package className="h-6 w-6 text-gray-400" /></div>)}<div><p className="font-medium">{product.name}</p><p className="text-sm text-gray-500">{product.slug}</p></div></div></TableCell>
                        <TableCell><p className="font-medium">NT$ {product.price}</p>{product.originalPrice && (<p className="text-sm text-gray-400 line-through">NT$ {product.originalPrice}</p>)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell><div className="flex flex-col gap-1"><Badge variant="outline" className={product.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500"}>{product.isActive ? "上架中" : "已下架"}</Badge>{product.isFeatured && (<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">精選</Badge>)}</div></TableCell>
                        <TableCell><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => handleEdit(product)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (<div className="text-center py-8 text-gray-500"><Package className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>尚無商品資料</p></div>)}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>編輯商品</DialogTitle></DialogHeader><ProductForm onSubmit={handleUpdate} submitText="儲存變更" /></DialogContent></Dialog>
    </div>
  );
}

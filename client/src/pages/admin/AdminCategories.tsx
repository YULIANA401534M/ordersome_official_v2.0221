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
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Layers, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminCategories() {
  const { user, isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", isActive: true });

  const { data: categories, isLoading, refetch } = trpc.category.listAll.useQuery();
  
  const createMutation = trpc.category.create.useMutation({
    onSuccess: () => { toast.success("分類新增成功"); setIsAddDialogOpen(false); resetForm(); refetch(); },
    onError: (error) => { toast.error("新增失敗: " + error.message); },
  });

  const updateMutation = trpc.category.update.useMutation({
    onSuccess: () => { toast.success("分類更新成功"); setIsEditDialogOpen(false); setEditingCategory(null); refetch(); },
    onError: (error) => { toast.error("更新失敗: " + error.message); },
  });

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => { toast.success("分類刪除成功"); refetch(); },
    onError: (error) => { toast.error("刪除失敗: " + error.message); },
  });

  const resetForm = () => { setFormData({ name: "", slug: "", description: "", isActive: true }); };

  const handleAdd = () => {
    if (!formData.name) { toast.error("請填寫分類名稱"); return; }
    createMutation.mutate({ ...formData, slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-") });
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug, description: category.description || "", isActive: category.isActive });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => { if (!editingCategory) return; updateMutation.mutate({ id: editingCategory.id, ...formData }); };
  const handleDelete = (id: number) => { if (confirm("確定要刪除此分類嗎？")) { deleteMutation.mutate({ id }); } };

  if (!isAuthenticated || user?.role !== "super_admin" && user?.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md"><CardContent className="p-8 text-center">
          <Layers className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">需要管理員權限</h2>
          <p className="text-gray-500 mb-4">請使用管理員帳號登入</p>
          <Link href="/"><Button variant="outline">返回首頁</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

  const CategoryForm = ({ onSubmit, submitText }: { onSubmit: () => void; submitText: string }) => (
    <div className="space-y-4">
      <div><Label>分類名稱 *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="輸入分類名稱" /></div>
      <div><Label>網址代稱</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="自動產生" /></div>
      <div><Label>描述</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="輸入分類描述" rows={3} /></div>
      <div className="flex items-center gap-2"><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} /><Label>啟用中</Label></div>
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
          <h1 className="text-xl font-bold">分類管理</h1>
        </div>
      </div>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>分類列表</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild><Button className="bg-amber-600 hover:bg-amber-700" onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> 新增</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>新增分類</DialogTitle></DialogHeader><CategoryForm onSubmit={handleAdd} submitText="新增分類" /></DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (<div className="text-center py-8 text-gray-500">載入中...</div>) : categories && categories.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>名稱</TableHead><TableHead>網址代稱</TableHead><TableHead>狀態</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-gray-500">{cat.slug}</TableCell>
                      <TableCell><Badge variant="outline" className={cat.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500"}>{cat.isActive ? "啟用中" : "已停用"}</Badge></TableCell>
                      <TableCell><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (<div className="text-center py-8 text-gray-500"><Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" /><p>尚無分類資料</p></div>)}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent><DialogHeader><DialogTitle>編輯分類</DialogTitle></DialogHeader><CategoryForm onSubmit={handleUpdate} submitText="儲存變更" /></DialogContent></Dialog>
    </div>
  );
}

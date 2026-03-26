import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus } from 'lucide-react';
export default function SupplierList() {
  const [tenantId] = useState(2); // 大永蛋品 tenantId
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    phone: '',
    address: '',
    bankAccount: '',
    status: 'active' as const,
  });

  const { data: suppliers, refetch } = trpc.dayone.suppliers.list.useQuery({ tenantId });
  const createMutation = trpc.dayone.suppliers.upsert.useMutation({
    onSuccess: () => {
      alert(editingId ? '供應商已更新' : '供應商已新增');
      refetch();
      resetForm();
    },
    onError: (err: any) => {
      alert('錯誤：' + (err.message || '操作失敗'));
    },
  });
  const deleteMutation = trpc.dayone.suppliers.delete.useMutation({
    onSuccess: () => {
      alert('供應商已刪除');
      refetch();
    },
    onError: (err: any) => {
      alert('錯誤：' + (err.message || '刪除失敗'));
    },
  });
  const toggleMutation = trpc.dayone.suppliers.toggleStatus.useMutation({
    onSuccess: () => {
      alert('狀態已更新');
      refetch();
    },
    onError: (err: any) => {
      alert('錯誤：' + (err.message || '更新失敗'));
    },
  });

  const resetForm = () => {
    setForm({ name: '', contact: '', phone: '', address: '', bankAccount: '', status: 'active' });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert('請輸入供應商名稱');
      return;
    }
    await createMutation.mutateAsync({
      id: editingId ?? undefined,
      tenantId,
      ...form,
    });
  };

  const handleEdit = (supplier: any) => {
    setForm({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      bankAccount: supplier.bankAccount || '',
      status: supplier.status,
    });
    setEditingId(supplier.id);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">供應商管理</h1>
        <Button onClick={() => { resetForm(); setIsOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          新增供應商
        </Button>
      </div>

      <div className="grid gap-4">
        {suppliers?.map((supplier: any) => (
          <Card key={supplier.id} className={supplier.status === 'inactive' ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <p className="text-sm text-gray-600">聯絡人：{supplier.contact || '-'}</p>
                  <p className="text-sm text-gray-600">電話：{supplier.phone || '-'}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: supplier.id, tenantId })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">地址：{supplier.address || '-'}</p>
              <p className="text-sm">銀行帳戶：{supplier.bankAccount || '-'}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleMutation.mutate({
                  id: supplier.id,
                  tenantId,
                  status: supplier.status === 'active' ? 'inactive' : 'active',
                })}
              >
                {supplier.status === 'active' ? '停用' : '啟用'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '編輯供應商' : '新增供應商'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">供應商名稱 *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="輸入供應商名稱"
              />
            </div>
            <div>
              <label className="text-sm font-medium">聯絡人</label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="輸入聯絡人名稱"
              />
            </div>
            <div>
              <label className="text-sm font-medium">電話</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="輸入電話"
              />
            </div>
            <div>
              <label className="text-sm font-medium">地址</label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="輸入地址"
              />
            </div>
            <div>
              <label className="text-sm font-medium">銀行帳戶</label>
              <Input
                value={form.bankAccount}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                placeholder="輸入銀行帳戶"
              />
            </div>
            <div>
              <label className="text-sm font-medium">狀態</label>
              <Select value={form.status} onValueChange={(value: any) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">啟用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>取消</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? '處理中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

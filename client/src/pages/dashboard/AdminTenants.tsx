import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Building2, Plus, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminTenants() {
  const { data: tenants, isLoading, refetch } = trpc.tenant.list.useQuery();
  const createMutation = trpc.tenant.create.useMutation({
    onSuccess: () => {
      toast.success("租戶建立成功");
      refetch();
      setCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });
  const updateMutation = trpc.tenant.update.useMutation({
    onSuccess: () => {
      toast.success("租戶更新成功");
      refetch();
      setEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", slug: "", plan: "trial" as const });
  const [editForm, setEditForm] = useState<{
    id: number;
    name: string;
    slug: string;
    plan: "trial" | "basic" | "pro";
    isActive: boolean;
  } | null>(null);

  const resetCreateForm = () => setCreateForm({ name: "", slug: "", plan: "trial" });

  const handleCreate = () => {
    if (!createForm.name || !createForm.slug) {
      toast.error("名稱和代碼為必填");
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleEdit = (tenant: any) => {
    setEditForm({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      isActive: tenant.isActive,
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editForm) return;
    updateMutation.mutate(editForm);
  };

  const planLabel: Record<string, string> = {
    trial: "試用版",
    basic: "基本版",
    pro: "專業版",
  };

  const planColor: Record<string, string> = {
    trial: "bg-gray-100 text-gray-700",
    basic: "bg-blue-100 text-blue-700",
    pro: "bg-amber-100 text-amber-700",
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">租戶管理</h1>
            <p className="text-muted-foreground mt-1">
              管理多租戶架構中的所有品牌租戶
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增租戶
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增租戶</DialogTitle>
                <DialogDescription>建立新的品牌租戶，用於資料隔離</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">租戶名稱</Label>
                  <Input
                    id="name"
                    placeholder="例如：來點什麼"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">代碼（URL 識別碼）</Label>
                  <Input
                    id="slug"
                    placeholder="例如：ordersome"
                    value={createForm.slug}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">只能包含小寫字母、數字和連字號</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">方案</Label>
                  <Select
                    value={createForm.plan}
                    onValueChange={(v) => setCreateForm({ ...createForm, plan: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">試用版</SelectItem>
                      <SelectItem value="basic">基本版</SelectItem>
                      <SelectItem value="pro">專業版</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  建立
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tenant List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !tenants || tenants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">尚未建立任何租戶</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant: any) => (
              <Card key={tenant.id} className={!tenant.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {tenant.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        /{tenant.slug}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className={planColor[tenant.plan] || "bg-gray-100"}>
                      {planLabel[tenant.plan] || tenant.plan}
                    </Badge>
                    <Badge variant={tenant.isActive ? "default" : "secondary"}>
                      {tenant.isActive ? "啟用中" : "已停用"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    ID: {tenant.id} &middot; 建立於{" "}
                    {new Date(tenant.createdAt).toLocaleDateString("zh-TW")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯租戶</DialogTitle>
              <DialogDescription>修改租戶資訊和狀態</DialogDescription>
            </DialogHeader>
            {editForm && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>租戶名稱</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>代碼</Label>
                  <Input
                    value={editForm.slug}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>方案</Label>
                  <Select
                    value={editForm.plan}
                    onValueChange={(v) => setEditForm({ ...editForm, plan: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">試用版</SelectItem>
                      <SelectItem value="basic">基本版</SelectItem>
                      <SelectItem value="pro">專業版</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>啟用狀態</Label>
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                儲存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}

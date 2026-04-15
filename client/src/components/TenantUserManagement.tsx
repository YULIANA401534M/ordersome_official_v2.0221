import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  manager: "管理員",
  staff: "員工",
  driver: "司機",
};

const ROLE_BADGE_CLS: Record<string, string> = {
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
  driver: "bg-orange-100 text-orange-700",
};

const emptyCreateForm = {
  name: "",
  email: "",
  phone: "",
  role: "staff" as "manager" | "staff" | "driver",
  password: "",
};

const emptyEditForm = {
  name: "",
  phone: "",
  role: "staff" as "manager" | "staff" | "driver",
};

interface Props {
  tenantId: number;
  tenantName: string;
}

export default function TenantUserManagement({ tenantId, tenantName }: Props) {
  const utils = trpc.useUtils();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = trpc.dayone.tenantUsers.listUsers.useQuery({ tenantId });

  const createMut = trpc.dayone.tenantUsers.createUser.useMutation({
    onSuccess: () => {
      toast.success("用戶已新增");
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      utils.dayone.tenantUsers.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.dayone.tenantUsers.updateUser.useMutation({
    onSuccess: () => {
      toast.success("用戶已更新");
      setEditOpen(false);
      utils.dayone.tenantUsers.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetPwMut = trpc.dayone.tenantUsers.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已重設");
      setResetOpen(false);
      setNewPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.dayone.tenantUsers.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("用戶已刪除");
      setDeleteOpen(false);
      utils.dayone.tenantUsers.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function openEdit(user: any) {
    setSelectedUser(user);
    setEditForm({ name: user.name ?? "", phone: user.phone ?? "", role: user.role });
    setEditOpen(true);
  }

  function openReset(user: any) {
    setSelectedUser(user);
    setNewPassword("");
    setResetOpen(true);
  }

  function openDelete(user: any) {
    setSelectedUser(user);
    setDeleteOpen(true);
  }

  function fmtDate(v: string | null | undefined) {
    if (!v) return "-";
    return new Date(v).toLocaleDateString("zh-TW");
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tenantName} — 用戶管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">管理員、員工、司機帳號</p>
        </div>
        <Button onClick={() => { setCreateForm(emptyCreateForm); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          新增用戶
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">載入中...</div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">尚無用戶</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{user.email ?? "-"}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{user.phone ?? "-"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${ROLE_BADGE_CLS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{fmtDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)} title="編輯">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openReset(user)} title="重設密碼">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDelete(user)} title="刪除">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增用戶 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="請輸入姓名" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="請輸入 Email" />
            </div>
            <div className="space-y-1.5">
              <Label>電話</Label>
              <Input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="請輸入電話" />
            </div>
            <div className="space-y-1.5">
              <Label>角色 *</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">管理員</SelectItem>
                  <SelectItem value="staff">員工</SelectItem>
                  <SelectItem value="driver">司機</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>密碼 *（至少 6 碼）</Label>
              <Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="請設定密碼" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button
              disabled={!createForm.name || !createForm.email || !createForm.password || createMut.isPending}
              onClick={() => createMut.mutate({ tenantId, ...createForm })}
            >
              {createMut.isPending ? "新增中..." : "新增"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 編輯用戶 Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>編輯用戶 — {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>電話</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>角色 *</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">管理員</SelectItem>
                  <SelectItem value="staff">員工</SelectItem>
                  <SelectItem value="driver">司機</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button
              disabled={!editForm.name || updateMut.isPending}
              onClick={() => updateMut.mutate({ id: selectedUser.id, tenantId, ...editForm })}
            >
              {updateMut.isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 重設密碼 Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重設密碼 — {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>新密碼（至少 6 碼）</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="請輸入新密碼" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
            <Button
              disabled={newPassword.length < 6 || resetPwMut.isPending}
              onClick={() => resetPwMut.mutate({ id: selectedUser.id, tenantId, newPassword })}
            >
              {resetPwMut.isPending ? "重設中..." : "重設密碼"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除用戶「{selectedUser?.name}（{selectedUser?.email}）」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMut.mutate({ id: selectedUser.id, tenantId })}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

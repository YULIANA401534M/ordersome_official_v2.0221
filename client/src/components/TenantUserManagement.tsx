import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, KeyRound, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  manager: "管理員",
  staff: "員工",
  driver: "司機",
};

const ROLE_BADGE_CLS: Record<string, string> = {
  manager: "bg-blue-100 text-blue-700",
  staff: "bg-green-100 text-green-700",
  driver: "bg-amber-100 text-amber-700",
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
      toast.success("用戶建立成功");
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      utils.dayone.tenantUsers.listUsers.invalidate();
    },
    onError: (e) => {
      if (e.message.includes("CONFLICT") || e.message.includes("已被使用")) {
        toast.error("此 Email 已被使用，請換一個");
      } else {
        toast.error("建立失敗，請確認所有欄位填寫正確");
      }
    },
  });

  const updateMut = trpc.dayone.tenantUsers.updateUser.useMutation({
    onSuccess: () => {
      toast.success("用戶資料已更新");
      setEditOpen(false);
      utils.dayone.tenantUsers.listUsers.invalidate();
    },
    onError: () => toast.error("更新失敗，請重試"),
  });

  const resetPwMut = trpc.dayone.tenantUsers.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已重設");
      setResetOpen(false);
      setNewPassword("");
    },
    onError: () => toast.error("重設密碼失敗，請重試"),
  });

  const deleteMut = trpc.dayone.tenantUsers.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("用戶已刪除");
      setDeleteOpen(false);
      utils.dayone.tenantUsers.listUsers.invalidate();
    },
    onError: () => toast.error("刪除失敗，請重試"),
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
    <div className="space-y-6">
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">{tenantName} 用戶管理</h1>
          <p className="dayone-page-subtitle">集中管理管理員、員工與司機帳號，手機上改用卡片顯示避免橫向滑動。</p>
        </div>
        <Button
          onClick={() => {
            setCreateForm(emptyCreateForm);
            setCreateOpen(true);
          }}
          className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          新增用戶
        </Button>
      </div>

      <div className="dayone-panel overflow-hidden rounded-[28px]">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-stone-400">載入中...</div>
        ) : users.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-stone-400">目前沒有任何用戶資料。</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50">
                  <tr>
                    <th className="px-5 py-4 text-left font-medium text-stone-500">姓名</th>
                    <th className="px-5 py-4 text-left font-medium text-stone-500">Email</th>
                    <th className="px-5 py-4 text-left font-medium text-stone-500">電話</th>
                    <th className="px-5 py-4 text-left font-medium text-stone-500">角色</th>
                    <th className="px-5 py-4 text-left font-medium text-stone-500">建立日期</th>
                    <th className="px-5 py-4 text-right font-medium text-stone-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b last:border-b-0">
                      <td className="px-5 py-4 font-medium">{user.name ?? "-"}</td>
                      <td className="px-5 py-4 text-stone-600">{user.email ?? "-"}</td>
                      <td className="px-5 py-4 text-stone-600">{user.phone ?? "-"}</td>
                      <td className="px-5 py-4">
                        <Badge className={`text-xs ${ROLE_BADGE_CLS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-stone-500">{fmtDate(user.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openReset(user)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dayone-mobile-list p-4 md:hidden">
              {users.map((user: any) => (
                <article key={user.id} className="dayone-mobile-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-stone-900">{user.name ?? "-"}</h2>
                      <p className="mt-1 text-xs text-stone-400">建立於 {fmtDate(user.createdAt)}</p>
                    </div>
                    <Badge className={`text-xs ${ROLE_BADGE_CLS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="break-all text-stone-700">{user.email ?? "-"}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="mt-0.5 h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">{user.phone ?? "-"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={() => openEdit(user)}>
                      編輯
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => openReset(user)}>
                      重設
                    </Button>
                    <Button variant="outline" className="rounded-2xl text-red-600 hover:text-red-700" onClick={() => openDelete(user)}>
                      刪除
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>電話</Label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>角色 *</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">管理員</SelectItem>
                  <SelectItem value="staff">員工</SelectItem>
                  <SelectItem value="driver">司機</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>密碼 * <span className="text-xs font-normal text-stone-400">（至少 6 個字元）</span></Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="至少 6 個字元" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button
              disabled={createMut.isPending}
              onClick={() => {
                if (!createForm.name.trim()) { toast.error("請填寫姓名"); return; }
                if (!createForm.email.trim()) { toast.error("請填寫 Email"); return; }
                if (createForm.password.length < 6) { toast.error("密碼至少需要 6 個字元"); return; }
                createMut.mutate({ tenantId, ...createForm });
              }}
            >
              {createMut.isPending ? "建立中..." : "建立"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>編輯用戶</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>電話</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>角色 *</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              {updateMut.isPending ? "更新中..." : "更新"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重設密碼</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>新密碼 <span className="text-xs font-normal text-stone-400">（至少 6 個字元）</span></Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少 6 個字元" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
            <Button
              disabled={newPassword.length < 6 || resetPwMut.isPending}
              onClick={() => resetPwMut.mutate({ id: selectedUser.id, tenantId, newPassword })}
            >
              {resetPwMut.isPending ? "重設中..." : "確認重設"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此用戶嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              你將刪除 {selectedUser?.name}（{selectedUser?.email}），這個動作無法復原。
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

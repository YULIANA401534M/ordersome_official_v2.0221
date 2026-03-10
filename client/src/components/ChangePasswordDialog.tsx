import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 判斷是否為 OAuth 用戶（Google/LINE 登入，尚未設定密碼）
  const isOAuthUser = user?.loginMethod === "google" || user?.loginMethod === "line";

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleClose = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("請填寫所有欄位");
      return;
    }
    if (!isOAuthUser && !oldPassword) {
      toast.error("請輸入舊密碼");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("新密碼至少需要 6 個字元");
      return;
    }
    changePassword.mutate({
      oldPassword: isOAuthUser ? undefined : oldPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOAuthUser ? (
              <KeyRound className="w-5 h-5 text-primary" />
            ) : (
              <Lock className="w-5 h-5 text-primary" />
            )}
            {isOAuthUser ? "設定密碼" : "修改密碼"}
          </DialogTitle>
          <DialogDescription>
            {isOAuthUser ? (
              <>
                您目前使用 <strong>{user?.loginMethod === "google" ? "Google" : "LINE"}</strong> 帳號登入。
                設定密碼後，您也可以使用 Email + 密碼登入。
              </>
            ) : (
              "請輸入舊密碼以驗證身份，再設定新密碼。"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 舊密碼（僅一般帳號顯示） */}
          {!isOAuthUser && (
            <div className="space-y-1.5">
              <Label htmlFor="old-password">舊密碼</Label>
              <div className="relative">
                <Input
                  id="old-password"
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="請輸入目前的密碼"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* 新密碼 */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password">{isOAuthUser ? "設定密碼" : "新密碼"}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 個字元"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 確認密碼 */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">確認密碼</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入密碼"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">密碼不一致</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={changePassword.isPending}>
              取消
            </Button>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isOAuthUser ? "設定中..." : "更新中..."}
                </>
              ) : (
                isOAuthUser ? "確認設定" : "確認更新"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

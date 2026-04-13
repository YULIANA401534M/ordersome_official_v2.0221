import { useState } from "react";
import DayonePortalLayout from "./DayonePortalLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const LIFF_ID = "2009700774-rWyJ27md";

const LEVEL_CFG: Record<string, { label: string; cls: string }> = {
  supplier: { label: "供應商", cls: "bg-purple-100 text-purple-700" },
  store:    { label: "合作店家", cls: "bg-amber-100 text-amber-700" },
  retail:   { label: "散戶",   cls: "bg-gray-100 text-gray-600" },
};
const CYCLE_LABELS: Record<string, string> = {
  per_delivery: "每次現付",
  weekly: "週結",
  monthly: "月結",
};

function fmtMoney(v: number | string | null | undefined) {
  return `$${Number(v ?? 0).toLocaleString("zh-TW")}`;
}

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [old, setOld] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const mut = trpc.dayone.portal.changePassword.useMutation({
    onSuccess: () => { toast.success("密碼已更新"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirm) { toast.error("兩次密碼不一致"); return; }
    if (newPwd.length < 6) { toast.error("新密碼至少 6 碼"); return; }
    mut.mutate({ oldPassword: old, newPassword: newPwd });
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>修改密碼</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-1">
          <Input type="password" placeholder="目前密碼" value={old} onChange={(e) => setOld(e.target.value)} />
          <Input type="password" placeholder="新密碼（至少 6 碼）" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <Input type="password" placeholder="確認新密碼" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={mut.isPending}>
              {mut.isPending ? "更新中..." : "確認修改"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DayonePortalAccount() {
  const [showPwd, setShowPwd] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [lineBinding, setLineBinding] = useState(false);

  const { data: me, refetch: refetchMe } = trpc.dayone.portal.me.useQuery();
  const { data: prices = [] } = trpc.dayone.portal.myPrices.useQuery();

  const bindLine = trpc.dayone.portal.bindLine.useMutation({
    onSuccess: () => { toast.success("LINE 帳號綁定成功"); refetchMe(); },
    onError: (e) => toast.error(e.message),
  });

  const customer = (me as any)?.customer;
  const boxBalance = (me as any)?.boxBalance ?? 0;

  async function handleBindLine() {
    setLineBinding(true);
    try {
      const liff = (window as any).liff;
      if (!liff) { toast.error("LIFF SDK 未載入"); return; }
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      const profile = await liff.getProfile();
      bindLine.mutate({ lineUserId: profile.userId });
    } catch (e: any) {
      toast.error(e.message ?? "LINE 綁定失敗");
    } finally {
      setLineBinding(false);
    }
  }

  return (
    <DayonePortalLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-lg font-bold text-gray-900">我的帳戶</h1>

        {/* 客戶資料 */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">基本資料</p>
            {customer ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">姓名</span>
                  <span className="font-medium text-gray-900">{customer.name}</span>
                </div>
                {customer.loginEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-700">{customer.loginEmail}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">電話</span>
                    <span className="text-gray-700">{customer.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">客戶等級</span>
                  {customer.customerLevel && (
                    <Badge className={`${LEVEL_CFG[customer.customerLevel]?.cls ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>
                      {LEVEL_CFG[customer.customerLevel]?.label ?? customer.customerLevel}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">結算週期</span>
                  <span className="text-gray-700">{CYCLE_LABELS[customer.settlementCycle ?? ""] ?? "-"}</span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse h-20 bg-gray-100 rounded" />
            )}
          </CardContent>
        </Card>

        {/* 空箱餘額 */}
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 mb-1">空箱餘額</p>
            <p className={`text-4xl font-black ${boxBalance < 0 ? "text-red-600" : "text-amber-700"}`}>{boxBalance}</p>
            {boxBalance < 0 && (
              <p className="text-xs text-red-500 mt-1">⚠️ 餘額為負，請確認空箱歸還情況</p>
            )}
          </CardContent>
        </Card>

        {/* 我的價目表 */}
        <Card>
          <CardContent className="pt-4">
            <button
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
              onClick={() => setShowPrices(!showPrices)}>
              <span>我的價目表</span>
              {showPrices ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPrices && (
              <div className="mt-3 space-y-1.5 text-sm">
                {!(prices as any[]).length ? (
                  <p className="text-gray-400 text-xs">尚無價格資料</p>
                ) : (
                  (prices as any[]).map((p: any) => (
                    <div key={p.productId} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{p.productName}</span>
                      <span className="font-semibold text-amber-700">{fmtMoney(p.price)} / {p.unit ?? "箱"}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按鈕 */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 h-11"
            onClick={() => setShowPwd(true)}>
            🔑 修改密碼
          </Button>
          {customer && !customer.lineUserId && (
            <Button variant="outline" className="w-full justify-start gap-2 h-11 text-[#06C755] border-[#06C755] hover:bg-green-50"
              disabled={lineBinding || bindLine.isPending}
              onClick={handleBindLine}>
              LINE 綁定 LINE 帳號
            </Button>
          )}
          {customer?.lineUserId && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 text-sm text-green-700">
              ✓ 已綁定 LINE 帳號
            </div>
          )}
        </div>
      </div>

      {showPwd && <ChangePasswordDialog onClose={() => setShowPwd(false)} />}
    </DayonePortalLayout>
  );
}

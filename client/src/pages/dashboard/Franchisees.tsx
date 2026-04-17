import { useState, useRef } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("zh-TW");
}

function fmtAmount(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── FranchiseeDetailDialog ────────────────────────────────────────────────────

function FranchiseeDetailDialog({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const detail = trpc.franchisee.franchiseeDetail.useQuery({ userId });
  const stores = trpc.store.listAll.useQuery();

  const [basicForm, setBasicForm] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    direction: "receivable" as "receivable" | "paid",
    category: "週結帳款",
    note: "",
  });
  const [contractForm, setContractForm] = useState({
    contractType: "加盟合約",
    signedAt: "",
    expiresAt: "",
    note: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFranchisee = trpc.franchisee.franchiseeUpdate.useMutation({
    onSuccess: () => {
      toast.success("已儲存");
      utils.franchisee.franchiseeList.invalidate();
      utils.franchisee.franchiseeDetail.invalidate({ userId });
    },
    onError: (e) => toast.error(e.message),
  });

  const contractUpload = trpc.franchisee.contractUpload.useMutation({
    onSuccess: () => {
      toast.success("合約已上傳");
      utils.franchisee.franchiseeDetail.invalidate({ userId });
      setContractForm({ contractType: "加盟合約", signedAt: "", expiresAt: "", note: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadPdf = trpc.storage.uploadPdf.useMutation();
  const uploadImage = trpc.storage.uploadImage.useMutation();

  const paymentUpsert = trpc.franchisee.paymentUpsert.useMutation({
    onSuccess: () => {
      toast.success("帳款已新增");
      utils.franchisee.franchiseeDetail.invalidate({ userId });
      setPaymentForm({ paymentDate: new Date().toISOString().slice(0, 10), amount: "", direction: "receivable", category: "週結帳款", note: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  if (detail.isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const data = detail.data;
  if (!data) return null;

  const { user, contracts, payments } = data;
  const form = basicForm ?? {
    storeId: user.storeId ?? "",
    status: user.status ?? "active",
    has_procurement_access: !!user.has_procurement_access,
    internalContact: user.internalContact ?? "",
  };

  function saveBasic() {
    updateFranchisee.mutate({
      userId,
      storeId: form.storeId || undefined,
      status: form.status,
      has_procurement_access: form.has_procurement_access,
      internalContact: form.internalContact || undefined,
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const fileData = ev.target?.result as string;
      try {
        let fileUrl: string;
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const res = await uploadPdf.mutateAsync({ fileName: file.name, fileData });
          fileUrl = res.url;
        } else {
          const res = await uploadImage.mutateAsync({ fileName: file.name, fileData, contentType: file.type });
          fileUrl = res.url;
        }
        contractUpload.mutate({
          userId,
          fileUrl,
          fileName: file.name,
          contractType: contractForm.contractType,
          signedAt: contractForm.signedAt || undefined,
          expiresAt: contractForm.expiresAt || undefined,
          note: contractForm.note || undefined,
        });
      } catch (err: any) {
        toast.error(err.message || "上傳失敗");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function addPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentForm.amount) { toast.error("請填金額"); return; }
    paymentUpsert.mutate({
      userId,
      paymentDate: paymentForm.paymentDate,
      amount: Number(paymentForm.amount),
      direction: paymentForm.direction,
      category: paymentForm.category,
      note: paymentForm.note || undefined,
    });
  }

  const isUploading = uploadPdf.isPending || uploadImage.isPending || contractUpload.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user.name} — 加盟主管理</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">基本資料</TabsTrigger>
            <TabsTrigger value="contracts">合約管理</TabsTrigger>
            <TabsTrigger value="payments">帳款往來</TabsTrigger>
          </TabsList>

          {/* ── 基本資料 ── */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 pb-3 border-b">
              <div>Email：{user.email ?? "-"}</div>
              <div>電話：{user.phone ?? "-"}</div>
              <div>建立：{fmtDate(user.createdAt)}</div>
              <div>最後登入：{fmtDate(user.last_login_at)}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">綁定門市</label>
                <Select
                  value={form.storeId || "__none"}
                  onValueChange={v => setBasicForm({ ...form, storeId: v === "__none" ? "" : v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="未綁定" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">未綁定</SelectItem>
                    {(stores.data ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">帳號狀態</label>
                <Select
                  value={form.status}
                  onValueChange={v => setBasicForm({ ...form, status: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">啟用</SelectItem>
                    <SelectItem value="suspended">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">內部聯絡備註</label>
                <Input
                  value={form.internalContact}
                  onChange={e => setBasicForm({ ...form, internalContact: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="procAccess"
                  checked={form.has_procurement_access}
                  onChange={e => setBasicForm({ ...form, has_procurement_access: e.target.checked })}
                />
                <label htmlFor="procAccess" className="text-sm text-gray-700">開放採購成本存取</label>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveBasic} disabled={updateFranchisee.isPending}>
                  {updateFranchisee.isPending ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── 合約管理 ── */}
          <TabsContent value="contracts" className="space-y-4">
            {/* 上傳表單 */}
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">上傳合約</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">合約類型</label>
                  <Input
                    value={contractForm.contractType}
                    onChange={e => setContractForm(p => ({ ...p, contractType: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">簽約日期</label>
                  <Input
                    type="date"
                    value={contractForm.signedAt}
                    onChange={e => setContractForm(p => ({ ...p, signedAt: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">到期日</label>
                  <Input
                    type="date"
                    value={contractForm.expiresAt}
                    onChange={e => setContractForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">備註</label>
                  <Input
                    value={contractForm.note}
                    onChange={e => setContractForm(p => ({ ...p, note: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
              <Button
                size="sm"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? "上傳中..." : "選擇檔案並上傳"}
              </Button>
            </div>

            {/* 合約列表 */}
            {(contracts as any[]).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">尚無合約記錄</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["合約類型", "簽約日", "到期日", "備註", "上傳者", ""].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(contracts as any[]).map((c: any) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2 text-gray-900">{c.contractType}</td>
                      <td className="px-3 py-2 text-gray-600">{fmtDate(c.signedAt)}</td>
                      <td className="px-3 py-2 text-gray-600">{fmtDate(c.expiresAt)}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs max-w-[120px] truncate">{c.note ?? "-"}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{c.uploadedBy}</td>
                      <td className="px-3 py-2">
                        <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                          檢視
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          {/* ── 帳款往來 ── */}
          <TabsContent value="payments" className="space-y-4">
            {/* 新增表單 */}
            <form onSubmit={addPayment} className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">新增帳款</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">日期</label>
                  <Input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">金額</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">類型</label>
                  <Select
                    value={paymentForm.direction}
                    onValueChange={v => setPaymentForm(p => ({ ...p, direction: v as any }))}
                  >
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receivable">應收</SelectItem>
                      <SelectItem value="paid">已付</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">類別</label>
                  <Input
                    value={paymentForm.category}
                    onChange={e => setPaymentForm(p => ({ ...p, category: e.target.value }))}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">備註</label>
                <Input
                  value={paymentForm.note}
                  onChange={e => setPaymentForm(p => ({ ...p, note: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={paymentUpsert.isPending}>
                  {paymentUpsert.isPending ? "新增中..." : "新增"}
                </Button>
              </div>
            </form>

            {/* 帳款列表 */}
            {(payments as any[]).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">尚無帳款紀錄</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["日期", "金額", "類型", "類別", "備註"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(payments as any[]).map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-gray-600">{fmtDate(p.paymentDate)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{fmtAmount(p.amount)}</td>
                      <td className="px-3 py-2">
                        <Badge className={p.direction === "receivable" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                          {p.direction === "receivable" ? "應收" : "已付"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{p.category}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{p.note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Franchisees() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const franchisees = trpc.franchisee.franchiseeList.useQuery();
  const list = franchisees.data ?? [];

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">加盟主管理</h1>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">加盟主清單</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {franchisees.isLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm">載入中...</div>
            ) : list.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                尚無加盟主資料。請至「加盟詢問」頁點擊「轉為正式加盟主」建立帳號。
              </div>
            ) : (
              <>
                {/* 桌面版 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["姓名", "門市", "電話", "Email", "狀態", "最後登入", ""].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {list.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{u.name}</td>
                          <td className="px-4 py-2.5 text-gray-600">{u.storeName ?? "-"}</td>
                          <td className="px-4 py-2.5 text-gray-600">{u.phone ?? "-"}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{u.email ?? "-"}</td>
                          <td className="px-4 py-2.5">
                            <Badge className={u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                              {u.status === "active" ? "啟用" : "停用"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{fmtDate(u.last_login_at)}</td>
                          <td className="px-4 py-2.5">
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                              onClick={() => setSelectedUserId(u.id)}>
                              管理
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 手機版 */}
                <div className="md:hidden divide-y divide-gray-100">
                  {list.map((u: any) => (
                    <div key={u.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                          {u.storeName && (
                            <span className="ml-2 text-xs text-gray-500">{u.storeName}</span>
                          )}
                        </div>
                        <Badge className={u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                          {u.status === "active" ? "啟用" : "停用"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {u.phone && <span>{u.phone} · </span>}
                        {u.email && <span>{u.email}</span>}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2"
                        onClick={() => setSelectedUserId(u.id)}>
                        管理
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedUserId !== null && (
        <FranchiseeDetailDialog
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </AdminDashboardLayout>
  );
}

import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

const emptyForm = {
  name: "", phone: "", address: "", districtId: "", paymentType: "monthly" as const,
  creditLimit: 0, status: "active" as const,
  customerLevel: "retail", settlementCycle: "monthly", overdueDays: 30,
  loginEmail: "", isPortalActive: false, portalNote: "",
};

function fmtMoney(v: number | string | null | undefined) {
  return `$${Number(v ?? 0).toLocaleString("zh-TW")}`;
}

export default function DayoneCustomers() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [priceRows, setPriceRows] = useState<{ productId: number; productName: string; price: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.dayone.customers.list.useQuery({ tenantId: TENANT_ID });
  const { data: districts } = trpc.dayone.districts.list.useQuery({ tenantId: TENANT_ID });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const upsert = trpc.dayone.customers.upsert.useMutation({
    onSuccess: () => {
      toast.success(editing ? "客戶已更新" : "客戶已新增");
      setOpen(false);
      utils.dayone.customers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCustomer = trpc.dayone.customers.delete.useMutation({
    onSuccess: () => { toast.success("客戶已刪除"); setDeleteTarget(null); utils.dayone.customers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const upsertPrice = trpc.dayone.ap.upsertSupplierPrice.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const resetPortalPwd = trpc.dayone.portal.adminResetPassword?.useMutation?.({
    onSuccess: () => toast.success("已重設密碼並發送通知"),
    onError: (e) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPriceRows([]);
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditing(c);
    setForm({
      name: c.name, phone: c.phone ?? "", address: c.address ?? "",
      districtId: c.districtId ? String(c.districtId) : "",
      paymentType: c.paymentType, creditLimit: c.creditLimit, status: c.status,
      customerLevel: c.customerLevel ?? "retail",
      settlementCycle: c.settlementCycle ?? "monthly",
      overdueDays: c.overdueDays ?? 30,
      loginEmail: c.loginEmail ?? "",
      isPortalActive: !!c.isPortalActive,
      portalNote: c.portalNote ?? "",
    });
    setPriceRows([]);
    setOpen(true);
  }

  function addPriceRow() {
    const prod = (products as any[])[0];
    if (!prod) return;
    setPriceRows(r => [...r, { productId: prod.id, productName: prod.name, price: "" }]);
  }

  async function handleSave() {
    if (!form.name) { toast.error("請填寫客戶名稱"); return; }
    await upsert.mutateAsync({
      ...form,
      tenantId: TENANT_ID,
      id: editing?.id,
      districtId: form.districtId ? Number(form.districtId) : undefined,
      creditLimit: Number(form.creditLimit),
      overdueDays: Number(form.overdueDays),
    });
    // save custom prices
    for (const row of priceRows) {
      if (row.price && editing?.id) {
        await upsertPrice.mutateAsync({
          tenantId: TENANT_ID,
          entityType: "customer",
          entityId: editing.id,
          productId: row.productId,
          price: Number(row.price),
        }).catch(() => {});
      }
    }
  }

  const filtered = (customers as any[] ?? []).filter((c: any) =>
    !search || c.name?.includes(search) || c.phone?.includes(search)
  );

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
          <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> 新增客戶
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="搜尋客戶名稱或電話" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-gray-500">載入中...</div> :
              filtered.length === 0 ? <div className="p-8 text-center text-gray-500">無客戶資料</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["客戶名稱", "電話", "地址", "等級", "結算", "客戶入口", "狀態", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => {
                      const lvl = LEVEL_CFG[c.customerLevel ?? "retail"] ?? LEVEL_CFG.retail;
                      return (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{c.name}</td>
                          <td className="px-4 py-3 text-gray-600">{c.phone ?? "-"}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{c.address ?? "-"}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${lvl.cls} border-0 text-xs`}>{lvl.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {CYCLE_LABELS[c.settlementCycle ?? ""] ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block w-2 h-2 rounded-full ${c.isPortalActive ? "bg-green-500" : "bg-gray-300"}`} title={c.isPortalActive ? "客戶入口已啟用" : "客戶入口未啟用"} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {c.status === "active" ? "正常" : "停用"}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteTarget(c)}><Trash2 className="w-4 h-4" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "編輯客戶" : "新增客戶"}</DialogTitle></DialogHeader>
            <Tabs defaultValue="basic">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">基本資料</TabsTrigger>
                <TabsTrigger value="portal" className="flex-1">客戶入口設定</TabsTrigger>
                <TabsTrigger value="prices" className="flex-1">客戶專屬價格</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 pt-2">
                <div><Label>客戶名稱 *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>電話</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>地址</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                <div>
                  <Label>配送區域</Label>
                  <Select value={form.districtId} onValueChange={v => setForm(p => ({ ...p, districtId: v }))}>
                    <SelectTrigger><SelectValue placeholder="選擇區域" /></SelectTrigger>
                    <SelectContent>
                      {(districts as any[] ?? []).map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>客戶等級</Label>
                  <Select value={form.customerLevel} onValueChange={v => setForm(p => ({ ...p, customerLevel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">供應商</SelectItem>
                      <SelectItem value="store">合作店家</SelectItem>
                      <SelectItem value="retail">散戶</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>結算週期</Label>
                  <Select value={form.settlementCycle} onValueChange={v => setForm(p => ({ ...p, settlementCycle: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_delivery">每次現付</SelectItem>
                      <SelectItem value="weekly">週結</SelectItem>
                      <SelectItem value="monthly">月結</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>寬限天數</Label><Input type="number" value={form.overdueDays} onChange={e => setForm(p => ({ ...p, overdueDays: Number(e.target.value) }))} /></div>
                <div>
                  <Label>付款方式（舊欄位）</Label>
                  <Select value={form.paymentType} onValueChange={v => setForm(p => ({ ...p, paymentType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">月結</SelectItem>
                      <SelectItem value="weekly">週結</SelectItem>
                      <SelectItem value="cash">現金</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>狀態</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="suspended">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="portal" className="space-y-3 pt-2">
                <div><Label>客戶入口登入 Email</Label><Input type="email" value={form.loginEmail} onChange={e => setForm(p => ({ ...p, loginEmail: e.target.value }))} placeholder="customer@example.com" /></div>
                <div className="flex items-center gap-3">
                  <Label>客戶入口啟用</Label>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, isPortalActive: !p.isPortalActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPortalActive ? "bg-green-500" : "bg-gray-300"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isPortalActive ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm text-gray-500">{form.isPortalActive ? "已啟用" : "未啟用"}</span>
                </div>
                <div><Label>客戶入口備註（僅內部可見）</Label>
                  <textarea className="w-full border rounded p-2 text-sm h-20 resize-none"
                    value={form.portalNote} onChange={e => setForm(p => ({ ...p, portalNote: e.target.value }))} />
                </div>
                {editing && (
                  <Button variant="outline" size="sm" className="text-orange-600 border-orange-300"
                    onClick={() => (resetPortalPwd as any)?.mutate?.({ customerId: editing.id })}
                    disabled={(resetPortalPwd as any)?.isPending}>
                    重設客戶入口密碼
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="prices" className="space-y-3 pt-2">
                <p className="text-xs text-gray-500">設定此客戶的專屬售價，留空則沿用標準定價。{!editing && "（新增客戶後才能設定）"}</p>
                {editing && (
                  <>
                    {priceRows.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Select value={String(row.productId)} onValueChange={v => {
                          const prod = (products as any[]).find((p: any) => p.id === Number(v));
                          setPriceRows(r => r.map((x, j) => j === i ? { ...x, productId: Number(v), productName: prod?.name ?? "" } : x));
                        }}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(products as any[]).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" className="w-28" placeholder="單價" value={row.price}
                          onChange={e => setPriceRows(r => r.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                        <Button variant="ghost" size="sm" onClick={() => setPriceRows(r => r.filter((_, j) => j !== i))}>
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addPriceRow} className="gap-1">
                      <Plus className="w-4 h-4" /> 新增價格列
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Button className="w-full bg-amber-600 hover:bg-amber-700 mt-2" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* 刪除確認 Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>確認刪除客戶</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">確定要刪除客戶「<strong>{deleteTarget?.name}</strong>」？此操作無法復原。</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteCustomer.isPending}
              onClick={() => deleteCustomer.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}>
              {deleteCustomer.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DayoneLayout>
  );
}

import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, Tags } from "lucide-react";
import { toast } from "sonner";

const LEVEL_MAP: Record<string, { label: string; className: string }> = {
  retail:   { label: "零售", className: "bg-sky-100 text-sky-700" },
  store:    { label: "門市", className: "bg-violet-100 text-violet-700" },
  supplier: { label: "供應商", className: "bg-amber-100 text-amber-700" },
};

const TODAY = new Date().toISOString().slice(0, 10);

const emptyForm = {
  level: "retail" as "retail" | "store" | "supplier",
  productId: "",
  price: "",
  effectiveDate: TODAY,
};

export default function DayoneLevelPrices() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: levelPrices = [], isLoading } = trpc.dayone.customers.getLevelPrices.useQuery({ tenantId: TENANT_ID });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const setLevelPrice = trpc.dayone.customers.setLevelPrice.useMutation({
    onSuccess: () => {
      toast.success(editing ? "分級定價已更新" : "分級定價已新增");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      utils.dayone.customers.getLevelPrices.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLevelPrice = trpc.dayone.customers.deleteLevelPrice.useMutation({
    onSuccess: () => {
      toast.success("已刪除");
      setDeleteTarget(null);
      utils.dayone.customers.getLevelPrices.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    setForm({
      level: row.level,
      productId: String(row.productId),
      price: String(row.price),
      effectiveDate: row.effectiveDate?.slice(0, 10) ?? TODAY,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.productId) { toast.error("請選擇商品"); return; }
    const price = Number(form.price);
    if (isNaN(price) || price < 0) { toast.error("請輸入有效金額"); return; }
    setLevelPrice.mutate({
      tenantId: TENANT_ID,
      level: form.level,
      productId: Number(form.productId),
      price,
      effectiveDate: form.effectiveDate,
    });
  }

  const filtered = levelFilter === "all"
    ? levelPrices
    : levelPrices.filter((r: any) => r.level === levelFilter);

  // 統計各等級設定筆數
  const counts = { retail: 0, store: 0, supplier: 0 } as Record<string, number>;
  for (const r of levelPrices as any[]) counts[r.level] = (counts[r.level] ?? 0) + 1;

  return (
    <DayoneLayout>
      <div className="dayone-page">
        <div className="dayone-page-header">
          <div>
            <h1 className="dayone-page-title">分級定價</h1>
            <p className="dayone-page-subtitle">依客戶等級設定商品基礎售價 · 個別客戶可在客戶管理另行微調</p>
          </div>
          <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增定價
          </Button>
        </div>

        {/* 等級統計卡片 */}
        <section className="grid grid-cols-3 gap-3">
          {(["retail", "store", "supplier"] as const).map((level) => (
            <div key={level} className="dayone-surface-card rounded-[24px] p-4">
              <p className="dayone-stat-label">{LEVEL_MAP[level].label}</p>
              <p className="dayone-kpi-value mt-1 text-stone-900">{counts[level] ?? 0}</p>
              <p className="dayone-stat-note mt-1">筆商品定價</p>
            </div>
          ))}
        </section>

        {/* 篩選列 */}
        <div className="flex gap-2">
          {[["all", "全部"], ["retail", "零售"], ["store", "門市"], ["supplier", "供應商"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setLevelFilter(val)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                levelFilter === val
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 定價表格 */}
        <section className="rounded-[30px] border border-stone-200/70 bg-white shadow-[0_14px_28px_rgba(120,53,15,0.05)]">
          {isLoading ? (
            <div className="p-10 text-center text-stone-400">讀取中...</div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center text-stone-400">
              <Tags className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-sm">目前尚無分級定價資料。</p>
              <p className="mt-1 text-xs">新增後，同等級客戶下單時會自動套用對應售價。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50">
                  <tr>
                    {["客戶等級", "商品", "代碼", "單位", "售價", "生效日", "操作"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-stone-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(filtered as any[]).map((row) => (
                    <tr key={row.id} className="border-b transition-colors hover:bg-stone-50/80">
                      <td className="px-4 py-3">
                        <Badge className={`${LEVEL_MAP[row.level]?.className ?? ""} border-0`}>
                          {LEVEL_MAP[row.level]?.label ?? row.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-900">{row.productName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">{row.code ?? "-"}</td>
                      <td className="px-4 py-3 text-stone-600">{row.unit}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">NT$ {Number(row.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-stone-500">{row.effectiveDate?.slice(0, 10) ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => setDeleteTarget(row)}
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
          )}
        </section>

        {/* 說明卡 */}
        <Card className="dayone-surface-card rounded-[24px]">
          <CardContent className="px-5 py-4 text-sm text-stone-600 space-y-1.5">
            <p className="font-semibold text-stone-800">定價優先順序</p>
            <p>① 客戶個別微調（客戶管理 → 客製定價）</p>
            <p>② 分級定價（本頁設定）</p>
            <p>③ 商品主檔預設售價</p>
            <p className="text-xs text-stone-400 pt-1">三層都沒有時，totalAmount = 0，由業務後台補正。</p>
          </CardContent>
        </Card>

        {/* 新增 / 編輯 Dialog */}
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "編輯分級定價" : "新增分級定價"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>客戶等級</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => setForm((p) => ({ ...p, level: v as any }))}
                  disabled={!!editing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">零售</SelectItem>
                    <SelectItem value="store">門市</SelectItem>
                    <SelectItem value="supplier">供應商</SelectItem>
                  </SelectContent>
                </Select>
                {editing && <p className="mt-1 text-xs text-stone-400">等級與商品不可修改，請刪除後重新新增。</p>}
              </div>
              <div>
                <Label>商品</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm((p) => ({ ...p, productId: v }))}
                  disabled={!!editing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="請選擇商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products as any[]).filter((p) => p.isActive !== false).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}（{p.unit}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>售價（NT$）</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div>
                <Label>生效日</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={form.effectiveDate}
                  onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))}
                />
              </div>
            </div>
            <Button
              className="mt-2 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={setLevelPrice.isPending}
              onClick={handleSave}
            >
              {setLevelPrice.isPending ? "儲存中..." : "確認儲存"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* 刪除確認 */}
        <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle>刪除分級定價</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-6 text-stone-500">
              確定要刪除{" "}
              <span className="font-semibold text-stone-900">
                {LEVEL_MAP[deleteTarget?.level]?.label} · {deleteTarget?.productName}
              </span>{" "}
              的定價嗎？刪除後該等級客戶將改用商品主檔售價。
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
              <Button
                className="bg-rose-600 text-white hover:bg-rose-700"
                disabled={deleteLevelPrice.isPending}
                onClick={() => deleteLevelPrice.mutate({ id: deleteTarget.id, tenantId: TENANT_ID })}
              >
                {deleteLevelPrice.isPending ? "刪除中..." : "確認刪除"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DayoneLayout>
  );
}

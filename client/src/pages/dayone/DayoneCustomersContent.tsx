import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, MapPin, Globe, Copy, Users, ChevronDown, ChevronRight, Folder, FolderOpen, Tags } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  districtId: undefined as number | undefined,
  groupId: undefined as number | undefined,
  paymentType: "cash" as "cash" | "transfer" | "check",
  creditLimit: 0,
  status: "active" as "active" | "suspended",
  customerLevel: "retail",
  settlementCycle: "monthly",
  overdueDays: 30,
  loginEmail: "",
  isPortalActive: false,
  portalNote: "",
  defaultDriverId: undefined as number | undefined,
  deliveryFrequency: "daily" as "D1" | "D2" | "daily",
};

const EMPTY_GROUP_FORM = {
  name: "",
  note: "",
};

const paymentTypeLabel: Record<string, string> = {
  cash: "現金",
  transfer: "轉帳",
  check: "支票",
};

export default function DayoneCustomersContent({ tenantId }: { tenantId: number }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<number | "all">("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["ungrouped", "all"]));

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<number | undefined>();
  const [groupForm, setGroupForm] = useState({ ...EMPTY_GROUP_FORM });

  // 客製定價
  const [priceCustomerId, setPriceCustomerId] = useState<number | null>(null);
  const [priceCustomerName, setPriceCustomerName] = useState("");
  const [newPriceForm, setNewPriceForm] = useState({ productId: "", price: "", effectiveDate: new Date().toLocaleDateString("sv-SE") });
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.dayone.customers.list.useQuery({ tenantId });
  // const { data: districts } = trpc.dayone.districts.list.useQuery({ tenantId }); // 停用
  const { data: groups } = trpc.dayone.customers.listGroups.useQuery({ tenantId });
  const { data: drivers } = trpc.dayone.drivers.list.useQuery({ tenantId });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId });
  const { data: customerPrices = [], refetch: refetchPrices } = trpc.dayone.customers.getCustomerPrices.useQuery(
    { customerId: priceCustomerId!, tenantId },
    { enabled: priceCustomerId !== null }
  );

  const upsert = trpc.dayone.customers.upsert.useMutation({
    onSuccess: () => {
      toast.success(editId ? "客戶資料已更新" : "客戶資料已建立");
      setOpen(false);
      utils.dayone.customers.list.invalidate();
    },
    onError: () => toast.error("儲存失敗，請確認填寫資料後再試"),
  });

  const del = trpc.dayone.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("客戶已刪除");
      utils.dayone.customers.list.invalidate();
    },
    onError: () => toast.error("刪除失敗，請重試"),
  });

  const upsertGroup = trpc.dayone.customers.upsertGroup.useMutation({
    onSuccess: () => {
      toast.success(editGroupId ? "群組已更新" : "群組已建立");
      setGroupDialogOpen(false);
      utils.dayone.customers.listGroups.invalidate();
      utils.dayone.customers.list.invalidate();
    },
    onError: () => toast.error("群組操作失敗，請重試"),
  });

  const deleteGroup = trpc.dayone.customers.deleteGroup.useMutation({
    onSuccess: () => {
      toast.success("群組已刪除，成員移至未分組");
      utils.dayone.customers.listGroups.invalidate();
      utils.dayone.customers.list.invalidate();
    },
    onError: () => toast.error("刪除失敗，請重試"),
  });

  const setCustomerPrice = trpc.dayone.customers.setCustomerPrice.useMutation({
    onSuccess: () => {
      toast.success("客製定價已儲存");
      setNewPriceForm({ productId: "", price: "", effectiveDate: new Date().toLocaleDateString("sv-SE") });
      setEditingPriceId(null);
      refetchPrices();
    },
    onError: (err) => toast.error(err.message),
  });

  function openNew() {
    setEditId(undefined);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      name: c.name ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      districtId: c.districtId ?? undefined,
      groupId: c.groupId ?? undefined,
      paymentType: c.paymentType ?? "monthly",
      creditLimit: Number(c.creditLimit ?? 0),
      status: c.status ?? "active",
      customerLevel: c.customerLevel ?? "retail",
      settlementCycle: c.settlementCycle ?? "monthly",
      overdueDays: Number(c.overdueDays ?? 30),
      loginEmail: c.loginEmail ?? "",
      isPortalActive: !!c.isPortalActive,
      portalNote: c.portalNote ?? "",
      defaultDriverId: c.defaultDriverId ?? undefined,
      deliveryFrequency: c.deliveryFrequency ?? "daily",
    });
    setOpen(true);
  }

  function openCopy(c: any) {
    setEditId(undefined);
    setForm({
      name: `${c.name}-副本`,
      phone: c.phone ?? "",
      address: c.address ?? "",
      districtId: c.districtId ?? undefined,
      groupId: c.groupId ?? undefined,
      paymentType: c.paymentType ?? "monthly",
      creditLimit: Number(c.creditLimit ?? 0),
      status: c.status ?? "active",
      customerLevel: c.customerLevel ?? "retail",
      settlementCycle: c.settlementCycle ?? "monthly",
      overdueDays: Number(c.overdueDays ?? 30),
      loginEmail: "",
      isPortalActive: false,
      portalNote: c.portalNote ?? "",
      defaultDriverId: c.defaultDriverId ?? undefined,
      deliveryFrequency: c.deliveryFrequency ?? "daily",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("請輸入客戶名稱");
      return;
    }
    upsert.mutate({
      id: editId,
      tenantId,
      name: form.name,
      phone: form.phone || undefined,
      address: form.address || undefined,
      districtId: form.districtId,
      groupId: form.groupId,
      paymentType: form.paymentType,
      creditLimit: form.creditLimit,
      status: form.status,
      customerLevel: form.customerLevel || undefined,
      settlementCycle: form.settlementCycle || undefined,
      overdueDays: form.overdueDays,
      loginEmail: form.loginEmail || undefined,
      isPortalActive: form.isPortalActive,
      portalNote: form.portalNote || undefined,
      defaultDriverId: form.defaultDriverId,
      deliveryFrequency: form.deliveryFrequency,
    });
  }

  function openNewGroup() {
    setEditGroupId(undefined);
    setGroupForm({ ...EMPTY_GROUP_FORM });
    setGroupDialogOpen(true);
  }

  function openEditGroup(g: any) {
    setEditGroupId(g.id);
    setGroupForm({ name: g.name ?? "", note: g.note ?? "" });
    setGroupDialogOpen(true);
  }

  function handleSaveGroup() {
    if (!groupForm.name.trim()) {
      toast.error("請輸入群組名稱");
      return;
    }
    upsertGroup.mutate({
      id: editGroupId,
      tenantId,
      name: groupForm.name,
      note: groupForm.note || undefined,
    });
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allCustomers: any[] = customers as any[] ?? [];
  const allGroups: any[] = groups as any[] ?? [];

  const filtered = allCustomers.filter((c: any) => {
    const matchSearch = !search || c.name?.includes(search) || c.phone?.includes(search);
    const matchGroup = filterGroupId === "all" || (filterGroupId === 0 ? !c.groupId : c.groupId === filterGroupId);
    return matchSearch && matchGroup;
  });

  // Build grouped structure
  const groupedMap: Record<string | number, any[]> = {};
  for (const c of filtered) {
    const key = c.groupId ?? "ungrouped";
    if (!groupedMap[key]) groupedMap[key] = [];
    groupedMap[key].push(c);
  }

  const groupRows: { key: string; label: string; note?: string; members: any[]; groupObj?: any }[] = [];
  for (const g of allGroups) {
    if (groupedMap[g.id]) {
      groupRows.push({ key: String(g.id), label: g.name, note: g.note, members: groupedMap[g.id], groupObj: g });
    }
  }
  if (groupedMap["ungrouped"]?.length) {
    groupRows.push({ key: "ungrouped", label: "未分組", members: groupedMap["ungrouped"] });
  }

  const freqLabel: Record<string, string> = { D1: "D1 週一三五", D2: "D2 週二四六", daily: "每天" };

  const CustomerRow = ({ c }: { c: any }) => (
    <tr key={c.id}>
      <td className="font-medium">{c.name}</td>
      <td className="text-stone-600">{c.phone ?? "-"}</td>
      <td className="text-stone-600">{c.defaultDriverName ?? <span className="text-stone-400">未指定</span>}</td>
      <td className="text-stone-600">{freqLabel[c.deliveryFrequency] ?? "-"}</td>
      <td className="text-stone-600">{paymentTypeLabel[c.paymentType] ?? c.paymentType}</td>
      <td className="text-stone-600">{c.customerLevel === "store" ? "門市" : c.customerLevel === "supplier" ? "供應商" : "零售"}</td>
      <td>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.isPortalActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
          {c.isPortalActive ? "已啟用" : "未啟用"}
        </span>
      </td>
      <td>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
          {c.status === "active" ? "啟用中" : "停用"}
        </span>
      </td>
      <td>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" title="客製定價" onClick={() => { setPriceCustomerId(c.id); setPriceCustomerName(c.name); }}>
            <Tags className="h-4 w-4 text-amber-500" />
          </Button>
          <Button variant="ghost" size="sm" title="複製客戶" onClick={() => openCopy(c)}>
            <Copy className="h-4 w-4 text-stone-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              if (confirm(`確定要刪除客戶「${c.name}」嗎？`)) del.mutate({ id: c.id, tenantId });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="dayone-page-header">
        <div className="min-w-0">
          <h1 className="dayone-page-title">客戶管理</h1>
          <p className="dayone-page-subtitle">管理下游商家、付款條件、信用額度與 Portal 權限。</p>
        </div>
        <Button className="dayone-action gap-2 rounded-2xl bg-amber-600 text-white hover:bg-amber-700" onClick={openNew}>
          <Plus className="w-4 h-4" />
          新增客戶
        </Button>
      </div>

      {/* Groups management panel */}
      <Card className="dayone-surface-card rounded-[30px]">
        <CardContent className="p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-stone-800">群組管理</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{allGroups.length} 個群組</span>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={openNewGroup}>
              <Plus className="h-3.5 w-3.5" />
              新增群組
            </Button>
          </div>
          {allGroups.length === 0 ? (
            <p className="text-xs text-stone-400">尚無群組。可將同一品牌的多間門市歸入同一群組方便管理。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allGroups.map((g: any) => (
                <div key={g.id} className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-1.5">
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-medium text-stone-700">{g.name}</span>
                  <span className="text-xs text-stone-400">{g.memberCount ?? 0} 位</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => openEditGroup(g)}>
                    <Pencil className="h-3 w-3 text-stone-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      if (confirm(`刪除群組「${g.name}」？成員將移至未分組。`)) {
                        deleteGroup.mutate({ id: g.id, tenantId });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search + group filter */}
      <Card className="dayone-surface-card rounded-[30px]">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="用名稱或電話搜尋"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={filterGroupId === "all" ? "all" : String(filterGroupId)}
              onValueChange={(v) => setFilterGroupId(v === "all" ? "all" : v === "0" ? 0 : Number(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="篩選群組" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部群組</SelectItem>
                <SelectItem value="0">未分組</SelectItem>
                {allGroups.map((g: any) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer table */}
      <div className="dayone-table-shell">
        {isLoading ? (
          <div className="dayone-empty-state min-h-[260px]">載入中...</div>
        ) : !filtered.length ? (
          <div className="dayone-empty-state min-h-[260px]">目前沒有符合條件的客戶。</div>
        ) : (
          <>
            <div className="dayone-table-header">
              <div>
                <h2 className="dayone-table-title">客戶清單</h2>
                <p className="dayone-table-note">依群組分類顯示，點擊群組列可展開或收合。</p>
              </div>
              <span className="dayone-chip">共 {filtered.length} 位</span>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="dayone-table w-full text-sm">
                <thead>
                  <tr>
                    {["名稱", "電話", "預設司機", "送貨頻率", "付款", "等級", "Portal", "狀態", "操作"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupRows.map(({ key, label, note, members, groupObj }) => (
                    <>
                      <tr
                        key={`group-${key}`}
                        className="cursor-pointer bg-stone-50 hover:bg-stone-100"
                        onClick={() => toggleGroup(key)}
                      >
                        <td colSpan={10} className="py-2 pl-3">
                          <div className="flex items-center gap-2">
                            {expandedGroups.has(key) ? (
                              <FolderOpen className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Folder className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="font-semibold text-stone-700">{label}</span>
                            {note && <span className="text-xs text-stone-400">{note}</span>}
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{members.length} 位</span>
                            {expandedGroups.has(key) ? (
                              <ChevronDown className="ml-auto mr-4 h-4 w-4 text-stone-400" />
                            ) : (
                              <ChevronRight className="ml-auto mr-4 h-4 w-4 text-stone-400" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedGroups.has(key) && members.map((c: any) => (
                        <CustomerRow key={c.id} c={c} />
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="dayone-mobile-list p-4 md:hidden">
              {groupRows.map(({ key, label, note, members }) => (
                <div key={`mgroup-${key}`} className="mb-4">
                  <button
                    className="mb-2 flex w-full items-center gap-2 rounded-2xl bg-stone-100 px-4 py-2.5 text-left"
                    onClick={() => toggleGroup(key)}
                  >
                    {expandedGroups.has(key) ? (
                      <FolderOpen className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-semibold text-stone-700">{label}</span>
                    {note && <span className="text-xs text-stone-400">{note}</span>}
                    <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{members.length} 位</span>
                    {expandedGroups.has(key) ? (
                      <ChevronDown className="ml-auto h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4 text-stone-400" />
                    )}
                  </button>
                  {expandedGroups.has(key) && members.map((c: any) => (
                    <article key={c.id} className="dayone-mobile-card mb-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-stone-900">{c.name}</h2>
                          <p className="mt-1 text-sm text-stone-500">
                            {paymentTypeLabel[c.paymentType] ?? c.paymentType} / {c.customerLevel === "store" ? "門市" : c.customerLevel === "supplier" ? "供應商" : "零售"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                          {c.status === "active" ? "啟用中" : "停用"}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 text-stone-400" />
                          <span className="text-stone-700">{c.phone ?? "-"}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 text-stone-400" />
                          <span className="text-stone-700">{c.districtName ?? "未分配區域"}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Globe className="mt-0.5 h-4 w-4 text-stone-400" />
                          <span className="text-stone-700">{c.isPortalActive ? `Portal 已啟用${c.loginEmail ? ` / ${c.loginEmail}` : ""}` : "Portal 未啟用"}</span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button variant="outline" className="rounded-2xl text-xs" onClick={() => openCopy(c)}>複製</Button>
                        <Button variant="outline" className="rounded-2xl text-xs" onClick={() => openEdit(c)}>編輯</Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl text-xs text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`確定要刪除客戶「${c.name}」嗎？`)) del.mutate({ id: c.id, tenantId });
                          }}
                        >
                          刪除
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Customer upsert dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "編輯客戶" : "新增客戶"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>名稱 *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>電話</Label>
              <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>地址</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>預設司機</Label>
                <Select value={form.defaultDriverId ? String(form.defaultDriverId) : "none"} onValueChange={(v) => setForm((p) => ({ ...p, defaultDriverId: v === "none" ? undefined : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="選擇司機" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未指定</SelectItem>
                    {(drivers as any[] ?? []).filter((d: any) => d.status === "active").map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>送貨頻率</Label>
                <Select value={form.deliveryFrequency} onValueChange={(v) => setForm((p) => ({ ...p, deliveryFrequency: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">每天</SelectItem>
                    <SelectItem value="D1">D1（週一三五）</SelectItem>
                    <SelectItem value="D2">D2（週二四六）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>所屬群組</Label>
                <Select value={form.groupId ? String(form.groupId) : "none"} onValueChange={(v) => setForm((p) => ({ ...p, groupId: v === "none" ? undefined : Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="選擇群組" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未分組</SelectItem>
                    {allGroups.map((g: any) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>付款方式</Label>
                <Select value={form.paymentType} onValueChange={(v) => setForm((p) => ({ ...p, paymentType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">現金</SelectItem>
                    <SelectItem value="transfer">轉帳</SelectItem>
                    <SelectItem value="check">支票</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>結帳週期</Label>
                <Select value={form.settlementCycle} onValueChange={(v) => setForm((p) => ({ ...p, settlementCycle: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月結</SelectItem>
                    <SelectItem value="weekly">週結</SelectItem>
                    <SelectItem value="per_delivery">逐筆結</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>客戶等級</Label>
                <Select value={form.customerLevel} onValueChange={(v) => setForm((p) => ({ ...p, customerLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">零售</SelectItem>
                    <SelectItem value="store">門市</SelectItem>
                    <SelectItem value="supplier">供應商</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>逾期天數</Label>
                <Input type="number" value={form.overdueDays} onChange={(e) => setForm((p) => ({ ...p, overdueDays: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>信用額度</Label>
                <Input type="number" value={form.creditLimit} onChange={(e) => setForm((p) => ({ ...p, creditLimit: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">啟用中</SelectItem>
                    <SelectItem value="suspended">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Portal 帳號 Email</Label>
              <Input value={form.loginEmail} onChange={(e) => setForm((p) => ({ ...p, loginEmail: e.target.value }))} placeholder="客戶 Portal 登入信箱" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-stone-800">Portal 權限</p>
                <p className="text-xs text-stone-500">控制這個客戶是否可以登入下單 Portal</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isPortalActive: !p.isPortalActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPortalActive ? "bg-amber-600" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isPortalActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div>
              <Label>Portal 備註</Label>
              <Input value={form.portalNote} onChange={(e) => setForm((p) => ({ ...p, portalNote: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? "儲存中..." : editId ? "更新客戶" : "建立客戶"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Group upsert dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editGroupId ? "編輯群組" : "新增群組"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>群組名稱 *</Label>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="例如：全家便利商店"
              />
            </div>
            <div>
              <Label>備註</Label>
              <Input
                value={groupForm.note}
                onChange={(e) => setGroupForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="選填備註"
              />
            </div>
          </div>
          <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleSaveGroup} disabled={upsertGroup.isPending}>
            {upsertGroup.isPending ? "儲存中..." : editGroupId ? "更新群組" : "建立群組"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* 客製定價 Dialog */}
      <Dialog open={priceCustomerId !== null} onOpenChange={(v) => { if (!v) { setPriceCustomerId(null); setEditingPriceId(null); setNewPriceForm({ productId: "", price: "", effectiveDate: new Date().toLocaleDateString("sv-SE") }); } }}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>客製定價 — {priceCustomerName}</DialogTitle>
          </DialogHeader>

          {/* 現有定價列表（含歷史） */}
          <div className="max-h-56 overflow-y-auto rounded-2xl border border-stone-200">
            {(customerPrices as any[]).length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-400">尚無客製定價，使用分級定價或主檔售價</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-stone-500">商品</th>
                    <th className="px-3 py-2 text-right font-medium text-stone-500">售價</th>
                    <th className="px-3 py-2 text-left font-medium text-stone-500">生效日</th>
                    <th className="px-3 py-2 text-left font-medium text-stone-500">建立時間</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(customerPrices as any[]).map((cp: any, idx: number) => {
                    // 同商品中第一筆（effectiveDate最新）為當前生效
                    const prevIdx = idx - 1;
                    const isLatestForProduct = idx === 0 || (customerPrices as any[])[prevIdx]?.productId !== cp.productId;
                    return (
                      <tr key={cp.id} className={`border-b last:border-b-0 ${isLatestForProduct ? "" : "opacity-50"}`}>
                        <td className="px-3 py-2 font-medium text-stone-900">
                          {isLatestForProduct ? cp.productName : <span className="text-stone-400 text-xs ml-2">↳ {cp.productName}</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-stone-900">
                          NT$ {Number(cp.price).toLocaleString()}
                          {isLatestForProduct && <span className="ml-1 text-[10px] font-normal text-emerald-600">生效中</span>}
                        </td>
                        <td className="px-3 py-2 text-stone-500">{cp.effectiveDate?.slice(0, 10) ?? "-"}</td>
                        <td className="px-3 py-2 text-stone-400 text-xs">
                          {cp.createdAt ? new Date(cp.createdAt).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit" }) : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {isLatestForProduct && (
                            <button
                              className="text-xs text-amber-600 font-semibold hover:underline"
                              onClick={() => {
                                setEditingPriceId(cp.id);
                                setNewPriceForm({
                                  productId: String(cp.productId),
                                  price: String(cp.price),
                                  effectiveDate: new Date().toLocaleDateString("sv-SE"),
                                });
                              }}
                            >
                              調整
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 新增 / 調整定價表單 */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              {editingPriceId ? "調整定價（將新增一筆修改紀錄）" : "新增客製定價"}
              {editingPriceId && (
                <button className="ml-2 text-stone-400 hover:text-stone-600 normal-case font-normal" onClick={() => { setEditingPriceId(null); setNewPriceForm({ productId: "", price: "", effectiveDate: new Date().toLocaleDateString("sv-SE") }); }}>
                  取消
                </button>
              )}
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">商品</Label>
                <select
                  value={newPriceForm.productId}
                  onChange={(e) => setNewPriceForm((p) => ({ ...p, productId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="">請選擇</option>
                  {(products as any[]).filter((p: any) => p.isActive !== false).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}（{p.unit}）</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <Label className="text-xs">售價（NT$）</Label>
                <Input
                  type="number" min={0} step={0.01}
                  className="mt-1"
                  value={newPriceForm.price}
                  onChange={(e) => setNewPriceForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">生效日</Label>
              <Input
                type="date"
                className="mt-1"
                value={newPriceForm.effectiveDate}
                onChange={(e) => setNewPriceForm((p) => ({ ...p, effectiveDate: e.target.value }))}
              />
            </div>
            <Button
              className="w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={setCustomerPrice.isPending}
              onClick={() => {
                if (!newPriceForm.productId) { toast.error("請選擇商品"); return; }
                const price = Number(newPriceForm.price);
                if (isNaN(price) || price < 0) { toast.error("請輸入有效金額"); return; }
                setCustomerPrice.mutate({
                  tenantId,
                  customerId: priceCustomerId!,
                  productId: Number(newPriceForm.productId),
                  price,
                  effectiveDate: newPriceForm.effectiveDate,
                });
              }}
            >
              {setCustomerPrice.isPending ? "儲存中..." : editingPriceId ? "確認調整（保留舊紀錄）" : "儲存定價"}
            </Button>
            <p className="text-xs text-stone-400 text-center">每次調整會保留完整歷史紀錄，灰色為過去紀錄</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

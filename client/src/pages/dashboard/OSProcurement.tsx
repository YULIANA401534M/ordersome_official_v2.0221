import { useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekStartStr() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待處理',
  sent: '已發送',
  confirmed: '已確認',
  received: '已收貨',
  cancelled: '已取消',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  received: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const TEMPERATURE_OPTIONS = ['常溫', '冷藏', '冷凍'] as const;

// ── 叫貨單列表 Tab ────────────────────────────────────────────────────────────

function OrderListTab() {
  const [startDate, setStartDate] = useState(weekStartStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pushDialogOrderId, setPushDialogOrderId] = useState<number | null>(null);
  const [pushDialogDate, setPushDialogDate] = useState('');

  const { data: orders = [], refetch } = trpc.procurement.list.useQuery({
    startDate,
    endDate,
    status: status === 'all' ? undefined : status || undefined,
  });

  const updateStatus = trpc.procurement.updateStatus.useMutation({
    onSuccess: () => { toast.success('狀態已更新'); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* 篩選 */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">開始日期</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">結束日期</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">狀態</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>查詢</Button>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">訂單號</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">日期</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">來源</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">廠商</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">門市</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">品項</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">狀態</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">目前無資料</td></tr>
            )}
            {orders.map((o: any) => (
              <>
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                >
                  <td className="px-3 py-2 font-mono text-blue-600 underline">{o.orderNo}</td>
                  <td className="px-3 py-2">{o.orderDate?.slice(0,10)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${o.sourceType === 'damai_import' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                      {o.sourceType === 'damai_import' ? '大麥匯入' : '手動'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[160px] truncate">{o.suppliers}</td>
                  <td className="px-3 py-2 text-xs max-w-[120px] truncate">{o.stores}</td>
                  <td className="px-3 py-2 text-center">{o.itemCount}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-2 text-center">
                    <Select
                      value={o.status}
                      onValueChange={(v) => {
                        updateStatus.mutate({ orderId: o.id, status: v as any });
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-28" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={e => e.stopPropagation()}>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
                {expandedId === o.id && (
                  <tr key={`${o.id}-detail`}>
                    <td colSpan={8} className="bg-blue-50 px-4 py-3">
                      <OrderDetail
                        orderId={o.id}
                        orderDate={o.orderDate?.slice(0,10)}
                        onPush={() => { setPushDialogOrderId(o.id); setPushDialogDate(o.orderDate?.slice(0,10)); }}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {pushDialogOrderId && (
        <PushLineDialog
          orderId={pushDialogOrderId}
          orderDate={pushDialogDate}
          onClose={() => setPushDialogOrderId(null)}
          onSuccess={() => { setPushDialogOrderId(null); refetch(); }}
        />
      )}
    </div>
  );
}

function OrderDetail({ orderId, orderDate, onPush }: { orderId: number; orderDate: string; onPush: () => void }) {
  const { data } = trpc.procurement.getDetail.useQuery({ orderId });

  if (!data) return <div className="text-gray-400 text-sm">載入中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">訂單明細</span>
        <Button size="sm" variant="default" onClick={onPush}>
          彙整並推播 LINE
        </Button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left py-1 pr-3">廠商</th>
            <th className="text-left py-1 pr-3">門市</th>
            <th className="text-left py-1 pr-3">品名</th>
            <th className="text-right py-1 pr-3">數量</th>
            <th className="text-left py-1 pr-3">單位</th>
            <th className="text-left py-1 pr-3">溫層</th>
            <th className="text-left py-1">LINE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {(data.items as any[]).map((item: any) => (
            <tr key={item.id}>
              <td className="py-1 pr-3">{item.supplierName}</td>
              <td className="py-1 pr-3">{item.storeName}</td>
              <td className="py-1 pr-3">{item.productName}</td>
              <td className="py-1 pr-3 text-right">{item.quantity}</td>
              <td className="py-1 pr-3">{item.unit}</td>
              <td className="py-1 pr-3">{item.temperature}</td>
              <td className="py-1">{item.lineSent ? <span className="text-green-600">已推</span> : <span className="text-gray-400">未推</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PushLineDialog({ orderId, orderDate, onClose, onSuccess }: {
  orderId: number;
  orderDate: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: groups = [] } = trpc.procurement.groupBySupplier.useQuery({ orderId });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const pushMutation = trpc.procurement.pushToLine.useMutation({
    onSuccess: (res) => {
      const ok = res.results.filter(r => r.success).length;
      const fail = res.results.filter(r => !r.success).length;
      if (fail === 0) {
        toast.success(`推播成功：${ok} 個廠商`);
        onSuccess();
      } else {
        toast.warning(`部分成功：${ok} 成功，${fail} 失敗`);
        res.results.filter(r => !r.success).forEach(r => {
          toast.error(`${r.supplier}：${r.error}`);
        });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const allGroups: any[] = Array.isArray(groups) ? groups : [];

  const handlePush = () => {
    const toSend = allGroups.filter((g: any) => g.lineGroupId && selected[g.supplierName] !== false);
    if (toSend.length === 0) {
      toast.error('沒有可推播的廠商（請確認已設定 LINE 群組 ID）');
      return;
    }
    pushMutation.mutate({
      orderId,
      orderDate,
      supplierGroups: toSend.map((g: any) => ({
        supplierName: g.supplierName,
        lineGroupId: g.lineGroupId,
        itemList: g.itemList,
      })),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>彙整並推播 LINE — {orderDate}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {allGroups.map((g: any) => (
            <div key={g.supplierName} className={`border rounded p-3 ${g.lineGroupId ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected[g.supplierName] !== false && !!g.lineGroupId}
                    disabled={!g.lineGroupId}
                    onChange={e => setSelected(s => ({ ...s, [g.supplierName]: e.target.checked }))}
                  />
                  <span className="font-medium text-sm">{g.supplierName}</span>
                  <span className="text-xs text-gray-500">({g.itemCount} 品項)</span>
                </div>
                {g.lineGroupId
                  ? <span className="text-xs text-green-600">LINE 已設定</span>
                  : <span className="text-xs text-red-500">LINE 未設定</span>}
              </div>
              <pre className="text-xs bg-white rounded border p-2 whitespace-pre-wrap font-sans">
                {`【來點什麼採購訂單】\n日期：${orderDate}\n\n${g.itemList}\n\n請確認並回覆收到，謝謝！`}
              </pre>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handlePush} disabled={pushMutation.isPending}>
            {pushMutation.isPending ? '推播中...' : '確認推播'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 新建叫貨單 Tab ────────────────────────────────────────────────────────────

type ItemRow = {
  supplierName: string;
  storeName: string;
  productName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  temperature: '常溫' | '冷藏' | '冷凍';
};

function emptyRow(): ItemRow {
  return { supplierName: '', storeName: '', productName: '', unit: '', quantity: '', unitPrice: '', temperature: '常溫' };
}

function CreateOrderTab() {
  const [orderDate, setOrderDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [items, setItems] = useState<ItemRow[]>([emptyRow()]);

  const createMutation = trpc.procurement.create.useMutation({
    onSuccess: (res) => {
      toast.success(`叫貨單 ${res.orderNo} 建立成功`);
      setItems([emptyRow()]);
      setNote('');
    },
    onError: (e) => toast.error(e.message),
  });

  const setItem = (i: number, field: keyof ItemRow, value: string) => {
    setItems(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const addRow = () => setItems(prev => [...prev, emptyRow()]);
  const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    const validItems = items.filter(r => r.supplierName && r.storeName && r.productName && r.quantity);
    if (validItems.length === 0) {
      toast.error('請至少填寫一筆完整品項（廠商、門市、品名、數量）');
      return;
    }
    createMutation.mutate({
      orderDate,
      note: note || undefined,
      items: validItems.map(r => ({
        supplierName: r.supplierName,
        storeName: r.storeName,
        productName: r.productName,
        unit: r.unit || undefined,
        quantity: Number(r.quantity),
        unitPrice: r.unitPrice ? Number(r.unitPrice) : undefined,
        temperature: r.temperature,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">叫貨日期</label>
          <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-36" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">備註</label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="選填" />
        </div>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">廠商 *</th>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">門市 *</th>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">品名 *</th>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">單位</th>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">數量 *</th>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">單價</th>
              <th className="px-2 py-2 text-left text-gray-600 font-medium">溫層</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((row, i) => (
              <tr key={i}>
                <td className="px-2 py-1">
                  <Input value={row.supplierName} onChange={e => setItem(i, 'supplierName', e.target.value)} className="h-8 text-sm" placeholder="廠商" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.storeName} onChange={e => setItem(i, 'storeName', e.target.value)} className="h-8 text-sm" placeholder="門市" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.productName} onChange={e => setItem(i, 'productName', e.target.value)} className="h-8 text-sm" placeholder="品名" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.unit} onChange={e => setItem(i, 'unit', e.target.value)} className="h-8 text-sm w-16" placeholder="箱" />
                </td>
                <td className="px-2 py-1">
                  <Input type="number" value={row.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} className="h-8 text-sm w-20" placeholder="0" />
                </td>
                <td className="px-2 py-1">
                  <Input type="number" value={row.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} className="h-8 text-sm w-24" placeholder="0" />
                </td>
                <td className="px-2 py-1">
                  <Select value={row.temperature} onValueChange={v => setItem(i, 'temperature', v)}>
                    <SelectTrigger className="h-8 text-sm w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPERATURE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeRow(i)}>✕</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={addRow}>＋ 新增品項</Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? '建立中...' : '建立叫貨單'}
        </Button>
      </div>
    </div>
  );
}

// ── 廠商 LINE 設定 Tab ────────────────────────────────────────────────────────

function SupplierLineTab() {
  const { data: suppliers = [], refetch } = trpc.procurement.supplierLineList.useQuery();
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        設定各廠商的 LINE 群組 ID 後，叫貨單可直接推播給廠商群組。
        <br />
        取得 Group ID 方式：將 LINE Bot 加入廠商群組，群組內任意發訊後，從後台 Webhook log 取得 groupId。
      </p>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">廠商名稱</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">LINE 群組 ID</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">啟用</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">備註</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">編輯</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(suppliers as any[]).map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{s.supplierName}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{s.lineGroupId || <span className="text-gray-300">未設定</span>}</td>
                <td className="px-3 py-2 text-center">
                  {s.isActive ? <span className="text-green-600 text-xs">●</span> : <span className="text-gray-300 text-xs">●</span>}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{s.note}</td>
                <td className="px-3 py-2 text-center">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingSupplier(s)}>編輯</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSupplier && (
        <SupplierLineDialog
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSuccess={() => { setEditingSupplier(null); refetch(); }}
        />
      )}
    </div>
  );
}

function SupplierLineDialog({ supplier, onClose, onSuccess }: {
  supplier: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    lineGroupId: supplier.lineGroupId ?? '',
    lineUserId: supplier.lineUserId ?? '',
    isActive: supplier.isActive !== 0,
    note: supplier.note ?? '',
  });

  const upsert = trpc.procurement.supplierLineUpsert.useMutation({
    onSuccess: () => { toast.success('儲存成功'); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>廠商 LINE 設定 — {supplier.supplierName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">LINE 群組 ID</label>
            <Input
              value={form.lineGroupId}
              onChange={e => setForm(f => ({ ...f, lineGroupId: e.target.value }))}
              placeholder="C1234567890abcdef..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">格式通常為 C 開頭的字串（群組）或 U 開頭（個人）</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">LINE 個人 ID（備用）</label>
            <Input
              value={form.lineUserId}
              onChange={e => setForm(f => ({ ...f, lineUserId: e.target.value }))}
              placeholder="U1234567890abcdef..."
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">備註</label>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lineActive"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            />
            <label htmlFor="lineActive" className="text-sm">啟用</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            onClick={() => upsert.mutate({
              supplierName: supplier.supplierName,
              lineGroupId: form.lineGroupId || undefined,
              lineUserId: form.lineUserId || undefined,
              isActive: form.isActive,
              note: form.note || undefined,
            })}
            disabled={upsert.isPending}
          >
            {upsert.isPending ? '儲存中...' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function OSProcurement() {
  return (
    <AdminDashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">叫貨管理</h1>
          <p className="text-sm text-gray-500 mt-1">採購訂單管理、LINE 推播廠商</p>
        </div>

        <Tabs defaultValue="list">
          <TabsList className="mb-4">
            <TabsTrigger value="list">叫貨單列表</TabsTrigger>
            <TabsTrigger value="create">新建叫貨單</TabsTrigger>
            <TabsTrigger value="suppliers">廠商 LINE 設定</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">叫貨單列表</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderListTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">新建叫貨單</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateOrderTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">廠商 LINE 設定</CardTitle>
              </CardHeader>
              <CardContent>
                <SupplierLineTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}

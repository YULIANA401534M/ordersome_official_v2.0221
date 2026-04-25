import { useState } from "react";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Plus } from "lucide-react";
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

// status badge styles using --os-* tokens
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pending:   { background: 'var(--os-surface-2)',  color: 'var(--os-text-2)' },
  sent:      { background: 'var(--os-info-bg)',     color: 'var(--os-info)' },
  confirmed: { background: 'var(--os-success-bg)', color: 'var(--os-success)' },
  received:  { background: 'var(--os-amber-soft)', color: 'var(--os-amber-text)' },
  cancelled: { background: 'var(--os-danger-bg)',  color: 'var(--os-danger)' },
};

function StatusBadge({ status }: { status: string }) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    ...(STATUS_STYLE[status] ?? { background: 'var(--os-surface-2)', color: 'var(--os-text-2)' }),
  };
  return <span style={style}>{STATUS_LABELS[status] ?? status}</span>;
}

const labelSt: React.CSSProperties = { color: 'var(--os-text-3)', fontSize: 12, display: 'block', marginBottom: 4 };
const thSt: React.CSSProperties = { color: 'var(--os-text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' };
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
          <label style={labelSt}>開始日期</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" />
        </div>
        <div>
          <label style={labelSt}>結束日期</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" />
        </div>
        <div>
          <label style={labelSt}>狀態</label>
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
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
              <th className="px-3 py-2 text-left" style={thSt}>訂單號</th>
              <th className="px-3 py-2 text-left" style={thSt}>日期</th>
              <th className="px-3 py-2 text-left" style={thSt}>來源</th>
              <th className="px-3 py-2 text-left" style={thSt}>廠商</th>
              <th className="px-3 py-2 text-left" style={thSt}>門市</th>
              <th className="px-3 py-2 text-center" style={thSt}>品項</th>
              <th className="px-3 py-2 text-left" style={thSt}>狀態</th>
              <th className="px-3 py-2 text-center" style={thSt}>操作</th>
            </tr>
          </thead>
          <tbody style={{ borderTop: '1px solid var(--os-border)' }}>
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10" style={{ color: 'var(--os-text-3)' }}>
                  目前無資料
                </td>
              </tr>
            )}
            {orders.map((o: any) => (
              <>
                <tr
                  key={o.id}
                  style={{ borderBottom: '1px solid var(--os-border)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--os-amber-soft)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                >
                  <td className="px-3 py-2 font-mono" style={{ color: 'var(--os-amber-text)', textDecoration: 'underline' }}>
                    {o.orderNo}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--os-text-1)' }}>{o.orderDate?.slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <span style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 4,
                      ...(o.sourceType === 'damai_import'
                        ? { background: 'var(--os-info-bg)', color: 'var(--os-info)' }
                        : { background: 'var(--os-warning-bg)', color: 'var(--os-warning)' }),
                    }}>
                      {o.sourceType === 'damai_import' ? '大麥匯入' : '手動'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[160px] truncate" style={{ color: 'var(--os-text-1)' }}>{o.suppliers}</td>
                  <td className="px-3 py-2 text-xs max-w-[120px] truncate" style={{ color: 'var(--os-text-2)' }}>{o.stores}</td>
                  <td className="px-3 py-2 text-center" style={{ color: 'var(--os-text-1)' }}>{o.itemCount}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-2 text-center">
                    <Select
                      value={o.status}
                      onValueChange={(v) => updateStatus.mutate({ orderId: o.id, status: v as any })}
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
                    <td colSpan={8} style={{ background: 'var(--os-amber-soft)', padding: '12px 16px', borderBottom: '1px solid var(--os-border)' }}>
                      <OrderDetail
                        orderId={o.id}
                        orderDate={o.orderDate?.slice(0, 10)}
                        onPush={() => { setPushDialogOrderId(o.id); setPushDialogDate(o.orderDate?.slice(0, 10)); }}
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

  if (!data) return <div style={{ color: 'var(--os-text-3)', fontSize: 13 }}>載入中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--os-text-1)' }}>訂單明細</span>
        <Button
          size="sm"
          className="text-white"
          style={{ background: 'var(--os-amber)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--os-amber-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--os-amber)')}
          onClick={onPush}
        >
          彙整並推播 LINE
        </Button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            {['廠商', '門市', '品名', '數量', '單位', '溫層', 'LINE'].map(h => (
              <th key={h} className="text-left py-1 pr-3" style={thSt}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data.items as any[]).map((item: any) => (
            <tr key={item.id} style={{ borderTop: '1px solid var(--os-border-2)' }}>
              <td className="py-1 pr-3" style={{ color: 'var(--os-text-1)' }}>{item.supplierName}</td>
              <td className="py-1 pr-3" style={{ color: 'var(--os-text-2)' }}>{item.storeName}</td>
              <td className="py-1 pr-3" style={{ color: 'var(--os-text-1)' }}>{item.productName}</td>
              <td className="py-1 pr-3 text-right" style={{ color: 'var(--os-text-1)' }}>{item.quantity}</td>
              <td className="py-1 pr-3" style={{ color: 'var(--os-text-2)' }}>{item.unit}</td>
              <td className="py-1 pr-3" style={{ color: 'var(--os-text-2)' }}>{item.temperature}</td>
              <td className="py-1">
                {item.lineSent
                  ? <span style={{ color: 'var(--os-success)', fontSize: 12 }}>已推</span>
                  : <span style={{ color: 'var(--os-text-3)', fontSize: 12 }}>未推</span>}
              </td>
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
      <DialogContent className="!max-w-2xl p-0 gap-0 max-h-[90vh]">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--os-border)' }}>
            <DialogTitle style={{ color: 'var(--os-text-1)' }}>彙整並推播 LINE — {orderDate}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="space-y-3 px-6 py-4">
              {allGroups.map((g: any) => (
                <div
                  key={g.supplierName}
                  style={{
                    border: `1px solid ${g.lineGroupId ? 'var(--os-border)' : 'var(--os-border-2)'}`,
                    borderRadius: 8,
                    padding: 12,
                    background: g.lineGroupId ? 'var(--os-surface)' : 'var(--os-surface-2)',
                    opacity: g.lineGroupId ? 1 : 0.6,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected[g.supplierName] !== false && !!g.lineGroupId}
                        disabled={!g.lineGroupId}
                        onChange={e => setSelected(s => ({ ...s, [g.supplierName]: e.target.checked }))}
                      />
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--os-text-1)' }}>{g.supplierName}</span>
                      <span style={{ fontSize: 12, color: 'var(--os-text-3)' }}>({g.itemCount} 品項)</span>
                    </div>
                    {g.lineGroupId
                      ? <span style={{ fontSize: 12, color: 'var(--os-success)' }}>LINE 已設定</span>
                      : <span style={{ fontSize: 12, color: 'var(--os-danger)' }}>LINE 未設定</span>}
                  </div>
                  <pre
                    style={{
                      fontSize: 12,
                      background: 'var(--os-bg)',
                      border: '1px solid var(--os-border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      color: 'var(--os-text-1)',
                    }}
                  >
                    {`【來點什麼採購訂單】\n日期：${orderDate}\n\n${g.itemList}\n\n請確認並回覆收到，謝謝！`}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--os-border)' }}>
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button
              className="text-white"
              style={{ background: 'var(--os-amber)' }}
              onClick={handlePush}
              disabled={pushMutation.isPending}
            >
              {pushMutation.isPending ? '推播中...' : '確認推播'}
            </Button>
          </DialogFooter>
        </div>
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
          <label style={labelSt}>叫貨日期</label>
          <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-36" />
        </div>
        <div className="flex-1">
          <label style={labelSt}>備註</label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="選填" />
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
              {['廠商 *', '門市 *', '品名 *', '單位', '數量 *', '單價', '溫層', ''].map(h => (
                <th key={h} className="px-2 py-2 text-left" style={h ? thSt : undefined}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--os-border-2)' }}>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    style={{ color: 'var(--os-danger)' }}
                    onClick={() => removeRow(i)}
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" className="gap-1" onClick={addRow}><Plus size={13} />新增品項</Button>
        <Button
          className="text-white"
          style={{ background: 'var(--os-amber)' }}
          onClick={handleSubmit}
          disabled={createMutation.isPending}
        >
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
      <p style={{ fontSize: 13, color: 'var(--os-text-3)', lineHeight: 1.7 }}>
        設定各廠商的 LINE 群組 ID 後，叫貨單可直接推播給廠商群組。<br />
        取得 Group ID 方式：將 LINE Bot 加入廠商群組，群組內任意發訊後，從後台 Webhook log 取得 groupId。
      </p>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--os-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--os-surface-2)', borderBottom: '1px solid var(--os-border)' }}>
              <th className="px-3 py-2 text-left" style={thSt}>廠商名稱</th>
              <th className="px-3 py-2 text-left" style={thSt}>LINE 群組 ID</th>
              <th className="px-3 py-2 text-center" style={thSt}>啟用</th>
              <th className="px-3 py-2 text-left" style={thSt}>備註</th>
              <th className="px-3 py-2 text-center" style={thSt}>編輯</th>
            </tr>
          </thead>
          <tbody>
            {(suppliers as any[]).map((s: any) => (
              <tr
                key={s.id}
                style={{ borderTop: '1px solid var(--os-border-2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--os-amber-soft)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <td className="px-3 py-2 font-medium" style={{ color: 'var(--os-text-1)' }}>{s.supplierName}</td>
                <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--os-text-2)' }}>
                  {s.lineGroupId || <span style={{ color: 'var(--os-text-3)' }}>未設定</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  {s.isActive
                    ? <span style={{ color: 'var(--os-success)', fontSize: 12 }}>●</span>
                    : <span style={{ color: 'var(--os-text-3)', fontSize: 12 }}>●</span>}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: 'var(--os-text-3)' }}>{s.note}</td>
                <td className="px-3 py-2 text-center">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingSupplier(s)}>
                    編輯
                  </Button>
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
            <label style={labelSt}>LINE 群組 ID</label>
            <Input
              value={form.lineGroupId}
              onChange={e => setForm(f => ({ ...f, lineGroupId: e.target.value }))}
              placeholder="C1234567890abcdef..."
              className="font-mono text-sm"
            />
            <p style={{ fontSize: 11, color: 'var(--os-text-3)', marginTop: 4 }}>
              格式通常為 C 開頭的字串（群組）或 U 開頭（個人）
            </p>
          </div>
          <div>
            <label style={labelSt}>LINE 個人 ID（備用）</label>
            <Input
              value={form.lineUserId}
              onChange={e => setForm(f => ({ ...f, lineUserId: e.target.value }))}
              placeholder="U1234567890abcdef..."
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label style={labelSt}>備註</label>
            <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lineActive"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            />
            <label htmlFor="lineActive" style={{ fontSize: 14, color: 'var(--os-text-1)' }}>啟用</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            className="text-white"
            style={{ background: 'var(--os-amber)' }}
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

const tabPanelSt: React.CSSProperties = {
  background: 'var(--os-surface)',
  border: '1px solid var(--os-border)',
  borderRadius: 12,
  padding: '20px 24px',
};
const panelTitleSt: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: 'var(--os-text-1)', marginBottom: 16,
  paddingBottom: 12, borderBottom: '1px solid var(--os-border)',
};

export default function OSProcurement() {
  return (
    <AdminDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--os-text-1)' }}>叫貨管理</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--os-text-3)' }}>採購訂單管理、LINE 推播廠商</p>
        </div>

        <Tabs defaultValue="list">
          <TabsList style={{ background: 'var(--os-surface-2)', border: '1px solid var(--os-border)', padding: '3px' }}>
            {(["list", "create", "suppliers"] as const).map((v, i) => (
              <TabsTrigger key={v} value={v} style={{ fontSize: 13 }}
                className="data-[state=active]:bg-[--os-surface] data-[state=active]:text-[--os-text-1] data-[state=inactive]:text-[--os-text-3]">
                {["叫貨單列表", "新建叫貨單", "廠商 LINE 設定"][i]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div style={tabPanelSt}>
              <div style={panelTitleSt}>叫貨單列表</div>
              <OrderListTab />
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <div style={tabPanelSt}>
              <div style={panelTitleSt}>新建叫貨單</div>
              <CreateOrderTab />
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4">
            <div style={tabPanelSt}>
              <div style={panelTitleSt}>廠商 LINE 設定</div>
              <SupplierLineTab />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}

import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:    { label: "待處理", color: "bg-gray-100 text-gray-700" },
  assigned:   { label: "已指派", color: "bg-blue-100 text-blue-700" },
  picked:     { label: "已取貨", color: "bg-purple-100 text-purple-700" },
  delivering: { label: "配送中", color: "bg-amber-100 text-amber-700" },
  delivered:  { label: "已送達", color: "bg-green-100 text-green-700" },
  returned:   { label: "退回", color: "bg-red-100 text-red-700" },
  cancelled:  { label: "取消", color: "bg-gray-100 text-gray-500" },
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function DayoneOrders() {
  const [date, setDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<any>(null);

  // New order form state
  const [newOrder, setNewOrder] = useState({ customerId: "", driverId: "", deliveryDate: todayStr(), note: "" });
  const [orderItems, setOrderItems] = useState([{ productId: "", qty: 1, unitPrice: 0 }]);

  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.dayone.orders.list.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: date || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: customers } = trpc.dayone.customers.list.useQuery({ tenantId: TENANT_ID });
  const { data: drivers } = trpc.dayone.drivers.list.useQuery({ tenantId: TENANT_ID });
  const { data: products } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  const createOrder = trpc.dayone.orders.create.useMutation({
    onSuccess: () => {
      toast.success("訂單建立成功");
      setCreateOpen(false);
      utils.dayone.orders.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.dayone.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); utils.dayone.orders.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (orders as any[] ?? []).filter((o: any) =>
    !search || o.customerName?.includes(search) || o.orderNo?.includes(search)
  );

  return (
    <DayoneLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">配送訂單</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
                <Plus className="w-4 h-4" /> 新增訂單
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>新增配送訂單</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <Label>客戶</Label>
                  <Select value={newOrder.customerId} onValueChange={(v) => setNewOrder(p => ({ ...p, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="選擇客戶" /></SelectTrigger>
                    <SelectContent>
                      {(customers as any[] ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>司機</Label>
                  <Select value={newOrder.driverId} onValueChange={(v) => setNewOrder(p => ({ ...p, driverId: v }))}>
                    <SelectTrigger><SelectValue placeholder="選擇司機（可選）" /></SelectTrigger>
                    <SelectContent>
                      {(drivers as any[] ?? []).map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>配送日期</Label>
                  <Input type="date" value={newOrder.deliveryDate} onChange={e => setNewOrder(p => ({ ...p, deliveryDate: e.target.value }))} />
                </div>
                <div>
                  <Label>品項</Label>
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mt-1">
                      <Select value={item.productId} onValueChange={(v) => {
                        const prod = (products as any[] ?? []).find((p: any) => String(p.id) === v);
                        setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: v, unitPrice: Number(prod?.defaultPrice ?? 0) } : it));
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="品項" /></SelectTrigger>
                        <SelectContent>
                          {(products as any[] ?? []).map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" className="w-16" placeholder="數量" value={item.qty}
                        onChange={e => setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it))} />
                      <Input type="number" className="w-20" placeholder="單價" value={item.unitPrice}
                        onChange={e => setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setOrderItems(prev => [...prev, { productId: "", qty: 1, unitPrice: 0 }])}>
                    + 加品項
                  </Button>
                </div>
                <div>
                  <Label>備註</Label>
                  <Input value={newOrder.note} onChange={e => setNewOrder(p => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => {
                if (!newOrder.customerId) { toast.error("請選擇客戶"); return; }
                const validItems = orderItems.filter(i => i.productId && i.qty > 0 && i.unitPrice > 0);
                if (!validItems.length) { toast.error("請至少填寫一個品項"); return; }
                createOrder.mutate({
                  tenantId: TENANT_ID,
                  customerId: Number(newOrder.customerId),
                  driverId: newOrder.driverId ? Number(newOrder.driverId) : undefined,
                  deliveryDate: newOrder.deliveryDate,
                  note: newOrder.note || undefined,
                  items: validItems.map(i => ({ productId: Number(i.productId), qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
                });
              }} disabled={createOrder.isPending}>
                {createOrder.isPending ? "建立中..." : "建立訂單"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-9" placeholder="搜尋客戶或訂單號" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">載入中...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">無訂單資料</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["訂單號", "客戶", "司機", "配送日", "金額", "狀態", "操作"].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o: any) => {
                      const st = STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-700" };
                      return (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{o.orderNo}</td>
                          <td className="px-4 py-3 font-medium">{o.customerName}</td>
                          <td className="px-4 py-3 text-gray-600">{o.driverName ?? "未指派"}</td>
                          <td className="px-4 py-3">{o.deliveryDate}</td>
                          <td className="px-4 py-3">${Number(o.totalAmount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, tenantId: TENANT_ID, status: v as any })}>
                              <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_MAP).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
      </div>
    </DayoneLayout>
  );
}

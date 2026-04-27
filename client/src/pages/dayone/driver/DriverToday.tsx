import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../../lib/trpc";
import DriverLayout from "./DriverLayout";
import { CheckCircle2, MapPin, Package, Phone, ChevronRight, Truck, Plus, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TENANT_ID = 90004;

const STATUS_LABEL: Record<string, string> = {
  pending:    "待處理",
  assigned:   "已派車",
  picked:     "已撿貨",
  delivering: "配送中",
  delivered:  "已送達",
  returned:   "已回單",
};

const STATUS_TONE: Record<string, string> = {
  pending:    "bg-stone-100 text-stone-500",
  assigned:   "bg-sky-100 text-sky-700",
  picked:     "bg-amber-100 text-amber-700",
  delivering: "bg-orange-100 text-orange-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  returned:   "bg-rose-100 text-rose-700",
};

function SupplementOrderDialog({ onClose }: { onClose: () => void }) {
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const utils = trpc.useUtils();
  const [customerId, setCustomerId] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempNote, setTempNote] = useState("");
  const [useTempCustomer, setUseTempCustomer] = useState(false);
  const [items, setItems] = useState([{ productId: "", qty: "1", unitPrice: "" }]);
  const [cashCollected, setCashCollected] = useState("0");

  const { data: dispatches = [] } = trpc.dayone.dispatch.listDispatch.useQuery({ tenantId: TENANT_ID, dispatchDate: today });
  const activeDispatch = (dispatches as any[]).find((d: any) => ["printed", "in_progress"].includes(d.status ?? ""));

  const { data: routeCustomers = [] } = trpc.dayone.driver.getMyRouteCustomers.useQuery({ tenantId: TENANT_ID, deliveryDate: today });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId: TENANT_ID });

  // 選客戶後自動帶入定價
  const selectedCustomer = (routeCustomers as any[]).find((c: any) => String(c.id) === customerId);

  const addSupplementOrder = trpc.dayone.driver.addSupplementOrder.useMutation({
    onSuccess: (data) => {
      toast.success(`補單已建立，金額 NT$ ${data.totalAmount.toLocaleString()}，訂單號 ${data.orderNo}`);
      utils.dayone.driver.getMyTodayOrders.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalAmt = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const payLabel = !customerId && !useTempCustomer ? "—" :
    selectedCustomer?.settlementCycle === "monthly" ? "月結" :
    selectedCustomer?.settlementCycle === "weekly" ? "週結" : "現收";

  function handleSubmit() {
    if (!activeDispatch) { toast.error("找不到今日有效派車單（需已列印）"); return; }
    if (!useTempCustomer && !customerId) { toast.error("請選擇客戶"); return; }
    if (useTempCustomer && !tempName.trim()) { toast.error("請填臨時客戶名稱"); return; }
    const validItems = items.filter((i) => i.productId && Number(i.qty) > 0);
    if (validItems.length === 0) { toast.error("請至少填一項商品"); return; }
    addSupplementOrder.mutate({
      tenantId: TENANT_ID,
      dispatchOrderId: activeDispatch.id,
      customerId: !useTempCustomer && customerId ? Number(customerId) : undefined,
      tempCustomerName: useTempCustomer ? tempName.trim() : undefined,
      tempCustomerNote: useTempCustomer && tempNote.trim() ? tempNote.trim() : undefined,
      items: validItems.map((i) => ({ productId: Number(i.productId), qty: Number(i.qty), unitPrice: Number(i.unitPrice) || 0 })),
      cashCollected: Number(cashCollected) || 0,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>臨時加貨補單</DialogTitle>
        </DialogHeader>
        {!activeDispatch && (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">目前沒有已列印的派車單，無法補單。</div>
        )}
        <div className="space-y-3 text-sm">
          {/* 客戶選擇 */}
          <div>
            <div className="mb-1.5 flex items-center gap-3">
              <button type="button" onClick={() => setUseTempCustomer(false)}
                className={`text-xs px-3 py-1 rounded-full border ${!useTempCustomer ? "bg-amber-600 text-white border-amber-600" : "border-stone-200 text-stone-500"}`}>
                路線客戶
              </button>
              <button type="button" onClick={() => setUseTempCustomer(true)}
                className={`text-xs px-3 py-1 rounded-full border ${useTempCustomer ? "bg-amber-600 text-white border-amber-600" : "border-stone-200 text-stone-500"}`}>
                臨時客戶
              </button>
            </div>
            {!useTempCustomer ? (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="選擇客戶" /></SelectTrigger>
                <SelectContent>
                  {(routeCustomers as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Input placeholder="客戶名稱（必填）" className="rounded-2xl" value={tempName} onChange={(e) => setTempName(e.target.value)} />
                <Input placeholder="備註（管理員可見）" className="rounded-2xl" value={tempNote} onChange={(e) => setTempNote(e.target.value)} />
              </div>
            )}
            {selectedCustomer && (
              <p className="mt-1 text-xs text-stone-400">結帳方式：{payLabel}</p>
            )}
          </div>

          {/* 品項 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-600">補貨品項</span>
              <button type="button" className="text-xs text-amber-600"
                onClick={() => setItems((s) => [...s, { productId: "", qty: "1", unitPrice: "" }])}>
                + 新增品項
              </button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="mb-1.5 grid grid-cols-[1fr_52px_68px_auto] gap-1.5 items-center">
                <Select value={item.productId} onValueChange={(v) => {
                  setItems((s) => s.map((r, i) => i === idx ? { ...r, productId: v, unitPrice: "" } : r));
                }}>
                  <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder="商品" /></SelectTrigger>
                  <SelectContent>
                    {(products as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={1} value={item.qty} className="rounded-xl h-8 text-xs text-center"
                  onChange={(e) => setItems((s) => s.map((r, i) => i === idx ? { ...r, qty: e.target.value } : r))} />
                <Input type="number" min={0} placeholder="單價" value={item.unitPrice} className="rounded-xl h-8 text-xs text-right"
                  onChange={(e) => setItems((s) => s.map((r, i) => i === idx ? { ...r, unitPrice: e.target.value } : r))} />
                <button type="button" className="text-stone-400 hover:text-rose-500 px-0.5 text-xs"
                  onClick={() => setItems((s) => s.length === 1 ? [{ productId: "", qty: "1", unitPrice: "" }] : s.filter((_, i) => i !== idx))}>✕</button>
              </div>
            ))}
            <div className="text-right text-xs text-stone-500 mt-1">合計：<strong className="text-stone-800">NT$ {totalAmt.toLocaleString()}</strong>　{payLabel}</div>
          </div>

          {/* 現收金額（僅現收客戶） */}
          {(!selectedCustomer || (!["monthly","weekly"].includes(selectedCustomer.settlementCycle))) && (
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">現場收款</label>
              <Input type="number" min={0} className="rounded-2xl" value={cashCollected}
                onChange={(e) => setCashCollected(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose}>取消</Button>
            <Button className="flex-1 rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
              disabled={addSupplementOrder.isPending || !activeDispatch}
              onClick={handleSubmit}>
              {addSupplementOrder.isPending ? "建立中..." : "確認補單"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DriverToday() {
  const [, navigate] = useLocation();
  const [showSupplement, setShowSupplement] = useState(false);
  const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: orders = [], isLoading } = trpc.dayone.driver.getMyTodayOrders.useQuery({
    tenantId: TENANT_ID,
    deliveryDate: today,
  });

  const active  = (orders as any[]).filter((o: any) => o.status !== "delivered" && o.status !== "returned");
  const done    = (orders as any[]).filter((o: any) => o.status === "delivered");
  const totalCash = done.reduce((s: number, o: any) => s + Number(o.cashCollected ?? 0), 0);

  return (
    <DriverLayout title="今日路線">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI strip */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-stone-200/70 bg-white p-4 text-center shadow-[0_12px_24px_rgba(120,53,15,0.05)]">
              <p className="text-3xl font-bold text-stone-900">{(orders as any[]).length}</p>
              <p className="mt-1 text-xs text-stone-500">今日總站</p>
            </div>
            <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4 text-center">
              <p className="text-3xl font-bold text-orange-700">{active.length}</p>
              <p className="mt-1 text-xs text-orange-600">待完成</p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{done.length}</p>
              <p className="mt-1 text-xs text-emerald-600">已送達</p>
            </div>
          </section>

          {/* 臨時加貨按鈕 */}
          <button
            type="button"
            onClick={() => setShowSupplement(true)}
            className="flex w-full items-center gap-3 rounded-[26px] border border-dashed border-amber-300 bg-amber-50 px-5 py-3.5 text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <ShoppingCart className="h-4 w-4 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-800">臨時加貨</p>
              <p className="text-xs text-amber-600">客戶現場追加，補單並連結此派車</p>
            </div>
            <Plus className="h-4 w-4 text-amber-500 shrink-0" />
          </button>

          {/* Today's cash summary */}
          {done.length > 0 && (
            <section className="rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4">
              <p className="text-xs text-amber-600">今日現金收款合計</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">NT$ {totalCash.toLocaleString()}</p>
            </section>
          )}

          {/* Active stops */}
          {active.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-widest text-stone-400">待配送路線</p>
              <div className="space-y-2">
                {active.map((order: any) => (
                  <button
                    key={order.id}
                    type="button"
                    className="w-full text-left rounded-[26px] border border-stone-200/80 bg-white p-4 shadow-[0_8px_20px_rgba(120,53,15,0.05)] active:scale-[0.99] transition-transform"
                    onClick={() => navigate(`/driver/order/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Stop number badge */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                        {order.stopSequence ?? "—"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-semibold text-stone-900">{order.customerName}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[order.status] ?? "bg-stone-100 text-stone-500"}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-stone-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="truncate">{order.customerAddress ?? "未提供地址"}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-base font-bold text-stone-900">NT$ {Number(order.totalAmount ?? 0).toLocaleString()}</p>
                        <ChevronRight className="h-4 w-4 text-stone-300" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Completed stops */}
          {done.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-widest text-stone-400">已完成</p>
              <div className="space-y-2">
                {done.map((order: any) => (
                  <button
                    key={order.id}
                    type="button"
                    className="w-full text-left rounded-[26px] border border-emerald-100 bg-emerald-50/60 p-4 active:scale-[0.99] transition-transform"
                    onClick={() => navigate(`/driver/order/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-700">{order.customerName}</p>
                        <p className="text-xs text-stone-400">{order.customerAddress ?? ""}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-emerald-700">
                          NT$ {Number(order.cashCollected ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-400">已收</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {(orders as any[]).length === 0 && (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-16 text-center text-stone-400">
              <Truck className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4 text-sm">今天沒有派車任務</p>
            </div>
          )}
        </div>
      )}

      {showSupplement && <SupplementOrderDialog onClose={() => setShowSupplement(false)} />}
    </DriverLayout>
  );
}

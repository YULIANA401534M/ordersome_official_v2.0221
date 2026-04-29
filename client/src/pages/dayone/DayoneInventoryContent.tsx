import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Boxes, Pencil } from "lucide-react";
import { toast } from "sonner";

const MOVEMENT_TYPES = [
  { value: "in", label: "入庫" },
  { value: "out", label: "出庫" },
  { value: "adjust", label: "盤點調整" },
  { value: "return", label: "回庫" },
];

export default function DayoneInventoryContent({ tenantId }: { tenantId: number }) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", movementType: "in", qty: 0, note: "" });
  const [safetyEdit, setSafetyEdit] = useState<{ id: number; productId: number; value: number } | null>(null);
  const [qtyEdit, setQtyEdit] = useState<{ id: number; productId: number; currentQty: number; newQty: number; note: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: inventory = [], isLoading } = trpc.dayone.inventory.list.useQuery({ tenantId });
  const { data: alerts = [] } = trpc.dayone.reports.inventoryAlerts.useQuery({ tenantId });
  const { data: products = [] } = trpc.dayone.products.list.useQuery({ tenantId });
  const { data: movements = [] } = trpc.dayone.inventory.movements.useQuery({ tenantId, limit: 50 });
  const { data: pendingReturns = [] } = trpc.dayone.inventory.pendingReturns.useQuery({ tenantId });
  const { data: signedReceipts = [] } = trpc.dayone.purchaseReceipt.list.useQuery({ tenantId, status: "signed" });

  const inventorySummary = useMemo(() => {
    const availableQty = inventory.reduce((sum: number, item: any) => sum + Number(item.currentQty ?? 0), 0);
    const pendingQty = pendingReturns.reduce((sum: number, item: any) => sum + Number(item.qty ?? 0), 0);
    const inboundQty = signedReceipts.reduce((sum: number, item: any) => sum + Number(item.totalQty ?? 0), 0);
    return {
      availableQty,
      pendingQty,
      inboundQty,
      lowStockCount: alerts.length,
    };
  }, [alerts.length, inventory, pendingReturns, signedReceipts]);

  const setSafety = trpc.dayone.inventory.setSafety.useMutation({
    onSuccess: () => {
      toast.success("安全庫存已更新");
      setSafetyEdit(null);
      utils.dayone.inventory.list.invalidate();
      utils.dayone.reports.inventoryAlerts.invalidate();
    },
    onError: () => toast.error("安全庫存更新失敗，請重試"),
  });

  const adjust = trpc.dayone.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success("庫存異動已登記");
      setAdjustOpen(false);
      utils.dayone.inventory.list.invalidate();
      utils.dayone.inventory.movements.invalidate();
      utils.dayone.reports.inventoryAlerts.invalidate();
    },
    onError: () => toast.error("庫存調整失敗，請重試"),
  });

  const confirmPendingReturn = trpc.dayone.inventory.confirmPendingReturn.useMutation({
    onSuccess: () => {
      toast.success("已確認回庫並轉入可賣庫存");
      utils.dayone.inventory.list.invalidate();
      utils.dayone.inventory.pendingReturns.invalidate();
      utils.dayone.inventory.movements.invalidate();
      utils.dayone.reports.inventoryAlerts.invalidate();
    },
    onError: () => toast.error("確認回庫失敗，請重試"),
  });

  return (
    <div className="dayone-page">
      <div className="dayone-page-header">
        <div>
          <h1 className="dayone-page-title">庫存與異動</h1>
          <p className="dayone-page-subtitle">即時存量、警戒線與人工調整 · 派車與回庫自動回寫</p>
        </div>
        <Button className="rounded-2xl bg-amber-600 text-white hover:bg-amber-700 shrink-0" onClick={() => setAdjustOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增庫存異動
        </Button>
      </div>

      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              庫存警示
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {alerts.map((alert: any) => (
                <span key={alert.id} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                  {alert.productName} 目前 {alert.currentQty} {alert.unit}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[24px] border-stone-200/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-stone-500">可賣庫存總量</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dayone-kpi-value text-stone-900">{inventorySummary.availableQty}</p>
            <p className="mt-2 text-xs text-stone-500">目前已正式入倉、可再派車的總數量。</p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700">回庫待驗</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dayone-kpi-value text-amber-800">{inventorySummary.pendingQty}</p>
            <p className="mt-2 text-xs text-amber-700/80">司機已回報，但管理端尚未正式加回可賣庫存。</p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-sky-200 bg-sky-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-sky-700">待入倉進貨</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dayone-kpi-value text-sky-800">{inventorySummary.inboundQty}</p>
            <p className="mt-2 text-xs text-sky-700/80">供應商已簽名、應付已成立，但尚未正式轉為可賣庫存。</p>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700">低於安全庫存</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dayone-kpi-value text-orange-800">{inventorySummary.lowStockCount}</p>
            <p className="mt-2 text-xs text-orange-700/80">需要優先補貨或檢查派車扣庫是否異常的品項。</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-amber-200/80 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">回庫待驗清單</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingReturns.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-400">目前沒有待確認的司機回庫資料。</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-stone-50">
                <tr>
                  {["品項", "數量", "司機 / 路線", "回報時間", "操作"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left font-medium text-stone-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingReturns.map((item: any) => (
                  <tr key={item.id} className="border-b transition-colors hover:bg-stone-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{item.productName}</p>
                      <p className="mt-1 text-xs text-stone-500">{item.note || `派車單 #${item.dispatchOrderId}`}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-700">
                      {Number(item.qty)} {item.unit || ""}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      <p>{item.driverName || "-"}</p>
                      <p className="mt-1 text-xs">路線 {item.routeCode || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {new Date(item.reportedAt).toLocaleString("zh-TW", {
                        timeZone: "Asia/Taipei",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                        disabled={confirmPendingReturn.isPending}
                        onClick={() =>
                          confirmPendingReturn.mutate({
                            tenantId,
                            pendingReturnId: Number(item.id),
                          })
                        }
                      >
                        確認入庫
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-[28px] border-stone-200/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">目前庫存</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-stone-400">讀取中...</div>
            ) : inventory.length === 0 ? (
              <div className="p-10 text-center text-stone-400">
                <Boxes className="mx-auto h-10 w-10 opacity-40" />
                <p className="mt-4 text-sm">目前還沒有庫存資料。</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50">
                  <tr>
                    {["品項", "目前庫存", "安全庫存", "單位", "調整"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left font-medium text-stone-500">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item: any) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">{item.productName}</td>
                      <td className={`px-4 py-3 font-semibold ${Number(item.currentQty) <= Number(item.safetyQty) ? "text-orange-600" : "text-stone-900"}`}>
                        {qtyEdit !== null && qtyEdit?.id === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-8 w-20"
                              type="number"
                              value={qtyEdit.newQty}
                              onChange={(e) => setQtyEdit((prev) => prev ? { ...prev, newQty: Number(e.target.value) } : null)}
                            />
                            <Input
                              className="h-8 w-28"
                              placeholder="備註原因"
                              value={qtyEdit.note}
                              onChange={(e) => setQtyEdit((prev) => prev ? { ...prev, note: e.target.value } : null)}
                            />
                            <button
                              type="button"
                              className="text-xs text-amber-600 hover:text-amber-700"
                              onClick={() => {
                                if (qtyEdit.newQty === qtyEdit.currentQty) { setQtyEdit(null); return; }
                                const diff = qtyEdit.newQty - qtyEdit.currentQty;
                                adjust.mutate({
                                  tenantId,
                                  productId: qtyEdit.productId,
                                  type: "adjust",
                                  qty: qtyEdit.newQty,
                                  note: `${qtyEdit.note || "手動調整"} (${diff > 0 ? "+" : ""}${diff})`,
                                }, {
                                  onSuccess: () => setQtyEdit(null),
                                });
                              }}
                            >
                              儲存
                            </button>
                            <button type="button" className="text-xs text-stone-400" onClick={() => setQtyEdit(null)}>取消</button>
                          </div>
                        ) : (
                          item.currentQty
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {safetyEdit !== null && safetyEdit?.id === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input className="h-8 w-20" type="number" value={safetyEdit.value} onChange={(event) => setSafetyEdit((prev) => prev ? { ...prev, value: Number(event.target.value) } : null)} />
                            <button type="button" className="text-xs text-amber-600" onClick={() => setSafety.mutate({ tenantId, productId: safetyEdit.productId, safetyQty: safetyEdit.value })}>儲存</button>
                            <button type="button" className="text-xs text-stone-400" onClick={() => setSafetyEdit(null)}>取消</button>
                          </div>
                        ) : (
                          <button type="button" className="text-stone-500 hover:text-amber-600" onClick={() => setSafetyEdit({ id: item.id, productId: item.productId, value: Number(item.safetyQty) })}>
                            {item.safetyQty ?? 0}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{item.unit}</td>
                      <td className="px-4 py-3">
                        {qtyEdit?.id !== item.id && (
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            onClick={() => setQtyEdit({ id: item.id, productId: item.productId, currentQty: Number(item.currentQty), newQty: Number(item.currentQty), note: "" })}
                          >
                            <Pencil className="h-3 w-3" />
                            調整
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-stone-200/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">最近異動</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-stone-400">目前沒有異動紀錄。</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b bg-stone-50">
                  <tr>
                    {["品項", "類型", "數量", "備註", "時間"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left font-medium text-stone-500">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement: any) => {
                    const movementType = MOVEMENT_TYPES.find((type) => type.value === movement.movementType);
                    const incoming = movement.movementType === "in" || movement.movementType === "return";
                    return (
                      <tr key={movement.id} className="border-b transition-colors hover:bg-stone-50/80">
                        <td className="px-4 py-3 text-stone-900">{movement.productName}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${incoming ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {movementType?.label ?? movement.movementType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-stone-900">{incoming ? `+${movement.qty}` : movement.qty}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">{movement.note ?? "-"}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">
                          {new Date(movement.createdAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>新增庫存異動</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>品項</Label>
              <Select value={form.productId} onValueChange={(value) => setForm((prev) => ({ ...prev, productId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇品項" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>異動類型</Label>
              <Select value={form.movementType} onValueChange={(value) => setForm((prev) => ({ ...prev, movementType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>數量</Label>
              <Input type="number" value={form.qty} onChange={(event) => setForm((prev) => ({ ...prev, qty: Number(event.target.value) }))} />
            </div>
            <div>
              <Label>備註</Label>
              <Input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
            </div>
          </div>

          <Button
            className="mt-2 w-full rounded-2xl bg-amber-600 text-white hover:bg-amber-700"
            disabled={adjust.isPending}
            onClick={() => {
              if (!form.productId || !form.qty) {
                toast.error("請先填寫品項與數量");
                return;
              }
              adjust.mutate({
                tenantId,
                productId: Number(form.productId),
                type: form.movementType as any,
                qty: Number(form.qty),
                note: form.note || undefined,
              });
            }}
          >
            {adjust.isPending ? "送出中..." : "確認異動"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

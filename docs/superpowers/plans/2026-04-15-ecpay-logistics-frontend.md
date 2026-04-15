# 綠界物流串接（前端）實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在結帳頁新增超商取貨選項（全家/7-11/萊爾富），後台訂單列表顯示物流欄位與「建立物流單」按鈕，我的訂單顯示物流狀態，付款完成頁顯示取貨門市提示。

**Architecture:** 後端 API（`trpc.logistics.getMapParams`、`trpc.logistics.createLogisticsOrder`）和 DB 欄位（`shippingMethod`、`cvsStore*`、`logistics*`）已全部就緒，本次純前端工作。結帳頁透過 `window.open` + `postMessage` 完成電子地圖選店流程；後台透過 `createLogisticsOrder` mutation 建立物流單；我的訂單與付款完成頁直接讀取訂單物流欄位。

**Tech Stack:** React 18, TypeScript, tRPC (client), Tailwind CSS, shadcn/ui（Badge/Card/Button/RadioGroup/Label）, Lucide React, Sonner (toast)

---

## 檔案對照表

| 動作 | 路徑 |
|------|------|
| 修改 | `client/src/pages/shop/Checkout.tsx` |
| 修改 | `client/src/pages/admin/AdminOrders.tsx` |
| 修改 | `client/src/pages/shop/MyOrders.tsx` |
| 修改 | `client/src/pages/shop/OrderComplete.tsx` |

> ⚠️ 沒有後端需要動，不需要 `db:push`，沒有新套件。

---

## 重要背景知識

### tRPC 端點（已存在）

```typescript
// 取得電子地圖表單參數（protectedProcedure，需登入）
trpc.logistics.getMapParams.useQuery({ subType: "FAMI" | "UNIMART" | "HILIFE" })
// 回傳：{ url: string, params: Record<string, string | number> }

// 建立物流單（adminProcedure）
trpc.logistics.createLogisticsOrder.useMutation({ orderId: number })
// 回傳：{ success: boolean, logisticsId: string, message: string }
```

### 訂單 DB 欄位（已存在，所有查詢會回傳）

```typescript
shippingMethod: "home_delivery" | "cvs_fami" | "cvs_unimart" | "cvs_hilife"
cvsStoreId: string | null
cvsStoreName: string | null
cvsStoreAddress: string | null
logisticsId: string | null
logisticsStatus: string | null      // 例："300"
logisticsStatusMsg: string | null   // 例："訂單處理中"
```

### 電子地圖 postMessage 流程

綠界電子地圖選店完成後，伺服器會 POST 到 `/api/ecpay/map-result`（serverReplyURL），由後端發送 `postMessage` 到開啟電子地圖的視窗。
訊息格式：`{ type: "ecpay-map-result", storeId, storeName, storeAddress }`

### order.create mutation（已存在）的物流欄位

```typescript
createOrder.mutate({
  // ...現有欄位...
  shippingMethod: "home_delivery" | "cvs_fami" | "cvs_unimart" | "cvs_hilife",
  cvsStoreId?: string,
  cvsStoreName?: string,
  cvsStoreAddress?: string,
});
```

---

## Task 1：Checkout.tsx — 配送方式狀態與驗證邏輯

**Files:**
- Modify: `client/src/pages/shop/Checkout.tsx`（form 狀態、validate 函式、handleSubmit）

- [ ] **Step 1: 在 form 狀態加入物流欄位**

在 `Checkout.tsx` 的 `useState` form 初始值（約第 89 行）加入以下四個欄位：

```typescript
const [form, setForm] = useState({
  // Block 2（保持不變）
  guestEmail: "",
  guestPhone: "",
  // Block 3（保持不變）
  recipientName: "",
  recipientPhone: "",
  recipientEmail: "",
  shippingAddress: "",
  note: "",
  paymentMethod: "credit_card",
  invoiceType: "personal" as "personal" | "company",
  companyTaxId: "",
  companyName: "",
  // ── 新增：物流欄位 ──
  shippingMethod: "home_delivery" as "home_delivery" | "cvs_fami" | "cvs_unimart" | "cvs_hilife",
  cvsStoreId: "",
  cvsStoreName: "",
  cvsStoreAddress: "",
});
```

- [ ] **Step 2: 修改 validate 函式，超商取貨時 shippingAddress 不驗證**

找到 `validate` 函式（約第 126 行），把 `shippingAddress` 驗證改為條件式：

```typescript
// 改前：
if (!data.shippingAddress.trim()) e.shippingAddress = "請輸入收件地址";

// 改後：
const isCvs = data.shippingMethod !== "home_delivery";
if (!isCvs && !data.shippingAddress.trim()) {
  e.shippingAddress = "請輸入收件地址";
}
if (isCvs && !data.cvsStoreId) {
  e.cvsStoreId = "請選擇取貨門市";
}
```

- [ ] **Step 3: 修改 handleSubmit，加入物流欄位並自動補 shippingAddress**

找到 `createOrder.mutate({...})` 呼叫（約第 225 行），超商取貨時將 `shippingAddress` 自動設為門市地址：

```typescript
const isCvsSubmit = form.shippingMethod !== "home_delivery";

createOrder.mutate({
  recipientName: form.recipientName,
  recipientPhone: form.recipientPhone,
  recipientEmail: form.recipientEmail,
  shippingAddress: isCvsSubmit ? form.cvsStoreAddress : form.shippingAddress,
  note: form.note,
  paymentMethod: form.paymentMethod,
  invoiceType: form.invoiceType,
  companyTaxId: form.invoiceType === "company" ? form.companyTaxId : undefined,
  companyName: form.invoiceType === "company" ? form.companyName : undefined,
  orderSource,
  shippingMethod: form.shippingMethod,
  cvsStoreId: form.cvsStoreId || undefined,
  cvsStoreName: form.cvsStoreName || undefined,
  cvsStoreAddress: form.cvsStoreAddress || undefined,
  items: items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    selectedSpecs: item.selectedSpecs ?? {},
  })),
});
```

- [ ] **Step 4: 確認 TypeScript 無錯誤**

```bash
cd "c:/Users/user/Desktop/VS CODE專案/ordersome_official_v2.0221"
pnpm check 2>&1 | head -30
```

預期：與物流欄位相關的錯誤不出現（可能有其他既有錯誤，Task 1 完成後不需完全零錯誤）

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/shop/Checkout.tsx
git commit -m "feat(checkout): 加入 shippingMethod/cvs 表單狀態與驗證"
```

---

## Task 2：Checkout.tsx — 運費顯示邏輯

**Files:**
- Modify: `client/src/pages/shop/Checkout.tsx`（shippingFee 計算）

- [ ] **Step 1: 修改前端運費顯示邏輯**

找到 `shippingFee` 計算（約第 85 行），改為：

```typescript
const isCvsMethod = form.shippingMethod !== "home_delivery";
const cvsFee = 60;

const shippingFee = totalPrice >= freeShippingThreshold
  ? 0
  : isCvsMethod
    ? cvsFee
    : baseShippingFee;
```

> 注意：`isCvsMethod` 要放在 `shippingFee` 前計算，且依賴 `form.shippingMethod`。因為 `form` 在 useState 之後才有，這行要放在 useState 之後、shippingFee 之前。

- [ ] **Step 2: 修改運費提示文字（顯示超商運費 60 元提示）**

找到「再購 NT$ ... 即享免運費」的提示段落，加入超商運費說明：

```tsx
{!isSettingsLoading && totalPrice < freeShippingThreshold && (
  <p className="text-xs text-amber-600">
    {isCvsMethod
      ? `超商取貨運費 NT$ ${cvsFee}，再購 NT$ ${(freeShippingThreshold - totalPrice).toLocaleString()} 即享免運費`
      : `再購 NT$ ${(freeShippingThreshold - totalPrice).toLocaleString()} 即享免運費`}
  </p>
)}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/shop/Checkout.tsx
git commit -m "feat(checkout): 超商取貨運費顯示邏輯（60 元）"
```

---

## Task 3：Checkout.tsx — 配送方式選擇 UI

**Files:**
- Modify: `client/src/pages/shop/Checkout.tsx`（JSX 區塊 3-A 前插入配送方式卡片區）

- [ ] **Step 1: 新增 Truck icon 到 import**

找到第 1 行 lucide-react import，加入 `Truck` 和 `MapPin`：

```typescript
import {
  ArrowLeft, CreditCard, Building, Store, FileText,
  AlertCircle, ShoppingCart, User, Package, ChevronRight,
  Mail, Phone, CheckCircle2, Minus, Plus, Trash2, Truck, MapPin
} from "lucide-react";
```

- [ ] **Step 2: 在 BLOCK 3 的收件資訊（3-A）前插入「配送方式」區塊**

找到 `{/* 3-A 收件資訊 */}` 這行（約第 525 行），在它**之前**插入：

```tsx
{/* 3-A 配送方式 */}
<div className="mb-8">
  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">配送方式</p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {[
      { value: "home_delivery", icon: Truck, label: "宅配到府", desc: "送到指定地址" },
      { value: "cvs_fami", icon: Store, label: "全家取貨", desc: "FamilyMart" },
      { value: "cvs_unimart", icon: Store, label: "7-ELEVEN", desc: "統一超商" },
      { value: "cvs_hilife", icon: Store, label: "萊爾富取貨", desc: "Hi-Life" },
    ].map(({ value, icon: Icon, label, desc }) => (
      <button
        key={value}
        type="button"
        onClick={() => setField("shippingMethod", value as typeof form.shippingMethod)}
        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center
          ${form.shippingMethod === value
            ? "border-amber-500 bg-amber-50 shadow-sm"
            : "border-gray-200 hover:border-gray-300 bg-white"}`}
      >
        {form.shippingMethod === value && (
          <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-amber-500" />
        )}
        <Icon className={`h-6 w-6 ${form.shippingMethod === value ? "text-amber-600" : "text-gray-400"}`} />
        <div>
          <p className={`font-semibold text-sm ${form.shippingMethod === value ? "text-amber-800" : "text-gray-800"}`}>
            {label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
        </div>
      </button>
    ))}
  </div>
</div>

<Separator className="mb-8" />
```

- [ ] **Step 3: 確認 TypeScript 無錯誤**

```bash
pnpm check 2>&1 | grep "Checkout" | head -10
```

預期：沒有 `Checkout.tsx` 相關錯誤

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/shop/Checkout.tsx
git commit -m "feat(checkout): 配送方式選擇卡片 UI（宅配/全家/7-11/萊爾富）"
```

---

## Task 4：Checkout.tsx — 電子地圖選店 UI + postMessage 監聽

**Files:**
- Modify: `client/src/pages/shop/Checkout.tsx`（收件資訊區塊條件顯示 + 選店按鈕）

- [ ] **Step 1: 加入電子地圖相關 state 和 tRPC query**

在 `const [isSubmitting, setIsSubmitting] = useState(false);` 後面加入：

```typescript
// 電子地圖選店
const [isLoadingMap, setIsLoadingMap] = useState(false);
const cvsSubTypeMap = {
  cvs_fami: "FAMI" as const,
  cvs_unimart: "UNIMART" as const,
  cvs_hilife: "HILIFE" as const,
};
const currentSubType = form.shippingMethod !== "home_delivery"
  ? cvsSubTypeMap[form.shippingMethod]
  : null;

const { refetch: fetchMapParams } = trpc.logistics.getMapParams.useQuery(
  { subType: currentSubType! },
  { enabled: false }  // 手動觸發
);
```

- [ ] **Step 2: 加入 openEcpayMap 函式**

在 `handleSubmit` 函式前加入：

```typescript
const openEcpayMap = async () => {
  if (!currentSubType) return;
  setIsLoadingMap(true);
  try {
    const result = await fetchMapParams();
    if (!result.data) {
      toast.error("無法取得電子地圖參數，請稍後再試");
      return;
    }
    const { url, params } = result.data;

    // 建立隱藏 form 以 POST 方式開啟新視窗
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;
    form.target = "_blank";
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  } catch {
    toast.error("取得電子地圖失敗，請確認已登入");
  } finally {
    setIsLoadingMap(false);
  }
};
```

- [ ] **Step 3: 加入 postMessage 監聽（useEffect）**

在登入自動填充的 `useEffect` 後面加入：

```typescript
// 監聽綠界電子地圖選店結果
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type !== "ecpay-map-result") return;
    const { storeId, storeName, storeAddress } = event.data;
    setForm(prev => ({
      ...prev,
      cvsStoreId: storeId || "",
      cvsStoreName: storeName || "",
      cvsStoreAddress: storeAddress || "",
    }));
    // 清除門市選擇錯誤
    setErrors(prev => {
      const next = { ...prev };
      delete next.cvsStoreId;
      return next;
    });
    toast.success(`已選擇門市：${storeName}`);
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

- [ ] **Step 4: 修改「3-A 收件資訊」收件地址區塊，條件顯示**

找到 `{/* 收件地址 */}` 段落（約第 582 行），用 isCvs 條件包裹：

```tsx
{/* 收件地址（僅宅配顯示）或超商門市選擇 */}
{form.shippingMethod === "home_delivery" ? (
  <div className="mt-4">
    <Label htmlFor="shippingAddress" className="mb-1.5 block">
      收件地址 <span className="text-red-500">*</span>
    </Label>
    <Input
      id="shippingAddress"
      placeholder="縣市 + 鄉鎮區 + 路街 + 號"
      value={form.shippingAddress}
      onChange={(e) => setField("shippingAddress", e.target.value)}
      onBlur={() => handleBlur("shippingAddress")}
      className={errors.shippingAddress && touched.shippingAddress ? "border-red-400 focus-visible:ring-red-400" : ""}
    />
    {touched.shippingAddress && <FieldError msg={errors.shippingAddress} />}
  </div>
) : (
  <div className="mt-4">
    <Label className="mb-1.5 block">
      取貨門市 <span className="text-red-500">*</span>
    </Label>
    {form.cvsStoreId ? (
      <div className="flex items-start justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-green-800">{form.cvsStoreName}</p>
            <p className="text-xs text-green-600 mt-0.5">{form.cvsStoreAddress}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openEcpayMap}
          disabled={isLoadingMap}
          className="shrink-0 text-xs"
        >
          重新選擇
        </Button>
      </div>
    ) : (
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={openEcpayMap}
          disabled={isLoadingMap || !isAuthenticated}
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          {isLoadingMap ? "開啟中..." : "選擇門市"}
        </Button>
        {!isAuthenticated && (
          <p className="text-xs text-amber-600 mt-1">請先登入才能使用電子地圖選店</p>
        )}
        {errors.cvsStoreId && touched.cvsStoreId && <FieldError msg={errors.cvsStoreId} />}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: 確認 TypeScript 無錯誤**

```bash
pnpm check 2>&1 | grep "Checkout" | head -10
```

預期：沒有 `Checkout.tsx` 相關錯誤

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/shop/Checkout.tsx
git commit -m "feat(checkout): 電子地圖選店 UI + postMessage 監聽"
```

---

## Task 5：AdminOrders.tsx — 配送欄位 + 建立物流單按鈕

**Files:**
- Modify: `client/src/pages/admin/AdminOrders.tsx`

- [ ] **Step 1: 加入「建立物流單」mutation**

在 `deleteOrderMutation` 之後（約第 112 行）加入：

```typescript
const createLogisticsMutation = trpc.logistics.createLogisticsOrder.useMutation({
  onSuccess: (result) => {
    if (result.success) {
      toast.success(`物流單建立成功，物流編號：${result.logisticsId}`);
    } else {
      toast.error(`建立物流單失敗：${result.message}`);
    }
    refetch();
  },
  onError: (error) => { toast.error("建立物流單失敗: " + error.message); },
});
```

- [ ] **Step 2: 在 TableHead 新增「配送」欄**

找到 `<TableHead>操作</TableHead>`（約第 213 行），在它**之前**插入：

```tsx
<TableHead>配送</TableHead>
```

- [ ] **Step 3: 在 TableRow 的操作欄前新增配送資訊 cell + 建立物流單按鈕**

找到 TableBody 中 `<TableCell>` 的操作欄（有 `viewOrderDetail` 按鈕那個），在它**之前**插入配送欄 cell，並在操作欄加入「建立物流單」按鈕：

**在操作欄 `<TableCell>` 之前插入（配送欄）：**

```tsx
<TableCell>
  {(order as any).shippingMethod === "home_delivery" || !(order as any).shippingMethod ? (
    <span className="text-gray-500 text-sm">宅配</span>
  ) : (
    <div className="text-sm">
      <span className="font-medium">
        {(order as any).shippingMethod === "cvs_fami" && "全家"}
        {(order as any).shippingMethod === "cvs_unimart" && "7-11"}
        {(order as any).shippingMethod === "cvs_hilife" && "萊爾富"}
      </span>
      {(order as any).cvsStoreName && (
        <span className="text-gray-500 text-xs ml-1">{(order as any).cvsStoreName}</span>
      )}
    </div>
  )}
</TableCell>
```

**在操作欄 `<TableCell>` 的按鈕群組內，Eye 按鈕之後加入（建立物流單按鈕）：**

```tsx
{(order as any).shippingMethod && (order as any).shippingMethod !== "home_delivery" && !(order as any).logisticsId && (
  <Button
    variant="ghost"
    size="sm"
    title="建立物流單"
    onClick={() => createLogisticsMutation.mutate({ orderId: order.id })}
    disabled={createLogisticsMutation.isPending}
    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
  >
    <Truck className="h-4 w-4" />
  </Button>
)}
```

- [ ] **Step 4: 在 Dialog 詳情加入物流資訊區塊**

找到 Dialog 中 `{/* 出貨證明上傳 */}` 這行（約第 353 行），在它**之前**插入：

```tsx
{/* 物流資訊 */}
{(selectedOrder.shippingMethod && selectedOrder.shippingMethod !== "home_delivery") && (
  <div className="border-t pt-4">
    <p className="text-sm font-medium text-gray-700 mb-2">物流資訊</p>
    <div className="space-y-1.5 text-sm">
      <div>
        <span className="text-gray-500">配送方式：</span>
        {selectedOrder.shippingMethod === "cvs_fami" && "全家取貨"}
        {selectedOrder.shippingMethod === "cvs_unimart" && "7-ELEVEN 取貨"}
        {selectedOrder.shippingMethod === "cvs_hilife" && "萊爾富取貨"}
      </div>
      {selectedOrder.cvsStoreName && (
        <div>
          <span className="text-gray-500">取貨門市：</span>
          {selectedOrder.cvsStoreName}
        </div>
      )}
      {selectedOrder.cvsStoreAddress && (
        <div>
          <span className="text-gray-500">門市地址：</span>
          {selectedOrder.cvsStoreAddress}
        </div>
      )}
      {selectedOrder.logisticsId ? (
        <>
          <div>
            <span className="text-gray-500">物流編號：</span>
            <span className="font-mono">{selectedOrder.logisticsId}</span>
          </div>
          <div>
            <span className="text-gray-500">物流狀態：</span>
            {selectedOrder.logisticsStatusMsg || selectedOrder.logisticsStatus || "—"}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => createLogisticsMutation.mutate({ orderId: selectedOrder.id })}
            disabled={createLogisticsMutation.isPending}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Truck className="h-4 w-4 mr-1" />
            {createLogisticsMutation.isPending ? "建立中..." : "建立物流單"}
          </Button>
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 5: 確認 Truck icon 已 import（如未 import 請加入）**

```typescript
// AdminOrders.tsx 第 10 行，確認 Truck 已在 import 中
import { Search, Package, Eye, Truck, Trash2, Upload, Loader2 } from "lucide-react";
```

> Truck 已存在於 import，無需修改。

- [ ] **Step 6: 確認 TypeScript 無錯誤**

```bash
pnpm check 2>&1 | grep "AdminOrders" | head -10
```

預期：沒有 `AdminOrders.tsx` 相關錯誤

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/admin/AdminOrders.tsx
git commit -m "feat(admin): 訂單列表配送欄位 + 建立物流單按鈕 + 詳情物流區塊"
```

---

## Task 6：MyOrders.tsx — 物流狀態顯示

**Files:**
- Modify: `client/src/pages/shop/MyOrders.tsx`

- [ ] **Step 1: 加入 Badge import**

找到第 6 行，在現有 imports 後加入 Badge：

```typescript
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 2: 加入物流狀態對應函式**

在 `getStatusLabel` 函式後面加入：

```typescript
function getLogisticsStatusBadge(status: string | null | undefined, msg: string | null | undefined) {
  if (!status) return null;
  const arrivedCodes = ["2067", "3022", "3018"];
  const pickedCodes = ["3024", "3025"];  // 已取貨

  let variant: string;
  let label: string;

  if (pickedCodes.includes(status)) {
    variant = "bg-blue-100 text-blue-700 border-blue-300";
    label = msg || "已取貨";
  } else if (arrivedCodes.includes(status)) {
    variant = "bg-green-100 text-green-700 border-green-300";
    label = status === "2067" ? "已到店可取貨（7-11）" : "包裹已到店";
  } else if (status === "300") {
    variant = "bg-yellow-100 text-yellow-700 border-yellow-300";
    label = "物流處理中";
  } else {
    variant = "bg-gray-100 text-gray-600 border-gray-300";
    label = msg || `狀態 ${status}`;
  }

  return <Badge variant="outline" className={`text-xs ${variant}`}>{label}</Badge>;
}
```

- [ ] **Step 3: 在訂單卡片 CardContent 加入物流資訊**

找到 CardContent 中「收件人：...」的 `<p>` 標籤，在它下方加入：

```tsx
<CardContent>
  <p className="text-sm text-gray-600">
    收件人：{order.recipientName}
  </p>
  {/* 物流資訊 */}
  {(order as any).shippingMethod && (order as any).shippingMethod !== "home_delivery" && (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">
        取貨門市：
        {(order as any).shippingMethod === "cvs_fami" && "全家 "}
        {(order as any).shippingMethod === "cvs_unimart" && "7-11 "}
        {(order as any).shippingMethod === "cvs_hilife" && "萊爾富 "}
        {(order as any).cvsStoreName || ""}
      </span>
      {(order as any).logisticsId && getLogisticsStatusBadge(
        (order as any).logisticsStatus,
        (order as any).logisticsStatusMsg
      )}
    </div>
  )}
</CardContent>
```

- [ ] **Step 4: 確認 TypeScript 無錯誤**

```bash
pnpm check 2>&1 | grep "MyOrders" | head -10
```

預期：沒有 `MyOrders.tsx` 相關錯誤

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/shop/MyOrders.tsx
git commit -m "feat(my-orders): 顯示物流狀態與取貨門市"
```

---

## Task 7：OrderComplete.tsx — 超商取貨提示

**Files:**
- Modify: `client/src/pages/shop/OrderComplete.tsx`

- [ ] **Step 1: 在「訂單資訊」區塊後加入超商取貨提示**

找到 `{order && (` 的區塊（約第 72 行）中「訂單資訊」div 的結尾 `</div>` 後，在它下面加入（仍在 `{order && (...)}` 內）：

```tsx
{/* 超商取貨提示（付款成功時才顯示）*/}
{isPaid && order && (order as any).shippingMethod !== "home_delivery" && (order as any).cvsStoreName && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
    <p className="text-sm text-blue-800 font-medium mb-1">取貨通知</p>
    <p className="text-sm text-blue-700">
      您的商品將配送至
      <span className="font-semibold">
        {(order as any).shippingMethod === "cvs_fami" && " 全家 "}
        {(order as any).shippingMethod === "cvs_unimart" && " 7-ELEVEN "}
        {(order as any).shippingMethod === "cvs_hilife" && " 萊爾富 "}
        {(order as any).cvsStoreName}
      </span>
      ，請留意手機簡訊通知取貨。
    </p>
  </div>
)}
```

- [ ] **Step 2: 確認 TypeScript 無錯誤**

```bash
pnpm check 2>&1 | grep "OrderComplete" | head -10
```

預期：沒有 `OrderComplete.tsx` 相關錯誤

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/shop/OrderComplete.tsx
git commit -m "feat(order-complete): 超商取貨門市提示"
```

---

## Task 8：全專案 build 驗證與 push

**Files:** 無新修改，僅驗證

- [ ] **Step 1: 執行全專案 build**

```bash
cd "c:/Users/user/Desktop/VS CODE專案/ordersome_official_v2.0221"
pnpm build 2>&1 | tail -20
```

預期輸出包含：`✓ built in` 或 `dist/` 相關成功訊息，**無 TypeScript 或 Vite 錯誤**。

- [ ] **Step 2: 若 build 有錯誤，逐一修正後再 build**

常見錯誤處理：
- `Property 'xxx' does not exist` → 使用 `(order as any).xxx` 避免型別問題
- `Cannot find module` → 確認 import 路徑
- `Type 'xxx' is not assignable` → 確認 shippingMethod 型別宣告正確

- [ ] **Step 3: 確認所有目標檔案已 commit**

```bash
git status
```

預期：`working tree clean`（沒有未 commit 的修改）

- [ ] **Step 4: git push**

```bash
git push origin main
```

預期：成功推送，Railway 開始自動部署（約 2-3 分鐘）

---

## 自我審查清單

### Spec 覆蓋確認

| 需求項目 | 對應 Task |
|---------|---------|
| 結帳頁配送方式選擇 UI（4 個選項） | Task 3 |
| 表單狀態 shippingMethod + cvs* 欄位 | Task 1 |
| 電子地圖選店流程（window.open + form POST） | Task 4 |
| postMessage 監聽選店結果 | Task 4 |
| 已選門市顯示 + 重新選擇按鈕 | Task 4 |
| 宅配顯示地址欄位、超商隱藏地址 | Task 4 |
| 超商 cvsStoreId 必填驗證 | Task 1 |
| 超商 shippingAddress 自動帶門市地址 | Task 1 |
| 超商運費 60 元顯示 | Task 2 |
| handleSubmit 傳入物流欄位 | Task 1 |
| 後台訂單列表「配送」欄位 | Task 5 |
| 後台詳情物流資訊區塊 | Task 5 |
| 後台「建立物流單」按鈕 | Task 5 |
| 我的訂單顯示取貨門市 | Task 6 |
| 我的訂單物流狀態 Badge | Task 6 |
| 付款完成頁超商取貨提示 | Task 7 |
| pnpm build 零錯誤 + git push | Task 8 |

### 注意事項

1. **電子地圖 protectedProcedure**：`getMapParams` 需要登入，未登入時按鈕 disabled + 提示訊息已在 Task 4 處理
2. **postMessage origin 安全**：目前不驗證 origin（與生產環境一致，綠界會回調到 serverReplyURL 再轉發）
3. **運費計算雙端一致**：前端顯示邏輯（Task 2）與後端 router 邏輯已相同（cvs = 60 元，超過門檻免運）
4. **shippingAddress 後端驗證**：後端 `input.shippingAddress` 為 `z.string()`（非 optional），Task 1 的 submit handler 用門市地址填入，可正常通過後端驗證

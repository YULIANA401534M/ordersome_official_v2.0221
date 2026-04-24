# Dayone Smoke Test And Stock Plan 2026-04-24

## Scope

This round only covers Dayone routes and flows. `OrderSome / 宇聯前台` are intentionally excluded.

## Route Smoke Test

| Route | Component | Primary data/query | Checked this round | Status |
| --- | --- | --- | --- | --- |
| `/dayone` | `DayoneDashboard.tsx` | `reports.dailySummary`, `reports.inventoryAlerts`, `reports.topCustomers`, `ar.listReceivables`, `purchaseReceipt.list` | Confirmed route registration, query wiring, KPI dependency, and fixed anomaly count to use `status === 'anomaly'` instead of a missing field | Static checked |
| `/dayone/orders` | `DayoneOrders.tsx` | `orders.list`, `customers.list`, `drivers.list`, `products.list` | Confirmed create/update/delete flow wiring and admin mutation path | Static checked |
| `/dayone/customers` | `DayoneCustomersContent.tsx` | `customers.list`, `districts.list`, `customers.upsert`, `customers.delete` | Confirmed CRUD wiring and portal fields | Static checked |
| `/dayone/dispatch` | `DayoneDispatch.tsx` | `dispatch.listDispatch`, `dispatch.getDispatchDetail`, `dispatch.generateDispatch`, `dispatch.manualAddStop`, `dispatch.returnInventory` | Confirmed dispatch detail sheet wiring and completed supplement-order path | Static checked |
| `/dayone/purchase-receipts` | `DayonePurchaseReceipts.tsx` | `purchaseReceipt.list`, `purchaseReceipt.create`, `purchaseReceipt.sign`, `purchaseReceipt.markAnomaly`, `ap.listPayables`, `ap.summary` | Confirmed create/sign/anomaly/AP workspace and added anomaly reconciliation path | Static checked |
| `/dayone/ar` | `DayoneARContent.tsx` | `ar.listReceivables`, `ar.markPaid`, `ar.listDriverCashReports`, `ar.resolveAnomaly`, `ar.monthlyStatement` | Confirmed receivable/cash/monthly statement tabs and mutation wiring | Static checked |
| `/driver/*` | `DriverHome`, `DriverToday`, `DriverOrders`, `DriverOrderDetail`, `DriverWorkLog` | `driver.getMyTodayOrders`, `driver.recordCashPayment`, `driver.updateOrderStatus`, `dispatch.returnInventory`, `driver.submitWorkLog` | Confirmed route registration and main data loops; dispatch return and worklog remain coupled to latest dispatch for the day | Static checked |

## Findings From Smoke Review

### Verified this round

- `client/src/App.tsx` still registers all required Dayone and driver routes without touching chunk strategy.
- `DayoneDispatch` now supports creating a real supplement order when admin adds a temporary stop with product lines.
- `DayonePurchaseReceipts` now has an admin reconciliation step for anomaly receipts, and the reconciled receipt goes back to `pending` for re-sign.
- `DayoneDashboard` anomaly KPI now reads the actual cash-report status field.

### Not fully verified yet

- No browser-driven manual click-through was run in this round.
- No seeded end-to-end scenario was executed against live Dayone data for every route.
- Driver routes still depend on the authenticated driver account and same-day dispatch data; this was only checked statically.

## Temporary Supplement Order Flow

1. Open `/dayone/dispatch` and enter a dispatch detail sheet.
2. Use `新增停靠點`.
3. If product rows are provided, the mutation now creates:
   - one `dy_orders` supplement order linked to the dispatch date and driver
   - related `dy_order_items`
   - one `dy_dispatch_items` row pointing back to that order
4. If product rows are left empty, the system still allows a stop-only insert for operational flexibility.
5. Follow-up collection still stays on existing dispatch/AR flows.

## Purchase Receipt Reconciliation Flow

1. A pending receipt can still be marked as `anomaly`.
2. An anomaly receipt now exposes `對帳`.
3. Admin can revise reconciled item lines and leave a reconciliation note.
4. The mutation rewrites receipt items/amounts and returns the receipt to `pending`.
5. Re-signing the corrected receipt remains the gate that posts inventory and creates AP.

## Three-Stage Inventory Plan

Current safe baseline this round keeps the existing stock mutation model unchanged.

### Stage definition

- `可用`
  - Source of truth remains `dy_inventory.currentQty`
- `已派車`
  - Derived from dispatches in `printed` or `in_progress`
  - Calculated from dispatch-linked order items, not a second inventory write
- `回庫待驗`
  - Should be introduced as a separate holding state before inventory is added back to `dy_inventory`
  - Current code does not yet persist this holding bucket, so it remains a plan item

### Safe next implementation order

1. Add a derived summary query for `available / on_truck`.
2. Introduce a dedicated pending-return record instead of directly adding returned stock back into `dy_inventory`.
3. Only then split UI totals in `/dayone/inventory`.

### Risk note

Changing return stock from immediate write-back to staged holding touches dispatch closeout, driver worklog, and inventory math. That should be done in a separate focused round after confirming the data model.

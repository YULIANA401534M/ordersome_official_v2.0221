# Dayone 回庫待驗第一階段 2026-04-25

這份是補在 `docs/dayone-stock-accounting-logic-2026-04-25.md` 後面的實作落地說明，專門描述「司機剩貨回報 -> 回庫待驗 -> 管理端確認入庫」這條新主線。

## 1. 正式規則

### 1-1. 司機剩貨回報

- 司機或管理端在派車頁、司機日結頁送出剩貨時：
  - 不能直接加回 `dy_inventory`
  - 只能先寫入 `dy_pending_returns`

### 1-2. 管理端確認入庫

- 只有管理端在 `/dayone/inventory` 按下「確認入庫」後，才會：
  - 加回 `dy_inventory.currentQty`
  - 寫入 `dy_stock_movements`
  - 將 `dy_pending_returns.status` 改成 `received`

### 1-3. 防呆規則

- 同一張派車單、同一品項，累積回報數量不可超過原本出車數量
- `draft` 派車單不可送出回庫待驗
- 已確認的待驗資料不可重複確認

## 2. 資料表

### 2-1. `dy_pending_returns`

用途：
- 承接司機回報剩貨，但尚未正式入可賣庫存的中間層

關鍵欄位：
- `dispatchOrderId`
- `productId`
- `qty`
- `status`
- `source`
- `note`
- `reportedBy`
- `reportedAt`
- `receivedBy`
- `receivedAt`
- `receiveNote`

## 3. 頁面聯動

### 3-1. `/driver/worklog`

- 司機送出剩貨時，文案改成「送出回庫待驗」
- 送出成功只代表已交給管理端待驗，不代表已正式入庫

### 3-2. `/dayone/dispatch`

- 派車明細中的剩貨回報也改走同一條待驗主線
- 管理端在派車頁送出的剩貨，也一樣先進 `dy_pending_returns`

### 3-3. `/dayone/inventory`

- 新增「回庫待驗」摘要與清單
- 管理端可在此逐筆確認入庫

## 4. 已完成 / 未完成

### 已完成

- 切掉 `dispatch.returnInventory` 直接回寫 `dy_inventory` 的舊邏輯
- 建立回庫待驗資料層
- 建立管理端確認入庫動作
- 前端文案改成不再誤導成「已回庫」

### 尚未完成

- 車上庫存正式統計
- 回庫待驗批次確認
- 全 Dayone 路由逐頁人工審查
- 真實資料場景回放測試

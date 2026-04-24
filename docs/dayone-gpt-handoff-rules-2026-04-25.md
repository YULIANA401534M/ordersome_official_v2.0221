# Dayone GPT 接棒手冊 2026-04-25

這份文件是給下一輪 GPT 直接接手用的。
目標不是寫漂亮，而是確保換對話框後還能無縫接軌，不重複踩雷。

---

## 1. 工作目標

目前 Dayone 的優先順序是：

1. 先把邏輯主線做對
2. 再做逐頁審查
3. 再做人工測試
4. 最後才考慮視覺優化或高風險效能調整

禁止事項：

- 不要碰 OrderSome / 宇聯前台
- 不要做高風險 chunk / lazy route 拆包
- 不要自作主張大改視覺
- 不要只靠 build 就宣稱已驗證
- 所有新增節點都要寫回 `CLAUDE.md`
- 每輪都要跑 `npm run build`
- 完成後一定要 commit、push

---

## 2. 目前已確認的正式規則

### 2-1. 進貨

- 供應商簽名完成
  - 代表大永已確認買到這批貨
  - 要建立或更新 AP
  - 不可直接增加可賣庫存
- 管理端確認入倉
  - 才能增加可賣庫存

### 2-2. 出貨

- 派車列印或正式出車
  - 才扣可賣庫存
- 已列印或配送中的補單
  - 必須同步扣庫存
- 已完成派車
  - 不可再補站

### 2-3. 回庫

- 司機剩貨回來
  - 不可直接加回 `dy_inventory`
  - 正確規則應是先進「回庫待驗」
  - 管理端確認後才加回可賣庫存

---

## 3. 目前已完成的程式狀態

### 已完成

- `server/routers/dayone/purchaseReceipt.ts`
  - `sign` 只建 AP，不再直接加 `dy_inventory`
  - 新增 `receiveToWarehouse`
- `client/src/pages/dayone/DayonePurchaseReceipts.tsx`
  - `signed => 待入倉`
  - 新增 `warehoused => 已入倉`
  - 新增管理端確認入倉按鈕
- `server/routers/dayone/dispatch.ts`
  - 已列印或配送中的補單會同步扣庫存
  - 已完成派車禁止再補站

### 尚未完成

- `server/routers/dayone/purchase.ts`
  - 舊的 `receive` 直接入庫路已先封鎖
  - 後續若要恢復，必須改成符合「簽名建 AP、入倉才加可賣庫存」的新規則
- `server/routers/dayone/dispatch.ts`
  - `returnInventory` 仍直接回寫庫存
  - 還沒改成回庫待驗
- `/dayone/inventory`
  - 還沒有真正顯示三段式庫存
- Dayone 全路由逐頁人工審查
  - 還沒完整跑完

---

## 4. 下一輪優先順序

### P1

先做規則收斂，不要亂擴頁面：

1. 決定 `purchase.receive` 是保留、改用途、還是改成不動庫存
2. 設計 `回庫待驗` 資料層
3. 補 `/dayone/inventory` 三段式摘要

### P2

開始全面審查：

1. `/dayone`
2. `/dayone/orders`
3. `/dayone/customers`
4. `/dayone/dispatch`
5. `/dayone/purchase-receipts`
6. `/dayone/ar`
7. `/driver/*`

### P3

人工測試重點：

1. 進貨簽名 -> AP -> 待入倉 -> 入倉
2. 派車列印 -> 扣庫存 -> 補單 -> 扣庫存
3. 送達 -> AR -> 現場收現 -> 日結
4. 剩貨回報 -> 回庫待驗 -> 管理確認

---

## 5. 目前已抓到的邏輯風險

1. Dayone 現在存在兩條入庫規則
   - 已先封住 `purchase.receive`
   - 但資料模型與頁面語意仍要進一步統一到 `purchaseReceipt.sign/receiveToWarehouse`

2. AR 建立入口不只一個
   - `orders.confirmDelivery`
   - `driver.updateOrderStatus(delivered)`
   需要明確定義正式入口

3. `driver.recordCashPayment`
   - 會更新訂單 paidAmount
   - 但不一定同步更新 AR
   - 可能造成短暫不一致

4. 權限仍然太粗
   - 目前大多仍是 `super_admin / manager`
   - staff 與細粒度資料可見範圍還沒正式定義

5. 模組開關不是完整安全防線
   - 前端 `useModules()` 目前只看 moduleKey 是否存在
   - 還沒有真正依 `isEnabled` 做完整控管

---

## 6. 回答使用者時的原則

- 一律用繁體中文
- 不要用太多英文術語
- 誠實區分：
  - 已驗證
  - 尚未驗證
- 如果有高風險決策，不要硬做，要先停一下
- 不能把「有文件」說成「邏輯已完整」
- 不能把「build 過」說成「商用可上」

---

## 7. 給下一輪 GPT 的提示詞

你現在在 `ordersome_official_v2.0221` 專案，正在接手 Dayone 工作。

先做這些事，再開始改：

1. 先讀 `CLAUDE.md` 最後兩段 Dayone 紀錄
2. 再讀：
   - `docs/dayone-stock-accounting-logic-2026-04-25.md`
   - `docs/dayone-gpt-handoff-rules-2026-04-25.md`
3. 記住：
   - 不要碰 OrderSome / 宇聯前台
   - 不要做高風險 chunk / lazy route 拆包
   - 不要先改視覺
   - 每輪都要跑 `npm run build`
   - 所有新增節點都要寫回 `CLAUDE.md`
   - 完成後一定要 commit、push

Dayone 目前已確認的正式規則：

- 供應商簽名 = 採購入帳 + 建立 AP，但不是可賣庫存
- 管理端確認入倉 = 增加可賣庫存
- 派車列印 / 出車 = 扣可賣庫存
- 已列印或配送中的補單 = 同步扣庫存
- 已完成派車 = 不可補站
- 剩貨回來 = 應進回庫待驗，不能直接加可賣庫存

目前最優先處理的未完事項：

1. 收斂 `purchase.receive` 與新入庫規則的衝突
2. 設計並落地回庫待驗
3. 補 `/dayone/inventory` 三段式摘要
4. 接著做全 Dayone 路由逐頁審查與人工測試

回答使用者時不要過度自信。
如果某段還沒人工測過，就明講還沒測。
## 2026-04-25 回庫待驗第一階段補充

- `dispatch.returnInventory` 已改成先寫 `dy_pending_returns`
- `inventory.confirmPendingReturn` 已可由管理端正式確認入庫
- 新文件：
  - `docs/dayone-return-pending-phase1-2026-04-25.md`
- 下一輪優先：
  - 補車上庫存統計
  - 跑 `/dayone/*`、`/driver/*` 逐頁審查
  - 接人工測試

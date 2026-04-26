# 後台全線地圖與權限重構盤點

建立日期：2026-04-26

## 目的

這份文件把宇聯後台、來點什麼 ERP、大永 ERP、加盟主/員工/司機入口的權限邏輯先拉成一張地圖。下一階段重構時，先收斂規則，再改頁面，不要一邊改 UI 一邊猜權限。

## 現況判斷

目前權限不是完全壞掉，而是「多套規則並存」：

| 層級 | 現況 | 風險 |
|---|---|---|
| 角色 role | `super_admin`、`manager`、`franchisee`、`staff`、`store_manager`、`customer`、`driver`、`portal_customer` | 角色存在，但每個頁面/路由自行解讀 |
| 租戶 tenant | `1 = OrderSome / 宇聯`、`90004 = Dayone / 大永` | 前端和後端都有硬編碼，容易串租戶 |
| 後端守門 | `adminProcedure`、`superAdminProcedure`、`franchiseeOrAdminProcedure`、Dayone 自訂 `dyAdminProcedure`、`driverProcedure` | 守門散落各檔，錯誤訊息與可進角色不一致 |
| 前端守門 | `AdminDashboardLayout` 用 role、tenantId、permissions、module toggle 自行判斷 | 使用者看不看得到頁面，不等於 API 真的允許 |
| 模組開關 | `tenant_modules` 控制來點什麼與大永模組 | 模組 key 目前跟頁面、角色、API 沒有單一表 |
| 細權限 | `users.permissions`、`has_procurement_access`、`franchisee_feature_flags` | 權限型別自由字串，缺少統一列舉與稽核 |

## 這輪已先落地

1. 新增 `shared/access-control.ts`，集中角色、租戶、來點什麼模組、大永模組、加盟主功能旗標與基本判斷函式。
2. `server/_core/trpc.ts` 改用共用角色判斷，先收斂核心 `adminProcedure` / `superAdminProcedure` / `franchiseeOrAdminProcedure`。
3. `server/routers/admin.ts` 移除本地重複的 admin/super admin middleware，改吃核心程序與共用 `FRANCHISEE_FEATURE_KEYS`。
4. 新增 `scripts/audit-access-control.mjs`，可掃描目前權限散落點。
5. 新增 `scripts/_tidb-url.mjs` 與 `scripts/fix-linxin-store-address.mjs`，讓 TiDB URL SSL 解析與林新店地址修正可重跑。
6. 新增 `server/routers/dayone/procedures.ts`，集中 Dayone admin / super admin / driver / portal customer 守門邏輯。
7. Dayone API 已收斂 tenant guard：一般 Dayone API 只允許 `tenantId=90004`，避免宇聯與大永資料串租戶。
8. Dayone `modules.ts` 特別保留通用 core admin/superAdmin guard，因為它同時服務 OrderSome tenant module toggle 與 Dayone module toggle，不能硬鎖 `90004`。
9. 第二輪已把 OrderSome / Yulian 側重複後端 middleware 收斂：`server/routers.ts`、`ai-writer.ts`、`content.ts`、`franchiseePayment.ts`、`osProducts.ts`、`sop.ts`、`storage.ts`、`tenant.ts` 都改用 `_core/trpc.ts` 的共用 procedures。
10. `AdminDashboardLayout.tsx` 已改用 `shared/access-control.ts` 判斷 role、tenant、成本權限與 permissions，減少 sidebar 與 API 守門規則不一致。
11. 宇聯權限已收斂為 `ORDER_SOME_PERMISSION_DEFINITIONS`：使用者管理與權限管理頁會顯示每個權限聯動的後台頁面，並提供新增全部 / 刪除全部權限按鈕；後端 `admin.updateUser` / `admin.createUser` 會清洗未知權限字串，避免錯字或舊權限外溢。

## 2026-04-26 驗證狀態

- `pnpm run build` 通過，可產出 `dist`。
- `node scripts/audit-access-control.mjs` 通過執行；目前本地 middleware 定義已收斂到 `_core/trpc.ts` 與 `server/routers/dayone/procedures.ts`。
- `node scripts/audit-access-control.mjs` 可確認本輪只剩核心與 Dayone 集中守門檔定義 middleware。
- 後台權限 UI 已改用共享權限定義，但完整 audit log 尚未落地，之後仍需補「誰改了誰的權限」紀錄。

## 建議重構順序

1. 將前端 sidebar 從自行組合陣列，逐步改成吃同一份 route/permission matrix 或後端回傳的 `myAccessibleModules`。
2. 將 `has_procurement_access` 從獨立布林欄位逐步升級為正式權限或 role policy。
3. 補稽核日誌：重要權限異動要寫入 audit log。

## 稽核指令

```bash
node scripts/audit-access-control.mjs
```

## 林新店地址修正指令

先 dry run：

```bash
node scripts/fix-linxin-store-address.mjs
```

確認有找到資料後才套用：

```bash
node scripts/fix-linxin-store-address.mjs --apply
```

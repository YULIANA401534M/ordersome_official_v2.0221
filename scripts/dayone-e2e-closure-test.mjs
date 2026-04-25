import "dotenv/config";
import mysql from "mysql2/promise";

const BASE_URL = process.env.BASE_URL || "http://localhost:3012";
const TENANT_ID = 90004;
const MANAGER_EMAIL = "codex-manager@dayone.local";
const MANAGER_PASSWORD = "CodexMgr!2026";
const DRIVER_EMAIL = "codex-driver@dayone.local";
const DRIVER_PASSWORD = "CodexDrv!2026";
const SIGN_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2p6x8AAAAASUVORK5CYII=";

function dbConfig() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const url = new URL(process.env.DATABASE_URL.replace(/^mysql:\/\//, "http://"));
  return {
    host: url.hostname,
    port: Number(url.port) || 4000,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: true },
  };
}

class TrpcSession {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookie = "";
  }

  async login(email, password) {
    await this.call("auth.loginWithPassword", { email, pwd: password }, false);
    return this;
  }

  async call(path, input, requireAuth = true) {
    const res = await fetch(`${this.baseUrl}/api/trpc/${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: JSON.stringify(input),
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(",").map((part) => part.trim().split(";")[0]).join("; ");
    }

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`${path} returned non-JSON: ${text}`);
    }

    if (!res.ok || json?.error) {
      throw new Error(`${path} failed: ${text}`);
    }

    if (requireAuth && !this.cookie) {
      throw new Error(`${path} succeeded without session cookie`);
    }

    return json?.result?.data;
  }
}

function assert(condition, message, meta = {}) {
  if (!condition) {
    const error = new Error(message);
    error.meta = meta;
    throw error;
  }
}

function datePlusDays(dateStr, days) {
  const [y, m, d0] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, d0);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const now = new Date();
const today = now.toISOString().slice(0, 10);
const stamp = String(Date.now());
const tag = `E2E-${stamp}`;

const purchaseQty = 12;
const purchaseUnitPrice = 10;
const orderQty = 4;
const orderUnitPrice = 55;
const cashCollected = 100;
const returnQty = 2;

const manager = new TrpcSession(BASE_URL);
const driver = new TrpcSession(BASE_URL);
const db = await mysql.createConnection(dbConfig());

async function one(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows[0] ?? null;
}

try {
  await manager.login(MANAGER_EMAIL, MANAGER_PASSWORD);
  await driver.login(DRIVER_EMAIL, DRIVER_PASSWORD);

  const driverRow = await one(
    `SELECT d.id, u.id AS userId
     FROM dy_drivers d
     JOIN users u ON u.id = d.userId
     WHERE d.tenantId=? AND u.email=? LIMIT 1`,
    [TENANT_ID, DRIVER_EMAIL]
  );
  assert(driverRow, "Driver account is not linked to dy_drivers");

  const product = await manager.call("dayone.products.upsert", {
    tenantId: TENANT_ID,
    code: tag,
    name: `${tag}-商品`,
    unit: "箱",
    defaultPrice: purchaseUnitPrice,
    isActive: true,
  });

  const supplier = await manager.call("dayone.suppliers.upsert", {
    tenantId: TENANT_ID,
    name: `${tag}-供應商`,
    contact: "Codex E2E",
    phone: "0900000001",
    address: "E2E Supplier Address",
    bankAccount: `${tag}-BANK`,
    status: "active",
  });

  const customer = await manager.call("dayone.customers.upsert", {
    tenantId: TENANT_ID,
    name: `${tag}-客戶`,
    phone: "0900000002",
    address: "E2E Customer Address",
    paymentType: "monthly",
    creditLimit: 50000,
    status: "active",
    customerLevel: "retail",
    settlementCycle: "monthly",
    overdueDays: 30,
  });

  const receipt = await driver.call("dayone.purchaseReceipt.create", {
    tenantId: TENANT_ID,
    supplierId: Number(supplier.id),
    receiptDate: today,
    licensePlate: `COD-${stamp.slice(-4)}`,
    batchNo: tag,
    items: [
      {
        productId: Number(product.id),
        name: `${tag}-商品`,
        qty: purchaseQty,
        unitPrice: purchaseUnitPrice,
      },
    ],
  });

  const createdReceipt = await one(
    `SELECT id, status, totalQty, totalAmount FROM dy_purchase_receipts WHERE id=? AND tenantId=?`,
    [receipt.id, TENANT_ID]
  );
  assert(createdReceipt?.status === "pending", "Receipt should start as pending", { createdReceipt });

  await driver.call("dayone.purchaseReceipt.sign", {
    id: Number(receipt.id),
    tenantId: TENANT_ID,
    signatureBase64: SIGN_PNG,
  });

  const signedReceipt = await one(
    `SELECT status, supplierSignatureUrl, totalAmount, receiptDate FROM dy_purchase_receipts WHERE id=? AND tenantId=?`,
    [receipt.id, TENANT_ID]
  );
  const apAfterSign = await one(
    `SELECT id, amount, paidAmount, status, dueDate, DATE_FORMAT(dueDate, '%Y-%m-%d') AS dueDateLocal
     FROM dy_ap_records WHERE tenantId=? AND purchaseReceiptId=? LIMIT 1`,
    [TENANT_ID, receipt.id]
  );
  assert(signedReceipt?.status === "signed", "Receipt should become signed", { signedReceipt });
  assert(!!signedReceipt?.supplierSignatureUrl, "Receipt signature URL should exist");
  assert(Number(apAfterSign?.amount ?? 0) === purchaseQty * purchaseUnitPrice, "AP amount mismatch", { apAfterSign });
  assert(apAfterSign?.status === "unpaid", "AP should start unpaid", { apAfterSign });
  assert(String(apAfterSign?.dueDateLocal ?? "") === datePlusDays(today, 30), "AP due date should follow receiptDate+30", { apAfterSign });

  await manager.call("dayone.purchaseReceipt.receiveToWarehouse", {
    id: Number(receipt.id),
    tenantId: TENANT_ID,
    note: `${tag} warehouse`,
  });

  const warehousedReceipt = await one(
    `SELECT status FROM dy_purchase_receipts WHERE id=? AND tenantId=?`,
    [receipt.id, TENANT_ID]
  );
  const inventoryAfterIn = await one(
    `SELECT currentQty FROM dy_inventory WHERE tenantId=? AND productId=?`,
    [TENANT_ID, product.id]
  );
  const purchaseInMovement = await one(
    `SELECT qty, refType FROM dy_stock_movements WHERE tenantId=? AND productId=? AND refId=? AND refType='purchase_receipt_warehouse' ORDER BY createdAt DESC LIMIT 1`,
    [TENANT_ID, product.id, receipt.id]
  );
  assert(warehousedReceipt?.status === "warehoused", "Receipt should become warehoused", { warehousedReceipt });
  assert(Number(inventoryAfterIn?.currentQty ?? 0) === purchaseQty, "Inventory after warehousing mismatch", { inventoryAfterIn });
  assert(Number(purchaseInMovement?.qty ?? 0) === purchaseQty, "Purchase stock-in movement missing", { purchaseInMovement });

  const order = await manager.call("dayone.orders.create", {
    tenantId: TENANT_ID,
    customerId: Number(customer.id),
    driverId: Number(driverRow.id),
    deliveryDate: today,
    items: [
      {
        productId: Number(product.id),
        qty: orderQty,
        unitPrice: orderUnitPrice,
      },
    ],
    note: tag,
  });

  await manager.call("dayone.dispatch.generateDispatch", {
    tenantId: TENANT_ID,
    dispatchDate: today,
  });

  const dispatchItem = await one(
    `SELECT di.id, di.dispatchOrderId, di.orderId
     FROM dy_dispatch_items di
     WHERE di.tenantId=? AND di.orderId=? LIMIT 1`,
    [TENANT_ID, order.id]
  );
  assert(dispatchItem, "Dispatch item should be generated");

  const orderAfterAssign = await one(
    `SELECT status FROM dy_orders WHERE id=? AND tenantId=?`,
    [order.id, TENANT_ID]
  );
  assert(orderAfterAssign?.status === "assigned", "Order should become assigned after dispatch generation", { orderAfterAssign });

  await manager.call("dayone.dispatch.markPrinted", {
    id: Number(dispatchItem.dispatchOrderId),
    tenantId: TENANT_ID,
  });

  const dispatchAfterPrint = await one(
    `SELECT status FROM dy_dispatch_orders WHERE id=? AND tenantId=?`,
    [dispatchItem.dispatchOrderId, TENANT_ID]
  );
  const orderAfterPrint = await one(
    `SELECT status FROM dy_orders WHERE id=? AND tenantId=?`,
    [order.id, TENANT_ID]
  );
  const inventoryAfterPrint = await one(
    `SELECT currentQty FROM dy_inventory WHERE tenantId=? AND productId=?`,
    [TENANT_ID, product.id]
  );
  const dispatchOutMovement = await one(
    `SELECT qty, refType FROM dy_stock_movements
     WHERE tenantId=? AND productId=? AND refId=? AND refType='dispatch_print'
     ORDER BY createdAt DESC LIMIT 1`,
    [TENANT_ID, product.id, dispatchItem.dispatchOrderId]
  );
  assert(dispatchAfterPrint?.status === "printed", "Dispatch should become printed", { dispatchAfterPrint });
  assert(orderAfterPrint?.status === "picked", "Order should become picked after print", { orderAfterPrint });
  assert(Number(inventoryAfterPrint?.currentQty ?? 0) === purchaseQty - orderQty, "Inventory after dispatch print mismatch", { inventoryAfterPrint });
  assert(Number(dispatchOutMovement?.qty ?? 0) === orderQty, "Dispatch stock-out movement mismatch", { dispatchOutMovement });

  await driver.call("dayone.driver.recordCashPayment", {
    orderId: Number(order.id),
    tenantId: TENANT_ID,
    cashCollected,
  });

  await driver.call("dayone.driver.updateOrderStatus", {
    id: Number(order.id),
    tenantId: TENANT_ID,
    status: "delivering",
    driverNote: `${tag} delivering`,
  });

  await driver.call("dayone.driver.updateOrderStatus", {
    id: Number(order.id),
    tenantId: TENANT_ID,
    status: "delivered",
    driverNote: `${tag} delivered`,
  });

  await driver.call("dayone.dispatch.updateDispatchItem", {
    itemId: Number(dispatchItem.id),
    tenantId: TENANT_ID,
    returnBoxes: 0,
    cashCollected,
    paymentStatus: "partial",
    driverNote: `${tag} stop done`,
  });

  const arAfterDelivery = await one(
    `SELECT id, amount, paidAmount, status FROM dy_ar_records WHERE tenantId=? AND orderId=? LIMIT 1`,
    [TENANT_ID, order.id]
  );
  const orderAfterDelivery = await one(
    `SELECT status, paidAmount, paymentStatus, returnBoxes, remainBoxes FROM dy_orders WHERE id=? AND tenantId=?`,
    [order.id, TENANT_ID]
  );
  assert(orderAfterDelivery?.status === "delivered", "Order should become delivered", { orderAfterDelivery });
  assert(Number(orderAfterDelivery?.paidAmount ?? 0) === cashCollected, "Order paidAmount mismatch after delivery", { orderAfterDelivery });
  assert(orderAfterDelivery?.paymentStatus === "partial", "Order paymentStatus should be partial", { orderAfterDelivery });
  assert(Number(arAfterDelivery?.amount ?? 0) === orderQty * orderUnitPrice, "AR amount mismatch", { arAfterDelivery });
  assert(Number(arAfterDelivery?.paidAmount ?? 0) === cashCollected, "AR paidAmount mismatch", { arAfterDelivery });
  assert(arAfterDelivery?.status === "partial", "AR status should be partial", { arAfterDelivery });

  await driver.call("dayone.dispatch.returnInventory", {
    dispatchOrderId: Number(dispatchItem.dispatchOrderId),
    tenantId: TENANT_ID,
    items: [{ productId: Number(product.id), qty: returnQty }],
    note: `${tag} pending return`,
  });

  const pendingReturn = await one(
    `SELECT id, status, qty FROM dy_pending_returns
     WHERE tenantId=? AND dispatchOrderId=? AND productId=?
     ORDER BY id DESC LIMIT 1`,
    [TENANT_ID, dispatchItem.dispatchOrderId, product.id]
  );
  assert(pendingReturn?.status === "pending", "Pending return should be created", { pendingReturn });
  assert(Number(pendingReturn?.qty ?? 0) === returnQty, "Pending return qty mismatch", { pendingReturn });

  await manager.call("dayone.inventory.confirmPendingReturn", {
    tenantId: TENANT_ID,
    pendingReturnId: Number(pendingReturn.id),
    note: `${tag} return received`,
  });

  const inventoryAfterReturnConfirm = await one(
    `SELECT currentQty FROM dy_inventory WHERE tenantId=? AND productId=?`,
    [TENANT_ID, product.id]
  );
  const pendingReturnAfterConfirm = await one(
    `SELECT status FROM dy_pending_returns WHERE id=? AND tenantId=?`,
    [pendingReturn.id, TENANT_ID]
  );
  const returnInMovement = await one(
    `SELECT qty, refType FROM dy_stock_movements
     WHERE tenantId=? AND productId=? AND refId=? AND refType='dispatch_return_receive'
     ORDER BY createdAt DESC LIMIT 1`,
    [TENANT_ID, product.id, dispatchItem.dispatchOrderId]
  );
  assert(pendingReturnAfterConfirm?.status === "received", "Pending return should become received", { pendingReturnAfterConfirm });
  assert(Number(inventoryAfterReturnConfirm?.currentQty ?? 0) === purchaseQty - orderQty + returnQty, "Inventory after return confirm mismatch", { inventoryAfterReturnConfirm });
  assert(Number(returnInMovement?.qty ?? 0) === returnQty, "Return stock-in movement mismatch", { returnInMovement });

  const dispatchCompletion = await driver.call("dayone.dispatch.completeDispatch", {
    id: Number(dispatchItem.dispatchOrderId),
    tenantId: TENANT_ID,
    actualAmount: cashCollected,
    driverNote: `${tag} cash close`,
  });

  const workLog = await driver.call("dayone.driver.submitWorkLog", {
    tenantId: TENANT_ID,
    workDate: today,
    startTime: "06:00",
    endTime: "14:00",
    note: `${tag} worklog`,
  });

  const dispatchAfterComplete = await one(
    `SELECT status FROM dy_dispatch_orders WHERE id=? AND tenantId=?`,
    [dispatchItem.dispatchOrderId, TENANT_ID]
  );
  const cashReport = await one(
    `SELECT expectedAmount, actualAmount, diff, status
     FROM dy_driver_cash_reports WHERE id=? AND tenantId=?`,
    [dispatchCompletion.reportId, TENANT_ID]
  );
  assert(dispatchAfterComplete?.status === "completed", "Dispatch should become completed", { dispatchAfterComplete });
  assert(Number(cashReport?.expectedAmount ?? 0) === cashCollected, "Driver cash report expectedAmount mismatch", { cashReport });
  assert(Number(cashReport?.actualAmount ?? 0) === cashCollected, "Driver cash report actualAmount mismatch", { cashReport });
  assert(Number(cashReport?.diff ?? 999) === 0, "Driver cash report diff should be zero", { cashReport });
  assert(cashReport?.status === "normal", "Driver cash report should be normal", { cashReport });
  assert(Number(workLog?.totalOrders ?? 0) >= 1, "Work log should include delivered order", { workLog });
  assert(Number(workLog?.totalCollected ?? 0) >= cashCollected, "Work log should include collected cash", { workLog });

  await manager.call("dayone.ap.markPaid", {
    id: Number(apAfterSign.id),
    tenantId: TENANT_ID,
    paymentMethod: "transfer",
    paidAmount: purchaseQty * purchaseUnitPrice,
    adminNote: `${tag} AP settled`,
  });

  await manager.call("dayone.ar.markPaid", {
    id: Number(arAfterDelivery.id),
    tenantId: TENANT_ID,
    paymentMethod: "transfer",
    paidAmount: orderQty * orderUnitPrice - cashCollected,
    adminNote: `${tag} AR settled`,
  });

  const apAfterPaid = await one(
    `SELECT paidAmount, status FROM dy_ap_records WHERE id=? AND tenantId=?`,
    [apAfterSign.id, TENANT_ID]
  );
  const arAfterPaid = await one(
    `SELECT paidAmount, status FROM dy_ar_records WHERE id=? AND tenantId=?`,
    [arAfterDelivery.id, TENANT_ID]
  );
  const orderAfterArPaid = await one(
    `SELECT paidAmount, paymentStatus FROM dy_orders WHERE id=? AND tenantId=?`,
    [order.id, TENANT_ID]
  );
  assert(Number(apAfterPaid?.paidAmount ?? 0) === purchaseQty * purchaseUnitPrice, "AP paidAmount mismatch", { apAfterPaid });
  assert(apAfterPaid?.status === "paid", "AP should become paid", { apAfterPaid });
  assert(Number(arAfterPaid?.paidAmount ?? 0) === orderQty * orderUnitPrice, "AR paidAmount mismatch", { arAfterPaid });
  assert(arAfterPaid?.status === "paid", "AR should become paid", { arAfterPaid });
  assert(Number(orderAfterArPaid?.paidAmount ?? 0) === orderQty * orderUnitPrice, "Order paidAmount should sync from AR", {
    orderAfterArPaid,
  });
  assert(orderAfterArPaid?.paymentStatus === "paid", "Order paymentStatus should sync from AR", {
    orderAfterArPaid,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        tag,
        today,
        ids: {
          productId: Number(product.id),
          supplierId: Number(supplier.id),
          customerId: Number(customer.id),
          driverId: Number(driverRow.id),
          purchaseReceiptId: Number(receipt.id),
          orderId: Number(order.id),
          dispatchOrderId: Number(dispatchItem.dispatchOrderId),
          dispatchItemId: Number(dispatchItem.id),
          apId: Number(apAfterSign.id),
          arId: Number(arAfterDelivery.id),
          pendingReturnId: Number(pendingReturn.id),
          cashReportId: Number(dispatchCompletion.reportId),
        },
        balances: {
          inventoryAfterWarehouse: Number(inventoryAfterIn.currentQty),
          inventoryAfterPrint: Number(inventoryAfterPrint.currentQty),
          inventoryAfterReturnConfirm: Number(inventoryAfterReturnConfirm.currentQty),
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        tag,
        message: error.message,
        meta: error.meta ?? null,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} finally {
  await db.end();
}

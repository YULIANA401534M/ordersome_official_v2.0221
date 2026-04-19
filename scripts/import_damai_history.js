#!/usr/bin/env node
// scripts/import_damai_history.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const xlsx = require('xlsx');

const TENANT_ID = 1;
const BASE_DATE = '2026-03-31';
const B_SUPPLIERS = new Set(['宇聯','宇聯_週活','立璋','三洋泰','屈臣','永豐']);

function autoCategory1(name, vendor) {
  if (vendor === '御廚特產' || /特產|包裝|帽/.test(name)) return '特產';
  if (/貼紙|標籤|海報|三角架|膠帶|紙袋|牛皮紙|棉繩|標示/.test(name)) return '行銷物料';
  if (/插入|束帶|濾心|清洗|衛生|藥用|棉棒|牙籤/.test(name)) return '清潔耗材';
  if (/果|菜|肉|蛋|豆|米|海鮮|椰子汁/.test(name)) return '食材類';
  if (/醬|粉|油|醋|糯米|配料|橄欖油|辣醬|醃漬/.test(name)) return '醬粉類';
  if (/桌|椅|架|鍋|盤|餐|設|箱子|電子秤|菜架|磁鐵|文具|禮品|保溫/.test(name)) return '設備';
  if (/盤|碗|杯|碟|叉|湯|餐具|夾|桶|保鮮盒|收納/.test(name)) return '餐飲容器';
  return '其他資材';
}

function parseInventoryExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets['115.3月'] || wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const [vendor, loc, name, cost, qty] = rows[i];
    if (!name) continue;
    const cf = parseFloat(cost) || 0;
    const qf = parseFloat(qty) || 0;
    const v = String(vendor || '').trim();
    items.push({
      vendor: v, loc: String(loc || '').trim(), name: String(name).trim(),
      cost: cf, qty: qf, isB: B_SUPPLIERS.has(v),
      category1: B_SUPPLIERS.has(v) ? null : autoCategory1(String(name).trim(), v),
    });
  }
  return items;
}

function parseAccountingExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
  const priceMap = {};
  const payRaw = {};
  for (let i = 1; i < rows.length; i++) {
    const [orderDate, orderId, supplier,, itemName,,, unitPrice,, totalAmount] = rows[i];
    if (!orderId) continue;
    const key = `${orderId}||${String(itemName || '').trim()}`;
    if (unitPrice) priceMap[key] = parseFloat(unitPrice);
    let month = String(orderDate || '').substring(0, 7).replace('/', '');
    if (month.length === 6) month = month.substring(0, 4) + '-' + month.substring(4);
    const sup = String(supplier || '').trim();
    const pk = `${sup}||${month}`;
    if (totalAmount) payRaw[pk] = (payRaw[pk] || 0) + parseFloat(totalAmount);
  }
  const payables = Object.entries(payRaw)
    .filter(([k]) => {
      const sup = k.split('||')[0];
      return sup !== '宇聯' && sup !== '宇聯_配合';  // B類自配，方向應為應收非應付
    })
    .map(([k, v]) => {
      const [supplier, yearMonth] = k.split('||');
      return { supplier, yearMonth, amount: Math.round(v * 100) / 100 };
    });
  return { priceMap, payables };
}

function parseDeliveryExcel(filePath, priceMap) {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
  const orders = {};
  for (let i = 1; i < rows.length; i++) {
    const [orderId,, supplier,,, store,,,, itemName,, unit, qty, status,,,, orderDt] = rows[i];
    if (!orderId || status === '預訂取消') continue;
    const sup = String(supplier || '').trim();
    const storeS = String(store || '').replace('依單什麼-', '').trim();
    const orderDate = String(orderDt || '').substring(0, 10);
    const isB = B_SUPPLIERS.has(sup);
    const trigger = isB && orderDate >= '2026-04-01';
    const nameS = String(itemName || '').trim();
    const packCost = priceMap[`${orderId}||${nameS}`] || null;
    if (!orders[orderId]) {
      orders[orderId] = { orderId: String(orderId), orderDate, supplier: sup, store: storeS, isB, items: [] };
    }
    orders[orderId].items.push({
      name: nameS, unit: String(unit || '').trim(),
      qty: parseFloat(qty) || 0, packCost, triggerInventory: trigger,
    });
  }
  return Object.values(orders);
}

async function getConn() {
  const url = new URL(process.env.DATABASE_URL);
  return mysql.createConnection({
    host: url.hostname, port: parseInt(url.port) || 4000,
    user: url.username, password: url.password,
    database: url.pathname.slice(1).split('?')[0],
    ssl: { rejectUnauthorized: false },
  });
}

async function ensureSupplier(conn, name, isB) {
  if (!name) name = '其他';
  const [rows] = await conn.execute(
    'SELECT id FROM os_suppliers WHERE tenantId=? AND name=? LIMIT 1', [TENANT_ID, name]
  );
  if (rows.length) return rows[0].id;
  const [r] = await conn.execute(
    'INSERT INTO os_suppliers (tenantId,name,deliveryType,createdAt,updatedAt) VALUES (?,?,?,NOW(),NOW())',
    [TENANT_ID, name, isB ? 'yulian' : 'direct']
  );
  console.log(`  [新增廠商] ${name} (${isB ? 'yulian' : 'direct'})`);
  return r.insertId;
}

async function getOrCreateProduct(conn, name, vendor, unit, cost, category1) {
  let [rows] = await conn.execute(
    'SELECT id FROM os_products WHERE tenantId=? AND name=? LIMIT 1', [TENANT_ID, name]
  );
  if (rows.length) return { id: rows[0].id, created: false };
  try {
    [rows] = await conn.execute(
      'SELECT id FROM os_products WHERE tenantId=? AND JSON_CONTAINS(aliases,?) LIMIT 1',
      [TENANT_ID, JSON.stringify(name)]
    );
    if (rows.length) return { id: rows[0].id, created: false };
  } catch (e) {}
  const cat1 = category1 || autoCategory1(name, vendor);
  const [r] = await conn.execute(
    'INSERT INTO os_products (tenantId,name,supplierName,unit,packCost,category1,aliases,needsReview,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,1,NOW(),NOW())',
    [TENANT_ID, name, vendor, unit || '件', cost || 0, cat1, JSON.stringify([])]
  );
  return { id: r.insertId, created: true };
}

async function stage1(conn, inventoryData) {
  console.log(`\n─── 階段一：庫存基準點（3/31）共 ${inventoryData.length} 筆 ───`);
  let created = 0, updated = 0, newProd = 0, zeroQty = 0;
  for (const it of inventoryData) {
    await ensureSupplier(conn, it.vendor, it.isB);
    const { id: productId, created: isNew } = await getOrCreateProduct(
      conn, it.name, it.vendor, null, it.cost, it.category1
    );
    if (isNew) newProd++;
    if (it.qty === 0) zeroQty++;
    const [ex] = await conn.execute(
      'SELECT id FROM os_inventory WHERE tenantId=? AND productId=? LIMIT 1', [TENANT_ID, productId]
    );
    if (ex.length) {
      await conn.execute(
        'UPDATE os_inventory SET currentQty=?,unitCost=?,warehouseLocation=?,updatedAt=NOW() WHERE id=?',
        [it.qty, it.cost, it.loc || null, ex[0].id]
      );
      await conn.execute(
        "INSERT INTO os_inventory_logs (tenantId,productId,inventoryId,type,qty,reason,operatedAt,createdAt) VALUES (?,?,?,'count',?,'3/31盤點基準點匯入（更新）',?,NOW())",
        [TENANT_ID, productId, ex[0].id, it.qty, BASE_DATE]
      );
      updated++;
    } else {
      const [r] = await conn.execute(
        'INSERT INTO os_inventory (tenantId,productId,currentQty,unitCost,warehouseLocation,safetyQty,createdAt,updatedAt) VALUES (?,?,?,?,?,0,NOW(),NOW())',
        [TENANT_ID, productId, it.qty, it.cost, it.loc || null]
      );
      await conn.execute(
        "INSERT INTO os_inventory_logs (tenantId,productId,inventoryId,type,qty,reason,operatedAt,createdAt) VALUES (?,?,?,'count',?,'3/31盤點基準點匯入',?,NOW())",
        [TENANT_ID, productId, r.insertId, it.qty, BASE_DATE]
      );
      created++;
    }
  }
  console.log(`  新建=${created} 更新=${updated} 新品項=${newProd} 零庫存=${zeroQty}`);
  return { created, updated, newProd, zeroQty };
}

async function stage2(conn, orders) {
  console.log(`\n─── 階段二：歷史叫貨單（${orders.length}張）───`);
  let inserted = 0, skipped = 0, itemsInserted = 0, invTriggered = 0;
  for (const order of orders) {
    const [ex] = await conn.execute(
      'SELECT id FROM os_procurement_orders WHERE tenantId=? AND externalOrderId=? LIMIT 1',
      [TENANT_ID, order.orderId]
    );
    if (ex.length) { skipped++; continue; }
    const supplierId = await ensureSupplier(conn, order.supplier, order.isB);
    const [storeRows] = await conn.execute(
      "SELECT id FROM os_stores WHERE tenantId=? AND (name=? OR name=CONCAT('依單什麼-',?)) LIMIT 1",
      [TENANT_ID, order.store, order.store]
    );
    const storeId = storeRows.length ? storeRows[0].id : null;
    const [r] = await conn.execute(
      "INSERT INTO os_procurement_orders (tenantId,supplierId,supplierName,storeId,storeName,status,sourceType,externalOrderId,orderDate,createdAt,updatedAt) VALUES (?,?,?,?,?,'received','damai_import',?,?,NOW(),NOW())",
      [TENANT_ID, supplierId, order.supplier, storeId, order.store, order.orderId, order.orderDate]
    );
    inserted++;
    for (const item of order.items) {
      if (!item.name) continue;
      const { id: productId } = await getOrCreateProduct(
        conn, item.name, order.supplier, item.unit, item.packCost, null
      );
      await conn.execute(
        'INSERT INTO os_procurement_items (tenantId,procurementOrderId,productId,productName,unit,qty,packCost,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,NOW(),NOW())',
        [TENANT_ID, r.insertId, productId, item.name, item.unit, item.qty, item.packCost || 0]
      );
      itemsInserted++;
      if (item.triggerInventory) {
        const [inv] = await conn.execute(
          'SELECT id,currentQty FROM os_inventory WHERE tenantId=? AND productId=? LIMIT 1',
          [TENANT_ID, productId]
        );
        if (inv.length) {
          await conn.execute(
            'UPDATE os_inventory SET currentQty=?,updatedAt=NOW() WHERE id=?',
            [inv[0].currentQty + item.qty, inv[0].id]
          );
          await conn.execute(
            "INSERT INTO os_inventory_logs (tenantId,productId,inventoryId,type,qty,relatedOrderId,reason,operatedAt,createdAt) VALUES (?,?,?,'in',?,?,'大麥歷史叫貨匯入',?,NOW())",
            [TENANT_ID, productId, inv[0].id, item.qty, r.insertId, order.orderDate]
          );
          invTriggered++;
        }
      }
    }
  }
  console.log(`  新增=${inserted} 跳過=${skipped} 品項=${itemsInserted} 庫存觸發=${invTriggered}`);
  return { inserted, skipped, itemsInserted, invTriggered };
}

async function stage3(conn, payables) {
  console.log(`\n─── 階段三：應付帳款（${payables.length}筆）───`);
  let inserted = 0, skipped = 0;
  for (const p of payables) {
    const [ex] = await conn.execute(
      "SELECT id FROM os_payables WHERE tenantId=? AND supplierName=? AND yearMonth=? AND sourceType='damai_import' LIMIT 1",
      [TENANT_ID, p.supplier, p.yearMonth]
    );
    if (ex.length) { skipped++; continue; }
    const [sr] = await conn.execute(
      'SELECT id FROM os_suppliers WHERE tenantId=? AND name=? LIMIT 1', [TENANT_ID, p.supplier]
    );
    await conn.execute(
      "INSERT INTO os_payables (tenantId,supplierId,supplierName,month,yearMonth,totalAmount,paidAmount,status,sourceType,createdAt,updatedAt) VALUES (?,?,?,?,?,?,0,'unpaid','damai_import',NOW(),NOW())",
      [TENANT_ID, sr.length ? sr[0].id : null, p.supplier, p.yearMonth, p.yearMonth, p.amount]
    );
    inserted++;
  }
  console.log(`  新增=${inserted} 跳過=${skipped}`);
  return { inserted, skipped };
}

async function main() {
  const [,, deliveryPath, accountingPath, inventoryPath] = process.argv;
  if (!deliveryPath || !accountingPath || !inventoryPath) {
    console.error('用法：node scripts/import_damai_history.js <出貨報表> <對帳報表> <庫存統計表>');
    process.exit(1);
  }
  console.log('解析 Excel 中...');
  const inventoryData = parseInventoryExcel(inventoryPath);
  const { priceMap, payables } = parseAccountingExcel(accountingPath);
  const orders = parseDeliveryExcel(deliveryPath, priceMap);
  console.log(`解析完成：庫存=${inventoryData.length}筆 訂單=${orders.length}張 應付=${payables.length}筆`);

  const conn = await getConn();
  try {
    const r1 = await stage1(conn, inventoryData);
    const r2 = await stage2(conn, orders);
    const r3 = await stage3(conn, payables);
    console.log('\n══════ 驗證報告 ══════');
    console.log(`階段一：新建=${r1.created} 更新=${r1.updated} 新品項=${r1.newProd} 零庫存=${r1.zeroQty}`);
    console.log(`階段二：新增=${r2.inserted} 跳過=${r2.skipped} 品項=${r2.itemsInserted} 庫存觸發=${r2.invTriggered}`);
    console.log(`階段三：新增=${r3.inserted} 跳過=${r3.skipped}`);
  } finally {
    await conn.end();
  }
}

main().catch(e => { console.error('失敗：', e.message, e.stack); process.exit(1); });

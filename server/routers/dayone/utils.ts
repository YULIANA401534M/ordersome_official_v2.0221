export function calcDueDate(
  deliveryDate: string,
  settlementCycle?: string | null,
  overdueDays?: number | null
): string {
  const date = new Date(deliveryDate);
  if (settlementCycle === "weekly") {
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }
  if (settlementCycle === "monthly") {
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    monthEnd.setDate(monthEnd.getDate() + Number(overdueDays ?? 5));
    return monthEnd.toISOString().slice(0, 10);
  }
  return deliveryDate;
}

// 台灣當前日期 YYYY-MM-DD（UTC+8）
export function todayTW(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function upsertArRecord(
  client: any,
  payload: {
    tenantId: number;
    orderId: number;
    customerId: number;
    amount: number;
    paidAmount: number;
    dueDate: string;
  }
) {
  const amount = Number(payload.amount ?? 0);
  const paidAmount = Number(payload.paidAmount ?? 0);
  const status =
    paidAmount >= amount ? "paid" : paidAmount > 0 ? "partial" : "unpaid";

  const [existingRows] = await client.execute(
    `SELECT id FROM dy_ar_records WHERE tenantId=? AND orderId=? LIMIT 1`,
    [payload.tenantId, payload.orderId]
  );
  const existing = (existingRows as any[])[0];

  if (existing) {
    await client.execute(
      `UPDATE dy_ar_records
       SET amount=?, paidAmount=?, status=?, dueDate=?,
           paymentMethod=IF(? > 0, 'cash', paymentMethod),
           paidAt=CASE WHEN ? >= ? THEN NOW() ELSE paidAt END,
           updatedAt=NOW()
       WHERE id=? AND tenantId=?`,
      [amount, paidAmount, status, payload.dueDate,
       paidAmount, paidAmount, amount,
       existing.id, payload.tenantId]
    );
    return existing.id as number;
  }

  const [result] = await client.execute(
    `INSERT INTO dy_ar_records
     (tenantId, orderId, customerId, amount, paidAmount, status, dueDate,
      paymentMethod, paidAt, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,
       IF(? > 0, 'cash', NULL),
       CASE WHEN ? >= ? THEN NOW() ELSE NULL END,
       NOW(), NOW())`,
    [payload.tenantId, payload.orderId, payload.customerId,
     amount, paidAmount, status, payload.dueDate,
     paidAmount, paidAmount, amount]
  );
  return (result as any).insertId as number;
}

import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

export default function DeliveryNote() {
  const [, params] = useRoute("/dayone/orders/:orderId/delivery-note");
  const orderId = Number(params?.orderId);

  const { data: order, isLoading } = trpc.dayone.orders.getWithItems.useQuery({ orderId });

  if (isLoading) return <div style={{ padding: 32, textAlign: "center" }}>載入中...</div>;
  if (!order) return <div style={{ padding: 32, textAlign: "center" }}>找不到訂單</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "serif" }}>
      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } }`}</style>

      <div className="no-print" style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button onClick={() => window.print()} style={{ padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
          列印派車單
        </button>
        <button onClick={() => window.history.back()} style={{ padding: "8px 20px", background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
          返回
        </button>
      </div>

      <div style={{ border: "2px solid #000", padding: 20 }}>
        <h2 style={{ textAlign: "center", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>出貨單</h2>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>訂購人：<strong>{order.customerName}</strong></div>
          <div>單號：<strong>{order.orderNo}</strong></div>
          <div>日期：<strong>{new Date(order.deliveryDate).toLocaleDateString("zh-TW")}</strong></div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "left" }}>品名</th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>數量</th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>單價</th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item: any) => (
              <tr key={item.id}>
                <td style={{ border: "1px solid #000", padding: "6px 8px" }}>{item.productName}</td>
                <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>{item.qty}</td>
                <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>${Number(item.unitPrice).toLocaleString()}</td>
                <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>${Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 24, marginBottom: 16, fontSize: 14 }}>
          <span>前箱：{order.prevBoxes}</span>
          <span>入箱：{order.inBoxes}</span>
          <span>回箱：{order.returnBoxes}</span>
          <span>餘箱：{order.remainBoxes}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #000", paddingTop: 12 }}>
          <div style={{ fontSize: 16 }}>
            總金額：<strong>${Number(order.totalAmount).toLocaleString()}</strong>
          </div>
          <div style={{ fontSize: 14, color: order.paymentStatus === "paid" ? "#16a34a" : "#dc2626" }}>
            {order.paymentStatus === "paid" ? "✓ 已收款" : `未收款：$${Number(order.totalAmount - order.paidAmount).toLocaleString()}`}
          </div>
        </div>

        {order.signatureUrl && (
          <div style={{ marginTop: 16, borderTop: "1px solid #ccc", paddingTop: 12 }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>客戶簽名：</p>
            <img src={order.signatureUrl} alt="客戶簽名" style={{ maxHeight: 80, border: "1px solid #e5e7eb" }} />
          </div>
        )}

        <div style={{ marginTop: 24, borderTop: "1px solid #ccc", paddingTop: 12 }}>
          <p style={{ fontSize: 12, color: "#6b7280" }}>客戶簽名欄：___________________________</p>
        </div>
      </div>
    </div>
  );
}

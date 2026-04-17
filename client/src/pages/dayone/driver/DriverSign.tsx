import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function DriverSign() {
  const sigRef = useRef<SignatureCanvas>(null);
  const [, navigate] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [signerName, setSignerName] = useState("");

  const params = new URLSearchParams(window.location.search);
  const orderId = Number(params.get("orderId"));

  const uploadSignature = trpc.dayone.driver.uploadSignature.useMutation({
    onSuccess: () => {
      alert("簽收完成！");
      navigate(`/driver/order/${orderId}`);
    },
    onError: (err) => {
      alert("上傳失敗：" + err.message);
      setUploading(false);
    },
  });

  function handleSubmit() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("請先簽名");
      return;
    }
    setUploading(true);
    const base64 = sigRef.current.toDataURL("image/png");
    uploadSignature.mutate({
      orderId,
      tenantId: 90004,
      imageBase64: base64,
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ height: 56, background: "#16a34a", color: "#fff", display: "flex", alignItems: "center", padding: "0 16px" }}>
        <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", marginRight: 12 }}>←</button>
        <span style={{ fontSize: 18, fontWeight: 600 }}>客戶簽收</span>
      </div>

      <div style={{ padding: 16 }}>
        <p style={{ color: "#6b7280", marginBottom: 8, fontSize: 14 }}>簽名人姓名（可選）</p>
        <input
          value={signerName}
          onChange={e => setSignerName(e.target.value)}
          placeholder="請輸入客戶姓名"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 16, marginBottom: 16 }}
        />
        <p style={{ color: "#6b7280", marginBottom: 8, fontSize: 14 }}>請在下方簽名確認收貨：</p>
      </div>

      <div style={{ flex: 1, margin: "0 16px", border: "2px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{ style: { width: "100%", height: "calc(100vh - 280px)", display: "block" } }}
          backgroundColor="#fff"
        />
      </div>

      <div style={{ padding: 16, display: "flex", gap: 12 }}>
        <button
          onClick={() => sigRef.current?.clear()}
          style={{ flex: 1, padding: "14px 0", background: "#f3f4f6", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer" }}
        >
          清除重簽
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading}
          style={{ flex: 2, padding: "14px 0", background: uploading ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}
        >
          {uploading ? "上傳中..." : "確認簽收"}
        </button>
      </div>
    </div>
  );
}

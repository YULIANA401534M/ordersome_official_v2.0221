import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Wrench, Plus, Camera, Loader2, X,
  AlertTriangle, Clock, CheckCircle, AlertCircle, MapPin, User, ZoomIn
} from "lucide-react";

const EQUIPMENT_CATEGORIES = [
  "冷藏設備", "冷凍設備", "烹飪設備", "POS 系統", "飲料機台",
  "清潔設備", "空調設備", "電力設備", "其他"
];

const URGENCY_CONFIG = {
  low:      { label: "低（可排程）",   color: "var(--os-text-3)",  bg: "var(--os-surface-2)",  icon: Clock },
  medium:   { label: "中（今日處理）", color: "var(--os-warning)", bg: "var(--os-warning-bg)", icon: AlertCircle },
  high:     { label: "高（盡快處理）", color: "var(--os-amber)",   bg: "var(--os-amber-soft)", icon: AlertTriangle },
  critical: { label: "緊急（立即）",   color: "var(--os-danger)",  bg: "var(--os-danger-bg)",  icon: AlertTriangle },
};

const STATUS_CONFIG = {
  pending:     { label: "待處理", color: "var(--os-warning)", bg: "var(--os-warning-bg)" },
  in_progress: { label: "處理中", color: "var(--os-info)",    bg: "var(--os-info-bg)"    },
  resolved:    { label: "已解決", color: "var(--os-success)", bg: "var(--os-success-bg)" },
  cancelled:   { label: "已取消", color: "var(--os-text-3)",  bg: "var(--os-surface-2)"  },
};

const inputSt: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1px solid var(--os-border)",
  borderRadius: 10, fontSize: 14, background: "var(--os-surface)",
  color: "var(--os-text-1)", outline: "none",
};
const labelSt: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", display: "block", marginBottom: 8,
};

export default function EquipmentRepairs() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";

  const [showForm, setShowForm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<number>(0);
  const [equipmentName, setEquipmentName] = useState("");
  const [category, setCategory] = useState("其他");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [issueDescription, setIssueDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: stores = [] } = trpc.store.list.useQuery();
  const { data: repairs = [], refetch } = trpc.sop.getRepairs.useQuery();

  const createRepair = trpc.sop.createRepair.useMutation({
    onSuccess: () => {
      toast.success("報修申請已送出！");
      setShowForm(false);
      setEquipmentName("");
      setIssueDescription("");
      setImageUrl("");
      setCategory("其他");
      setUrgency("medium");
      setStoreId(0);
      refetch();
    },
    onError: (err) => toast.error("送出失敗：" + err.message),
  });

  const updateRepairStatus = trpc.sop.updateRepairStatus.useMutation({
    onSuccess: () => { toast.success("狀態已更新"); refetch(); },
  });

  const uploadImage = trpc.storage.uploadImage.useMutation({
    onSuccess: (data) => { setImageUrl(data.url); toast.success("圖片上傳成功！"); setIsUploadingImage(false); },
    onError: (err) => { toast.error("圖片上傳失敗：" + err.message); setIsUploadingImage(false); },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("圖片不能超過 5MB"); return; }
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      // 加 repair/ 前綴讓 storage router 存到 repairs/ 資料夾
      uploadImage.mutate({ fileName: `repair/${file.name}`, fileData: ev.target?.result as string, contentType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!storeId) { toast.error("請選擇門市"); return; }
    if (!equipmentName.trim()) { toast.error("請填寫設備名稱"); return; }
    if (!issueDescription.trim()) { toast.error("請填寫故障說明"); return; }
    const selectedStore = stores.find((s) => s.id === storeId);
    createRepair.mutate({ storeId, equipmentName, category, urgency, issueDescription, imageUrl: imageUrl || undefined, storeName: selectedStore?.name });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--os-bg)", position: "relative" }}>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightboxUrl(null)}
        >
          <button
            style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            onClick={() => setLightboxUrl(null)}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
          <img src={lightboxUrl} alt="報修照片" style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 12 }} />
        </div>
      )}

      <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <BackButton className="-ml-2" />
          <Wrench style={{ width: 20, height: 20, color: "var(--os-amber)" }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>設備報修</h1>
          {isManager && repairs.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--os-text-3)" }}>
              共 {repairs.length} 筆 ／ 待處理 {repairs.filter((r: any) => r.status === "pending").length} 筆
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 112px" }}>
        {repairs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <Wrench style={{ width: 44, height: 44, color: "var(--os-text-3)", margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-2)", margin: 0 }}>目前沒有報修記錄</p>
            <p style={{ fontSize: 12, color: "var(--os-text-3)", marginTop: 4 }}>點擊右下角 ＋ 按鈕新增報修申請</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(repairs as any[]).map((repair) => {
              const urgencyConf = URGENCY_CONFIG[repair.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.medium;
              const statusConf = STATUS_CONFIG[repair.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
              const UrgencyIcon = urgencyConf.icon;
              return (
                <div key={repair.id}
                  style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 16 }}>

                  {/* 頂部：緊急度 + 類別 + 狀態 */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: urgencyConf.color, background: urgencyConf.bg, display: "flex", alignItems: "center", gap: 4 }}>
                        <UrgencyIcon style={{ width: 11, height: 11 }} />
                        {urgencyConf.label}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, color: "var(--os-text-3)", background: "var(--os-surface-2)" }}>
                        {repair.category ?? "其他"}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, flexShrink: 0, color: statusConf.color, background: statusConf.bg }}>
                      {statusConf.label}
                    </span>
                  </div>

                  {/* 設備名稱 */}
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--os-text-1)", margin: "0 0 6px" }}>{repair.equipmentName}</p>

                  {/* 故障描述 */}
                  <p style={{ fontSize: 13, color: "var(--os-text-2)", margin: "0 0 10px", lineHeight: 1.5 }}>{repair.issueDescription}</p>

                  {/* 門市 + 報修人（管理員才顯示） */}
                  {isManager && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                      {repair.storeName && (
                        <span style={{ fontSize: 12, color: "var(--os-text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin style={{ width: 12, height: 12 }} />
                          {repair.storeName}
                        </span>
                      )}
                      {repair.reporterName && (
                        <span style={{ fontSize: 12, color: "var(--os-text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                          <User style={{ width: 12, height: 12 }} />
                          {repair.reporterName}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "var(--os-text-3)" }}>
                        {new Date(repair.createdAt).toLocaleString("zh-TW")}
                      </span>
                    </div>
                  )}

                  {/* 非管理員只顯示時間 */}
                  {!isManager && (
                    <p style={{ fontSize: 11, color: "var(--os-text-3)", margin: "0 0 10px" }}>
                      {new Date(repair.createdAt).toLocaleString("zh-TW")}
                    </p>
                  )}

                  {/* 照片（可點開放大） */}
                  {repair.imageUrl && (
                    <div style={{ position: "relative", marginBottom: 10, cursor: "pointer" }} onClick={() => setLightboxUrl(repair.imageUrl)}>
                      <img src={repair.imageUrl} alt="報修圖片" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10 }} />
                      <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.45)", borderRadius: 6, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 11 }}>
                        <ZoomIn style={{ width: 12, height: 12 }} />
                        點擊放大
                      </div>
                    </div>
                  )}

                  {/* 管理員操作按鈕 */}
                  {isManager && repair.status !== "resolved" && repair.status !== "cancelled" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {repair.status === "pending" && (
                        <button onClick={() => updateRepairStatus.mutate({ id: repair.id, status: "in_progress" })}
                          style={{ flex: 1, padding: "8px 0", border: "1px solid var(--os-info-bg)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-info)", fontSize: 13, cursor: "pointer" }}>
                          開始處理
                        </button>
                      )}
                      {repair.status === "in_progress" && (
                        <button onClick={() => updateRepairStatus.mutate({ id: repair.id, status: "resolved" })}
                          style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: "var(--os-success)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <CheckCircle style={{ width: 14, height: 14 }} />標記已解決
                        </button>
                      )}
                      <button onClick={() => updateRepairStatus.mutate({ id: repair.id, status: "cancelled" })}
                        style={{ padding: "8px 16px", border: "1px solid var(--os-border)", borderRadius: 8, background: "var(--os-surface)", color: "var(--os-text-3)", fontSize: 13, cursor: "pointer" }}>
                        取消
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB 按鈕 */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          style={{ position: "fixed", bottom: 24, right: 24, width: 60, height: 60, background: "var(--os-amber)", color: "#fff", borderRadius: "50%", border: "none", boxShadow: "0 4px 20px oklch(0.75 0.18 70 / 0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 20, transition: "background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--os-amber-hover)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--os-amber)"}>
          <Plus style={{ width: 28, height: 28 }} />
        </button>
      )}

      {/* 報修表單 Bottom Sheet */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowForm(false)} />
          <div style={{ position: "relative", background: "var(--os-surface)", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, background: "var(--os-border)", borderRadius: 99 }} />
            </div>
            <div style={{ padding: "0 20px 40px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>新增報修申請</h2>
                <button onClick={() => setShowForm(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-3)" }}>
                  <X style={{ width: 22, height: 22 }} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelSt}>門市 *</label>
                  <Select value={storeId ? storeId.toString() : "__none__"} onValueChange={(v) => setStoreId(v === "__none__" ? 0 : Number(v))}>
                    <SelectTrigger style={{ height: 52, fontSize: 14 }}>
                      <SelectValue placeholder="選擇所在門市" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" disabled>選擇所在門市</SelectItem>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label style={labelSt}>設備名稱 *</label>
                  <input value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="例：烤箱、冰箱、收銀機..." style={{ ...inputSt, height: 52 }} />
                </div>

                <div>
                  <label style={labelSt}>設備類別 *</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger style={{ height: 52, fontSize: 14 }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label style={labelSt}>緊急程度 *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(Object.entries(URGENCY_CONFIG) as [keyof typeof URGENCY_CONFIG, typeof URGENCY_CONFIG[keyof typeof URGENCY_CONFIG]][]).map(([key, conf]) => (
                      <button key={key} onClick={() => setUrgency(key)}
                        style={{ padding: "10px 12px", borderRadius: 10, border: `2px solid ${urgency === key ? conf.color : "var(--os-border)"}`, background: urgency === key ? conf.bg : "var(--os-surface)", color: urgency === key ? conf.color : "var(--os-text-2)", fontSize: 13, fontWeight: urgency === key ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                        {conf.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelSt}>故障說明 *</label>
                  <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="請詳細描述設備故障情況..."
                    style={{ ...inputSt, minHeight: 100, resize: "none" }} />
                </div>

                <div>
                  <label style={labelSt}>現場照片（選填）</label>
                  {imageUrl ? (
                    <div style={{ position: "relative" }}>
                      <img src={imageUrl} alt="報修照片" style={{ width: "100%", height: 192, objectFit: "cover", borderRadius: 12 }} />
                      <button onClick={() => setImageUrl("")}
                        style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 128, border: "2px dashed var(--os-border)", borderRadius: 12, cursor: isUploadingImage ? "default" : "pointer" }}>
                      {isUploadingImage ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--os-amber)" }}>
                          <Loader2 style={{ width: 22, height: 22 }} className="animate-spin" />
                          <span style={{ fontSize: 13 }}>上傳中...</span>
                        </div>
                      ) : (
                        <>
                          <Camera style={{ width: 28, height: 28, color: "var(--os-text-3)", marginBottom: 8 }} />
                          <span style={{ fontSize: 13, color: "var(--os-text-3)" }}>拍照或選擇圖片（最大 5MB）</span>
                          <span style={{ fontSize: 11, color: "var(--os-text-3)", marginTop: 4, opacity: 0.7 }}>支援 JPG、PNG、HEIC</span>
                        </>
                      )}
                      <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleImageUpload} disabled={isUploadingImage} />
                    </label>
                  )}
                </div>

                <button onClick={handleSubmit} disabled={createRepair.isPending}
                  style={{ width: "100%", height: 52, border: "none", borderRadius: 12, background: "var(--os-amber)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: createRepair.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: createRepair.isPending ? 0.7 : 1 }}>
                  {createRepair.isPending
                    ? <Loader2 style={{ width: 22, height: 22 }} className="animate-spin" />
                    : <Wrench style={{ width: 22, height: 22 }} />}
                  送出報修申請
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

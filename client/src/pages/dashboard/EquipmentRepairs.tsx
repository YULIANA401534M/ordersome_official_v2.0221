import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Wrench, Plus, Camera, Loader2, X,
  AlertTriangle, Clock, CheckCircle, AlertCircle
} from "lucide-react";

const EQUIPMENT_CATEGORIES = [
  "冷藏設備", "冷凍設備", "烹飪設備", "POS 系統", "飲料機台",
  "清潔設備", "空調設備", "電力設備", "其他"
];

const URGENCY_CONFIG = {
  low: { label: "低（可排程）", color: "bg-gray-100 text-gray-700", icon: Clock },
  medium: { label: "中（今日處理）", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  high: { label: "高（盡快處理）", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  critical: { label: "緊急（立即處理）", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const STATUS_CONFIG = {
  pending: { label: "待處理", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "處理中", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "已解決", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-600" },
};

export default function EquipmentRepairs() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";

  const [showForm, setShowForm] = useState(false);
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
      toast.success("報修申請已送出！Make 自動化已觸發通知。");
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
    onSuccess: () => {
      toast.success("狀態已更新");
      refetch();
    },
  });

  const uploadImage = trpc.storage.uploadImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.url);
      toast.success("圖片上傳成功！");
      setIsUploadingImage(false);
    },
    onError: (err) => {
      toast.error("圖片上傳失敗：" + err.message);
      setIsUploadingImage(false);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片不能超過 5MB");
      return;
    }
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      uploadImage.mutate({ fileName: file.name, fileData: base64, contentType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!storeId) { toast.error("請選擇門市"); return; }
    if (!equipmentName.trim()) { toast.error("請填寫設備名稱"); return; }
    if (!issueDescription.trim()) { toast.error("請填寫故障說明"); return; }
    const selectedStore = stores.find((s) => s.id === storeId);
    createRepair.mutate({
      storeId,
      equipmentName,
      category,
      urgency,
      issueDescription,
      imageUrl: imageUrl || undefined,
      storeName: selectedStore?.name,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Wrench className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900">設備報修</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
        {repairs.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">目前沒有報修記錄</p>
            <p className="text-gray-400 text-sm mt-1">點擊右下角 ＋ 按鈕新增報修申請</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repairs.map((repair) => {
              const urgencyConf = URGENCY_CONFIG[repair.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.medium;
              const statusConf = STATUS_CONFIG[repair.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
              const UrgencyIcon = urgencyConf.icon;
              return (
                <div key={repair.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyConf.color} flex items-center gap-1`}>
                          <UrgencyIcon className="w-3 h-3" />
                          {urgencyConf.label}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {repair.category ?? "其他"}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">{repair.equipmentName}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{repair.issueDescription}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(repair.createdAt).toLocaleString("zh-TW")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusConf.color}`}>
                      {statusConf.label}
                    </span>
                  </div>

                  {repair.imageUrl && (
                    <img src={repair.imageUrl} alt="報修圖片" className="w-full h-40 object-cover rounded-xl mb-2" />
                  )}

                  {isManager && repair.status !== "resolved" && repair.status !== "cancelled" && (
                    <div className="flex gap-2 mt-2">
                      {repair.status === "pending" && (
                        <Button size="sm" variant="outline" className="flex-1 text-blue-600 border-blue-200"
                          onClick={() => updateRepairStatus.mutate({ id: repair.id, status: "in_progress" })}>
                          開始處理
                        </Button>
                      )}
                      {repair.status === "in_progress" && (
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => updateRepairStatus.mutate({ id: repair.id, status: "resolved" })}>
                          <CheckCircle className="w-4 h-4 mr-1" />標記已解決
                        </Button>
                      )}
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
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 z-20"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* 報修表單 Bottom Sheet */}
      {showForm && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-5 pb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">➕ 新增報修申請</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 門市 */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">門市 *</Label>
                  <Select value={storeId.toString()} onValueChange={(v) => setStoreId(Number(v))}>
                    <SelectTrigger className="h-14 text-base">
                      <SelectValue placeholder="選擇所在門市" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()} className="text-base py-3">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 設備名稱 */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">設備名稱 *</Label>
                  <input
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="例：烤箱、冰箱、收銀機..."
                    className="w-full h-14 px-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                  />
                </div>

                {/* 設備類別 */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">設備類別 *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-14 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-base py-3">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 緊急程度 */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">緊急程度 *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(URGENCY_CONFIG) as [keyof typeof URGENCY_CONFIG, typeof URGENCY_CONFIG[keyof typeof URGENCY_CONFIG]][]).map(([key, conf]) => (
                      <button key={key} onClick={() => setUrgency(key)}
                        className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${urgency === key ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                        {conf.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 故障說明 */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">故障說明 *</Label>
                  <Textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="請詳細描述設備故障情況..."
                    className="min-h-[100px] text-base"
                  />
                </div>

                {/* 拍照上傳 */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">現場照片（選填）</Label>
                  {imageUrl ? (
                    <div className="relative">
                      <img src={imageUrl} alt="報修照片" className="w-full h-48 object-cover rounded-xl" />
                      <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      {isUploadingImage ? (
                        <div className="flex items-center gap-2 text-orange-500">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>上傳中...</span>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">拍照或選擇圖片（最大 5MB）</span>
                        </>
                      )}
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                    </label>
                  )}
                </div>

                {/* 送出 */}
                <Button
                  onClick={handleSubmit}
                  disabled={createRepair.isPending}
                  className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
                >
                  {createRepair.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  ) : (
                    <Wrench className="w-6 h-6 mr-2" />
                  )}
                  送出報修申請
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

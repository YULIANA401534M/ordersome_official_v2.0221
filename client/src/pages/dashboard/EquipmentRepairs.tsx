import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Wrench, Plus, AlertTriangle, Clock, CheckCircle,
  XCircle, ChevronDown, Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "低", color: "bg-gray-100 text-gray-600" },
  medium: { label: "中", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "高", color: "bg-orange-100 text-orange-700" },
  critical: { label: "緊急", color: "bg-red-100 text-red-700" },
};

const STATUS_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { label: "待處理", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "處理中", icon: Wrench, color: "bg-blue-100 text-blue-700" },
  resolved: { label: "已解決", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", icon: XCircle, color: "bg-gray-100 text-gray-600" },
};

export default function EquipmentRepairs() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";
  const [showForm, setShowForm] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<number | null>(null);

  // Form state
  const [equipmentName, setEquipmentName] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [storeId, setStoreId] = useState(1);

  const { data: repairs, refetch } = trpc.sop.getRepairs.useQuery();
  const { data: stores } = trpc.store.list.useQuery();

  const createRepair = trpc.sop.createRepair.useMutation({
    onSuccess: () => {
      toast.success("報修申請已提交！");
      setShowForm(false);
      setEquipmentName("");
      setIssueDescription("");
      setUrgency("medium");
      refetch();
    },
    onError: () => toast.error("提交失敗，請重試"),
  });

  const updateStatus = trpc.sop.updateRepairStatus.useMutation({
    onSuccess: () => {
      toast.success("狀態已更新");
      refetch();
    },
  });

  const handleSubmit = () => {
    if (!equipmentName.trim() || !issueDescription.trim()) {
      toast.error("請填寫設備名稱和問題描述");
      return;
    }
    createRepair.mutate({ storeId, equipmentName, issueDescription, urgency });
  };

  const selectedRepairData = repairs?.find((r) => r.id === selectedRepair);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-500" />
            設備報修
          </h1>
          <p className="text-sm text-gray-500 mt-1">回報設備故障，追蹤維修進度</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增報修
        </Button>
      </div>

      {/* 新增報修表單 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">新增設備報修</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* 門市選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">門市 *</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                {stores?.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            {/* 設備名稱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">設備名稱 *</label>
              <Input
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="例：烤箱、冰箱、收銀機..."
                className="text-base"
              />
            </div>
            {/* 緊急程度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">緊急程度</label>
              <div className="grid grid-cols-4 gap-2">
                {(["low", "medium", "high", "critical"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setUrgency(level)}
                    className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                      urgency === level
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {URGENCY_LABELS[level].label}
                  </button>
                ))}
              </div>
            </div>
            {/* 問題描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">問題描述 *</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="詳細描述設備問題、故障現象..."
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            {/* 提交按鈕 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRepair.isPending}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {createRepair.isPending ? "提交中..." : "提交報修"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 報修列表 */}
      <div className="space-y-3">
        {repairs?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">目前沒有報修記錄</p>
          </div>
        )}
        {repairs?.map((repair) => {
          const urgencyInfo = URGENCY_LABELS[repair.urgency];
          const statusInfo = STATUS_LABELS[repair.status];
          const StatusIcon = statusInfo.icon;
          return (
            <div
              key={repair.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-gray-900">{repair.equipmentName}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyInfo.color}`}>
                      {urgencyInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{repair.issueDescription}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(repair.createdAt).toLocaleString("zh-TW")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                  {isManager && repair.status !== "resolved" && repair.status !== "cancelled" && (
                    <select
                      value={repair.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: repair.id,
                          status: e.target.value as "pending" | "in_progress" | "resolved" | "cancelled",
                        })
                      }
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pending">待處理</option>
                      <option value="in_progress">處理中</option>
                      <option value="resolved">已解決</option>
                      <option value="cancelled">取消</option>
                    </select>
                  )}
                </div>
              </div>
              {repair.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">備註：{repair.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

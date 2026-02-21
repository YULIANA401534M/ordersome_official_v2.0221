import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Sun, Moon, CheckCircle, Circle, Plus, X, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const OPENING_ITEMS = [
  "確認食材新鮮度與庫存",
  "清潔廚房工作台面",
  "檢查冷藏/冷凍設備溫度",
  "確認餐具清潔消毒完成",
  "開啟所有設備並測試",
  "確認收銀系統正常運作",
  "補充外帶包裝材料",
  "確認店面清潔整齊",
];

const CLOSING_ITEMS = [
  "清潔所有廚房設備",
  "清理油煙機過濾網",
  "確認食材妥善冷藏保存",
  "清潔地板與工作台",
  "關閉所有設備電源",
  "確認門窗鎖好",
  "結帳並核對金額",
  "填寫每日營業記錄",
];

export default function DailyChecklist() {
  const { user } = useAuth();
  const [checklistType, setChecklistType] = useState<"opening" | "closing">("opening");
  const [showForm, setShowForm] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [storeId, setStoreId] = useState(1);
  const [notes, setNotes] = useState("");

  const { data: stores } = trpc.store.list.useQuery();
  const { data: checklists, refetch } = trpc.sop.getChecklists.useQuery({});

  const createChecklist = trpc.sop.createChecklist.useMutation({
    onSuccess: () => {
      toast.success("檢查表已提交！");
      setShowForm(false);
      setCheckedItems({});
      setNotes("");
      refetch();
    },
    onError: () => toast.error("提交失敗，請重試"),
  });

  const templateItems = checklistType === "opening" ? OPENING_ITEMS : CLOSING_ITEMS;

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = templateItems.length;
  const progress = Math.round((checkedCount / totalCount) * 100);

  const handleSubmit = () => {
    const today = new Date().toISOString().split("T")[0];
    createChecklist.mutate({
      storeId,
      checklistType,
      checkDate: today,
      notes,
      items: templateItems.map((item, index) => ({
        itemName: item,
        isChecked: !!checkedItems[index],
      })),
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            每日檢查表
          </h1>
          <p className="text-sm text-gray-500 mt-1">開店/閉店標準作業確認</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          開始檢查
        </Button>
      </div>

      {/* 檢查表表單 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          {/* 類型選擇 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">今日檢查表</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 門市選擇 */}
            <select
              value={storeId}
              onChange={(e) => setStoreId(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-3"
            >
              {stores?.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            {/* 開/閉店切換 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setChecklistType("opening"); setCheckedItems({}); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  checklistType === "opening"
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Sun className="w-5 h-5" />
                開店檢查
              </button>
              <button
                onClick={() => { setChecklistType("closing"); setCheckedItems({}); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  checklistType === "closing"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Moon className="w-5 h-5" />
                閉店檢查
              </button>
            </div>
          </div>

          {/* 進度條 */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">完成進度</span>
              <span className="font-bold text-gray-900">{checkedCount}/{totalCount}</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  checklistType === "opening" ? "bg-amber-500" : "bg-indigo-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 檢查項目列表 */}
          <div className="p-4 space-y-2">
            {templateItems.map((item, index) => (
              <button
                key={index}
                onClick={() => toggleItem(index)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  checkedItems[index]
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                {checkedItems[index] ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${checkedItems[index] ? "text-green-700 line-through" : "text-gray-700"}`}>
                  {item}
                </span>
              </button>
            ))}
          </div>

          {/* 備註 */}
          <div className="px-4 pb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="備註（選填）..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* 提交按鈕 */}
          <div className="px-4 pb-4">
            <Button
              onClick={handleSubmit}
              disabled={createChecklist.isPending}
              className={`w-full py-4 text-base font-bold rounded-xl ${
                checklistType === "opening"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white`}
            >
              {createChecklist.isPending ? "提交中..." : `完成${checklistType === "opening" ? "開店" : "閉店"}檢查`}
            </Button>
          </div>
        </div>
      )}

      {/* 歷史記錄 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">最近記錄</h3>
        {checklists?.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">尚無檢查記錄</p>
          </div>
        )}
        <div className="space-y-2">
          {checklists?.map((checklist) => (
            <div
              key={checklist.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {checklist.checklistType === "opening" ? (
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-600" />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Moon className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {checklist.checklistType === "opening" ? "開店檢查" : "閉店檢查"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(checklist.createdAt).toLocaleString("zh-TW")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                完成
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

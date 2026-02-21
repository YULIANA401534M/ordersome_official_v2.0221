import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, CheckCircle, Circle, Loader2, ChevronLeft, History } from "lucide-react";

// ===== 基於《營運手冊》的開店流程 =====
const OPENING_ITEMS = [
  { category: "環境清潔", label: "清潔店內地板、桌椅及工作台" },
  { category: "環境清潔", label: "清潔冰箱、冷凍庫外表面" },
  { category: "環境清潔", label: "清潔飲料機台及周邊" },
  { category: "環境清潔", label: "補充洗手液、衛生紙" },
  { category: "食材準備", label: "確認冷藏食材溫度（≤7°C）" },
  { category: "食材準備", label: "確認冷凍食材溫度（≤-18°C）" },
  { category: "食材準備", label: "檢查食材有效日期，丟棄過期品" },
  { category: "食材準備", label: "補充當日所需食材至工作台" },
  { category: "食材準備", label: "準備醬料、配料（依當日預估量）" },
  { category: "設備檢查", label: "開啟並測試 POS 收銀系統" },
  { category: "設備檢查", label: "確認電子支付系統正常" },
  { category: "設備檢查", label: "開啟烹飪設備預熱（依設備操作手冊）" },
  { category: "設備檢查", label: "確認飲料機台運作正常" },
  { category: "設備檢查", label: "確認外送平台上線（Uber Eats / foodpanda）" },
  { category: "人員就緒", label: "確認當班人員到齊、儀容整潔" },
  { category: "人員就緒", label: "交接昨日未完成事項" },
  { category: "人員就緒", label: "確認當日特殊活動或促銷方案" },
];

// ===== 基於《營運手冊》的閉店流程 =====
const CLOSING_ITEMS = [
  { category: "食材處理", label: "清點剩餘食材，記錄耗損量" },
  { category: "食材處理", label: "妥善保存剩餘食材（標示日期）" },
  { category: "食材處理", label: "丟棄超過保存期限的食材" },
  { category: "食材處理", label: "清潔並歸位所有食材容器" },
  { category: "設備清潔", label: "清潔烹飪設備（烤箱、爐具等）" },
  { category: "設備清潔", label: "清潔飲料機台（依清潔 SOP）" },
  { category: "設備清潔", label: "清潔工作台及砧板" },
  { category: "設備清潔", label: "清洗並消毒餐具、器皿" },
  { category: "環境整理", label: "清潔地板（拖地）" },
  { category: "環境整理", label: "清空並清潔垃圾桶" },
  { category: "環境整理", label: "清潔廁所" },
  { category: "環境整理", label: "整理外場桌椅" },
  { category: "系統結帳", label: "完成 POS 日結報表" },
  { category: "系統結帳", label: "確認外送平台訂單全部完成" },
  { category: "系統結帳", label: "關閉外送平台接單" },
  { category: "系統結帳", label: "核對當日現金收入" },
  { category: "安全確認", label: "關閉所有烹飪設備電源" },
  { category: "安全確認", label: "確認瓦斯閥門已關閉" },
  { category: "安全確認", label: "關閉冷氣、電燈" },
  { category: "安全確認", label: "確認門窗已上鎖" },
];

type ChecklistType = "opening" | "closing";

export default function DailyChecklist() {
  const { user } = useAuth();
  const isManager = user?.role === "super_admin" || user?.role === "manager";

  const [mode, setMode] = useState<"select" | "checklist" | "history">("select");
  const [checklistType, setChecklistType] = useState<ChecklistType>("opening");
  const [storeId, setStoreId] = useState<number>(0);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const { data: stores = [] } = trpc.store.list.useQuery();
  const { data: history = [], refetch: refetchHistory } = trpc.sop.getChecklists.useQuery({
    storeId: storeId || undefined,
    checklistType: undefined,
  });

  const createChecklist = trpc.sop.createChecklist.useMutation({
    onSuccess: () => {
      toast.success("✅ 檢查表已提交！記錄已儲存。");
      setMode("select");
      setCheckedItems(new Set());
      refetchHistory();
    },
    onError: (err) => toast.error("提交失敗：" + err.message),
  });

  const items = checklistType === "opening" ? OPENING_ITEMS : CLOSING_ITEMS;
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const completionRate = Math.round((checkedItems.size / items.length) * 100);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!storeId) { toast.error("請選擇門市"); return; }
    const unchecked = items.filter((_, i) => !checkedItems.has(i));
    if (unchecked.length > 0) {
      toast.error(`尚有 ${unchecked.length} 項未完成，請確認所有項目均已勾選`);
      return;
    }
    createChecklist.mutate({
      storeId,
      checklistType,
      checkDate: new Date().toISOString().split("T")[0],
      items: items.map((item, i) => ({
        itemName: item.label,
        isChecked: checkedItems.has(i),
        notes: undefined,
      })),
    });
  };

  // ===== 歷史記錄視圖 =====
  if (mode === "history") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setMode("select")} className="text-gray-500 hover:text-gray-800">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">提交記錄</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-4">
          {isManager && (
            <div className="mb-4">
              <Select value={storeId.toString()} onValueChange={(v) => setStoreId(Number(v))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="篩選門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">全部門市</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {history.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">尚無提交記錄</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${record.checklistType === "opening" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {record.checklistType === "opening" ? "開店檢查" : "閉店檢查"}
                      </span>
                      <p className="font-semibold text-gray-900 mt-1">
                        {new Date(record.checkDate).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        提交時間：{new Date(record.createdAt).toLocaleTimeString("zh-TW")}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 勾選清單視圖 =====
  if (mode === "checklist") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => { setMode("select"); setCheckedItems(new Set()); }} className="text-gray-500 hover:text-gray-800">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                {checklistType === "opening" ? "🌅 開店檢查表" : "🌙 閉店檢查表"}
              </h1>
              <span className="text-sm font-semibold text-purple-600">{checkedItems.size}/{items.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
          {categories.map((cat) => (
            <div key={cat} className="mb-5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">{cat}</h3>
              <div className="space-y-2">
                {items.map((item, index) => {
                  if (item.category !== cat) return null;
                  const isChecked = checkedItems.has(index);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleItem(index)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] ${
                        isChecked
                          ? "bg-green-50 border-2 border-green-400"
                          : "bg-white border-2 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle className="w-7 h-7 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-7 h-7 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-base text-left leading-tight ${isChecked ? "text-green-800 line-through" : "text-gray-800"}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20">
          <div className="max-w-2xl mx-auto">
            {completionRate < 100 && (
              <p className="text-center text-sm text-orange-600 mb-2">
                ⚠️ 尚有 {items.length - checkedItems.size} 項未完成
              </p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={createChecklist.isPending || completionRate < 100}
              className={`w-full h-14 text-lg font-bold rounded-2xl ${
                completionRate === 100
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {createChecklist.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-6 h-6 mr-2" />
              )}
              {completionRate === 100 ? "✅ 提交完成！" : `完成後提交（${completionRate}%）`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 選擇視圖（預設） =====
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton className="-ml-2" />
            <ClipboardList className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">每日檢查表</h1>
          </div>
          <button
            onClick={() => setMode("history")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <History className="w-4 h-4" />歷史記錄
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <h3 className="font-semibold text-gray-900 mb-3">選擇門市</h3>
          <Select value={storeId.toString()} onValueChange={(v) => setStoreId(Number(v))}>
            <SelectTrigger className="h-14 text-base">
              <SelectValue placeholder="請選擇您所在的門市" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()} className="text-base py-3">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <h3 className="font-semibold text-gray-700 mb-3 px-1">選擇檢查類型</h3>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => {
              if (!storeId) { toast.error("請先選擇門市"); return; }
              setChecklistType("opening");
              setCheckedItems(new Set());
              setMode("checklist");
            }}
            className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-shadow active:scale-[0.98] border-2 border-transparent hover:border-green-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
                🌅
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">開店檢查表</h3>
                <p className="text-gray-500 text-sm mt-0.5">開店前完成 {OPENING_ITEMS.length} 項確認</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(new Set(OPENING_ITEMS.map((i) => i.category))).map((cat) => (
                    <span key={cat} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              if (!storeId) { toast.error("請先選擇門市"); return; }
              setChecklistType("closing");
              setCheckedItems(new Set());
              setMode("checklist");
            }}
            className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition-shadow active:scale-[0.98] border-2 border-transparent hover:border-blue-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
                🌙
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">閉店檢查表</h3>
                <p className="text-gray-500 text-sm mt-0.5">閉店前完成 {CLOSING_ITEMS.length} 項確認</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(new Set(CLOSING_ITEMS.map((i) => i.category))).map((cat) => (
                    <span key={cat} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </div>

        {isManager && history.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">今日提交統計</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {history.filter((r) => r.checklistType === "opening").length}
                </p>
                <p className="text-xs text-green-700 mt-0.5">開店記錄</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {history.filter((r) => r.checklistType === "closing").length}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">閉店記錄</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

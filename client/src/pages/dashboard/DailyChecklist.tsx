import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BackButton from "@/components/BackButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, CheckCircle, Circle, Loader2, ChevronLeft, History } from "lucide-react";

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
      toast.success("檢查表已提交！記錄已儲存。");
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
      <div style={{ minHeight: "100vh", background: "var(--os-bg)" }}>
        <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setMode("select")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-2)" }}>
              <ChevronLeft style={{ width: 24, height: 24 }} />
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>提交記錄</h1>
          </div>
        </div>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px" }}>
          {isManager && (
            <div style={{ marginBottom: 16 }}>
              <Select value={storeId.toString()} onValueChange={(v) => setStoreId(Number(v))}>
                <SelectTrigger style={{ height: 48 }}>
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
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <History style={{ width: 44, height: 44, color: "var(--os-text-3)", margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ color: "var(--os-text-3)", fontSize: 14 }}>尚無提交記錄</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((record) => {
                const isOpening = record.checklistType === "opening";
                return (
                  <div key={record.id}
                    style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: isOpening ? "var(--os-success)" : "var(--os-info)", background: isOpening ? "var(--os-success-bg)" : "var(--os-info-bg)" }}>
                          {isOpening ? "開店檢查" : "閉店檢查"}
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", marginTop: 6, marginBottom: 2 }}>
                          {new Date(record.checkDate).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--os-text-3)", margin: 0 }}>
                          提交時間：{new Date(record.createdAt).toLocaleTimeString("zh-TW")}
                        </p>
                      </div>
                      <CheckCircle style={{ width: 28, height: 28, color: "var(--os-success)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 勾選清單視圖 =====
  if (mode === "checklist") {
    const isOpening = checklistType === "opening";
    return (
      <div style={{ minHeight: "100vh", background: "var(--os-bg)" }}>
        <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <button onClick={() => { setMode("select"); setCheckedItems(new Set()); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-2)" }}>
                <ChevronLeft style={{ width: 24, height: 24 }} />
              </button>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>
                {isOpening ? "🌅 開店檢查表" : "🌙 閉店檢查表"}
              </h1>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--os-amber)" }}>{checkedItems.size}/{items.length}</span>
            </div>
            <div style={{ width: "100%", background: "var(--os-surface-2)", borderRadius: 99, height: 6 }}>
              <div style={{ width: `${completionRate}%`, height: "100%", borderRadius: 99, background: completionRate === 100 ? "var(--os-success)" : "var(--os-amber)", transition: "width 0.3s" }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 128px" }}>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--os-text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4 }}>{cat}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((item, index) => {
                  if (item.category !== cat) return null;
                  const isChecked = checkedItems.has(index);
                  return (
                    <button key={index} onClick={() => toggleItem(index)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 12, border: `2px solid ${isChecked ? "var(--os-success)" : "var(--os-border)"}`, background: isChecked ? "var(--os-success-bg)" : "var(--os-surface)", cursor: "pointer", transition: "all 0.15s" }}>
                      {isChecked
                        ? <CheckCircle style={{ width: 24, height: 24, color: "var(--os-success)", flexShrink: 0 }} />
                        : <Circle style={{ width: 24, height: 24, color: "var(--os-text-3)", flexShrink: 0 }} />}
                      <span style={{ fontSize: 14, textAlign: "left", lineHeight: 1.4, color: isChecked ? "var(--os-success)" : "var(--os-text-1)", textDecoration: isChecked ? "line-through" : "none" }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--os-surface)", borderTop: "1px solid var(--os-border)", padding: 16, zIndex: 20 }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {completionRate < 100 && (
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--os-warning)", marginBottom: 8 }}>
                ⚠️ 尚有 {items.length - checkedItems.size} 項未完成
              </p>
            )}
            <button onClick={handleSubmit} disabled={createChecklist.isPending || completionRate < 100}
              style={{ width: "100%", height: 52, border: "none", borderRadius: 12, background: completionRate === 100 ? "var(--os-success)" : "var(--os-surface-2)", color: completionRate === 100 ? "#fff" : "var(--os-text-3)", fontSize: 16, fontWeight: 700, cursor: completionRate < 100 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
              {createChecklist.isPending
                ? <Loader2 style={{ width: 22, height: 22 }} className="animate-spin" />
                : <CheckCircle style={{ width: 22, height: 22 }} />}
              {completionRate === 100 ? "提交完成！" : `完成後提交（${completionRate}%）`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 選擇視圖（預設） =====
  return (
    <div style={{ minHeight: "100vh", background: "var(--os-bg)" }}>
      <div style={{ background: "var(--os-surface)", borderBottom: "1px solid var(--os-border)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BackButton className="-ml-2" />
            <ClipboardList style={{ width: 20, height: 20, color: "var(--os-amber)" }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>每日檢查表</h1>
          </div>
          <button onClick={() => setMode("history")}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--os-text-2)", background: "none", border: "none", cursor: "pointer" }}>
            <History style={{ width: 14, height: 14 }} />歷史記錄
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", marginBottom: 12 }}>選擇門市</h3>
          <Select value={storeId.toString()} onValueChange={(v) => setStoreId(Number(v))}>
            <SelectTrigger style={{ height: 52, fontSize: 14 }}>
              <SelectValue placeholder="請選擇您所在的門市" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-2)", marginBottom: 12, paddingLeft: 4 }}>選擇檢查類型</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { type: "opening" as const, emoji: "🌅", title: "開店檢查表", desc: `開店前完成 ${OPENING_ITEMS.length} 項確認`, items: OPENING_ITEMS, accentColor: "var(--os-success)", accentBg: "var(--os-success-bg)" },
            { type: "closing" as const, emoji: "🌙", title: "閉店檢查表", desc: `閉店前完成 ${CLOSING_ITEMS.length} 項確認`, items: CLOSING_ITEMS, accentColor: "var(--os-info)", accentBg: "var(--os-info-bg)" },
          ].map(({ type, emoji, title, desc, items: typeItems, accentColor, accentBg }) => (
            <button key={type}
              onClick={() => {
                if (!storeId) { toast.error("請先選擇門市"); return; }
                setChecklistType(type);
                setCheckedItems(new Set());
                setMode("checklist");
              }}
              style={{ background: "var(--os-surface)", border: "2px solid var(--os-border)", borderRadius: 16, padding: "20px 20px", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = accentColor}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "var(--os-border)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 60, height: 60, background: accentBg, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                  {emoji}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--os-text-1)", margin: 0 }}>{title}</h3>
                  <p style={{ fontSize: 13, color: "var(--os-text-3)", marginTop: 2, marginBottom: 6 }}>{desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {Array.from(new Set(typeItems.map((i) => i.category))).map((cat) => (
                      <span key={cat} style={{ fontSize: 11, color: accentColor, background: accentBg, padding: "2px 8px", borderRadius: 20 }}>{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {isManager && history.length > 0 && (
          <div style={{ marginTop: 20, background: "var(--os-surface)", border: "1px solid var(--os-border)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-1)", marginBottom: 12 }}>今日提交統計</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--os-success-bg)", borderRadius: 10, padding: "12px 0", textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--os-success)", margin: 0 }}>
                  {history.filter((r) => r.checklistType === "opening").length}
                </p>
                <p style={{ fontSize: 11, color: "var(--os-success)", margin: "4px 0 0" }}>開店記錄</p>
              </div>
              <div style={{ background: "var(--os-info-bg)", borderRadius: 10, padding: "12px 0", textAlign: "center" }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: "var(--os-info)", margin: 0 }}>
                  {history.filter((r) => r.checklistType === "closing").length}
                </p>
                <p style={{ fontSize: 11, color: "var(--os-info)", margin: "4px 0 0" }}>閉店記錄</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { DayoneLayout, TENANT_ID } from "./DayoneLayout";
import { Bell, Save } from "lucide-react";

export default function DayoneSettings() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushHour, setPushHour] = useState(9);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const enabledQuery = trpc.dayone.settings.get.useQuery(
    { tenantId: TENANT_ID, key: "overdue_push_enabled" },
    { refetchOnWindowFocus: false }
  );
  const hourQuery = trpc.dayone.settings.get.useQuery(
    { tenantId: TENANT_ID, key: "overdue_push_hour" },
    { refetchOnWindowFocus: false }
  );

  const setMutation = trpc.dayone.settings.set.useMutation();

  useEffect(() => {
    if (enabledQuery.data !== undefined && enabledQuery.data !== null) {
      setPushEnabled(enabledQuery.data === "true");
    }
  }, [enabledQuery.data]);

  useEffect(() => {
    if (hourQuery.data !== undefined && hourQuery.data !== null) {
      setPushHour(parseInt(hourQuery.data) || 9);
    }
  }, [hourQuery.data]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await setMutation.mutateAsync({ tenantId: TENANT_ID, key: "overdue_push_enabled", value: pushEnabled ? "true" : "false" });
      await setMutation.mutateAsync({ tenantId: TENANT_ID, key: "overdue_push_hour", value: String(pushHour) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const isLoading = enabledQuery.isLoading || hourQuery.isLoading;

  return (
    <DayoneLayout>
      <div className="dayone-page-header mb-6">
        <div>
          <h1 className="dayone-page-title" style={{ fontSize: "1.6rem" }}>系統設定</h1>
          <p className="dayone-page-subtitle" style={{ fontSize: 13 }}>管理通知推播與系統偏好設定</p>
        </div>
      </div>

      <div className="dayone-panel rounded-[28px] p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid rgba(217,119,6,0.12)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
            <Bell className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <div className="font-semibold text-stone-900" style={{ fontSize: 15 }}>積欠款 LINE 推播通知</div>
            <div className="text-stone-500" style={{ fontSize: 12 }}>設定每日逾期帳款推播時間</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-stone-400 text-sm py-4">讀取中...</div>
        ) : (
          <div className="space-y-6">
            {/* 推播開關 */}
            <div className="flex items-center justify-between gap-4 rounded-2xl px-4 py-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(217,119,6,0.10)" }}>
              <div>
                <div className="font-medium text-stone-800" style={{ fontSize: 14 }}>啟用每日推播</div>
                <div className="text-stone-500 mt-1" style={{ fontSize: 12 }}>開啟後，系統每天於指定時間推播逾期帳款提醒給客戶</div>
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                style={{
                  position: "relative", display: "inline-flex", width: 44, height: 24, flexShrink: 0,
                  borderRadius: 12, border: "none", cursor: "pointer",
                  background: pushEnabled ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(214,211,209,0.8)",
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: pushEnabled ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)", transition: "left 0.2s",
                }} />
              </button>
            </div>

            {/* 推播時間 */}
            <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(217,119,6,0.10)" }}>
              <label className="block font-medium text-stone-800 mb-3" style={{ fontSize: 14 }}>每天推送時間</label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={0} max={23} value={pushHour}
                  onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 23) setPushHour(v); }}
                  disabled={!pushEnabled}
                  style={{
                    width: 80, padding: "8px 12px", borderRadius: 12,
                    border: "1px solid rgba(217,119,6,0.18)",
                    background: pushEnabled ? "rgba(255,255,255,0.8)" : "rgba(241,241,239,0.6)",
                    color: pushEnabled ? "#1c1917" : "#a8a29e",
                    fontSize: 14, outline: "none", textAlign: "center",
                  }}
                />
                <span className="text-stone-500" style={{ fontSize: 13 }}>點（台灣時間，0–23）</span>
              </div>
              <div className="text-stone-400 mt-2" style={{ fontSize: 11 }}>
                目前設定：每天 {pushHour}:00 推播（需開啟推播開關才會生效）
              </div>
            </div>

            {/* 儲存按鈕 */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave} disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 20px", borderRadius: 16, border: "none", cursor: saving ? "not-allowed" : "pointer",
                  background: saving ? "rgba(214,211,209,0.6)" : "linear-gradient(135deg,#f59e0b,#d97706)",
                  color: "#fff", fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <Save className="h-4 w-4" />
                {saving ? "儲存中..." : "儲存設定"}
              </button>
              {saved && (
                <span className="text-amber-700 font-medium" style={{ fontSize: 13 }}>已儲存</span>
              )}
            </div>
          </div>
        )}
      </div>
    </DayoneLayout>
  );
}

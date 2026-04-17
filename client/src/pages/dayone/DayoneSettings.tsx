import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { DayoneLayout } from "./DayoneLayout";
import { TENANT_ID } from "./DayoneLayout";

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
      await setMutation.mutateAsync({
        tenantId: TENANT_ID,
        key: "overdue_push_enabled",
        value: pushEnabled ? "true" : "false",
      });
      await setMutation.mutateAsync({
        tenantId: TENANT_ID,
        key: "overdue_push_hour",
        value: String(pushHour),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const isLoading = enabledQuery.isLoading || hourQuery.isLoading;

  return (
    <DayoneLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">系統設定</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">積欠款 LINE 推播通知</h2>

          {isLoading ? (
            <div className="text-gray-400 text-sm">讀取中...</div>
          ) : (
            <div className="space-y-5">
              {/* 推播開關 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">啟用每日推播</p>
                  <p className="text-xs text-gray-400 mt-0.5">開啟後，系統每天於指定時間推播逾期帳款提醒給客戶</p>
                </div>
                <button
                  onClick={() => setPushEnabled(!pushEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    pushEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      pushEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* 推播時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  每天推送時間
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={pushHour}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 0 && v <= 23) setPushHour(v);
                    }}
                    disabled={!pushEnabled}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <span className="text-sm text-gray-600">點（台灣時間，0–23）</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  目前設定：每天 {pushHour}:00 推播（需開啟推播開關才會生效）
                </p>
              </div>

              {/* 儲存按鈕 */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "儲存中..." : "儲存設定"}
                </button>
                {saved && (
                  <span className="text-sm text-green-600 font-medium">已儲存</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DayoneLayout>
  );
}

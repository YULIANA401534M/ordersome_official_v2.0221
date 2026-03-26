import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const MODULE_LABELS: Record<string, { label: string; desc: string }> = {
  erp_delivery:  { label: "配送 ERP", desc: "司機配送、訂單管理、電子簽收" },
  erp_inventory: { label: "庫存管理", desc: "庫存追蹤、異動紀錄、警示" },
  erp_purchase:  { label: "進貨管理", desc: "進貨單、供應商管理" },
  erp_customers: { label: "客戶管理", desc: "客戶資料、專屬價格" },
  erp_reports:   { label: "報表分析", desc: "日報、月報、業績統計" },
};

export default function SuperAdminModules() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: tenants } = trpc.dayone.modules.allTenantModules.useQuery();
  const toggle = trpc.dayone.modules.toggle.useMutation({
    onSuccess: () => { toast.success("模組已更新"); utils.dayone.modules.allTenantModules.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role !== "super_admin") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600" />
        <h1 className="text-lg font-bold text-gray-900">Super Admin - 模組管理</h1>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <p className="text-sm text-gray-500">管理各租戶的功能模組開關（樂高架構）</p>

        {!(tenants as any[])?.length ? (
          <div className="text-center py-16 text-gray-400">無租戶資料</div>
        ) : (
          (tenants as any[]).map((tenant: any) => {
            const isOpen = expanded === tenant.tenantId;
            const enabledCount = tenant.modules?.filter((m: any) => m.isEnabled).length ?? 0;
            return (
              <div key={tenant.tenantId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isOpen ? null : tenant.tenantId)}
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-amber-700 text-sm">
                    {tenant.tenantName?.slice(0, 2) ?? "T"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{tenant.tenantName}</p>
                    <p className="text-xs text-gray-500">已啟用 {enabledCount} / {tenant.modules?.length ?? 0} 個模組</p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {(tenant.modules ?? []).map((mod: any) => {
                      const info = MODULE_LABELS[mod.moduleKey] ?? { label: mod.moduleKey, desc: "" };
                      return (
                        <div key={mod.moduleKey} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{info.label}</p>
                            <p className="text-xs text-gray-500">{info.desc}</p>
                          </div>
                          <button
                            onClick={() => toggle.mutate({ tenantId: tenant.tenantId, moduleKey: mod.moduleKey, isEnabled: !mod.isEnabled })}
                            disabled={toggle.isPending}
                            className="transition-colors"
                          >
                            {mod.isEnabled
                              ? <ToggleRight className="w-8 h-8 text-amber-500" />
                              : <ToggleLeft className="w-8 h-8 text-gray-300" />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

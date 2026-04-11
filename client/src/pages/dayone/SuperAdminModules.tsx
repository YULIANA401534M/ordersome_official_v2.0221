import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  store_ops: "門市管理",
  erp:       "ERP 模組",
  dayone:    "大永蛋品",
  other:     "其他",
};

type TenantModuleRow = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  moduleKey: string;
  label: string;
  category: string;
  sortOrder: number;
  isEnabled: boolean;
};

type TenantData = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  modules: Record<string, { label: string; category: string; sortOrder: number; isEnabled: boolean }>;
};

export default function SuperAdminModules() {
  const { data, isLoading, refetch } = trpc.dayone.modules.allTenantModules.useQuery();
  const utils = trpc.useUtils();
  const toggleMutation = trpc.dayone.modules.toggle.useMutation({
    onSuccess: () => {
      refetch();
      utils.dayone.modules.list.invalidate();
    },
  });
  const [toggling, setToggling] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // 組裝租戶資料（從 DB JOIN 結果動態生成，不依賴前端白名單）
  const tenantMap = new Map<number, TenantData>();
  for (const row of (data ?? []) as TenantModuleRow[]) {
    if (!tenantMap.has(row.id)) {
      tenantMap.set(row.id, {
        id: row.id, name: row.name, slug: row.slug,
        plan: row.plan, isActive: row.isActive, modules: {},
      });
    }
    if (row.moduleKey) {
      tenantMap.get(row.id)!.modules[row.moduleKey] = {
        label: row.label ?? row.moduleKey,
        category: row.category ?? "other",
        sortOrder: row.sortOrder ?? 0,
        isEnabled: !!row.isEnabled,
      };
    }
  }
  const tenants = Array.from(tenantMap.values());

  const handleToggle = async (tenantId: number, moduleKey: string, current: boolean) => {
    const key = `${tenantId}-${moduleKey}`;
    setToggling(key);
    try {
      await toggleMutation.mutateAsync({ tenantId, moduleKey, isEnabled: !current });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">模組開關控制台</h1>
        <p className="text-sm text-gray-500 mt-1">控制每個租戶可使用的功能模組</p>
      </div>

      <div className="space-y-6">
        {tenants.map((tenant) => {
          // 按 category 分組
          const byCategory: Record<string, Array<{ moduleKey: string; label: string; category: string; sortOrder: number; isEnabled: boolean }>> = {};
          for (const [key, mod] of Object.entries(tenant.modules)) {
            if (!byCategory[mod.category]) byCategory[mod.category] = [];
            byCategory[mod.category].push({ ...mod, moduleKey: key });
          }

          return (
            <Card key={tenant.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{tenant.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">{tenant.slug}</Badge>
                  <Badge variant={tenant.isActive ? "default" : "secondary"} className="text-xs">
                    {tenant.isActive ? "營運中" : "停用"}
                  </Badge>
                  <span className="text-xs text-gray-400 ml-auto">方案：{tenant.plan}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(byCategory).map(([category, mods]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
                      {CATEGORY_LABELS[category] ?? category}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {mods.sort((a, b) => a.sortOrder - b.sortOrder).map((mod) => {
                        const isEnabled = mod.isEnabled;
                        const toggleKey = `${tenant.id}-${mod.moduleKey}`;
                        return (
                          <div
                            key={mod.moduleKey}
                            className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                          >
                            <span className="text-sm text-gray-700">{mod.label}</span>
                            <Switch
                              checked={isEnabled}
                              disabled={toggling === toggleKey}
                              onCheckedChange={() => handleToggle(tenant.id, mod.moduleKey, isEnabled)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

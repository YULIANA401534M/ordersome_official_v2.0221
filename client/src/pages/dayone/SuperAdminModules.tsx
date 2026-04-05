import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  delivery: "配送管理",
  crm_customers: "客戶管理",
  inventory: "庫存管理",
  purchasing: "進貨管理",
  accounting: "帳務管理",
  scheduling: "排班系統",
  daily_report: "門市日報",
  equipment_repair: "設備報修",
};

type TenantRow = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  modules: Record<string, boolean>;
};

export default function SuperAdminModules() {
  const { data, isLoading, refetch } = trpc.dayone.modules.allTenantModules.useQuery();
  const toggleMutation = trpc.dayone.modules.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  const [toggling, setToggling] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // group by tenantId
  const tenants: TenantRow[] = [];
  const tenantMap = new Map<number, TenantRow>();

  for (const row of data ?? []) {
    if (!tenantMap.has(row.id)) {
      const t: TenantRow = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        isActive: row.isActive,
        modules: {},
      };
      tenantMap.set(row.id, t);
      tenants.push(t);
    }
    if (row.moduleKey) {
      tenantMap.get(row.id)!.modules[row.moduleKey] = !!row.isEnabled;
    }
  }

  const moduleKeys = Object.keys(MODULE_LABELS);

  const handleToggle = async (tenantId: number, moduleKey: string, current: boolean) => {
    const key = `${tenantId}-${moduleKey}`;
    setToggling(key);
    try {
      await toggleMutation.mutateAsync({
        tenantId,
        moduleKey,
        isEnabled: !current,
      });
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

      <div className="space-y-4">
        {tenants.map((tenant) => (
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
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {moduleKeys.map((moduleKey) => {
                  const isEnabled = tenant.modules[moduleKey] ?? false;
                  const key = `${tenant.id}-${moduleKey}`;
                  const isToggling = toggling === key;
                  return (
                    <div
                      key={moduleKey}
                      className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {MODULE_LABELS[moduleKey]}
                      </span>
                      <Switch
                        checked={isEnabled}
                        disabled={isToggling}
                        onCheckedChange={() => handleToggle(tenant.id, moduleKey, isEnabled)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Shield, Building2, Settings } from "lucide-react";

export default function SuperAdminTenants() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: tenants } = trpc.dayone.modules.allTenantModules.useQuery();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role !== "super_admin") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600" />
        <h1 className="text-lg font-bold text-gray-900">Super Admin - 租戶總覽</h1>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {(tenants as any[])?.length ?? 0} 個租戶</p>
          <Link href="/super-admin/modules" className="text-sm text-amber-600 font-medium flex items-center gap-1">
            <Settings className="w-4 h-4" /> 模組管理
          </Link>
        </div>

        {!(tenants as any[])?.length ? (
          <div className="text-center py-16 text-gray-400">無租戶資料</div>
        ) : (
          <div className="grid gap-4">
            {(tenants as any[]).map((tenant: any) => {
              const enabledModules = (tenant.modules ?? []).filter((m: any) => m.isEnabled);
              return (
                <div key={tenant.tenantId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{tenant.tenantName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {tenant.tenantId}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {enabledModules.length === 0 ? (
                          <span className="text-xs text-gray-400">無啟用模組</span>
                        ) : (
                          enabledModules.map((m: any) => (
                            <span key={m.moduleKey} className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
                              {m.moduleKey.replace("erp_", "")}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <Link href="/super-admin/modules" className="text-gray-400 hover:text-amber-600 transition-colors">
                      <Settings className="w-4 h-4" />
                    </Link>
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

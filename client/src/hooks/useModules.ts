import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export function useModules(tenantId?: number) {
  const { user } = useAuth();
  const resolved = tenantId ?? (user as any)?.tenantId ?? 90004;
  const { data } = trpc.dayone.modules.list.useQuery(
    { tenantId: resolved },
    { enabled: !!user && !!resolved }
  );
  const modules: string[] = data?.map((m: any) => m.moduleKey) ?? [];
  return {
    has: (key: string) => modules.includes(key),
    modules,
  };
}

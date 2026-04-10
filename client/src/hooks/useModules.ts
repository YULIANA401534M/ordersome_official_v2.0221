import { trpc } from '../lib/trpc';

export function useModules() {
  const { data } = trpc.dayone.modules.list.useQuery({ tenantId: 90004 });
  const modules: string[] = data?.map((m: { moduleKey: string }) => m.moduleKey) ?? [];
  return {
    has: (key: string) => modules.includes(key),
    modules,
  };
}

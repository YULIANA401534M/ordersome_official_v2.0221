import { getDb } from '../db';
import { tenantModules } from '../../drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export async function requireModule(
  tenantId: number,
  moduleKey: string,
  role: string
): Promise<void> {
  if (role === 'super_admin') return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  const mods = await db.select().from(tenantModules).where(
    and(
      eq(tenantModules.tenantId, tenantId),
      eq(tenantModules.moduleKey, moduleKey),
      eq(tenantModules.isEnabled, true)
    )
  ).limit(1);
  if (mods.length === 0) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `此租戶未開啟模組：${moduleKey}`,
    });
  }
}

export async function getUserModules(tenantId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const mods = await db.select().from(tenantModules).where(
    and(
      eq(tenantModules.tenantId, tenantId),
      eq(tenantModules.isEnabled, true)
    )
  );
  return mods.map((m: any) => m.moduleKey);
}


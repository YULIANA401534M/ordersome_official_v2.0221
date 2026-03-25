import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  tenantId: number;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Resolve tenantId: 1) x-tenant-id header  2) default 1
  let tenantId = 1;
  const headerVal = opts.req.headers["x-tenant-id"];
  if (headerVal) {
    const parsed = parseInt(Array.isArray(headerVal) ? headerVal[0] : headerVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      tenantId = parsed;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    tenantId,
  };
}

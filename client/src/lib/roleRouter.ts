import { TENANTS } from "@shared/access-control";

export function getDefaultRouteForUser(user: { role?: string | null; tenantId?: number | null }): string {
  switch (user.role) {
    case "super_admin":    return "/dashboard";
    case "manager":        return Number(user.tenantId) === TENANTS.DAYONE ? "/dayone" : "/dashboard";
    case "driver":         return "/driver/today";
    case "portal_customer": return "/dayone/portal";
    case "franchisee":     return "/dashboard/franchise";
    case "staff":          return "/dashboard/staff";
    default:               return "/shop";
  }
}

export function resolveLoginRedirect(
  user: { role?: string | null; tenantId?: number | null },
  params?: URLSearchParams
): string {
  return params?.get("redirect") ?? getDefaultRouteForUser(user);
}

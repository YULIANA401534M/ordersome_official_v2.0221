import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { isSuperAdminUser } from "@shared/access-control";

type Props = {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredTenantId?: number;
  redirectTo?: string;
};

export default function ProtectedRoute({
  children,
  requiredRoles,
  requiredTenantId,
  redirectTo = "/login",
}: Props) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(redirectTo);
      return;
    }

    if (requiredRoles && !requiredRoles.includes(user.role ?? "")) {
      navigate(redirectTo);
      return;
    }

    // super_admin 可跨租戶，不做 tenant 限制
    if (requiredTenantId && !isSuperAdminUser(user as any)) {
      if (Number((user as any).tenantId) !== requiredTenantId) {
        navigate(redirectTo);
        return;
      }
    }
  }, [loading, user, requiredRoles, requiredTenantId, redirectTo, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (requiredRoles && !requiredRoles.includes(user.role ?? "")) return null;

  if (requiredTenantId && !isSuperAdminUser(user as any)) {
    if (Number((user as any).tenantId) !== requiredTenantId) return null;
  }

  return <>{children}</>;
}

export type ProtectedRouteOptions = Omit<Props, "children">;

export function protect<T extends object>(
  Comp: React.ComponentType<T>,
  opts: ProtectedRouteOptions
) {
  return function WrappedRoute(props: T) {
    return (
      <ProtectedRoute {...opts}>
        <Comp {...props} />
      </ProtectedRoute>
    );
  };
}

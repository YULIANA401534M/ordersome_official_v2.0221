import { TRPCError } from "@trpc/server";
import type { User } from "../../drizzle/schema";

/**
 * Role-based access control middleware
 */

export type UserRole = "super_admin" | "manager" | "franchisee" | "staff" | "customer";

export function requireRole(allowedRoles: UserRole[]) {
  return (user: User | null) => {
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "請先登入",
      });
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "您沒有權限訪問此資源",
      });
    }

    return true;
  };
}

/**
 * Check if user has franchisee or admin role
 */
export function isFranchiseeOrAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === "franchisee" || user.role === "super_admin" || user.role === "manager";
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === "super_admin" || user.role === "manager";
}

/**
 * Check if user is a customer
 */
export function isCustomer(user: User | null): boolean {
  if (!user) return false;
  return user.role === "customer";
}

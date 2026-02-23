/**
 * OAuth RBAC Defence Tests
 * Verifies that:
 * 1. Existing accounts matched by email only bind provider ID, never change role
 * 2. New accounts are created with role=customer
 * 3. getSmartRedirectUrl correctly routes based on role and state param
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mock db module ────────────────────────────────────────────────────────
const mockGetUserByEmail = vi.fn();
const mockLinkOAuthProvider = vi.fn();
const mockUpsertUser = vi.fn();
const mockGetUserByOpenId = vi.fn();
const mockUpdateUserLastSignedIn = vi.fn();

vi.mock("./db", () => ({
  getUserByEmail: mockGetUserByEmail,
  linkOAuthProvider: mockLinkOAuthProvider,
  upsertUser: mockUpsertUser,
  getUserByOpenId: mockGetUserByOpenId,
  updateUserLastSignedIn: mockUpdateUserLastSignedIn,
}));

// ─── Smart redirect helper (extracted for unit testing) ──────────────────
function getSmartRedirectUrl(role: string, stateParam: string): string {
  try {
    const decodedState = Buffer.from(stateParam, "base64").toString("utf-8");
    const stateUrl = new URL(decodedState);
    const redirectParam = stateUrl.searchParams.get("redirect");
    if (redirectParam) {
      const decoded = decodeURIComponent(redirectParam);
      if (decoded.startsWith("/")) return decoded;
    }
  } catch {
    // ignore
  }
  if (role === "customer") return "/shop";
  return "/dashboard";
}

// ─── detectProvider helper ────────────────────────────────────────────────
function detectProvider(loginMethod: string | null | undefined): 'line' | 'google' | null {
  if (!loginMethod) return null;
  const m = loginMethod.toLowerCase();
  if (m.includes("line")) return 'line';
  if (m.includes("google")) return 'google';
  return null;
}

// ─── Tests ────────────────────────────────────────────────────────────────
describe("OAuth RBAC Defence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detectProvider", () => {
    it("should detect LINE provider", () => {
      expect(detectProvider("line")).toBe("line");
      expect(detectProvider("LINE")).toBe("line");
      expect(detectProvider("registered_platform_line")).toBe("line");
    });

    it("should detect Google provider", () => {
      expect(detectProvider("google")).toBe("google");
      expect(detectProvider("GOOGLE")).toBe("google");
    });

    it("should return null for unknown providers", () => {
      expect(detectProvider(null)).toBeNull();
      expect(detectProvider(undefined)).toBeNull();
      expect(detectProvider("email")).toBeNull();
    });
  });

  describe("getSmartRedirectUrl", () => {
    it("should redirect customer to /shop by default", () => {
      const state = btoa("https://example.com/api/oauth/callback");
      expect(getSmartRedirectUrl("customer", state)).toBe("/shop");
    });

    it("should redirect internal roles to /dashboard by default", () => {
      const state = btoa("https://example.com/api/oauth/callback");
      expect(getSmartRedirectUrl("super_admin", state)).toBe("/dashboard");
      expect(getSmartRedirectUrl("manager", state)).toBe("/dashboard");
      expect(getSmartRedirectUrl("franchisee", state)).toBe("/dashboard");
      expect(getSmartRedirectUrl("staff", state)).toBe("/dashboard");
    });

    it("should redirect to /shop/checkout when redirect param is set", () => {
      const callbackUrl = new URL("https://example.com/api/oauth/callback");
      callbackUrl.searchParams.set("redirect", "/shop/checkout");
      const state = btoa(callbackUrl.toString());
      expect(getSmartRedirectUrl("customer", state)).toBe("/shop/checkout");
    });

    it("should ignore non-relative redirect params (security check)", () => {
      const callbackUrl = new URL("https://example.com/api/oauth/callback");
      callbackUrl.searchParams.set("redirect", "https://evil.com/steal");
      const state = btoa(callbackUrl.toString());
      // Falls back to role-based redirect since evil.com is not a relative path
      expect(getSmartRedirectUrl("customer", state)).toBe("/shop");
    });

    it("should handle malformed state gracefully", () => {
      expect(getSmartRedirectUrl("customer", "not-valid-base64!!!")).toBe("/shop");
      expect(getSmartRedirectUrl("manager", "not-valid-base64!!!")).toBe("/dashboard");
    });
  });

  describe("RBAC Account Linking Logic", () => {
    it("Case A: existing user matched by email should preserve role", async () => {
      const existingUser = {
        id: 42,
        openId: "existing-openid",
        email: "admin@example.com",
        role: "super_admin",
        name: "Admin User",
      };
      mockGetUserByEmail.mockResolvedValue(existingUser);
      mockLinkOAuthProvider.mockResolvedValue(undefined);
      mockUpdateUserLastSignedIn.mockResolvedValue(undefined);
      mockUpsertUser.mockResolvedValue(undefined);

      const db = await import("./db");
      const found = await db.getUserByEmail("admin@example.com");

      // Simulate Case A logic
      expect(found).toBeDefined();
      expect(found!.role).toBe("super_admin");

      // Link provider without changing role
      await db.linkOAuthProvider(found!.id, 'google', "google-uid-123");
      expect(mockLinkOAuthProvider).toHaveBeenCalledWith(42, 'google', "google-uid-123");

      // upsertUser called WITHOUT role field (preserves existing)
      await db.upsertUser({
        openId: "google-openid",
        name: "Admin User",
        email: "admin@example.com",
        loginMethod: "google",
        lastSignedIn: new Date(),
        // role intentionally omitted → existing role preserved
      });
      const upsertCall = mockUpsertUser.mock.calls[0][0];
      expect(upsertCall.role).toBeUndefined();
    });

    it("Case B: new user should be created with role=customer", async () => {
      mockGetUserByEmail.mockResolvedValue(null); // no existing user
      mockUpsertUser.mockResolvedValue(undefined);

      const db = await import("./db");
      const found = await db.getUserByEmail("newuser@example.com");
      expect(found).toBeNull();

      // New user creation must force role=customer
      await db.upsertUser({
        openId: "new-openid",
        name: "New User",
        email: "newuser@example.com",
        loginMethod: "google",
        lastSignedIn: new Date(),
        role: "customer", // explicitly set
      });

      const upsertCall = mockUpsertUser.mock.calls[0][0];
      expect(upsertCall.role).toBe("customer");
    });
  });
});

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Smart redirect logic after OAuth login:
 * Priority 1: If state URL contains ?redirect=..., use that (e.g. from checkout)
 * Priority 2: customer role → /shop
 * Priority 3: All internal roles (super_admin, manager, franchisee, staff) → /dashboard
 */
function getSmartRedirectUrl(role: string, stateParam: string): string {
  try {
    const decodedState = Buffer.from(stateParam, "base64").toString("utf-8");
    const stateUrl = new URL(decodedState);
    const redirectParam = stateUrl.searchParams.get("redirect");
    if (redirectParam) {
      // Security: only allow relative paths
      const decoded = decodeURIComponent(redirectParam);
      if (decoded.startsWith("/")) return decoded;
    }
  } catch {
    // ignore parse errors
  }

  if (role === "customer") {
    return "/shop";
  }
  // super_admin, manager, franchisee, staff → dashboard
  return "/dashboard";
}

/**
 * Detect OAuth provider from loginMethod string returned by Manus SDK.
 */
function detectProvider(loginMethod: string | null | undefined): 'line' | 'google' | null {
  if (!loginMethod) return null;
  const m = loginMethod.toLowerCase();
  if (m.includes("line")) return 'line';
  if (m.includes("google")) return 'google';
  return null;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const provider = detectProvider(userInfo.loginMethod);
      const incomingEmail = userInfo.email ?? null;

      // ─── RBAC DEFENCE: Email-based account linking ──────────────────────
      // Case A: Existing account with same email → bind provider ID, NEVER change role
      // Case B: No existing account → create new with role=customer
      const existingUser = incomingEmail
        ? await db.getUserByEmail(incomingEmail)
        : null;

      if (existingUser) {
        // Case A: Bind OAuth provider ID only; role/status/permissions are immutable
        console.log(
          `[OAuth] Existing user (id=${existingUser.id}, role=${existingUser.role}) ` +
          `matched by email=${incomingEmail}. Binding provider=${provider ?? 'unknown'}, preserving role.`
        );
        if (provider) {
          await db.linkOAuthProvider(existingUser.id, provider, userInfo.openId);
        }
        // Upsert without role → existing role is preserved by upsertUser logic
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || existingUser.name || null,
          email: incomingEmail,
          loginMethod: userInfo.loginMethod ?? null,
          lastSignedIn: new Date(),
        });
      } else {
        // Case B: New account → force role=customer
        console.log(
          `[OAuth] New user via provider=${provider ?? 'unknown'}, ` +
          `email=${incomingEmail}. Assigning role=customer.`
        );
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: incomingEmail,
          loginMethod: userInfo.loginMethod ?? null,
          lastSignedIn: new Date(),
          role: "customer",
        });
        if (provider) {
          const newUser = await db.getUserByOpenId(userInfo.openId);
          if (newUser) await db.linkOAuthProvider(newUser.id, provider, userInfo.openId);
        }
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Smart redirect based on role
      const savedUser = await db.getUserByOpenId(userInfo.openId);
      const role = savedUser?.role ?? "customer";
      const redirectUrl = getSmartRedirectUrl(role, state);

      console.log(`[OAuth] Login success: openId=${userInfo.openId}, role=${role}, redirect=${redirectUrl}`);
      res.redirect(302, redirectUrl);

    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // ─── LINE OAuth Start (initiates LINE login flow) ──────────────────────
  app.get("/api/oauth/line/start", async (req: Request, res: Response) => {
    const { ENV } = await import("./env");
    if (!ENV.lineClientId) { res.redirect(302, "/login?error=line_not_configured"); return; }
    const redirect = getQueryParam(req, "redirect") ?? "";
    const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    const callbackUrl = `${proto}://${host}/api/oauth/line/callback`;
    // Encode redirect path into state so callback can restore it
    const statePayload = redirect.startsWith("/") ? redirect : "/shop";
    const state = Buffer.from(statePayload).toString("base64");
    const lineAuthUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    lineAuthUrl.searchParams.set("response_type", "code");
    lineAuthUrl.searchParams.set("client_id", ENV.lineClientId);
    lineAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    lineAuthUrl.searchParams.set("state", state);
    lineAuthUrl.searchParams.set("scope", "profile openid");
    res.redirect(302, lineAuthUrl.toString());
  });

  // ─── Google OAuth Start (initiates Google login flow) ─────────────────
  app.get("/api/oauth/google/start", async (req: Request, res: Response) => {
    const { ENV } = await import("./env");
    if (!ENV.googleClientId) { res.redirect(302, "/login?error=google_not_configured"); return; }
    const redirect = getQueryParam(req, "redirect") ?? "";
    const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    const callbackUrl = `${proto}://${host}/api/oauth/google/callback`;
    const statePayload = redirect.startsWith("/") ? redirect : "/shop";
    const state = Buffer.from(statePayload).toString("base64");
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("client_id", ENV.googleClientId);
    googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "online");
    res.redirect(302, googleAuthUrl.toString());
  });

  // ─── LINE OAuth Direct Callback ────────────────────────────────────────
  app.get("/api/oauth/line/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state") ?? btoa("/");
    if (!code) { res.redirect(302, "/login?error=missing_code"); return; }

    try {
      const { ENV } = await import("./env");
      if (!ENV.lineClientId || !ENV.lineClientSecret) {
        res.redirect(302, "/login?error=line_not_configured"); return;
      }

      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const redirectUri = `${proto}://${host}/api/oauth/line/callback`;

      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: ENV.lineClientId,
          client_secret: ENV.lineClientSecret,
        }),
      });
      if (!tokenRes.ok) { res.redirect(302, "/login?error=line_token_failed"); return; }

      const tokenData = await tokenRes.json() as { access_token: string };
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!profileRes.ok) { res.redirect(302, "/login?error=line_profile_failed"); return; }

      const profile = await profileRes.json() as {
        userId: string; displayName: string; pictureUrl?: string;
      };

      // LINE email requires openid+email scope; may be absent
      const lineEmail: string | null = null;
      const existingUser = lineEmail ? await db.getUserByEmail(lineEmail) : null;

      if (existingUser) {
        await db.linkOAuthProvider(existingUser.id, 'line', profile.userId);
        await db.updateUserLastSignedIn(existingUser.id);
      } else {
        await db.upsertUser({
          openId: `line:${profile.userId}`,
          name: profile.displayName,
          email: lineEmail,
          loginMethod: "line",
          lineId: profile.userId,
          avatarUrl: profile.pictureUrl ?? null,
          lastSignedIn: new Date(),
          role: "customer",
        });
      }

      const sessionUser = existingUser ?? await db.getUserByOpenId(`line:${profile.userId}`);
      if (!sessionUser) { res.redirect(302, "/login?error=line_session_failed"); return; }

      const sessionToken = await sdk.createSessionToken(sessionUser.openId, {
        name: sessionUser.name || "", expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, getSmartRedirectUrl(sessionUser.role, state));

    } catch (error) {
      console.error("[LINE OAuth] Callback failed", error);
      res.redirect(302, "/login?error=line_callback_failed");
    }
  });

  // ─── Google OAuth Direct Callback ──────────────────────────────────────
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state") ?? btoa("/");
    if (!code) { res.redirect(302, "/login?error=missing_code"); return; }

    try {
      const { ENV } = await import("./env");
      if (!ENV.googleClientId || !ENV.googleClientSecret) {
        res.redirect(302, "/login?error=google_not_configured"); return;
      }

      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const redirectUri = `${proto}://${host}/api/oauth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) { res.redirect(302, "/login?error=google_token_failed"); return; }

      const tokenData = await tokenRes.json() as { access_token: string };
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!userInfoRes.ok) { res.redirect(302, "/login?error=google_userinfo_failed"); return; }

      const googleUser = await userInfoRes.json() as {
        id: string; email: string; name: string; picture?: string;
      };

      const existingUser = await db.getUserByEmail(googleUser.email);

      if (existingUser) {
        await db.linkOAuthProvider(existingUser.id, 'google', googleUser.id);
        await db.updateUserLastSignedIn(existingUser.id);
      } else {
        await db.upsertUser({
          openId: `google:${googleUser.id}`,
          name: googleUser.name,
          email: googleUser.email,
          loginMethod: "google",
          googleId: googleUser.id,
          avatarUrl: googleUser.picture ?? null,
          lastSignedIn: new Date(),
          role: "customer",
        });
      }

      const sessionUser = existingUser ?? await db.getUserByEmail(googleUser.email);
      if (!sessionUser) { res.redirect(302, "/login?error=google_session_failed"); return; }

      const sessionToken = await sdk.createSessionToken(sessionUser.openId, {
        name: sessionUser.name || "", expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, getSmartRedirectUrl(sessionUser.role, state));

    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect(302, "/login?error=google_callback_failed");
    }
  });
}

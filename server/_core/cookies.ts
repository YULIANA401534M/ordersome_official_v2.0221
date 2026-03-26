import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request): boolean {
  const hostname = req.hostname ?? "";
  return LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
}

/**
 * Build session cookie options suitable for Railway + Cloudflare deployments.
 *
 * Key decisions:
 * - secure: always true in non-local environments (Railway serves HTTPS via Cloudflare).
 *   We do NOT rely on req.protocol because trust-proxy may not be configured on
 *   every deployment target.
 * - sameSite: "lax" — frontend and backend share the same origin (ordersome.com.tw),
 *   so SameSite=None is NOT needed. Cloudflare Free plan strips SameSite=None cookies,
 *   so we use "lax" which works correctly for same-origin deployments.
 * - domain: intentionally omitted — let the browser derive it from the Set-Cookie
 *   response origin. Hard-coding a domain breaks custom-domain and subdomain setups.
 * - httpOnly: true — prevents JS access to the session token.
 */
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const local = isLocalRequest(req);

  return {
    httpOnly: true,
    path: "/",
    secure: !local,          // true on Railway/Cloudflare, false on localhost
    sameSite: "lax",  // same-origin: lax works; Cloudflare Free plan strips "none"
    // domain: not set — browser derives from response origin automatically
  };
}

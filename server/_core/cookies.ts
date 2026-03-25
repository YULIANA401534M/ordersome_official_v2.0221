import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request): boolean {
  const hostname = req.hostname ?? "";
  return LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
}

function isSecureRequest(req: Request): boolean {
  // With `app.set("trust proxy", 1)` Express will set req.protocol to "https"
  // when the upstream proxy (Railway / Cloudflare) forwards via HTTPS.
  if (req.protocol === "https") return true;

  // Fallback: check the raw header in case trust-proxy isn't set.
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isLocalRequest(req) ? false : true;

  return {
    httpOnly: true,
    path: "/",
    // sameSite:"none" is required for cross-origin cookie delivery
    // (e.g. Railway backend + Cloudflare-proxied frontend on a custom domain).
    // Browsers require secure:true whenever sameSite is "none".
    sameSite: secure ? "none" : "lax",
    secure,
    // Do NOT set domain — let the browser derive it from the response origin.
    // Hard-coding a domain breaks deployments on subdomains or custom domains.
  };
}

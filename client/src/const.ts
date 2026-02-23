export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate Manus OAuth login URL.
 * @param returnPath - Optional relative path to redirect back to after login
 *   (e.g. '/shop/checkout'). The server's getSmartRedirectUrl() reads this
 *   from the state parameter to determine the post-login destination.
 */
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Encode state: base64 of a URL that optionally includes ?redirect=<returnPath>
  let stateUrl: string;
  if (returnPath && returnPath.startsWith("/")) {
    const u = new URL(redirectUri);
    u.searchParams.set("redirect", returnPath);
    stateUrl = u.toString();
  } else {
    stateUrl = redirectUri;
  }
  const state = btoa(stateUrl);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

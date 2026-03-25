export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Return the login page path.
 * Previously pointed to Manus OAuth portal; now uses the built-in
 * LINE / Google / Email login page at /login.
 *
 * @param _returnPath - Kept for API compatibility but currently unused.
 */
export const getLoginUrl = (_returnPath?: string) => {
  return "/login";
};

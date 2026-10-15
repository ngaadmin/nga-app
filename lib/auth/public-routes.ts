import { PRIVACY_POLICY_PATH } from "@/lib/legal/paths";

/**
 * Routes that must stay reachable with no session.
 * Middleware must not send these through an auth redirect.
 */
export function isPublicAppPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return normalized === PRIVACY_POLICY_PATH;
}

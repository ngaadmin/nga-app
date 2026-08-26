import type { HubIntroId } from "@/lib/dashboard/hub-intro/types";

/** Map a dashboard pathname to a hub intro, or null if this screen has none. */
export function hubIntroIdFromPathname(pathname: string): HubIntroId | null {
  if (pathname.startsWith("/dashboard/academy/lesson")) return null;
  if (pathname === "/dashboard/academy" || pathname.startsWith("/dashboard/academy/")) {
    return "academy";
  }
  if (
    pathname === "/dashboard/launchpad" ||
    pathname.startsWith("/dashboard/launchpad/")
  ) {
    return "launchpad";
  }
  if (
    pathname === "/dashboard/community" ||
    pathname.startsWith("/dashboard/community/")
  ) {
    return "community";
  }
  if (pathname === "/dashboard/vault" || pathname.startsWith("/dashboard/vault/")) {
    return "vault";
  }
  return null;
}

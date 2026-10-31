import { SCHOOL_PATH } from "@/lib/onboarding/guest-session";

/**
 * The legal footer (policy links and disclaimer) shows only on the public
 * landing pages. Every other in-app screen, signed in or not, has no footer.
 */
export const APP_FOOTER_PATHS: ReadonlySet<string> = new Set(["/", SCHOOL_PATH]);

export function showsAppFooter(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return APP_FOOTER_PATHS.has(path);
}

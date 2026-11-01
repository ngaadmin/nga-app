/**
 * The legal footer (policy links and disclaimer) shows only on the app's
 * landing page (the welcome screen at `/`). Every other screen, signed in or
 * not, has no footer: dashboard, Academy map and lessons, settings, parent
 * screens, sign-in, sign-up, the cohort picker and the school pages.
 */
export const APP_FOOTER_PATHS: ReadonlySet<string> = new Set(["/"]);

export function showsAppFooter(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return APP_FOOTER_PATHS.has(path);
}

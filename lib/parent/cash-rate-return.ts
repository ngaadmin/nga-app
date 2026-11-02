/**
 * "Set cash rate" from a child's page in the Parent Hub: go to the cash rate
 * in Settings (behind the Parent PIN), then come back to that child's page.
 */

export const CASH_RATE_OPEN_PARAM = "cashRate";
export const RETURN_TO_PARAM = "returnTo";
export const HUB_CHILD_PARAM = "child";

const HUB_PATH = "/dashboard/parent";

export function hubChildHref(childId: string): string {
  return `${HUB_PATH}?${HUB_CHILD_PARAM}=${encodeURIComponent(childId)}`;
}

export function cashRateSettingsHref(childId: string): string {
  const params = new URLSearchParams({
    [CASH_RATE_OPEN_PARAM]: "open",
    [RETURN_TO_PARAM]: hubChildHref(childId),
  });
  return `/dashboard/settings?${params.toString()}`;
}

/**
 * Only a Parent Hub path on this site is allowed back. Anything else
 * (another site, "//host", a different page) is dropped.
 */
export function safeHubReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  let url: URL;
  try {
    url = new URL(value, "https://app.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://app.invalid" || url.pathname !== HUB_PATH) return null;
  const child = url.searchParams.get(HUB_CHILD_PARAM);
  return child ? hubChildHref(child) : HUB_PATH;
}

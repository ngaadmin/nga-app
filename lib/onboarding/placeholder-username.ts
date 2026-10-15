/**
 * Internal unique keys only — never a public account name.
 * Trigger stub: `u` + 19 hex. Settings fallback: `p` + 19 hex.
 * Teacher signup fallback: `t` + 19 hex.
 */
const INTERNAL_PLACEHOLDER_USERNAME = /^[upt][0-9a-f]{19}$/i;

export function isInternalPlaceholderUsername(
  username: string | null | undefined,
): boolean {
  return INTERNAL_PLACEHOLDER_USERNAME.test(username?.trim() ?? "");
}

/** Public username — never an internal `u…` / `p…` / `t…` stub. */
export function displayUsernameOrEmpty(
  username: string | null | undefined,
): string {
  const trimmed = username?.trim() ?? "";
  if (!trimmed || isInternalPlaceholderUsername(trimmed)) {
    return "";
  }
  return trimmed;
}

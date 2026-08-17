/**
 * Internal unique keys only — never a public parent handle.
 * Trigger stub: `u` + 19 hex. Settings fallback: `p` + 19 hex.
 */
const INTERNAL_PLACEHOLDER_USERNAME = /^[up][0-9a-f]{19}$/i;

export function isInternalPlaceholderUsername(
  username: string | null | undefined,
): boolean {
  return INTERNAL_PLACEHOLDER_USERNAME.test(username?.trim() ?? "");
}

/** Public learner username — never an internal `u…` / `p…` stub. */
export function displayUsernameOrEmpty(
  username: string | null | undefined,
): string {
  const trimmed = username?.trim() ?? "";
  if (!trimmed || isInternalPlaceholderUsername(trimmed)) {
    return "";
  }
  return trimmed;
}

/** Stub from the auth.users → profiles trigger: `u` + first 19 hex chars of the uuid. */
const INTERNAL_PLACEHOLDER_USERNAME = /^u[0-9a-f]{19}$/i;

export function isInternalPlaceholderUsername(
  username: string | null | undefined,
): boolean {
  return INTERNAL_PLACEHOLDER_USERNAME.test(username?.trim() ?? "");
}

/** Public display name — never the internal `u…` stub. */
export function displayUsernameOrEmpty(
  username: string | null | undefined,
): string {
  const trimmed = username?.trim() ?? "";
  if (!trimmed || isInternalPlaceholderUsername(trimmed)) {
    return "";
  }
  return trimmed;
}

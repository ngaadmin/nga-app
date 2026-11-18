/**
 * Credentials must never travel in a URL. A native form submit before the page
 * hydrates is a GET by default, which would put every named field in the query
 * string, browser history and server logs. This guard recognises query keys
 * that look like credentials so middleware can strip them. It only ever looks
 * at key names. Values are never read, logged or returned.
 */

const EXACT_CREDENTIAL_KEYS = new Set([
  "pass",
  "passwd",
  "pwd",
  "passcode",
  "pin",
  "credential",
  "credentials",
  "secret",
  "parentpin",
  "learnerpin",
  "userpin",
  "newpin",
  "oldpin",
  "currentpin",
  "confirmpin",
  "repeatpin",
  "confirmpasscode",
  "newpasscode",
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isCredentialQueryParam(key: string): boolean {
  const normalized = normalizeKey(key);
  if (!normalized) return false;
  if (normalized.includes("password")) return true;
  return EXACT_CREDENTIAL_KEYS.has(normalized);
}

/**
 * Returns a copy of the URL without credential-like query params, or null when
 * the URL has none (nothing to change).
 */
export function stripCredentialQueryParams(url: URL): URL | null {
  const keys = Array.from(new Set(url.searchParams.keys()));
  const credentialKeys = keys.filter(isCredentialQueryParam);
  if (credentialKeys.length === 0) return null;

  const cleaned = new URL(url.toString());
  for (const key of credentialKeys) {
    cleaned.searchParams.delete(key);
  }
  return cleaned;
}

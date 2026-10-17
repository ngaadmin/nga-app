/** Parental consent / approval links remain usable for 24 hours. */
export const CONSENT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** True when the token's createdAt is still inside the consent TTL window. */
export function isConsentTokenUnexpired(createdAtIso: string): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt <= CONSENT_TOKEN_TTL_MS;
}

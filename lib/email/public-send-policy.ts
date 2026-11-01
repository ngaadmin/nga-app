/**
 * Email types the public `/api/email/send` route may deliver.
 * Each one requires a server-stored approval token. The recipient and
 * username come from that row, not from the request body.
 * Welcome, recovery, invite, and deletion mail are sent only by server actions.
 */
export const PUBLIC_CONSENT_EMAIL_TYPES = [
  "EXPLORER_PARENT",
  "PATHFINDER_PARENT",
] as const;

export type PublicConsentEmailType = (typeof PUBLIC_CONSENT_EMAIL_TYPES)[number];

export function isPublicConsentEmailType(
  value: unknown,
): value is PublicConsentEmailType {
  return (
    typeof value === "string" &&
    (PUBLIC_CONSENT_EMAIL_TYPES as readonly string[]).includes(value)
  );
}

export function storedConsentMatchesEmailType(
  type: PublicConsentEmailType,
  kind: "vpc" | "parent_claim",
): boolean {
  if (type === "PATHFINDER_PARENT") return kind === "parent_claim";
  return kind === "vpc";
}

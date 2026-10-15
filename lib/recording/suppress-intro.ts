import "server-only";

/**
 * TODO: remove after recordings
 *
 * First-visit intros closed for screen-recording accounts only:
 * - academy, launchpad, community, vault ("Let's go")
 * - medals ("Let's go")
 * - vault-add-money (first deposit)
 * - parent-first-welcome
 *
 * Manual help (the "i" button, module preview, coming soon, consent) stays.
 */

/** Used when RECORDING_SUPPRESS_INTRO_USERS is unset or blank. */
export const RECORDING_SUPPRESS_INTRO_USERS_FALLBACK = [
  "cath+recteacher1015@nextgenachievers.com.au",
  "delta3",
  "delta4",
  "delta7",
  "delta9",
  "cathexp1015",
  "cathpf1015",
  "cathmav1015",
] as const;

export const RECORDING_SUPPRESSED_INTRO_IDS = [
  "academy",
  "launchpad",
  "community",
  "vault",
  "medals",
  "vault-add-money",
  "parent-first-welcome",
] as const;

function parseRecordingSuppressIntroList(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Allow-list for this process. A non-empty env value replaces the fallback. */
export function recordingSuppressIntroIdentities(): readonly string[] {
  const raw = process.env.RECORDING_SUPPRESS_INTRO_USERS;
  if (typeof raw !== "string" || raw.trim() === "") {
    return RECORDING_SUPPRESS_INTRO_USERS_FALLBACK;
  }
  return parseRecordingSuppressIntroList(raw);
}

/** Case-insensitive match on username or email. "+" in addresses is kept. */
export function matchesRecordingSuppressIntro(
  candidates: readonly string[],
): boolean {
  const allow = new Set(
    recordingSuppressIntroIdentities().map((identity) => identity.toLowerCase()),
  );
  return candidates.some((candidate) => {
    if (typeof candidate !== "string") return false;
    const value = candidate.trim().toLowerCase();
    return value.length > 0 && allow.has(value);
  });
}

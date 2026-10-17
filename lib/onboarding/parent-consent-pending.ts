import { isConsentTokenUnexpired } from "@/lib/auth/consent-token-ttl";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import {
  getMasteryCohortFromBirthYear,
  parseMasteryCohort,
  requiresParentConsent,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import {
  enforceCohortAccountState,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  findRegisteredAccountByUsername,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { EMAIL_PATTERN } from "@/lib/validation/email";

export const PENDING_PARENT_CONSENT_KEY = "nga_pending_parent_consent_v1";

export type PendingParentConsent = {
  token: string;
  parentEmail: string;
  childUsername: string;
  kind: "vpc" | "parent_claim";
  cohort: MasteryCohort | null;
  createdAt: string;
  /** Explorer login password digest collected at signup (field name historical). */
  passcodeHash?: string;
};

export type ConsentTokenLookup =
  | { status: "valid"; pending: PendingParentConsent }
  /** Signed token past TTL — server does not return claims; local may fill UX. */
  | { status: "expired"; pending: PendingParentConsent | null }
  | { status: "invalid" };

export type ResendParentConsentResult = {
  token: string;
  childUsername: string;
  /** Present only when local registry/claims were used for the resend. */
  parentEmail?: string;
};

type PendingConsentStore = {
  entries: PendingParentConsent[];
};

function isConsentStillValid(entry: PendingParentConsent): boolean {
  if (!isConsentTokenUnexpired(entry.createdAt)) return false;
  return entry.kind === "vpc";
}

/** Accept the current shape and older rows that stored a birth year. */
function normalizePending(value: unknown): PendingParentConsent | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as Partial<PendingParentConsent> & { birthYear?: unknown };
  if (
    typeof parsed.token !== "string" ||
    typeof parsed.parentEmail !== "string" ||
    typeof parsed.childUsername !== "string" ||
    typeof parsed.createdAt !== "string"
  ) {
    return null;
  }

  const cohortFromYear =
    typeof parsed.birthYear === "number" && Number.isInteger(parsed.birthYear)
      ? getMasteryCohortFromBirthYear(parsed.birthYear)
      : null;
  const cohort = parseMasteryCohort(parsed.cohort) ?? cohortFromYear;
  const kind =
    parsed.kind === "vpc" || parsed.kind === "parent_claim"
      ? parsed.kind
      : cohort && requiresParentConsent(cohort)
        ? "vpc"
        : cohort === "pathfinder"
          ? "parent_claim"
          : null;
  if (!kind) return null;

  return {
    token: parsed.token,
    parentEmail: parsed.parentEmail,
    childUsername: parsed.childUsername,
    kind,
    cohort,
    createdAt: parsed.createdAt,
    passcodeHash:
      typeof parsed.passcodeHash === "string" && parsed.passcodeHash.trim()
        ? parsed.passcodeHash.trim()
        : undefined,
  };
}

/**
 * Pending consent must survive email opens in a new tab/device. Production
 * `readPersisted` is sessionStorage-only, so mirror this key in localStorage.
 */
function readPendingConsentRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const local = window.localStorage.getItem(PENDING_PARENT_CONSENT_KEY);
    if (local) return local;
  } catch {
    // ignore quota / privacy mode
  }
  return readPersisted(PENDING_PARENT_CONSENT_KEY);
}

function writePendingConsentRaw(value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_PARENT_CONSENT_KEY, value);
  } catch {
    // ignore quota / privacy mode
  }
  writePersisted(PENDING_PARENT_CONSENT_KEY, value);
}

function removePendingConsentRaw(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_PARENT_CONSENT_KEY);
  } catch {
    // ignore
  }
  removePersisted(PENDING_PARENT_CONSENT_KEY);
}

/** Read all valid local pending consents (supports multiple children per parent). */
function readAllPendingConsents(): PendingParentConsent[] {
  if (typeof window === "undefined") return [];

  const raw = readPendingConsentRaw();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PendingConsentStore | PendingParentConsent;
    let entries: PendingParentConsent[] = [];

    if (Array.isArray((parsed as PendingConsentStore)?.entries)) {
      entries = (parsed as PendingConsentStore).entries.flatMap((entry) => {
        const normalized = normalizePending(entry);
        return normalized ? [normalized] : [];
      });
    } else {
      const normalized = normalizePending(parsed);
      if (normalized) entries = [normalized];
    }

    const valid = entries.filter((entry) => isConsentStillValid(entry));

    if (valid.length !== entries.length) {
      writeAllPendingConsents(valid);
    }

    return valid;
  } catch {
    return [];
  }
}

function writeAllPendingConsents(entries: PendingParentConsent[]): void {
  if (entries.length === 0) {
    removePendingConsentRaw();
    return;
  }
  const store: PendingConsentStore = { entries };
  writePendingConsentRaw(JSON.stringify(store));
}

function upsertLocalPendingConsent(pending: PendingParentConsent): void {
  const usernameKey = pending.childUsername.trim().toLowerCase();
  const next = readAllPendingConsents().filter(
    (entry) =>
      entry.token !== pending.token &&
      entry.childUsername.trim().toLowerCase() !== usernameKey,
  );
  next.push(pending);
  writeAllPendingConsents(next);
}

function findLocalPendingByToken(token: string): PendingParentConsent | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  return (
    readAllPendingConsents().find((entry) => entry.token === trimmed) ?? null
  );
}

/** Most recent local pending consent (compat helper for guest save UI). */
export function readPendingParentConsent(): PendingParentConsent | null {
  const entries = readAllPendingConsents();
  return entries[entries.length - 1] ?? null;
}

/** Latest local pending consent for this learner username, if still on-device. */
export function findLocalPendingForUsername(
  username: string,
): PendingParentConsent | null {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  const matches = readAllPendingConsents().filter(
    (entry) => entry.childUsername.trim().toLowerCase() === key,
  );
  return matches[matches.length - 1] ?? null;
}

/** Local pending consents addressed to this parent/guardian email. */
export function listPendingConsentsForEmail(
  email: string,
): PendingParentConsent[] {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !EMAIL_PATTERN.test(normalized)) return [];
  return readAllPendingConsents().filter(
    (entry) => entry.parentEmail.trim().toLowerCase() === normalized,
  );
}

/** True when local pending claims still match the signed token payload. */
function localPendingMatchesSignedClaims(
  local: PendingParentConsent,
  signed: PendingParentConsent,
): boolean {
  if (
    local.parentEmail.trim().toLowerCase() !==
    signed.parentEmail.trim().toLowerCase()
  ) {
    return false;
  }
  if (local.childUsername.trim() !== signed.childUsername.trim()) {
    return false;
  }
  if (local.kind !== signed.kind) {
    return false;
  }
  const localHash = local.passcodeHash?.trim() ?? "";
  const signedHash = signed.passcodeHash?.trim() ?? "";
  return localHash === signedHash;
}

async function fetchConsentTokenLookup(
  token: string,
): Promise<ConsentTokenLookup> {
  try {
    const response = await fetch(
      `/api/auth/consent-token?token=${encodeURIComponent(token)}`,
    );
    const json = (await response.json().catch(() => null)) as {
      success?: boolean;
      expired?: boolean;
      pending?: PendingParentConsent;
    } | null;

    if (response.status === 410 || json?.expired === true) {
      // Server intentionally omits claims for expired tokens.
      return {
        status: "expired",
        pending: findLocalPendingByToken(token),
      };
    }

    if (!response.ok || json?.success !== true || !json.pending) {
      return { status: "invalid" };
    }

    return { status: "valid", pending: json.pending };
  } catch {
    return { status: "invalid" };
  }
}

function mergeLocalPendingClaims(
  signed: PendingParentConsent,
): PendingParentConsent {
  const local = findLocalPendingByToken(signed.token);
  if (local) {
    if (localPendingMatchesSignedClaims(local, signed)) {
      return local;
    }
    // Local record was altered - discard that entry and trust signed claims.
    clearPendingParentConsent(signed.token);
  }
  return signed;
}

/**
 * Inspect a consent link: valid (full claims), expired (local claims only), or invalid.
 */
export async function lookupConsentToken(
  token: string,
): Promise<ConsentTokenLookup> {
  const trimmed = token.trim();
  if (!trimmed) return { status: "invalid" };

  const lookup = await fetchConsentTokenLookup(trimmed);
  if (lookup.status === "invalid") return lookup;
  if (lookup.status === "expired") return lookup;
  if (!lookup.pending) return { status: "invalid" };

  return {
    status: "valid",
    pending: mergeLocalPendingClaims(lookup.pending),
  };
}

/**
 * Resolve pending consent for an email/magic link token.
 * Always verifies the signed token; same-device local storage is used only when
 * its claims still match the signed payload (rejects client-altered records).
 * Expired tokens return null — use {@link lookupConsentToken} for resend UX.
 */
export async function readPendingParentConsentByToken(
  token: string,
): Promise<PendingParentConsent | null> {
  const lookup = await lookupConsentToken(token);
  return lookup.status === "valid" ? lookup.pending : null;
}

/**
 * Issue a fresh 24h approval link for a stored Explorer consent request and
 * email it to the parent address on that request. Local claims are not used
 * as a recipient.
 */
export async function resendParentConsentApproval(
  token: string,
): Promise<ResendParentConsentResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error(
      "This approval link is no longer valid, so we could not resend it.",
    );
  }

  let response: Response;
  try {
    response = await fetch("/api/auth/consent-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend", token: trimmed }),
    });
  } catch {
    throw new Error(
      "We could not reach the approval-link service. Check your connection and try again.",
    );
  }

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    token?: string;
    childUsername?: string;
    error?: string;
  } | null;

  if (response.ok && json?.success === true && json.token && json.childUsername) {
    const local = findLocalPendingByToken(trimmed);
    if (local) {
      upsertLocalPendingConsent({
        ...local,
        token: json.token,
        childUsername: json.childUsername,
        createdAt: new Date().toISOString(),
      });
    }
    return {
      token: json.token,
      childUsername: json.childUsername,
      parentEmail: local?.parentEmail,
    };
  }

  const serverError =
    typeof json?.error === "string" && json.error.trim()
      ? json.error.trim()
      : "We could not resend the approval email. Please try again shortly.";
  throw new Error(serverError);
}


/**
 * Master-dashboard approval: activate a PENDING_CONSENT learner linked to this
 * parent email without changing the signed-in master session.
 */
export function approvePendingLearnerAccount(input: {
  childUsername: string;
  masterEmail: string;
}): UserSession | null {
  const childUsername = input.childUsername.trim();
  const masterEmail = input.masterEmail.trim().toLowerCase();
  if (!childUsername || !masterEmail || !EMAIL_PATTERN.test(masterEmail)) {
    return null;
  }

  const account = findRegisteredAccountByUsername(childUsername);
  if (!account || account.accessMode !== "registered") return null;
  if (account.accountRole === "parent_master") return null;
  if (account.accountStatus !== "PENDING_CONSENT") return null;

  const linkedEmail = account.parentEmail?.trim().toLowerCase();
  if (!linkedEmail || linkedEmail !== masterEmail) return null;

  const activated = enforceCohortAccountState({
    ...account,
    consentApprovedAt: new Date().toISOString(),
    accountStatus: "ACTIVE",
  });
  upsertRegisteredAccount(activated);

  const usernameKey = childUsername.toLowerCase();
  writeAllPendingConsents(
    readAllPendingConsents().filter(
      (entry) => entry.childUsername.trim().toLowerCase() !== usernameKey,
    ),
  );

  return activated;
}


/** Clear one pending consent by token, or all when token omitted. */
export function clearPendingParentConsent(token?: string): void {
  if (!token) {
    removePendingConsentRaw();
    return;
  }
  const trimmed = token.trim();
  const next = readAllPendingConsents().filter(
    (entry) => entry.token !== trimmed,
  );
  writeAllPendingConsents(next);
}


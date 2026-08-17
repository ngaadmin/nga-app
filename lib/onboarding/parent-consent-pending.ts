import { isConsentTokenUnexpired } from "@/lib/auth/consent-token";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { requiresParentConsentForBirthYear } from "@/lib/dashboard/mastery-cohort";
import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import {
  captureGuestProgressSnapshot,
  ensureGuestProgressSnapshot,
} from "@/lib/onboarding/guest-progress-snapshot";
import {
  convertToRegisteredProfile,
  enforceCohortAccountState,
  hashCredential,
  readUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { resolvePasscodeHash } from "@/lib/onboarding/resolve-passcode-hash";
import {
  findRegisteredAccountByUsername,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";
import { EMAIL_PATTERN } from "@/lib/validation/email";
import { isFourDigitPin } from "@/lib/validation/pin";

export const PENDING_PARENT_CONSENT_KEY = "nga_pending_parent_consent_v1";

export type PendingParentConsent = {
  token: string;
  parentEmail: string;
  childUsername: string;
  birthYear: number;
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

function isConsentStillValid(createdAtIso: string, birthYear: number): boolean {
  if (!isConsentTokenUnexpired(createdAtIso)) return false;
  return requiresParentConsentForBirthYear(birthYear);
}

function isPendingShape(value: unknown): value is PendingParentConsent {
  if (!value || typeof value !== "object") return false;
  const parsed = value as PendingParentConsent;
  return (
    typeof parsed.token === "string" &&
    typeof parsed.parentEmail === "string" &&
    typeof parsed.childUsername === "string" &&
    Number.isInteger(parsed.birthYear) &&
    typeof parsed.createdAt === "string"
  );
}

/**
 * Ask the server to HMAC-sign a portable consent token.
 * Unsigned local tokens are no longer issued.
 */
export async function encodeConsentToken(input: {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  createdAt: string;
  passcodeHash?: string;
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/auth/consent-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      "We could not reach the approval-link service. Check your connection and try again.",
    );
  }

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    token?: string;
    error?: string;
  } | null;

  if (!response.ok || !json?.token) {
    if (typeof json?.error === "string" && json.error.trim()) {
      throw new Error(json.error.trim());
    }
    if (response.status === 429) {
      throw new Error(
        "Too many approval-link requests from this device. Wait about a minute, then try again.",
      );
    }
    throw new Error(
      "We could not create the parent approval link for this Explorer. Please try again.",
    );
  }
  return json.token;
}

/**
 * Legacy unsigned tokens are rejected. Prefer
 * {@link readPendingParentConsentByToken} which verifies via the server.
 */
export function decodeConsentToken(_token: string): PendingParentConsent | null {
  return null;
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
      entries = (parsed as PendingConsentStore).entries.filter(isPendingShape);
    } else if (isPendingShape(parsed)) {
      // Legacy single-object shape.
      entries = [parsed];
    }

    const valid = entries.filter((entry) =>
      isConsentStillValid(entry.createdAt, entry.birthYear),
    );

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
  if (local.birthYear !== signed.birthYear) {
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
 * Issue a fresh 24h approval link for the same pending Explorer profile and
 * email it to the parent. Prefers server-side resend from the signed token
 * (works cross-device without leaking claims). Falls back to same-device local
 * claims when the server cannot verify the token.
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

  // 1) Server resend: verifies signature (expired OK), emails, returns no PII.
  let serverRejectedAsInvalid = false;
  try {
    const response = await fetch("/api/auth/consent-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend", token: trimmed }),
    });
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

    // Invalid / unverifiable token → try same-device local claims.
    if (response.status === 400) {
      serverRejectedAsInvalid = true;
    } else {
      throw new Error(serverError);
    }
  } catch (error) {
    if (!serverRejectedAsInvalid) {
      // Surface non-network failures (429/502/etc). Network errors fall through.
      if (
        error instanceof Error &&
        !/Failed to fetch|NetworkError|Load failed/i.test(error.message)
      ) {
        throw error;
      }
    }
  }

  // 2) Same-device fallback using local pending claims only.
  const local = findLocalPendingByToken(trimmed);
  if (!local) {
    throw new Error(
      "This approval link is no longer valid, so we could not resend it.",
    );
  }

  const account = findRegisteredAccountByUsername(local.childUsername);
  if (account?.accountStatus === "ACTIVE") {
    throw new Error(
      "This Explorer profile is already approved. No new approval email is needed.",
    );
  }

  const childUsername = (account?.username ?? local.childUsername).trim();
  const parentEmail = (account?.parentEmail ?? local.parentEmail)
    .trim()
    .toLowerCase();
  const birthYear = account?.birthYear ?? local.birthYear;
  const passcodeHash =
    account?.passcodeHash?.trim() || local.passcodeHash?.trim() || undefined;

  if (!parentEmail || !EMAIL_PATTERN.test(parentEmail)) {
    throw new Error(
      "We could not find a parent email on this pending profile to resend to.",
    );
  }
  if (!requiresParentConsentForBirthYear(birthYear)) {
    throw new Error(
      "Parent approval is only required for Explorer profiles (ages 10-12).",
    );
  }
  if (!passcodeHash) {
    throw new Error(
      "We could not resend approval for this profile. Ask your learner to restart signup.",
    );
  }

  const createdAt = new Date().toISOString();
  const nextToken = await encodeConsentToken({
    parentEmail,
    childUsername,
    birthYear,
    createdAt,
    passcodeHash,
  });

  const pending: PendingParentConsent = {
    token: nextToken,
    parentEmail,
    childUsername,
    birthYear,
    createdAt,
    passcodeHash,
  };

  upsertLocalPendingConsent(pending);

  const sendResult = await requestOnboardingEmailSend({
    type: "EXPLORER_PARENT_RESEND",
    recipientEmail: parentEmail,
    data: {
      username: childUsername,
      token: nextToken,
    },
  });

  if (!sendResult.success) {
    throw new Error(
      sendResult.error ||
        "We could not resend the approval email. Please try again shortly.",
    );
  }

  return {
    token: nextToken,
    childUsername,
    parentEmail,
  };
}

/**
 * Starts Explorer VPC: backs up guest progress, creates a PENDING_CONSENT
 * registered profile (no learner email), and stores a portable consent token.
 *
 * The same parent/guardian email may approve many child profiles — email is
 * never treated as a unique account key.
 */
export async function createPendingParentConsent(input: {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  /** Explorer login password (min 6 characters). */
  passcode?: string;
  passcodeHash?: string;
}): Promise<PendingParentConsent> {
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const childUsername = input.childUsername.trim();

  if (!parentEmail || !EMAIL_PATTERN.test(parentEmail)) {
    throw new Error(
      "Enter a valid parent or guardian email so they can approve this profile.",
    );
  }
  if (!childUsername) {
    throw new Error("Pick a username for your Explorer profile.");
  }
  if (!requiresParentConsentForBirthYear(input.birthYear)) {
    throw new Error(
      "Parent approval is only required for Explorer profiles (ages 10-12).",
    );
  }

  const existingAccount = findRegisteredAccountByUsername(childUsername);
  if (
    existingAccount &&
    existingAccount.accountStatus === "ACTIVE" &&
    existingAccount.accessMode === "registered"
  ) {
    throw new Error(
      "That username is already taken. Try a different username for this Explorer.",
    );
  }
  // PENDING_CONSENT profiles may be recreated (retry). A shared parent/guardian
  // email across different usernames is always allowed.

  const passcodeHash = resolvePasscodeHash(input);
  if (!passcodeHash) {
    throw new Error("Create a password (at least 6 characters) for this profile.");
  }

  const createdAt = new Date().toISOString();
  const token = await encodeConsentToken({
    parentEmail,
    childUsername,
    birthYear: input.birthYear,
    createdAt,
    passcodeHash,
  });

  captureGuestProgressSnapshot();

  // Explorers: PENDING_CONSENT, parentEmail + username (+ password hash), no learner email.
  // marketingOptIn is always false for minors — parent opts in on master signup.
  const pendingSession = convertToRegisteredProfile({
    username: childUsername,
    birthYear: input.birthYear,
    accountRole: "child",
    parentEmail,
    passcodeHash,
    accountStatus: "PENDING_CONSENT",
    marketingOptIn: false,
  });

  await finalizeRegisteredSignup(pendingSession, {
    explorerConsentToken: token,
  });

  const pending: PendingParentConsent = {
    token,
    parentEmail,
    childUsername,
    birthYear: input.birthYear,
    createdAt,
    passcodeHash,
  };

  upsertLocalPendingConsent(pending);

  return pending;
}

export type ApproveParentConsentOptions = {
  /** 4-digit Parent PIN set during consent approval. */
  parentPin?: string;
  parentPinHash?: string;
};

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

/** Simulated magic-link approval - activates parent-linked account and merges guest progress. */
export async function approveParentConsent(
  token: string,
  options: ApproveParentConsentOptions = {},
): Promise<UserSession | null> {
  const pending = await readPendingParentConsentByToken(token);
  if (!pending) return null;

  ensureGuestProgressSnapshot();

  let parentPinHash: string | undefined;
  if (typeof options.parentPinHash === "string" && options.parentPinHash.trim()) {
    parentPinHash = options.parentPinHash.trim();
  } else if (typeof options.parentPin === "string" && options.parentPin.length > 0) {
    if (!isFourDigitPin(options.parentPin)) {
      throw new Error("Parent PIN must be exactly 4 digits.");
    }
    parentPinHash = hashCredential(options.parentPin);
  }

  const existing = readUserSession();
  const consentApprovedAt = new Date().toISOString();

  let session: UserSession;
  if (
    existing?.accessMode === "registered" &&
    existing.username === pending.childUsername &&
    existing.birthYear === pending.birthYear
  ) {
    session = enforceCohortAccountState({
      ...existing,
      accessMode: "registered",
      learnerEmail: undefined,
      email: undefined,
      parentEmail: pending.parentEmail,
      passcodeHash: existing.passcodeHash ?? pending.passcodeHash,
      parentPinHash: parentPinHash ?? existing.parentPinHash,
      consentApprovedAt,
      accountStatus: "ACTIVE",
      marketingOptIn: false,
    });
    await finalizeRegisteredSignup(session, { skipEmail: true });
  } else {
    session = convertToRegisteredProfile({
      username: pending.childUsername,
      birthYear: pending.birthYear,
      accountRole: "child",
      parentEmail: pending.parentEmail,
      passcodeHash: pending.passcodeHash,
      parentPinHash,
      consentApprovedAt,
      accountStatus: "ACTIVE",
      marketingOptIn: false,
    });
    await finalizeRegisteredSignup(session, { skipEmail: true });
  }

  clearPendingParentConsent(token);
  return readUserSession() ?? session;
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


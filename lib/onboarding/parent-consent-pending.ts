import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { requiresParentConsentForBirthYear } from "@/lib/dashboard/mastery-cohort";
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
import {
  findRegisteredAccountByUsername,
} from "@/lib/onboarding/registered-accounts";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";

export const PENDING_PARENT_CONSENT_KEY = "nga_pending_parent_consent_v1";

export type PendingParentConsent = {
  token: string;
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  createdAt: string;
  /** Explorer handle passcode digest collected at signup. */
  passcodeHash?: string;
};

type PendingConsentStore = {
  entries: PendingParentConsent[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOUR_DIGIT_PATTERN = /^\d{4}$/;
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isConsentStillValid(createdAtIso: string, birthYear: number): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > CONSENT_TTL_MS) {
    return false;
  }
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
  const response = await fetch("/api/auth/consent-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    token?: string;
    error?: string;
  } | null;

  if (!response.ok || !json?.token) {
    throw new Error(
      json?.error ||
        "We could not create a secure parent approval link. Please try again.",
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

function resolvePasscodeHash(input: {
  passcode?: string;
  passcodeHash?: string;
}): string | undefined {
  if (typeof input.passcodeHash === "string" && input.passcodeHash.trim()) {
    return input.passcodeHash.trim();
  }
  if (typeof input.passcode === "string" && input.passcode.length > 0) {
    const trimmed = input.passcode.trim();
    if (trimmed.length < 6 && !FOUR_DIGIT_PATTERN.test(trimmed)) {
      throw new Error("Explorer password must be at least 6 characters.");
    }
    return hashCredential(trimmed);
  }
  return undefined;
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

async function fetchSignedPendingConsent(
  token: string,
): Promise<PendingParentConsent | null> {
  try {
    const response = await fetch(
      `/api/auth/consent-token?token=${encodeURIComponent(token)}`,
    );
    const json = (await response.json().catch(() => null)) as {
      success?: boolean;
      pending?: PendingParentConsent;
    } | null;
    if (!response.ok || !json?.pending) return null;
    return json.pending;
  } catch {
    return null;
  }
}

/**
 * Resolve pending consent for an email/magic link token.
 * Always verifies the signed token; same-device local storage is used only when
 * its claims still match the signed payload (rejects client-altered records).
 */
export async function readPendingParentConsentByToken(
  token: string,
): Promise<PendingParentConsent | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const signed = await fetchSignedPendingConsent(trimmed);
  if (!signed) return null;

  const local = findLocalPendingByToken(trimmed);
  if (local) {
    if (localPendingMatchesSignedClaims(local, signed)) {
      return local;
    }
    // Local record was altered - discard that entry and trust signed claims.
    clearPendingParentConsent(trimmed);
  }

  return signed;
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
    if (!FOUR_DIGIT_PATTERN.test(options.parentPin.trim())) {
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
      accountLifecycleStatus: "ACTIVE",
      accountState: "ACTIVE",
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

export function buildParentConsentApprovalPath(token: string): string {
  return `/onboarding/parent-consent?token=${encodeURIComponent(token)}`;
}

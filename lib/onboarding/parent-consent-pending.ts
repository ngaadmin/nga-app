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

/** Compact payload embedded in email-safe consent tokens (cross-device). */
type ConsentTokenPayloadV1 = {
  v: 1;
  e: string;
  u: string;
  y: number;
  c: string;
  p?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOUR_DIGIT_PATTERN = /^\d{4}$/;
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const withPad = padded + "=".repeat(padLen);
  const binary = atob(withPad);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isConsentStillValid(createdAtIso: string, birthYear: number): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > CONSENT_TTL_MS) {
    return false;
  }
  return requiresParentConsentForBirthYear(birthYear);
}

/**
 * Encode pending consent fields into a portable token so email CTAs work on
 * any device/browser (not only the child's local session storage).
 */
export function encodeConsentToken(input: {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  createdAt: string;
  passcodeHash?: string;
}): string {
  const payload: ConsentTokenPayloadV1 = {
    v: 1,
    e: input.parentEmail,
    u: input.childUsername,
    y: input.birthYear,
    c: input.createdAt,
  };
  if (input.passcodeHash) {
    payload.p = input.passcodeHash;
  }
  return toBase64Url(JSON.stringify(payload));
}

/** Decode a portable consent token. Returns null if malformed or expired. */
export function decodeConsentToken(token: string): PendingParentConsent | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  try {
    const raw = fromBase64Url(trimmed);
    const parsed = JSON.parse(raw) as Partial<ConsentTokenPayloadV1>;
    if (
      parsed.v !== 1 ||
      typeof parsed.e !== "string" ||
      typeof parsed.u !== "string" ||
      typeof parsed.y !== "number" ||
      !Number.isInteger(parsed.y) ||
      typeof parsed.c !== "string"
    ) {
      return null;
    }

    const parentEmail = parsed.e.trim().toLowerCase();
    const childUsername = parsed.u.trim();
    if (!parentEmail || !EMAIL_PATTERN.test(parentEmail) || !childUsername) {
      return null;
    }
    if (!isConsentStillValid(parsed.c, parsed.y)) {
      return null;
    }

    const passcodeHash =
      typeof parsed.p === "string" && parsed.p.trim()
        ? parsed.p.trim()
        : undefined;

    return {
      token: trimmed,
      parentEmail,
      childUsername,
      birthYear: parsed.y,
      createdAt: parsed.c,
      passcodeHash,
    };
  } catch {
    return null;
  }
}

function resolvePasscodeHash(input: {
  passcode?: string;
  passcodeHash?: string;
}): string | undefined {
  if (typeof input.passcodeHash === "string" && input.passcodeHash.trim()) {
    return input.passcodeHash.trim();
  }
  if (typeof input.passcode === "string" && input.passcode.length > 0) {
    if (!FOUR_DIGIT_PATTERN.test(input.passcode.trim())) {
      throw new Error("Explorer passcode must be exactly 4 digits.");
    }
    return hashCredential(input.passcode);
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

export function readPendingParentConsent(): PendingParentConsent | null {
  if (typeof window === "undefined") return null;

  const raw = readPendingConsentRaw();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingParentConsent;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.parentEmail !== "string" ||
      typeof parsed.childUsername !== "string" ||
      !Number.isInteger(parsed.birthYear) ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    if (!isConsentStillValid(parsed.createdAt, parsed.birthYear)) {
      clearPendingParentConsent();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Resolve pending consent for an email/magic link token.
 * Prefers same-device storage, then decodes portable self-contained tokens.
 */
export function readPendingParentConsentByToken(
  token: string,
): PendingParentConsent | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const pending = readPendingParentConsent();
  if (pending && pending.token === trimmed) return pending;

  return decodeConsentToken(trimmed);
}

/**
 * Starts Explorer VPC: backs up guest progress, creates a PENDING_CONSENT
 * registered profile (no learner email), and stores a portable consent token.
 */
export function createPendingParentConsent(input: {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  /** 4-digit Explorer handle passcode. */
  passcode?: string;
  passcodeHash?: string;
}): PendingParentConsent {
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const childUsername = input.childUsername.trim();

  if (!parentEmail || !EMAIL_PATTERN.test(parentEmail)) {
    throw new Error("A valid parent email is required.");
  }
  if (!childUsername) {
    throw new Error("Child nickname is required.");
  }
  if (!requiresParentConsentForBirthYear(input.birthYear)) {
    throw new Error(
      "Parent consent is only required for Explorers ages 10–12 (conservative age gate).",
    );
  }

  const passcodeHash = resolvePasscodeHash(input);
  const createdAt = new Date().toISOString();
  const token = encodeConsentToken({
    parentEmail,
    childUsername,
    birthYear: input.birthYear,
    createdAt,
    passcodeHash,
  });

  captureGuestProgressSnapshot();

  // Explorers: PENDING_CONSENT, parentEmail + username (+ passcode when provided), no learner email.
  const pendingSession = convertToRegisteredProfile({
    username: childUsername,
    birthYear: input.birthYear,
    accountRole: "child",
    parentEmail,
    passcodeHash,
    accountStatus: "PENDING_CONSENT",
  });

  // Token is created first so finalize can dispatch EXPLORER_PARENT with the approval link.
  finalizeRegisteredSignup(pendingSession, { explorerConsentToken: token });

  const pending: PendingParentConsent = {
    token,
    parentEmail,
    childUsername,
    birthYear: input.birthYear,
    createdAt,
    passcodeHash,
  };

  writePendingConsentRaw(JSON.stringify(pending));

  return pending;
}

export type ApproveParentConsentOptions = {
  /** 4-digit Parent PIN set during consent approval. */
  parentPin?: string;
  parentPinHash?: string;
};

/** Simulated magic-link approval — activates parent-linked account and merges guest progress. */
export function approveParentConsent(
  token: string,
  options: ApproveParentConsentOptions = {},
): UserSession | null {
  const pending = readPendingParentConsentByToken(token);
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
    });
    finalizeRegisteredSignup(session, { skipEmail: true });
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
    });
    finalizeRegisteredSignup(session, { skipEmail: true });
  }

  clearPendingParentConsent();
  return readUserSession() ?? session;
}

export function clearPendingParentConsent(): void {
  removePendingConsentRaw();
}

export function buildParentConsentApprovalPath(token: string): string {
  return `/onboarding/parent-consent?token=${encodeURIComponent(token)}`;
}

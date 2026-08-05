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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOUR_DIGIT_PATTERN = /^\d{4}$/;
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateConsentToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

export function readPendingParentConsent(): PendingParentConsent | null {
  if (typeof window === "undefined") return null;

  const raw = readPersisted(PENDING_PARENT_CONSENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingParentConsent;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.parentEmail !== "string" ||
      typeof parsed.childUsername !== "string" ||
      !Number.isInteger(parsed.birthYear)
    ) {
      return null;
    }

    const createdAt = Date.parse(parsed.createdAt);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > CONSENT_TTL_MS) {
      clearPendingParentConsent();
      return null;
    }

    if (!requiresParentConsentForBirthYear(parsed.birthYear)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readPendingParentConsentByToken(
  token: string,
): PendingParentConsent | null {
  const pending = readPendingParentConsent();
  if (!pending || pending.token !== token) return null;
  return pending;
}

/**
 * Starts Explorer VPC: backs up guest progress, creates a PENDING_CONSENT
 * registered profile (no learner email), and stores the consent token.
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
  const token = generateConsentToken();

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
    createdAt: new Date().toISOString(),
    passcodeHash,
  };

  if (typeof window !== "undefined") {
    writePersisted(PENDING_PARENT_CONSENT_KEY, JSON.stringify(pending));
  }

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
  if (typeof window === "undefined") return;
  removePersisted(PENDING_PARENT_CONSENT_KEY);
}

export function buildParentConsentApprovalPath(token: string): string {
  return `/onboarding/parent-consent?token=${encodeURIComponent(token)}`;
}

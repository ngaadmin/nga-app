import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { getMasteryCohortFromBirthYear } from "@/lib/dashboard/mastery-cohort";
import { captureGhostProgressSnapshot } from "@/lib/onboarding/ghost-progress-snapshot";
import {
  convertToRegisteredProfile,
  type UserSession,
} from "@/lib/onboarding/ghost-session";
import { finalizeRegisteredSignup } from "@/lib/onboarding/signup-finalize";

export const PENDING_PARENT_CONSENT_KEY = "nga_pending_parent_consent_v1";

export type PendingParentConsent = {
  token: string;
  parentEmail: string;
  childUsername: string;
  birthYear: number;
  createdAt: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateConsentToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

    if (getMasteryCohortFromBirthYear(parsed.birthYear) !== "explorer") {
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

export function createPendingParentConsent(input: {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
}): PendingParentConsent {
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const childUsername = input.childUsername.trim();

  if (!parentEmail || !EMAIL_PATTERN.test(parentEmail)) {
    throw new Error("A valid parent email is required.");
  }
  if (!childUsername) {
    throw new Error("Child nickname is required.");
  }
  if (getMasteryCohortFromBirthYear(input.birthYear) !== "explorer") {
    throw new Error("Parent consent is only required for Explorers under 14.");
  }

  captureGhostProgressSnapshot();

  const pending: PendingParentConsent = {
    token: generateConsentToken(),
    parentEmail,
    childUsername,
    birthYear: input.birthYear,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    writePersisted(PENDING_PARENT_CONSENT_KEY, JSON.stringify(pending));
  }

  return pending;
}

/** Simulated magic-link approval — creates parent-owned account and merges ghost progress. */
export function approveParentConsent(token: string): UserSession | null {
  const pending = readPendingParentConsentByToken(token);
  if (!pending) return null;

  captureGhostProgressSnapshot();

  const session = convertToRegisteredProfile({
    username: pending.childUsername,
    email: pending.parentEmail,
    birthYear: pending.birthYear,
    accountRole: "child",
    parentEmail: pending.parentEmail,
    consentApprovedAt: new Date().toISOString(),
  });

  finalizeRegisteredSignup(session);
  clearPendingParentConsent();

  return session;
}

export function clearPendingParentConsent(): void {
  if (typeof window === "undefined") return;
  removePersisted(PENDING_PARENT_CONSENT_KEY);
}

export function buildParentConsentApprovalPath(token: string): string {
  return `/onboarding/parent-consent?token=${encodeURIComponent(token)}`;
}

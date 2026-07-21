import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import { releaseGenericProfileId } from "@/lib/onboarding/generic-profile-id";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const GHOST_SESSION_STORAGE_KEY = "nga_ghost_session";

export const ONBOARDING_ENTRY_PATH = "/onboarding" as const;
export const ONBOARDING_START_PATH = "/onboarding/start" as const;
export const ONBOARDING_SIGN_UP_PATH = "/onboarding/sign-up" as const;
export const DASHBOARD_ACADEMY_PATH = "/dashboard/academy" as const;

export type AccessMode = "ghost" | "registered";

/** @deprecated Use AccessMode — kept for existing imports. */
export type GhostAccessMode = "ghost";

/** Explorers 10–13 · Titans 14+ (used later for retrospective gates). */
export type ComplianceTier = "explorer" | "titan";

export type GhostProfileInput = {
  username: string;
  birthYear: number;
  genericProfileId?: string;
};

export type RegisteredProfileInput = {
  username: string;
  email: string;
  birthYear: number;
};

export type UserSession = {
  accessMode: AccessMode;
  username: string;
  birthYear: number;
  complianceTier: ComplianceTier;
  createdAt: string;
  email?: string;
  genericProfileId?: string;
  convertedAt?: string;
};

/** @deprecated Use UserSession — kept for existing imports. */
export type GhostAccessSession = UserSession;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getComplianceTier(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): ComplianceTier {
  const age = referenceYear - birthYear;
  return age < 14 ? "explorer" : "titan";
}

function normalizeStoredSession(raw: unknown): UserSession | null {
  if (!raw || typeof raw !== "object") return null;

  const parsed = raw as Partial<UserSession>;
  if (typeof parsed.username !== "string" || !parsed.username.trim()) {
    return null;
  }
  if (!isEligibleBirthYear(Number(parsed.birthYear))) {
    return null;
  }

  const accessMode: AccessMode =
    parsed.accessMode === "registered" ? "registered" : "ghost";

  if (accessMode === "registered") {
    const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
    if (!email || !EMAIL_PATTERN.test(email)) {
      return null;
    }
  }

  const birthYear = Number(parsed.birthYear);

  return {
    accessMode,
    username: parsed.username.trim(),
    birthYear,
    complianceTier: getComplianceTier(birthYear),
    createdAt:
      typeof parsed.createdAt === "string"
        ? parsed.createdAt
        : new Date().toISOString(),
    email:
      accessMode === "registered" && typeof parsed.email === "string"
        ? parsed.email.trim().toLowerCase()
        : undefined,
    genericProfileId:
      typeof parsed.genericProfileId === "string"
        ? parsed.genericProfileId
        : undefined,
    convertedAt:
      typeof parsed.convertedAt === "string" ? parsed.convertedAt : undefined,
  };
}

export function createGhostAccessSession(
  input: GhostProfileInput,
): UserSession {
  const username = input.username.trim();
  const birthYear = input.birthYear;

  if (!username) {
    throw new Error("Username is required for ghost access.");
  }
  if (!isEligibleBirthYear(birthYear)) {
    throw new Error("Birth year is outside the eligible range.");
  }

  return {
    accessMode: "ghost",
    username,
    birthYear,
    complianceTier: getComplianceTier(birthYear),
    createdAt: new Date().toISOString(),
    genericProfileId: input.genericProfileId,
  };
}

export function convertToRegisteredProfile(
  input: RegisteredProfileInput,
): UserSession {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const birthYear = input.birthYear;

  if (!username) {
    throw new Error("Username is required.");
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error("A valid email is required.");
  }
  if (!isEligibleBirthYear(birthYear)) {
    throw new Error("Birth year is outside the eligible range.");
  }

  const existing = readUserSession();
  if (existing?.genericProfileId) {
    releaseGenericProfileId(existing.genericProfileId);
  }

  return {
    accessMode: "registered",
    username,
    email,
    birthYear,
    complianceTier: getComplianceTier(birthYear),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    convertedAt: new Date().toISOString(),
  };
}

export function saveUserSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  writePersisted(GHOST_SESSION_STORAGE_KEY, JSON.stringify(session));
}

/** @deprecated Use saveUserSession — kept for existing imports. */
export function saveGhostAccessSession(session: UserSession): void {
  saveUserSession(session);
}

export function readUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;

  const raw = readPersisted(GHOST_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeStoredSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** @deprecated Use readUserSession — kept for existing imports. */
export function readGhostAccessSession(): UserSession | null {
  return readUserSession();
}

export function clearUserSession(): void {
  if (typeof window === "undefined") return;
  removePersisted(GHOST_SESSION_STORAGE_KEY);
}

/** @deprecated Use clearUserSession — kept for existing imports. */
export function clearGhostAccessSession(): void {
  clearUserSession();
}

export function isGhostSession(session: UserSession | null): boolean {
  return session?.accessMode === "ghost";
}

/** True when the user completed the personalization gate (birth year + nickname). */
export function hasCompletedPersonalizationGate(
  session: UserSession | null,
): boolean {
  return (
    session !== null &&
    isEligibleBirthYear(session.birthYear) &&
    session.username.trim().length > 0
  );
}

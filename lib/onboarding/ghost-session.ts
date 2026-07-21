import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import {
  getMasteryCohortFromBirthYear,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
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
export const ONBOARDING_SIGN_UP_PENDING_PATH =
  "/onboarding/sign-up/pending" as const;
export const ONBOARDING_PARENT_CONSENT_PATH =
  "/onboarding/parent-consent" as const;
export const DASHBOARD_ACADEMY_PATH = "/dashboard/academy" as const;

export type AccessMode = "ghost" | "registered";

/** @deprecated Use AccessMode — kept for existing imports. */
export type GhostAccessMode = "ghost";

/** @deprecated Use MasteryCohort from `@/lib/dashboard/mastery-cohort`. */
export type ComplianceTier = MasteryCohort;

export type AccountRole = "child" | "parent_master";

export type GhostProfileInput = {
  username: string;
  birthYear: number;
  genericProfileId?: string;
};

export type RegisteredProfileInput = {
  username: string;
  email: string;
  birthYear: number;
  accountRole: AccountRole;
  parentEmail?: string;
  consentApprovedAt?: string;
};

export type UserSession = {
  accessMode: AccessMode;
  username: string;
  birthYear: number;
  birthYearLocked: boolean;
  ageTier: MasteryCohort;
  createdAt: string;
  email?: string;
  parentEmail?: string;
  accountRole?: AccountRole;
  genericProfileId?: string;
  convertedAt?: string;
  consentApprovedAt?: string;
};

/** @deprecated Use UserSession — kept for existing imports. */
export type GhostAccessSession = UserSession;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @deprecated Use getMasteryCohortFromBirthYear. */
export function getComplianceTier(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  return getMasteryCohortFromBirthYear(birthYear, referenceYear);
}

function resolveAgeTier(
  birthYear: number,
  parsed?: Partial<UserSession & { complianceTier?: string }>,
): MasteryCohort {
  if (
    parsed?.ageTier === "explorer" ||
    parsed?.ageTier === "pathfinder" ||
    parsed?.ageTier === "maverick"
  ) {
    return parsed.ageTier;
  }

  if (parsed?.complianceTier === "explorer") {
    return "explorer";
  }
  if (parsed?.complianceTier === "titan") {
    return getMasteryCohortFromBirthYear(birthYear);
  }

  return getMasteryCohortFromBirthYear(birthYear);
}

function normalizeStoredSession(raw: unknown): UserSession | null {
  if (!raw || typeof raw !== "object") return null;

  const parsed = raw as Partial<
    UserSession & { complianceTier?: string }
  >;
  if (typeof parsed.username !== "string" || !parsed.username.trim()) {
    return null;
  }
  if (!isEligibleBirthYear(Number(parsed.birthYear))) {
    return null;
  }

  const accessMode: AccessMode =
    parsed.accessMode === "registered" ? "registered" : "ghost";
  const birthYear = Number(parsed.birthYear);
  const ageTier = resolveAgeTier(birthYear, parsed);

  if (accessMode === "registered") {
    const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
    if (!email || !EMAIL_PATTERN.test(email)) {
      return null;
    }
  }

  return {
    accessMode,
    username: parsed.username.trim(),
    birthYear,
    birthYearLocked: parsed.birthYearLocked !== false,
    ageTier,
    createdAt:
      typeof parsed.createdAt === "string"
        ? parsed.createdAt
        : new Date().toISOString(),
    email:
      accessMode === "registered" && typeof parsed.email === "string"
        ? parsed.email.trim().toLowerCase()
        : undefined,
    parentEmail:
      typeof parsed.parentEmail === "string"
        ? parsed.parentEmail.trim().toLowerCase()
        : undefined,
    accountRole:
      parsed.accountRole === "parent_master" || parsed.accountRole === "child"
        ? parsed.accountRole
        : undefined,
    genericProfileId:
      typeof parsed.genericProfileId === "string"
        ? parsed.genericProfileId
        : undefined,
    convertedAt:
      typeof parsed.convertedAt === "string" ? parsed.convertedAt : undefined,
    consentApprovedAt:
      typeof parsed.consentApprovedAt === "string"
        ? parsed.consentApprovedAt
        : undefined,
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
    birthYearLocked: true,
    ageTier: getMasteryCohortFromBirthYear(birthYear),
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
  const ageTier = getMasteryCohortFromBirthYear(birthYear);

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

  const parentEmail =
    input.parentEmail?.trim().toLowerCase() ??
    (ageTier === "explorer" ? email : undefined);

  return {
    accessMode: "registered",
    username,
    email,
    birthYear,
    birthYearLocked: true,
    ageTier,
    accountRole: input.accountRole,
    parentEmail,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    convertedAt: new Date().toISOString(),
    consentApprovedAt: input.consentApprovedAt,
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
    session.birthYearLocked &&
    isEligibleBirthYear(session.birthYear) &&
    session.username.trim().length > 0
  );
}

import { isEligibleBirthYear } from "@/lib/onboarding/birth-years";
import {
  defaultAccountStatusForBirthYear,
  getComplianceTierFromBirthYear,
  getSignupRequirementsForCohort,
  resolveCurriculumCohort,
  type AccountLifecycleStatus,
  type MasteryCohort,
  type RegisteredAccountStatus,
} from "@/lib/dashboard/mastery-cohort";
import { releaseGenericProfileId } from "@/lib/onboarding/generic-profile-id";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";

export const GUEST_SESSION_STORAGE_KEY = "nga_guest_session";

/** Legacy storage key — read once for migration. */
const LEGACY_GHOST_SESSION_STORAGE_KEY = "nga_ghost_session";

export const ONBOARDING_ENTRY_PATH = "/onboarding" as const;
export const ONBOARDING_START_PATH = "/onboarding/start" as const;
export const ONBOARDING_SIGN_IN_PATH = "/onboarding/sign-in" as const;
export const ONBOARDING_SIGN_UP_PATH = "/onboarding/sign-up" as const;
export const ONBOARDING_SIGN_UP_PENDING_PATH =
  "/onboarding/sign-up/pending" as const;
export const ONBOARDING_PARENT_CONSENT_PATH =
  "/onboarding/parent-consent" as const;
export const DASHBOARD_ACADEMY_PATH = "/dashboard/academy" as const;

export type AccessMode = "guest" | "registered";

/** @deprecated Use AccessMode — kept for existing imports. */
export type GuestAccessMode = "guest";

/** @deprecated Use MasteryCohort from `@/lib/dashboard/mastery-cohort`. */
export type ComplianceTier = MasteryCohort;

export type AccountRole = "child" | "parent_master";

/** Re-export for session consumers. */
export type { AccountLifecycleStatus, RegisteredAccountStatus };

/** @deprecated Prefer AccountLifecycleStatus. */
export type AccountState = AccountLifecycleStatus;

export type GuestProfileInput = {
  username: string;
  birthYear: number;
  genericProfileId?: string;
};

export type RegisteredProfileInput = {
  username: string;
  birthYear: number;
  accountRole: AccountRole;
  /**
   * Learner email — required for Pathfinders/Mavericks.
   * Strictly omitted for Explorers (COPPA).
   */
  learnerEmail?: string | null;
  /**
   * @deprecated Prefer `learnerEmail`. Accepted for existing callers;
   * mapped to learnerEmail for non-Explorer cohorts.
   */
  email?: string;
  /** Required for Explorers and Pathfinders; optional for Mavericks. */
  parentEmail?: string | null;
  /** Plain 4-digit Explorer handle passcode — stored as passcodeHash. */
  passcode?: string;
  passcodeHash?: string;
  /** Plain learner password — stored as passwordHash (Pathfinder/Maverick). */
  password?: string;
  passwordHash?: string;
  /** Plain 4-digit Parent PIN from consent approval — stored as parentPinHash. */
  parentPin?: string;
  parentPinHash?: string;
  consentApprovedAt?: string;
  /** Override lifecycle status; otherwise derived from cohort + consent. */
  accountStatus?: RegisteredAccountStatus;
};

export type UserSession = {
  accessMode: AccessMode;
  username: string;
  /** Legal birth year — source of truth for parental / COPPA age gates. */
  birthYear: number;
  birthYearLocked: boolean;
  /**
   * Legal compliance cohort derived from birth year (conservative age).
   * Never treat a curriculum override as a substitute for this field.
   */
  ageTier: MasteryCohort;
  /**
   * Optional learning-content track override (Parent Settings).
   * Changes Academy difficulty only — must not clear Parent Portal / consent rules.
   */
  curriculumCohort?: MasteryCohort;
  /**
   * Lifecycle: GUEST | PENDING_CONSENT | ACTIVE.
   * Alias field name: accountLifecycleStatus / accountState.
   */
  accountStatus?: AccountLifecycleStatus;
  /** @deprecated Prefer accountStatus — same value when persisted by newer clients. */
  accountLifecycleStatus?: AccountLifecycleStatus;
  /** @deprecated Prefer accountStatus. */
  accountState?: AccountLifecycleStatus;
  createdAt: string;
  /**
   * Learner email — never set for Explorers.
   * @deprecated Prefer learnerEmail; kept in sync for older readers.
   */
  email?: string;
  /** Learner email — omitted for Explorers. */
  learnerEmail?: string;
  parentEmail?: string;
  accountRole?: AccountRole;
  genericProfileId?: string;
  convertedAt?: string;
  consentApprovedAt?: string;
  /** Hashed 4-digit Parent PIN set during consent approval. */
  parentPinHash?: string;
  /** Hashed 4-digit Explorer handle passcode. */
  passcodeHash?: string;
  /** Hashed learner password (Pathfinder / Maverick). */
  passwordHash?: string;
};

/** @deprecated Use UserSession — kept for existing imports. */
export type GuestAccessSession = UserSession;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOUR_DIGIT_PATTERN = /^\d{4}$/;

/** Lightweight local credential digest (guest-first; not a substitute for server auth). */
export function hashCredential(value: string): string {
  const normalized = value.trim();
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `nga1_${(hash >>> 0).toString(16)}`;
}

function normalizeEmail(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  return trimmed && EMAIL_PATTERN.test(trimmed) ? trimmed : undefined;
}

function resolvePasscodeHash(input: RegisteredProfileInput): string | undefined {
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

function resolvePasswordHash(input: RegisteredProfileInput): string | undefined {
  if (typeof input.passwordHash === "string" && input.passwordHash.trim()) {
    return input.passwordHash.trim();
  }
  if (typeof input.password === "string" && input.password.trim()) {
    return hashCredential(input.password);
  }
  return undefined;
}

function resolveParentPinHash(input: RegisteredProfileInput): string | undefined {
  if (typeof input.parentPinHash === "string" && input.parentPinHash.trim()) {
    return input.parentPinHash.trim();
  }
  if (typeof input.parentPin === "string" && input.parentPin.length > 0) {
    if (!FOUR_DIGIT_PATTERN.test(input.parentPin.trim())) {
      throw new Error("Parent PIN must be exactly 4 digits.");
    }
    return hashCredential(input.parentPin);
  }
  return undefined;
}

/** @deprecated Use getComplianceTierFromBirthYear. */
export function getComplianceTier(
  birthYear: number,
  referenceYear = new Date().getFullYear(),
): MasteryCohort {
  return getComplianceTierFromBirthYear(birthYear, referenceYear);
}

/**
 * Legal compliance cohort is always recomputed from birth year.
 * Stored `ageTier` / legacy `complianceTier` are ignored so curriculum
 * overrides or stale values cannot weaken parental protections.
 */
function resolveAgeTier(birthYear: number): MasteryCohort {
  return getComplianceTierFromBirthYear(birthYear);
}

function resolveStoredCurriculumCohort(
  parsed?: Partial<UserSession>,
): MasteryCohort | undefined {
  if (
    parsed?.curriculumCohort === "explorer" ||
    parsed?.curriculumCohort === "pathfinder" ||
    parsed?.curriculumCohort === "maverick"
  ) {
    return parsed.curriculumCohort;
  }
  return undefined;
}

function isLifecycleStatus(value: unknown): value is AccountLifecycleStatus {
  return (
    value === "GUEST" || value === "PENDING_CONSENT" || value === "ACTIVE"
  );
}

function resolveAccountStatus(
  birthYear: number,
  parsed?: Partial<UserSession> & { accessMode?: AccessMode },
): AccountLifecycleStatus | undefined {
  const fromAlias =
    parsed?.accountStatus ??
    parsed?.accountLifecycleStatus ??
    parsed?.accountState;

  if (isLifecycleStatus(fromAlias)) {
    if (parsed?.accessMode === "guest" && fromAlias !== "GUEST") {
      return "GUEST";
    }
    if (parsed?.accessMode === "registered" && fromAlias === "GUEST") {
      return defaultAccountStatusForBirthYear(birthYear);
    }
    return fromAlias;
  }

  if (parsed?.accessMode === "guest") {
    return "GUEST";
  }
  if (parsed?.accessMode === "registered") {
    return defaultAccountStatusForBirthYear(birthYear);
  }
  return undefined;
}

/**
 * Re-assert cohort email + lifecycle rules on a registered session.
 * Mutates nothing — returns a corrected copy.
 */
export function enforceCohortAccountState(session: UserSession): UserSession {
  if (session.accessMode === "guest") {
    return {
      ...session,
      accountStatus: "GUEST",
      accountLifecycleStatus: "GUEST",
      accountState: "GUEST",
      learnerEmail: undefined,
      email: undefined,
    };
  }

  const ageTier = resolveAgeTier(session.birthYear);
  const requirements = getSignupRequirementsForCohort(ageTier);

  let learnerEmail = normalizeEmail(session.learnerEmail ?? session.email);
  let parentEmail = normalizeEmail(session.parentEmail);

  if (ageTier === "explorer") {
    // Explorers must never persist a learner email; migrate legacy email → parent.
    if (!parentEmail && learnerEmail) {
      parentEmail = learnerEmail;
    }
    learnerEmail = undefined;
  }

  if (requirements.requiresLearnerEmail && !learnerEmail) {
    throw new Error("A valid learner email is required for this age band.");
  }
  if (requirements.requiresParentEmail && !parentEmail && ageTier === "explorer") {
    throw new Error("A parent or guardian email is required for Explorer profiles.");
  }
  if (!requirements.requiresLearnerEmail) {
    learnerEmail = undefined;
  }

  let accountStatus: RegisteredAccountStatus =
    session.consentApprovedAt
      ? "ACTIVE"
      : (isLifecycleStatus(session.accountStatus) &&
          session.accountStatus !== "GUEST"
          ? session.accountStatus
          : defaultAccountStatusForBirthYear(session.birthYear));

  if (requirements.requiresParentApproval && !session.consentApprovedAt) {
    accountStatus = "PENDING_CONSENT";
  }
  if (session.consentApprovedAt) {
    accountStatus = "ACTIVE";
  }

  return {
    ...session,
    ageTier,
    learnerEmail,
    email: learnerEmail,
    parentEmail,
    accountStatus,
    accountLifecycleStatus: accountStatus,
    accountState: accountStatus,
  };
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
    parsed.accessMode === "registered"
      ? "registered"
      : parsed.accessMode === "guest" || parsed.accessMode === "ghost"
        ? "guest"
        : "guest";
  const birthYear = Number(parsed.birthYear);
  const ageTier = resolveAgeTier(birthYear);
  const curriculumCohort = resolveStoredCurriculumCohort(parsed);
  const accountStatus = resolveAccountStatus(birthYear, {
    ...parsed,
    accessMode,
  });

  const legacyEmail = normalizeEmail(parsed.email);
  let learnerEmail = normalizeEmail(parsed.learnerEmail) ?? undefined;
  let parentEmail = normalizeEmail(parsed.parentEmail);

  if (accessMode === "registered") {
    if (ageTier === "explorer") {
      // Strictly omit learner email; legacy `email` was parent master email.
      if (!parentEmail && legacyEmail) parentEmail = legacyEmail;
      learnerEmail = undefined;
    } else {
      learnerEmail = learnerEmail ?? legacyEmail;
      const requirements = getSignupRequirementsForCohort(ageTier);
      if (requirements.requiresLearnerEmail && !learnerEmail) {
        return null;
      }
    }
  }

  const session: UserSession = {
    accessMode,
    username: parsed.username.trim(),
    birthYear,
    birthYearLocked: parsed.birthYearLocked !== false,
    ageTier,
    curriculumCohort,
    accountStatus,
    accountLifecycleStatus: accountStatus,
    accountState: accountStatus,
    createdAt:
      typeof parsed.createdAt === "string"
        ? parsed.createdAt
        : new Date().toISOString(),
    learnerEmail: accessMode === "registered" ? learnerEmail : undefined,
    email: accessMode === "registered" ? learnerEmail : undefined,
    parentEmail,
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
    parentPinHash:
      typeof parsed.parentPinHash === "string"
        ? parsed.parentPinHash
        : undefined,
    passcodeHash:
      typeof parsed.passcodeHash === "string" ? parsed.passcodeHash : undefined,
    passwordHash:
      typeof parsed.passwordHash === "string" ? parsed.passwordHash : undefined,
  };

  return session;
}

export function createGuestAccessSession(
  input: GuestProfileInput,
): UserSession {
  const username = input.username.trim();
  const birthYear = input.birthYear;

  if (!username) {
    throw new Error("Username is required for guest access.");
  }
  if (!isEligibleBirthYear(birthYear)) {
    throw new Error("Birth year is outside the eligible range.");
  }

  return {
    accessMode: "guest",
    username,
    birthYear,
    birthYearLocked: true,
    ageTier: getComplianceTierFromBirthYear(birthYear),
    accountStatus: "GUEST",
    accountLifecycleStatus: "GUEST",
    accountState: "GUEST",
    createdAt: new Date().toISOString(),
    genericProfileId: input.genericProfileId,
  };
}

export function convertToRegisteredProfile(
  input: RegisteredProfileInput,
): UserSession {
  const username = input.username.trim();
  const birthYear = input.birthYear;
  const ageTier = getComplianceTierFromBirthYear(birthYear);
  const requirements = getSignupRequirementsForCohort(ageTier);

  if (!username) {
    throw new Error("Username is required.");
  }
  if (!isEligibleBirthYear(birthYear)) {
    throw new Error("Birth year is outside the eligible range.");
  }

  const legacyEmail = normalizeEmail(input.email);
  let learnerEmail = normalizeEmail(input.learnerEmail) ?? undefined;
  let parentEmail = normalizeEmail(input.parentEmail);

  if (ageTier === "explorer") {
    // Explorers: omit learner email; parent email is required.
    if (!parentEmail && legacyEmail) parentEmail = legacyEmail;
    learnerEmail = undefined;
  } else {
    learnerEmail = learnerEmail ?? legacyEmail;
  }

  if (requirements.requiresLearnerEmail) {
    if (!learnerEmail) {
      throw new Error("A valid learner email is required for this age band.");
    }
  } else {
    learnerEmail = undefined;
  }

  if (requirements.requiresParentEmail && !parentEmail) {
    // Pathfinder transitional: older callers may only send learner email.
    // Explorers must always supply parentEmail (no learner email to fall back on).
    if (ageTier === "explorer") {
      throw new Error(
        "A parent or guardian email is required for Explorer profiles.",
      );
    }
  }
  if (!requirements.requiresParentEmail && !parentEmail) {
    parentEmail = undefined;
  }

  // Credential presence is enforced by signup UI; hash whenever provided.
  const passcodeHash = resolvePasscodeHash(input);
  const passwordHash = resolvePasswordHash(input);
  const parentPinHash = resolveParentPinHash(input);

  if (requirements.requiresPasscode && input.passcode !== undefined && !passcodeHash) {
    throw new Error(
      "A 4-digit passcode is required for Explorer handle login.",
    );
  }
  if (requirements.requiresPassword && input.password !== undefined && !passwordHash) {
    throw new Error("A password is required for this age band.");
  }

  const existing = readUserSession();
  if (existing?.genericProfileId) {
    releaseGenericProfileId(existing.genericProfileId);
  }

  let accountStatus: RegisteredAccountStatus =
    input.accountStatus ??
    (input.consentApprovedAt
      ? "ACTIVE"
      : defaultAccountStatusForBirthYear(birthYear));

  if (requirements.requiresParentApproval && !input.consentApprovedAt) {
    accountStatus = "PENDING_CONSENT";
  }
  if (input.consentApprovedAt) {
    accountStatus = "ACTIVE";
  }

  return {
    accessMode: "registered",
    username,
    learnerEmail,
    email: learnerEmail,
    birthYear,
    birthYearLocked: true,
    ageTier,
    curriculumCohort: existing?.curriculumCohort,
    accountStatus,
    accountLifecycleStatus: accountStatus,
    accountState: accountStatus,
    accountRole: input.accountRole,
    parentEmail,
    passcodeHash,
    passwordHash,
    parentPinHash,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    convertedAt: new Date().toISOString(),
    consentApprovedAt: input.consentApprovedAt,
  };
}

export function saveUserSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  writePersisted(GUEST_SESSION_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Correct the legal birth year and recompute compliance cohort.
 * Does not clear parent email / portal linkage fields on the session.
 */
export function updateUserBirthYear(birthYear: number): UserSession | null {
  const session = readUserSession();
  if (!session || !isEligibleBirthYear(birthYear)) return null;

  const updated = enforceCohortAccountState({
    ...session,
    birthYear,
    ageTier: getComplianceTierFromBirthYear(birthYear),
    birthYearLocked: true,
  });
  saveUserSession(updated);
  dispatchUserSessionUpdated();
  return updated;
}

/**
 * Parent Settings curriculum override — learning content / difficulty only.
 * Legal birth year, ageTier, parent email, and portal requirements are unchanged.
 */
export function updateUserCurriculumCohort(
  curriculumCohort: MasteryCohort,
): UserSession | null {
  const session = readUserSession();
  if (!session) return null;

  const updated: UserSession = {
    ...session,
    curriculumCohort,
    // Re-assert legal tier from birth year so overrides never rewrite compliance.
    ageTier: getComplianceTierFromBirthYear(session.birthYear),
    parentEmail: session.parentEmail,
  };
  saveUserSession(updated);
  dispatchUserSessionUpdated();
  return updated;
}

/** Learning-content cohort (override or legal default). */
export function getSessionCurriculumCohort(session: UserSession): MasteryCohort {
  return resolveCurriculumCohort({
    birthYear: session.birthYear,
    curriculumCohort: session.curriculumCohort,
  });
}

/** @deprecated Use saveUserSession — kept for existing imports. */
export function saveGuestAccessSession(session: UserSession): void {
  saveUserSession(session);
}

export function readUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;

  let raw = readPersisted(GUEST_SESSION_STORAGE_KEY);
  const fromLegacy = !raw;
  if (!raw) {
    raw = readPersisted(LEGACY_GHOST_SESSION_STORAGE_KEY);
  }
  if (!raw) return null;

  try {
    const session = normalizeStoredSession(JSON.parse(raw));
    if (session && fromLegacy) {
      saveUserSession(session);
      removePersisted(LEGACY_GHOST_SESSION_STORAGE_KEY);
    }
    return session;
  } catch {
    return null;
  }
}

/** @deprecated Use readUserSession — kept for existing imports. */
export function readGuestAccessSession(): UserSession | null {
  return readUserSession();
}

export function clearUserSession(): void {
  if (typeof window === "undefined") return;
  removePersisted(GUEST_SESSION_STORAGE_KEY);
  removePersisted(LEGACY_GHOST_SESSION_STORAGE_KEY);
}

/** @deprecated Use clearUserSession — kept for existing imports. */
export function clearGuestAccessSession(): void {
  clearUserSession();
}

export function isGuestSession(session: UserSession | null): boolean {
  return session?.accessMode === "guest" || session?.accountStatus === "GUEST";
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


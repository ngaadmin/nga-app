import { hashCredential as hashCredentialV2 } from "@/lib/auth/credential-hash";
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
import { resolvePasscodeHash } from "@/lib/onboarding/resolve-passcode-hash";
import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";
import { dispatchUserSessionUpdated } from "@/lib/onboarding/user-session-events";
import { normalizeEmailAddress } from "@/lib/validation/email";
import { isFourDigitPin } from "@/lib/validation/pin";

export const GUEST_SESSION_STORAGE_KEY = "nga_guest_session";

/** Legacy storage key - read once for migration. */
const LEGACY_GHOST_SESSION_STORAGE_KEY = "nga_ghost_session";

export const ONBOARDING_ENTRY_PATH = "/" as const;
export const ONBOARDING_START_PATH = "/onboarding/start" as const;
export const ONBOARDING_SIGN_IN_PATH = "/onboarding/sign-in" as const;
export const ONBOARDING_SIGN_UP_PATH = "/onboarding/sign-up" as const;
export const ONBOARDING_SIGN_UP_LEARNER_PATH =
  "/onboarding/sign-up?as=learner" as const;
export const ONBOARDING_SIGN_UP_PARENT_PATH =
  "/onboarding/sign-up?as=parent" as const;

/** Email CTA + valid consent tokens land here — create parent master and approve. */
export function parentMasterSignUpHref(token: string): string {
  return `${ONBOARDING_SIGN_UP_PATH}?role=parent_master&token=${encodeURIComponent(token.trim())}`;
}
export const DASHBOARD_SETTINGS_ACCOUNT_PATH =
  "/dashboard/settings/account" as const;
export const DASHBOARD_SETTINGS_SUBSCRIPTION_PATH =
  "/dashboard/settings/subscription" as const;
export const DASHBOARD_ADD_PROFILE_PATH =
  "/dashboard/settings/add-profile" as const;
export const DASHBOARD_ADD_LINKED_CHILD_PATH = DASHBOARD_ADD_PROFILE_PATH;
export const ONBOARDING_SIGN_UP_PENDING_PATH =
  "/onboarding/sign-up/pending" as const;
export const ONBOARDING_PARENT_CONSENT_PATH =
  "/onboarding/parent-consent" as const;
export const DASHBOARD_ACADEMY_PATH = "/dashboard/academy" as const;

export type AccessMode = "guest" | "registered";

export type AccountRole = "child" | "parent_master";

/** Re-export for session consumers. */
export type { AccountLifecycleStatus, RegisteredAccountStatus };

export type GuestProfileInput = {
  username: string;
  birthYear: number;
  genericProfileId?: string;
  /** Content track for guest play. Not a legal age verification. */
  curriculumCohort?: MasteryCohort;
  /**
   * True once the learner confirmed a real birth year (account creation).
   * Guest track-picker sessions stay unlocked.
   */
  birthYearLocked?: boolean;
};

export type RegisteredProfileInput = {
  username: string;
  birthYear: number;
  accountRole: AccountRole;
  /**
   * Learner email - required for Pathfinders/Mavericks.
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
  /**
   * Explorer login password (min 6). Field name is historical — digest is stored
   * as `passcodeHash` for registry/consent-token compatibility.
   */
  passcode?: string;
  passcodeHash?: string;
  /** Plain learner password - stored as passwordHash (Pathfinder/Maverick). */
  password?: string;
  passwordHash?: string;
  /** Plain 4-digit Parent PIN from consent approval - stored as parentPinHash. */
  parentPin?: string;
  parentPinHash?: string;
  consentApprovedAt?: string;
  /** Override lifecycle status; otherwise derived from cohort + consent. */
  accountStatus?: RegisteredAccountStatus;
  /** Marketing email opt-in collected at create-profile. */
  marketingOptIn?: boolean;
  /** Supabase Auth / profiles.id when this session is backed by a remote account. */
  supabaseUserId?: string;
  /** Content track chosen at parent-add (or guest conversion). */
  curriculumCohort?: MasteryCohort;
};

export type UserSession = {
  accessMode: AccessMode;
  username: string;
  /** Legal birth year - source of truth for parental / COPPA age gates. */
  birthYear: number;
  birthYearLocked: boolean;
  /**
   * Legal compliance cohort derived from birth year (conservative age).
   * Never treat a curriculum override as a substitute for this field.
   */
  ageTier: MasteryCohort;
  /**
   * Optional learning-content track override (Parent Settings).
   * Changes Academy difficulty only - must not clear Parent Portal / consent rules.
   */
  curriculumCohort?: MasteryCohort;
  /** Lifecycle: GUEST | PENDING_CONSENT | ACTIVE. */
  accountStatus?: AccountLifecycleStatus;
  /**
   * @deprecated Read-only fallback for older localStorage. Never written on new saves.
   */
  accountLifecycleStatus?: AccountLifecycleStatus;
  /**
   * @deprecated Read-only fallback for older localStorage. Never written on new saves.
   */
  accountState?: AccountLifecycleStatus;
  createdAt: string;
  /**
   * Learner email - never set for Explorers.
   * @deprecated Prefer learnerEmail; kept in sync for older readers.
   */
  email?: string;
  /** Learner email - omitted for Explorers. */
  learnerEmail?: string;
  parentEmail?: string;
  accountRole?: AccountRole;
  genericProfileId?: string;
  convertedAt?: string;
  consentApprovedAt?: string;
  /** Hashed 4-digit Parent PIN set during consent approval. */
  parentPinHash?: string;
  /**
   * Hashed Explorer login password. Field name is historical (`passcodeHash`);
   * value is a salted password digest (min 6), not a 4-digit PIN.
   */
  passcodeHash?: string;
  /** Hashed learner password (Pathfinder / Maverick). */
  passwordHash?: string;
  /** When true, user must set a new password before continuing after recovery login. */
  mustChangePassword?: boolean;
  /** ISO expiry for a server-issued temporary recovery password. */
  temporaryPasswordExpiresAt?: string;
  /** Marketing email opt-in collected at create-profile. */
  marketingOptIn?: boolean;
  /** Supabase Auth / profiles.id when this session is backed by a remote account. */
  supabaseUserId?: string;
};

/** @deprecated Use UserSession - kept for existing imports. */
export type GuestAccessSession = UserSession;

/** Salted credential digest (`nga2_`). Legacy `nga1_` hashes still verify. */
export function hashCredential(value: string): string {
  return hashCredentialV2(value);
}

function normalizeEmail(value: string | null | undefined): string | undefined {
  return normalizeEmailAddress(value);
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
    if (!isFourDigitPin(input.parentPin)) {
      throw new Error("Parent PIN must be exactly 4 digits.");
    }
    return hashCredential(input.parentPin);
  }
  return undefined;
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
 * Mutates nothing - returns a corrected copy.
 */
export function enforceCohortAccountState(session: UserSession): UserSession {
  if (session.accessMode === "guest") {
    return {
      ...session,
      accountStatus: "GUEST",
      accountLifecycleStatus: undefined,
      accountState: undefined,
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

  const alreadyProvisioned = Boolean(session.supabaseUserId);
  if (
    !alreadyProvisioned &&
    requirements.requiresLearnerEmail &&
    !learnerEmail &&
    !session.consentApprovedAt
  ) {
    throw new Error("A valid learner email is required for this age band.");
  }
  if (
    !alreadyProvisioned &&
    requirements.requiresParentEmail &&
    !parentEmail &&
    ageTier === "explorer"
  ) {
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
    // Drop deprecated aliases so they are not re-persisted.
    accountLifecycleStatus: undefined,
    accountState: undefined,
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
    mustChangePassword: parsed.mustChangePassword === true,
    temporaryPasswordExpiresAt:
      typeof parsed.temporaryPasswordExpiresAt === "string"
        ? parsed.temporaryPasswordExpiresAt
        : undefined,
    marketingOptIn: parsed.marketingOptIn === true,
    supabaseUserId:
      typeof parsed.supabaseUserId === "string" && parsed.supabaseUserId.trim()
        ? parsed.supabaseUserId.trim()
        : undefined,
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
    birthYearLocked: input.birthYearLocked !== false,
    ageTier: getComplianceTierFromBirthYear(birthYear),
    curriculumCohort: input.curriculumCohort,
    accountStatus: "GUEST",
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

  const alreadyProvisioned = Boolean(input.supabaseUserId);
  if (
    !alreadyProvisioned &&
    requirements.requiresLearnerEmail &&
    !learnerEmail &&
    !input.consentApprovedAt
  ) {
    throw new Error("A valid learner email is required for this age band.");
  }
  if (!requirements.requiresLearnerEmail) {
    learnerEmail = undefined;
  }

  if (requirements.requiresParentEmail && !parentEmail) {
    // Pathfinder transitional: older callers may only send learner email.
    // Explorers must always supply parentEmail (no learner email to fall back on).
    if (!alreadyProvisioned && ageTier === "explorer") {
      throw new Error(
        "A parent or guardian email is required for Explorer profiles.",
      );
    }
  }
  if (!requirements.requiresParentEmail && !parentEmail) {
    parentEmail = undefined;
  }

  // Credential presence is enforced by signup UI; hash whenever provided.
  // Explorers: password may arrive as `passcode` (consent bridge) or `password`.
  const passcodeHash = resolvePasscodeHash({
    passcode: input.passcode,
    password: ageTier === "explorer" ? input.password : undefined,
    passcodeHash: input.passcodeHash,
  });
  const passwordHash =
    ageTier === "explorer" ? undefined : resolvePasswordHash(input);
  const parentPinHash = resolveParentPinHash(input);

  if (requirements.requiresPassword) {
    if (ageTier === "explorer") {
      if (
        (input.passcode !== undefined ||
          input.password !== undefined ||
          input.passcodeHash !== undefined) &&
        !passcodeHash
      ) {
        throw new Error("A password is required for Explorer login.");
      }
    } else if (input.password !== undefined && !passwordHash) {
      throw new Error("A password is required for this age band.");
    }
  }

  const existing = readUserSession();
  // Free the temporary guest Finnster handle back into the reusable pool.
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
    curriculumCohort: input.curriculumCohort ?? existing?.curriculumCohort,
    accountStatus,
    accountRole: input.accountRole,
    parentEmail,
    passcodeHash,
    passwordHash,
    parentPinHash,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    convertedAt: new Date().toISOString(),
    consentApprovedAt: input.consentApprovedAt,
    // Minors never opt in during child onboarding — parent master may later.
    marketingOptIn:
      ageTier === "explorer" ? false : input.marketingOptIn === true,
    supabaseUserId: input.supabaseUserId?.trim() || undefined,
  };
}

export function saveUserSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  writePersisted(GUEST_SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchUserSessionUpdated();
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
 * Parent Settings curriculum override - learning content / difficulty only.
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

/** @deprecated Use saveUserSession - kept for existing imports. */
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

/** @deprecated Use readUserSession - kept for existing imports. */
export function readGuestAccessSession(): UserSession | null {
  return readUserSession();
}

export function clearUserSession(): void {
  if (typeof window === "undefined") return;
  removePersisted(GUEST_SESSION_STORAGE_KEY);
  removePersisted(LEGACY_GHOST_SESSION_STORAGE_KEY);
}

export function isGuestSession(session: UserSession | null): boolean {
  return session?.accessMode === "guest" || session?.accountStatus === "GUEST";
}

/**
 * True when the learner can use the app shell.
 * Guest track selection is enough; legal birth year is confirmed at signup.
 */
export function hasCompletedPersonalizationGate(
  session: UserSession | null,
): boolean {
  if (!session || !session.username.trim()) return false;

  if (
    session.accessMode === "guest" &&
    (session.curriculumCohort === "explorer" ||
      session.curriculumCohort === "pathfinder" ||
      session.curriculumCohort === "maverick")
  ) {
    return true;
  }

  return session.birthYearLocked && isEligibleBirthYear(session.birthYear);
}


import { hashCredential as hashCredentialV2 } from "@/lib/auth/credential-hash";
import {
  getSignupRequirementsForCohort,
  parseMasteryCohort,
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
export const SCHOOL_PATH = "/school" as const;
export const SCHOOL_SIGN_UP_PATH = "/school/sign-up" as const;
export const DASHBOARD_CLASS_PATH = "/dashboard/class" as const;

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

export type AccountRole = "child" | "parent_master" | "teacher";

/** Re-export for session consumers. */
export type { AccountLifecycleStatus, RegisteredAccountStatus };

export type GuestProfileInput = {
  username: string;
  genericProfileId?: string;
  /** Learning track. Guest play does not ask for a birth year. */
  curriculumCohort: MasteryCohort;
};

export type RegisteredProfileInput = {
  username: string;
  accountRole: AccountRole;
  /**
   * Learning track. Required for learners. Parents and teachers default to
   * Maverick when omitted.
   */
  curriculumCohort?: MasteryCohort;
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
  /**
   * Self sign-up age flag. True means under 16 and parent approval is
   * required on every track. False means 16 and over, with no parent step.
   * Omit for guests, parents, teachers, class seats, and older sessions.
   */
  parentApprovalRequired?: boolean;
  /** Marketing email opt-in collected at create-profile. */
  marketingOptIn?: boolean;
  /** Supabase Auth / profiles.id when this session is backed by a remote account. */
  supabaseUserId?: string;
};

export type UserSession = {
  accessMode: AccessMode;
  username: string;
  /**
   * Learning track. Same value as `curriculumCohort`. Parent approval is
   * `parentApprovalRequired`, not this track.
   */
  ageTier: MasteryCohort;
  /** Learning track chosen by the learner, parent, or class. */
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
  /** True for /school teacher accounts. Class seats stay false. */
  isTeacher?: boolean;
  genericProfileId?: string;
  convertedAt?: string;
  consentApprovedAt?: string;
  /**
   * Self sign-up age flag. True: under 16, parent approval required.
   * False: 16 and over, no parent step. Absent on older sessions.
   */
  parentApprovalRequired?: boolean;
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
  /**
   * TODO: remove after recordings
   * Set when this tab was opened with ?recording=1 so first-visit intros stay closed.
   */
  recordingSuppressIntro?: boolean;
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
 * Track from an old local session. Prefer the saved track. A leftover birth
 * year is mapped once and not written back.
 */
function resolveStoredTrack(
  parsed: Partial<UserSession> & { birthYear?: unknown },
): MasteryCohort | undefined {
  const saved = parseMasteryCohort(parsed.curriculumCohort);
  if (saved) return saved;
  const legacyYear = Number(parsed.birthYear);
  if (Number.isInteger(legacyYear) && legacyYear >= 1900 && legacyYear <= 2100) {
    return resolveCurriculumCohort({ birthYear: legacyYear });
  }
  return parseMasteryCohort(parsed.ageTier) ?? undefined;
}

function isLifecycleStatus(value: unknown): value is AccountLifecycleStatus {
  return (
    value === "GUEST" || value === "PENDING_CONSENT" || value === "ACTIVE"
  );
}

function resolveAccountStatus(
  track: MasteryCohort,
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
      return getSignupRequirementsForCohort(track).defaultAccountStatus;
    }
    return fromAlias;
  }

  if (parsed?.accessMode === "guest") {
    return "GUEST";
  }
  if (parsed?.accessMode === "registered") {
    return getSignupRequirementsForCohort(track).defaultAccountStatus;
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

  const ageTier = session.curriculumCohort ?? session.ageTier;
  const requirements = getSignupRequirementsForCohort(ageTier);

  let learnerEmail = normalizeEmail(session.learnerEmail ?? session.email);
  let parentEmail = normalizeEmail(session.parentEmail);

  if (ageTier === "explorer" && session.parentApprovalRequired !== false) {
    // Under-16 Explorers have no learner inbox. A leftover address is the parent.
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
    ageTier === "explorer" &&
    session.parentApprovalRequired !== false
  ) {
    throw new Error("A parent or guardian email is required for Explorer profiles.");
  }
  if (!requirements.requiresLearnerEmail && session.parentApprovalRequired !== false) {
    learnerEmail = undefined;
  }

  let accountStatus: RegisteredAccountStatus =
    session.consentApprovedAt
      ? "ACTIVE"
      : (isLifecycleStatus(session.accountStatus) &&
          session.accountStatus !== "GUEST"
          ? session.accountStatus
          : getSignupRequirementsForCohort(ageTier).defaultAccountStatus);

  if (session.parentApprovalRequired === true && !session.consentApprovedAt) {
    accountStatus = "PENDING_CONSENT";
  } else if (session.parentApprovalRequired === false) {
    // 16 and over keeps the server status, including an Explorer track.
  } else if (requirements.requiresParentApproval && !session.consentApprovedAt) {
    accountStatus = "PENDING_CONSENT";
  }
  if (session.consentApprovedAt) {
    accountStatus = "ACTIVE";
  }

  return {
    ...session,
    ageTier,
    curriculumCohort: ageTier,
    parentApprovalRequired: session.parentApprovalRequired,
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

  const parsed = raw as Partial<UserSession> & {
    birthYear?: unknown;
    complianceTier?: string;
  };
  if (typeof parsed.username !== "string" || !parsed.username.trim()) {
    return null;
  }

  const accessMode: AccessMode =
    parsed.accessMode === "registered"
      ? "registered"
      : parsed.accessMode === "guest" || parsed.accessMode === "ghost"
        ? "guest"
        : "guest";
  const accountRole =
    parsed.accountRole === "parent_master" ||
    parsed.accountRole === "child" ||
    parsed.accountRole === "teacher"
      ? parsed.accountRole
      : undefined;
  let ageTier = resolveStoredTrack(parsed);
  if (
    !ageTier &&
    (accountRole === "parent_master" ||
      accountRole === "teacher" ||
      parsed.isTeacher === true)
  ) {
    ageTier = "maverick";
  }
  if (!ageTier) return null;
  const curriculumCohort = ageTier;
  const accountStatus = resolveAccountStatus(ageTier, {
    ...parsed,
    accessMode,
  });

  const legacyEmail = normalizeEmail(parsed.email);
  let learnerEmail = normalizeEmail(parsed.learnerEmail) ?? undefined;
  let parentEmail = normalizeEmail(parsed.parentEmail);

  if (accessMode === "registered") {
    if (ageTier === "explorer" && parsed.parentApprovalRequired !== false) {
      // Under-16 Explorers have no learner inbox. A leftover address is the parent.
      if (!parentEmail && legacyEmail) parentEmail = legacyEmail;
      learnerEmail = undefined;
    } else if (ageTier === "explorer") {
      learnerEmail = learnerEmail ?? legacyEmail;
    } else {
      learnerEmail = learnerEmail ?? legacyEmail;
      const requirements = getSignupRequirementsForCohort(ageTier);
      const alreadyProvisioned = Boolean(
        typeof parsed.supabaseUserId === "string" &&
          parsed.supabaseUserId.trim(),
      );
      // Class seats (and other server-created Pathfinders) have no learner inbox.
      if (
        requirements.requiresLearnerEmail &&
        !learnerEmail &&
        !alreadyProvisioned
      ) {
        return null;
      }
    }
  }

  const session: UserSession = {
    accessMode,
    username: parsed.username.trim(),
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
    accountRole,
    isTeacher: parsed.isTeacher === true || parsed.accountRole === "teacher",
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
    parentApprovalRequired:
      parsed.parentApprovalRequired === true
        ? true
        : parsed.parentApprovalRequired === false
          ? false
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
    marketingOptIn:
      accountRole === "parent_master" ? parsed.marketingOptIn === true : false,
    supabaseUserId:
      typeof parsed.supabaseUserId === "string" && parsed.supabaseUserId.trim()
        ? parsed.supabaseUserId.trim()
        : undefined,
    // TODO: remove after recordings
    recordingSuppressIntro: parsed.recordingSuppressIntro === true ? true : undefined,
  };

  return session;
}

export function createGuestAccessSession(
  input: GuestProfileInput,
): UserSession {
  const username = input.username.trim();
  const track = parseMasteryCohort(input.curriculumCohort);

  if (!username) {
    throw new Error("Username is required for guest access.");
  }
  if (!track) {
    throw new Error("Pick a learning track for this learner.");
  }

  return {
    accessMode: "guest",
    username,
    ageTier: track,
    curriculumCohort: track,
    accountStatus: "GUEST",
    createdAt: new Date().toISOString(),
    genericProfileId: input.genericProfileId,
  };
}

export function convertToRegisteredProfile(
  input: RegisteredProfileInput,
): UserSession {
  const username = input.username.trim();
  const ageTier =
    parseMasteryCohort(input.curriculumCohort) ??
    (input.accountRole === "parent_master" || input.accountRole === "teacher"
      ? "maverick"
      : null);
  if (!ageTier) {
    throw new Error("Pick a learning track for this learner.");
  }
  const requirements = getSignupRequirementsForCohort(ageTier);

  if (!username) {
    throw new Error("Username is required.");
  }

  const legacyEmail = normalizeEmail(input.email);
  let learnerEmail = normalizeEmail(input.learnerEmail) ?? undefined;
  let parentEmail = normalizeEmail(input.parentEmail);

  if (ageTier === "explorer") {
    if (!parentEmail && legacyEmail && input.parentApprovalRequired !== false) {
      parentEmail = legacyEmail;
    }
    if (input.parentApprovalRequired !== false) {
      learnerEmail = undefined;
    }
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
  if (!requirements.requiresLearnerEmail && input.parentApprovalRequired !== false) {
    learnerEmail = undefined;
  }

  if (requirements.requiresParentEmail && !parentEmail) {
    // Pathfinder transitional: older callers may only send learner email.
    // Explorers must always supply parentEmail (no learner email to fall back on).
    // 16 and over skip the parent step even on the Explorer track.
    if (
      !alreadyProvisioned &&
      ageTier === "explorer" &&
      input.parentApprovalRequired !== false
    ) {
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
  // Free the temporary guest Penny handle back into the reusable pool.
  if (existing?.genericProfileId) {
    releaseGenericProfileId(existing.genericProfileId);
  }

  let accountStatus: RegisteredAccountStatus =
    input.accountStatus ??
    (input.consentApprovedAt
      ? "ACTIVE"
      : requirements.defaultAccountStatus);

  if (input.parentApprovalRequired === true && !input.consentApprovedAt) {
    accountStatus = "PENDING_CONSENT";
  } else if (input.parentApprovalRequired === false) {
    accountStatus = input.accountStatus ?? "ACTIVE";
  } else if (requirements.requiresParentApproval && !input.consentApprovedAt) {
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
    ageTier,
    curriculumCohort: ageTier,
    accountStatus,
    accountRole: input.accountRole,
    isTeacher: input.accountRole === "teacher",
    parentEmail,
    passcodeHash,
    passwordHash,
    parentPinHash,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    convertedAt: new Date().toISOString(),
    consentApprovedAt: input.consentApprovedAt,
    parentApprovalRequired: input.parentApprovalRequired,
    marketingOptIn:
      input.accountRole === "parent_master" ? input.marketingOptIn === true : false,
    supabaseUserId: input.supabaseUserId?.trim() || undefined,
  };
}

export function saveUserSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  writePersisted(GUEST_SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchUserSessionUpdated();
}

/**
 * Set the learning track. Does not clear a pending parent-approval hold.
 */
export function updateUserCurriculumCohort(
  curriculumCohort: MasteryCohort,
): UserSession | null {
  const session = readUserSession();
  if (!session) return null;

  const updated: UserSession = {
    ...session,
    curriculumCohort,
    ageTier: curriculumCohort,
    parentEmail: session.parentEmail,
    accountStatus: session.accountStatus,
    consentApprovedAt: session.consentApprovedAt,
  };
  saveUserSession(updated);
  dispatchUserSessionUpdated();
  return updated;
}

/** Learning track for content and consent. */
export function getSessionCurriculumCohort(session: UserSession): MasteryCohort {
  return (
    parseMasteryCohort(session.curriculumCohort) ??
    parseMasteryCohort(session.ageTier) ??
    "explorer"
  );
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
    const parsedRaw = JSON.parse(raw) as unknown;
    const hadBirthYear =
      !!parsedRaw &&
      typeof parsedRaw === "object" &&
      ("birthYear" in parsedRaw || "birth_year" in parsedRaw);
    const session = normalizeStoredSession(parsedRaw);
    if (session && (fromLegacy || hadBirthYear)) {
      saveUserSession(session);
      if (fromLegacy) removePersisted(LEGACY_GHOST_SESSION_STORAGE_KEY);
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
 * A chosen learning track is enough. Parents and teachers need a role only.
 */
export function hasCompletedPersonalizationGate(
  session: UserSession | null,
): boolean {
  if (!session || !session.username.trim()) return false;

  if (
    (session.accountRole === "teacher" || session.isTeacher) &&
    session.accessMode === "registered"
  ) {
    return true;
  }

  if (
    session.accountRole === "parent_master" &&
    session.accessMode === "registered"
  ) {
    return true;
  }

  return (
    session.curriculumCohort === "explorer" ||
    session.curriculumCohort === "pathfinder" ||
    session.curriculumCohort === "maverick"
  );
}


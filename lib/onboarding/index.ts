export {
  BIRTH_YEAR_MIN,
  getBirthYearMax,
  getBirthYearRangeLabel,
  getEligibleBirthYears,
  isEligibleBirthYear,
} from "./birth-years";
export {
  APP_SESSION_STORAGE_KEYS,
  clearAllAppSessionState,
} from "./clear-app-session-state";
export {
  clearGenericProfilePool,
  genericProfileIdToUsername,
  GENERIC_PROFILE_POOL_STORAGE_KEY,
  releaseGenericProfileId,
  reserveGenericProfileId,
} from "./generic-profile-id";
export {
  captureGuestProgressSnapshot,
  clearGuestProgressSnapshot,
  ensureGuestProgressSnapshot,
  GUEST_PROGRESS_SNAPSHOT_KEY,
  mergeGuestProgressSnapshot,
  readGuestProgressSnapshot,
} from "./guest-progress-snapshot";
export {
  clearGuestAccessSession,
  clearUserSession,
  convertToRegisteredProfile,
  createGuestAccessSession,
  enforceCohortAccountState,
  getComplianceTier,
  getSessionCurriculumCohort,
  hashCredential,
  hasCompletedPersonalizationGate,
  isGuestSession,
  readGuestAccessSession,
  readUserSession,
  saveGuestAccessSession,
  saveUserSession,
  updateUserBirthYear,
  updateUserCurriculumCohort,
  GUEST_SESSION_STORAGE_KEY,
  ONBOARDING_ENTRY_PATH,
  ONBOARDING_PARENT_CONSENT_PATH,
  ONBOARDING_SIGN_IN_PATH,
  ONBOARDING_SIGN_UP_PATH,
  ONBOARDING_SIGN_UP_PENDING_PATH,
  ONBOARDING_START_PATH,
  DASHBOARD_ACADEMY_PATH,
  type AccessMode,
  type AccountLifecycleStatus,
  type AccountRole,
  type AccountState,
  type ComplianceTier,
  type GuestAccessMode,
  type GuestAccessSession,
  type GuestProfileInput,
  type RegisteredAccountStatus,
  type RegisteredProfileInput,
  type UserSession,
} from "./guest-session";
export { changeUserLearningTrack } from "./change-learning-track";
export {
  authenticateRegisteredAccount,
  clearRegisteredAccounts,
  findRegisteredAccountByUsername,
  findRegisteredAccountsByEmail,
  isRegisteredUsernameTaken,
  recoverCredentialByEmail,
  recoverUsernameByEmail,
  REGISTERED_ACCOUNTS_STORAGE_KEY,
  upsertRegisteredAccount,
} from "./registered-accounts";
export { finalizeRegisteredSignup } from "./signup-finalize";
export {
  approveParentConsent,
  buildParentConsentApprovalPath,
  clearPendingParentConsent,
  createPendingParentConsent,
  lookupConsentToken,
  PENDING_PARENT_CONSENT_KEY,
  readPendingParentConsent,
  resendParentConsentApproval,
} from "./parent-consent-pending";
export type {
  ConsentTokenLookup,
  PendingParentConsent,
} from "./parent-consent-pending";

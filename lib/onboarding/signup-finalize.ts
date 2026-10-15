import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import {
  isEmptyAccountProgress,
  overlayAccountProgress,
} from "@/lib/dashboard/account-progress";
import {
  collectAccountProgress,
  persistAccountProgressCacheFromLive,
} from "@/lib/dashboard/account-progress-local";
import { resetDashboardWalletForCurrentAccount } from "@/lib/dashboard/dashboard-wallet-storage";
import { releaseGuestDeviceLocalCopy } from "@/lib/dev/guest-device-store";
import { isExplorerPendingConsent } from "@/lib/onboarding/explorer-pending-consent";
import {
  absorbLiveProgressIntoHeldSnapshot,
  ensureGuestProgressSnapshot,
  hasForeignHeldConsentSnapshot,
  markGuestProgressHeldForConsent,
  mergeGuestProgressSnapshot,
  readGuestProgressSnapshot,
  stageHeldConsentSnapshotForAccount,
} from "@/lib/onboarding/guest-progress-snapshot";
import {
  enforceCohortAccountState,
  readUserSession,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import {
  loadLearnerProgressByUserId,
  saveLearnerProgressForUser,
} from "@/lib/onboarding/learner-progress";
import { upsertRegisteredAccount } from "@/lib/onboarding/registered-accounts";
import { createClient } from "@/lib/supabase/client";

export type FinalizeSignupOptions = {
  /**
   * Explorer VPC approval token - required to dispatch EXPLORER_PARENT.
   * Generate the token before calling finalize when creating pending consent.
   */
  explorerConsentToken?: string;
  /** Skip outbound onboarding email (e.g. consent-approval activation). */
  skipEmail?: boolean;
};

async function dispatchOnboardingEmails(
  session: UserSession,
  options?: FinalizeSignupOptions,
): Promise<void> {
  if (typeof window === "undefined" || options?.skipEmail) return;

  const username = session.username.trim();
  if (!username) return;

  if (session.accountRole === "teacher" || session.isTeacher) {
    return;
  }

  // Parent welcome, Pathfinder notices, and learner welcome mail are sent by
  // the server action that created the account. The browser does not choose
  // the recipient. Explorer approval still posts a server-issued token; the
  // send route reads the parent address from that stored request.
  if (session.accountRole === "parent_master") return;

  const cohort = session.ageTier;

  if (
    cohort === "explorer" &&
    session.accountStatus === "PENDING_CONSENT" &&
    session.parentEmail &&
    options?.explorerConsentToken
  ) {
    const result = await requestOnboardingEmailSend({
      type: "EXPLORER_PARENT",
      recipientEmail: session.parentEmail,
      data: {
        username,
        token: options.explorerConsentToken,
      },
    });
    if (!result.success) {
      const detail =
        "error" in result && typeof result.error === "string"
          ? result.error.trim()
          : "";
      throw new Error(
        detail ||
          "We could not send the parent approval email. Check the parent or guardian email address and try again.",
      );
    }
  }
}

async function persistRegisteredAccountProgress(
  session: UserSession,
): Promise<void> {
  if (typeof window === "undefined") return;

  persistAccountProgressCacheFromLive({
    userId: session.supabaseUserId,
    username: session.username,
  });

  const payload = collectAccountProgress();
  if (isEmptyAccountProgress(payload)) return;

  let childId: string | null = null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    childId = data.user?.id?.trim() || null;
  } catch {
    childId = null;
  }
  childId = childId || session.supabaseUserId?.trim() || null;
  if (!childId) return;

  const remote = await loadLearnerProgressByUserId(childId);
  await saveLearnerProgressForUser(
    childId,
    overlayAccountProgress(remote, payload) ?? payload,
  );
}

/**
 * Saves the registered session (cohort status + email rules enforced) and
 * merges guest lesson milestones, XP, badges, and Vault balances into it.
 * Triggers cohort-appropriate transactional email when applicable.
 *
 * Explorer PENDING_CONSENT: approval email is sent before any durable write so
 * a failed send never leaves an orphan pending account.
 */
export async function finalizeRegisteredSignup(
  session: UserSession,
  options?: FinalizeSignupOptions,
): Promise<UserSession> {
  if (typeof window !== "undefined") {
    stageHeldConsentSnapshotForAccount(session);
  }
  const prior = typeof window !== "undefined" ? readUserSession() : null;
  const hadGuestSnapshot =
    typeof window !== "undefined" && Boolean(readGuestProgressSnapshot());
  const keepForeignDeviceProgress =
    typeof window !== "undefined" && hasForeignHeldConsentSnapshot(session);
  const isTeacher =
    session.accountRole === "teacher" || session.isTeacher === true;
  // Returning login is already a registered profile (or a logged-out device).
  // Do not snapshot empty live storage and merge it over saved account progress.
  // Teachers never inherit a guest / previous-user wallet or lesson snapshot.
  const shouldPreserveGuestProgress =
    !isTeacher && (hadGuestSnapshot || prior?.accessMode === "guest");

  if (typeof window !== "undefined" && shouldPreserveGuestProgress) {
    ensureGuestProgressSnapshot();
  }

  const enforced = enforceCohortAccountState({
    ...session,
    accessMode: "registered",
  });

  if (enforced.accessMode !== "registered") {
    throw new Error("finalizeRegisteredSignup requires a registered session.");
  }
  if (enforced.accountStatus === "GUEST") {
    throw new Error("Registered profiles cannot remain in GUEST lifecycle state.");
  }

  const withMarketingGate = enforced;

  const isExplorerPendingConsentEmail =
    withMarketingGate.ageTier === "explorer" &&
    withMarketingGate.accountStatus === "PENDING_CONSENT" &&
    Boolean(options?.explorerConsentToken) &&
    !options?.skipEmail;

  if (isExplorerPendingConsentEmail) {
    // Email first — only persist after the approval message is handed off.
    // Progress stays on the device until the parent approves.
    await dispatchOnboardingEmails(withMarketingGate, options);
    saveUserSession(withMarketingGate);
    upsertRegisteredAccount(withMarketingGate);
    if (shouldPreserveGuestProgress) {
      markGuestProgressHeldForConsent();
    }
    return withMarketingGate;
  }

  saveUserSession(withMarketingGate);
  upsertRegisteredAccount(withMarketingGate);
  const switchedOntoTeacher =
    isTeacher &&
    (prior?.accessMode !== "registered" ||
      prior.supabaseUserId !== withMarketingGate.supabaseUserId);
  if (switchedOntoTeacher) {
    resetDashboardWalletForCurrentAccount();
  }
  if (isExplorerPendingConsent(withMarketingGate)) {
    if (shouldPreserveGuestProgress) {
      markGuestProgressHeldForConsent();
    }
    await dispatchOnboardingEmails(withMarketingGate, options);
    return withMarketingGate;
  }
  if (shouldPreserveGuestProgress) {
    absorbLiveProgressIntoHeldSnapshot();
    mergeGuestProgressSnapshot();
  }
  if (!switchedOntoTeacher) {
    await persistRegisteredAccountProgress(withMarketingGate);
  }
  await dispatchOnboardingEmails(withMarketingGate, options);
  if (!keepForeignDeviceProgress) {
    releaseGuestDeviceLocalCopy();
  }
  return withMarketingGate;
}

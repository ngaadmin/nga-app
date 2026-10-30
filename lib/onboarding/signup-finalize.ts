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
 * Onboarding email is sent by the server action that created the account.
 */
export async function finalizeRegisteredSignup(
  session: UserSession,
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
    return withMarketingGate;
  }
  if (shouldPreserveGuestProgress) {
    absorbLiveProgressIntoHeldSnapshot();
    mergeGuestProgressSnapshot();
  }
  if (!switchedOntoTeacher) {
    await persistRegisteredAccountProgress(withMarketingGate);
  }
  if (!keepForeignDeviceProgress) {
    releaseGuestDeviceLocalCopy();
  }
  return withMarketingGate;
}

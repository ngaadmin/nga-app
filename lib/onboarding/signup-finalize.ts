import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import {
  isEmptyAccountProgress,
  mergeAccountProgress,
} from "@/lib/dashboard/account-progress";
import {
  collectAccountProgress,
  persistAccountProgressCacheFromLive,
} from "@/lib/dashboard/account-progress-local";
import {
  ensureGuestProgressSnapshot,
  mergeGuestProgressSnapshot,
  readGuestProgressSnapshot,
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
import {
  findActiveParentMasterByEmail,
  upsertRegisteredAccount,
} from "@/lib/onboarding/registered-accounts";
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

/** Portable parent-dashboard claim token for Pathfinder FYI emails. */
async function issuePathfinderParentClaimToken(input: {
  parentEmail: string;
  childUsername: string;
  birthYear: number;
}): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/consent-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentEmail: input.parentEmail,
        childUsername: input.childUsername,
        birthYear: input.birthYear,
        createdAt: new Date().toISOString(),
      }),
    });
    const json = (await response.json().catch(() => null)) as {
      success?: boolean;
      token?: string;
    } | null;
    if (!response.ok || !json?.token) return null;
    return json.token;
  } catch {
    return null;
  }
}

async function dispatchOnboardingEmails(
  session: UserSession,
  options?: FinalizeSignupOptions,
): Promise<void> {
  if (typeof window === "undefined" || options?.skipEmail) return;

  const username = session.username.trim();
  if (!username) return;

  if (session.accountRole === "parent_master") {
    const parentEmail = (
      session.learnerEmail ??
      session.email ??
      session.parentEmail
    )
      ?.trim()
      .toLowerCase();
    if (!parentEmail) return;
    void requestOnboardingEmailSend({
      type: "PARENT_WELCOME",
      recipientEmail: parentEmail,
      data: { username },
    });
    return;
  }

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
    return;
  }

  if (cohort === "pathfinder" && session.accountStatus === "ACTIVE") {
    const parentEmail = session.parentEmail?.trim().toLowerCase();
    if (!parentEmail) return;

    // Parent FYI / linked notice must not block signup navigation.
    void (async () => {
      const existingMaster = findActiveParentMasterByEmail(parentEmail);
      if (existingMaster) {
        await requestOnboardingEmailSend({
          type: "PATHFINDER_PARENT_LINKED",
          recipientEmail: parentEmail,
          data: {
            username,
            masterUsername: parentEmail,
          },
        });
        return;
      }

      const token = await issuePathfinderParentClaimToken({
        parentEmail,
        childUsername: username,
        birthYear: session.birthYear,
      });
      if (!token) return;

      await requestOnboardingEmailSend({
        type: "PATHFINDER_PARENT",
        recipientEmail: parentEmail,
        data: { username, token },
      });
    })();
    return;
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
    mergeAccountProgress(remote, payload) ?? payload,
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
  const prior = typeof window !== "undefined" ? readUserSession() : null;
  const hadGuestSnapshot =
    typeof window !== "undefined" && Boolean(readGuestProgressSnapshot());
  // Returning login is already a registered profile (or a logged-out device).
  // Do not snapshot empty live storage and merge it over saved account progress.
  const shouldPreserveGuestProgress =
    hadGuestSnapshot || prior?.accessMode === "guest";

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
    await dispatchOnboardingEmails(withMarketingGate, options);
    saveUserSession(withMarketingGate);
    upsertRegisteredAccount(withMarketingGate);
    if (shouldPreserveGuestProgress) {
      mergeGuestProgressSnapshot();
    }
    await persistRegisteredAccountProgress(withMarketingGate);
    return withMarketingGate;
  }

  saveUserSession(withMarketingGate);
  upsertRegisteredAccount(withMarketingGate);
  if (shouldPreserveGuestProgress) {
    mergeGuestProgressSnapshot();
  }
  await persistRegisteredAccountProgress(withMarketingGate);
  await dispatchOnboardingEmails(withMarketingGate, options);
  return withMarketingGate;
}

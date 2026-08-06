import { requestOnboardingEmailSend } from "@/lib/email/request-send";
import {
  ensureGuestProgressSnapshot,
  mergeGuestProgressSnapshot,
} from "@/lib/onboarding/guest-progress-snapshot";
import {
  enforceCohortAccountState,
  saveUserSession,
  type UserSession,
} from "@/lib/onboarding/guest-session";
import { upsertRegisteredAccount } from "@/lib/onboarding/registered-accounts";

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
    if (!session.parentEmail) return;
    void requestOnboardingEmailSend({
      type: "PATHFINDER_PARENT",
      recipientEmail: session.parentEmail,
      data: { username },
    });
    return;
  }

  if (cohort === "maverick" && session.accountStatus === "ACTIVE") {
    const learnerEmail = session.learnerEmail ?? session.email;
    if (!learnerEmail) return;
    void requestOnboardingEmailSend({
      type: "MAVERICK_WELCOME",
      recipientEmail: learnerEmail,
      data: { username },
    });
  }
}

/**
 * Saves the registered session (cohort status + email rules enforced) and
 * merges guest lesson milestones, XP, badges, and Vault balances into it.
 * Triggers cohort-appropriate transactional email when applicable.
 */
export async function finalizeRegisteredSignup(
  session: UserSession,
  options?: FinalizeSignupOptions,
): Promise<UserSession> {
  if (typeof window !== "undefined") {
    // Capture any still-live guest assets before the registered write lands.
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

  // Explorers never collect marketing consent during child onboarding.
  const withMarketingGate =
    enforced.ageTier === "explorer"
      ? { ...enforced, marketingOptIn: false }
      : enforced;

  saveUserSession(withMarketingGate);
  upsertRegisteredAccount(withMarketingGate);
  mergeGuestProgressSnapshot();
  await dispatchOnboardingEmails(withMarketingGate, options);
  return withMarketingGate;
}

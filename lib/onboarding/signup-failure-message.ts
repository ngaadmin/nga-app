/**
 * Sign-up form error text. Shared by `components/onboarding/sign-up-form.tsx`.
 *
 * Parent approval is decided by age (under 16, on every track), so approval
 * errors never name a cohort. Only the username prompt names the track, and
 * only for an Explorer.
 */

export const USERNAME_TAKEN_ERROR =
  "That username is already taken. Try adding a favorite number!";

export type SignupFailureContext = {
  /** The learner picked the Explorer track. */
  isExplorer: boolean;
  /** Under 16 (or the under-16 path was already reached): approval needed. */
  needsParentApproval: boolean;
};

export function resolveSignupFailureMessage(
  error: unknown,
  context: SignupFailureContext,
): string {
  const { isExplorer, needsParentApproval } = context;
  const message = error instanceof Error ? error.message.trim() : "";

  if (message) {
    if (/username is already taken/i.test(message)) {
      return USERNAME_TAKEN_ERROR;
    }
    if (/too many approval|too many email|try again shortly|wait about a minute/i.test(message)) {
      return message;
    }
    if (
      /parent approval email|parent or guardian email|valid parent|approval link|approval-link/i.test(
        message,
      )
    ) {
      return message;
    }
    if (/consent token signature|consent token email|consent token username/i.test(message)) {
      return "We could not verify the approval link for this profile. Please try sending again.";
    }
    if (/password must be at least 6|password \(at least 6\)/i.test(message)) {
      return "Use at least 6 characters for your password.";
    }
    if (/learner email/i.test(message)) {
      return message;
    }
    if (/Username is required|Pick a username/i.test(message)) {
      return isExplorer
        ? "Pick a username for your Explorer profile."
        : "Pick a username for your account.";
    }
    // Prefer the thrown message when it is already user-facing.
    if (message.length <= 180 && !/finalizeRegisteredSignup|requires a registered/i.test(message)) {
      return message;
    }
  }

  // Parent approval depends on age (under PARENT_APPROVAL_MIN_AGE), not track.
  return needsParentApproval
    ? "We could not start parent approval for this profile. Check your details and try again."
    : "We could not create your profile. Check your details and try again.";
}

/**
 * Who gets the "profile deleted" notice when a learner deletes their own
 * older device-only account in Settings.
 *
 * Rule (Cath, 1 Nov 2026):
 * 1. A parent email is on file: send to the parent. The linked household
 *    email comes first, then the parent email saved on the account.
 * 2. No parent email, and the learner is 13 or older: send to the learner's
 *    own email (`learnerEmail`, or the legacy `email` field).
 * 3. No parent email, and the learner is under 13: send nothing.
 *
 * The birth year is never stored. The only stored age signal is
 * `parentApprovalRequired`: `false` means the learner passed the 16-and-over
 * check at sign-up, so they are 13 or older. `true` (under 16) or a missing
 * flag cannot prove 13 or older, so it is treated as under 13 and no email
 * goes to the learner. An explicit `learnerAge` (when a caller knows it)
 * takes precedence.
 */
export const SELF_DELETE_LEARNER_NOTICE_MIN_AGE = 13;

export type SelfDeleteNoticeAccount = {
  parentEmail?: string | null;
  learnerEmail?: string | null;
  email?: string | null;
  parentApprovalRequired?: boolean | null;
};

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

/** True only when the learner is known to be 13 or older. Unknown counts as under 13. */
export function isLearnerKnown13OrOlder(input: {
  account: SelfDeleteNoticeAccount | null | undefined;
  learnerAge?: number | null;
}): boolean {
  if (typeof input.learnerAge === "number" && Number.isFinite(input.learnerAge)) {
    return input.learnerAge >= SELF_DELETE_LEARNER_NOTICE_MIN_AGE;
  }
  return input.account?.parentApprovalRequired === false;
}

export function resolveSelfDeleteNoticeRecipient(input: {
  householdEmail: string | null | undefined;
  account: SelfDeleteNoticeAccount | null | undefined;
  /** Exact age when known. Otherwise derived from `parentApprovalRequired`. */
  learnerAge?: number | null;
}): string | null {
  for (const candidate of [input.householdEmail, input.account?.parentEmail]) {
    const normalized = normalize(candidate);
    if (normalized) return normalized;
  }

  if (!isLearnerKnown13OrOlder(input)) return null;

  for (const candidate of [input.account?.learnerEmail, input.account?.email]) {
    const normalized = normalize(candidate);
    if (normalized) return normalized;
  }
  return null;
}

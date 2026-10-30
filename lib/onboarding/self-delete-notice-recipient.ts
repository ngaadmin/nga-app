/**
 * Who gets the "profile deleted" notice when a learner deletes their own
 * older device-only account in Settings.
 *
 * Only a parent address: the linked household email first, then the parent
 * email saved on the account. Never the learner's own address (learnerEmail or
 * the legacy `email` field). With no parent address, nothing is sent.
 */
export function resolveSelfDeleteNoticeRecipient(input: {
  householdEmail: string | null | undefined;
  account: { parentEmail?: string | null } | null | undefined;
}): string | null {
  for (const candidate of [input.householdEmail, input.account?.parentEmail]) {
    const normalized = candidate?.trim().toLowerCase() ?? "";
    if (normalized) return normalized;
  }
  return null;
}

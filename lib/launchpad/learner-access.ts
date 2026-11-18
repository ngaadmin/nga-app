/**
 * Who may enter the signed-in Launchpad.
 *
 * The live column is profiles.account_status (active, pending_consent,
 * declined). Launchpad is only for a child whose account is active: a parent
 * has approved, or the learner is 16+ so parent_approval_required is false
 * and the account starts active. A pending or declined child, and anyone who
 * is not a child, is refused. A missing or unknown status fails closed.
 */

/** A signed-in learner. Parents, teachers, and guests are not learners. */
export function launchpadLearnerRoleAllowed(
  accountRole: string | null | undefined,
): boolean {
  return accountRole === "child";
}

export function launchpadLearnerMayEnterProfile(input: {
  accountRole?: string | null;
  accountStatus?: string | null;
}): boolean {
  if (!launchpadLearnerRoleAllowed(input.accountRole)) return false;
  const status = input.accountStatus?.trim().toLowerCase() ?? "";
  return status === "active";
}

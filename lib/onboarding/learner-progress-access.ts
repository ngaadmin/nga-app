/**
 * Who may read or write a learner_progress row.
 * The signed-in account, or a parent with that child in parent_child.
 */
export function learnerProgressAccessAllowed(input: {
  actorId: string | null | undefined;
  targetUserId: string | null | undefined;
  linkedChildIds?: readonly string[] | null;
}): boolean {
  const actor = input.actorId?.trim() ?? "";
  const target = input.targetUserId?.trim() ?? "";
  if (!actor || !target) return false;
  if (actor === target) return true;
  return (input.linkedChildIds ?? []).some((id) => id.trim() === target);
}

/** Account statuses whose learner_progress row must not be written. */
export const LEARNER_PROGRESS_WRITE_BLOCKED_STATUSES = [
  "pending_consent",
  "declined",
] as const;

/**
 * Whether learner_progress may be written for a target with this
 * profiles.account_status. Writes run with the service role, which skips the
 * learner_progress RLS that blocks pending_consent rows, so the same rule is
 * checked here: a learner still waiting for consent, or one a parent
 * declined, gets no cloud progress. An unknown or missing status is refused
 * (fail closed). Matches the Parent Hub rule that a waiting child carries no
 * progress.
 */
export function learnerProgressWriteAllowedForStatus(
  accountStatus: string | null | undefined,
): boolean {
  const status = accountStatus?.trim().toLowerCase() ?? "";
  if (!status) return false;
  if ((LEARNER_PROGRESS_WRITE_BLOCKED_STATUSES as readonly string[]).includes(status)) {
    return false;
  }
  return status === "active";
}

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

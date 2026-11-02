/**
 * Who sees the Parent tab (the Parent Hub): a parent master with at least one
 * linked child whose account is active or waiting for their OK, or with a
 * consent request waiting for them. Approvals live only in the Parent Hub,
 * so a parent whose only child is still pending must be able to open it.
 * Declined children don't count, and learners, teachers, guests and
 * adult-only accounts never see it.
 */
export type ParentTabChildRow = {
  accountRole: string | null;
  accountStatus: string | null;
};

export function isParentTabEligible(input: {
  accountRole: string | null | undefined;
  linkedChildren: readonly ParentTabChildRow[];
  /** Consent requests waiting for this parent's OK. */
  pendingApprovals?: number;
}): boolean {
  if (input.accountRole !== "parent_master") return false;
  if ((input.pendingApprovals ?? 0) > 0) return true;
  return input.linkedChildren.some(
    (child) =>
      child.accountRole === "child" &&
      (child.accountStatus === "active" ||
        child.accountStatus === "pending_consent"),
  );
}

export const PARENT_TAB_HREF = "/dashboard/parent" as const;

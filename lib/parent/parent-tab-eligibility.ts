/**
 * Who sees the Parent tab: a parent master with at least one linked child
 * whose account is active. Pending or declined children don't count, and
 * learners, teachers, guests and adult-only accounts never see it.
 */
export type ParentTabChildRow = {
  accountRole: string | null;
  accountStatus: string | null;
};

export function isParentTabEligible(input: {
  accountRole: string | null | undefined;
  linkedChildren: readonly ParentTabChildRow[];
}): boolean {
  if (input.accountRole !== "parent_master") return false;
  return input.linkedChildren.some(
    (child) =>
      child.accountRole === "child" && child.accountStatus === "active",
  );
}

export const PARENT_TAB_HREF = "/dashboard/parent" as const;

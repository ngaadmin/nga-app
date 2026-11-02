/**
 * The app has one parent PIN: the Parent PIN (see docs/parent-pins-proposal.md).
 * It opens the Parent Hub, the cash rate, approvals, My account and
 * Your data & privacy. Gates name it the same way everywhere.
 */
export const PIN_NAMES = {
  parent: "Parent PIN",
} as const;

/** "your children's data" with 2+ linked children, else "your child's data". */
export function childDataPhrase(childCount?: number | null): string {
  return typeof childCount === "number" && childCount >= 2
    ? "your children's data"
    : "your child's data";
}

/** Parent Hub menu subtitle with the same plural rule. */
export function parentHubSubtitle(childCount?: number | null): string {
  return typeof childCount === "number" && childCount >= 2
    ? "Approvals and your children's progress"
    : "Approvals and your child's progress";
}

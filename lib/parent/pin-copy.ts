/**
 * The app has two parent PINs (see docs/parent-pins-proposal.md). Every gate
 * names the one it asks for and carries the same one-line explanation.
 */
export const PIN_NAMES = {
  hub: "Parent Hub PIN",
  parent: "Parent PIN",
} as const;

/** "your children's data" with 2+ linked children, else "your child's data". */
export function childDataPhrase(childCount?: number | null): string {
  return typeof childCount === "number" && childCount >= 2
    ? "your children's data"
    : "your child's data";
}

export function pinDifferenceLine(childCount?: number | null): string {
  return `Your Parent Hub PIN opens the Parent Hub and the cash rate. Your Parent PIN is a separate code for ${childDataPhrase(childCount)} and your account.`;
}

export const PIN_DIFFERENCE_LINE = pinDifferenceLine(1);

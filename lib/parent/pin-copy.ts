/**
 * The app has two parent PINs (see docs/parent-pins-proposal.md). Every gate
 * names the one it asks for and carries the same one-line explanation.
 */
export const PIN_NAMES = {
  hub: "Parent Hub PIN",
  parent: "Parent PIN",
} as const;

export const PIN_DIFFERENCE_LINE =
  "Your Parent Hub PIN opens the Parent Hub and the cash rate. Your Parent PIN is a separate code for your child's data and your account.";

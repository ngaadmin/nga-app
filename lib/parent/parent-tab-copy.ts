/**
 * Helper line under a "To settle" row. Mark as paid is only the parent's
 * note that they paid the child in the real world; the app moves no money.
 */
export function settleHelpLine(cashIns: number): string {
  const count = Number.isInteger(cashIns) && cashIns > 0 ? cashIns : 0;
  const from =
    count > 0 ? `From ${count} ${count === 1 ? "cash-in" : "cash-ins"}. ` : "";
  return `${from}You pay this outside the app, then tap Mark as paid.`;
}

/** Shared compound-savings projection math for Vault dashboards. */

export const HIGH_ROI_WARNING_THRESHOLD = 12;

export function projectCompoundSavings(
  principal: number,
  weeklyTopUp: number,
  years: number,
  annualRoiPercent: number,
): number {
  const safePrincipal = Math.max(0, principal);
  const safeWeeklyTopUp = Math.max(0, weeklyTopUp);
  const safeYears = Math.max(0, years);
  const annualRate = Math.max(0, annualRoiPercent) / 100;
  const weeklyRate = annualRate / 52;
  const totalWeeks = Math.round(safeYears * 52);

  let balance = safePrincipal;
  for (let week = 0; week < totalWeeks; week += 1) {
    balance = balance * (1 + weeklyRate) + safeWeeklyTopUp;
  }

  return Math.round(balance);
}

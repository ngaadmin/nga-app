import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type VaultCompoundingDefaults = {
  weeklyTopUp: number;
  expectedRoi: number;
  weeklyTopUpMax: number;
  yearsSavedMax: number;
};

export const FREEMIUM_YEARS_SAVED_MAX = 10;
export const PREMIUM_YEARS_SAVED_MAX = 30;
export const PREMIUM_WEEKLY_TOP_UP_MAX = 100;

/** Conservative, cohort-scaled defaults for the Vault compounding calculator. */
export function getVaultCompoundingDefaults(
  cohort: MasteryCohort,
): VaultCompoundingDefaults {
  switch (cohort) {
    case "explorer":
      return {
        weeklyTopUp: 5,
        expectedRoi: 4,
        weeklyTopUpMax: 25,
        yearsSavedMax: FREEMIUM_YEARS_SAVED_MAX,
      };
    case "pathfinder":
      return {
        weeklyTopUp: 10,
        expectedRoi: 5,
        weeklyTopUpMax: 35,
        yearsSavedMax: FREEMIUM_YEARS_SAVED_MAX,
      };
    case "maverick":
      return {
        weeklyTopUp: 25,
        expectedRoi: 5,
        weeklyTopUpMax: 50,
        yearsSavedMax: FREEMIUM_YEARS_SAVED_MAX,
      };
  }
}

export function resolveCompoundingLimits(
  cohort: MasteryCohort,
  isPremium: boolean,
): { weeklyTopUpMax: number; yearsSavedMax: number } {
  const defaults = getVaultCompoundingDefaults(cohort);
  if (!isPremium) {
    return {
      weeklyTopUpMax: defaults.weeklyTopUpMax,
      yearsSavedMax: defaults.yearsSavedMax,
    };
  }
  return {
    weeklyTopUpMax: PREMIUM_WEEKLY_TOP_UP_MAX,
    yearsSavedMax: PREMIUM_YEARS_SAVED_MAX,
  };
}

export function resolveFutureSavingsPotential(
  savingsBalance: number,
  projectedTotal: number,
): number {
  if (savingsBalance <= 0) return 0;
  return projectedTotal;
}

import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type VaultCompoundingDefaults = {
  weeklyTopUp: number;
  expectedRoi: number;
  weeklyTopUpMax: number;
};

/** Conservative, cohort-scaled defaults for the Vault compounding calculator. */
export function getVaultCompoundingDefaults(
  cohort: MasteryCohort,
): VaultCompoundingDefaults {
  switch (cohort) {
    case "explorer":
      return { weeklyTopUp: 5, expectedRoi: 4, weeklyTopUpMax: 25 };
    case "pathfinder":
      return { weeklyTopUp: 10, expectedRoi: 5, weeklyTopUpMax: 35 };
    case "maverick":
      return { weeklyTopUp: 25, expectedRoi: 5, weeklyTopUpMax: 50 };
  }
}

export function resolveFutureSavingsPotential(
  savingsBalance: number,
  projectedTotal: number,
): number {
  if (savingsBalance <= 0) return 0;
  return projectedTotal;
}

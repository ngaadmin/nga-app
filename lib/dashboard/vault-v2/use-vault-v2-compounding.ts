"use client";

import { useMemo, useState } from "react";
import {
  getVaultCompoundingDefaults,
  resolveCompoundingLimits,
  resolveFutureSavingsPotential,
} from "@/lib/dashboard/vault-compounding-defaults";
import { projectCompoundSavings } from "@/lib/dashboard/vault-compounding";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";

export function useVaultV2Compounding(totalSavings: number, isPremium: boolean) {
  const cohort = useMasteryCohort();
  const compoundingDefaults = useMemo(
    () => getVaultCompoundingDefaults(cohort),
    [cohort],
  );
  const compoundingLimits = useMemo(
    () => resolveCompoundingLimits(cohort, isPremium),
    [cohort, isPremium],
  );

  const [yearsSaved, setYearsSaved] = useState(5);
  const [weeklyTopUp, setWeeklyTopUp] = useState(compoundingDefaults.weeklyTopUp);
  const [expectedRoi, setExpectedRoi] = useState(compoundingDefaults.expectedRoi);

  const projectedTotal = useMemo(
    () =>
      projectCompoundSavings(totalSavings, weeklyTopUp, yearsSaved, expectedRoi),
    [expectedRoi, totalSavings, weeklyTopUp, yearsSaved],
  );

  const futureSavingsPotential = useMemo(
    () => resolveFutureSavingsPotential(totalSavings, projectedTotal),
    [projectedTotal, totalSavings],
  );

  const futureSubtext =
    totalSavings > 0
      ? `${expectedRoi}% ROI · ${yearsSaved} yrs`
      : "Save first to unlock my forecast";

  return {
    yearsSaved,
    weeklyTopUp,
    expectedRoi,
    projectedTotal,
    futureSavingsPotential,
    futureSubtext,
    yearsSavedMax: compoundingLimits.yearsSavedMax,
    weeklyTopUpMax: compoundingLimits.weeklyTopUpMax,
    setYearsSaved,
    setWeeklyTopUp,
    setExpectedRoi,
  };
}

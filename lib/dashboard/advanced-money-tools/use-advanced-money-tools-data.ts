"use client";

import { useMemo } from "react";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import {
  computeTotalSavings,
  resolveVaultSavingsGoals,
} from "@/lib/dashboard/savings-goals";
import { useVaultProfile } from "@/lib/dashboard/vault/vault-profile-context";
import { useTestingPremiumUnlocked } from "@/lib/dashboard/testing-premium";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";

export function useAdvancedMoneyToolsData() {
  const { ledger, jars, savingsGoals } = useVaultProfile();
  const masteryCohort = useMasteryCohort();
  const isPremium = useTestingPremiumUnlocked();

  const vaultGoals = useMemo(
    () =>
      resolveVaultSavingsGoals(
        savingsGoals,
        masteryCohort,
        isPremium,
      ),
    [isPremium, masteryCohort, savingsGoals],
  );

  const saveJarBalance = useMemo(
    () => jars.find((jar) => jar.id === SAVINGS_JAR_ID)?.balance ?? 0,
    [jars],
  );

  const totalSavings = useMemo(
    () => roundAudAmount(computeTotalSavings(saveJarBalance, vaultGoals)),
    [saveJarBalance, vaultGoals],
  );

  return {
    isPremium,
    ledger,
    totalSavings,
  };
}

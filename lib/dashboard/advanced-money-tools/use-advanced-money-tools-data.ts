"use client";

import { useMemo } from "react";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import {
  computeTotalSavings,
  resolveVaultSavingsGoals,
} from "@/lib/dashboard/savings-goals";
import { useVaultLedger } from "@/lib/dashboard/vault-ledger-context";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";

/** Premium billing is not wired yet — defaults to freemium limits. */
const ADVANCED_MONEY_TOOLS_IS_PREMIUM = false;

export function useAdvancedMoneyToolsData() {
  const { ledger } = useVaultLedger();
  const masteryCohort = useMasteryCohort();
  const { jars, savingsGoals } = useDashboardWallet();

  const vaultGoals = useMemo(
    () =>
      resolveVaultSavingsGoals(
        savingsGoals,
        masteryCohort,
        ADVANCED_MONEY_TOOLS_IS_PREMIUM,
      ),
    [masteryCohort, savingsGoals],
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
    isPremium: ADVANCED_MONEY_TOOLS_IS_PREMIUM,
    ledger,
    totalSavings,
  };
}

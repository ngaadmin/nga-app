"use client";

import { useState } from "react";
import { VaultV2CompoundingCalculatorPanel } from "@/components/dashboard/vault-v2/vault-v2-compounding-calculator-panel";
import { VaultV2LedgerPanel } from "@/components/dashboard/vault-v2/vault-v2-ledger-panel";
import {
  VaultV2FuturePotentialTile,
  VaultV2LedgerTile,
  VaultV2MoreToolsToolCard,
} from "@/components/dashboard/vault-v2/vault-v2-more-tools-tool-card";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { buildHighRoiWarningCopy, resolveFinnAddressName } from "@/lib/dashboard/resolve-finn-address-name";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { useVaultV2Compounding } from "@/lib/dashboard/vault-v2/use-vault-v2-compounding";
import { vaultV2Copy } from "@/lib/dashboard/vault-v2/copy";
import type { LedgerEntry } from "@/lib/dashboard/vault-ledger";

type VaultV2MoreToolsViewProps = {
  totalSavings: number;
  isPremium: boolean;
  ledger: LedgerEntry[];
  onBack: () => void;
};

export function VaultV2MoreToolsView({
  totalSavings,
  isPremium,
  ledger,
  onBack,
}: VaultV2MoreToolsViewProps) {
  const { formatMoney } = useCurrency();
  const { username, isLoading } = useDashboardUser();
  const displayName = resolveFinnAddressName(username, isLoading);
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const ledgerCopy = copyMatrix.dashboard.vault.ledger;

  const [expandedTool, setExpandedTool] = useState<"future-potential" | "ledger" | null>(
    "future-potential",
  );

  const compounding = useVaultV2Compounding(totalSavings, isPremium);
  const highRoiWarningCopy = buildHighRoiWarningCopy(displayName);
  const ledgerTitle = ledgerCopy.titleTemplate.replace("{name}", displayName);

  function toggleTool(tool: "future-potential" | "ledger") {
    setExpandedTool((current) => (current === tool ? null : tool));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-extrabold text-[#031F82]">
          {vaultV2Copy.moreToolsHeading}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:text-[#031F82]"
        >
          {vaultV2Copy.backToVaultLabel}
        </button>
      </div>

      <p className="font-sans text-sm leading-snug text-[#1E3A5F]/80">
        {vaultV2Copy.moreToolsBody}
      </p>

      <div className="space-y-4">
        <VaultV2MoreToolsToolCard
          title={budgetCopy.futurePotentialLabel}
          description={vaultV2Copy.futurePotentialDescription}
          tile={
            <VaultV2FuturePotentialTile
              title={budgetCopy.futurePotentialLabel}
              projectedAmount={formatMoney(compounding.futureSavingsPotential)}
              subtext={compounding.futureSubtext}
            />
          }
          isExpanded={expandedTool === "future-potential"}
          onToggle={() => toggleTool("future-potential")}
          expandAriaLabel={vaultV2Copy.futurePotentialExpandAriaLabel}
        >
          <VaultV2CompoundingCalculatorPanel
            savingsBalance={totalSavings}
            projectedTotal={compounding.projectedTotal}
            isPremium={isPremium}
            yearsSaved={compounding.yearsSaved}
            yearsSavedMax={compounding.yearsSavedMax}
            weeklyTopUp={compounding.weeklyTopUp}
            weeklyTopUpMax={compounding.weeklyTopUpMax}
            expectedRoi={compounding.expectedRoi}
            highRoiWarningCopy={highRoiWarningCopy}
            onYearsSavedChange={compounding.setYearsSaved}
            onWeeklyTopUpChange={compounding.setWeeklyTopUp}
            onExpectedRoiChange={compounding.setExpectedRoi}
          />
        </VaultV2MoreToolsToolCard>

        <VaultV2MoreToolsToolCard
          title={ledgerTitle}
          description={vaultV2Copy.ledgerDescription}
          tile={
            <VaultV2LedgerTile
              title={vaultV2Copy.ledgerTileLabel}
              subtitle={ledgerCopy.subtitle}
            />
          }
          isExpanded={expandedTool === "ledger"}
          onToggle={() => toggleTool("ledger")}
          expandAriaLabel={vaultV2Copy.ledgerExpandAriaLabel}
        >
          <VaultV2LedgerPanel ledger={ledger} copy={ledgerCopy} />
        </VaultV2MoreToolsToolCard>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-auto w-full rounded-xl border border-[#BDE9FB] bg-white py-3 font-heading text-sm font-bold text-[#031F82] transition-colors hover:bg-[#F0FBFF]"
      >
        {vaultV2Copy.backToVaultLabel}
      </button>
    </div>
  );
}

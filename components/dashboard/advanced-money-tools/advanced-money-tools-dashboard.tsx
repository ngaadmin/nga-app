"use client";

import { useState } from "react";
import { AdvancedMoneyToolsCompoundingPanel } from "@/components/dashboard/advanced-money-tools/advanced-money-tools-compounding-panel";
import { AdvancedMoneyToolsLedgerPanel } from "@/components/dashboard/advanced-money-tools/advanced-money-tools-ledger-panel";
import {
  AdvancedMoneyToolsToolCard,
  FuturePotentialTile,
  LedgerTile,
} from "@/components/dashboard/advanced-money-tools/advanced-money-tools-tool-card";
import { copyMatrix } from "@/constants/copyMatrix";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";
import { useAdvancedMoneyToolsCompounding } from "@/lib/dashboard/advanced-money-tools/use-advanced-money-tools-compounding";
import { useAdvancedMoneyToolsData } from "@/lib/dashboard/advanced-money-tools/use-advanced-money-tools-data";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { buildHighRoiWarningCopy, resolveFinnAddressName } from "@/lib/dashboard/resolve-finn-address-name";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";

export function AdvancedMoneyToolsDashboard() {
  const { formatMoney } = useCurrency();
  const { username, isLoading } = useDashboardUser();
  const displayName = resolveFinnAddressName(username, isLoading);
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const ledgerCopy = copyMatrix.dashboard.vault.ledger;
  const { isPremium, ledger, totalSavings } = useAdvancedMoneyToolsData();

  const [expandedTool, setExpandedTool] = useState<"future-potential" | "ledger" | null>(
    "future-potential",
  );

  const compounding = useAdvancedMoneyToolsCompounding(totalSavings, isPremium);
  const highRoiWarningCopy = buildHighRoiWarningCopy(displayName);
  const ledgerTitle = ledgerCopy.titleTemplate.replace("{name}", displayName);

  function toggleTool(tool: "future-potential" | "ledger") {
    setExpandedTool((current) => (current === tool ? null : tool));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-lg font-extrabold text-[#031F82]">
          {advancedMoneyToolsCopy.pageHeading}
        </h1>
        <p className="font-sans text-sm leading-snug text-[#1E3A5F]/80">
          {advancedMoneyToolsCopy.pageBody}
        </p>
      </div>

      <div className="space-y-4">
        <AdvancedMoneyToolsToolCard
          title={budgetCopy.futurePotentialLabel}
          description={advancedMoneyToolsCopy.futurePotentialDescription}
          tile={
            <FuturePotentialTile
              title={budgetCopy.futurePotentialLabel}
              projectedAmount={formatMoney(compounding.futureSavingsPotential)}
              subtext={compounding.futureSubtext}
            />
          }
          isExpanded={expandedTool === "future-potential"}
          onToggle={() => toggleTool("future-potential")}
          expandAriaLabel={advancedMoneyToolsCopy.futurePotentialExpandAriaLabel}
        >
          <AdvancedMoneyToolsCompoundingPanel
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
        </AdvancedMoneyToolsToolCard>

        <AdvancedMoneyToolsToolCard
          title={ledgerTitle}
          description={advancedMoneyToolsCopy.ledgerDescription}
          tile={
            <LedgerTile
              title={advancedMoneyToolsCopy.ledgerTileLabel}
              subtitle={ledgerCopy.subtitle}
            />
          }
          isExpanded={expandedTool === "ledger"}
          onToggle={() => toggleTool("ledger")}
          expandAriaLabel={advancedMoneyToolsCopy.ledgerExpandAriaLabel}
        >
          <AdvancedMoneyToolsLedgerPanel ledger={ledger} copy={ledgerCopy} />
        </AdvancedMoneyToolsToolCard>
      </div>
    </div>
  );
}

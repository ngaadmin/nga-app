"use client";

import { useState } from "react";
import { AdvancedMoneyToolsCompoundingPanel } from "@/components/dashboard/advanced-money-tools/advanced-money-tools-compounding-panel";
import { AdvancedMoneyToolsLedgerPanel } from "@/components/dashboard/advanced-money-tools/advanced-money-tools-ledger-panel";
import {
  AdvancedMoneyToolsToolCard,
  GrowthPotentialTile,
  LedgerTile,
  MoneyMilestonesTile,
} from "@/components/dashboard/advanced-money-tools/advanced-money-tools-tool-card";
import { MoneyMilestonesSection } from "@/components/dashboard/vault/money-milestones-section";
import { PremiumUpgradeModal } from "@/components/dashboard/premium-upgrade-modal";
import { copyMatrix } from "@/constants/copyMatrix";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";
import { useAdvancedMoneyToolsCompounding } from "@/lib/dashboard/advanced-money-tools/use-advanced-money-tools-compounding";
import { useAdvancedMoneyToolsData } from "@/lib/dashboard/advanced-money-tools/use-advanced-money-tools-data";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { LockIcon } from "@/lib/dashboard/icons";
import { buildHighRoiWarningCopy, resolveFinnAddressName } from "@/lib/dashboard/resolve-finn-address-name";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";

export function AdvancedMoneyToolsDashboard() {
  const { formatMoney } = useCurrency();
  const { username, isLoading } = useDashboardUser();
  const displayName = resolveFinnAddressName(username, isLoading);
  const ledgerCopy = copyMatrix.dashboard.vault.ledger;
  const { isPremium, ledger, totalSavings } = useAdvancedMoneyToolsData();

  const [expandedTool, setExpandedTool] = useState<
    "growth-potential" | "ledger" | "milestones" | null
  >(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const compounding = useAdvancedMoneyToolsCompounding(totalSavings, isPremium);
  const highRoiWarningCopy = buildHighRoiWarningCopy(displayName);
  const ledgerTitle = ledgerCopy.titleTemplate.replace("{name}", displayName);

  function toggleTool(tool: "growth-potential" | "ledger" | "milestones") {
    if (!isPremium) {
      setUpgradeOpen(true);
      return;
    }
    setExpandedTool((current) => (current === tool ? null : tool));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-lg font-extrabold text-[#031F82]">
          {advancedMoneyToolsCopy.pageHeading}
        </h1>
        <p className="font-sans text-sm leading-snug text-[#1E3A5F]/80">
          {isPremium
            ? advancedMoneyToolsCopy.pageBody
            : advancedMoneyToolsCopy.lockedBody}
        </p>
      </div>

      {!isPremium ? (
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-5 py-3 font-heading text-xs font-bold uppercase tracking-wide text-[#031F82]"
        >
          <LockIcon className="size-4" />
          {copyMatrix.dashboard.vault.budget.premiumComingSoonTitle}
        </button>
      ) : null}

      <div className="space-y-4">
        <AdvancedMoneyToolsToolCard
          title={advancedMoneyToolsCopy.growthPotentialLabel}
          description={advancedMoneyToolsCopy.growthPotentialDescription}
          tile={
            <GrowthPotentialTile
              title={advancedMoneyToolsCopy.growthPotentialLabel}
              projectedAmount={formatMoney(compounding.futureSavingsPotential)}
              subtext={compounding.futureSubtext}
            />
          }
          isExpanded={isPremium && expandedTool === "growth-potential"}
          onToggle={() => toggleTool("growth-potential")}
          expandAriaLabel={advancedMoneyToolsCopy.growthPotentialExpandAriaLabel}
        >
          {isPremium ? (
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
          ) : null}
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
          isExpanded={isPremium && expandedTool === "ledger"}
          onToggle={() => toggleTool("ledger")}
          expandAriaLabel={advancedMoneyToolsCopy.ledgerExpandAriaLabel}
        >
          {isPremium ? (
            <AdvancedMoneyToolsLedgerPanel ledger={ledger} copy={ledgerCopy} />
          ) : null}
        </AdvancedMoneyToolsToolCard>

        <AdvancedMoneyToolsToolCard
          title={advancedMoneyToolsCopy.moneyMilestonesLabel}
          description={advancedMoneyToolsCopy.moneyMilestonesDescription}
          tile={
            <MoneyMilestonesTile
              title={advancedMoneyToolsCopy.moneyMilestonesTileLabel}
            />
          }
          isExpanded={isPremium && expandedTool === "milestones"}
          onToggle={() => toggleTool("milestones")}
          expandAriaLabel={advancedMoneyToolsCopy.moneyMilestonesExpandAriaLabel}
        >
          {isPremium ? <MoneyMilestonesSection hideHeading /> : null}
        </AdvancedMoneyToolsToolCard>
      </div>

      <PremiumUpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        titleId="advanced-money-premium-title"
      />
    </div>
  );
}

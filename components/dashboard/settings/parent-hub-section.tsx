"use client";

import { useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { ShieldIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";
import { ParentHubFeatureItem } from "@/components/dashboard/settings/parent-hub-feature-item";
import { ParentConversionRatePanel } from "@/components/dashboard/settings/parent-conversion-rate-panel";
import { ParentCurrencyPanel } from "@/components/dashboard/settings/parent-currency-panel";
import { ParentLearningTrackPanel } from "@/components/dashboard/settings/parent-learning-track-panel";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  getMasteryCohortFromBirthYear,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
} from "@/lib/dashboard/mastery-cohort";
import { useUserSession } from "@/lib/dashboard/use-user-session";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

type ParentHubFeatureId = "pointsConversion" | "learningTrack" | "currency";

type ParentHubSectionProps = {
  isUnlocked: boolean;
  onRequestUnlock: () => void;
  onLock: () => void;
};

export function ParentHubSection({
  isUnlocked,
  onRequestUnlock,
  onLock,
}: ParentHubSectionProps) {
  const copy = copyMatrix.dashboard.settings.parentHub;
  const featuresCopy = copyMatrix.dashboard.settings.parentHubFeatures;
  const { currency, currencyCode } = useCurrency();
  const { audPer100Xp } = useDashboardWallet();
  const session = useUserSession();
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);

  const currentCohort = session?.birthYear
    ? getMasteryCohortFromBirthYear(session.birthYear)
    : null;
  const trackSummary = currentCohort
    ? `${masteryCohortLabel(currentCohort)} · Ages ${masteryCohortAgeRangeLabel(currentCohort)}`
    : featuresCopy.learningTrackSummaryLocked;

  const [expandedFeature, setExpandedFeature] = useState<ParentHubFeatureId | null>(null);

  function toggleFeature(id: ParentHubFeatureId) {
    if (!isUnlocked) {
      onRequestUnlock();
      return;
    }
    setExpandedFeature((current) => (current === id ? null : id));
  }

  return (
    <section
      aria-labelledby="parent-hub-heading"
      className={cn(floatingPanelClass, "overflow-hidden")}
    >
      <button
        type="button"
        onClick={isUnlocked ? onLock : onRequestUnlock}
        aria-expanded={isUnlocked}
        aria-controls="parent-hub-panel"
        className={cn(
          "flex w-full items-center gap-3 p-4 text-left transition-all hover:bg-[#BDE9FB]/10",
          isUnlocked && "border-b border-[#BDE9FB]/60",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#DCB766]/15 text-[#DCB766]">
          <ShieldIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="parent-hub-heading"
            className="font-heading text-sm font-extrabold text-[#031F82]"
          >
            {copy.title}
          </p>
          <p className="mt-0.5 font-sans text-xs text-[#1E3A5F]">
            {isUnlocked ? copy.unlockedSubtext : copy.lockedSubtext}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wide",
            isUnlocked
              ? "bg-[#22C55E]/15 text-[#15803D]"
              : "bg-[#BDE9FB]/35 text-[#0CC1E0]",
          )}
        >
          {isUnlocked ? copy.unlockedBadge : copy.lockedBadge}
        </span>
      </button>

      <div id="parent-hub-panel" className="space-y-3 p-4 pt-3">
        <ParentHubFeatureItem
          id="parent-hub-points-conversion"
          title={featuresCopy.pointsConversion}
          summary={isUnlocked ? conversionRateLabel : featuresCopy.pointsConversionSummaryLocked}
          isExpanded={isUnlocked && expandedFeature === "pointsConversion"}
          onToggle={() => toggleFeature("pointsConversion")}
        >
          <ParentConversionRatePanel isEditable />
        </ParentHubFeatureItem>

        <ParentHubFeatureItem
          id="parent-hub-learning-track"
          title={featuresCopy.learningTrack}
          summary={isUnlocked ? trackSummary : featuresCopy.learningTrackSummaryLocked}
          isExpanded={isUnlocked && expandedFeature === "learningTrack"}
          onToggle={() => toggleFeature("learningTrack")}
        >
          <ParentLearningTrackPanel isEditable />
        </ParentHubFeatureItem>

        <ParentHubFeatureItem
          id="parent-hub-currency"
          title={featuresCopy.currency}
          summary={
            isUnlocked
              ? `${currency.flag} ${currency.label}`
              : featuresCopy.currencySummaryLocked
          }
          isExpanded={isUnlocked && expandedFeature === "currency"}
          onToggle={() => toggleFeature("currency")}
        >
          <ParentCurrencyPanel isEditable />
        </ParentHubFeatureItem>

        {!isUnlocked ? (
          <button
            type="button"
            onClick={onRequestUnlock}
            className={cn(
              "h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2",
            )}
          >
            {copy.unlockButton}
          </button>
        ) : (
          <button
            type="button"
            onClick={onLock}
            className="w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/40"
          >
            {copy.lockHub}
          </button>
        )}
      </div>
    </section>
  );
}

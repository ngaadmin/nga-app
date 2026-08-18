"use client";

import { useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { ShieldIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";
import { ParentHubFeatureItem } from "@/components/dashboard/settings/parent-hub-feature-item";
import { ParentConversionRatePanel } from "@/components/dashboard/settings/parent-conversion-rate-panel";
import { ParentCurrencyPanel } from "@/components/dashboard/settings/parent-currency-panel";
import {
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { useSettingsParentView, useTestingSettingsView } from "@/lib/dashboard/testing-settings-view";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

type PreferencesFeatureId = "pointsConversion";

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
  const { currencyCode } = useCurrency();
  const { audPer100Xp, xpExchangeRateSet } = useDashboardWallet();
  const session = useUserSession();
  const testingView = useTestingSettingsView();
  const isParentSettingsView = useSettingsParentView();
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);

  const showPointsConversion = isParentSettingsView;
  const showCurrency = true;
  const requiresPin =
    isParentSettingsView &&
    session?.accountRole === "parent_master" &&
    testingView !== "parent";
  const effectivelyUnlocked = !requiresPin || isUnlocked;

  const [expandedFeature, setExpandedFeature] = useState<PreferencesFeatureId | null>(
    null,
  );

  function toggleFeature(id: PreferencesFeatureId) {
    if (!effectivelyUnlocked) {
      onRequestUnlock();
      return;
    }
    setExpandedFeature((current) => (current === id ? null : id));
  }

  if (!showPointsConversion && !showCurrency) {
    return null;
  }

  return (
    <section
      aria-labelledby="preferences-heading"
      className={cn(floatingPanelClass, "overflow-hidden")}
    >
      {requiresPin ? (
        <button
          type="button"
          onClick={isUnlocked ? onLock : onRequestUnlock}
          aria-expanded={isUnlocked}
          aria-controls="preferences-panel"
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
              id="preferences-heading"
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
      ) : (
        <div className="flex items-center gap-3 border-b border-[#BDE9FB]/60 p-4">
          <div className="min-w-0 flex-1">
            <p
              id="preferences-heading"
              className="font-heading text-sm font-extrabold text-[#031F82]"
            >
              {copy.title}
            </p>
            <p className="mt-0.5 font-sans text-xs text-[#1E3A5F]">
              {copy.unlockedSubtext}
            </p>
          </div>
        </div>
      )}

      <div id="preferences-panel" className="space-y-3 p-4 pt-3">
        {showPointsConversion ? (
          <ParentHubFeatureItem
            id="preferences-points-conversion"
            title={featuresCopy.pointsConversion}
            summary={
              effectivelyUnlocked
                ? xpExchangeRateSet
                  ? conversionRateLabel
                  : featuresCopy.pointsConversionNotSet
                : featuresCopy.pointsConversionSummaryLocked
            }
            isExpanded={effectivelyUnlocked && expandedFeature === "pointsConversion"}
            onToggle={() => toggleFeature("pointsConversion")}
          >
            <ParentConversionRatePanel isEditable />
          </ParentHubFeatureItem>
        ) : null}

        {showCurrency ? (
          <div className="rounded-xl border-2 border-[#BDE9FB]/70 bg-[#F7FBFF]/40 px-3 py-3">
            <ParentCurrencyPanel isEditable />
          </div>
        ) : null}

        {requiresPin ? (
          !isUnlocked ? (
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
          )
        ) : null}
      </div>
    </section>
  );
}

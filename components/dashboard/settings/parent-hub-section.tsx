"use client";

import { useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { cn } from "@/lib/utils/cn";
import { ParentHubFeatureItem } from "@/components/dashboard/settings/parent-hub-feature-item";
import { ParentConversionRatePanel } from "@/components/dashboard/settings/parent-conversion-rate-panel";
import { ParentCurrencyPanel } from "@/components/dashboard/settings/parent-currency-panel";
import {
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useSettingsParentView } from "@/lib/dashboard/testing-settings-view";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

type PreferencesFeatureId = "pointsConversion";

export function ParentHubSection() {
  const copy = copyMatrix.dashboard.settings.parentHub;
  const featuresCopy = copyMatrix.dashboard.settings.parentHubFeatures;
  const { currencyCode } = useCurrency();
  const { audPer100Xp, xpExchangeRateSet } = useDashboardWallet();
  const isParentSettingsView = useSettingsParentView();
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);

  const showPointsConversion = isParentSettingsView;
  const showCurrency = true;

  const [expandedFeature, setExpandedFeature] = useState<PreferencesFeatureId | null>(
    null,
  );

  function toggleFeature(id: PreferencesFeatureId) {
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
      <div className="flex items-center gap-3 border-b border-[#BDE9FB]/60 p-4">
        <div className="min-w-0 flex-1">
          <p
            id="preferences-heading"
            className="font-heading text-sm font-extrabold text-[#031F82]"
          >
            {copy.title}
          </p>
          <p className="mt-0.5 font-sans text-sm text-[#1E3A5F]">
            {copy.unlockedSubtext}
          </p>
        </div>
      </div>

      <div id="preferences-panel" className="space-y-3 p-4 pt-3">
        {showPointsConversion ? (
          <ParentHubFeatureItem
            id="preferences-points-conversion"
            title={featuresCopy.pointsConversion}
            summary={
              xpExchangeRateSet
                ? conversionRateLabel
                : featuresCopy.pointsConversionNotSet
            }
            isExpanded={expandedFeature === "pointsConversion"}
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
      </div>
    </section>
  );
}
